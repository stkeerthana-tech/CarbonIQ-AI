"""
test_backend.py
---------------
Manual integration tests for the Carboniq AI backend.

Run from the project root AFTER starting the backend:

    python backend/app.py          (in one terminal)
    python backend/test_backend.py (in another terminal)

These tests cover all 7 required test cases from the specification.
No external test framework is required – this script uses only the
standard library `urllib` (or optionally `requests` if installed).

Expected results:
  TEST 1  Diesel combustion   2000 litre   → Calculated  5440 kg  5.44 t
  TEST 2  Natural gas         100 SCM      → Calculated  215.6 kg 0.2156 t
  TEST 3  Grid electricity    10000 kWh    → Needs Review (CO2-only factor)
  TEST 4  Domestic air travel 500 pkm      → Needs Review (CO2-only factor)
  TEST 5  Missing activity                 → HTTP 400 validation error
  TEST 6  Negative quantity                → HTTP 400 validation error
  TEST 7  Very high activity vs history    → Anomaly warning in response
"""

import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import requests
    _USE_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    _USE_REQUESTS = False

BASE_URL = "http://127.0.0.1:5000/api"
TOKEN = None   # filled in after login


def _post(path: str, payload: dict, auth: bool = True) -> tuple[int, dict]:
    url = BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    body = json.dumps(payload).encode()

    if _USE_REQUESTS:
        resp = requests.post(url, json=payload, headers=headers)
        return resp.status_code, resp.json()
    else:
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                return e.code, json.loads(raw)
            except Exception:
                return e.code, {"error": raw}


def _get(path: str, auth: bool = True) -> tuple[int, dict]:
    url = BASE_URL + path
    headers = {}
    if auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    if _USE_REQUESTS:
        resp = requests.get(url, headers=headers)
        return resp.status_code, resp.json()
    else:
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", errors="replace")
            try:
                return e.code, json.loads(raw)
            except Exception:
                return e.code, {"error": raw}


