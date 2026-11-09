# Payment module

## Current implementation

The backend models payments, transactions, and invoices; payment routes list visible payments, create a Razorpay checkout order for an eligible confirmed booking, verify checkout results, and accept Razorpay webhook requests. The provider integration is implemented in `backend/app/services/payment_service.py`.

## Data flow

1. Authenticated caller requests checkout for a booking.
2. Backend validates booking access/state/amount and creates an order with Razorpay using server-side credentials.
3. Frontend receives provider checkout metadata, including public key ID, order/payment identifiers, amount, and currency.
4. Verification/webhook handling updates payment/transaction state after validating provider signatures.

## Data and card scope

The application stores booking/payment amount, currency, status, invoice number, timestamps, provider transaction reference/status, and provider response metadata. Do not place card number, CVV, or full payment credentials into UTSAV fields/logs. The actual checkout integration, card-data flow, provider contract, and PCI responsibilities must be verified with the payment provider and operator.

## Configuration and security

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only in server-side secret configuration. Register the webhook URL and expected events in the Razorpay account. Test signature rejection, replay/idempotency behavior, failed/captured events, amount/currency matching, and permission scoping in sandbox before live use.

## Limitations

Repository tests cannot prove settlement, refund, dispute, reconciliation, tax, invoice PDF generation, or production payment account readiness. Confirm each operational/payment obligation separately.