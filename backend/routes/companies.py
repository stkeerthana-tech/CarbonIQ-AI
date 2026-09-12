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
from sqlalchemy import func

from database import db
from models import Company, User
from authorization import accessible_company_ids, current_user, require_company_access

logger = logging.getLogger(__name__)

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")


@companies_bp.route("", methods=["POST"])
@jwt_required()
def create_company():
    """Create a new company. Only administrators may create organizations."""
    user = current_user()
    if not user or user.role != "admin":
        return jsonify({"success": False, "error": "Only administrators may create companies."}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    company_name = (data.get("company_name") or "").strip()
    if not company_name:
        return jsonify({"success": False, "error": "Field 'company_name' is required."}), 400

    duplicate = Company.query.filter(
        func.lower(Company.company_name) == company_name.lower()
    ).first()
    if duplicate:
        return jsonify(
            {"success": False, "error": "A company with this name already exists."}
        ), 409

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
    """List all companies for admins, or only assigned companies otherwise."""
    user = current_user()
    if not user:
        return jsonify({"success": False, "error": "User not found."}), 401
    query = Company.query
    company_ids = accessible_company_ids(user)
    if company_ids is not None:
        if not company_ids:
            return jsonify({"success": True, "data": [], "count": 0}), 200
        query = query.filter(Company.id.in_(company_ids))
    companies = query.order_by(Company.created_at.desc()).all()
    return jsonify({"success": True, "data": [c.to_dict() for c in companies], "count": len(companies)}), 200


@companies_bp.route("/<int:company_id>", methods=["GET"])
@jwt_required()
def get_company(company_id: int):
    """Get a single company."""
    _, error = require_company_access(company_id)
    if error:
        return error
    company = db.session.get(Company, company_id)
    if not company:
        return jsonify({"success": False, "error": f"Company {company_id} not found."}), 404
    return jsonify({"success": True, "data": company.to_dict()}), 200


@companies_bp.route("/<int:company_id>/members/<int:user_id>", methods=["POST"])
@jwt_required()
def assign_member(company_id: int, user_id: int):
    """Assign a company user or auditor to a company; admin-only."""
    actor = current_user()
    if not actor or actor.role != "admin":
        return jsonify({"success": False, "error": "Only administrators may assign company access."}), 403

    company = db.session.get(Company, company_id)
    user = db.session.get(User, user_id)
    if not company or not user:
        return jsonify({"success": False, "error": "Company or user not found."}), 404
    if user.role == "admin":
        return jsonify({"success": False, "error": "Administrators do not need company assignment."}), 400
    if user.role == "company_user" and user.companies and company not in user.companies:
        return jsonify({"success": False, "error": "A Company User may only be assigned one company."}), 409
    if company not in user.companies:
        user.companies.append(company)
        db.session.commit()
    return jsonify({"success": True, "data": {"user_id": user.id, "company_id": company.id}}), 200
