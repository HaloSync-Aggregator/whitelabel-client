# MatchResult Concepts Guide (v2.0)

> **Range**: AirShopping from the response Offer Type Distinction and Process
> **Related API**: AirShopping, OfferPrice
> **Template**: `.claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template`

---

## Overview

`MatchResult` AirShopping from Response each Offer Search Request's Journey/Itinerary 떻게 커버 Indicating Field.

---

## MatchResult Value

| Value | Description | JourneyOverview Structure | Example |
|---|---|---|---|
| **FULL** | Single to Offer All/Total Journey/Itinerary 커버 | `[outbound, inbound]` 2items | SQ Round-trip 1items offer |
| **PARTIAL** | Journey/per Itinerary Separate Offer Required | `[outbound]` or `[inbound]` 1items | Outbound SQ + Return KE |

---

## v2.0 Core Logic (2024.01 itemspre)

### Data flow (OriginDestList Mapping not required!)

```
Offer.JourneyOverview[].PaxJourneyRefID → PaxJourneyList → PaxSegmentList
```

### JourneyOverview Array Order = Journey/Itinerary direction

```typescript
// FULL Mode: in JourneyOverview 2items Item
JourneyOverview[0].PaxJourneyRefID // → outbound (Outbound)
JourneyOverview[1].PaxJourneyRefID // → inbound (Return)

// PARTIAL Mode: in JourneyOverview 1items Item
JourneyOverview[0].PaxJourneyRefID // → outbound or inbound
```

### Core: OriginDestList Mapping not required

```typescript
// ❌ Previous Method (v1.0) - 복catchand Error Occurs
const journeyToOdMap = new Map();
originDestList.forEach(od => {
 od.PaxJourneyRefID.forEach(journeyId => {
 journeyToOdMap.set(journeyId, od.OriginDestID);
 });
});
const originDestId = journeyToOdMap.get(offerJourneyId);

// ✅ New Method (v2.0) - only순and specific
journeyOverviews.forEach((jo, joIndex) => {
 const direction = joIndex === 0 ? 'outbound' : 'inbound';
 // JourneyOverview Index is direction!
});
```

---

## Data Flow

### FULL Offer

```
AirShopping Request: ICN → SIN (Round-trip)
 ↓
AirShopping Response:
 Offer[0] {
 MatchResult: "Full",
 JourneyOverview: [
 { PaxJourneyRefID: "PJ1" }, // outbound
 { PaxJourneyRefID: "PJ2" } // inbound
 ]
 }
 ↓
Transformer:
 legs: [
 { direction: 'outbound', journeyId: 'PJ1', ... },
 { direction: 'inbound', journeyId: 'PJ2', ... }
 ]
 ↓
UI: FlightCard 1items (Round-trip All/Total Display)
```

### PARTIAL Offer

```
AirShopping Request: ICN → SIN (Round-trip)
 ↓
AirShopping Response:
 Offer[0] { MatchResult: "Partial", JourneyOverview: [{ PaxJourneyRefID: "PJ1" }] } // Outbound SQ
 Offer[1] { MatchResult: "Partial", JourneyOverview: [{ PaxJourneyRefID: "PJ2" }] } // Return SQ
 Offer[2] { MatchResult: "Partial", JourneyOverview: [{ PaxJourneyRefID: "PJ1" }] } // Outbound KE
 Offer[3] { MatchResult: "Partial", JourneyOverview: [{ PaxJourneyRefID: "PJ2" }] } // Return KE
 ↓
Transformer:
 each Offer마다 legs: [{ direction: 'outbound' or 'inbound', ... }]
 ↓
UI: Outbound/Return Split Display
 - legs[0].directionto Distinction
```

---

## Flight.legs Structure (New)

