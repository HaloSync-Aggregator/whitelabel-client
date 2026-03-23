# SeatAvailability API-UI Mapping

> **API**: `POST /middleware/polarhub/seat-availability`
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/booking/seat-availability.md`
> **UI Guide**: `.claude/assets/ui-component-guide/07-popups/seat-popup.md`

## Template Reference

| Classify | Template Path |
|------|-------------|
| Type definition | `templates/types/seat.types.ts.template` |
| Service Function | `src/lib/api/polarhub-service.ts (getSeatAvailability)` |
| Transformer | `templates/lib/seat-transformer.ts.template` |
| SeatMap | `templates/components/seat/SeatMap.tsx.template` |
| SeatSelector | `templates/components/seat/SeatSelector.tsx.template` |
| SeatLegend | `templates/components/seat/SeatLegend.tsx.template` |

---

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |

---

## Key/Main UI Component

- **SeatMap**: Seat map
- **SeatLegend**: Seat legend
- **SelectedSeatSummary**: Select Seat Summary

---

## Seat map Mapping

### column Information (Columns)

| UI Field | API Path |
|---------|----------|
| columns[] | `SeatMap[].Cabins[].Columns[].Designation` |
| position | `Columns[].Position` (L, C, R) |

### row Information (Rows)

| UI Field | API Path |
|---------|----------|
| rowNumber | `RowInfo[].Number` |
| seats[] | `RowInfo[].Seats[]` |

---

## Individual Seat Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| seatNumber | `Row.Number + Seat.Column` | 10A, 15C |
| availability | `Seat.SeatStatus` | - |
| seatType | `Seat.SeatCharacteristics[]` | Classify Logic |
| characteristics | `SeatCharacteristics[]` | Window, Aisle |
| price | `ALaCarteOfferItem[].UnitPrice` | OfferItemRefID Connection |
| currency | `UnitPrice.TotalAmount.CurCode` | - |

---

## Seat Status Mapping

### SeatStatus Criteria

| API Value | UI availability | Selectable | Description |
|--------|-----------------|:--------:|------|
| T, O | occupied | X | occupied Seat |
| R, 1, Z | restricted | X | Limit Seat |
| N, N/A | noSeat | X | Seat None (through/conversion장실) |
| otherwise (A, F, VACANT, etc.) | available | O | Selectable |

### SeatCharacteristics Criteria

| Code | 의un | Notes |
|------|------|------|
| R, 1, Z | Restricted | SeatStatus and irrelevant Limit Process |
| W | Window | 창석 |
| A | Aisle | through로석 |
| E | Exit Row | exit row석 |
| L, LS | Leg Space | legroom |
| K | Bulkhead | 격벽 앞 |
| CH | Chargeable | Paid seat |
| B | Bassinet | for Infant |
| I | Infant facility | Infant 설 |

---

## Seat Type Classify

```typescript
function classifySeatType(characteristics: string[]): string {
 // Extra Legroom
 if (chars.includes('EXTRA LEGROOM') || chars.includes('E')) {
 return 'extraLegroom';
 }
 // Preferred
 if (chars.includes('PREFERRED') || chars.includes('P')) {
 return 'preferred';
 }
 // Exit Row
 if (chars.includes('EXIT') || chars.includes('X')) {
 return 'exitRow';
 }
 return 'standard';
}
```

---

## Seat legend

| type | label | color |
|------|-------|-------|
| standard | General Seat | #4CAF50 |
| preferred | preferred Seat | #2196F3 |
| extraLegroom | legroom Seat | #9C27B0 |
| exitRow | exit row Seat | #FF9800 |
| occupied | occupied Seat | #757575 |

---

## Seat Price Connection

```
Seat.OfferItemRefID → ALaCarteOfferItem[].OfferItemID
 └── UnitPrice.TotalAmount
 ├── Amount → price
 └── CurCode → currency