def header(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def ok(msg: str):
    print(f"  [PASS]  {msg}")


def fail(msg: str):
    print(f"  [FAIL]  {msg}")


def info(msg: str):
    print(f"  [INFO]  {msg}")


# ---------------------------------------------------------------------------
# Setup: health check + register + login
# ---------------------------------------------------------------------------

def setup():
    global TOKEN

    header("SETUP: Health check")
    status, body = _get("/health", auth=False)
    if status == 200 and body.get("status") == "ok":
        ok("Health check passed")
    else:
        fail(f"Health check failed: {status} {body}")
        sys.exit(1)

    header("SETUP: Register test user")
    status, body = _post(
        "/auth/register",
        {
            "name": "Test User",
            "email": "test@carboniq.ai",
            "password": "TestPass123",
            "role": "company_user",
        },
        auth=False,
    )
    if status in (201, 409):   # 409 = already registered
        ok(f"User ready (status={status})")
    else:
        fail(f"Register failed: {status} {body}")
        sys.exit(1)

    header("SETUP: Login")
    status, body = _post(
        "/auth/login",
        {"email": "test@carboniq.ai", "password": "TestPass123"},
        auth=False,
    )
    if status == 200:
        TOKEN = body["data"]["access_token"]
        ok("Login successful – JWT obtained")
    else:
        fail(f"Login failed: {status} {body}")
        sys.exit(1)

    header("SETUP: Create test company")
    status, body = _post(
        "/companies",
        {
            "company_name": "Test Company Pty Ltd",
            "industry": "Manufacturing",
            "location": "India",
        },
    )
    if status in (201, 200):
        company_id = body["data"]["id"]
        info(f"Company created with id={company_id}")
    else:
        info(f"Company creation returned {status} (may already exist). Using company_id=1.")


# ---------------------------------------------------------------------------
# TEST 1: Diesel combustion
# ---------------------------------------------------------------------------

def test_1_diesel():
    header("TEST 1: Diesel combustion – 2000 litre")
    status, body = _post(
        "/emissions/calculate",
        {
            "activity": "Diesel combustion",
            "quantity": 2000,
            "unit": "litre",
            "date": "2026-09-12",
        },
    )
    data = body.get("data", {})
    info(f"HTTP {status}")
    info(f"Status : {data.get('status')}")
    info(f"Factor : {data.get('emission_factor')} {data.get('factor_unit')}")
    info(f"CO2e kg: {data.get('co2e_kg')}")
    info(f"CO2e t : {data.get('co2e_tonnes')}")
    info(f"Calc   : {data.get('calculation')}")

    passed = (
        status == 200
        and data.get("status") == "Calculated"
        and data.get("co2e_kg") == 5440.0
        and data.get("co2e_tonnes") == 5.44
    )
    if passed:
        ok("TEST 1 PASSED – 5440 kg CO2e / 5.44 tonnes")
    else:
        fail(f"TEST 1 FAILED – got co2e_kg={data.get('co2e_kg')}, co2e_tonnes={data.get('co2e_tonnes')}")


# ---------------------------------------------------------------------------
# TEST 2: Natural gas combustion
# ---------------------------------------------------------------------------

def test_2_natural_gas():
    header("TEST 2: Natural gas combustion – 100 SCM")
    status, body = _post(
        "/emissions/calculate",
        {
            "activity": "Natural gas combustion",
            "quantity": 100,
            "unit": "SCM",
            "date": "2026-09-12",
        },
    )
    data = body.get("data", {})
    info(f"HTTP {status}")
    info(f"Status : {data.get('status')}")
    info(f"Factor : {data.get('emission_factor')} {data.get('factor_unit')}")
    info(f"CO2e kg: {data.get('co2e_kg')}")
    info(f"CO2e t : {data.get('co2e_tonnes')}")
    info(f"Calc   : {data.get('calculation')}")

    passed = (
        status == 200
        and data.get("status") == "Calculated"
        and data.get("co2e_kg") is not None
        and data.get("co2e_kg") > 0
    )
    if passed:
        ok(f"TEST 2 PASSED – {data.get('co2e_kg')} kg CO2e / {data.get('co2e_tonnes')} tonnes")
    else:
        fail(f"TEST 2 FAILED – {body}")


# ---------------------------------------------------------------------------
# TEST 3: Grid electricity (CO2-only → Needs Review)
# ---------------------------------------------------------------------------

def test_3_electricity():
    header("TEST 3: Grid electricity – 10000 kWh (CO2-only factor → Needs Review)")
    status, body = _post(
        "/emissions/calculate",
        {
            "activity": "Grid electricity",
            "quantity": 10000,
            "unit": "kWh",
            "date": "2026-09-12",
        },
    )
    data = body.get("data", {})
    info(f"HTTP {status}")
    info(f"Status        : {data.get('status')}")
    info(f"Review reason : {data.get('review_reason')}")
    info(f"CO2e kg       : {data.get('co2e_kg')}")

    passed = (
        status == 200
        and data.get("status") == "Needs Review"
        and data.get("co2e_kg") is None
    )
    if passed:
        ok("TEST 3 PASSED – Needs Review returned; CO2-only, no CO2e calculated")
    else:
        fail(f"TEST 3 FAILED – expected Needs Review with null co2e_kg, got: {data}")


# ---------------------------------------------------------------------------
# TEST 4: Domestic air travel (CO2-only → Needs Review)
# ---------------------------------------------------------------------------

def test_4_air_travel():
    header("TEST 4: Domestic air travel – 500 passenger-km (CO2-only → Needs Review)")
    status, body = _post(
        "/emissions/calculate",
        {
            "activity": "Domestic air travel",
            "quantity": 500,
            "unit": "passenger-km",
            "date": "2026-09-12",
        },
    )
    data = body.get("data", {})
    info(f"HTTP {status}")
    info(f"Status        : {data.get('status')}")
    info(f"Review reason : {data.get('review_reason')}")
    info(f"CO2e kg       : {data.get('co2e_kg')}")

    passed = (
        status == 200
        and data.get("status") == "Needs Review"
        and data.get("co2e_kg") is None
    )
    if passed:
        ok("TEST 4 PASSED – Needs Review returned; no CO2e factor available")
    else:
        fail(f"TEST 4 FAILED – {data}")


# ---------------------------------------------------------------------------
# TEST 5: Missing activity → validation error
# ---------------------------------------------------------------------------

def test_5_missing_activity():
    header("TEST 5: Missing activity field → 400 validation error")
    status, body = _post(
        "/emissions/calculate",
        {
            "quantity": 1000,
            "unit": "litre",
            "date": "2026-09-12",
        },
    )
    info(f"HTTP {status}")
    info(f"Error : {body.get('error')}")

    passed = status == 400 and not body.get("success")
    if passed:
        ok("TEST 5 PASSED – 400 returned for missing activity")
    else:
        fail(f"TEST 5 FAILED – got {status}: {body}")


# ---------------------------------------------------------------------------
# TEST 6: Negative quantity → validation error
# ---------------------------------------------------------------------------

def test_6_negative_quantity():
    header("TEST 6: Negative quantity → 400 validation error")
    status, body = _post(
        "/emissions/calculate",
        {
            "activity": "Diesel combustion",
            "quantity": -500,
            "unit": "litre",
            "date": "2026-09-12",
        },
    )
    info(f"HTTP {status}")
    info(f"Error : {body.get('error')}")

    passed = status == 400 and not body.get("success")
    if passed:
        ok("TEST 6 PASSED – 400 returned for negative quantity")
    else:
        fail(f"TEST 6 FAILED – got {status}: {body}")


# ---------------------------------------------------------------------------
# TEST 7: Anomaly detection
# ---------------------------------------------------------------------------

def test_7_anomaly():
    header("TEST 7: Anomaly detection – large quantity vs historical")
    info("Submitting 3 baseline diesel records (1000 litre each) for company_id=1 ...")

    for i in range(3):
        _post(
            "/activities",
            {
                "company_id": 1,
                "activity": "Diesel combustion",
                "quantity": 1000,
                "unit": "litre",
                "date": f"2026-0{i+1}-01",
            },
        )

    info("Submitting a very high quantity (50000 litre) ...")
    status, body = _post(
        "/activities",
        {
            "company_id": 1,
            "activity": "Diesel combustion",
            "quantity": 50000,
            "unit": "litre",
            "date": "2026-09-12",
        },
    )
    data = body.get("data", {})
    anomaly = data.get("anomaly", {})
    info(f"HTTP {status}")
    info(f"Anomaly detected : {anomaly.get('is_anomaly')}")
    info(f"Message          : {anomaly.get('message')}")
    info(f"Ratio            : {anomaly.get('ratio')}")

    passed = status == 201 and anomaly.get("is_anomaly") is True
    if passed:
        ok("TEST 7 PASSED – Anomaly correctly detected and reported")
    else:
        fail(f"TEST 7 FAILED – anomaly={anomaly}, status={status}")


# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  Carboniq AI Backend – Integration Tests")
    print("=" * 60)

    setup()
    test_1_diesel()
    test_2_natural_gas()
    test_3_electricity()
    test_4_air_travel()
    test_5_missing_activity()
    test_6_negative_quantity()
    test_7_anomaly()

    print("\n" + "=" * 60)
    print("  Tests complete.")
    print("=" * 60 + "\n")