```typescript
interface FlightLeg {
 direction: 'outbound' | 'inbound';
 directionLabel: string; // 'Outbound' | 'Return'
 journeyId: string; // PaxJourneyRefID
 departure: { ... };
 arrival: { ... };
 duration: string;
 stops: number;
 flightNumber: string;
 segments: Array<{ ... }>;
}

interface Flight {
 // Existing Field (Backward compatibility)
 departure: { ... }; // first th leg Criteria
 arrival: { ... }; // first th leg Criteria

 // ⭐ New Field
 legs?: FlightLeg[]; // FULL: 2items, PARTIAL: 1items

 _raw?: {
 matchResult?: 'FULL' | 'PARTIAL';
 // originDestId more Or more Usedoes not (legs Use)
 };
}
```

---

## Precautions

### 1. MatchResult Case Normalization

```typescript
// API Response Example
{ "MatchResult": "Partial" } // firsttext Uppercase
{ "MatchResult": "PARTIAL" } // Uppercase

// ✅ Correct Normalization method
const rawMatchResult = offer.MatchResult?.toUpperCase() || 'FULL';
const matchResult: 'FULL' | 'PARTIAL' = rawMatchResult === 'PARTIAL' ? 'PARTIAL' : 'FULL';
```

### 2. JourneyOverview All/Total traverse

```typescript
// ✅ Correct approach: All/Total traverse
journeyOverviews.forEach((jo, joIndex) => {
 const leg = createLeg(jo, joIndex);
 legs.push(leg);
});

// ❌ Wrong method: [0]only Process (FULL from Mode inbound Missing!)
const firstJourney = offer.JourneyOverview?.[0];
```

### 3. direction Determine

```typescript
// ✅ JourneyOverview to Index direction Determine
const direction = joIndex === 0 ? 'outbound' : 'inbound';

// ❌ OriginDestList Mappingto direction Determine (not required 복catchproperty)
const originDestId = journeyToOdMap.get(journeyId);
```

---

## UI Process Logic

### FlightCard Rendering

```typescript
// legs Array Use
const legs = flight.legs?.length > 0
 ? flight.legs
 : [{ direction: 'outbound', ... }];

const isMultiLeg = legs.length > 1;

// FULL Mode: two Journey/Itinerary All Display
{legs.map((leg) => (
 <div key={leg.journeyId}>
 {isMultiLeg && <div>{leg.directionLabel}</div>}
 <FlightInfo leg={leg} />
 </div>
))}
```

### PARTIAL Mode Journey/Itinerary Classify

```typescript
// legs[0].directionto Classify
const outboundFlights = flights.filter(f =>
 f.legs?.[0]?.direction === 'outbound'
);
const inboundFlights = flights.filter(f =>
 f.legs?.[0]?.direction === 'inbound'
);
```

### ⭐ PARTIAL Mode: Outbound when Select Same Carrier Return only Display

UX itemspre For Outbound when Select Corresponding Carrier's Return only using filtering Display.
Different Carrier's Return 숨겨 User 혼란 Prevention.

```typescript
// ⭐ Outbound when Select Same Carrier Return only filtering
const filteredInboundFlights = applyFilters(
 outboundFlight
 ? inboundFlights.filter(f => f.airline.code === outboundFlight.airline.code)
 : inboundFlights
);
```

**Reason**:
- PARTIAL from Mode Outbound SQ, Return KE if Select Booking unavailable하거나 복catch질 Exists
- Same to Carrier Round-trip must Composition Fare Combination Available Case 많
- User에게 Selectable Option only 보여줘 실수 Prevention

---

## Per carrier Response difference

| Carrier | MatchResult Case | JourneyOverview Count |
|--------|-------------------|---------------------|
| SQ (Singapore) | `"PARTIAL"` | FULL: 2items, PARTIAL: 1items |
| KE (Korean Air) | `"PARTIAL"` | FULL: 2items, PARTIAL: 1items |
| TR (Scoot) | `"Partial"` | FULL: 2items, PARTIAL: 1items |
| AA (아메리칸) | `"Full"` | FULL: 2items |

---

## Related documents

| Document | Description |
|------|------|
| **Template** | `.claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template` |
| `api-client/offer-transformer.md` | Response Conversion Function |
| `pages/search-results.md` | Search results Page UI Guide |
