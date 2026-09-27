"""
backend/tests/test_auth.py
--------------------------
Tests authentication, login, JWT issuance, profile retrieval, and public registration restrictions.
"""

import json


def test_login_success(client, seed_data):
    """Test login with valid credentials returns 200, JWT access token and user info."""
    response = client.post(
        "/api/auth/login",
        json={"email": "company_user@carboniq.ai", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "company_user@carboniq.ai"
    assert data["data"]["user"]["role"] == "company_user"
    assert "password_hash" not in data["data"]["user"]


def test_login_invalid_password(client, seed_data):
    """Test login with incorrect password returns 401."""
    response = client.post(
        "/api/auth/login",
        json={"email": "company_user@carboniq.ai", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert "Invalid email or password" in data["error"]


def test_login_nonexistent_user(client, seed_data):
    """Test login with non-existent email returns 401 without enumeration leak."""
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@carboniq.ai", "password": "Password123!"},
    )
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert "Invalid email or password" in data["error"]


def test_login_missing_fields(client, seed_data):
    """Test login with missing email or password returns 400."""
    response = client.post(
        "/api/auth/login",
        json={"email": "company_user@carboniq.ai"},
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False


def test_auth_me_authenticated(client, seed_data, auth_headers):
    """Test /api/auth/me returns current user profile when authenticated."""
    response = client.get("/api/auth/me", headers=auth_headers["company_user"])
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["email"] == "company_user@carboniq.ai"
    assert data["data"]["role"] == "company_user"


def test_auth_me_unauthenticated(client):
    """Test /api/auth/me returns 401 when no token is supplied."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_public_registration_success(client, seed_data):
    """Test public registration succeeds for company_user role."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Public Registrant",
            "email": "newuser@carboniq.ai",
            "password": "SecurePassword123!",
        },
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["email"] == "newuser@carboniq.ai"
    assert data["data"]["role"] == "company_user"


def test_public_registration_rejects_privileged_roles(client, seed_data):
    """Test public registration rejects attempts to register as admin or auditor."""
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Hacker Attempt",
            "email": "badactor@carboniq.ai",
            "password": "SecurePassword123!",
            "role": "admin",
        },
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "Public registration is only available for Company User" in data["error"]
