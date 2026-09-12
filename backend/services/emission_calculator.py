"""
emission_calculator.py
----------------------
Performs ALL arithmetic for CO2e calculations deterministically.

CORE PRINCIPLE:
  - AI/LLM  →  understand, classify, explain
  - This module  →  validate, retrieve factor, calculate, audit

The LLM layer MUST NOT modify or substitute the numeric result produced here.

Formula:
  co2e_kg    = quantity × co2e_factor      (factor in kg CO2e per unit)
  co2e_tonnes = co2e_kg / 1000

Future Lyzr AI integration:
  The `calculate` function is the clean service boundary.  A Lyzr agent can
  call this function with structured activity data.  It must never modify the
  returned `co2e_kg` or `co2e_tonnes` fields.
"""

import json
import logging
from datetime import datetime, timezone

from services.factor_service import lookup_factor

logger = logging.getLogger(__name__)


def calculate(
    activity: str,
    quantity: float,
    unit: str,
    date: str,
    company_id: int | None = None,
    scope_override: str | None = None,
) -> dict:
    """
    Perform a deterministic CO2e calculation for a single activity.

    Parameters
    ----------
    activity      : Activity name matching a row in emission_factors.csv
    quantity      : Amount of the activity (must be positive)
    unit          : Unit of the quantity (e.g. "litre", "kWh")
    date          : ISO date string "YYYY-MM-DD"
    company_id    : Optional; used for audit trail context
    scope_override: Optional scope string when the user explicitly declares
                    vehicle ownership for "Diesel LDV road travel"

    Returns
    -------
    dict with keys:
      status, activity, quantity, unit, scope, emission_factor,
      factor_unit, co2e_kg, co2e_tonnes, calculation, source,
      methodology, review_reason, factor_info
    """

    # ------------------------------------------------------------------
    # 1. Look up the emission factor from CSV (the one and only source)
    # ------------------------------------------------------------------
    factor_info = lookup_factor(activity)

    # ------------------------------------------------------------------
    # 2. Build base response skeleton
    # ------------------------------------------------------------------
    response = {
        "status": None,
        "activity": activity,
        "quantity": quantity,
        "unit": unit,
        "scope": factor_info.get("scope"),
        "emission_factor": factor_info.get("co2e_factor"),
        "factor_unit": factor_info.get("factor_unit"),
        "co2e_kg": None,
        "co2e_tonnes": None,
        "calculation": None,
        "source": factor_info.get("source"),
        "methodology": None,
        "review_reason": factor_info.get("review_reason", ""),
        "factor_info": factor_info,
    }

    # ------------------------------------------------------------------
    # 3. Activity not found in CSV
    # ------------------------------------------------------------------
    if not factor_info["found"]:
        response["status"] = "Needs Review"
        response["methodology"] = "No matching emission factor found in database."
        return response

    # ------------------------------------------------------------------
    # 4. Handle scope ambiguity for Diesel LDV
    # ------------------------------------------------------------------
    scope_raw = factor_info.get("scope", "")
    if "scope 1 or scope 3" in scope_raw.lower():
        if scope_override and scope_override.lower() in ("scope 1", "scope 3"):
            # User explicitly declared ownership
            response["scope"] = scope_override.title()
            # Remove scope ambiguity from review_reason if CO2e is available
            if factor_info["has_co2e"]:
                # Only scope was ambiguous – now resolved
                response["review_reason"] = ""
                factor_info["needs_review"] = False
        else:
            # Scope is still ambiguous
            response["status"] = "Needs Review"
            response["methodology"] = (
                "IPCC-based CO2e factor available, but scope cannot be assigned "
                "without knowing vehicle ownership (Scope 1 or Scope 3)."
            )
            return response

    # ------------------------------------------------------------------
    # 5. No valid CO2e factor → Needs Review
    # ------------------------------------------------------------------
    if not factor_info["has_co2e"]:
        response["status"] = "Needs Review"
        response["methodology"] = (
            "CO2-only factor available. Cannot report as CO2e without verified "
            "CH4 and N2O factors."
        )
        return response

    # ------------------------------------------------------------------
    # 6. Deterministic calculation  ← NO LLM involvement here
    # ------------------------------------------------------------------
    co2e_factor = factor_info["co2e_factor"]         # from CSV
    co2e_kg = round(quantity * co2e_factor, 4)
    co2e_tonnes = round(co2e_kg / 1000, 6)

    factor_unit = factor_info.get("factor_unit", "")
    source = factor_info.get("source", "")
    notes = factor_info.get("notes", "")

    calculation_str = (
        f"{quantity} {unit} × {co2e_factor} {factor_unit} "
        f"= {co2e_kg} kg CO2e"
    )

    methodology = (
        f"IPCC-based CO2e factor from '{source}'. "
        f"Notes: {notes}"
    )

    response.update(
        {
            "status": "Calculated",
            "emission_factor": co2e_factor,
            "co2e_kg": co2e_kg,
            "co2e_tonnes": co2e_tonnes,
            "calculation": calculation_str,
            "methodology": methodology,
            "review_reason": "",
        }
    )

    logger.info(
        f"Calculated: {activity} | {quantity} {unit} "
        f"→ {co2e_kg} kg CO2e ({co2e_tonnes} tonnes)"
    )

    return response


def build_audit_data(
    activity: str,
    quantity: float,
    unit: str,
    date: str,
    company_id: int | None,
) -> str:
    """Return a JSON string describing the activity input for the audit trail."""
    return json.dumps(
        {
            "activity": activity,
            "quantity": quantity,
            "unit": unit,
            "date": date,
            "company_id": company_id,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        },
        indent=2,
    )
