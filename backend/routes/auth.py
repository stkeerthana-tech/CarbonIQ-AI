"""
routes/auth.py
--------------
JWT authentication endpoints.

POST /api/auth/register  – Create a new user account
POST /api/auth/login     – Obtain a JWT access token
GET  /api/auth/me        – Return the current authenticated user's profile

Security:
  - Passwords are hashed with Werkzeug (pbkdf2:sha256 + salt); never stored plain.
  - JWT_SECRET_KEY is loaded from the environment variable; never hard-coded.
  - Passwords and password hashes are never returned in API responses.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from database import db
from models import User

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

ALLOWED_ROLES = {"admin", "company_user", "auditor"}


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

@auth_bp.route("/register", methods=["POST"])
def register():
    """Create a new user account."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    # --- Validate required fields ---
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    role = (data.get("role") or "company_user").strip().lower()

    if not name:
        return jsonify({"success": False, "error": "Field 'name' is required."}), 400
    if not email:
        return jsonify({"success": False, "error": "Field 'email' is required."}), 400
    if not password or len(password) < 8:
        return jsonify(
            {"success": False, "error": "Field 'password' must be at least 8 characters."}
        ), 400
    if role not in ALLOWED_ROLES:
        return jsonify(
            {
                "success": False,
                "error": f"Invalid role '{role}'. Allowed values: {sorted(ALLOWED_ROLES)}",
            }
        ), 400

    # --- Check for existing email ---
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    # --- Create user ---
    user = User(name=name, email=email, role=role)
    user.set_password(password)       # hashes the password; never stored plain

    db.session.add(user)
    db.session.commit()

    logger.info(f"New user registered: {email} (role={role})")

    return jsonify({"success": True, "data": user.to_dict()}), 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate and return a JWT access token."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()

    # Use identical response for wrong email or wrong password (prevents enumeration)
    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    # JWT identity stores the user's id as a string
    access_token = create_access_token(identity=str(user.id))

    logger.info(f"User logged in: {email}")

    return jsonify(
        {
            "success": True,
            "data": {
                "access_token": access_token,
                "token_type": "Bearer",
                "user": user.to_dict(),
            },
        }
    ), 200


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the authenticated user's profile (no password hash)."""
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"success": False, "error": "User not found."}), 404

    return jsonify({"success": True, "data": user.to_dict()}), 200
