"""
database.py
-----------
SQLAlchemy database instance shared across the application.
Import `db` from here anywhere you need database access.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    """Bind the SQLAlchemy instance to the Flask app and create all tables."""
    db.init_app(app)
    import models  # noqa: F401 - Register ORM models before table creation
    with app.app_context():
        db.create_all()
