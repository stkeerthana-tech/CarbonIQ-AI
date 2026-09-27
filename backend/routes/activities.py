"""
routes/activities.py
--------------------
Endpoints for submitting and retrieving business activity records.

POST /api/activities         – Submit a new activity; triggers calculation + audit
GET  /api/activities         – List activities (optionally filtered by company_id)
GET  /api/activities/<id>    – Get a single activity with its emission result

All write endpoints require JWT authentication.
"""

import json
import logging
from datetime import date as date_type, datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from database import db
from models import ActivityRecord, EmissionResult, AuditRecord
from services.emission_calculator import calculate, build_audit_data
from services.factor_service import get_all_activities
from services.anomaly_service import detect_anomaly
from authorization import accessible_company_ids, current_user, require_company_access

logger = logging.getLogger(__name__)

activities_bp = Blueprint("activities", __name__, url_prefix="/api/activities")


def _record_anomaly(record: ActivityRecord) -> dict:
    """Compute the backend anomaly flag against the other stored records."""
    return detect_anomaly(
        record.company_id,
        record.activity,
        record.quantity,
        exclude_activity_id=record.id,
    )


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _parse_date(date_str: str):
    """Parse ISO date string YYYY-MM-DD. Return date object or raise ValueError."""
    from datetime import datetime
    return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()


def _validate_activity_input(data: dict) -> tuple[dict | None, str | None]:
    """
    Validate and extract activity fields from request JSON.
    Returns (clean_data, error_message).
    """
    if not data:
        return None, "Request body must be JSON."

    company_id = data.get("company_id")
    activity = (data.get("activity") or "").strip()
    quantity = data.get("quantity")
    unit = (data.get("unit") or "").strip()
    date_str = (data.get("date") or "").strip()
    scope_override = (data.get("scope_override") or "").strip() or None

    if not company_id:
        return None, "Field 'company_id' is required."
    try:
        company_id = int(company_id)
    except (TypeError, ValueError):
        return None, "Field 'company_id' must be a valid integer."
    if not activity:
        return None, "Field 'activity' is required."
    if quantity is None or quantity == "":
        return None, "Field 'quantity' is required."

    try:
        quantity = float(quantity)
    except (TypeError, ValueError):
        return None, "Field 'quantity' must be a numeric value."

    if quantity <= 0:
        return None, "Field 'quantity' must be a positive number greater than zero."
    if not unit:
        return None, "Field 'unit' is required."
    if not date_str:
        return None, "Field 'date' is required (format: YYYY-MM-DD)."

    try:
        parsed_date = _parse_date(date_str)
    except ValueError:
        return None, "Field 'date' must be in YYYY-MM-DD format (e.g. 2026-09-12)."

    # Check that activity exists in emission factor database
    supported = [a.lower() for a in get_all_activities()]
    if activity.lower() not in supported:
        return None, (
            f"Activity '{activity}' is not supported. "
            f"Supported activities: {get_all_activities()}"
        )

    return {
        "company_id": company_id,
        "activity": activity,
        "quantity": quantity,
        "unit": unit,
        "date": parsed_date,
        "date_str": date_str,
        "scope_override": scope_override,
    }, None


# ---------------------------------------------------------------------------
# POST /api/activities
# ---------------------------------------------------------------------------

