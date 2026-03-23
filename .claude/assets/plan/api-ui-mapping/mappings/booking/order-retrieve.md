# OrderView (Retrieve) API-UI Mapping

> API: `POST /middleware/polarhub/order/retrieve`
> Response: `OrderViewRS`

---

## Response Structure Overview

```
OrderViewRS
├── ResultMessage
├── Recipient
├── PointOfSale
├── TransactionID
├── Order
│ ├── OrderID
│ ├── Owner
│ ├── OrderStatus
│ ├── BookingReference[] # PNR Information
│ │ ├── AirlineID
│ │ └── Id
│ ├── OrderItem[] # Journey/Itinerary/Service Item
│ ├── TotalPrice
│ ├── TicketDocInfo[] # Ticket Information (After ticketing)
│ ├── PaymentTimeLimit
│ └── TicketTimeLimit
└── DataLists
 ├── PaxSegmentList[] # Segment Detail
 ├── PaxList[] # Passenger information
 ├── ContactInfoList[] # Contact
 └── ...
```

---

## 1. Header area Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| pnr | `Order.BookingReference[].Id` (AirlineID Criteria) | - | Carrier PNR |
| orderId | `Order.OrderID` | - | Luna OrderID |
| carrierCode | `Order.Owner` | - | 2Seat code |
| cancelButtonLabel | `Order.TicketDocInfo` Exists Whether | Ticketingbefore: Cancel, Ticketingafter: VOID/REFUND | - |

---

## 2. Booking Information (BookingInfo) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| carrierCode | `Order.Owner` | - | - |
| carrierName | `Order.Owner` → carrierMap | Conversion | Koreanperson |
| pnr | `Order.BookingReference[].Id` | to AirlineID Filter | - |
| status | `Order.OrderStatus` | - | HD, CONFIRMED, etc. |
| statusLabel | `Order.OrderStatus` → statusMap | Conversion | Koreanperson |
| paymentTL | `Order.PaymentTimeLimit` | ISO8601 → KST | YYYY-MM-DD HH:mm |
| ticketingTL | `Order.TicketTimeLimit` | ISO8601 → KST | YYYY-MM-DD HH:mm |
| isTicketed | `Order.TicketDocInfo` Exists Whether | boolean | - |
| showPaymentButton | `!isTicketed && paymentTL` | Condition Calculate | Before ticketing only |

---

## 3. Passenger information (PassengerInfo) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| paxList[].paxId | `DataLists.PaxList[].PaxID` | - | PAX1, PAX2 |
| paxList[].ptc | `DataLists.PaxList[].Ptc` | - | ADT, CHD, INF |
| paxList[].ptcLabel | `Ptc` → ptcMap | Conversion | Adult, Child, Infant |
| paxList[].title | `DataLists.PaxList[].Individual.NameTitle` | - | MR, MS, etc. |
| paxList[].property | `DataLists.PaxList[].Individual.Surname` | - | English property |
| paxList[].givenName | `DataLists.PaxList[].Individual.GivenName[0]` | firstth | English Name |
| paxList[].fullName | Calculate | `${property}/${givenName}` | - |
| paxList[].birthdate | `DataLists.PaxList[].Individual.Birthdate` | - | YYYY-MM-DD |
| paxList[].mobile | `DataLists.ContactInfoList[].Phone.PhoneNumber` | ContactInfoRefID Connection | - |
| paxList[].email | `DataLists.ContactInfoList[].EmailAddress.EmailAddressValue` | ContactInfoRefID Connection | - |

---

## 4. Journey information (ItineraryInfo) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| itineraryList[].segmentNo | Index + 1 | Calculate | 1, 2, 3... |
| itineraryList[].carrierCode | `DataLists.PaxSegmentList[].MarketingCarrier.AirlineID` | - | - |
| itineraryList[].flightNumber | `MarketingCarrier.AirlineID` + `FlightNumber` | Combination | SQ608 |
| itineraryList[].departureAirport | `DataLists.PaxSegmentList[].Departure.AirportCode` | - | - |
| itineraryList[].departureTime | `DataLists.PaxSegmentList[].Departure.Time` | HH:mm Extract | - |
| itineraryList[].departureDate | `DataLists.PaxSegmentList[].Departure.Date` | DD/MMM/YYYY | Format Conversion |
| itineraryList[].arrivalAirport | `DataLists.PaxSegmentList[].Arrival.AirportCode` | - | - |
| itineraryList[].arrivalTime | `DataLists.PaxSegmentList[].Arrival.Time` | HH:mm Extract | - |
| itineraryList[].cabinClass | `DataLists.PaxSegmentList[].CabinType.Code` | cabinMap Conversion | - |
| itineraryList[].priceClass | `Order.OrderItem[].FareDetail.FareComponent.PriceClass` | - | Y, M, L |
| itineraryList[].baggage | `Order.OrderItem[].FareDetail.BaggageAllowance` | Format Conversion | 23KG, 2PC |
| itineraryList[].codeShare | `DataLists.PaxSegmentList[].OperatingCarrier.AirlineID` | 마케ting != when Operation | - |
| itineraryList[].status | `Order.OrderItem[].StatusCode` | - | HK, TK |

