# Booking detail

## Overview
Screen for viewing and managing specific booking (PNR) details.

**Key Features**:
- Carrier Real-Time Data Display (Not all items are required, so partial blanks are acceptable)
- Displayed data differs depending on ticketing status
- Most of Luna's features start from the booking detail page

---

## 1. Screen Entry Path

| Entry Method | Path |
|----------|------|
| PNR Search | Top Bar > PNR Search |
| Booking List | Top Bar > BookingManagement > BookingList > OrderID Click |
| OCN List | Top Bar > BookingManagement > OCNList > OrderID Click |
| DSR List | Top Bar > DSRList > OrderID Click |

---

## 2. Before ticketing Booking detail

Booking Detail Screen for bookings where ticketing is not yet completed.

### 2.1 Header area

| Item | Display format | Feature |
|------|----------|------|
| Carrier PNR | Text Button | When clicked, refreshes PNR and reloads the screen with the latest information |
| Cancel Button | Button | Proceeds with booking cancellation |
| BookingDetail Tab | Tab | Displays Carrier PNR, Tab can be closed with X Button |

**Tab Behavior Rules**:
- One PNR creates only one Tab
- When re-searching an already opened PNR, the existing Tab is refreshed and activated

### 2.2 OCN Information

OCN(Order Change Notification) receive history Display.

| Item | Description |
|------|------|
| Sort | Carrier OCN receive Date/Time Descending (Latest on top) |
| OCN Detail | ActionType (English), Context (Number) Display |
| Description | Carrier OCN's Remarks notes (blank if absent) |
| OCN Sync Button | Exposed only for supported carriers |

**OCN Sync Supported carriers**: AF, KL

### 2.3 Booking Information

| Item | Data Source | Display format |
|------|------------|----------|
| Carrier | Carrier Real-Time Data | 2-letter code |
| PNR | Carrier Real-Time Data | 6-character alphanumeric |
| Payment TL | Carrier Real-Time Data | YYYY-MM-DD HH:mm (KST) |
| Ticketing TL | Carrier Real-Time Data | YYYY-MM-DD HH:mm (KST) |
| Fare Guarantee TL | Carrier Real-Time Data | YYYY-MM-DD HH:mm (KST) |
| BookingDate/Time | Luna DB | YYYY-MM-DD HH:mm (KST) |
| BookingStatus | Luna DB | Status code |

**TimeLimit Display Rules**:
- If PaymentTL or TicketingTL has expired, the corresponding TL is hidden
- TL is blank for carriers that do not support it

**Feature Button**:
- 'Payment&Issue' Button: Proceeds with deferred payment and post-ticketing

### 2.4 Passenger information

| Item | Display format | Notes |
|------|----------|------|
| Sort | Adult(ADT) > Child(CHD) > Infant(INF) | Within the same PTC, sorted by PAX Number |
| TITLE | MR / MRS / MRTS / MISS | - |
| English Name | LASTNAME/FIRSTNAME | - |
| Date of Birth | YYYY-MM-DD | - |
| Mobile | Country Code + Number | Excludes Infant, LJ first Adult only |
| Email | Email address | Excludes Infant |
| APIS Information | Passport Information | Exposed only when entered at booking |
| Accompanying Infant | Infant English property/given name | Exposed on Adult Passenger |
| FFN Information | Mileage Number | Exposed only when entered at booking |

**Feature Button**:
- 'InformationChange' Button: Exposed only for supported carriers
- 'Passenger split' Button: Exposed only under specific conditions for supported carriers

### 2.5 Journey information

| Item | Display format | Example |
|------|----------|------|
| Sort | Segment Order Ascending | SEG1 > SEG2 > ... |
| Carrier | Marketing Carrier 2-letter code | KE, SQ |
| Flight number | CarrierCode + 4-digit | SQ608 |
| Departure | AirportCode + Time | ICN 09:30 |
| Arrival | AirportCode + Time | SIN 15:00 |
| Cabin Class | Name | Economy Class / Premium Economy Class / Business Class / First Class |
| Price Class / RBD | English FareCode | Y, M, L |
| Baggage | Count/Weight | 1PC, 23KG, 20KG(1PC) |
| Codeshare | Operating Carrier 2-letter code | OZ (blank if absent) |
| Hidden Stopover | Stopover AirportCode | NRT (blank if absent) |
| Journey/Itinerary Status | Carrier StatusCode | HK, TK |

