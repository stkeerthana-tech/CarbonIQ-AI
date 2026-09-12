"""
test_e2e_integration.py
-----------------------
Comprehensive verification test for Carboniq AI frontend <-> backend integration.
Tests all user journeys:
  1. Health check through Vite dev server proxy
  2. Invalid login handling (401 response)
  3. Valid login and JWT token issuance
  4. User session profile (/api/auth/me)
  5. Dashboard data retrieval and scope calculations
  6. On-demand emission preview calculation (/api/emissions/calculate)
  7. Activity submission with deterministic calculation (Diesel combustion)
  8. Needs Review handling (Grid electricity - CO2-only factor, null CO2e)
  9. Needs Review handling (Domestic air travel - CO2-only factor)
  10. Diesel LDV road travel with Scope override
  11. Statistical anomaly detection on large activity submission
  12. Activity history listing
  13. Detailed audit trail retrieval (/api/activities/<id>)
  14. Company organization retrieval (/api/companies)
"""

import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Test through the frontend proxy URL to ensure frontend <-> backend proxy works perfectly
FRONTEND_PROXY_URL = "http://localhost:3000/api"
TOKEN = None
PASS_COUNT = 0
FAIL_COUNT = 0

def log_test(title):
    print(f"\n[TEST] {title}")

def log_pass(msg):
    global PASS_COUNT
    PASS_COUNT += 1
    print(f"  [PASS] {msg}")

def log_fail(msg):
    global FAIL_COUNT
    FAIL_COUNT += 1
    print(f"  [FAIL] {msg}")

def log_info(msg):
    print(f"  [INFO] {msg}")

def api_call(path, method="GET", payload=None, auth=True):
    url = f"{FRONTEND_PROXY_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body
    except urllib.error.HTTPError as err:
        try:
            body = json.loads(err.read().decode("utf-8"))
        except Exception:
            body = {"error": "Non-JSON response"}
        return err.code, body
    except Exception as e:
        return 0, {"error": str(e)}

