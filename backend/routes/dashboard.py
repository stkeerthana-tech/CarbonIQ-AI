"""
routes/dashboard.py
-------------------
Company-level aggregated carbon reporting dashboard.

GET /api/dashboard/<company_id>  – Return totals split by scope

All arithmetic is performed in Python/SQL; no LLM involvement.
"""

import logging
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from database import db
from models import ActivityRecord, EmissionResult, Company

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


# ---------------------------------------------------------------------------
# GET /api/dashboard/<company_id>
# ---------------------------------------------------------------------------

@dashboard_bp.route("/<int:company_id>", methods=["GET"])
@jwt_required()
def get_dashboard(company_id: int):
    """
    Return aggregated emission totals for a company.

    Response:
    {
      "company_id"         : 1,
      "company_name"       : "Acme Ltd",
      "total_co2e_tonnes"  : 25.4,
      "scope_1_tonnes"     : 18.2,
      "scope_2_tonnes"     : 4.1,
      "scope_3_tonnes"     : 3.1,
      "activity_count"     : 20,
      "calculated_count"   : 17,
      "needs_review_count" : 3
    }

    Notes:
      - Only "Calculated" results are included in the totals.
      - "Needs Review" results are counted but excluded from totals
        (adding an unverified number would be scientifically incorrect).
      - Scope matching uses a LIKE query to handle "Scope 1 or Scope 3"
        edge cases in the database.
    """
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify(
            {"success": False, "error": f"Company {company_id} not found."}
        ), 404

    # -----------------------------------------------------------------------
    # Activity counts
    # -----------------------------------------------------------------------
    activity_count = (
        db.session.query(func.count(ActivityRecord.id))
        .filter(ActivityRecord.company_id == company_id)
        .scalar()
        or 0
    )

    # -----------------------------------------------------------------------
    # EmissionResult counts – join through ActivityRecord
    # -----------------------------------------------------------------------
    base_emission_query = (
        db.session.query(EmissionResult)
        .join(ActivityRecord, EmissionResult.activity_id == ActivityRecord.id)
        .filter(ActivityRecord.company_id == company_id)
    )

    calculated_results = base_emission_query.filter(
        EmissionResult.status == "Calculated"
    ).all()

    needs_review_count = base_emission_query.filter(
        EmissionResult.status == "Needs Review"
    ).count()

    calculated_count = len(calculated_results)

    # -----------------------------------------------------------------------
    # Scope totals (sum only Calculated results, in tonnes)
    # -----------------------------------------------------------------------
    def _scope_total(scope_prefix: str) -> float:
        """Sum co2e_tonnes for Calculated results where scope starts with scope_prefix."""
        total = (
            db.session.query(func.sum(EmissionResult.co2e_tonnes))
            .join(ActivityRecord, EmissionResult.activity_id == ActivityRecord.id)
            .filter(
                ActivityRecord.company_id == company_id,
                EmissionResult.status == "Calculated",
                EmissionResult.scope.ilike(f"{scope_prefix}%"),
            )
            .scalar()
        )
        return round(float(total), 4) if total else 0.0

    scope_1_tonnes = _scope_total("Scope 1")
    scope_2_tonnes = _scope_total("Scope 2")
    scope_3_tonnes = _scope_total("Scope 3")
    total_co2e_tonnes = round(scope_1_tonnes + scope_2_tonnes + scope_3_tonnes, 4)

    # -----------------------------------------------------------------------
    # Activity breakdown (for transparency)
    # -----------------------------------------------------------------------
    activity_breakdown = []
    for result in calculated_results:
        ar = db.session.get(ActivityRecord, result.activity_id)
        activity_breakdown.append(
            {
                "activity": ar.activity if ar else None,
                "scope": result.scope,
                "co2e_tonnes": result.co2e_tonnes,
                "date": ar.date.isoformat() if ar and ar.date else None,
            }
        )

    return jsonify(
        {
            "success": True,
            "data": {
                "company_id": company_id,
                "company_name": company.company_name,
                "total_co2e_tonnes": total_co2e_tonnes,
                "scope_1_tonnes": scope_1_tonnes,
                "scope_2_tonnes": scope_2_tonnes,
                "scope_3_tonnes": scope_3_tonnes,
                "activity_count": activity_count,
                "calculated_count": calculated_count,
                "needs_review_count": needs_review_count,
                "activity_breakdown": activity_breakdown,
            },
        }
    ), 200
