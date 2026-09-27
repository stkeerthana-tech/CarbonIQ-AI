"""
backend/tests/test_activities.py
--------------------------------
Tests activity submission permissions, company isolation, and validation logic.
"""

def test_company_user_cannot_create_activity(client, seed_data, auth_headers):
    """Company user must be rejected with 403 when attempting to submit an activity."""
    resp = client.post(
        "/api/activities",
        headers=auth_headers["company_user"],
        json={
            "company_id": 1,
            "activity": "Diesel combustion",
            "quantity": 100,
            "unit": "litre",
            "date": "2026-09-20",
        },
    )
    assert resp.status_code == 403
    data = resp.get_json()
    assert data["success"] is False
    assert "Company users may not submit activity records directly" in data["error"]


def test_auditor_can_create_activity(client, seed_data, auth_headers):
    """Auditor can successfully submit an activity record."""
    resp = client.post(
        "/api/activities",
        headers=auth_headers["auditor"],
        json={
            "company_id": 1,
            "activity": "Diesel combustion",
            "quantity": 150,
            "unit": "litre",
            "date": "2026-09-20",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["activity"]["activity"] == "Diesel combustion"
    assert data["data"]["emission"]["co2e_kg"] == 408.0  # 150 * 2.72


def test_admin_can_create_activity(client, seed_data, auth_headers):
    """Administrator can successfully submit an activity record."""
    resp = client.post(
        "/api/activities",
        headers=auth_headers["admin"],
        json={
            "company_id": 1,
            "activity": "Diesel combustion",
            "quantity": 200,
            "unit": "litre",
            "date": "2026-09-20",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["emission"]["co2e_kg"] == 544.0  # 200 * 2.72


def test_company_isolation_access_denial(client, seed_data, auth_headers):
    """Users cannot view or submit data for companies they are not assigned to."""
    # User 1 (assigned to Company 1) attempts to read Company 2 activities -> 403
    resp = client.get("/api/activities?company_id=2", headers=auth_headers["company_user"])
    assert resp.status_code == 403

    # Auditor 2 (assigned to Company 2) attempts to submit activity for Company 1 -> 403
    resp = client.post(
        "/api/activities",
        headers=auth_headers["other_auditor"],
        json={
            "company_id": 1,
            "activity": "Diesel combustion",
            "quantity": 100,
            "unit": "litre",
            "date": "2026-09-20",
        },
    )
    assert resp.status_code == 403


def test_activity_validation_errors(client, seed_data, auth_headers):
    """Validation errors for missing or negative fields."""
    headers = auth_headers["auditor"]

    # Missing activity
    resp = client.post(
        "/api/activities",
        headers=headers,
        json={"company_id": 1, "quantity": 100, "unit": "litre", "date": "2026-09-20"},
    )
    assert resp.status_code == 400

    # Negative quantity
    resp = client.post(
        "/api/activities",
        headers=headers,
        json={"company_id": 1, "activity": "Diesel combustion", "quantity": -50, "unit": "litre", "date": "2026-09-20"},
    )
    assert resp.status_code == 400
