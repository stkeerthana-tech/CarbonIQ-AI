"""
factor_service.py
-----------------
Loads emission_factors.csv once at import time and exposes a single lookup
function used by the calculation service.

Rules enforced here:
  - The CSV file is the single source of truth for all emission factors.
  - No factor is ever hard-coded in Python.
  - If a CO2e factor is missing, NA, or empty, the record is flagged
    "Needs Review" — the value is never substituted with 0 or estimated.
  - For "Diesel LDV road travel", scope is ambiguous by design
    ("Scope 1 or Scope 3"). The lookup returns the raw scope string;
    the caller must decide (or also flag "Needs Review").
"""

import os
import logging
import pandas as pd

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Locate the CSV
# ---------------------------------------------------------------------------
# The app is launched from the project root:  python backend/app.py
# The CSV lives at:  <project_root>/data/emission_factors.csv
_HERE = os.path.dirname(os.path.abspath(__file__))          # backend/services/
_BACKEND_DIR = os.path.dirname(_HERE)                        # backend/
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)                # project root

# Allow override via environment variable
_CSV_PATH_ENV = os.environ.get("EMISSION_FACTORS_CSV", "data/emission_factors.csv")

# Support both absolute and relative paths
if os.path.isabs(_CSV_PATH_ENV):
    CSV_PATH = _CSV_PATH_ENV
else:
    CSV_PATH = os.path.join(_PROJECT_ROOT, _CSV_PATH_ENV)


# ---------------------------------------------------------------------------
# Load CSV
# ---------------------------------------------------------------------------

def _load_factors() -> pd.DataFrame:
    """Read the CSV and return a normalised DataFrame."""
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"Emission factors CSV not found at: {CSV_PATH}\n"
            "Ensure the file exists at data/emission_factors.csv relative to the project root."
        )

    df = pd.read_csv(CSV_PATH, skipinitialspace=True)

    # Normalise column names (strip whitespace)
    df.columns = [c.strip() for c in df.columns]

    # Normalise text columns for case-insensitive matching
    df["activity_lower"] = df["activity"].str.strip().str.lower()

    # Replace "NA" strings with actual NaN so pandas isna() works correctly
    df.replace("NA", pd.NA, inplace=True)

    logger.info(f"Loaded {len(df)} emission factors from {CSV_PATH}")
    return df


# Load once at module import
_FACTORS_DF: pd.DataFrame = _load_factors()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_all_activities() -> list[str]:
    """Return the list of supported activity names (for validation / UI)."""
    return _FACTORS_DF["activity"].dropna().tolist()


def lookup_factor(activity: str) -> dict:
    """
    Look up an emission factor by activity name (case-insensitive).

    Returns a dict with the following guaranteed keys:
      found          bool   – True if a row matched
      factor_id      str    – CSV factor_id (or None)
      activity       str    – canonical activity name from CSV
      scope          str    – e.g. "Scope 1", "Scope 2", "Scope 1 or Scope 3"
      unit           str    – e.g. "litre", "kWh"
      co2_factor     float|None
      ch4_factor     float|None
      n2o_factor     float|None
      co2e_factor    float|None  – None if NA/missing
      factor_unit    str
      source         str
      source_year    str|int
      region         str
      notes          str
      has_co2e       bool   – True only when co2e_factor is a valid number
      needs_review   bool   – True when CO2e cannot safely be calculated
      review_reason  str    – Human-readable explanation when needs_review=True
    """
    activity_lower = activity.strip().lower()
    matches = _FACTORS_DF[_FACTORS_DF["activity_lower"] == activity_lower]

    if matches.empty:
        return {
            "found": False,
            "factor_id": None,
            "activity": activity,
            "scope": None,
            "unit": None,
            "co2_factor": None,
            "ch4_factor": None,
            "n2o_factor": None,
            "co2e_factor": None,
            "factor_unit": None,
            "source": None,
            "source_year": None,
            "region": None,
            "notes": None,
            "has_co2e": False,
            "needs_review": True,
            "review_reason": (
                f"Activity '{activity}' is not present in the emission factor database. "
                "Manual verification is required."
            ),
        }

    row = matches.iloc[0]

    def _safe_float(val) -> float | None:
        """Convert to float; return None if NA/missing/non-numeric."""
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            pass
        try:
            return float(val)
        except (TypeError, ValueError):
            return None

    co2e_factor = _safe_float(row.get("co2e_factor"))
    co2_factor = _safe_float(row.get("co2_factor"))
    ch4_factor = _safe_float(row.get("ch4_factor"))
    n2o_factor = _safe_float(row.get("n2o_factor"))

    scope_raw = str(row.get("scope", "")).strip()
    notes_raw = str(row.get("notes", "")).strip()
    factor_unit = str(row.get("factor_unit", "")).strip()
    source = str(row.get("source", "")).strip()
    source_year = row.get("source_year")
    region = str(row.get("region", "")).strip()

    # -----------------------------------------------------------------------
    # Determine whether a deterministic CO2e calculation is possible
    # -----------------------------------------------------------------------
    has_co2e = co2e_factor is not None

    needs_review = False
    review_reason = ""

    if not has_co2e:
        needs_review = True
        if co2_factor is not None:
            review_reason = (
                f"Only a CO2-only factor ({co2_factor} {factor_unit}) is available for "
                f"'{row['activity']}'. Labelling this as CO2e would be scientifically "
                "incorrect. A complete CO2e factor incorporating CH4 and N2O is required "
                "before a verified CO2e value can be reported. Manual review is needed."
            )
        else:
            review_reason = (
                f"No verified CO2e emission factor is available for '{row['activity']}'. "
                "Manual verification is required."
            )

    # Ambiguous scope – ownership context required
    if "scope 1 or scope 3" in scope_raw.lower():
        needs_review = True
        if review_reason:
            review_reason += " "
        review_reason += (
            "Scope is ambiguous: this activity is Scope 1 if the vehicle/asset is "
            "company-owned/controlled, or Scope 3 if third-party. "
            "Please specify ownership to assign the correct scope."
        )

    return {
        "found": True,
        "factor_id": str(row.get("factor_id", "")).strip(),
        "activity": str(row.get("activity", "")).strip(),
        "scope": scope_raw,
        "unit": str(row.get("unit", "")).strip(),
        "co2_factor": co2_factor,
        "ch4_factor": ch4_factor,
        "n2o_factor": n2o_factor,
        "co2e_factor": co2e_factor,
        "factor_unit": factor_unit,
        "source": source,
        "source_year": source_year,
        "region": region,
        "notes": notes_raw,
        "has_co2e": has_co2e,
        "needs_review": needs_review,
        "review_reason": review_reason,
    }


def reload_factors() -> None:
    """Reload the CSV from disk (useful for testing or hot updates)."""
    global _FACTORS_DF
    _FACTORS_DF = _load_factors()
