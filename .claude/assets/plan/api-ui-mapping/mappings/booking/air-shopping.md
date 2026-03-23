# AirShopping API-UI Mapping

> API: `POST /middleware/polarhub/air-shopping`
> Response: `AirShoppingRS`

---

## Response Structure Overview

```
AirShoppingRS
├── ResultMessage
├── Recipient
├── PointOfSale
├── TransactionID
├── Offer[] # Flight offer List
│ ├── OfferID
│ ├── Owner
│ ├── ResponseID
│ ├── ValidatingCarrier
│ ├── TotalPrice
│ │ ├── TotalAmount { Amount, CurCode }
│ │ ├── TotalBaseAmount { Amount, CurCode }
│ │ └── TotalTaxAmount { Amount, CurCode }
│ ├── OfferItem[]
│ │ ├── OfferItemID
│ │ ├── FareDetail
│ │ └── Service[]
│ └── MatchResult (FULL/PARTIAL)
└── DataLists
 ├── OriginDestList[]
 ├── PaxJourneyList[] # Journey information
 ├── PaxSegmentList[] # Segment Detail
 ├── PaxList[] # Passenger information
 ├── PriceClassList[] # Fare class
 ├── BaggageAllowanceList[] # Baggage Information
 └── FareList[] # Fare Detail
```

---

## 1. FlightCard Mapping

### Default Information (FlightInfo)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| airlineLogo | `Offer.Owner` | `/assets/airlines/${Owner}.png` | Carrier code based |
| airlineName | `Offer.Owner` → Carrierperson Retrieval | carrierMap Conversion | Separate Carrier List Required |
| flightNumber | `DataLists.PaxSegmentList[].MarketingCarrier.AirlineID` + `FlightNumber` | `${AirlineID}${FlightNumber}` | per Segment |
| departureAirport | `DataLists.PaxSegmentList[].Departure.AirportCode` | - | - |
| departureTime | `DataLists.PaxSegmentList[].Departure.Time` | `HH:mm` Extract | ISO8601 → HH:mm |
| departureTerminal | `DataLists.PaxSegmentList[].Departure.Terminal.Name` | `T${value}` | null Available |
| arrivalAirport | `DataLists.PaxSegmentList[].Arrival.AirportCode` | - | - |
| arrivalTime | `DataLists.PaxSegmentList[].Arrival.Time` | `HH:mm` Extract | - |
| duration | `DataLists.PaxSegmentList[].FlightDuration` | ISO8601 → Korean | PT6H30M → 6Time 30 min |
| stops | `DataLists.PaxJourneyList[].PaxSegmentRefID.length - 1` | Calculate | 0=Non-stop |

### Code쉐 Information

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| codeShare | `DataLists.PaxSegmentList[].OperatingCarrier.AirlineID` | 마케ting != when Operation Display | - |
| operatingCarrier | `DataLists.PaxSegmentList[].OperatingCarrier.AirlineID` | - | - |

### Fare information (FareInfo)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| cabinClass | `DataLists.PaxSegmentList[].CabinType.Code` | Y→Economy class, C→Business class | cabinMap Conversion |
| cabinClassCode | `DataLists.PaxSegmentList[].CabinType.Code` | - | OriginalValue |
| fareType | `DataLists.PriceClassList[].Name` | - | Flex, Light, etc. |
| fareBasisCode | `DataLists.FareList[].FareBasisCode` | - | - |
| baggage | `DataLists.BaggageAllowanceList[].WeightAllowance` or `PieceAllowance` | Format Conversion | 23KG, 2PC |
| matchResult | `Offer.MatchResult` | - | FULL/PARTIAL |

### Fee Information (PriceInfo)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| totalPrice | `Offer.TotalPrice.TotalAmount.Amount` | - | Number |
| currency | `Offer.TotalPrice.TotalAmount.CurCode` | - | KRW, USD |
| baseFare | `Offer.TotalPrice.TotalBaseAmount.Amount` | - | Fare |
| taxes | `Offer.TotalPrice.TotalTaxAmount.Amount` | - | Tax |
| formattedPrice | Calculate | `${totalPrice.toLocaleString()} ${currency}` | for Display |

### Fee Detail (PriceBreakdown)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| passengerType | `DataLists.PaxList[].Ptc` | ADT→Adult, CHD→Child | ptcMap Conversion |
| count | Calculate | Same Ptc Count | - |
| farePerPax | `Offer.OfferItem[].FareDetail.Price.BaseAmount` | - | per Passenger |
| taxPerPax | `Offer.OfferItem[].FareDetail.Price.Taxes.Total` | - | per Passenger |

---

## 2. FilterPanel Mapping

### Carrier Filter

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| airlines[].code | `Offer.Owner` (unique) | Duplicate Remove | - |
| airlines[].minPrice | Calculate | Per carrier Lowest price | group by Owner |

### Non-stop/Stopover Filter

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| stopOptions[].count | `DataLists.PaxJourneyList[].PaxSegmentRefID.length` | Calculate | - |

### Time Filter

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| departureTimeSlots | `DataLists.PaxSegmentList[0].Departure.Time` | Time Classify | first Segment Criteria |
| arrivalTimeSlots | `DataLists.PaxSegmentList[last].Arrival.Time` | Time Classify | 마막 Segment |

### Baggage Filter

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| hasBaggage | `DataLists.BaggageAllowanceList[].WeightAllowance` | > 0 Check | - |

---

