import hashlib
import hmac
import json
from decimal import Decimal

from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.payment import Payment, Transaction
from app.models.user import User
from app.models.vendor import VendorProfile


def create_confirmed_booking(client, app, auth_headers):
    event_response = client.post(
        "/api/v1/events",
        json={"name": "Payment Wedding", "type": "Wedding", "date": "2027-12-18"},
        headers=auth_headers,
    )
    assert event_response.status_code == 201
    with app.app_context():
        event = db.session.get(Event, event_response.json["id"])
        vendor_user = User(
            name="Payment Vendor",
            email="payment-vendor@example.com",
            password_hash=generate_password_hash("vendor-password-123"),
            role="vendor",
            is_verified=True,
        )
        db.session.add(vendor_user)
        db.session.flush()
        vendor = VendorProfile(
            user_id=vendor_user.id,
            business_name="Payment Venue",
            category="Venue",
            city="Jaipur",
            verification_status="verified",
        )
        db.session.add(vendor)
        db.session.flush()
        booking = Booking(
            event_id=event.id,
            vendor_id=vendor.id,
            service_name="Venue hire",
            event_date=event.date,
            amount=Decimal("12500.00"),
            status="confirmed",
        )
        db.session.add(booking)
        db.session.commit()
        return booking.id


def sign(secret, value):
    return hmac.new(secret.encode(), value, hashlib.sha256).hexdigest()


def test_checkout_requires_razorpay_configuration(client, app, auth_headers):
    booking_id = create_confirmed_booking(client, app, auth_headers)
    response = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    assert response.status_code == 503


def test_payment_endpoints_reject_non_object_json(client, app, auth_headers):
    checkout = client.post(
        "/api/v1/payments/checkout",
        data="[]",
        content_type="application/json",
        headers=auth_headers,
    )
    verify = client.post(
        "/api/v1/payments/verify",
        data="[]",
        content_type="application/json",
        headers=auth_headers,
    )
    assert checkout.status_code == 400
    assert verify.status_code == 400


def test_razorpay_checkout_is_idempotent_and_signature_verified(
    client, app, auth_headers, monkeypatch
):
    booking_id = create_confirmed_booking(client, app, auth_headers)
    app.config.update(
        RAZORPAY_KEY_ID="rzp_test_public",
        RAZORPAY_KEY_SECRET="test-secret",
    )
    created_orders = []

    def create_order(amount, currency, receipt):
        created_orders.append((amount, currency, receipt))
        return {"id": "order_test_123", "amount": amount, "currency": currency}

    monkeypatch.setattr("app.services.payment_service._create_razorpay_order", create_order)
    first = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    second = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    assert first.status_code == 200
    assert first.json["amount"] == 1_250_000
    assert first.json["currency"] == "INR"
    assert first.json["orderId"] == second.json["orderId"]
    assert len(created_orders) == 1

    invalid = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": first.json["orderId"],
            "razorpay_payment_id": "pay_test_123",
            "razorpay_signature": "invalid",
        },
        headers=auth_headers,
    )
    assert invalid.status_code == 400

    signature = sign("test-secret", b"order_test_123|pay_test_123")
    verified = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": first.json["orderId"],
            "razorpay_payment_id": "pay_test_123",
            "razorpay_signature": signature,
        },
        headers=auth_headers,
    )
    assert verified.status_code == 200
    assert verified.json["status"] == "paid"
    assert client.get("/api/v1/payments", headers=auth_headers).json[0]["status"] == "paid"


def test_razorpay_webhook_requires_signature_and_is_idempotent(client, app, auth_headers, monkeypatch):
    booking_id = create_confirmed_booking(client, app, auth_headers)
    app.config.update(
        RAZORPAY_KEY_ID="rzp_test_public",
        RAZORPAY_KEY_SECRET="test-secret",
        RAZORPAY_WEBHOOK_SECRET="webhook-secret",
    )
    monkeypatch.setattr(
        "app.services.payment_service._create_razorpay_order",
        lambda amount, currency, receipt: {
            "id": "order_webhook_123",
            "amount": amount,
            "currency": currency,
        },
    )
    checkout = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    body = json.dumps(
        {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_webhook_123",
                        "order_id": checkout.json["orderId"],
                        "amount": 1_250_000,
                        "currency": "INR",
                    }
                }
            },
        },
        separators=(",", ":"),
    ).encode()
    invalid = client.post(
        "/api/v1/payments/webhooks/razorpay",
        data=body,
        headers={"X-Razorpay-Signature": "invalid"},
    )
    assert invalid.status_code == 401

    malformed_body = b'{"event":"payment.captured","payload":[]}'
    malformed = client.post(
        "/api/v1/payments/webhooks/razorpay",
        data=malformed_body,
        headers={"X-Razorpay-Signature": sign("webhook-secret", malformed_body)},
    )
    assert malformed.status_code == 400

    signature = sign("webhook-secret", body)
    captured = client.post(
        "/api/v1/payments/webhooks/razorpay",
        data=body,
        headers={"X-Razorpay-Signature": signature},
    )
    repeated = client.post(
        "/api/v1/payments/webhooks/razorpay",
        data=body,
        headers={"X-Razorpay-Signature": signature},
    )
    assert captured.status_code == 200
    assert captured.json["processed"] is True
    assert repeated.status_code == 200
    with app.app_context():
        payment = db.session.scalar(db.select(Payment))
        transaction = db.session.scalar(db.select(Transaction))
        assert payment.status == "paid"
        assert transaction.status == "captured"


def test_payment_order_is_not_visible_to_another_family(client, app, auth_headers, monkeypatch):
    booking_id = create_confirmed_booking(client, app, auth_headers)
    app.config.update(RAZORPAY_KEY_ID="rzp_test_public", RAZORPAY_KEY_SECRET="test-secret")
    monkeypatch.setattr(
        "app.services.payment_service._create_razorpay_order",
        lambda amount, currency, receipt: {
            "id": "order_private_123",
            "amount": amount,
            "currency": currency,
        },
    )
    checkout = client.post(
        "/api/v1/payments/checkout",
        json={"bookingId": booking_id},
        headers=auth_headers,
    )
    with app.app_context():
        other = User(
            name="Another Family",
            email="another-payment-family@example.com",
            password_hash=generate_password_hash("family-password-123"),
            role="family",
            is_verified=True,
        )
        db.session.add(other)
        db.session.commit()
        token = create_access_token(other.id, additional_claims={"role": "family"})
    signature = sign("test-secret", b"order_private_123|pay_private_123")
    response = client.post(
        "/api/v1/payments/verify",
        json={
            "razorpay_order_id": checkout.json["orderId"],
            "razorpay_payment_id": "pay_private_123",
            "razorpay_signature": signature,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
