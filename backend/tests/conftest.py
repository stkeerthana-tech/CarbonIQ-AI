"""
backend/tests/conftest.py
-------------------------
Pytest configuration and fixtures for Carbonix AI test suite.
Guarantees tests run against an isolated SQLite test database and never
mutate the real carboniq.db or demo accounts.
"""

import os
import sys
import json
import pytest
from datetime import date
from flask_jwt_extended import create_access_token

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app import create_app
from database import db
from models import User, Company, ActivityRecord, EmissionResult, AuditRecord


import tempfile

@pytest.fixture(scope="session")
def test_db_path():
    """Create a unique temporary database file for the test session."""
    fd, path = tempfile.mkstemp(suffix=".db", prefix="carboniq_test_")
    os.close(fd)
    yield path
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


@pytest.fixture(scope="session")
def app(test_db_path):
    """Create and configure a Flask application for testing."""
    os.environ["DATABASE_URI"] = f"sqlite:///{test_db_path}"
    os.environ["JWT_SECRET_KEY"] = "super-secret-jwt-key-for-pytest-32chars-strictly"
    os.environ["SECRET_KEY"] = "super-secret-app-key-for-pytest-32chars-strictly"

    test_app = create_app()
    test_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{test_db_path}",
        "JWT_SECRET_KEY": "super-secret-jwt-key-for-pytest-32chars-strictly",
        "SECRET_KEY": "super-secret-app-key-for-pytest-32chars-strictly",
        "WTF_CSRF_ENABLED": False,
    })

    yield test_app


@pytest.fixture(scope="function")
def db_session(app):
    """Create fresh database tables for each test function and teardown cleanly."""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app, db_session):
    """Create a Flask test client."""
    return app.test_client()


