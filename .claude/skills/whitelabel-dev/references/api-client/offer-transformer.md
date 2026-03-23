# Offer Transformer Template (v2.0)

> **Range**: AirShopping, OfferPrice API Response → UI Data Conversion
> **File Position**: `src/lib/api/offer-transformer.ts`
> **Template**: `.claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template`

---

## Overview

```
AirShoppingRS → transformOffersToFlights() → Flight[]
OfferPriceRS → transformOfferPriceResponse() → PriceBreakdownData
```

---

## v2.0 Core Changenotes (2024.01)

### Data flow (OriginDestList Mapping not required!)

```
Offer.JourneyOverview[].PaxJourneyRefID → PaxJourneyList → PaxSegmentList
```

### JourneyOverview Array Order = Journey/Itinerary direction

- `JourneyOverview[0]` = outbound (Outbound)
- `JourneyOverview[1]` = inbound (Return)

### MatchResult Process

- **FULL**: JourneyOverview[] outbound + inbound All Include
- **PARTIAL**: JourneyOverview[] 1items Journey/Itinerary only Include

---

## 1. Interface Definition

### FlightLeg (New)

```typescript
export interface FlightLeg {
 direction: 'outbound' | 'inbound';
 directionLabel: string; // 'Outbound' | 'Return'
 journeyId: string; // PaxJourneyRefID
 departure: {
 airport: string;
 airportName?: string;
 time: string;
 date: string;
 terminal?: string;
 };
 arrival: {
 airport: string;
 airportName?: string;
 time: string;
 date: string;
 terminal?: string;
 };
 duration: string;
 stops: number;
 stopoverAirports?: string[];
 flightNumber: string;
 cabinClass?: string;
 segments: Array<{
 segmentId: string;
 flightNumber: string;
 carrier: string;
 departure: { ... };
 arrival: { ... };
 duration?: string;
 cabinClass?: string;
 }>;
}
```

### Flight (Update)

```typescript
export interface Flight {
 id: string;
 airline: {
 code: string;
 name: string;
 logo: string;
 };
 flightNumber?: string;
 // Backward compatibility: based on first leg
 departure: { ... };
 arrival: { ... };
 duration?: string;
 stops: number;
 stopoverAirports?: string[];
 cabinClass?: string;
 baggage?: string;
 price: number;
 currency: string;

 // ⭐ New Field: All Journey information
 // FULL Mode: [outbound, inbound] 2items
 // PARTIAL Mode: [outbound] or [inbound] 1items
 legs?: FlightLeg[];

 _raw?: {
 responseId: string;
 offerId: string;
 owner: string;
 offerItems?: Array<{
 offerItemId: string;
 paxRefId: string[];
 }>;
 matchResult?: 'FULL' | 'PARTIAL';
 originDestId?: string; // Backward compatibility (legs Use Recommended)
 };
}
```

---

## 2. Transform Function (v2.0)

### transformOffersToFlights

```typescript
export function transformOffersToFlights(response: AirShoppingResponse): Flight[] {
 const offers = response.Offer || [];
 const dataLists = response.DataLists;

 if (!dataLists) return [];

 const flights: Flight[] = [];
 const paxJourneyList = dataLists.PaxJourneyList || [];
 const paxSegmentList = dataLists.PaxSegmentList || [];

 offers.forEach((offer, idx) => {
 // ⭐ MatchResult Normalization
 const rawMatchResult = offer.MatchResult?.toUpperCase() || 'FULL';
 const matchResult: 'FULL' | 'PARTIAL' = rawMatchResult === 'PARTIAL' ? 'PARTIAL' : 'FULL';

 // ⭐ Core: JourneyOverview Array All/Total traverse
 const journeyOverviews = offer.JourneyOverview || [];

 // Fallback: OfferItem.from PaxJourneyRefID Extract
 if (journeyOverviews.length === 0 && offer.OfferItem?.[0]?.PaxJourneyRefID) {
 offer.OfferItem[0].PaxJourneyRefID.forEach((journeyId) => {
 journeyOverviews.push({ PaxJourneyRefID: journeyId });
 });
 }

 // ⭐ each JourneyOverview to FlightLeg Conversion
 const legs: FlightLeg[] = [];

 journeyOverviews.forEach((jo, joIndex) => {
 const journeyId = jo.PaxJourneyRefID;
 const journey = paxJourneyList.find(j => j.PaxJourneyID === journeyId);
 if (!journey) return;

 const segments = journey.PaxSegmentRefID
 .map(segId => paxSegmentList.find(s => s.PaxSegmentID === segId))
 .filter(Boolean);

 if (segments.length === 0) return;

 // ⭐ JourneyOverview to Index direction Determine
 const direction = joIndex === 0 ? 'outbound' : 'inbound';
 const directionLabel = joIndex === 0 ? 'Outbound' : 'Return';

 const leg: FlightLeg = {
 direction,
 directionLabel,
 journeyId,
 departure: { ... },
 arrival: { ... },
 duration: formatDuration(journey.Duration),
 stops: segments.length - 1,
 flightNumber: `${segments[0].MarketingCarrier.AirlineID}${segments[0].MarketingCarrier.FlightNumber}`,
 segments: segments.map(seg => ({ ... })),
 };

 legs.push(leg);
 });

 if (legs.length === 0) return;

 // ⭐ Fill existing fields based on first leg (backward compatibility)
 const firstLeg = legs[0];

 const flight: Flight = {
 id: offer.OfferID,
 airline: { ... },
 flightNumber: firstLeg.flightNumber,
 departure: firstLeg.departure,
 arrival: firstLeg.arrival,
 duration: firstLeg.duration,
 stops: firstLeg.stops,
 legs, // ⭐ New Field
 _raw: {
 responseId: offer.ResponseID,
 offerId: offer.OfferID,
 owner: offer.Owner,
 offerItems: offer.OfferItem.map(item => ({
 offerItemId: item.OfferItemID,
 paxRefId: item.PaxRefID || [], // ⭐ Directly Extract!
 })),
 matchResult,
 originDestId: firstLeg.journeyId,
 },
 };

 flights.push(flight);
 });

 return flights;
}
```

