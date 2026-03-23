# SeatAvailability API-UI Mapping

> API: `POST /middleware/polarhub/seat-availability`
> Response: `SeatAvailabilityRS`

---

## Response Structure Overview

```
SeatAvailabilityRS
├── ResultMessage
├── Recipient
├── PointOfSale
├── TransactionID
├── ResponseID # Subsequent API for Call
├── ALaCarteOffer
│ ├── OfferID
│ ├── Owner
│ ├── ValidatingCarrier
│ ├── ALaCarteOfferItem[] # per Seat Price Information
│ │ ├── OfferItemID
│ │ ├── Eligibility # Applied Condition
│ │ └── UnitPrice # Seat Price
│ └── SeatMap[] # Seat map
│ ├── PaxSegmentRefID # Segment Reference
│ └── Cabins[]
│ ├── CabinType
│ ├── Columns[] # column Information
│ └── RowInfo[] # row Information
│ ├── Number
│ └── Seats[]
│ ├── Column
│ ├── SeatStatus
│ ├── SeatCharacteristics[]
│ └── OfferItemRefID
└── DataLists
```

---

## 1. Segment Information (SegmentInfo) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| segmentNo | Index + 1 | Calculate | - |
| carrierCode | `ALaCarteOffer.Owner` | - | 2Seat |
| flightNumber | `DataLists.PaxSegmentList[].MarketingCarrier` | Combination | - |
| departureAirport | `DataLists.PaxSegmentList[].Departure.AirportCode` | PaxSegmentRefID Connection | - |
| arrivalAirport | `DataLists.PaxSegmentList[].Arrival.AirportCode` | - | - |
| departureDate | `DataLists.PaxSegmentList[].Departure.Date` | Format Conversion | DD/MMM/YYYY |
| cabinClass | `SeatMap[].Cabins[].CabinType.Code` | cabinMap Conversion | - |

---

## 2. Seat map (SeatMap) Mapping

### column Information (Columns)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| columns[] | `SeatMap[].Cabins[].Columns[].Designation` | Array Extract | A, B, C... |
| position | `SeatMap[].Cabins[].Columns[].Position` | - | L, C, R (좌우) |

### row Information (Rows)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| rows[].rowNumber | `SeatMap[].Cabins[].RowInfo[].Number` | - | 1, 2, 3... |
| rows[].seats[] | `SeatMap[].Cabins[].RowInfo[].Seats[]` | - | Seat Array |

---

## 3. Individual Seat (Seat) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| column | `Seat.Column` | - | A, B, C |
| seatNumber | `Row.Number` + `Seat.Column` | Combination | 10A, 15C |
| availability | `Seat.SeatStatus` | - | F, X, R, etc. |
| availabilityLabel | `SeatStatus` → statusMap | Conversion | Korean |
| seatType | `Seat.SeatCharacteristics[]` | Classify Logic | standard, preferred, etc. |
| seatTypeLabel | seatType → typeMap | Conversion | Korean |
| characteristics | `Seat.SeatCharacteristics[]` | - | Window, Aisle, etc. |
| price | `ALaCarteOfferItem[].UnitPrice.TotalAmount.Amount` | OfferItemRefID Connection | - |
| currency | `ALaCarteOfferItem[].UnitPrice.TotalAmount.CurCode` | - | - |
| isSelected | Client Status | - | false (initialValue) |

---

## 4. Seat Status (SeatStatus) Mapping

> **Note**: PolarHub API Response Criteria (JSON)

| API Value | UI availability | availabilityLabel | Selectable |
|--------|-----------------|-------------------|:--------:|
| O | available | Selectable | O |
| A | available | Selectable | O |
| VACANT | available | Selectable | O |
| F | occupied | occupied | X |
| X | occupied | occupied | X |
| T | occupied | occupied | X |
| R | restricted | Limit | X |
| 1 | restricted | Limit | X |
| Z | restricted | Limit | X |
| N | noSeat | empty space | X |
| N/A | noSeat | empty space | X |

---

## 5. Seat Type (SeatType) Classify

```typescript
function classifySeatType(characteristics: string[]): string {
 const chars = characteristics.map(c => c.toUpperCase());

 // Extra Legroom Judgment
 if (chars.some(c =>
 c.includes('EXTRA LEGROOM') ||
 c.includes('LEG') ||
 c === 'E'
 )) {
 return 'extraLegroom';
 }

 // Preferred Judgment
 if (chars.some(c =>
 c.includes('PREFERRED') ||
 c.includes('FORWARD') ||
 c === 'P'
 )) {
 return 'preferred';
 }

 // Exit Row Judgment
 if (chars.some(c =>
 c.includes('EXIT') ||
 c === 'X'
 )) {
 return 'exitRow';
 }

 return 'standard';
}
```