## 3. OfferID Reference relation

```
Offer
├── OfferID ──────────────┐
├── OfferItem[] │
│ └── OfferItemID │ Next API when Call Use
└── ResponseID ───────────┘
 ↓
OfferPrice Request
├── offer.offerId = OfferID
├── offer.responseId = ResponseID
└── offer.owner = Owner
```

---

## 4. Conversion Function

```typescript
// FlightTime Conversion (ISO8601 → Korean)
function formatDuration(duration: string): string {
 // "PT6H30M" → "6Time 30 min"
 const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
 if (!match) return duration;

 const hours = match[1] ? `${match[1]}Time` : '';
 const minutes = match[2] ? ` ${match[2]}min` : '';
 return `${hours}${minutes}`.trim();
}

// SeatClass Conversion
const cabinClassMap: Record<string, string> = {
 'Y': 'Economy class',
 'W': 'Premium/Business Economy class',
 'M': 'Economy class',
 'C': 'Business class',
 'J': 'Business class',
 'F': 'First class'
};

// Passenger type Conversion
const ptcMap: Record<string, string> = {
 'ADT': 'Adult',
 'CHD': 'Child',
 'INF': 'Infant'
};

// Stopover Display
function formatStops(segmentCount: number): string {
 const stops = segmentCount - 1;
 return stops === 0 ? 'Non-stop' : `Stopover${stops}`;
}

// Baggage Format
function formatBaggage(allowance: BaggageAllowance): string {
 if (allowance.WeightAllowance) {
 return `${allowance.WeightAllowance.MaxWeight}${allowance.WeightAllowance.WeightUnit}`;
 }
 if (allowance.PieceAllowance) {
 return `${allowance.PieceAllowance.TotalQuantity}PC`;
 }
 return 'notInclude';
}

// Time Classify
function getTimeSlot(time: string): string {
 const hour = parseInt(time.split(':')[0], 10);
 if (hour < 6) return 'dawn';
 if (hour < 12) return 'morning';
 if (hour < 18) return 'afternoon';
 return 'evening';
}
```

---

## 5. All/Total Mapping 다이그

```
AirShoppingRS
│
├─ Offer[] ────────────────────────────────────────────────┐
│ ├─ OfferID ─────────────────────────────────────────────┼── [Internal Referencefor]
│ ├─ Owner ───────────────────────────────────────────────┼── airlineLogo, airlineName
│ ├─ ResponseID ──────────────────────────────────────────┼── [Next API Callfor]
│ ├─ ValidatingCarrier ───────────────────────────────────┼── [Verifyfor]
│ ├─ TotalPrice.TotalAmount.Amount ───────────────────────┼── totalPrice
│ ├─ TotalPrice.TotalAmount.CurCode ──────────────────────┼── currency
│ ├─ TotalPrice.TotalBaseAmount.Amount ───────────────────┼── baseFare
│ ├─ TotalPrice.TotalTaxAmount.Amount ────────────────────┼── taxes
│ ├─ OfferItem[].FareDetail ──────────────────────────────┼── priceBreakdown
│ └─ MatchResult ─────────────────────────────────────────┼── matchResult
│
└─ DataLists
 ├─ PaxSegmentList[] ───────────────────────────────────┐
 │ ├─ Departure.AirportCode ───────────────────────────┼── departureAirport
 │ ├─ Departure.Time ──────────────────────────────────┼── departureTime
 │ ├─ Departure.Terminal.Name ─────────────────────────┼── departureTerminal
 │ ├─ Arrival.AirportCode ─────────────────────────────┼── arrivalAirport
 │ ├─ Arrival.Time ────────────────────────────────────┼── arrivalTime
 │ ├─ MarketingCarrier.AirlineID ──────────────────────┼── flightNumber (part1)
 │ ├─ MarketingCarrier.FlightNumber ───────────────────┼── flightNumber (part2)
 │ ├─ OperatingCarrier.AirlineID ──────────────────────┼── codeShare, operatingCarrier
 │ ├─ CabinType.Code ──────────────────────────────────┼── cabinClass, cabinClassCode
 │ └─ FlightDuration ──────────────────────────────────┼── duration
 │
 ├─ PaxJourneyList[]
 │ └─ PaxSegmentRefID.length ──────────────────────────┼── stops (Calculate)
 │
 ├─ PriceClassList[]
 │ └─ Name ────────────────────────────────────────────┼── fareType
 │
 ├─ BaggageAllowanceList[]
 │ ├─ WeightAllowance ─────────────────────────────────┼── baggage
 │ └─ PieceAllowance ──────────────────────────────────┼── baggage
 │
 ├─ FareList[]
 │ └─ FareBasisCode ───────────────────────────────────┼── fareBasisCode
 │
 └─ PaxList[]
 └─ Ptc ─────────────────────────────────────────────┼── passengerType
```

---

## 6. Reference ID Connection

| Reference ID | Position | Connection Target |
|---------|------|----------|
| PaxJourneyRefID | OriginDestList[] | PaxJourneyList[].PaxJourneyID |
| PaxSegmentRefID | PaxJourneyList[] | PaxSegmentList[].PaxSegmentID |
| PriceClassRefID | OfferItem[].FareDetail | PriceClassList[].PriceClassID |
| BaggageAllowanceRefID | OfferItem[] | BaggageAllowanceList[].BaggageAllowanceID |
| FareListRefID | OfferItem[].FareDetail | FareList[].FareListID |
