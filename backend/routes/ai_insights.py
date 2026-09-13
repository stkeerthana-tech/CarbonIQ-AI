"""
routes/ai_insights.py
---------------------
AI-powered carbon intelligence endpoint.

POST /api/ai/insights
  – Accepts verified dashboard context from the frontend.
  – Calls the Lyzr agent (lyzr_service) to generate a compliance review.
  – Returns the AI text alongside an 'enabled' flag.

Security constraints (strictly enforced):
  • JWT required — same as all other protected routes.
  • Company access validated via require_company_access() before any AI call.
  • The AI agent NEVER recalculates emissions — it receives read-only context
    and returns free-text reasoning only.
  • LYZR_API_KEY is never exposed to the frontend.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from authorization import require_company_access
from services import lyzr_service

logger = logging.getLogger(__name__)

ai_insights_bp = Blueprint("ai_insights", __name__, url_prefix="/api/ai")


# ---------------------------------------------------------------------------
# POST /api/ai/insights
# ---------------------------------------------------------------------------

@ai_insights_bp.route("/insights", methods=["POST"])
@jwt_required()
def get_insights():
    """
    Generate an AI carbon-intelligence review for a company's emission data.

    Request body (JSON):
    {
      "company_id": 1,
      "context": {
        "company_name"       : "Acme Ltd",
        "total_co2e_tonnes"  : 376.765,
        "scope_1_tonnes"     : 100.0,
        "scope_2_tonnes"     : 200.0,
        "scope_3_tonnes"     : 76.765,
        "activity_count"     : 10,
        "calculated_count"   : 8,
        "needs_review_count" : 2,
        "activity_breakdown" : [...]   (optional)
      }
    }

    Response:
    {
      "success": true,
      "data": {
        "insight"    : "...",   (AI-generated text)
        "enabled"    : true,    (false if agent not configured)
        "session_id" : "uuid"
      }
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    company_id = data.get("company_id")
    if company_id is None:
        return jsonify({"success": False, "error": "Field 'company_id' is required."}), 400

    try:
        company_id = int(company_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Field 'company_id' must be an integer."}), 400

    # Enforce company-level access control before any AI processing
    _, error = require_company_access(company_id)
    if error:
        return error

    context = data.get("context")
    if not context or not isinstance(context, dict):
        return jsonify({"success": False, "error": "Field 'context' must be a non-empty object."}), 400

    # Ensure company_id is in the context for the prompt builder
    context.setdefault("company_name", f"Company {company_id}")

    logger.info(
        f"AI insights requested for company_id={company_id}, "
        f"enabled={lyzr_service.is_configured()}"
    )

    result = lyzr_service.chat(context)

    return jsonify({
        "success": True,
        "data": {
            "insight":    result["response"],
            "enabled":    result["enabled"],
            "session_id": result.get("session_id"),
        },
    }), 200
