"""Backend authorization helpers for company-scoped resources."""

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from database import db
from models import User


def current_user() -> User | None:
    """Return the authenticated user represented by the current JWT."""
    return db.session.get(User, int(get_jwt_identity()))


def can_access_company(user: User, company_id: int) -> bool:
    """Administrators are global; other roles require an explicit assignment."""
    return user.role == "admin" or any(company.id == company_id for company in user.companies)


def require_company_access(company_id: int):
    """Return the current user or a JSON error for an unauthorized company."""
    user = current_user()
    if not user:
        return None, (jsonify({"success": False, "error": "User not found."}), 401)
    if not can_access_company(user, company_id):
        return None, (
            jsonify({"success": False, "error": "You are not authorized to access this company."}),
            403,
        )
    return user, None


def accessible_company_ids(user: User) -> list[int] | None:
    """Return assigned company IDs, or None for an administrator."""
    if user.role == "admin":
        return None
    return [company.id for company in user.companies]