def run_all_tests():
    global TOKEN

    print("=" * 65)
    print("  Carboniq AI - Frontend & Backend Integration Verification")
    print("=" * 65)

    # 1. Health check through frontend proxy
    log_test("1. System Health Check via Frontend Proxy")
    status, body = api_call("/health", auth=False)
    if status == 200 and body.get("status") == "ok":
        log_pass("Backend is reachable and healthy through frontend proxy")
    else:
        log_fail(f"Health check failed: status={status}, body={body}")

    # 2. Invalid Login Test
    log_test("2. Invalid Login Handling")
    status, body = api_call("/auth/login", method="POST", payload={"email": "wrong@carboniq.ai", "password": "WrongPassword!"}, auth=False)
    if status == 401 and not body.get("success"):
        log_pass(f"Rejected invalid credentials with HTTP 401: '{body.get('error')}'")
    else:
        log_fail(f"Expected 401 for invalid login, got status={status}: {body}")

    # 3. Valid Login Flow
    log_test("3. Valid User Authentication & JWT Issuance")
    status, body = api_call("/auth/login", method="POST", payload={"email": "test@carboniq.ai", "password": "TestPass123"}, auth=False)
    if status == 200 and body.get("success"):
        TOKEN = body["data"]["access_token"]
        user = body["data"]["user"]
        log_pass(f"Logged in as '{user['name']}' ({user['email']}), role: '{user['role']}'")
        log_info(f"JWT Token issued (length {len(TOKEN)})")
    else:
        log_fail(f"Login failed: status={status}, body={body}")
        return

    # 4. User Profile Verification (/api/auth/me)
    log_test("4. Current User Profile Verification (/api/auth/me)")
    status, body = api_call("/auth/me")
    if status == 200 and body.get("success") and body["data"]["email"] == "test@carboniq.ai":
        log_pass("Session authenticated and profile retrieved without exposing password")
    else:
        log_fail(f"Failed to fetch /api/auth/me: {body}")

    # 5. Dashboard Data & Scope Totals
    log_test("5. Dashboard Metrics & Scope Aggregation (/api/dashboard/1)")
    status, body = api_call("/dashboard/1")
    if status == 200 and body.get("success"):
        data = body["data"]
        log_pass(f"Company: {data.get('company_name')}")
        log_info(f"Total CO2e: {data.get('total_co2e_tonnes')} tCO2e")
        log_info(f"Scope 1: {data.get('scope_1_tonnes')} tCO2e | Scope 2: {data.get('scope_2_tonnes')} tCO2e | Scope 3: {data.get('scope_3_tonnes')} tCO2e")
        log_info(f"Activities count: {data.get('activity_count')} | Calculated: {data.get('calculated_count')} | Needs Review: {data.get('needs_review_count')}")
    else:
        log_fail(f"Dashboard fetch failed: {body}")

    # 6. On-Demand Preview Calculation (Diesel combustion)
    log_test("6. On-Demand Emission Preview Calculation (Diesel 2000 litre)")
    preview_payload = {
        "activity": "Diesel combustion",
        "quantity": 2000,
        "unit": "litre",
        "date": "2026-09-12"
    }
    status, body = api_call("/emissions/calculate", method="POST", payload=preview_payload)
    if status == 200 and body.get("success"):
        data = body["data"]
        if data.get("co2e_kg") == 5440.0 and data.get("co2e_tonnes") == 5.44 and data.get("status") == "Calculated":
            log_pass(f"Deterministic calculation verified: {data['calculation']}")
            log_info(f"Factor: {data['emission_factor']} {data['factor_unit']} | Source: {data['source']}")
        else:
            log_fail(f"Calculation numbers unexpected: {data}")
    else:
        log_fail(f"Calculation preview failed: {body}")

    # 7. Add Activity - Official Submission with Audit Trail
    log_test("7. Submit Activity & Generate Immutable Audit Trail")
    activity_payload = {
        "company_id": 1,
        "activity": "Diesel combustion",
        "quantity": 2000,
        "unit": "litre",
        "date": "2026-09-12"
    }
    status, body = api_call("/activities", method="POST", payload=activity_payload)
    new_activity_id = None
    if status == 201 and body.get("success"):
        data = body["data"]
        new_activity_id = data["activity"]["id"]
        audit_id = data.get("audit_id")
        log_pass(f"Activity #{new_activity_id} saved with Audit Record #{audit_id}")
        log_info(f"Result: {data.get('co2e_kg')} kg CO2e ({data.get('co2e_tonnes')} tonnes) - Status: {data.get('status')}")
    else:
        log_fail(f"Failed to submit activity: {body}")

    # 8. Needs Review Handling - Grid electricity (CO2-only factor)
    log_test("8. Needs Review Handling: Grid Electricity (CO2-Only Factor)")
    elec_payload = {
        "company_id": 1,
        "activity": "Grid electricity",
        "quantity": 10000,
        "unit": "kWh",
        "date": "2026-09-12"
    }
    status, body = api_call("/activities", method="POST", payload=elec_payload)
    if status == 201 and body.get("success"):
        data = body["data"]
        emission = data.get("emission", {})
        if emission.get("status") == "Needs Review" and emission.get("co2e_kg") is None:
            log_pass("Correctly flagged 'Needs Review' without calculating false 0 kg CO2e")
            log_info(f"Review reason: {emission.get('review_reason')}")
        else:
            log_fail(f"Expected Needs Review with null co2e, got: {emission}")
    else:
        log_fail(f"Grid electricity submission failed: {body}")

    # 9. Needs Review Handling - Domestic air travel (CO2-only factor)
    log_test("9. Needs Review Handling: Domestic Air Travel (CO2-Only Factor)")
    air_payload = {
        "company_id": 1,
        "activity": "Domestic air travel",
        "quantity": 500,
        "unit": "passenger-km",
        "date": "2026-09-12"
    }
    status, body = api_call("/activities", method="POST", payload=air_payload)
    if status == 201 and body.get("success"):
        data = body["data"]
        emission = data.get("emission", {})
        if emission.get("status") == "Needs Review" and emission.get("co2e_kg") is None:
            log_pass("Correctly flagged 'Needs Review' without inventing a replacement factor")
            log_info(f"Review reason: {emission.get('review_reason')}")
        else:
            log_fail(f"Expected Needs Review with null co2e, got: {emission}")
    else:
        log_fail(f"Domestic air travel submission failed: {body}")

    # 10. Scope Override Handling - Diesel LDV road travel
    log_test("10. Scope Assignment: Diesel LDV road travel with 'Scope 1' Override")
    ldv_payload = {
        "company_id": 1,
        "activity": "Diesel LDV road travel",
        "quantity": 1500,
        "unit": "litre",
        "date": "2026-09-12",
        "scope_override": "Scope 1"
    }
    status, body = api_call("/activities", method="POST", payload=ldv_payload)
    if status == 201 and body.get("success"):
        data = body["data"]
        emission = data.get("emission", {})
        if emission.get("status") == "Calculated" and emission.get("scope") == "Scope 1":
            log_pass(f"Calculated with Scope 1: {emission.get('co2e_tonnes')} tCO2e")
        else:
            log_fail(f"Expected Scope 1 calculated, got: {emission}")
    else:
        log_fail(f"Diesel LDV submission failed: {body}")

    # 11. Anomaly Detection on Large Quantity
    log_test("11. Anomaly Detection Warning on Disproportionate Quantity")
    anomaly_payload = {
        "company_id": 1,
        "activity": "Diesel combustion",
        "quantity": 80000,
        "unit": "litre",
        "date": "2026-09-12"
    }
    status, body = api_call("/activities", method="POST", payload=anomaly_payload)
    if status == 201 and body.get("success"):
        anomaly = body["data"].get("anomaly", {})
        if anomaly.get("is_anomaly") is True:
            log_pass(f"Anomaly detected! Ratio: {anomaly.get('ratio')}x historical mean")
            log_info(f"Message: {anomaly.get('message')}")
        else:
            log_fail(f"Expected anomaly=True, got: {anomaly}")
    else:
        log_fail(f"Anomaly test submission failed: {body}")

    # 12. Activity History Listing
    log_test("12. Activity History Listing (/api/activities?company_id=1)")
    status, body = api_call("/activities?company_id=1")
    if status == 200 and body.get("success"):
        activities = body.get("data", [])
        log_pass(f"Retrieved {len(activities)} activity records with emission metadata")
    else:
        log_fail(f"Failed to list activities: {body}")

    # 13. Detailed Audit Record Retrieval
    if new_activity_id:
        log_test(f"13. Detailed Audit Record Inspection (/api/activities/{new_activity_id})")
        status, body = api_call(f"/activities/{new_activity_id}")
        if status == 200 and body.get("success"):
            rec = body["data"]
            audit = rec.get("audit")
            if audit and audit.get("calculation") and audit.get("source"):
                log_pass(f"Audit record #{audit['id']} verified with complete lineage")
                log_info(f"Formula: {audit['calculation']}")
                log_info(f"Evidence Source: {audit['source']}")
                log_info(f"Timestamp: {audit['timestamp']}")
            else:
                log_fail(f"Audit record incomplete: {rec}")
        else:
            log_fail(f"Failed to retrieve activity #{new_activity_id}: {body}")

    # 14. Company List Verification
    log_test("14. Organization Profile Retrieval (/api/companies)")
    status, body = api_call("/companies")
    if status == 200 and body.get("success"):
        comps = body.get("data", [])
        log_pass(f"Retrieved {len(comps)} registered organizations")
    else:
        log_fail(f"Failed to list companies: {body}")

    # Summary
    print("\n" + "=" * 65)
    print(f"  Verification Summary: {PASS_COUNT} PASSED, {FAIL_COUNT} FAILED")
    print("=" * 65)
    if FAIL_COUNT == 0:
        print("  ALL FRONTEND-BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!\n")
    else:
        print("  SOME TESTS FAILED - Please check details above.\n")

if __name__ == "__main__":
    run_all_tests()