---

## 6. Seat specialproperty (Characteristics) Mapping

| API Value | UI Display | Description |
|--------|---------|------|
| W | Window | 창 Seat |
| A | Aisle | to through Seat |
| L | Legroom | legroom |
| E | ExitRow | exit row |
| B | Bulkhead | 격벽 앞 |
| G | Gallery | 갤리 근처 |
| LA | Lavatory | conversion장실 근처 |

---

## 7. Seat Price Connection (OfferItemRefID)

```
SeatMap[].Cabins[].RowInfo[].Seats[]
└── OfferItemRefID ──────────────────→ AlaCarteOfferItem[].OfferItemID
 └── UnitPrice.TotalAmount
 ├── Amount → price
 └── CurCode → currency
```

### Price Retrieval Logic

```typescript
function getSeatPrice(
 seat: Seat,
 offerItems: ALaCarteOfferItem[]
): { price: number; currency: string } | null {
 if (!seat.OfferItemRefID) {
 return { price: 0, currency: 'KRW' }; // Free seat
 }

 const offerItem = offerItems.find(
 item => item.OfferItemID === seat.OfferItemRefID
 );

 if (!offerItem) return null;

 return {
 price: offerItem.UnitPrice.TotalAmount.Amount,
 currency: offerItem.UnitPrice.TotalAmount.CurCode
 };
}
```

---

## 8. Seat legend (SeatLegend) Create

```typescript
function generateSeatLegend(seatMap: SeatMapData): SeatLegend[] {
 const types = new Set<string>();

 // All Seat Type 수집
 seatMap.rows.forEach(row => {
 row.seats.forEach(seat => {
 if (seat.availability !== 'noSeat') {
 types.add(seat.seatType);
 }
 });
 });

 const legendMap: Record<string, SeatLegend> = {
 standard: { type: 'standard', label: 'General Seat', color: '#4CAF50' },
 preferred: { type: 'preferred', label: 'Preferred Seat', color: '#2196F3' },
 extraLegroom: { type: 'extraLegroom', label: 'Legroom Seat', color: '#9C27B0' },
 exitRow: { type: 'exitRow', label: 'Exit Row Seat', color: '#FF9800' },
 restricted: { type: 'restricted', label: 'Limit Seat', color: '#9E9E9E' },
 occupied: { type: 'occupied', label: 'occupied Seat', color: '#757575' }
 };

 return Array.from(types).map(type => legendMap[type]).filter(Boolean);
}
```

---

## 9. Select Seat Summary (SelectedSeat)

| UI Field | source | Description |
|---------|------|------|
| paxId | Client Select | Select Passenger |
| passengerName | DataLists.PaxList[] Connection | Passengerperson |
| seatNumber | Row.Number + Seat.Column | SeatNumber |
| seatName | SeatCharacteristics based | Seatperson |
| seatType | Classify Logic | Seat Type |
| price | ALaCarteOfferItem Connection | Seat Price |
| currency | ALaCarteOfferItem Connection | Currency |

---

## 10. Subsequent API Call Reference

```
SeatAvailabilityRS
├── ResponseID ────────────────┐
├── ALaCarteOffer │
│ └── OfferID ───────────────┤
└── ALaCarteOfferItem[] │ OrderQuote / OfferPrice when Call Use
 └── OfferItemID ───────────┘

OrderQuote Request:
├── offer.responseId = ResponseID
├── offer.offerId = ALaCarteOffer.OfferID
└── selectedOfferItems = [Select OfferItemID Array]
```

---

## 11. Per carrier Process

### Amount Re-Calculate Button Exposed

| Carrier | Whether needed | API |
|--------|:--------:|-----|
| LH, LX, OS, EK, QR, HA, KE, AA | X | - |
| AF, KL | O | OfferPrice |
| SQ, AY, TK | O | OrderQuote |

### Purchase Confirmed Whether needed

| Carrier | Whether needed | Status Flow |
|--------|:--------:|----------|
| LH, LX, OS, EK | O | HN → HD → HI |
| KE, HA | O | REQUESTED → CONFIRMED |
| Other | X | HK (to Bar Confirmed) |
