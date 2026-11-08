import base64
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import current_app

from app.core.exceptions import ApiError, ServiceUnavailable
from app.extensions import db
from app.models.booking import Booking
from app.models.event import Event
from app.models.payment import Payment, Transaction
from app.services.workspace_service import user_has_event_permission

logger = logging.getLogger(__name__)
RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"


def _razorpay_credentials() -> tuple[str, str]:
    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise ServiceUnavailable(
            "Razorpay is not configured. Contact the administrator to enable checkout."
        )
    return key_id, key_secret


def _create_razorpay_order(
    amount_paise: int,
    currency: str,
    receipt: str,
) -> dict[str, object]:
    key_id, key_secret = _razorpay_credentials()
    credentials = base64.b64encode(f"{key_id}:{key_secret}".encode()).decode("ascii")
    body = json.dumps(
        {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
        }
    ).encode("utf-8")
    request = Request(
        RAZORPAY_ORDERS_URL,
        data=body,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=15) as response:
            result = json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        logger.exception("Razorpay order creation failed")
        raise ServiceUnavailable(
            "The payment provider could not start checkout. Please try again later."
        ) from error
    if (
        not isinstance(result, dict)
        or not isinstance(result.get("id"), str)
        or result.get("amount") != amount_paise
        or result.get("currency") != currency
    ):
        logger.error("Razorpay returned an invalid order response")
        raise ServiceUnavailable(
            "The payment provider returned an invalid checkout response."
        )
    return result


def _checkout_response(payment: Payment, order_id: str, key_id: str) -> dict[str, object]:
    amount_paise = int((Decimal(payment.amount) * 100).quantize(Decimal("1")))
    return {
        "provider": "razorpay",
        "keyId": key_id,
        "orderId": order_id,
        "paymentId": payment.id,
        "invoiceNumber": payment.invoice_number,
        "amount": amount_paise,
        "currency": payment.currency,
    }


def create_checkout_session(booking: Booking) -> dict[str, object]:
    key_id, _ = _razorpay_credentials()
    if booking.status != "confirmed":
        raise ApiError("Only confirmed bookings can be paid online.", 409)
    if booking.amount <= 0:
        raise ApiError("This booking has no payable amount.", 409)
    amount_paise = int(
        (Decimal(booking.amount) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )

    pending_payment = db.session.scalar(
        db.select(Payment).where(
            Payment.booking_id == booking.id,
            Payment.status == "pending",
        )
    )
    if pending_payment is not None:
        existing_transaction = db.session.scalar(
            db.select(Transaction).where(
                Transaction.payment_id == pending_payment.id,
                Transaction.provider == "razorpay",
                Transaction.status == "created",
            )
        )
        if existing_transaction and existing_transaction.provider_reference:
            return _checkout_response(
                pending_payment,
                existing_transaction.provider_reference,
                str((existing_transaction.response_data or {}).get("keyId") or key_id),
            )

    invoice_number = f"UTS-{uuid4().hex[:16].upper()}"
    order = _create_razorpay_order(amount_paise, "INR", invoice_number)
    payment = Payment(
        booking_id=booking.id,
        invoice_number=invoice_number,
        amount=booking.amount,
        currency="INR",
        status="pending",
    )
    db.session.add(payment)
    db.session.flush()
    transaction = Transaction(
        payment_id=payment.id,
        provider="razorpay",
        provider_reference=str(order["id"]),
        status="created",
        response_data={"orderId": order["id"], "keyId": key_id},
    )
    db.session.add(transaction)
    db.session.commit()
    return {
        "provider": "razorpay",
        "keyId": key_id,
        "orderId": str(order["id"]),
        "paymentId": payment.id,
        "invoiceNumber": payment.invoice_number,
        "amount": amount_paise,
        "currency": payment.currency,
    }


def _verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    _, key_secret = _razorpay_credentials()
    expected = hmac.new(
        key_secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_checkout_payment(
    user_id: str,
    order_id: str,
    payment_id: str,
    signature: str,
    membership_id: str | None = None,
) -> dict[str, object]:
    if not all(isinstance(value, str) and value for value in (order_id, payment_id, signature)):
        raise ApiError("Razorpay order, payment, and signature values are required.")
    transaction = db.session.scalar(
        db.select(Transaction).where(
            Transaction.provider == "razorpay",
            Transaction.provider_reference == order_id,
        )
    )
    payment = db.session.get(Payment, transaction.payment_id) if transaction else None
    booking = db.session.get(Booking, payment.booking_id) if payment and payment.booking_id else None
    event = db.session.get(Event, booking.event_id) if booking else None
    if (
        transaction is None
        or payment is None
        or not user_has_event_permission(
            user_id, event, "payment.manage", membership_id
        )
    ):
        raise ApiError("Payment order not found.", 404)
    if not _verify_payment_signature(order_id, payment_id, signature):
        raise ApiError("Razorpay payment signature is invalid.", 400)
    _mark_payment_captured(payment, transaction, payment_id)
    return payment.to_dict()


def _mark_payment_captured(payment: Payment, transaction: Transaction, payment_id: str) -> None:
    transaction.status = "captured"
    transaction.response_data = {
        **(transaction.response_data or {}),
        "paymentId": payment_id,
    }
    if payment.status != "paid":
        payment.status = "paid"
        payment.paid_at = datetime.now(timezone.utc)
    db.session.commit()


def process_razorpay_webhook(raw_body: bytes, signature: str | None) -> bool:
    webhook_secret = current_app.config.get("RAZORPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        raise ServiceUnavailable("Razorpay webhooks are not configured.")
    if not signature:
        raise ApiError("Razorpay webhook signature is required.", 401)
    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise ApiError("Razorpay webhook signature is invalid.", 401)
    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ApiError("Razorpay webhook body must be valid JSON.") from error
    event_type = payload.get("event") if isinstance(payload, dict) else None
    if event_type not in {"payment.captured", "payment.failed"}:
        return False
    event_payload = payload.get("payload") if isinstance(payload, dict) else None
    payment_payload = event_payload.get("payment") if isinstance(event_payload, dict) else None
    entity = payment_payload.get("entity") if isinstance(payment_payload, dict) else None
    if not isinstance(entity, dict):
        raise ApiError("Razorpay webhook payment data is invalid.")
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    if not isinstance(order_id, str) or not order_id or not isinstance(payment_id, str) or not payment_id:
        raise ApiError("Razorpay webhook payment reference is missing.")
    transaction = db.session.scalar(
        db.select(Transaction).where(
            Transaction.provider == "razorpay",
            Transaction.provider_reference == order_id,
        )
    )
    payment = db.session.get(Payment, transaction.payment_id) if transaction else None
    if payment is None:
        logger.info("Ignoring signed Razorpay webhook for an unknown order")
        return False
    expected_paise = int(
        (Decimal(payment.amount) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    )
    if entity.get("amount") != expected_paise or entity.get("currency") != payment.currency:
        raise ApiError("Razorpay webhook amount or currency does not match the order.", 400)
    if event_type == "payment.captured":
        _mark_payment_captured(payment, transaction, payment_id)
    elif payment.status != "paid":
        transaction.status = "failed"
        transaction.response_data = {
            **(transaction.response_data or {}),
            "paymentId": payment_id,
        }
        payment.status = "failed"
        db.session.commit()
    return True
