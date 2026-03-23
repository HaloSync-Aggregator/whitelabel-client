# SeatMap UI Field definitions

> Source: `.claude/assets/ui-component-guide/07-popups/seat-popup.md`

---

## 1. Seat selection Screen (SeatSelection)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| segmentInfo | SegmentInfo | O | Header | - | Select Target Segment Information |
| passengerList | SeatPassenger[] | O | List | - | per Passenger Seat selection |
| seatMap | SeatMapData | O | Seat map | - | Aviation기 Seat Layout |
| seatLegend | SeatLegend[] | O | legend | - | Seat per Type Color Guide |
| selectedSeats | SelectedSeat[] | O | List | - | Select Seat Summary |
| totalPrice | number | O | Number | 100000 | Total Seat Fee |
| currency | string | O | CurrencyCode | KRW | - |

---

## 2. Segment Information (SegmentInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| segmentNo | number | O | Number | 1 | Segment Number |
| carrierCode | string | O | 2Seat code | LH | Carrier |
| flightNumber | string | O | Flight number | LH0001 | - |
| departureAirport | string | O | AirportCode | ICN | - |
| arrivalAirport | string | O | AirportCode | FRA | - |
| departureDate | string | O | DD/MMM/YYYY | 01/FEB/2024 | - |
| cabinClass | string | O | Koreanperson | Economy class | - |

---

## 3. per Passenger Seat (SeatPassenger)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxId | string | O | PAX ID | PAX1 | - |
| passengerName | string | O | English property/given name | HONG/GILDONG | - |
| ptc | string | O | Passenger type | ADT | - |
| ptcLabel | string | O | Korean | Adult | - |
| selectedSeat | string | X | SeatNumber | 43J | Select Seat |
| isActive | boolean | O | true/false | true | Current Select Target |

---

## 4. Seat map (SeatMapData)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| cabinClass | string | O | Koreanperson | Economy class | - |
| columns | string[] | O | column label | ['A','B','C','D','E','F'] | Seat column |
| rows | SeatRow[] | O | row Array | - | Seat row List |

### SeatRow (Seat row)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| rowNumber | number | O | Number | 10 | row Number |
| seats | Seat[] | O | Seat Array | - | Corresponding 행's Seats |

### Seat (Individual Seat)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| column | string | O | column Code | A, B, C | - |
| seatNumber | string | O | Row + Column | 10A | SeatNumber |
| seatName | string | X | English | PREFERRED LOWER DECK | Seatperson |
| availability | string | O | StatusCode | A, F, N, R, T, O | Seat Status |
| availabilityLabel | string | O | Korean | Selectable, occupied | - |
| seatType | string | O | Type Code | standard, preferred, extraLegroom | Seat Type |
| seatTypeLabel | string | O | Korean | General, preferred, legroom | - |
| characteristics | string[] | X | specialproperty Array | ['Window', 'ExitRow'] | Seat specialproperty |
| price | number | X | Number | 50000 | Seat Price (Paid time) |
| currency | string | X | CurrencyCode | KRW | - |
| isSelected | boolean | O | true/false | false | Select Whether |
| selectedByPax | string | X | PAX ID | PAX1 | Select Passenger |

---

## 5. Seat StatusValue (SeatAvailability)

| StatusCode | 의un | Selectable | Color |
|---------|------|:--------:|------|
| A | Available | O | per Type Color |
| F | Free | O | per Type Color |
| VACANT | Vacant | O | per Type Color |
| N | No Seat | X | transparent (empty space) |
| N/A | Not Available | X | transparent (empty space) |
| R | Restricted | X | color |
| 1 | Restricted (Number) | X | color |
| Z | Restricted (Z) | X | color |
| T | Taken | X | color (occupied) |
| O | Occupied | X | color (occupied) |

---

## 6. Seat Type (SeatType)

| Type Code | Displayperson | Include person칭 | Color |
|----------|--------|----------|------|
| standard | General Seat | STANDARD SEAT, DEFAULT FREE SEAT, Regular, PREMIUM SEAT | Default |
| preferred | preferred Seat | PREFERRED ZONE SEAT, Preferred Lower Deck, FORWARD ZONE | Separate1 |
| extraLegroom | legroom Seat | EXTRA LEGROOM SEAT, Extra Legroom | Separate2 |
| restricted | Limit Seat | - | color |
| occupied | occupied Seat | - | color |

---

## 7. Seat legend (SeatLegend)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| type | string | O | Type Code | standard | - |
| label | string | O | Koreanperson | General Seat | - |
| color | string | O | Color Code | #4CAF50 | backgroundcolor |
| description | string | X | Description | Default Seat | - |

---

## 8. Select Seat Summary (SelectedSeat)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxId | string | O | PAX ID | PAX1 | - |
| passengerName | string | O | English property/given name | HONG/GILDONG | - |
| seatNumber | string | O | SeatNumber | 43J | - |
| seatName | string | X | English | PREFERRED LOWER DECK | - |
| seatType | string | O | Type Code | preferred | - |
| price | number | O | Number | 50000 | 0if Free |
| currency | string | O | CurrencyCode | KRW | - |

---