**Feature Button**:
- 'Seat' Button: Seat selection Popup
- 'Service' Button: Ancillary service Purchase Popup
- 'Journey/ItineraryChange' Button: Exposed only for supported carriers

### 2.6 Payment Target Amount Information

Amount information that must be paid at ticketing. (Exposed only for PNRs that have only completed booking)

| Item | Display format | Notes |
|------|----------|------|
| Sort | Adult > Child > Infant | Within the same PTC, sorted by PAX Number |
| Passenger type | ADT / CHD / INF | - |
| Fare | Amount | KRW/USD, etc. |
| Tax | Amount | - |
| Total | Fare + Tax | - |

### 2.7 SSR Information

Displays Service Information included in the booking per Passenger and per Segment.

| Item | Display format | Notes |
|------|----------|------|
| Sort | ADT > CHD > INF | Within the same PTC, sorted by PAX Number |
| Segment | Journey/Itinerary Segment | ICN-SIN |
| SSR | Service Name | Carrier Data as-is |
| Status | IATA BookingCode | HK, HD, HI, etc. |

**Feature Button**:
- 'PurchaseConfirmed' Button: Exposed for carriers that require additional OrderChange

---

## 3. After ticketing Booking detail

Booking Detail Screen for ticketed bookings. Mostly the same as before ticketing, but the following items differ.

### 3.1 Header area Differences

| Item | Before ticketing | After ticketing |
|------|--------|--------|
| Cancellation Button | Cancel | VOID/REFUND |

### 3.2 Booking Information Differences

| Item | Before ticketing | After ticketing |
|------|--------|--------|
| TL Information | Exposed | Hidden |
| TicketingDate/Time | Hidden | Exposed (Luna DB) |
| Payment&Issue Button | Exposed | Hidden |

### 3.3 Ticket Information (Exposed only after ticketing)

| Item | Display format | Notes |
|------|----------|------|
| Sort | TICKET > EMDA > EMDS | By PTC, New > Original order |
| TicketNumber | 13-digit Number | Click to show TicketDetail Popup |
| TicketType | TICKET / EMDA / EMDS | - |
| EMDDetail | SSR Name | EMD Type only Exposed |
| Passenger | English full name | - |
| Segment | Segment | TICKET only Exposed |
| Total Fare | Amount | TICKET only Exposed |
| Fare Rules and Included Services | icon Button | Click to show Popup |

**Ticket Type Description**:
- **TICKET**: Air ticket
- **EMD-A (Associated)**: Ancillary service linked to an air ticket (Seat, Baggage, etc.)
- **EMD-S (Standalone)**: Standalone issued service (Re-Issue Fee, etc.)

**Re-Issue Ticket Rules**:
- 2 or more TICKET Type items for the same Passenger = Re-Issue history exists
- The lower ticket is the original ticket
- Original Ticket does not provide Segment, Total Fare, or Fare Rules information

---

## 4. Additional Information Popup

### 4.1 PNR History (Change history)

Exposed when the 'PNR History' Button in the Booking Information area is clicked.

| Item | Description |
|------|------|
| PNR Information | PNR Code, Carrier code, OrderID |
| Date/Time | Change Date/Time (KST), Sort changes on Click |
| Site | Channel/Site where the change occurred |
| User | Information about the user who made the change |
| User Role | Role of the user who made the change |
| Change Type | Type of change |

**Change Type list**:
- CREATE: Booking creation
- TICKETING: Ticketing
- CANCEL: Cancellation
- VOID: Void
- REFUND: Refund
- PAX_SPLIT: Passenger Split
- INFO_CHANGE: Information change
- JOURNEY_CHANGE: Journey change
- SEAT_PURCHASE: Seat purchase
- SERVICE_PURCHASE: Service purchase

### 4.2 Ticket Detail Popup

Exposed when TicketNumber in Ticket Information is clicked. Displays in different formats per Ticket Type.

#### TICKET Type

| Section | Display items |
|------|----------|
| TicketingInformation | Passenger Name, PNR, OrderID, TicketingDate/Time, Settlement Type |
| DetailInformation | Journey/Itinerary Information, FareBasis, Aircraft Type, Coupon Status |
| PaymentInformation | Base Amount, Tax Total, each TAX, Total Fare, Payment Method, Commission |

