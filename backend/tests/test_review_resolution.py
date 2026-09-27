"""
backend/tests/test_review_resolution.py
---------------------------------------
Tests the Phase 3 Auditor Review & Resolve workflow:
- Auditor resolution permissions
- Administrator resolution permissions
- Company user resolution rejection (403)
- Cross-company authorization rejection (403)
- Payload validation (empty notes, invalid decision)
- Immutability of original calculation fields
- Audit record history persistence
"""

from models import ActivityRecord, EmissionResult, AuditRecord
from database import db


def test_auditor_review_resolution_valid(client, seed_data, auth_headers):
    """Auditor can resolve a 'Needs Review' record to 'Reviewed - Valid'."""
    act_id = 2  # Seeded with 'Needs Review'
    notes = "Auditor verified utility supplier certificate for renewable grid mix."

    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["auditor"],
        json={"decision": "Reviewed - Valid", "resolution_notes": notes},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["emission"]["status"] == "Reviewed - Valid"
    assert data["data"]["activity"]["id"] == act_id


def test_admin_review_resolution_issue(client, seed_data, auth_headers):
    """Administrator can resolve a record to 'Reviewed - Issue'."""
    act_id = 2
    notes = "Administrator flagged discrepancy in invoice billing period."

    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["admin"],
        json={"decision": "Reviewed - Issue", "resolution_notes": notes},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["emission"]["status"] == "Reviewed - Issue"


def test_company_user_resolution_forbidden(client, seed_data, auth_headers):
    """Company user is forbidden from resolving review records."""
    act_id = 2
    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["company_user"],
        json={"decision": "Reviewed - Valid", "resolution_notes": "Attempted resolve"},
    )
    assert resp.status_code == 403
    data = resp.get_json()
    assert data["success"] is False
    assert "Only authorized auditors and administrators" in data["error"]


def test_unauthorized_company_resolution_forbidden(client, seed_data, auth_headers):
    """Auditor assigned only to Company 2 cannot resolve records belonging to Company 1."""
    act_id = 2  # Belongs to Company 1
    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["other_auditor"],
        json={"decision": "Reviewed - Valid", "resolution_notes": "Cross-company attempt"},
    )
    assert resp.status_code == 403
    data = resp.get_json()
    assert data["success"] is False
    assert "You are not authorized to access this company" in data["error"]


def test_resolution_empty_notes_rejected(client, seed_data, auth_headers):
    """Resolution with empty or whitespace-only notes must be rejected with 400."""
    act_id = 2
    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["auditor"],
        json={"decision": "Reviewed - Valid", "resolution_notes": "   "},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["success"] is False
    assert "resolution_notes" in data["error"]


def test_resolution_invalid_decision_rejected(client, seed_data, auth_headers):
    """Resolution with an unknown decision string must be rejected with 400."""
    act_id = 2
    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["auditor"],
        json={"decision": "Approved Automatically", "resolution_notes": "Some notes"},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["success"] is False
    assert "Invalid decision" in data["error"]


def test_calculation_and_factor_immutability_after_resolution(client, seed_data, auth_headers, app):
    """
    Verify that resolving a record DOES NOT alter original emission factor,
    CO2e metrics, calculation formula, source, methodology, or original review reason.
    """
    with app.app_context():
        # Inspect initial state of Activity 1 (Calculated)
        act1 = db.session.get(ActivityRecord, 1)
        em1 = act1.emission_result
        orig_factor_id = em1.factor_id
        orig_co2e_kg = em1.co2e_kg
        orig_co2e_tonnes = em1.co2e_tonnes
        orig_calculation = em1.calculation
        orig_source = em1.source
        orig_methodology = em1.methodology

    # Resolve Activity 1
    resp = client.post(
        "/api/activities/1/resolve",
        headers=auth_headers["auditor"],
        json={"decision": "Reviewed - Valid", "resolution_notes": "Auditor confirmed diesel fuel logs."},
    )
    assert resp.status_code == 200

    with app.app_context():
        # Verify immutable fields remain identical
        refreshed_act1 = db.session.get(ActivityRecord, 1)
        refreshed_em1 = refreshed_act1.emission_result

        assert refreshed_em1.factor_id == orig_factor_id
        assert refreshed_em1.co2e_kg == orig_co2e_kg
        assert refreshed_em1.co2e_tonnes == orig_co2e_tonnes
        assert refreshed_em1.calculation == orig_calculation
        assert refreshed_em1.source == orig_source
        assert refreshed_em1.methodology == orig_methodology
        assert refreshed_em1.status == "Reviewed - Valid"


def test_audit_record_history_persistence(client, seed_data, auth_headers, app):
    """
    Verify that resolution appends a new AuditRecord and preserves the initial calculation audit record.
    """
    act_id = 2

    with app.app_context():
        em2 = db.session.get(EmissionResult, 2)
        initial_audit_count = len(em2.audit_records)
        assert initial_audit_count == 1  # Initial calculation audit record

    resolution_notes = "Comprehensive energy audit verified location-based factor applicability."
    resp = client.post(
        f"/api/activities/{act_id}/resolve",
        headers=auth_headers["auditor"],
        json={"decision": "Reviewed - Valid", "resolution_notes": resolution_notes},
    )
    assert resp.status_code == 200

    with app.app_context():
        refreshed_em2 = db.session.get(EmissionResult, 2)
        assert len(refreshed_em2.audit_records) == initial_audit_count + 1

        # Check resolution audit record properties
        res_record = refreshed_em2.resolution_record
        assert res_record is not None
        assert res_record.status == "Reviewed - Valid"
        assert res_record.review_reason == resolution_notes

        # Check that initial calculation record is still preserved
        initial_record = refreshed_em2.audit_record
        assert initial_record is not None
        assert initial_record.status == "Needs Review"
        assert initial_record.factor_id == "EF-003"
