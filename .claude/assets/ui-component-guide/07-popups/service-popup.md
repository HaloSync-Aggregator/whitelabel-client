# Ancillary service Purchase

## Overview
Booking from 과specific Baggage, etc. Ancillary service Purchase when Use Popup.

---

## Supported carriers
AF, KL, SQ, QR, LH, LX, OS, EK

---

## Purchase per point in time Case

### Case 1: Booking Ancillary service Purchase
- Flight after Select before Payment from Step Purchase
- Screen Flow Note: Moqups

### Case 2: Ticketingbefore Ancillary service Purchase
- Booking after Complete Before ticketing from Step Purchase
- Booking Complete from Page 진입

### Case 3: Ticketingafter Ancillary service Purchase
- Ticketing after complete Purchase
- Booking Confirm from Page 진입

---

## Service Select Popup

### Service Type

| Type | Description |
|------|------|
| abovedelegatedBaggage | Additional baggage Purchase |
| in-flightBaggage | in-flight 반입 Baggage |
| Other Service | Per carrier Provide Service |

### Service Information Display

| Item | Display format | Example |
|------|----------|------|
| Serviceperson | English | ADDITIONAL BAGGAGE |
| Detail | Weight/Count | 23KG |
| Price | Number + Currency | 80,000 KRW |

### Weight-based service (XBAG, etc.)

Partial Baggage Service Fixed Weight not **User Directly Weight(kg) Input**.

#### per Determine Condition
- ServiceListRS's `BookingInstructions.Method` `%WVAL%` Pattern Include

#### UI Implementation
| Status | Display |
|------|------|
| unSelect | "Weight input" Badge + Weight input Field(1~100kg) + "Select" Button |
| Select | Serviceperson + Select Weight(e.g.: 10KG) + "Deselect" Button |

#### OfferPrice Pass Data
```json
// ⚠️ Middleware spec: ositext (Lowercase t)
{
 "offerItemId": "ITEM_XBAG_001",
 "paxRefId": ["PAX1"],
 "bookingInstructions": {
 "text": ["TTL10KG"],
 "ositext": ["TTL\\s?%WVAL%KG"]
 }
}
```

#### ⭐ Price Calculate (Important)

Weight-based service **Unit price × kg**로 Calculate:

| Distinction | Calculate 공식 | Example |
|------|----------|------|
| Weight-based | `Unit price × weightValue` | 33,200KRW × 12kg = 398,400KRW |
| General service | `Unit price × quantity` | 80,000KRW × 2items = 160,000KRW |

**Display format**:
- Weight-based: `XBAG x12KG` → `398,400 KRW`
- General service: `ADDITIONAL BAGGAGE x2` → `160,000 KRW`

---

## Purchase Confirmed process

### Target Carrier
FLX Provider Carrier (LH, LX, OS, EK, HA, KE)

### Per carrier StatusValue

| Status | LH, LX, OS, EK | KE, HA |
|------|----------------|--------|
| Carrier Response Pending | HN | REQUESTED |
| PurchaseConfirmed Available | HD | CONFIRMED |
| Purchase Confirmed Complete | HI, HK | CONFIRMED |

### PurchaseConfirmed Button Exposed Condition
1. StatusValue HD or CONFIRMED
2. Free Service 아닐 Thing (BaseAmount ≠ 0)
3. Corresponding Service Paymentnot not았 Thing
4. Corresponding in Service Issued Ticket absent Thing

---

## SSR Information Display

### Display items

| Item | Display format | Example |
|------|----------|------|
| Carrier | 2Seat code | LH |
| Passengerperson | English property/given name (PTC) | MOON/CINDY (ADT) |
| SSR | Serviceperson + Information | Additional Baggage 23KG |
| Segments | Flight Information | LH0001 ICN-FRA 01/FEB/2023 |
| Status | StatusCode | HN, HD, HI, HK |

### SSR Status Guide
- StatusValue HN, HD Case: "Purchase Pending In progress Ancillary service ." (빨간color)
- StatusValue HD Case: Checkbox Button Add

---

## Payment information Popup

### Composition

| Section | Description |
|------|------|
| Service Summary | Select Service list |
| Amount Information | per Service Amount and Total |
| Payment method | Cash/Card/Voucher Select |

### Button

| Button | Behavior |
|------|------|
| Payment&Issue | Payment after Progress Complete |
| Cancellation | Popup Close |
