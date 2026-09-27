"""
backend/config.py
-----------------
Centralized configuration management for Carboniq AI backend.

Handles environment-specific settings (Development, Production, Testing) with:
  • Safe defaults for local development
  • Strict environment-variable enforcement for production secrets
  • Deterministic SQLite database path resolution
  • Clean secret redaction (no secrets ever exposed in logs or API responses)
  • Python-dotenv integration with graceful fallback
"""

import os
import sys
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path Resolution & .env Loading
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))          # backend/
_PROJECT_ROOT = os.path.dirname(_HERE)                        # project root

# Ensure backend directory is in sys.path
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# Attempt loading .env from backend/ first, then project root
load_dotenv(os.path.join(_HERE, ".env"))
load_dotenv(os.path.join(_PROJECT_ROOT, ".env"))


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def _resolve_sqlite_uri(uri: str | None, base_dir: str = _HERE) -> str:
    """
    Ensure relative SQLite paths are deterministically anchored to the base dir
    (e.g., backend directory), avoiding working-directory dependent file creation.
    """
    if not uri:
        return f"sqlite:///{os.path.abspath(os.path.join(base_dir, 'carboniq.db'))}"

    if uri == "sqlite:///:memory:" or uri.startswith("sqlite:////"):
        return uri

    if uri.startswith("sqlite:///"):
        rel_path = uri[len("sqlite:///"):]
        if not os.path.isabs(rel_path) and rel_path != ":memory:":
            abs_path = os.path.abspath(os.path.join(base_dir, rel_path))
            return f"sqlite:///{abs_path}"

    return uri


def _resolve_csv_path(path_str: str | None, project_root: str = _PROJECT_ROOT) -> str:
    """Resolve emission factor CSV path relative to project root if not absolute."""
    path_val = path_str or "data/emission_factors.csv"
    if os.path.isabs(path_val):
        return path_val
    return os.path.abspath(os.path.join(project_root, path_val))


# ---------------------------------------------------------------------------
# Base Configuration
# ---------------------------------------------------------------------------
class Config:
    """Base configuration shared across all environments."""

    ENV_NAME = "base"
    DEBUG = False
    TESTING = False

    # Security Keys
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-this-for-production-min32chars")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-for-production-min32chars")

    # Database
    DATABASE_URI = os.environ.get("DATABASE_URI", "")
    SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(DATABASE_URI)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Emission Factor Data Path
    EMISSION_FACTORS_CSV = _resolve_csv_path(os.environ.get("EMISSION_FACTORS_CSV"))

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

    # Lyzr AI Service Configuration
    LYZR_API_KEY = os.environ.get("LYZR_API_KEY", "")
    LYZR_AGENT_ID = os.environ.get("LYZR_AGENT_ID", "")
    LYZR_ENDPOINT = os.environ.get("LYZR_ENDPOINT", "https://agent-prod.studio.lyzr.ai/v3/inference/chat/")
    LYZR_TIMEOUT_SECONDS = int(os.environ.get("LYZR_TIMEOUT_SECONDS", "20"))
    LYZR_SYSTEM_USER = "carboniq-backend-agent"

    # Server Port
    PORT = int(os.environ.get("PORT", "5000"))

    @classmethod
    def refresh(cls):
        """Re-read dynamic environment variables at instantiation time."""
        cls.SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-this-for-production-min32chars")
        cls.JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-for-production-min32chars")
        cls.DATABASE_URI = os.environ.get("DATABASE_URI", "")
        cls.SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(cls.DATABASE_URI)
        cls.EMISSION_FACTORS_CSV = _resolve_csv_path(os.environ.get("EMISSION_FACTORS_CSV"))
        cls.CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
        cls.LYZR_API_KEY = os.environ.get("LYZR_API_KEY", "")
        cls.LYZR_AGENT_ID = os.environ.get("LYZR_AGENT_ID", "")
        cls.LYZR_ENDPOINT = os.environ.get("LYZR_ENDPOINT", "https://agent-prod.studio.lyzr.ai/v3/inference/chat/")
        cls.LYZR_TIMEOUT_SECONDS = int(os.environ.get("LYZR_TIMEOUT_SECONDS", "20"))
        cls.PORT = int(os.environ.get("PORT", "5000"))

    @classmethod
    def log_summary(cls):
        """Log non-sensitive operational configuration on startup."""
        is_lyzr_active = bool(cls.LYZR_API_KEY and cls.LYZR_AGENT_ID)
        logger.info(
            f"Configuration initialized: env={cls.ENV_NAME}, "
            f"db_type={'sqlite' if 'sqlite' in cls.SQLALCHEMY_DATABASE_URI else 'other'}, "
            f"lyzr_enabled={is_lyzr_active}, cors='{cls.CORS_ORIGINS}'"
        )


# ---------------------------------------------------------------------------
# Environment-Specific Configurations
# ---------------------------------------------------------------------------
class DevelopmentConfig(Config):
    """Development environment configuration."""
    ENV_NAME = "development"
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"


class ProductionConfig(Config):
    """Production environment configuration with strict validations."""
    ENV_NAME = "production"
    DEBUG = False
    TESTING = False

    @classmethod
    def validate_production(cls):
        """Warn if production is using default development secrets."""
        if cls.SECRET_KEY.startswith("dev-"):
            logger.warning(
                "CRITICAL SECURITY WARNING: Production environment is using default SECRET_KEY! "
                "Set a secure SECRET_KEY in the environment."
            )
        if cls.JWT_SECRET_KEY.startswith("dev-"):
            logger.warning(
                "CRITICAL SECURITY WARNING: Production environment is using default JWT_SECRET_KEY! "
                "Set a secure JWT_SECRET_KEY in the environment."
            )


class TestingConfig(Config):
    """Automated testing environment configuration."""
    ENV_NAME = "testing"
    DEBUG = False
    TESTING = True
    WTF_CSRF_ENABLED = False


# ---------------------------------------------------------------------------
# Configuration Factory
# ---------------------------------------------------------------------------
_CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(env_name: str | None = None) -> type[Config]:
    """
    Retrieve the appropriate Config class based on explicit argument or
    FLASK_ENV / ENV environment variables.
    """
    if not env_name:
        env_name = os.environ.get("FLASK_ENV") or os.environ.get("ENV") or "development"

    config_cls = _CONFIG_MAP.get(env_name.lower().strip(), DevelopmentConfig)
    config_cls.refresh()
    return config_cls
