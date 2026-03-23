# OrderRetrieve API-UI Mapping

> **API**: `POST /middleware/polarhub/order/retrieve`
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/booking/order-retrieve.md`
> **UI Guide**: `.claude/assets/ui-component-guide/04-booking-detail/booking-detail.md`, `07-popups/post-ticketing.md`

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |
| Date Format | `.claude/assets/ui-component-guide/02-common/date-format.md` |

---

## Key/Main UI Component

- **BookingDetail**: Booking detail All/Total Screen
- **PassengerCard**: Passenger information Card
- **ItineraryCard**: Journey information Card
- **TicketInfo**: Ticket Information (After ticketing)

---

## Header area Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| pnr | `Order.BookingReference[].Id` | AirlineID Criteria Filter |
| orderId | `Order.OrderID` | - |
| carrierCode | `Order.Owner` | - |
| status | `Order.OrderStatus` | - |
| statusLabel | `Order.OrderStatus` | HD→BookingPending, CONFIRMED→BookingComplete |
| paymentTL | `Order.PaymentTimeLimit` | ISO8601 → KST |
| ticketingTL | `Order.TicketTimeLimit` | ISO8601 → KST |
| isTicketed | `Order.TicketDocInfo` Exists Whether | boolean |

---

## Passenger information Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| paxId | `DataLists.PaxList[].PaxID` | - |
| ptc | `DataLists.PaxList[].Ptc` | ADT, CHD, INF |
| ptcLabel | `Ptc` | Adult, Child, Infant |
| fullName | `Individual.Surname/GivenName` | `${property}/${givenName}` |
| birthdate | `Individual.Birthdate` | YYYY-MM-DD |
| mobile | `ContactInfoList[].Phone[].PhoneNumber` | RefID Connection, Array Process Required |
| email | `ContactInfoList[].EmailAddress[]` | RefID Connection, Array Process Required |
| passport | `PaxList[].IdentityDoc[].IdentityDocumentNumber` | ⚠️ below Note |

### ⚠️ Passenger Contact/Passport Information Extract Precautions

**1. ContactInfoRefID Array Exists**
```typescript
// ⚠️ ContactInfoRefID to Array 올 Exists!
const contactRefIds = Array.isArray(pax.ContactInfoRefID)
 ? pax.ContactInfoRefID
 : pax.ContactInfoRefID ? [pax.ContactInfoRefID] : [];
```

**2. Phone/Email Separate ContactInfo Itemto Splitwill be Exists**
```json
// PolarHub Response Example - Phone and Email Separate ContactInfo!
{
 "ContactInfoList": [
 { "ContactInfoID": "CTCPAX2_1", "Phone": [{"PhoneNumber": 1040463947}], "EmailAddress": [] },
 { "ContactInfoID": "CTCPAX2_2", "Phone": [], "EmailAddress": ["test@example.com"] }
 ]
}
```

**3. Phone Array, PhoneNumber Number Type**
```typescript
// ⚠️ Phone Array! PhoneNumber Number Exists!
const phone = contactInfo?.Phone?.[0];
const mobile = phone?.PhoneNumber
 ? (phone.CountryDialingCode ? `+${phone.CountryDialingCode}-` : '') + String(phone.PhoneNumber)
 : undefined;
```

**4. EmailAddress string Array**
```typescript
// ⚠️ EmailAddress Object not string Array!
const email = Array.isArray(contactInfo?.EmailAddress)
 ? contactInfo.EmailAddress[0]
 : contactInfo?.EmailAddress?.EmailAddressValue;
```

**5. Passport Field name different**
| Expected Field | PolarHub Actual Field |
|----------|-------------------|
| `IdentityDocTypeCode` | `IdentityDocumentType` |
| `IdentityDocID` | `IdentityDocumentNumber` |

```typescript
// ⚠️ two types Field name All Check!
const passportDoc = pax.IdentityDoc?.find(doc =>
 doc.IdentityDocumentType === 'PT' || doc.IdentityDocumentType === 'PP' ||
 doc.IdentityDocTypeCode === 'PT' || doc.IdentityDocTypeCode === 'PP'
);
const passportNumber = passportDoc?.IdentityDocumentNumber || passportDoc?.IdentityDocID || '';
```

---

## Journey information Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| flightNumber | `MarketingCarrier.AirlineID + FlightNumber` | SQ608 |
| departureAirport | `PaxSegmentList[].Departure.AirportCode` | - |
| departureTime | `PaxSegmentList[].Departure.Time` | HH:mm |
| departureDate | `PaxSegmentList[].Departure.Date` | DD/MMM/YYYY |
| arrivalAirport | `PaxSegmentList[].Arrival.AirportCode` | - |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | HH:mm |
| cabinClass | `CabinType.Code` | Y→Economy class |
| baggage | `BaggageAllowance` | 23KG, 2PC |
| status | `OrderItem[].StatusCode` | HK, TK |

---

## Ticket Information Mapping (After ticketing)

| UI Field | API Path | Conversion |
|---------|----------|------|
| ticketNumber | `TicketDocInfo[].TicketDocNbr` | 13Seat |
| ticketType | `TicketDocInfo[].Type` | TICKET, EMD-A, EMD-S |
| passengerName | `PaxList[].Individual` | RefID Connection |
| totalFare | `TicketDocInfo[].Payment.TotalAmount` | - |

---

## Button Exposed Condition

```typescript
// Per carrier Feature Support
const carrierFeatures = {
 'AF': { infoChange: false, journeyChange: true },
 'KL': { infoChange: false, journeyChange: true },
 'SQ': { infoChange: true, journeyChange: true },
 'QR': { infoChange: true, journeyChange: true },
 'KE': { infoChange: true, journeyChange: true },
};