```

---

## Per carrier Process

### Amount Re-Calculate Required

| Carrier | Whether needed | API |
|--------|:--------:|-----|
| LH, LX, OS, EK, QR | X | - |
| AF, KL | O | OfferPrice |
| SQ, AY, TK | O | OrderQuote |

### Purchase Confirmed Required

| Carrier | Status Flow |
|--------|----------|
| LH, LX, OS, EK | HN → HD → HI |
| Other | HK (to Bar Confirmed) |

---

## Subsequent API Connection

### SeatAvailability from Response ResponseID Process

**⚠️ Important**: SeatAvailability in Response `ResponseID` absent Case Exists

```typescript
// ResponseID fallback Logic
const seatResponseId = seatData._apiData.responseId || seatData._apiData.offerId;
```

- in SeatRS `ResponseID` if exists Use
- if absent `OfferID` `responseId`로 Use (fallback)

---

## Seat purchase Flow

### Prime Booking (when Booking Seat purchase)

```
OfferPrice Complete → SeatAvailability (offer Field) → [OrderQuote] → OrderCreate
```

**SeatAvailability Request (Prime Booking):**
```typescript
{
 transactionId: string;
 offer: {
 responseId: string; // OfferPrice from the response ResponseID
 offerId: string; // Select OfferID
 owner: string; // Carrier code
 offerItems: Array<{
 offerItemId: string;
 paxRefId: string[];
 }>;
 };
 paxList: Array<{
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 }>;
}
```

### Post-Booking (Booking/After ticketing Seat Add)

```
OrderRetrieve → SeatAvailability (order Field) → [OrderQuote/OfferPrice] → OrderChange
```

**SeatAvailability Request (Post-Booking):**
```typescript
{
 transactionId: string;
 order: {
 orderId: string; // order ID
 owner: string; // Carrier code
 };
 paxList: Array<{
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 }>;
}
```

---

## UI Component Structure

```
SeatSelector (Main Container)
├── Header (Close Button)
├── Segment Tab (Multi-city Case)
├── Passenger Select Buttons
├── SeatMap (Seat map)
│ ├── cabin Header (Economy class/Business class)
│ ├── column Header (A, B, C...)
│ └── Seat 행s
│ ├── 행Number
│ └── SeatButtons
├── SeatLegend (legend)
├── Select Seat Summary
└── Bottom Button (Cancellation/SelectComplete)
```

---

## Select Seat Data Structure

```typescript
interface SelectedSeat {
 paxId: string; // Passenger ID
 passengerName: string; // Passenger Name
 passengerType: string; // ADT, CHD, INF
 segmentId: string; // Segment ID
 segmentNo: number; // Segment Number
 flightNumber: string; // Flight number
 seatNumber: string; // SeatNumber (10A)
 seatType: SeatType; // standard, preferred, extraLegroom, exitRow
 seatTypeLabel: string; // Korean Label
 price: number; // Price
 currency: string; // Currency
 offerItemId: string; // API for Reference OfferItemID
}
```

---

## Per carrier Booking Seat purchase Flow

### Flow Distinction

| Workflow | Carrier | API Flow | Offer/Order Structure |
|----------|--------|----------|------------------|
| **WF_PB_SEAT** | SQ, AY, TK, QR, HA, etc. | OfferPrice → SeatAvailability → OrderCreate | Separate entry |
| **WF_PB_SEAT_REPRICE** | AF, KL, TR | OfferPrice → SeatAvailability → **OfferPrice** → OrderCreate | Separate entry |

> **⭐ Important**: two Flow All Journey/Itinerary and Seat **Separate Offer/Order entry**로 must Split !

---

## OfferPrice RQ Structure (WF_PB_SEAT_REPRICE)

### Correct Structure - separate offer entries

```json
{
 "Query": {
 "Offers": [
 {
 // 1. Journey/Itinerary Offer (OfferPrice Response Criteria)
 "OfferID": "Journey/Itinerary_OfferID",
 "Owner": "AF",
 "ResponseID": "OfferPrice_ResponseID",
 "OfferItems": [
 { "OfferItemID": "Journey/Itinerary_OI", "PaxRefID": ["PAX1", "PAX2"] }
 ]
 },
 {
 // 2. Seat Offer (SeatAvailability Response Criteria) - Separate!
 "OfferID": "Seat_OfferID",
 "Owner": "AF",
 "ResponseID": "SeatAvailability_ResponseID",
 "OfferItems": [
 { "OfferItemID": "SEAT_OI_1", "PaxRefID": ["PAX1"], "SeatSelection": { "Column": "A", "Row": "23" } },
 { "OfferItemID": "SEAT_OI_2", "PaxRefID": ["PAX2"], "SeatSelection": { "Column": "B", "Row": "23" } }
 ]
 }
 ],
 "PaxList": [...]
 }
}
```

### Wrong Structure - 하나's in Offer 합침 (❌)

```json
{
 "Query": {
 "Offers": [
 {
 "OfferID": "...",
 "ResponseID": "...",
 "OfferItems": [
 { "OfferItemID": "Journey/Itinerary_OI", "PaxRefID": ["PAX1"] },
 { "OfferItemID": "SEAT_OI", "SeatSelection": {...} } // ❌ Same in Offer 합치when !
 ]
 }
 ]
 }
}
```

---

## when OrderCreate Seat Include Structure

### Case 1: WF_PB_SEAT (SQ, etc.) - Separate order entry

```typescript
// Carrier: SQ, AY, TK, QR, HA etc.
orders: [
 // 1. Journey/Itinerary Order (OfferPrice Response Criteria)
 {
 responseId: OfferPrice.responseId,
 offerId: OfferPrice.offerId,
 owner: "SQ",
 offerItems: [
 { offerItemId: "OI1", paxRefId: ["PAX1"] },
 { offerItemId: "OI2", paxRefId: ["PAX2"] }
 ]
 },
 // 2. Seat Order (SeatAvailability Response Criteria)
 {
 responseId: SeatAvailability.responseId, // ⚠️ if absent offerId fallbackto Use
 offerId: SeatAvailability.offerId,
 owner: "SQ",
 offerItems: [
 {
 offerItemId: "SEAT_OI_1",
 paxRefId: ["PAX1"],
 seatSelection: { column: "A", row: "10" }
 },
 {
 offerItemId: "SEAT_OI_2",
 paxRefId: ["PAX2"],
 seatSelection: { column: "B", row: "10" }
 }
 ]
 }
]
```

### Case 2: WF_PB_SEAT_REPRICE (AFKL, TR) - Separate order entry

```typescript
// Carrier: AF, KL, TR
// ⭐ after SeatAvailability OfferPrice Re-Call Required
// OfferPrice Re-Call from the response responseId/offerId Use