#### EMD-A Type

| Section | Display items |
|------|----------|
| TicketingInformation | Passenger Name, PNR, OrderID, TicketingDate/Time, Settlement Type |
| DetailInformation | Segment, EMDDetail(Ancillary Service Name), RelatedTicket(Linked Air ticket + Coupon Number) |
| PaymentInformation | Total Fare, Payment Method |

#### EMD-S Type

| Section | Display items |
|------|----------|
| TicketingInformation | Passenger Name, PNR, OrderID, TicketingDate/Time, Settlement Type |
| DetailInformation | Code, Service Detail, RelatedTicket |
| PaymentInformation | Total Fare, Payment Method |

### 4.3 Fare Rules and Included Services Popup

Exposed when the Ticket icon in Ticket Information is clicked.

| Section | Display items |
|------|----------|
| Fare information | Itinerary per fare component, FareBasis, Priceclass |
| Penalty Information | Change/Refund/No-show availability, Penalty amount per timing |
| Minimum Stay Information | Minimum/Maximum stay period (LHG, AA, EK, HA) |
| Included Services | Included service information per fare component (Text) |

---

## 5. Per carrier Support Feature

| Feature | AF/KL | SQ | QR | LH/LX/OS | EK | AA | KE | BA | TR | TK |
|------|:-----:|:--:|:--:|:--------:|:--:|:--:|:--:|:--:|:--:|:--:|
| PNR Retrieval | O | O | O | O | O | O | O | O | O | O |
| Post-ticketing | O | O | O | O | O | O | O | O | O | O |
| Cancel | O | O | O | O | O | O | - | O | O | O |
| VOID/REFUND | O | O | O | O | O | O | - | O | O | O |
| InformationChange | - | O | O | - | - | - | - | - | - | - |
| Passenger split | - | O | O | - | - | - | - | - | - | - |
| SeatPurchase | O | O | O | O | O | O | O | O | O | O |
| ServicePurchase | O | O | O | O | O | - | O | O | O | O |
| Journey/ItineraryChange | O | O | O | - | - | - | - | - | - | - |
| OCN Sync | O | - | - | - | - | - | - | - | - | - |

---

## 6. SSR Status code

| StatusCode | Meaning | Description |
|---------|------|------|
| HK | Holding Confirmed | Confirmed |
| HD | Holding Confirmed (EMD pending) | Purchase Confirmed Available Status |
| HI | Holding Confirmed (EMD Issued) | EMD Issue Complete |
| HN | Holding Needs | Confirm Required |
| HL | Holding List | Pending List |
| UC | Unable to Confirm | Cannot Confirm |
| UN | Unable | Cannot Process |

---

## 7. API Information

### Booking detail retrieval

```
Endpoint: /luna/v1/ndc/order/retrieve
Method: POST
```

**Key Response Field**:

| Field | Description |
|------|------|
| OrderViewRS.Order.BookingReferences | PNR Information |
| OrderViewRS.Order.OrderItems | Journey/Itinerary and Service Information |
| OrderViewRS.DataLists.PassengerList | Passenger information |
| OrderViewRS.DataLists.FlightSegmentList | Segment Detail |
| OrderViewRS.TicketDocInfos | Ticket Information (After ticketing) |

### PNR Change history Retrieval

```
Endpoint: /luna/v1/management/order/pnr-change-history
Method: GET
Parameters: orderId, pnr
```

---

## 8. UI Process Guide

### Data Loading
- Calls real-time retrieval API when entering booking detail
- Displays loading spinner during retrieval
- Provides error message and Retry Button on retrieval failure

### Data Refresh
- Refreshes to latest information when PNR text is clicked
- Displays loading while maintaining existing data during refresh

### Per carrier Button Exposure
- Hides buttons for unsupported features
- Determines support based on carrier code from API response

### Error handling
- Cancelled PNR retrieval: Displays "Cancelled Booking" message
- No retrieval permission: Displays "No retrieval permission." message
- No carrier response: Displays "Unable to receive carrier response" message

---

## 9. Related documents

- [Payment Popup](../03-booking/payment-popup.md) - Post-ticketing Payment
- [Seat Popup](../07-popups/seat-popup.md) - Seat purchase
- [Service Popup](../07-popups/service-popup.md) - Ancillary service Purchase
