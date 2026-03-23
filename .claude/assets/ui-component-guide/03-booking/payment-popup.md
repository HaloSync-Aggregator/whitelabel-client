# Payment information Popup

## Overview
Journey/Itinerary after Select Passenger information Inputand Payment Progress Popup.

---

## Popup Composition

| Section | Description |
|------|------|
| Passenger information | per Passenger Detail Information Input |
| Amount Information | Aviation료 + Ancillary service Amount |
| Payment information | Payment Method Select |

---

## 1. Passenger information Input

### Required Input Item

| Item | Input Format | Description |
|------|----------|------|
| Title/Honorific | Select | MR/MS/MSTR/MISS |
| English property | Text | Passport and Same Uppercase |
| English person | Text | Passport and Same Uppercase |
| Date of Birth | DateSelect | YYYY-MM-DD |
| Contact | Text | CountryNumber + PhoneNumber |
| Email | Text | Email Format |

### Select Input Item

| Item | Condition | Description |
|------|------|------|
| PassportNumber | un주 Route Required | Number Combination |
| PassportIssue국 | un주 Route Required | Country Select |
| PassportExpiry date | un주 Route Required | YYYY-MM-DD |
| -like | un주 Route Required | Country Select |
| 거주Country | Select | Country Select |
| Mileage Number | Select | Log Select + Number Input |

### tableContact Feature

| Condition | Description |
|------|------|
| Exposed Condition | Adult/Child Passenger 2 Or more |
| Behavior | when Check Corresponding Passenger's Contact All/in Total Applied |

---

## 2. Amount Information

### Display items

| Item | Description |
|------|------|
| Aviation료 | Passenger per type Fare + Tax |
| Ancillary service | Seat, Baggage, etc. Select Service Amount |
| Total PaymentAmount | All/Total Total |

### Tax Detail
- Information icon(i) when Click Tax per Item Detail Amount Display

---

## 3. Payment information

### Payment Method

| Method | Description |
|------|------|
| ImmediatelyPayment | Booking and in Concurrent Payment and Ticketing |
| laterPayment | Booking only Create (within Deadline Payment Required) |

### Payment method (ImmediatelyPayment time)

| 수only | Description |
|------|------|
| Cash | Cash Payment (BSP CA) |
| Card | 신for/CheckCard Payment (CC) |
| Voucher | Voucher Number Input (AF/KL only Support) |

---

## 4. Per carrier Payment method Support 현황

### FOP (Form of Payment) Support Item

| Carrier | Cash (CA) | Card (CC) | 3DS 2.0 | Voucher | Notes |
|--------|:--------:|:--------:|:-------:|:------:|------|
| LH | O | O | X | X | BSP specific산 |
| AA | O | O | X | X | BSP specific산 |
| EK | O | O | X | X | BSP specific산 |
| HA | O | O | O | X | 3DS Support, KRW Payment Available |
| BA | O | O | O | X | 3DS 1.0/2.0 Support |
| SQ | O | O | MOTO | X | MOTO Method Support |
| QR | O | O | O | X | JCB unSupport |
| AF/KL | O | O | X | O | Voucher Payment Support |
| AY | O | e.g.specific | X | X | 2025년 말 CC e.g.specific |
| TR | X | O | O | X | Master Card only MOTO Support |
| KE | O | O | O | X | 할section Support, ARS authentication Required |
| TK | O | O | X | X | PCI-DSS Required |
| AS | O | O | X | X | out Approval (환 Occurs Available) |

### Card Payment Detail Information

#### Payment Currency
- **POS Currency Criteria**: LH, AA, EK, HA, SQ, QR, AF/KL, AY, KE, TK (POS KR = KRW)
- **POO Currency Criteria**: TR (Departure ICN = KRW)
- **out Approval**: AS (KRW이 only 환 Occurs Available)

#### Per carrier Special notes

| Carrier | 할section | Card Auto Refund | Support Card |
|--------|:----:|:--------------:|-----------|
| HA | X | O | Visa, Master, Amex, JCB, DC, UATP |
| SQ | X | X (manual Process) | Confirm Required |
| QR | X | O | Visa, Master, Amex, DC, UATP |
| AF/KL | X | O | Visa, Master, Amex, etc. out Payment Available Card |
| TR | X | X | Amex, JCB, Visa, Master |
| KE | O | O | 국in Card (현, BC, KB, 하나, 삼property, 신, 롯데, 농협) |
| TK | X | O | Amex |
| AS | X | O | Visa, Master, Discover, DC, UATP |

### Card Payment Input Item

| Item | Required Whether | Description |
|------|:--------:|------|
| Card Type | O | Visa, Master, Amex, etc. |
| Cardholder Name | O | English Name |
| Card Number | O | 16Seat CardNumber |
| 보not Code (CVV) | O | 3~4Seat |
| Expiry date | O | MM/YY |
| 할section itemsmonth | △ | KE only Support |

---

## 5. Button

| Button | Payment Method | Behavior |
|------|----------|------|
| Payment&Issue | ImmediatelyPayment | Payment after Progress Booking Complete Navigate to page |
| Booking | laterPayment | Booking after creation Booking Complete Navigate to page |
| Cancellation | - | Popup Close |

---

## 6. InputValue Verify

### Required Item Verify
- Title/Honorific unSelect time: "Title/Honorific Select."
- English property unInput time: "English property Input."
- English person unInput time: "English person Input."
- Date of Birth unInput time: "Date of Birth Input."
- Contact unInput time: "Contact Input."
- Email unInput time: "Email Input."
- Email Format Error time: "Correct Email Format Input."

### Passport Information Verify (un주 Route)
- PassportNumber unInput time: "PassportNumber Input."
- PassportIssue국 unSelect time: "PassportIssue국 Select."
- PassportExpiry date unInput time: "PassportExpiry date Input."
- -like unSelect time: "Nationality Select."
