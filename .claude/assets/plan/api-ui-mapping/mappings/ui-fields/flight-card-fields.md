# FlightCard UI Field definitions

> Source: `.claude/assets/ui-component-guide/03-booking/air-shopping.md`

---

## 1. Default Information (FlightInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| airlineLogo | string | O | Image URL | `/assets/airlines/KE.png` | CarrierCode based |
| airlineName | string | O | Text | Korean Air | Koreanperson |
| flightNumber | string | O | CarrierCode + 4Seat | KE0645 | - |
| departureAirport | string | O | 3Seat AirportCode | ICN | - |
| departureTime | string | O | HH:mm | 10:30 | - |
| departureTerminal | string | X | T + Number | T2 | if absent 공백 |
| arrivalAirport | string | O | 3Seat AirportCode | SIN | - |
| arrivalTime | string | O | HH:mm | 16:00 | - |
| duration | string | O | Time minutes | 6Time 30 min | ISO8601 → Korean Conversion |
| stops | number | O | Number | 0, 1, 2 | 0=Non-stop |
| stopsLabel | string | O | Text | Non-stop, Stopover1 time(s) | stops based Conversion |

---

## 2. Fare information (FareInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| cabinClass | string | O | Koreanperson | Economy class | Y→Economy class, C→Business class |
| cabinClassCode | string | O | English Code | Y, C, F | API OriginalValue |
| fareType | string | O | Englishperson | Economy Flex | Fare typeperson |
| fareBasisCode | string | X | English Code | YOWKR | - |
| baggage | string | O | Count/Weight | 23KG, 2PC, notInclude | Format 다양 |
| aircraftType | string | X | Aviation기 Code | A380, B777 | - |

---

## 3. Fee Information (PriceInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| totalPrice | number | O | Number | 1234500 | Total Fee |
| currency | string | O | 3Seat code | KRW, USD | - |
| formattedPrice | string | O | Number + Currency | 1,234,500 KRW | for Display |
| baseFare | number | X | Number | 1100000 | Fare |
| taxes | number | X | Number | 134500 | Tax |

---

## 4. Fee Detail (PriceBreakdown)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| passengerType | string | O | Korean | Adult General | ADT→Adult |
| count | number | O | Number | 2 | Passenger |
| farePerPax | number | O | Number | 850000 | 1 Fare |
| taxPerPax | number | O | Number | 50000 | 1 Tax |
| subtotal | number | O | Number | 1800000 | farePerPax * count |

---

## 5. Add Information (AdditionalInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| codeShare | string | X | 공동Operation + CarrierCode | 공동Operation OZ | when Code쉐 Display |
| operatingCarrier | string | X | 2Seat code | OZ | Actual Operation Carrier |
| hiddenStops | string[] | X | AirportCode Array | ["NRT"] | 숨 Stopover |

---

## 6. Stopover편 Detail (ConnectionDetail)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| segmentNo | number | O | Number | 1, 2 | Segment Number |
| flightNumber | string | O | Flight number | KE0645 | - |
| departureAirport | string | O | AirportCode | ICN | - |
| departureTime | string | O | HH:mm | 10:30 | - |
| arrivalAirport | string | O | AirportCode | NRT | - |
| arrivalTime | string | O | HH:mm | 14:30 | - |
| layoverTime | string | X | Time minutes | 2Time 30 min | 환승 Pending Time |
| layoverAirport | string | X | AirportCode | NRT | 환승 Airport |

---

## 7. Upsell Fare (UpsellOffer)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| fareClassName | string | O | Englishperson | Economy Light | Fare typeperson |
| baggageIncluded | boolean | O | true/false | true | Baggage Include Whether |
| baggageDetail | string | X | Text | 23KG | Baggage Detail |
| changePolicy | string | X | Text | 유연 | Change Condition |
| refundPolicy | string | X | Text | Refund Available | Refund Condition |
| totalPrice | number | O | Number | 1500000 | Total Fee |

---

## 8. MatchResult Information

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| matchResult | string | O | Partial/Full | Partial | Fare Combination Method |
| combinability | boolean | X | true/false | true | Combination Available Whether |
| priceClass | string | X | Text | PC01 | Combination Criteria class |

---

## TypeScript Interface

```typescript
interface FlightCardData {
 // Default Information
 airlineLogo: string;
 airlineName: string;
 flightNumber: string;
 departureAirport: string;
 departureTime: string;
 departureTerminal?: string;
 arrivalAirport: string;
 arrivalTime: string;
 duration: string;
 stops: number;
 stopsLabel: string;

 // Fare information
 cabinClass: string;
 cabinClassCode: string;
 fareType: string;
 fareBasisCode?: string;
 baggage: string;
 aircraftType?: string;

 // Fee Information
 totalPrice: number;
 currency: string;
 formattedPrice: string;
 baseFare?: number;
 taxes?: number;

 // Fee Detail
 priceBreakdown?: PriceBreakdownItem[];

 // Add Information
 codeShare?: string;
 operatingCarrier?: string;
 hiddenStops?: string[];

 // Stopover편 Detail
 connectionDetails?: ConnectionDetail[];

 // Upsell Fare
 upsellOffers?: UpsellOffer[];

 // MatchResult Information
 matchResult: 'Partial' | 'Full';
 combinability?: boolean;
 priceClass?: string;
}

interface PriceBreakdownItem {
 passengerType: string;
 count: number;
 farePerPax: number;
 taxPerPax: number;
 subtotal: number;
}

interface ConnectionDetail {
 segmentNo: number;
 flightNumber: string;
 departureAirport: string;
 departureTime: string;
 arrivalAirport: string;
 arrivalTime: string;
 layoverTime?: string;
 layoverAirport?: string;
}

interface UpsellOffer {
 fareClassName: string;
 baggageIncluded: boolean;
 baggageDetail?: string;
 changePolicy?: string;
 refundPolicy?: string;
 totalPrice: number;
}
```

---

## Conversion logic Note

```typescript
// SeatClass Conversion
const cabinClassMap: Record<string, string> = {
 'Y': 'Economy class',
 'W': 'Premium/Business Economy class',
 'C': 'Business class',
 'F': 'First class'
};

// Stopover Display Conversion
function formatStops(count: number): string {
 return count === 0 ? 'Non-stop' : `Stopover${count}`;
}

// FlightTime Conversion (ISO8601 → Korean)
function formatDuration(iso8601: string): string {
 // "PT6H30M" → "6Time 30 min"
 const match = iso8601.match(/PT(\d+)H(\d+)?M?/);
 if (!match) return iso8601;
 const hours = match[1];
 const minutes = match[2] || '0';
 return `${hours}Time ${minutes}min`;
}

// Price Formatting
function formatPrice(amount: number, currency: string): string {
 return `${amount.toLocaleString()} ${currency}`;
}
```
