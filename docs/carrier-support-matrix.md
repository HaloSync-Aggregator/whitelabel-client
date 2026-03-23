# Carrier Support Matrix

Detailed feature support per airline. This matrix is derived from middleware capability verification results and the PolarHub NDC middleware capability set.

> Last updated: 2026-02-13

## Pre-Booking

All listed airlines support the core booking flow: AirShopping → OfferPrice → OrderCreate.

| Code | Airline | Search | OfferPrice | Hold Booking | Ticketing |
|------|---------|:------:|:----------:|:------------:|:---------:|
| AY | Finnair | Y | Y | Y | Y |
| SQ | Singapore Airlines | Y | Y | Y | Y |
| AF | Air France | Y | Y | Y | Y |
| KL | KLM | Y | Y | Y | Y |
| TK | Turkish Airlines | Y | Y | Y | Y |
| QR | Qatar Airways | Y | Y | Y | Y |
| TR | Scoot | Y | Y | Y | Y |
| EK | Emirates | Y | Y | Y | Y |
| LH | Lufthansa | Y | Y | Y | Y |
| AA | American Airlines | Y | Y | Y | Y |
| HA | Hawaiian Airlines | Y | Y | Y | Y |
| BA | British Airways | Y | Y | Y | Y |

### Hold Booking Constraints

| Code | ADT-only Required | Notes |
|------|:-----------------:|-------|
| AY | Yes | CHD/INF causes OrderCreate 500 |
| AA | Yes | ADT-only for hold |
| LH | Yes | ADT-only for hold |
| EK | Yes | ADT-only for hold |
| TR | Yes | ADT-only for hold |

## Seat Selection

| Code | SeatAvailability | Free Seats | Paid Seats | Seat Reprice | Pattern |
|------|:----------------:|:----------:|:----------:|:------------:|---------|
| AY | Y | Y | Y | - | B (OrderQuote → 2-step OC) |
| SQ | Y | Y | Y | - | B (OrderQuote → 2-step OC) |
| AF | Y | Y | Y | Required | A (OfferPrice → 2-step OC) |
| KL | Y | Y | Y | Required | A (OfferPrice → 2-step OC) |
| TK | Partial | Y | Y | - | E (free: direct) / C (paid: OrderQuote) |
| QR | Y | Y | Y | - | C (OrderQuote → 1-step OC) |
| TR | Y | Y | Y | Required | C (OrderQuote → 1-step OC) |
| EK | Partial | - | - | - | Not supported for held bookings |
| HA | Y | Y | Y | - | D (No quote, polling) |

### Notes
- **Seat Reprice**: AF, KL, TR require an additional OfferPrice call after SeatAvailability to get accurate seat pricing.
- **TR restricted seats**: Selecting `restricted` seats causes OfferPrice 500. Always prefer `available` seats.

## Ancillary Services (Baggage, Meals, etc.)

| Code | ServiceList | Quote | Add | Confirm | Pattern |
|------|:----------:|:-----:|:---:|:-------:|---------|
| AY | Y | OrderQuote | - | 1-step OC | B |
| SQ | Y | OrderQuote | - | 1-step OC | B |
| AF | Y | OfferPrice | Add (1st OC) | Confirm (2nd OC) | C |
| KL | Y | OfferPrice | Add (1st OC) | Confirm (2nd OC) | C |
| TK | Partial | Conditional | - | - | E |
| QR | Y | Quote | - | Confirm | Other |
| TR | Y | Quote | - | Confirm | Other |
| HA | Y | OrderQuote | - | Confirm | D |

### Notes
- **bookingInstructions**: Required for weight-based services (KG/PC units like extra baggage). Format: `{ text: ["TTL20KG"], ositext: ["TTL\\s?%WVAL%KG"] }`
- **AF/KL offerItems fallback**: Post-booking OfferPrice may lack `PricedOfferItem`. Always fallback to `selectedServices`.
- **AF/KL 2-step service purchase**: The `/service-purchase` route must return `requiresPayment: true` with `orderChangeData` when Add (1st OC) succeeds but FE hasn't sent payment info yet. The FE's PaymentPopup collects payment and calls `/service-purchase/confirm` (2nd OC) separately.

## Post-Booking Management

| Code | Pax Change | Journey Change | Cancel | Refund Quote | PNR Split |
|------|:----------:|:--------------:|:------:|:------------:|:---------:|
| AY | Y (Add/Delete) | Y (Pattern C) | Y | Y | Y |
| SQ | - | Y (Pattern C) | Y | Y | - |
| AF | Y (Modify) | - | Y | Y | - |
| KL | Y (Modify) | - | Y | Y | Y |
| TK | Y (All) | Y (Pattern A) | Y | Y | Y |
| QR | - | - | Y | Y | - |
| TR | - | - | Y | Y | - |
| EK | - | - | Y | Y | - |
| LH | - | - | Y | Y | - |

### Pax Change Modes

| Mode | Carriers | Behavior |
|------|----------|----------|
| MODIFY_ONLY | AF, KL | `currentPaxRefId` only in UpdatePax |
| ADD_DELETE_ONLY | AY | Add: `newPaxRefId`, Delete: `currentPaxRefId` |
| ALL | TK, SQ, HA | Both modify and add/delete supported |

### Journey Change Patterns

| Pattern | Carriers | Flow |
|---------|----------|------|
| A | TK, QR | OrderReshop Reprice → 1-step OrderChange |
| B | AF, KL | OrderReshop Reprice → 2-step OrderChange |
| C | SQ, AY | OrderQuote → 1-step OrderChange |

## Ticketing Flows

| Code | Pre-Ticketing Group | Two-Step | Payment Type | Notes |
|------|:-------------------:|:--------:|:------------:|-------|
| AY | QUOTE | Always | AGT | Two-step: accept → payment |
| SQ | QUOTE | Conditional | AGT | Two-step only when services included |
| AF | DIRECT | - | AGT | Direct OrderChange |
| KL | DIRECT | - | AGT | Direct OrderChange |
| TK | QUOTE | - | AGT | Single-step |
| TR | DIRECT | - | **Ag** | Uses 'Ag' instead of 'AGT' |
| EK | RESHOP | - | AGT | OrderReshop first |
| LH | RESHOP | - | AGT | OrderReshop first |
| QR | RESHOP | - | AGT | OrderReshop first |
| AA | RESHOP | - | AGT | OrderReshop first |
| HA | QUOTE | - | AGT | OrderQuote first |

## Source

This matrix is compiled from:
- PolarHub NDC middleware capability test results (2026-02-06, 2026-02-11)
- Public API mapping and support assets in `.claude/assets/`
- DEMO001 application code (`src/types/`)
