# AirShopping API-UI Mapping

> **API**: `POST /middleware/polarhub/air-shopping`
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/booking/air-shopping.md`
> **UI Guide**: `.claude/assets/ui-component-guide/03-booking/air-shopping.md`, `search-filter.md`

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |
| Date Format | `.claude/assets/ui-component-guide/02-common/date-format.md` |

---

## Key/Main UI Component

- **FlightCard**: Flight Card (Search results)
- **FilterPanel**: Filter 패널 (Carrier, Non-stop/Stopover, Time)

---

## FlightCard Core Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| airlineLogo | `Offer.Owner` | `/assets/airlines/${Owner}.png` |
| airlineName | `Offer.Owner` | carrierMap Retrieval |
| flightNumber | `PaxSegmentList[].MarketingCarrier` | `${AirlineID}${FlightNumber}` |
| departureAirport | `PaxSegmentList[].Departure.AirportCode` | - |
| departureTime | `PaxSegmentList[].Departure.Time` | `HH:mm` Extract |
| arrivalAirport | `PaxSegmentList[].Arrival.AirportCode` | - |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | `HH:mm` Extract |
| duration | `PaxSegmentList[].FlightDuration` | `PT6H30M` → `6Time 30 min` |
| stops | `PaxJourneyList[].PaxSegmentRefID.length - 1` | 0=Non-stop |
| cabinClass | `PaxSegmentList[].CabinType.Code` | Y→Economy class, C→비즈니스 |
| totalPrice | `Offer.TotalPrice.TotalAmount.Amount` | - |
| currency | `Offer.TotalPrice.TotalAmount.CurCode` | - |
| baggage | `BaggageAllowanceList[]` | `23KG` or `2PC` |

---

## FilterPanel Core Mapping

| Filter | API Path | Logic |
|------|----------|------|
| Carrier | `Offer.Owner` (unique) | Per carrier Lowest price Group핑 |
| Non-stop/Stopover | `PaxJourneyList[].PaxSegmentRefID.length` | segments - 1 |
| Departure Time | `PaxSegmentList[0].Departure.Time` | dawn/morning/afternoon/evening |
| Baggage Include | `BaggageAllowanceList[].WeightAllowance` | > 0 Check |

---

## Core Conversion Function

```typescript
// FlightTime
formatDuration("PT6H30M") → "6Time 30 min"

// SeatClass
cabinClassMap['Y'] → "Economy class"
cabinClassMap['C'] → "Business class"

// Passenger type
ptcMap['ADT'] → "Adult"
ptcMap['CHD'] → "Child"
ptcMap['INF'] → "Infant"

// Stopover
formatStops(1) → "Non-stop"
formatStops(2) → "Stopover1 time(s)"

// Baggage
formatBaggage({WeightAllowance: {MaxWeight: 23}}) → "23KG"
formatBaggage({PieceAllowance: {TotalQuantity: 2}}) → "2PC"
```

---

## Subsequent API Connection: OfferPrice

> **UI Guide**: `.claude/assets/ui-component-guide/03-booking/offer-price.md`

### API Flow

```
AirShopping → Flight Select → OfferPrice → Payment/Booking
```

### OfferPrice Request Composition

```typescript
{
 offer: {
 offerId: Offer.OfferID,
 responseId: Offer.ResponseID,
 owner: Offer.Owner
 },
 selectedOfferItems: Offer.OfferItem[].OfferItemID[],
 paxList: [...] // Passenger information
}
```

### Price variation Process

| Scenario | Process |
|------|------|
| Price Same | to Bar Payment Progress |
| Price variation | Difference Popup after Display Progress |

### Difference Popup UI

```
┌─────────────────────────────────────────────┐
│ Fare Change │
├─────────────────────────────────────────────┤
│ Item before Change after Change variationAmount │
│ Fare 800,000 850,000 +50,000 │
│ Tax 50,000 52,000 +2,000 │
│ Total 850,000 902,000 +52,000 │
│ │
│ [Cancellation] [Confirm] │
└─────────────────────────────────────────────┘
```

### Post-ticketing (Deferred Ticketing) Flow

| Carrier | API Flow |
|--------|----------|
| LH, AA, EK, HA | OrderRetrieve → OrderReshop → OrderChange(F) |
| SQ, QR (18.1) | OrderRetrieve → OrderReshop → OrderChange(F) |
| SQ, AY (21.3) | OrderRetrieve → OrderQuote → OrderChange(F) |
| AF, KL, TR | OrderRetrieve → OrderChange(F) |
| KE | OrderRetrieve → OrderQuote(Option) → OrderChange(F) |

---

## Reference ID Connection

| RefID | Position | Connection Target |
|-------|------|----------|
| PaxSegmentRefID | PaxJourneyList[] | PaxSegmentList[].PaxSegmentID |
| BaggageAllowanceRefID | OfferItem[] | BaggageAllowanceList[].BaggageAllowanceID |
| PriceClassRefID | FareDetail | PriceClassList[].PriceClassID |

---

## MatchResult Process

> **Detail Document**: `.claude/skills/whitelabel-dev/references/concepts/match-result.md`

### Concepts

| Value | Description | Offer Structure |
|---|---|---|
| **FULL** | Single to Offer All/Total Journey/Itinerary 커버 | 1items offer (Round-trip Include) |
| **PARTIAL** | Journey/per Itinerary Separate Offer Required | 2items+ offer (Outbound/Return Each) |

### FULL (Default Case)

- Single Offer All/Total Round-trip Journey/Itinerary Include
- UI: General FlightCard to List Display
- OfferPrice: Single offer Transmission

```typescript
// UI: FlightCard Click → Single to offer OfferPrice
offers: [{ offerId: "offer-1", ... }]
```

### PARTIAL (복합 Case)

- each Journey/Itinerary(OD)to per Separate Offer Provide
- UI: Outbound/Return Section Split Display Required
- OfferPrice: Select All offer to Array Transmission

```typescript
// UI: Outbound + Return Each after Select OfferPrice
offers: [
 { offerId: "outbound-offer-id", ... },
 { offerId: "inbound-offer-id", ... }
]
```

### Flight._raw Extension

```typescript
_raw: {
 responseId: string;
 offerId: string;
 owner: string;
 offerItems: [...];
 matchResult: 'FULL' | 'PARTIAL'; // ⭐ Add
 originDestId?: string; // ⭐ PARTIAL when OD 식별
}
```

### OriginDestList Utilize

```typescript
// Round-trip when Search OriginDestList
OriginDestList: [
 { OriginDestID: "OD1", ... }, // Outbound
 { OriginDestID: "OD2", ... } // Return
]

// PARTIAL offer Classify
const outboundFlights = flights.filter(f =>
 f._raw?.originDestId === "OD1"
);
const inboundFlights = flights.filter(f =>
 f._raw?.originDestId === "OD2"
);
