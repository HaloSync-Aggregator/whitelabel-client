# Seat purchase

## Overview
Booking from 과specific Seat Selectand Purchase when Use Popup.

---

## Supported carriers
AF, KL, SQ, QR, LH, LX, OS, EK, AA, KE, HA, TK, AY, TR, AS

---

## Purchase per point in time Case

### Case 1: Booking Seat purchase
- Flight after Select before Payment from Step Purchase

### Case 2: Ticketingbefore Seat purchase
- Booking after Complete Before ticketing from Step Purchase
- Booking Complete from Page 진입

### Case 3: Ticketingafter Seat purchase
- Ticketing after complete Purchase
- Booking Confirm from Page 진입

---

## Seat selection Screen Composition

| Item | Description |
|------|------|
| Seat map | Aviation기 Seat Layout Display |
| Seat Status | Selectable/Not possible/Select Distinction |
| Seat Information | SeatNumber (Row + Column) |
| Price Information | per Seat Add Fee |

---

## Seat Display Information

| Item | Display format | Example |
|------|----------|------|
| SeatNumber | Row + Column | 43J |
| Seatperson | English | PREFERRED LOWER DECK |
| Price | Number + Currency | 50,000 KRW |

---

## Seat StatusValue

| Status | Description |
|------|------|
| A, F, VACANT | Selectable |
| N, N/A | Seat None (empty space) |
| R, 1, Z | Limit (Restricted) |
| T, O | occupied (Occupied) |

---

## Seat Type Display

| Seat Type | Color | Include person칭 |
|----------|------|----------|
| Standard | Default | STANDARD SEAT, DEFAULT FREE SEAT, Regular, PREMIUM SEAT |
| Preferred | Separate | PREFERRED ZONE SEAT, Preferred Lower Deck, FORWARD ZONE |
| Extra Legroom | Separate | EXTRA LEGROOM SEAT, Extra Legroom |
| Restricted | color | Select Not possible Seat |
| Occupied | color | Already occupied Seat |

---

## Per carrier Seat purchase Method

Seat Paid/FreeDepending on API Call Flow differs.

### After ticketing Seat purchase Flow

| Distinction | Carrier | API Flow |
|------|--------|----------|
| **Paid seat** | LH, LX, OS, EK, KE, HA | OrderRetrieve → SeatAvailability → OrderChange → OrderRetrieve → OrderChange(F) |
| | QR, AS | OrderRetrieve → SeatAvailability → OrderChange(F) |
| | AF, KL | OrderRetrieve → SeatAvailability → OfferPrice → OrderChange → OrderChange(F) |
| | SQ, AY, TR, TK | OrderRetrieve → SeatAvailability → OrderQuote → OrderChange(F) |
| **Free seat** | LH, LX, OS, EK, AA, QR, HA, KE, TK, AS | OrderRetrieve → SeatAvailability → OrderChange |
| | AF, KL | OrderRetrieve → SeatAvailability → OfferPrice → OrderChange |
| | SQ, AY, TR | OrderRetrieve → SeatAvailability → OrderQuote → OrderChange |

---

## Amount Re-Calculate Button Exposed

| Carrier | Amount Re-Calculate Button | Call API |
|--------|:-------------:|----------|
| LH, LX, OS, EK, QR, HA, KE, AA | unExposed | - |
| AF, KL | Exposed | OfferPrice |
| SQ, AY | Exposed | OrderQuote |
| TK | Exposed (TotalAmount > 0 Case) | OrderQuote |

---

## Seat selection Button Behavior

| Carrier | Paid seat | Free seat |
|--------|----------|----------|
| LH, LX, OS, EK, HA, KE | OrderChange → BookingDetail Navigate | OrderChange → BookingDetail Navigate |
| AF, KL | OrderChange → PaymentInformation Popup | OrderChange → BookingDetail Navigate |
| QR, AA, SQ, AY, TR, TK | TotalAmount > 0: PaymentInformation Popup / TotalAmount = 0: OrderChange | OrderChange → BookingDetail Navigate |

---

## Purchase Confirmed Required Carrier

LH, LX, OS, EK Carrier first th after OrderChange Add OrderChange Required.

### Confirmed process
- StatusValue "HD" when PurchaseConfirmed Button Exposed
- PurchaseConfirmed when Click Payment information Popup → OrderChange(F) Call

### Per carrier StatusValue

| Status | LH, LX, OS, EK | KE, HA |
|------|----------------|--------|
| Carrier Response Pending | HN | REQUESTED |
| PurchaseConfirmed Available | HD | CONFIRMED |
| Purchase Confirmed Complete | HI, HK | CONFIRMED |

---

## SSR Information Display

### Display items

| Item | Display format | Example |
|------|----------|------|
| Carrier | 2Seat code | LH |
| Passengerperson | English property/given name (PTC) | MOON/CINDY (ADT) |
| SSR | Serviceperson + Information | Seat Reservation 43J |
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
| Seat Summary | Select Seat List |
| Amount Information | per Seat Amount and Total |
| Payment method | Cash/Card/Voucher Select |

### Button

| Button | Behavior |
|------|------|
| Payment&Issue | Payment after Progress Complete |
| Cancellation | Popup Close |
