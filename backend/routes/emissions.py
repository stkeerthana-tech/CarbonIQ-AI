"""
routes/emissions.py
-------------------
Endpoint for on-demand deterministic emission calculations
(without persisting an activity record).

POST /api/emissions/calculate  – Calculate CO2e for supplied activity data

This endpoint is useful for:
  - Quick previews before submitting a formal activity record
  - Integration testing
  - Future Lyzr AI agent calls (the agent sends structured data; this
    endpoint performs the deterministic calculation and returns the result)

IMPORTANT: The LLM/AI layer must never modify the numeric fields returned
by this endpoint (co2e_kg, co2e_tonnes, emission_factor).
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from services.emission_calculator import calculate
from services.factor_service import get_all_activities
from authorization import current_user, require_company_access

logger = logging.getLogger(__name__)

emissions_bp = Blueprint("emissions", __name__, url_prefix="/api/emissions")


# ---------------------------------------------------------------------------
# POST /api/emissions/calculate
# ---------------------------------------------------------------------------

@emissions_bp.route("/calculate", methods=["POST"])
@jwt_required()
def calculate_emission():
    """
    Accept activity data and return a deterministic CO2e calculation.

    Input JSON:
      {
        "activity"       : "Diesel combustion",
        "quantity"       : 2000,
        "unit"           : "litre",
        "date"           : "2026-09-12",
        "scope_override" : "Scope 1"    (optional, for Diesel LDV only)
      }

    Returns the full calculation result including source and methodology.
    No data is persisted by this endpoint.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    activity = (data.get("activity") or "").strip()
    quantity = data.get("quantity")
    unit = (data.get("unit") or "").strip()
    date_str = (data.get("date") or "").strip()
    scope_override = (data.get("scope_override") or "").strip() or None
    company_id = data.get("company_id")

    # --- Validate ---
    if not activity:
        return jsonify({"success": False, "error": "Field 'activity' is required."}), 400

    if quantity is None or quantity == "":
        return jsonify({"success": False, "error": "Field 'quantity' is required."}), 400
    try:
        quantity = float(quantity)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Field 'quantity' must be numeric."}), 400

    if quantity <= 0:
        return jsonify(
            {"success": False, "error": "Field 'quantity' must be greater than zero."}
        ), 400

    if not unit:
        return jsonify({"success": False, "error": "Field 'unit' is required."}), 400

    if not date_str:
        return jsonify(
            {"success": False, "error": "Field 'date' is required (format: YYYY-MM-DD)."}
        ), 400

    user = current_user()
    if user.role != "admin":
        if not company_id:
            return jsonify({"success": False, "error": "Field 'company_id' is required."}), 400
        try:
            company_id = int(company_id)
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": "Field 'company_id' must be a valid integer."}), 400
        _, error = require_company_access(int(company_id))
        if error:
            return error

    # Validate date format
    try:
        from datetime import datetime
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify(
            {"success": False, "error": "Field 'date' must be in YYYY-MM-DD format."}
        ), 400

    # Check activity is in the database
    supported = [a.lower() for a in get_all_activities()]
    if activity.lower() not in supported:
        return jsonify(
            {
                "success": False,
                "error": (
                    f"Activity '{activity}' is not supported. "
                    f"Supported activities: {get_all_activities()}"
                ),
            }
        ), 400

    # --- Deterministic calculation ---
    result = calculate(
        activity=activity,
        quantity=quantity,
        unit=unit,
        date=date_str,
        scope_override=scope_override,
    )

    # Strip internal factor_info dict from public response
    result.pop("factor_info", None)

    return jsonify({"success": True, "data": result}), 200