@activities_bp.route("", methods=["POST"])
@jwt_required()
def create_activity():
    """
    Submit a business activity.

    1. Validate input
    2. Run anomaly detection against historical data
    3. Save ActivityRecord
    4. Run deterministic emission calculation
    5. Save EmissionResult
    6. Save AuditRecord
    7. Return full result
    """
    user = current_user()
    if user.role not in ("admin", "auditor"):
        return jsonify({"success": False, "error": "Company users may not submit activity records directly. Please contact an auditor."}), 403

    data = request.get_json(silent=True)
    clean, error = _validate_activity_input(data)
    if error:
        return jsonify({"success": False, "error": error}), 400

    company_id = clean["company_id"]
    _, error = require_company_access(company_id)
    if error:
        return error
    activity = clean["activity"]
    quantity = clean["quantity"]
    unit = clean["unit"]
    parsed_date = clean["date"]
    date_str = clean["date_str"]
    scope_override = clean["scope_override"]

    # -----------------------------------------------------------------------
    # Anomaly detection (before saving so we still have the complete history)
    # -----------------------------------------------------------------------
    anomaly = detect_anomaly(company_id, activity, quantity)

    # -----------------------------------------------------------------------
    # Save ActivityRecord
    # -----------------------------------------------------------------------
    activity_record = ActivityRecord(
        company_id=company_id,
        activity=activity,
        quantity=quantity,
        unit=unit,
        date=parsed_date,
    )
    db.session.add(activity_record)
    db.session.flush()   # Get ID before commit

    # -----------------------------------------------------------------------
    # Deterministic emission calculation
    # -----------------------------------------------------------------------
    calc_result = calculate(
        activity=activity,
        quantity=quantity,
        unit=unit,
        date=date_str,
        company_id=company_id,
        scope_override=scope_override,
    )

    factor_info = calc_result.get("factor_info", {})

    # -----------------------------------------------------------------------
    # Save EmissionResult
    # -----------------------------------------------------------------------
    emission_result = EmissionResult(
        activity_id=activity_record.id,
        factor_id=factor_info.get("factor_id"),
        scope=calc_result.get("scope"),
        co2e_kg=calc_result.get("co2e_kg"),
        co2e_tonnes=calc_result.get("co2e_tonnes"),
        status=calc_result.get("status", "Needs Review"),
        calculation=calc_result.get("calculation"),
        source=calc_result.get("source"),
        methodology=calc_result.get("methodology"),
        review_reason=calc_result.get("review_reason", ""),
    )
    db.session.add(emission_result)
    db.session.flush()

    # -----------------------------------------------------------------------
    # Save AuditRecord (immutable trail)
    # -----------------------------------------------------------------------
    audit_data_str = build_audit_data(activity, quantity, unit, date_str, company_id)

    audit_record = AuditRecord(
        emission_id=emission_result.id,
        activity_data=audit_data_str,
        factor_id=factor_info.get("factor_id"),
        factor_value=factor_info.get("co2e_factor"),
        calculation=calc_result.get("calculation"),
        source=calc_result.get("source"),
        methodology=calc_result.get("methodology"),
        status=calc_result.get("status"),
        review_reason=calc_result.get("review_reason", ""),
    )
    db.session.add(audit_record)
    db.session.commit()

    logger.info(
        f"Activity submitted: id={activity_record.id}, "
        f"activity={activity}, status={emission_result.status}"
    )

    response_data = {
        **{k: v for k, v in calc_result.items() if k not in ("factor_info", "activity", "quantity", "unit")},
        "activity": activity_record.to_dict(),
        "emission": emission_result.to_dict(),
        "audit_id": audit_record.id,
        "anomaly": anomaly,
    }

    return jsonify({"success": True, "data": response_data}), 201


# ---------------------------------------------------------------------------
# GET /api/activities
# ---------------------------------------------------------------------------

@activities_bp.route("", methods=["GET"])
@jwt_required()
def list_activities():
    """List activity records.  Filter by ?company_id=<id> if provided."""
    company_id = request.args.get("company_id", type=int)
    user_company_ids = accessible_company_ids(current_user())

    if company_id is not None:
        _, error = require_company_access(company_id)
        if error:
            return error
    elif user_company_ids is not None and not user_company_ids:
        return jsonify({"success": True, "data": [], "count": 0}), 200

    query = ActivityRecord.query
    if company_id:
        query = query.filter_by(company_id=company_id)
    elif user_company_ids is not None:
        query = query.filter(ActivityRecord.company_id.in_(user_company_ids))

    records = query.order_by(ActivityRecord.created_at.desc()).all()

    result = []
    for rec in records:
        item = rec.to_dict()
        item["anomaly"] = _record_anomaly(rec)
        if rec.emission_result:
            item["emission"] = rec.emission_result.to_dict()
        result.append(item)

    return jsonify({"success": True, "data": result, "count": len(result)}), 200


# ---------------------------------------------------------------------------
# GET /api/activities/<id>
# ---------------------------------------------------------------------------

