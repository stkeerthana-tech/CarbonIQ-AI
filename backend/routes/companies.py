"""
routes/companies.py
-------------------
Company management endpoints.

POST /api/companies       – Create a new company (admin or company_user)
GET  /api/companies       – List all companies
GET  /api/companies/<id>  – Get a single company
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from database import db
from models import Company

logger = logging.getLogger(__name__)

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")


@companies_bp.route("", methods=["POST"])
@jwt_required()
def create_company():
    """Create a new company."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    company_name = (data.get("company_name") or "").strip()
    if not company_name:
        return jsonify({"success": False, "error": "Field 'company_name' is required."}), 400

    company = Company(
        company_name=company_name,
        industry=(data.get("industry") or "").strip() or None,
        location=(data.get("location") or "").strip() or None,
    )
    db.session.add(company)
    db.session.commit()

    logger.info(f"Company created: id={company.id}, name={company.company_name}")
    return jsonify({"success": True, "data": company.to_dict()}), 201


@companies_bp.route("", methods=["GET"])
@jwt_required()
def list_companies():
    """List all companies."""
    companies = Company.query.order_by(Company.created_at.desc()).all()
    return jsonify({"success": True, "data": [c.to_dict() for c in companies], "count": len(companies)}), 200


@companies_bp.route("/<int:company_id>", methods=["GET"])
@jwt_required()
def get_company(company_id: int):
    """Get a single company."""
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({"success": False, "error": f"Company {company_id} not found."}), 404
    return jsonify({"success": True, "data": company.to_dict()}), 200
