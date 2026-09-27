"""
backend/tests/test_rbac.py
--------------------------
Tests the Role-Based Access Control (RBAC) matrix for company_user, auditor, and admin.
"""

def test_company_user_rbac_restrictions(client, seed_data, auth_headers):
    """Company user must be blocked from administrative and review management endpoints."""
    headers = auth_headers["company_user"]

    # User management -> 403
    resp = client.get("/api/auth/users", headers=headers)
    assert resp.status_code == 403

    # Role assignment -> 403
    resp = client.post("/api/auth/users/2/role", headers=headers, json={"role": "admin"})
    assert resp.status_code == 403

    # Company creation -> 403
    resp = client.post(
        "/api/companies",
        headers=headers,
        json={"company_name": "Unauthorized Inc", "industry": "Tech", "location": "US"},
    )
    assert resp.status_code == 403


def test_auditor_rbac_permissions_and_restrictions(client, seed_data, auth_headers):
    """Auditor can view activities and review queue, but cannot perform user/company administration."""
    headers = auth_headers["auditor"]

    # Allowed: Activity list -> 200
    resp = client.get("/api/activities?company_id=1", headers=headers)
    assert resp.status_code == 200

    # Allowed: Emission calculation preview -> 200
    resp = client.post(
        "/api/emissions/calculate",
        headers=headers,
        json={"company_id": 1, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
    )
    assert resp.status_code == 200

    # Forbidden: User management -> 403
    resp = client.get("/api/auth/users", headers=headers)
    assert resp.status_code == 403

    # Forbidden: Company creation -> 403
    resp = client.post(
        "/api/companies",
        headers=headers,
        json={"company_name": "Auditor New Corp", "industry": "Tech", "location": "US"},
    )
    assert resp.status_code == 403


def test_admin_rbac_full_access(client, seed_data, auth_headers):
    """Administrator has full access to all endpoints including user and company management."""
    headers = auth_headers["admin"]

    # User management list -> 200
    resp = client.get("/api/auth/users", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["count"] >= 3

    # Company creation -> 201
    resp = client.post(
        "/api/companies",
        headers=headers,
        json={"company_name": "Global Renewable Energy Inc", "industry": "Energy", "location": "US"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["data"]["company_name"] == "Global Renewable Energy Inc"

    # Role assignment -> 200
    resp = client.post("/api/auth/users/1/role", headers=headers, json={"role": "auditor"})
    assert resp.status_code == 200
    assert resp.get_json()["data"]["role"] == "auditor"