@activities_bp.route("/<int:activity_id>", methods=["GET"])
@jwt_required()
def get_activity(activity_id: int):
    """Return a single activity record with its emission result and audit trail."""
    record = db.session.get(ActivityRecord, activity_id)
    if not record:
        return jsonify({"success": False, "error": f"Activity {activity_id} not found."}), 404

    _, error = require_company_access(record.company_id)
    if error:
        return error

    data = record.to_dict()
    data["anomaly"] = _record_anomaly(record)

    if record.emission_result:
        data["emission"] = record.emission_result.to_dict()
        if record.emission_result.audit_record:
            data["audit"] = record.emission_result.audit_record.to_dict()
        if record.emission_result.audit_records:
            data["audit_trail"] = [ar.to_dict() for ar in record.emission_result.audit_records]

    return jsonify({"success": True, "data": data}), 200


# ---------------------------------------------------------------------------
# POST /api/activities/<id>/resolve
# ---------------------------------------------------------------------------

@activities_bp.route("/<int:activity_id>/resolve", methods=["POST"])
@jwt_required()
def resolve_activity(activity_id: int):
    """
    Resolve an activity review record (Auditor / Admin only).

    Persists the auditor decision and justification notes into an immutable AuditRecord event
    without overwriting the original deterministic emission calculation.
    """
    user = current_user()
    if not user or user.role not in ("admin", "auditor"):
        return jsonify({
            "success": False,
            "error": "Only authorized auditors and administrators may resolve activity reviews.",
        }), 403

    activity = db.session.get(ActivityRecord, activity_id)
    if not activity:
        return jsonify({"success": False, "error": f"Activity {activity_id} not found."}), 404

    _, error = require_company_access(activity.company_id)
    if error:
        return error

    emission = activity.emission_result
    if not emission:
        return jsonify({"success": False, "error": "No emission calculation result found for this activity."}), 400

    data = request.get_json(silent=True) or {}
    decision = (data.get("decision") or "").strip()
    resolution_notes = (data.get("resolution_notes") or "").strip()

    ALLOWED_DECISIONS = {"Reviewed - Valid", "Reviewed - Issue"}
    if decision not in ALLOWED_DECISIONS:
        return jsonify({
            "success": False,
            "error": f"Invalid decision '{decision}'. Allowed decisions: {sorted(list(ALLOWED_DECISIONS))}",
        }), 400

    if not resolution_notes:
        return jsonify({
            "success": False,
            "error": "Field 'resolution_notes' is required and cannot be empty.",
        }), 400

    if len(resolution_notes) > 2000:
        return jsonify({
            "success": False,
            "error": "Resolution notes cannot exceed 2000 characters.",
        }), 400

    # Build resolution audit payload
    original_status = emission.status
    original_review_reason = emission.review_reason or ""

    resolution_data = {
        "event": "review_resolution",
        "activity_id": activity.id,
        "company_id": activity.company_id,
        "activity": activity.activity,
        "quantity": activity.quantity,
        "unit": activity.unit,
        "date": activity.date.isoformat() if activity.date else None,
        "decision": decision,
        "resolution_notes": resolution_notes,
        "reviewer_id": user.id,
        "reviewer_name": user.name,
        "reviewer_email": user.email,
        "reviewer_role": user.role,
        "original_status": original_status,
        "original_review_reason": original_review_reason,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
    }

    # Update emission status to reflect verified/issue decision
    emission.status = decision

    # Retrieve initial factor value if present
    initial_factor_value = None
    if emission.audit_record:
        initial_factor_value = emission.audit_record.factor_value

    # Append immutable resolution AuditRecord
    resolution_audit_record = AuditRecord(
        emission_id=emission.id,
        activity_data=json.dumps(resolution_data, indent=2),
        factor_id=emission.factor_id,
        factor_value=initial_factor_value,
        calculation=emission.calculation,
        source=emission.source,
        methodology=emission.methodology,
        status=decision,
        review_reason=resolution_notes,
        timestamp=datetime.now(timezone.utc),
    )
    db.session.add(resolution_audit_record)
    db.session.commit()

    logger.info(
        f"Activity {activity_id} resolved by user {user.id} ({user.role}): "
        f"decision='{decision}'"
    )

    response_data = {
        "activity": activity.to_dict(),
        "emission": emission.to_dict(),
        "resolution": resolution_audit_record.to_dict(),
        "resolution_event": resolution_data,
    }

    return jsonify({"success": True, "data": response_data}), 200
