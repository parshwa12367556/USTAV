import json

import pytest
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.guest import Guest
from app.models.security_event import SecurityEvent
from app.models.user import User
from app.models.workspace import FamilyWorkspace, FamilyMembership, FamilyMembershipPermission
from app.models.quotation import QuotationRequest
from app.models.payment import Payment
from app.models.vendor import VendorProfile
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from datetime import datetime, timezone


@pytest.fixture
def invitation(client, auth_headers):
    event = client.post("/api/v1/events", json={"name": "T005", "type": "Wedding", "date": "2027-06-10"}, headers=auth_headers)
    assert event.status_code == 201
    guest = client.post(f"/api/v1/events/{event.json['id']}/guests", json={"name": "Synthetic T005 guest"}, headers=auth_headers)
    assert guest.status_code == 201
    prefix = f"/api/v1/guests/{guest.json['id']}/invitation-token"
    token = client.post(prefix + "/rotate", headers=auth_headers)
    assert token.status_code == 200
    return guest.json["id"], prefix, token.json["invitationToken"]


def lookup(client, token):
    return client.post("/api/v1/rsvp/lookup", json={"token": token}).status_code


def test_rotation_preserves_revocation_and_owner_reissue_is_distinct(client, app, auth_headers, invitation):
    identifier, prefix, original = invitation
    assert client.post(prefix + "/revoke", headers=auth_headers).status_code == 200
    record = db.session.get(Guest, identifier)
    revoked_at = record.invitation_revoked_at
    rotated = client.post(prefix + "/rotate", headers=auth_headers)
    assert rotated.status_code == 200
    assert lookup(client, original) == 404
    assert lookup(client, rotated.json["invitationToken"]) == 410
    assert db.session.get(Guest, identifier).invitation_revoked_at == revoked_at
    reissued = client.post(prefix + "/reissue", headers=auth_headers)
    assert reissued.status_code == 200
    assert lookup(client, rotated.json["invitationToken"]) == 404
    assert lookup(client, reissued.json["invitationToken"]) == 200
    record = db.session.get(Guest, identifier)
    assert record.invitation_revoked_at is None
    events = db.session.scalars(db.select(SecurityEvent).where(SecurityEvent.resource_id == identifier)).all()
    assert "guest.invitation_reissued" in {e.event_type for e in events}
    assert all(reissued.json["invitationToken"] not in json.dumps(e.metadata_json) for e in events)


@pytest.mark.parametrize("actor", ["editor", "viewer", "outsider", "inactive_member", "wrong_context_owner"])
def test_reissue_rejects_delegated_and_cross_workspace_contexts(client, app, family_user, auth_headers, invitation, actor):
    identifier, prefix, original = invitation
    assert client.post(prefix + "/revoke", headers=auth_headers).status_code == 200
    record = db.session.get(Guest, identifier)
    before = (record.invitation_token_hash, record.invitation_revoked_at, record.invitation_expires_at)
    workspace = db.session.scalar(db.select(FamilyWorkspace).where(FamilyWorkspace.owner_user_id == family_user["id"]))
    user = User(name="T005 actor", email="actor@example.invalid", password_hash="unusable", role="family", is_verified=True)
    db.session.add(user); db.session.flush()
    if actor in {"editor", "viewer", "inactive_member"}:
        membership = FamilyMembership(workspace_id=workspace.id, user_id=user.id, role="member", status="inactive" if actor == "inactive_member" else "active")
        db.session.add(membership); db.session.flush()
        db.session.add(FamilyMembershipPermission(membership_id=membership.id, permission="guest.view" if actor == "viewer" else "guest.update"))
        claims = {"role": "family", "membership_id": membership.id}
        subject = user.id
    elif actor == "wrong_context_owner":
        other = FamilyWorkspace(owner_user_id=user.id, name="Other tenant")
        db.session.add(other); db.session.flush()
        membership = FamilyMembership(workspace_id=other.id, user_id=family_user["id"], role="member", status="active")
        db.session.add(membership); db.session.flush()
        db.session.add(FamilyMembershipPermission(membership_id=membership.id, permission="guest.update"))
        claims = {"role": "family", "membership_id": membership.id}
        subject = family_user["id"]
    else:
        claims, subject = {"role": "family"}, user.id
    db.session.commit()
    access = create_access_token(subject, additional_claims=claims)
    headers = {"Authorization": "Bearer " + access}
    response = client.post(prefix + "/reissue", headers=headers)
    assert response.status_code == (403 if actor == "editor" else 404)
    db.session.expire_all()
    record = db.session.get(Guest, identifier)
    assert (record.invitation_token_hash, record.invitation_revoked_at, record.invitation_expires_at) == before
    assert lookup(client, original) == 410
    rotated = client.post(prefix + "/rotate", headers=headers)
    if actor == "editor":
        assert rotated.status_code == 200
        assert lookup(client, rotated.json["invitationToken"]) == 410
    else:
        assert rotated.status_code == 404


def test_reissue_requires_auth_and_revoked_state(client, auth_headers, invitation):
    identifier, prefix, original = invitation
    record = db.session.get(Guest, identifier)
    before = (record.invitation_token_hash, record.invitation_expires_at)
    assert client.post(prefix + "/reissue").status_code == 401
    assert client.post(prefix + "/reissue", headers=auth_headers).status_code == 409
    db.session.expire_all()
    record = db.session.get(Guest, identifier)
    assert (record.invitation_token_hash, record.invitation_expires_at) == before
    assert lookup(client, original) == 200


def test_refund_and_quotation_revision_fields_round_trip(app, family_user, invitation):
    guest = db.session.get(Guest, invitation[0])
    vendor = VendorProfile(user_id=family_user["id"], business_name="Synthetic vendor", category="Venue", city="Test")
    db.session.add(vendor); db.session.flush()
    original = QuotationRequest(event_id=guest.event_id, vendor_id=vendor.id, title="Original")
    db.session.add(original); db.session.flush()
    revised = QuotationRequest(event_id=guest.event_id, vendor_id=vendor.id, title="Revised", revision=2,
        previous_quotation_id=original.id, revised_by=family_user["id"], revised_at=datetime.now(timezone.utc),
        requires_fresh_approval=True, items_snapshot={"items": [{"quantity": 1, "amount": 25}]}, total_amount=25)
    payment = Payment(invoice_number="t005-refund", amount=100, refund_amount=Decimal("25.00"), refund_status="processed",
        refund_provider_reference="synthetic-reference", refund_initiated_by=family_user["id"], refund_timestamp=datetime.now(timezone.utc))
    db.session.add_all([revised, payment]); db.session.commit()
    revised_id, payment_id, original_id = revised.id, payment.id, original.id
    db.session.expire_all()
    revised, payment = db.session.get(QuotationRequest, revised_id), db.session.get(Payment, payment_id)
    assert revised.previous_quotation_id == original_id and revised.revision == 2 and revised.requires_fresh_approval
    assert revised.revised_by == family_user["id"] and revised.revised_at is not None
    assert revised.items_snapshot == {"items": [{"quantity": 1, "amount": 25}]} and revised.total_amount == Decimal("25.00")
    assert payment.refund_amount == Decimal("25.00") and payment.refund_status == "processed"
    assert payment.refund_initiated_by == family_user["id"] and payment.refund_provider_reference == "synthetic-reference" and payment.refund_timestamp is not None
    revised.previous_quotation_id = "nonexistent-quotation"
    with pytest.raises(IntegrityError): db.session.commit()
    db.session.rollback()