@pytest.fixture(scope="function")
def seed_data(app, db_session):
    """
    Seed isolated test companies, users, activities, and emissions.
    Never touches production or development databases.
    """
    with app.app_context():
        # 1. Companies
        c1 = Company(id=1, company_name="Acme Carbon Solutions", industry="Manufacturing", location="US")
        c2 = Company(id=2, company_name="Beta Logistics Corp", industry="Logistics", location="EU")
        db.session.add_all([c1, c2])
        db.session.flush()

        # 2. Users
        # Company User (Company 1)
        cu = User(id=1, name="Alice User", email="company_user@carboniq.ai", role="company_user")
        cu.set_password("Password123!")
        cu.companies.append(c1)

        # Auditor (Company 1)
        auditor = User(id=2, name="George Auditor", email="auditor@carboniq.ai", role="auditor")
        auditor.set_password("Password123!")
        auditor.companies.append(c1)

        # Administrator (Global / Company 1)
        admin = User(id=3, name="Keerthana Admin", email="admin@carboniq.ai", role="admin")
        admin.set_password("Password123!")
        admin.companies.append(c1)

        # Other Company User (Company 2 only)
        other_cu = User(id=4, name="Bob Other", email="other_user@carboniq.ai", role="company_user")
        other_cu.set_password("Password123!")
        other_cu.companies.append(c2)

        # Other Auditor (Company 2 only)
        other_auditor = User(id=5, name="Dave Other Auditor", email="other_auditor@carboniq.ai", role="auditor")
        other_auditor.set_password("Password123!")
        other_auditor.companies.append(c2)

        db.session.add_all([cu, auditor, admin, other_cu, other_auditor])
        db.session.flush()

        # 3. Activity Records & Emission Results for Company 1
        # Activity 1: Calculated diesel
        act1 = ActivityRecord(
            id=1,
            company_id=c1.id,
            activity="Diesel combustion",
            quantity=100.0,
            unit="litre",
            date=date(2026, 9, 1),
        )
        db.session.add(act1)
        db.session.flush()

        em1 = EmissionResult(
            id=1,
            activity_id=act1.id,
            factor_id="EF-001",
            scope="Scope 1",
            co2e_kg=272.0,
            co2e_tonnes=0.272,
            status="Calculated",
            calculation="100.0 litre × 2.72 kg CO2e/litre = 272.0 kg CO2e (0.272 tonnes)",
            source="DEFRA 2023",
            methodology="GHG Protocol Corporate Standard (Scope 1 - Direct Emissions)",
        )
        db.session.add(em1)
        db.session.flush()

        audit1 = AuditRecord(
            id=1,
            emission_id=em1.id,
            activity_data=json.dumps({"activity": "Diesel combustion", "quantity": 100.0, "unit": "litre"}),
            factor_id="EF-001",
            factor_value=2.72,
            calculation="100.0 litre × 2.72 kg CO2e/litre = 272.0 kg CO2e (0.272 tonnes)",
            source="DEFRA 2023",
            methodology="GHG Protocol Corporate Standard (Scope 1 - Direct Emissions)",
            status="Calculated",
            review_reason="",
        )
        db.session.add(audit1)

        # Activity 2: Needs Review (CO2-only factor for Grid electricity)
        act2 = ActivityRecord(
            id=2,
            company_id=c1.id,
            activity="Grid electricity",
            quantity=500.0,
            unit="kWh",
            date=date(2026, 9, 2),
        )
        db.session.add(act2)
        db.session.flush()

        em2 = EmissionResult(
            id=2,
            activity_id=act2.id,
            factor_id="EF-003",
            scope="Scope 2",
            co2e_kg=None,
            co2e_tonnes=None,
            status="Needs Review",
            calculation=None,
            source="CEA CO2 Baseline Database 2023",
            methodology="GHG Protocol Scope 2 Guidance (Location-Based Method)",
            review_reason="Only a CO2-only factor (0.82 kg CO2/kWh) is available for 'Grid electricity'. Labelling this as CO2e would be scientifically incorrect. A complete CO2e factor incorporating CH4 and N2O is required before a verified CO2e value can be reported. Manual review is needed.",
        )
        db.session.add(em2)
        db.session.flush()

        audit2 = AuditRecord(
            id=2,
            emission_id=em2.id,
            activity_data=json.dumps({"activity": "Grid electricity", "quantity": 500.0, "unit": "kWh"}),
            factor_id="EF-003",
            factor_value=None,
            calculation=None,
            source="CEA CO2 Baseline Database 2023",
            methodology="GHG Protocol Scope 2 Guidance (Location-Based Method)",
            status="Needs Review",
            review_reason=em2.review_reason,
        )
        db.session.add(audit2)

        # 4. Activity Record for Company 2 (Needs Review for cross-tenant tests)
        act3 = ActivityRecord(
            id=3,
            company_id=c2.id,
            activity="Grid electricity",
            quantity=1000.0,
            unit="kWh",
            date=date(2026, 9, 3),
        )
        db.session.add(act3)
        db.session.flush()

        em3 = EmissionResult(
            id=3,
            activity_id=act3.id,
            factor_id="EF-003",
            scope="Scope 2",
            status="Needs Review",
            review_reason="Only a CO2-only factor available",
        )
        db.session.add(em3)
        db.session.flush()

        audit3 = AuditRecord(
            id=3,
            emission_id=em3.id,
            activity_data=json.dumps({"activity": "Grid electricity", "quantity": 1000.0, "unit": "kWh"}),
            factor_id="EF-003",
            factor_value=None,
            status="Needs Review",
            review_reason="Only a CO2-only factor available",
        )
        db.session.add(audit3)

        user_ids = {
            "company_user": cu.id,
            "auditor": auditor.id,
            "admin": admin.id,
            "other_user": other_cu.id,
            "other_auditor": other_auditor.id,
        }

        activity_ids = {
            "act1": act1.id,
            "act2": act2.id,
            "act3": act3.id,
        }

        company_ids = {
            "c1": c1.id,
            "c2": c2.id,
        }

        db.session.commit()

        return {
            "user_ids": user_ids,
            "activity_ids": activity_ids,
            "company_ids": company_ids,
            "companies": {"c1": c1, "c2": c2},
            "users": {
                "company_user": cu,
                "auditor": auditor,
                "admin": admin,
                "other_user": other_cu,
                "other_auditor": other_auditor,
            },
            "activities": {"act1": act1, "act2": act2, "act3": act3},
            "emissions": {"em1": em1, "em2": em2, "em3": em3},
            "audits": {"audit1": audit1, "audit2": audit2, "audit3": audit3},
        }


@pytest.fixture
def auth_tokens(app, seed_data):
    """Generate JWT tokens for all test users using resolved primitive user IDs."""
    with app.app_context():
        user_ids = seed_data["user_ids"]
        return {
            "company_user": create_access_token(identity=str(user_ids["company_user"])),
            "auditor": create_access_token(identity=str(user_ids["auditor"])),
            "admin": create_access_token(identity=str(user_ids["admin"])),
            "other_user": create_access_token(identity=str(user_ids["other_user"])),
            "other_auditor": create_access_token(identity=str(user_ids["other_auditor"])),
        }


@pytest.fixture
def auth_headers(auth_tokens):
    """Provide authorization headers for all test roles."""
    return {
        role: {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        for role, token in auth_tokens.items()
    }
