# Post-ticketing (Delayed Ticketing)

## Overview
Booking only Progress in PNR About in after Payment and Ticketing Progress Feature.
Booking detail from Page Payment (Payment TL) within in Ticketing must Complete .

---

## 1. 진입 Path

Booking detail > Booking Information Section > **Payment&Issue** Button

---

## 2. Supported carriers

| Carrier | Fare recalculation API | Payment method | Notes |
|--------|:-------------:|----------|------|
| LH, LX, OS | OrderReshop | Cash | Lufthansa Group |
| EK | OrderReshop | Cash | 에un레이트 |
| QR | OrderReshop | Cash | Qatar Airways |
| BA | OrderReshop | Cash | 국Aviation |
| AA | OrderReshop | Cash | 아메리칸Aviation |
| KE | OrderQuote | Cash, Credit Card | Korean Air |
| HA | OrderQuote | Cash, Credit Card | Hawaiian Airlines |
| SQ | OrderQuote | Cash | Singapore Airlines |
| AY | OrderQuote | Cash | 핀에 |
| AF, KL | - | Cash, Voucher | Fare recalculation None |
| TR | - | AGT | Scoot |

---

## 3. Screen Composition

### Payment&Issue Button

| Condition | Display |
|------|------|
| Booking only Status | Button activationpropertyconversion |
| PaymentTL Exceed | Button 비activationpropertyconversion or unExposed |
| Already Ticketing | Button unExposed |

---

## 4. Post-ticketing Flow

### Case 1: Fare recalculation Required Carrier

```
Payment&Issue Button → OrderReshop/OrderQuote → Difference Confirm → PaymentInformation Popup → OrderChange(F)
```

**Target Carrier**: LH, LX, OS, EK, QR, BA, AA, KE, HA, SQ, AY

### Case 2: Fare recalculation not required Carrier

```
Payment&Issue Button → PaymentInformation Popup → OrderChange(F)
```

**Target Carrier**: AF, KL, TR, AS

---

## 5. Difference Information Popup

Booking point in time and Ticketing point in time's Fare 다 Case Display.

### Display items

| Item | Description |
|------|------|
| Existing fare | Booking point in time Fare |
| New fare | Current point in time Fare |
| Difference | New - Existing |

### Difference when Occurs

- 상 Amount: 빨간colorto Display
- User after Confirm PaymentInformation Popupto Navigate

---

## 6. PaymentInformation Popup

### Section Composition

| Section | Content |
|------|------|
| Journey information | Booking Flight Information |
| Passenger information | Passenger List and Detail |
| Payment Target Amount | Air ticket + Ancillary service Amount |
| Payment information | Payment method Select |

---

### Journey information

| Item | Display format | Example |
|------|----------|------|
| Carrier | 2Code | LH, SQ |
| Flight number | 4Seat | 0713 |
| Departure/Arrival | AirportCode | ICN → MUC |
| Departure/Time | DD/MMM/YYYY HH:mm | 17/JUL/2023 11:35 |
| RBD | Uppercase | Z, P |
| FareBasis | Code | J12KRO |
| SeatClass | Korean | Economy class, Business class |
| PriceClass | English | Basic, Flex |
| Baggage | Count/Weight | 23KG, 2PC |

---

### Passenger information

| Item | Display format | Notes |
|------|----------|------|
| 순번 | Number | 1, 2, 3... |
| TITLE | Text | MR, MS, etc. |
| Passengerperson(PTC) | property/person (PTC) | MOON/CINDY (ADT) |
| Date of Birth | DD/MMM/YYYY | 21/FEB/1988 |
| mobile | CountryNumber+Number | +82-10-1234-5678 |
| Email | Text | test@abc.com |
| PassportInformation | Option | Data exists Case only Display |
| AccompanyingInfant | Option | Infant exists Case only Display |

---

### Payment Target Amount

#### Case 1: Air ticket

| Item | Description |
|------|------|
| Passengerperson(PTC) | per Passenger Distinction |
| Item | Flight |
| Segments | per Segment Information |
| BaseAmount | 순수 Fare |
| TotalTax | Tax Totalamount |
| TotalFare | per Passenger Totalamount |
| Grand TotalFare | All/Total Total |

#### Case 2: Ancillary service Include

| Item | Description |
|------|------|
| Item | Flight, Seat, Baggage, etc. |
| Service Detail | SeatNumber, Baggage Weight, etc. |

---

### Payment method

| Payment method | Carrier | RQ Type |
|----------|--------|---------|
| Cash | partial | "Cash" |
| Credit Card | KE, HA | "Card" |
| AGT | TR | "AG" |
| Voucher | AF, KL | 혼합Payment Available |

---

## 7. API Flow

### Per carrier API Call

| Carrier | Payment&Issue Click | Confirm Button | Payment&Issue (Popup) |
|--------|---------------|----------|----------------|
| LH, LX, OS, EK, QR, BA, AA | OrderReshop | - | OrderChange(F) |
| KE, HA, SQ, TK | OrderQuote | - | OrderChange(F) |
| AY | OrderQuote | OrderChange | OrderChange(F) |
| AF, KL, TR, AS | - | - | OrderChange(F) |

### API Detail

| API | Purpose |
|-----|------|
| OrderReshop | Fare recalculation (18.x Version) |
| OrderQuote | Fare recalculation (21.3 Version) |
| OrderChange | Booking Change (Payment without) |
| OrderChange(F) | Payment and Ticketing Request |

---

## 8. OrderChange(F) RQ ting

### Common ting

| Element | Description |
|---------|------|
| OrderID | Booking OrderID |
| PaymentList/Type | Payment method |
| PaymentList/Amount | Payment Amount |
| PaymentList/CurCode | Currency Unit |
| PaymentList/OrderItemID | Payment Target OrderItem |

### Per carrier Special notes

| Carrier | Special notes |
|--------|---------|
| AY | in AcceptRepricedOrder OfferRefID emptyArray |
| AF, KL, TR | in OfferRefID OrderID ting Required |
| TK | BookingInstructions ting Required |

---

## 9. UI Process Guide

### PaymentTL Management

| Status | Display |
|------|------|
| TL valid | Payment&Issue Button activationpropertyconversion |
| TL Is박 | Warning Message Display |
| TL Exceed | Button 비activationpropertyconversion or unExposed |

### Amount Display

| Item | Color |
|------|------|
| 상 Amount | 빨간color |
| General Amount | 검specificcolor |
| TotalFare | row All/Total 하even if이트 |

### AY Confirm Button

- AY Carrier only Payment information Section in 옆 "Confirm" Button Exposed
- Confirm Button when click OrderChange Call
- after Payment&Issue Buttonto OrderChange(F) Call

---

## 10. Precautions

1. **PaymentTL comply**: TL when Exceed Booking Auto Cancellation Available
2. **Fare variation**: Booking point in time and Ticketing point in time Fare 다 Exists
3. **Ancillary service**: Post-when ticketing Ancillary service Doestogether Payment Available (Per carrier)
4. **Credit Card**: ARS authentication Required Case Exists (KE)

---

## 11. Error handling

| Error scenarios | Process |
|----------|------|
| TL Exceed | "Payment time Exceed" |
| Fare recalculation Failure | Error message Display |
| Payment failed | Retry Guide |
| Already Ticketing | "Already Ticketing Booking" |

---

## Related documents

- [Booking detail](../04-booking-detail/booking-detail.md)
- [Payment Popup](../03-booking/payment-popup.md)
- [Fare Confirm](../03-booking/offer-price.md)