---

## 5. Payment Target Amount (PaymentAmount) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| paymentInfo[].paxId | `Order.OrderItem[].PaxRefID` | - | - |
| paymentInfo[].ptc | `DataLists.PaxList[].Ptc` | PaxRefID Connection | - |
| paymentInfo[].baseFare | `Order.OrderItem[].Price.BaseAmount.Amount` | - | - |
| paymentInfo[].taxes | `Order.OrderItem[].Price.Taxes.TotalAmount.Amount` | - | - |
| paymentInfo[].totalFare | Calculate | baseFare + taxes | - |
| paymentInfo[].currency | `Order.OrderItem[].Price.BaseAmount.CurCode` | - | - |
| grandTotal | `Order.TotalPrice.TotalAmount.Amount` | - | All/Total Total |

---

## 6. SSR Information (SsrInfo) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| ssrList[].paxId | `Order.OrderItem[].PaxRefID` | Service Item only | - |
| ssrList[].paxName | `DataLists.PaxList[].Individual` | PaxRefID Connection | property/person (PTC) |
| ssrList[].segment | `Order.OrderItem[].PaxSegmentRefID` → Segment Combination | - | ICN-SIN |
| ssrList[].ssrName | `Order.OrderItem[].Service.ServiceDefinition.Name` | - | Seat 10A |
| ssrList[].status | `Order.OrderItem[].StatusCode` | - | HK, HD, HI |
| ssrList[].statusLabel | `StatusCode` → statusMap | Conversion | Koreanperson |
| showPurchaseConfirmButton | in ssrList HD Status Exists | boolean | LH, EK, etc. |

---

## 7. Ticket Information (TicketInfo) Mapping - After ticketing

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| ticketList[].ticketNumber | `Order.TicketDocInfo[].TicketDocument.TicketDocNbr` | - | 13Seat |
| ticketList[].ticketType | `Order.TicketDocInfo[].Type` | - | TICKET, EMD-A, EMD-S |
| ticketList[].ticketTypeLabel | Type → typeMap | Conversion | Koreanperson |
| ticketList[].emdDetail | `Order.TicketDocInfo[].ServiceDescription` | EMD only | SSRperson |
| ticketList[].passengerName | `DataLists.PaxList[].Individual` | PaxRefID Connection | - |
| ticketList[].segments | `Order.TicketDocInfo[].CouponInfo[].SegmentKey` | Segment Combination | TICKET only |
| ticketList[].totalFare | `Order.TicketDocInfo[].Payment.TotalAmount.Amount` | - | TICKET only |
| ticketList[].isOriginal | `Order.TicketDocInfo[].IsOriginal` or Order | - | Re-Issue Judgment |

---

## 8. Button Exposed Condition

```typescript
// Per carrier Support Feature
const carrierFeatures = {
 'AF': { infoChange: false, paxSplit: false, journeyChange: true, ocnAgree: true },
 'KL': { infoChange: false, paxSplit: false, journeyChange: true, ocnAgree: true },
 'SQ': { infoChange: true, paxSplit: true, journeyChange: true, ocnAgree: false },
 'QR': { infoChange: true, paxSplit: true, journeyChange: true, ocnAgree: false },
 // ... Other Carrier
};

function getButtonVisibility(carrierCode: string, isTicketed: boolean) {
 const features = carrierFeatures[carrierCode] || {};

 return {
 showInfoChangeButton: features.infoChange || false,
 showPaxSplitButton: features.paxSplit || false,
 showJourneyChangeButton: features.journeyChange || false,
 showOcnAgreeButton: features.ocnAgree || false,
 showPaymentButton: !isTicketed,
 showCancelButton: !isTicketed,
 showVoidRefundButton: isTicketed
 };
}
```

---

## 9. Status code Mapping

### Booking Status (OrderStatus)

| Code | Korean | Description |
|------|------|------|
| HD | BookingPending | Hold Status |
| CONFIRMED | BookingComplete | Booking Confirmed |
| TICKETED | TicketingComplete | Ticketing complete |
| CANCELLED | Cancellation | Booking cancellation |

### SSR Status (StatusCode)

| Code | Korean | Description |
|------|------|------|
| HK | Confirmed | Holding Confirmed |
| HD | ConfirmedPending | EMD pending |
| HI | IssueComplete | EMD Issued |
| HN | ResponsePending | Holding Needs |

---

## 10. Reference ID Connection

```
Order
├── OrderItem[]
│ ├── PaxRefID ─────────────────→ DataLists.PaxList[].PaxID
│ ├── PaxSegmentRefID ──────────→ DataLists.PaxSegmentList[].PaxSegmentID
│ └── Service
│ └── ServiceDefinitionRefID → DataLists.ServiceDefinitionList[].ServiceDefinitionID
│
└── TicketDocInfo[]
 ├── PaxRefID ─────────────────→ DataLists.PaxList[].PaxID
 └── CouponInfo[].SegmentKey ──→ DataLists.PaxSegmentList[].PaxSegmentID

DataLists.PaxList[]
└── ContactInfoRefID ─────────────→ DataLists.ContactInfoList[].ContactInfoID
```