## 9. SSR Information Display (SsrDisplay)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| carrierCode | string | O | 2Seat code | LH | Carrier |
| passengerName | string | O | English property/given name (PTC) | MOON/CINDY (ADT) | - |
| ssrName | string | O | SSRperson + Information | Seat Reservation 43J | - |
| segments | string | O | Flight Information | LH0001 ICN-FRA 01/FEB/2023 | - |
| status | string | O | StatusCode | HN, HD, HI, HK | - |
| statusLabel | string | O | Korean | Pending, Confirmed Available, IssueComplete | - |
| showCheckbox | boolean | O | true/false | true | HD Status when |

---

## 10. Payment information Popup (PaymentPopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| seatSummary | SelectedSeat[] | O | List | - | Select Seat List |
| subtotal | number | O | Number | 100000 | Seat Amount Subtotal |
| taxes | number | X | Number | 10000 | Tax |
| totalAmount | number | O | Number | 110000 | Total payment |
| currency | string | O | CurrencyCode | KRW | - |
| paymentMethods | PaymentMethod[] | O | radio Button | - | Payment method List |

---

## 11. Per carrier Process Logic

### Amount Re-Calculate Button Exposed

| Carrier | Button Exposed | Call API |
|--------|:--------:|----------|
| LH, LX, OS, EK, QR, HA, KE, AA | X | - |
| AF, KL | O | OfferPrice |
| SQ, AY | O | OrderQuote |
| TK | O (TotalAmount > 0 when) | OrderQuote |

### Purchase Confirmed Required Carrier

| Carrier | Confirmed Required | StatusValue (Pending) | StatusValue (ConfirmedAvailable) | StatusValue (Complete) |
|--------|:--------:|:------------:|:---------------:|:------------:|
| LH, LX, OS, EK | O | HN | HD | HI, HK |
| KE, HA | O | REQUESTED | CONFIRMED | CONFIRMED |
| Other | X | - | - | HK |

---

## TypeScript Interface

```typescript
interface SeatSelectionData {
 segmentInfo: SegmentInfo;
 passengerList: SeatPassenger[];
 seatMap: SeatMapData;
 seatLegend: SeatLegend[];
 selectedSeats: SelectedSeat[];
 totalPrice: number;
 currency: string;
 showRecalculateButton: boolean;
 showPurchaseConfirmButton: boolean;
}

interface SegmentInfo {
 segmentNo: number;
 carrierCode: string;
 flightNumber: string;
 departureAirport: string;
 arrivalAirport: string;
 departureDate: string;
 cabinClass: string;
}

interface SeatPassenger {
 paxId: string;
 passengerName: string;
 ptc: string;
 ptcLabel: string;
 selectedSeat?: string;
 isActive: boolean;
}

interface SeatMapData {
 cabinClass: string;
 columns: string[];
 rows: SeatRow[];
}

interface SeatRow {
 rowNumber: number;
 seats: Seat[];
}

interface Seat {
 column: string;
 seatNumber: string;
 seatName?: string;
 availability: string;
 availabilityLabel: string;
 seatType: 'standard' | 'preferred' | 'extraLegroom' | 'restricted' | 'occupied';
 seatTypeLabel: string;
 characteristics?: string[];
 price?: number;
 currency?: string;
 isSelected: boolean;
 selectedByPax?: string;
}

interface SeatLegend {
 type: string;
 label: string;
 color: string;
 description?: string;
}

interface SelectedSeat {
 paxId: string;
 passengerName: string;
 seatNumber: string;
 seatName?: string;
 seatType: string;
 price: number;
 currency: string;
}

interface SsrDisplay {
 carrierCode: string;
 passengerName: string;
 ssrName: string;
 segments: string;
 status: string;
 statusLabel: string;
 showCheckbox: boolean;
}

interface PaymentPopup {
 seatSummary: SelectedSeat[];
 subtotal: number;
 taxes?: number;
 totalAmount: number;
 currency: string;
 paymentMethods: PaymentMethod[];
}

interface PaymentMethod {
 code: string;
 label: string;
 isDefault: boolean;
}
```

---

## Seat Status Judgment Logic

```typescript
// Seat selection Available Whether
function isSeatSelectable(seat: Seat): boolean {
 const selectableStatuses = ['A', 'F', 'VACANT'];
 return selectableStatuses.includes(seat.availability.toUpperCase());
}

// Seat Type Judgment
function getSeatType(seatName: string): string {
 const nameUpper = seatName.toUpperCase();

 if (nameUpper.includes('EXTRA LEGROOM') || nameUpper.includes('LEGROOM')) {
 return 'extraLegroom';
 }
 if (nameUpper.includes('PREFERRED') || nameUpper.includes('FORWARD ZONE')) {
 return 'preferred';
 }
 return 'standard';
}

// SSR Status Label
const ssrStatusLabels: Record<string, string> = {
 'HN': 'Carrier Response Pending',
 'HD': 'PurchaseConfirmed Available',
 'HI': 'Purchase Confirmed Complete',
 'HK': 'Confirmed',
 'REQUESTED': 'Carrier Response Pending',
 'CONFIRMED': 'Confirmed'
};
```