// Button Status
showPaymentButton: !isTicketed
showCancelButton: !isTicketed
showVoidRefundButton: isTicketed
```

---

## Status code Mapping

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

---

## Reference ID Connection

```
OrderItem[]
├── PaxRefID ──────────→ PaxList[].PaxID
├── PaxSegmentRefID ───→ PaxSegmentList[].PaxSegmentID
└── ServiceRefID ──────→ ServiceDefinitionList[]

PaxList[]
└── ContactInfoRefID ──→ ContactInfoList[].ContactInfoID
```

---

## 🔴 Fare Split Mapping (Air ticket vs Service)

### Core Concepts

OrderRetrieve from Response Air ticket Fare and Ancillary service Fee must Split .

| Distinction | OrderItem feature | FareDetail.PaxRefID | Price Position |
|------|---------------|---------------------|----------|
| Air ticket | FareDetail Exists | `["PAX8CEC1"]` (Passenger ID Exists) | FareDetail.BaseAmount |
| Ancillary service | Service Array Exists | `[]` (Empty array) | FareDetail.BaseAmount |

### ⚠️ Caution: Service Price Price not in FareDetail Exists!

```json
// Service OrderItem Example (Seat Add)
{
 "OrderItemID": "WC3159204-...",
 "Service": [{
 "SelectedSeat": {"Row": "4", "Column": "F"},
 "Definition": {"Name": "EXTRA COMFORT"}
 }],
 "FareDetail": [{
 "BaseAmount": {"Amount": 42700, "CurCode": "KRW"},
 "TaxTotal": {"Amount": 0, "CurCode": "KRW"},
 "PaxRefID": [] // ← Empty array! (Air ticket Passenger ID Exists)
 }]
}
```

### Implementation Logic

```typescript
// Service Fee Extract
const serviceCharges = (order.OrderItem || []).flatMap(item => {
 const services = item.Service || [];
 if (services.length === 0) return [];

 // ⭐ Service FareDetail find (PaxRefID emptyexists Thing)
 const serviceFareDetail = item.FareDetail?.find(fd =>
 !fd.PaxRefID || fd.PaxRefID.length === 0
 );

 const itemPrice = serviceFareDetail?.BaseAmount?.Amount || 0;
 const itemTaxes = serviceFareDetail?.TaxTotal?.Amount || 0;
 const totalServicePrice = itemPrice + itemTaxes;

 if (totalServicePrice === 0) return [];

 return services.map(service => ({
 label: service.Definition?.Name || service.ServiceID,
 amount: totalServicePrice / services.length,
 }));
});

// Air ticket Fare Extract (PaxRefID exists FareDetail)
const passengerBreakdown = (order.OrderItem || []).flatMap(item => {
 if (!item.FareDetail) return [];

 return item.FareDetail.flatMap(fd => {
 // ⭐ PaxRefID existsmust Air ticket!
 if (!fd.PaxRefID || fd.PaxRefID.length === 0) return [];
 if (fd.BaseAmount.Amount === 0) return [];

 return [{
 ptc: '...',
 baseFare: fd.BaseAmount.Amount,
 taxes: fd.TaxTotal.Amount,
 }];
 });
});
```

### Service Type definition

```typescript
Service?: Array<{
 ServiceID?: string;
 ServiceDefinitionRefID?: string;
 PaxRefID?: string;
 PaxSegmentRefID?: string;
 Status?: string;
 SelectedSeat?: { Column: string; Row: string }; // ⭐ Seat when selection
 Definition?: { Name?: string; Desc?: Array<{ Text?: string }> }; // ⭐ Service Definition
}>;
```

### Service Name Extract Priority

1. `service.Definition?.Name` - Service Object in Directly Include
2. `serviceDefMap.get(service.ServiceDefinitionRefID)?.Name` - from DataLists Reference
3. `service.ServiceID` - 마막 fallback

### UI Display Example

| Item | Amount |
|------|------|
| 1 Adult | 52,000 |
| Tax | 19,900 |
| **Air ticket Subtotal** | **71,900** |
| 4F EXTRA COMFORT (TURNE/BECKY) | 42,700 |
| **Total PaymentAmount** | **114,600** |
