"""
app.py
------
Carboniq AI – Autonomous Carbon Intelligence & Verification Agent
Flask application entry point.

Run from the project root:
    python backend/app.py

Architecture note:
    AI/LLM layer (future Lyzr)  →  understand / classify / explain
    This backend               →  validate / retrieve factor / calculate / audit

The LLM must NEVER perform the final carbon calculation.
The `services/emission_calculator.py` module is the single source of truth
for all numerical results.
"""

import os
import sys
import logging

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Path setup
# ---------------------------------------------------------------------------
# Allow imports to work whether launched as:
#   python backend/app.py       (from project root)
#   python app.py               (from inside backend/)
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# Load .env from the backend directory (if present)
load_dotenv(os.path.join(_HERE, ".env"))
# Also try the project root
load_dotenv(os.path.join(os.path.dirname(_HERE), ".env"))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> Flask:
    app = Flask(__name__)

    # -----------------------------------------------------------------------
    # Configuration
    # -----------------------------------------------------------------------
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-this")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-this")

    # Resolve relative SQLite paths from the backend directory, not Flask's
    # instance directory or whichever directory launched the process.
    default_db = f"sqlite:///{os.path.join(_HERE, 'carboniq.db')}"
    database_uri = os.environ.get("DATABASE_URI", default_db)
    if database_uri.startswith("sqlite:///") and not database_uri.startswith("sqlite:////"):
        database_path = database_uri[len("sqlite:///"):]
        if not os.path.isabs(database_path):
            database_uri = f"sqlite:///{os.path.abspath(os.path.join(_HERE, database_path))}"
    app.config["SQLALCHEMY_DATABASE_URI"] = database_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if app.config["SECRET_KEY"].startswith("dev-"):
        logger.warning(
            "Using development SECRET_KEY. Set SECRET_KEY in backend/.env for production."
        )
    if app.config["JWT_SECRET_KEY"].startswith("dev-"):
        logger.warning(
            "Using development JWT_SECRET_KEY. Set JWT_SECRET_KEY in backend/.env for production."
        )

    # -----------------------------------------------------------------------
    # Extensions
    # -----------------------------------------------------------------------
    from database import init_db
    init_db(app)

    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # -----------------------------------------------------------------------
    # Register blueprints
    # -----------------------------------------------------------------------
    from routes.auth import auth_bp
    from routes.activities import activities_bp
    from routes.emissions import emissions_bp
    from routes.dashboard import dashboard_bp
    from routes.companies import companies_bp
    from routes.ai_insights import ai_insights_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(emissions_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(ai_insights_bp)

    # -----------------------------------------------------------------------
    # Health check
    # -----------------------------------------------------------------------
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "Carboniq AI backend"}), 200

    # -----------------------------------------------------------------------
    # Supported activities (convenience endpoint for frontend)
    # -----------------------------------------------------------------------
    @app.route("/api/activities/supported", methods=["GET"])
    def supported_activities():
        from services.factor_service import get_all_activities
        return jsonify({"success": True, "data": get_all_activities()}), 200

    # -----------------------------------------------------------------------
    # Global error handlers (never expose stack traces to API users)
    # -----------------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": "Bad request."}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"success": False, "error": "Unauthorized. Please log in."}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"success": False, "error": "Forbidden."}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Resource not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method not allowed."}), 405

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("Internal server error")
        return jsonify({"success": False, "error": "Internal server error."}), 500

    logger.info("Carboniq AI backend initialised successfully.")
    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    logger.info(f"Starting Carboniq AI backend on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
