"""
backend/tests/test_emissions.py
-------------------------------
Tests deterministic emission calculations, review triggers (CO2-only factors, ambiguous scope),
and historical anomaly detection.
"""

def test_diesel_combustion_calculation(client, seed_data, auth_headers):
    """Test deterministic calculation for diesel combustion (Scope 1)."""
    resp = client.post(
        "/api/emissions/calculate",
        headers=auth_headers["company_user"],
        json={"company_id": 1, "activity": "Diesel combustion", "quantity": 2000, "unit": "litre", "date": "2026-09-20"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["status"] == "Calculated"
    assert data["co2e_kg"] == 5440.0
    assert data["co2e_tonnes"] == 5.44
    assert data["scope"] == "Scope 1"


def test_natural_gas_calculation(client, seed_data, auth_headers):
    """Test deterministic calculation for natural gas combustion."""
    resp = client.post(
        "/api/emissions/calculate",
        headers=auth_headers["company_user"],
        json={"company_id": 1, "activity": "Natural gas combustion", "quantity": 100, "unit": "SCM", "date": "2026-09-20"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["status"] == "Calculated"
    assert data["co2e_kg"] == 215.6
    assert data["co2e_tonnes"] == 0.2156


def test_grid_electricity_needs_review_due_to_co2_only(client, seed_data, auth_headers):
    """Grid electricity has only a CO2 factor; calculating CO2e directly must trigger Needs Review."""
    resp = client.post(
        "/api/emissions/calculate",
        headers=auth_headers["company_user"],
        json={"company_id": 1, "activity": "Grid electricity", "quantity": 10000, "unit": "kWh", "date": "2026-09-20"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["status"] == "Needs Review"
    assert data["co2e_kg"] is None
    assert "Only a CO2-only factor" in data["review_reason"]


def test_air_travel_needs_review(client, seed_data, auth_headers):
    """Domestic air travel with CO2-only factor triggers Needs Review."""
    resp = client.post(
        "/api/emissions/calculate",
        headers=auth_headers["company_user"],
        json={"company_id": 1, "activity": "Domestic air travel", "quantity": 500, "unit": "passenger-km", "date": "2026-09-20"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["status"] == "Needs Review"
    assert data["co2e_kg"] is None


def test_ambiguous_scope_needs_review(client, seed_data, auth_headers):
    """Activities with ambiguous scope (Scope 1 or Scope 3) trigger Needs Review."""
    resp = client.post(
        "/api/emissions/calculate",
        headers=auth_headers["company_user"],
        json={"company_id": 1, "activity": "Diesel LDV road travel", "quantity": 100, "unit": "km", "date": "2026-09-20"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["status"] == "Needs Review"
    assert "Scope is ambiguous" in data["review_reason"]


def test_anomaly_detection_flags_outliers(client, seed_data, auth_headers):
    """Submitting a quantity far exceeding historical baseline triggers anomaly warning."""
    headers = auth_headers["auditor"]

    # Submit 3 normal records for company 1
    for i in range(3):
        client.post(
            "/api/activities",
            headers=headers,
            json={"company_id": 1, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": f"2026-09-0{i+1}"},
        )

    # Submit extreme outlier (50,000 litres vs ~100 litres mean)
    resp = client.post(
        "/api/activities",
        headers=headers,
        json={"company_id": 1, "activity": "Diesel combustion", "quantity": 50000, "unit": "litre", "date": "2026-09-25"},
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["anomaly"]["is_anomaly"] is True
    assert "Anomaly detected" in data["anomaly"]["message"]
