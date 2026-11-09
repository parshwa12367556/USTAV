# Bookings and related API

Base URL: `/api/v1`. Booking authorization is tied to the family event and vendor business; staff access may additionally require assignment.

## Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/bookings` | List bookings visible to caller |
| POST | `/bookings` | Create a booking request from an authorized event to a vendor |
| PATCH | `/bookings/<booking_id>` | Update permitted booking state/details |
| GET | `/quotations` | List quotations visible to caller (event workspace or vendor owner) |
| POST | `/quotations` | Create quotation request from an accessible event to verified vendor |
| PATCH | `/quotations/<quotation_id>` | Vendor reply or authorized family response |
| GET | `/payments` | List payments within accessible event scope |
| POST | `/payments/checkout` | Start checkout for confirmed, payable booking |
| POST | `/payments/verify` | Verify provider checkout signature |
| POST | `/payments/webhooks/<provider>` | Provider callback; currently Razorpay is supported |

## Scope and permissions

Family access is checked through event membership and domain permission. Vendor owner/staff access is scoped to the vendor profile and booking assignment. Do not assume a booking ID or vendor ID is sufficient authorization. Exact request fields, permissible state transitions, and permission names are defined in the route schemas and services.

## Payment behavior

The application requests a Razorpay order server-side and returns checkout metadata including provider key ID, order/payment IDs, amount, and currency. It stores payment, invoice, and transaction metadata. The API should not receive or store card number/CVV; confirm the actual checkout integration and provider PCI scope before launch. Webhooks must be signed with `RAZORPAY_WEBHOOK_SECRET`.

## Operational caveat

Provider credentials, webhook registration, settlement behavior, refunds, and live payment end-to-end testing require external configuration. Automated tests are not proof that the provider account is ready.