---

## 3. Precautions

### ⚠️⚠️⚠️ WF_PB_SEAT_REPRICE bug Prevention (Critical!) ⚠️⚠️⚠️

**OfferPriceRS's offerItems when Extract 3types Case Required Process!**

TR, AF, KL Carrier Seat after selection OfferPrice again Call (WF_PB_SEAT_REPRICE).
 2th OfferPrice from the response OfferItem 3types Type 혼합 .:

| OfferItem Type | paxRefId Position | Example |
|---------------|---------------|------|
| Fare Item | `item.FareDetail[].PaxRefID` | Journey/Itinerary Fare |
| Seat Item | `item.PaxRefID` (Directly) | Select Seat |
| Service Item | `item.Service[].PaxRefID` | in-flight meal, etc. |

```typescript
// ✅ Correct approach: 3types Case All Process
offerItems: pricedOffer.OfferItem.map((item) => {
 let paxRefId: string[] = [];

 // 1. Case where PaxRefID exists directly (Seat item - highest priority)
 if (item.PaxRefID && item.PaxRefID.length > 0) {
 paxRefId = item.PaxRefID;
 }
 // 2. from FareDetail Extract (Fare Item)
 else if (item.FareDetail && item.FareDetail.length > 0) {
 paxRefId = item.FareDetail.flatMap((fd) => fd.PaxRefID);
 }
 // 3. from Service Extract (Service Item)
 else if (item.Service && item.Service.length > 0) {
 paxRefId = item.Service.flatMap((svc) => {
 const ref = svc.PaxRefID;
 return Array.isArray(ref) ? ref : [ref];
 });
 }

 return { offerItemId: item.OfferItemID, paxRefId };
})

// ❌ Wrong method: FareDetail only Process
paxRefId: item.FareDetail?.flatMap((fd) => fd.PaxRefID) || []
// → Seat/Service Item's paxRefId Empty array Done → OrderCreate 500 Error!
```

---

### _raw.offerItems.paxRefId Extract Path (AirShoppingRS)

```typescript
// ✅ Correct approach: OfferItem.PaxRefID Directly Use
offerItems: offer.OfferItem?.map(item => ({
 offerItemId: item.OfferItemID,
 paxRefId: item.PaxRefID || [], // ⭐ Directly Extract
}))

// ❌ Wrong method: Service Internal's PaxRefID Use
paxRefId: item.Service?.[0]?.PaxRefID || [], // ❌ Prohibited!
```

### MatchResult Case Normalization

```typescript
// ✅ Correct approach: toUpperCase()로 Normalization
const rawMatchResult = offer.MatchResult?.toUpperCase() || 'FULL';
const matchResult: 'FULL' | 'PARTIAL' = rawMatchResult === 'PARTIAL' ? 'PARTIAL' : 'FULL';

// ❌ Wrong method: Directly compare
const matchResult = offer.MatchResult || 'FULL'; // "Partial" !== "PARTIAL"
```

### JourneyOverview All/Total traverse (FULL Mode)

```typescript
// ✅ Correct approach: JourneyOverview All/Total traverse
journeyOverviews.forEach((jo, joIndex) => {
 const leg = createLeg(jo, joIndex);
 legs.push(leg);
});

// ❌ Wrong method: JourneyOverview[0]only Process
const firstJourney = offer.JourneyOverview?.[0]; // FULL from Mode inbound Missing!
```

---

## 4. from UI legs Utilize

### FlightCard Rendering

```typescript
// legs Array if exists Use, if absent Backward compatibility
const legs = flight.legs?.length > 0
 ? flight.legs
 : [{ direction: 'outbound', ... }];

const isMultiLeg = legs.length > 1;

// All leg Rendering
{legs.map((leg, idx) => (
 <div key={leg.journeyId}>
 {isMultiLeg && <div>{leg.directionLabel}</div>}
 <FlightTimes departure={leg.departure} arrival={leg.arrival} />
 </div>
))}
```

---

## Reference

- **Template**: `.claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template`
- **Actual Implementation**: `apps/DEMO001/src/lib/api/offer-transformer.ts`
- **Concepts Guide**: `.claude/skills/whitelabel-dev/references/concepts/match-result.md`
