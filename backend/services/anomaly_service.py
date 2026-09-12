"""
anomaly_service.py
------------------
Rule-based, explainable anomaly detection for activity quantities.

Design principles:
  - No LLM involvement; purely statistical / rule-based.
  - No anomaly is flagged when there is insufficient historical data
    (fewer than MIN_HISTORY_RECORDS records for the same activity).
  - The detection method and threshold are explicit and documented.

Method:
  Compare the current quantity against the mean of historical quantities
  for the same (company_id, activity) pair.  Flag if the ratio exceeds
  ANOMALY_THRESHOLD (default: 3×).

  This is an MVP-appropriate heuristic.  For production, replace with
  a rolling Z-score or IQR method once sufficient data exists.
"""

import logging

logger = logging.getLogger(__name__)

# Minimum number of existing records before anomaly detection kicks in.
# With fewer records than this the mean is not representative.
MIN_HISTORY_RECORDS = 3

# Flag if current value is more than this many times the historical mean.
ANOMALY_THRESHOLD = 3.0


def detect_anomaly(
    company_id: int,
    activity: str,
    quantity: float,
    exclude_activity_id: int | None = None,
) -> dict:
    """
    Compare `quantity` against historical values for the same
    (company_id, activity) pair stored in the database.

    Parameters
    ----------
    company_id          : Company whose history is used
    activity            : Activity name (must match ActivityRecord.activity)
    quantity            : The new quantity being submitted
    exclude_activity_id : If set, exclude this record ID from history
                          (used when updating a record)

    Returns
    -------
    {
        "is_anomaly"  : bool,
        "message"     : str,   – human-readable explanation
        "ratio"       : float|None,
        "historical_mean" : float|None,
        "record_count"    : int,
    }
    """
    # Import here to avoid circular imports (models → db → app)
    from models import ActivityRecord
    from sqlalchemy import func
    from database import db

    query = db.session.query(
        func.count(ActivityRecord.id).label("cnt"),
        func.avg(ActivityRecord.quantity).label("avg_qty"),
    ).filter(
        ActivityRecord.company_id == company_id,
        ActivityRecord.activity == activity,
    )

    if exclude_activity_id is not None:
        query = query.filter(ActivityRecord.id != exclude_activity_id)

    result = query.one()
    count = result.cnt or 0
    historical_mean = result.avg_qty

    if count < MIN_HISTORY_RECORDS or historical_mean is None or historical_mean == 0:
        return {
            "is_anomaly": False,
            "message": (
                f"Insufficient historical data ({count} record(s)) for anomaly detection. "
                f"At least {MIN_HISTORY_RECORDS} records are required."
            ),
            "ratio": None,
            "historical_mean": historical_mean,
            "record_count": count,
        }

    ratio = quantity / historical_mean

    if ratio >= ANOMALY_THRESHOLD:
        message = (
            f"Anomaly detected: the submitted quantity ({quantity:,.2f}) is "
            f"approximately {ratio:.1f}× the historical mean "
            f"({historical_mean:,.2f}) for '{activity}' "
            f"(based on {count} historical record(s)). "
            "Please verify this value before accepting."
        )
        is_anomaly = True
        logger.warning(message)
    else:
        message = (
            f"No anomaly detected. Quantity ({quantity:,.2f}) is "
            f"{ratio:.2f}× the historical mean ({historical_mean:,.2f})."
        )
        is_anomaly = False

    return {
        "is_anomaly": is_anomaly,
        "message": message,
        "ratio": round(ratio, 2),
        "historical_mean": round(historical_mean, 4),
        "record_count": count,
    }