orders: [
 // 1. Journey/Itinerary Order (OfferPrice Re-Call Response Criteria)
 {
 responseId: OfferPrice_Repriced.responseId,
 offerId: OfferPrice_Repriced.offerId,
 owner: "AF",
 offerItems: [
 { offerItemId: "OI1", paxRefId: ["PAX1"] },
 { offerItemId: "OI2", paxRefId: ["PAX2"] }
 ]
 },
 // 2. Seat Order (OfferPrice Re-Call Response Criteria)
 {
 responseId: OfferPrice_Repriced.responseId,
 offerId: OfferPrice_Repriced.offerId,
 owner: "AF",
 offerItems: [
 {
 offerItemId: "SEAT_OI_1",
 paxRefId: ["PAX1"],
 seatSelection: { column: "A", row: "10" }
 },
 {
 offerItemId: "SEAT_OI_2",
 paxRefId: ["PAX2"],
 seatSelection: { column: "B", row: "10" }
 }
 ]
 }
]
```

### Code Example

```typescript
// Booking Seat after purchase OfferPrice Re-Call Required Carrier
const CARRIERS_SEAT_REPRICE = ['AF', 'KL', 'TR'];

// from handleSeatConfirm AFKL, TR Case OfferPrice Re-Call
if (seats.length > 0 && CARRIERS_SEAT_REPRICE.includes(owner)) {
 const result = await getOfferPrice({
 transactionId,
 // ⭐ offers Array: Journey/Itinerary/Seat Separate entry
 offers: [
 // 1. Journey/Itinerary Offer
 {
 responseId: bookingData.responseId,
 offerId: bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems,
 },
 // 2. Seat Offer
 {
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: seatOfferItems,
 },
 ],
 paxList: bookingData.paxList,
 });
 // from the response responseId/offerId in seatOfferData Save
}

// from handleSubmit Order Composition
// ⭐ two Flow All Separate order entry Use
if (selectedSeats.length > 0 && seatOfferData) {
 orders = [
 // 1. Journey/Itinerary Order
 {
 responseId: CARRIERS_SEAT_REPRICE.includes(owner) ? seatOfferData.responseId : bookingData.responseId,
 offerId: CARRIERS_SEAT_REPRICE.includes(owner) ? seatOfferData.offerId : bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems,
 },
 // 2. Seat Order
 {
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: buildSeatOfferItems(),
 },
 ];
}
```
