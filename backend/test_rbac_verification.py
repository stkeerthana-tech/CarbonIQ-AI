"""
test_rbac_verification.py
-------------------------
Verifies the exact RBAC matrix across all three roles with cleanup:
1. company_user (test@carboniq.ai)
2. auditor (george@gmail.com)
3. admin (stkeerthana27@gmail.com)
"""

import os
import sys
import json

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from app import create_app
from database import db
from models import User, Company, ActivityRecord, EmissionResult, AuditRecord
from flask_jwt_extended import create_access_token

def run_tests():
    app = create_app()
    app.config["TESTING"] = True

    with app.app_context():
        client = app.test_client()

        # Retrieve test users
        cu = User.query.filter_by(email="test@carboniq.ai").first()
        auditor = User.query.filter_by(email="george@gmail.com").first()
        admin = User.query.filter_by(email="stkeerthana27@gmail.com").first()

        assert cu is not None, "Company user test@carboniq.ai not found"
        assert auditor is not None, "Auditor george@gmail.com not found"
        assert admin is not None, "Admin stkeerthana27@gmail.com not found"

        cu_token = create_access_token(identity=str(cu.id))
        auditor_token = create_access_token(identity=str(auditor.id))
        admin_token = create_access_token(identity=str(admin.id))

        company = Company.query.first()
        company_id = company.id

        created_activity_ids = []
        created_company_ids = []

        results = []

        def test_endpoint(name, method, url, token, payload=None, expected_status=200):
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            if method == "GET":
                resp = client.get(url, headers=headers)
            elif method == "POST":
                resp = client.post(url, headers=headers, data=json.dumps(payload or {}))
            
            passed = (resp.status_code == expected_status)
            body = resp.get_json(silent=True) or {}
            
            # Track created test records for cleanup
            if resp.status_code == 201:
                if "/api/activities" in url and "data" in body and "activity" in body["data"]:
                    created_activity_ids.append(body["data"]["activity"]["id"])
                elif "/api/companies" in url and "data" in body and "id" in body["data"]:
                    created_company_ids.append(body["data"]["id"])

            results.append({
                "test": name,
                "status_code": resp.status_code,
                "expected": expected_status,
                "passed": passed,
                "body": body
            })
            print(f"[{'PASS' if passed else 'FAIL'}] {name} -> Status: {resp.status_code} (Expected: {expected_status})")
            return resp

        try:
            print("\n" + "="*60)
            print("1. TESTING COMPANY USER (test@carboniq.ai)")
            print("="*60)
            # Company User: POST activity -> 403
            test_endpoint(
                "Company User: POST /api/activities",
                "POST",
                "/api/activities",
                cu_token,
                {"company_id": company_id, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
                expected_status=403
            )
            # Company User: GET /api/activities -> 200
            test_endpoint(
                "Company User: GET /api/activities",
                "GET",
                f"/api/activities?company_id={company_id}",
                cu_token,
                expected_status=200
            )
            # Company User: POST /api/emissions/calculate -> 200
            test_endpoint(
                "Company User: POST /api/emissions/calculate",
                "POST",
                "/api/emissions/calculate",
                cu_token,
                {"company_id": company_id, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
                expected_status=200
            )
            # Company User: GET /api/auth/users -> 403
            test_endpoint(
                "Company User: GET /api/auth/users (User Management)",
                "GET",
                "/api/auth/users",
                cu_token,
                expected_status=403
            )
            # Company User: POST /api/companies -> 403
            test_endpoint(
                "Company User: POST /api/companies (Company Management)",
                "POST",
                "/api/companies",
                cu_token,
                {"company_name": "Unauthorized Org"},
                expected_status=403
            )

            print("\n" + "="*60)
            print("2. TESTING AUDITOR (george@gmail.com)")
            print("="*60)
            # Auditor: POST /api/activities -> 201 (allowed)
            test_endpoint(
                "Auditor: POST /api/activities",
                "POST",
                "/api/activities",
                auditor_token,
                {"company_id": company_id, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
                expected_status=201
            )
            # Auditor: GET /api/activities -> 200
            test_endpoint(
                "Auditor: GET /api/activities",
                "GET",
                f"/api/activities?company_id={company_id}",
                auditor_token,
                expected_status=200
            )
            # Auditor: POST /api/emissions/calculate -> 200
            test_endpoint(
                "Auditor: POST /api/emissions/calculate",
                "POST",
                "/api/emissions/calculate",
                auditor_token,
                {"company_id": company_id, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
                expected_status=200
            )
            # Auditor: GET /api/auth/users -> 403
            test_endpoint(
                "Auditor: GET /api/auth/users (User Management)",
                "GET",
                "/api/auth/users",
                auditor_token,
                expected_status=403
            )
            # Auditor: POST /api/companies -> 403
            test_endpoint(
                "Auditor: POST /api/companies (Company Management)",
                "POST",
                "/api/companies",
                auditor_token,
                {"company_name": "Auditor Org"},
                expected_status=403
            )

            print("\n" + "="*60)
            print("3. TESTING ADMINISTRATOR (stkeerthana27@gmail.com)")
            print("="*60)
            # Admin: POST /api/activities -> 201
            test_endpoint(
                "Admin: POST /api/activities",
                "POST",
                "/api/activities",
                admin_token,
                {"company_id": company_id, "activity": "Diesel combustion", "quantity": 100, "unit": "litre", "date": "2026-09-20"},
                expected_status=201
            )
            # Admin: GET /api/activities -> 200
            test_endpoint(
                "Admin: GET /api/activities",
                "GET",
                f"/api/activities?company_id={company_id}",
                admin_token,
                expected_status=200
            )
            # Admin: GET /api/auth/users -> 200
            test_endpoint(
                "Admin: GET /api/auth/users (User Management)",
                "GET",
                "/api/auth/users",
                admin_token,
                expected_status=200
            )
            # Admin: POST /api/companies -> 201
            test_endpoint(
                "Admin: POST /api/companies (Company Management)",
                "POST",
                "/api/companies",
                admin_token,
                {"company_name": "New Admin Created Corp Clean", "industry": "Energy", "location": "US"},
                expected_status=201
            )
        finally:
            # Clean up any test records created
            for act_id in created_activity_ids:
                act = db.session.get(ActivityRecord, act_id)
                if act:
                    if act.emission_result:
                        if act.emission_result.audit_record:
                            db.session.delete(act.emission_result.audit_record)
                        db.session.delete(act.emission_result)
                    db.session.delete(act)
            for comp_id in created_company_ids:
                c = db.session.get(Company, comp_id)
                if c:
                    db.session.delete(c)
            db.session.commit()

        all_passed = all(r["passed"] for r in results)
        print("\n" + "="*60)
        print(f"RBAC MATRIX TEST SUMMARY: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
        print("="*60)
        return all_passed

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
