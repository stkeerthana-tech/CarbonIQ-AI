"""
models.py
---------
SQLAlchemy ORM models for the Carboniq AI backend.

Tables:
  - User           : Authentication and role management
  - Company        : Organisation that submits activity data
  - ActivityRecord : Raw business activity (e.g. litres of diesel burned)
  - EmissionResult : Calculated (or flagged) CO2e output linked to an activity
  - AuditRecord    : Immutable audit trail (activity → factor → calculation → result)
"""

from datetime import datetime, timezone
from database import db
from werkzeug.security import generate_password_hash, check_password_hash


user_company_assignments = db.Table(
    "user_company_assignments",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    db.Column("company_id", db.Integer, db.ForeignKey("companies.id"), primary_key=True),
)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum("admin", "company_user", "auditor", name="user_roles"),
        nullable=False,
        default="company_user",
    )
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    companies = db.relationship(
        "Company",
        secondary=user_company_assignments,
        back_populates="users",
        lazy="selectin",
    )

    def set_password(self, plain_text_password: str) -> None:
        """Hash and store a password.  Never stores plain text."""
        self.password_hash = generate_password_hash(plain_text_password)

    def check_password(self, plain_text_password: str) -> bool:
        """Return True if the supplied password matches the stored hash."""
        return check_password_hash(self.password_hash, plain_text_password)

    def to_dict(self) -> dict:
        """Safe serialisation – password hash is excluded."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------------

class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(120), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    activities = db.relationship("ActivityRecord", backref="company", lazy=True)
    users = db.relationship(
        "User",
        secondary=user_company_assignments,
        back_populates="companies",
        lazy="selectin",
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_name": self.company_name,
            "industry": self.industry,
            "location": self.location,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# ActivityRecord
# ---------------------------------------------------------------------------

class ActivityRecord(db.Model):
    __tablename__ = "activity_records"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    activity = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # One activity produces at most one emission result
    emission_result = db.relationship(
        "EmissionResult", backref="activity_record", uselist=False, lazy=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "activity": self.activity,
            "quantity": self.quantity,
            "unit": self.unit,
            "date": self.date.isoformat() if self.date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# EmissionResult
# ---------------------------------------------------------------------------

class EmissionResult(db.Model):
    __tablename__ = "emission_results"

    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(
        db.Integer, db.ForeignKey("activity_records.id"), nullable=False
    )
    factor_id = db.Column(db.String(100), nullable=True)   # CSV factor_id
    scope = db.Column(db.String(50), nullable=True)
    co2e_kg = db.Column(db.Float, nullable=True)
    co2e_tonnes = db.Column(db.Float, nullable=True)

    # "Calculated" | "Needs Review"
    status = db.Column(db.String(50), nullable=False, default="Needs Review")

    calculation = db.Column(db.Text, nullable=True)         # Human-readable formula
    source = db.Column(db.Text, nullable=True)
    methodology = db.Column(db.Text, nullable=True)
    review_reason = db.Column(db.Text, nullable=True)       # Why review is needed
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    audit_record = db.relationship(
        "AuditRecord", backref="emission_result", uselist=False, lazy=True
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "activity_id": self.activity_id,
            "factor_id": self.factor_id,
            "scope": self.scope,
            "co2e_kg": self.co2e_kg,
            "co2e_tonnes": self.co2e_tonnes,
            "status": self.status,
            "calculation": self.calculation,
            "source": self.source,
            "methodology": self.methodology,
            "review_reason": self.review_reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# AuditRecord
# ---------------------------------------------------------------------------

class AuditRecord(db.Model):
    """
    Immutable audit trail.

    Every calculation (successful or Needs Review) must produce one AuditRecord
    so that the path  Activity → Factor → Calculation → Result → Source
    can always be reconstructed.
    """

    __tablename__ = "audit_records"

    id = db.Column(db.Integer, primary_key=True)
    emission_id = db.Column(
        db.Integer, db.ForeignKey("emission_results.id"), nullable=False
    )
    activity_data = db.Column(db.Text, nullable=False)   # JSON-serialised activity
    factor_id = db.Column(db.String(100), nullable=True)
    factor_value = db.Column(db.Float, nullable=True)    # Numeric factor used
    calculation = db.Column(db.Text, nullable=True)
    source = db.Column(db.Text, nullable=True)
    methodology = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=True)
    review_reason = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "emission_id": self.emission_id,
            "activity_data": self.activity_data,
            "factor_id": self.factor_id,
            "factor_value": self.factor_value,
            "calculation": self.calculation,
            "source": self.source,
            "methodology": self.methodology,
            "status": self.status,
            "review_reason": self.review_reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
