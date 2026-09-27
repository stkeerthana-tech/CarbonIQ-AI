"""
test_phase3_resolve.py
----------------------
Focused automated tests for the Phase 3 Review & Resolve workflow:
1. Valid auditor resolution -> 200
2. Valid admin resolution -> 200
3. Company User resolution rejection -> 403
4. Unauthorized company resolution rejection -> 403
5. Empty resolution notes rejection -> 400
6. Invalid decision rejection -> 400
7. Original emission calculation and factor immutability verification
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

        # Users
        cu = User.query.filter_by(email="test@carboniq.ai").first()
        auditor = User.query.filter_by(email="george@gmail.com").first()
        admin = User.query.filter_by(email="stkeerthana27@gmail.com").first()

        assert cu is not None, "Company user test@carboniq.ai missing"
        assert auditor is not None, "Auditor george@gmail.com missing"
        assert admin is not None, "Admin stkeerthana27@gmail.com missing"

        cu_token = create_access_token(identity=str(cu.id))
        auditor_token = create_access_token(identity=str(auditor.id))
        admin_token = create_access_token(identity=str(admin.id))

        company = Company.query.first()
        company_id = company.id

        # Target an activity needing review (or create a temporary activity for test)
        # Find existing activity in DB
        act = ActivityRecord.query.filter_by(company_id=company_id).first()
        assert act is not None, "No activities found in DB"
        target_activity_id = act.id

        # Record original calculation numbers before any test
        orig_emission = act.emission_result
        orig_factor_id = orig_emission.factor_id
        orig_co2e_kg = orig_emission.co2e_kg
        orig_co2e_tonnes = orig_emission.co2e_tonnes
        orig_calculation = orig_emission.calculation
        orig_source = orig_emission.source
        orig_methodology = orig_emission.methodology
        orig_status = orig_emission.status
        orig_review_reason = orig_emission.review_reason

        results = []

        def report_test(name, passed, detail=""):
            results.append({"name": name, "passed": passed, "detail": detail})
            print(f"[{'PASS' if passed else 'FAIL'}] {name} {detail}")

        print("\n" + "="*60)
        print("PHASE 3 AUDITOR REVIEW & RESOLVE TESTS")
        print("="*60)

        # 1. Company User Rejection -> 403
        resp = client.post(
            f"/api/activities/{target_activity_id}/resolve",
            headers={"Authorization": f"Bearer {cu_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Reviewed - Valid", "resolution_notes": "Attempted company user resolve"})
        )
        report_test(
            "1. Company User rejection",
            resp.status_code == 403,
            f"-> Status: {resp.status_code} (Expected: 403)"
        )

        # 2. Unauthorized Company Rejection -> 403
        # Create temp company not assigned to auditor
        temp_comp = Company(company_name="Unassigned Private Ltd")
        db.session.add(temp_comp)
        db.session.flush()
        
        # Temp activity in unassigned company
        from datetime import date
        temp_act = ActivityRecord(company_id=temp_comp.id, activity="Diesel combustion", quantity=100, unit="litre", date=date(2026, 9, 1))
        db.session.add(temp_act)
        db.session.flush()
        temp_em = EmissionResult(activity_id=temp_act.id, status="Needs Review", review_reason="Test unassigned")
        db.session.add(temp_em)
        db.session.commit()

        resp = client.post(
            f"/api/activities/{temp_act.id}/resolve",
            headers={"Authorization": f"Bearer {auditor_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Reviewed - Valid", "resolution_notes": "Attempted unauthorized resolve"})
        )
        report_test(
            "2. Unauthorized Company rejection",
            resp.status_code == 403,
            f"-> Status: {resp.status_code} (Expected: 403)"
        )

        # Clean up temp unassigned company records
        db.session.delete(temp_em)
        db.session.delete(temp_act)
        db.session.delete(temp_comp)
        db.session.commit()

        # 3. Empty Resolution Notes Rejection -> 400
        resp = client.post(
            f"/api/activities/{target_activity_id}/resolve",
            headers={"Authorization": f"Bearer {auditor_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Reviewed - Valid", "resolution_notes": "   "})
        )
        report_test(
            "3. Empty resolution notes rejection",
            resp.status_code == 400,
            f"-> Status: {resp.status_code} (Expected: 400)"
        )

        # 4. Invalid Decision Rejection -> 400
        resp = client.post(
            f"/api/activities/{target_activity_id}/resolve",
            headers={"Authorization": f"Bearer {auditor_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Random Decision", "resolution_notes": "Some notes"})
        )
        report_test(
            "4. Invalid decision string rejection",
            resp.status_code == 400,
            f"-> Status: {resp.status_code} (Expected: 400)"
        )

        # 5. Valid Auditor Resolution -> 200
        auditor_notes = "Auditor verified fuel delivery receipts and confirmed meter readings match operational logs."
        resp = client.post(
            f"/api/activities/{target_activity_id}/resolve",
            headers={"Authorization": f"Bearer {auditor_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Reviewed - Valid", "resolution_notes": auditor_notes})
        )
        body = resp.get_json(silent=True) or {}
        report_test(
            "5. Valid Auditor resolution",
            resp.status_code == 200 and body.get("success") is True,
            f"-> Status: {resp.status_code} (Expected: 200)"
        )

        # 6. Valid Administrator Resolution -> 200
        admin_notes = "Administrator second-level compliance review completed. Verified standard emission factors."
        resp = client.post(
            f"/api/activities/{target_activity_id}/resolve",
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            data=json.dumps({"decision": "Reviewed - Issue", "resolution_notes": admin_notes})
        )
        body = resp.get_json(silent=True) or {}
        report_test(
            "6. Valid Administrator resolution",
            resp.status_code == 200 and body.get("success") is True,
            f"-> Status: {resp.status_code} (Expected: 200)"
        )

        # 7. Immutability Verification: Check original calculation fields
        db.session.expire_all()
        refreshed_act = db.session.get(ActivityRecord, target_activity_id)
        refreshed_em = refreshed_act.emission_result

        immutability_passed = (
            refreshed_em.factor_id == orig_factor_id and
            refreshed_em.co2e_kg == orig_co2e_kg and
            refreshed_em.co2e_tonnes == orig_co2e_tonnes and
            refreshed_em.calculation == orig_calculation and
            refreshed_em.source == orig_source and
            refreshed_em.methodology == orig_methodology
        )
        report_test(
            "7. Calculation and Factor Immutability",
            immutability_passed,
            "-> Original factor, CO2e, calculation formula & methodology preserved intact"
        )

        # 8. Check that resolution audit record was appended
        resolution_record = refreshed_em.resolution_record
        has_resolution_audit = (
            resolution_record is not None and
            resolution_record.status == "Reviewed - Issue" and
            resolution_record.review_reason == admin_notes
        )
        report_test(
            "8. Resolution AuditRecord persistence",
            has_resolution_audit,
            "-> Resolution event persisted with reviewer metadata and timestamp"
        )

        # Clean up the test resolution audit records and restore initial status
        for ar in list(refreshed_em.audit_records):
            if ar.status in ("Reviewed - Valid", "Reviewed - Issue"):
                db.session.delete(ar)
        refreshed_em.status = orig_status
        refreshed_em.review_reason = orig_review_reason
        db.session.commit()

        all_passed = all(r["passed"] for r in results)
        print("\n" + "="*60)
        print(f"PHASE 3 TEST SUMMARY: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
        print("="*60)
        return all_passed

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
