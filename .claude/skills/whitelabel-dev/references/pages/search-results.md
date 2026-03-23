# Search results Page Implementation Guide

> **Path**: `/results`
> **File**: `src/pages/results.tsx`
> **API**: AirShopping → OfferPrice
> **Service Functions**: `searchFlights()`, `getOfferPrice()` in `src/lib/api/polarhub-service.ts`

---

## ⭐ Required DataLists Pass Field (Service Function → Component)

`searchFlights()` service function **Must** Next Field in Response must Include :

```typescript
return {
 success: true,
 flights, // Flight[] - UI for Display
 totalCount: flights.length,
 transactionId, // ⭐ session 추Applied

 // ⭐⭐⭐ PARTIAL Mode Required Field ⭐⭐⭐
 paxList, // ⭐ OfferPrice API for Call
 originDestList, // ⭐ PARTIAL Mode OD for 식별
 paxJourneyList, // ⭐ Journey/Itinerary Detail Information (Segment Mapping)
 paxSegmentList, // ⭐ Segment Detail Information (Fallback Logic)
};
```

### per Field Purpose

| Field | Purpose | PARTIAL Mode Required |
|------|------|------------------|
| `paxList` | OfferPrice API `paxList` Parameter | ✅ |
| `originDestList` | Outbound/Return OD per 식 | ✅ |
| `paxJourneyList` | Journey → Segment Mapping | ✅ (Fallback) |
| `paxSegmentList` | Segment Departure Retrieval | ✅ (Fallback) |

**⚠️ Fields Missingwhen TR, etc. Partial Carrier's PARTIAL Mode Behaviordoes not!**

---

## Common reference

| Document | Path |
|------|------|
| Concepts: MatchResult | `.claude/skills/whitelabel-dev/references/concepts/match-result.md` |
| AirShopping Mapping | `.claude/skills/whitelabel-dev/references/api-mapping/air-shopping.md` |
| OfferPrice Mapping | `.claude/skills/whitelabel-dev/references/api-mapping/offer-price.md` |
| Offer Transformer | `.claude/skills/whitelabel-dev/references/api-client/offer-transformer.md` |

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│ Header │
├──────────────────────────────────────────────────────────────┤
│ Search Summary: ICN → SIN | 2024-03-15 ~ 2024-03-22 | Adult 2person │
├──────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────┐ ┌──────────────────────────────────┐ │
│ │ │ │ Sort: Recommended순 | Lowest price | 최onlyTime │ │
│ │ FilterPanel│ ├──────────────────────────────────┤ │
│ │ │ │ │ │
│ │ - Stopover │ │ [FlightCard 1] │ │
│ │ - Carrier │ │ [FlightCard 2] │ │
│ │ - DepartureTime │ │ [FlightCard 3] │ │
│ │ - Baggage │ │ ... │ │
│ │ │ │ │ │
│ └─────────────┘ └──────────────────────────────────┘ │
│ │
├──────────────────────────────────────────────────────────────┤
│ Footer │
└──────────────────────────────────────────────────────────────┘
```

---

## FULL vs PARTIAL Mode

### FULL Mode (Default)

Single FlightCard Select → **Immediately** OfferPrice → PriceBreakdown Modal

```
FlightCard Click → Immediately OfferPrice API Call → Loading → PriceBreakdown Modal Display
```

### PARTIAL Mode

Outbound/Return **Split Select** after → "Selection complete" Button click → two to offer OfferPrice

```
⚠️ Core: PARTIAL from Mode FlightCard when Click OfferPrice Immediately if Call Done!
 Outbound/Return All after Select "Selection complete" Button click when in only OfferPrice Call
```

```
┌──────────────────────────────────────────────────────────────┐
│ [Outbound] [Return] ← Journey Selector │
├──────────────────────────────────────────────────────────────┤
│ │
│ ┌─ Select Outbound Summary ────────────────────────────────────┐ │
│ │ SQ123 ICN 10:00 → SIN 15:30 Non-stop ₩850,000 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ Return Select ───────────────────────────────────────────┐ │
│ │ [FlightCard 1] │ │
│ │ [FlightCard 2] │ │
│ │ [FlightCard 3] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Total: ₩1,700,000 [Selection complete] │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Status Management

### Default Status

```typescript
// Search results
const [flights, setFlights] = useState<Flight[]>([]);
const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Filter & Sort
const [filters, setFilters] = useState<Partial<FilterOptions>>({});
const [sortBy, setSortBy] = useState<SortOption>('recommended');

// OfferPrice
const [transactionId, setTransactionId] = useState<string>('');
const [paxList, setPaxList] = useState<Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>>([]);
const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownData | null>(null);
const [offerPriceLoading, setOfferPriceLoading] = useState(false);
```

### PARTIAL Mode Add Status

```typescript
// PARTIAL Mode Detection
const [isPartialMode, setIsPartialMode] = useState(false);
const [originDestList, setOriginDestList] = useState<OriginDest[]>([]);

// PARTIAL: Outbound/Return Split Select
const [activeJourney, setActiveJourney] = useState<'outbound' | 'inbound'>('outbound');
const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null);
const [inboundFlight, setInboundFlight] = useState<Flight | null>(null);

// PARTIAL: Journey/per Itinerary Flight Classify
const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
const [inboundFlights, setInboundFlights] = useState<Flight[]>([]);
```

---

## PARTIAL Mode Detection

```typescript
useEffect(() => {
 // AirShopping from Response PARTIAL offer Exists Whether Confirm
 const hasPartialOffers = flights.some(f => f._raw?.matchResult === 'PARTIAL');
 const isRoundTrip = originDestList.length > 1 && tripType === 'roundtrip';

 setIsPartialMode(hasPartialOffers && isRoundTrip);

 if (hasPartialOffers && isRoundTrip) {
 // Journey/per Itinerary Flight Classify
 const outbound = flights.filter(f =>
 f._raw?.originDestId === originDestList[0]?.OriginDestID
 );
 const inbound = flights.filter(f =>
 f._raw?.originDestId === originDestList[1]?.OriginDestID
 );

 setOutboundFlights(outbound);
 setInboundFlights(inbound);
 }
}, [flights, originDestList]);
```

---

## ⚠️⚠️ PARTIAL Mode Filter Applied (Required!) ⚠️⚠️

** Logic Missingwhen PARTIAL from Mode Filter 패널 Behaviordoes not!**

PARTIAL from Mode also Filter Appliedmust . `outboundFlights`와 `inboundFlights` Filter Appliednot notif Filter 패널 Behaviordoes not.

```typescript
// ⭐ Common Filter Function Definition
const applyFilters = (flightList: Flight[]): Flight[] => {
 let result = [...flightList];

 // Filter by stops
 if (filters.stops?.length > 0) {
 result = result.filter(f => filters.stops!.includes(f.stops));
 }

 // Filter by airlines
 if (filters.airlines?.length > 0) {
 result = result.filter(f => filters.airlines!.includes(f.airline.code));
 }

 // Filter by departure time
 if (filters.departureTime?.length > 0) {
 result = result.filter(f => {
 const hour = parseInt(f.departure.time.split(':')[0]);
 return filters.departureTime!.includes(getTimeSlot(hour));
 });
 }

 return result;
};

// ⭐ PARTIAL for Mode Filter List (매 렌more마다 Calculate)
const filteredOutboundFlights = applyFilters(outboundFlights);

// ⭐⭐ UX itemspre: Outbound when Select Same Carrier Return only filtering
// Different Carrier's Return 숨겨 User 혼란 Prevention
const filteredInboundFlights = applyFilters(
 outboundFlight
 ? inboundFlights.filter(f => f.airline.code === outboundFlight.airline.code)
 : inboundFlights
);

// from JSX Filter List Use
{isPartialMode ? (
 <div>
 {(activeJourney === 'outbound' ? filteredOutboundFlights : filteredInboundFlights)
 .map(flight => (
 <FlightCard
 key={flight.id}
 flight={flight}
 onSelect={(f) => {
 // ⭐⭐ FULL Fare Immediately OfferPrice Call (PARTIAL Mode UIfrom)
 // API in Response FULL and PARTIAL 섞여exists Exists
 if (f._raw?.matchResult === 'FULL') {
 handleSelectFlight(f); // Immediately OfferPrice
 } else if (activeJourney === 'outbound') {
 handleSelectOutbound(f);
 } else {
 handleSelectInbound(f);
 }
 }}
 />
 ))}
 </div>
) : (
 // FULL Mode
)}
```

**Reason**: `outboundFlights`와 `inboundFlights` initial API Response in point in time 번 only Classify되므, after Filter Status Change also reflectnot . filtering Version to Separate must Calculate .

---

## Component Branch

```tsx
return (
 <>
 <Header />

 {/* Search Summary */}
 <SearchSummary origin={origin} destination={destination} ... />

 <main>
 {error ? (
 <ErrorDisplay error={error} />
 ) : (
 <div className="flex gap-6">
 {/* Filter */}
 <FilterPanel airlines={airlines} onFilterChange={setFilters} />

 {/* Search results */}
 {isPartialMode ? (
 <PartialModeResults
 activeJourney={activeJourney}
 setActiveJourney={setActiveJourney}
 outboundFlights={outboundFlights}
 inboundFlights={inboundFlights}
 outboundFlight={outboundFlight}
 inboundFlight={inboundFlight}
 onSelectOutbound={setOutboundFlight}
 onSelectInbound={setInboundFlight}
 onProceed={handlePartialOfferPrice}
 />
 ) : (
 <FullModeResults
 flights={filteredFlights}
 onSelect={handleSelectFlight}
 loading={offerPriceLoading}
 selectedId={selectedFlight?.id}
 />
 )}
 </div>
 )}
 </main>

 <Footer />

 {/* ⭐ PriceBreakdown Modal - open prop Required! */}
 {priceBreakdown && (
 <PriceBreakdown
 data={priceBreakdown}
 open={!!selectedFlight || (isPartialMode && !!outboundFlight && !!inboundFlight)}
 onClose={() => {
 setPriceBreakdown(null);
 setSelectedFlight(null);
 }}
 onProceed={handleProceedToBooking}
 />
 )}
 </>
);
```

---

## PARTIAL Mode UI Component

### JourneySelector

```tsx
interface JourneySelectorProps {
 active: 'outbound' | 'inbound';
 onChange: (journey: 'outbound' | 'inbound') => void;
 outboundSelected: boolean;
 inboundSelected: boolean;
}

function JourneySelector({
 active,
 onChange,
 outboundSelected,
 inboundSelected
}: JourneySelectorProps) {
 return (
 <div className="flex border-b">
 <button
 className={`px-6 py-3 ${active === 'outbound' ? 'border-b-2 border-primary' : ''}`}
 onClick={() => onChange('outbound')}
 >
 Outbound {outboundSelected && '✓'}
 </button>
 <button
 className={`px-6 py-3 ${active === 'inbound' ? 'border-b-2 border-primary' : ''}`}
 onClick={() => onChange('inbound')}
 >
 Return {inboundSelected && '✓'}
 </button>
 </div>
 );
}
```

### SelectedFlightSummary

```tsx
interface SelectedFlightSummaryProps {
 flight: Flight | null;
 direction: 'outbound' | 'inbound';
 onClear: () => void;
}

function SelectedFlightSummary({ flight, direction, onClear }: SelectedFlightSummaryProps) {
 if (!flight) return null;

 return (
 <div className="bg-surface border rounded-lg p-4 mb-4">
 <div className="flex justify-between items-center">
 <div>
 <span className="text-sm text-muted">
 {direction === 'outbound' ? 'Select Outbound' : 'Select Return'}
 </span>
 <div className="font-medium">
 {flight.airline.name} {flight.flightNumber}
 </div>
 <div className="text-sm text-muted">
 {flight.departure.airport} {flight.departure.time} →
 {flight.arrival.airport} {flight.arrival.time}
 </div>
 </div>
 <div className="text-right">
 <div className="font-bold text-primary">
 {flight.price.toLocaleString()} {flight.currency}
 </div>
 <button onClick={onClear} className="text-sm text-muted hover:text-error">
 Select Cancellation
 </button>
 </div>
 </div>
 </div>
 );
}
```

### PartialModeFooter

```tsx
interface PartialModeFooterProps {
 outboundFlight: Flight | null;
 inboundFlight: Flight | null;
 onProceed: () => void;
 loading: boolean;
}

function PartialModeFooter({
 outboundFlight,
 inboundFlight,
 onProceed,
 loading
}: PartialModeFooterProps) {
 const totalPrice = (outboundFlight?.price || 0) + (inboundFlight?.price || 0);
 const currency = outboundFlight?.currency || inboundFlight?.currency || 'KRW';
 const canProceed = outboundFlight && inboundFlight;

 return (
 <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
 <div className="max-w-7xl mx-auto flex justify-between items-center">
 <div>
 <div className="text-sm text-muted">Expected Totalamount</div>
 <div className="text-2xl font-bold text-primary">
 {totalPrice.toLocaleString()} {currency}
 </div>
 </div>
 <button
 onClick={onProceed}
 disabled={!canProceed || loading}
 className="px-8 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
 >
 {loading ? 'Retrieval ...' : 'Selection complete'}
 </button>
 </div>
 </div>
 );
}
```

---

## ⚠️⚠️ FULL/PARTIAL 혼합 Mode Process (Required!) ⚠️⚠️

**API in Response FULL and PARTIAL Fare 섞여 exists .!**

PARTIAL Mode from UI also FULL Fare Select exists, Case FULL ModeLike must Behavior .

### FlightCard Click Handler

```typescript
// PARTIAL Mode from UI also FULL Fare Immediately OfferPrice Call
<FlightCard
 flight={flight}
 onSelect={(f) => {
 // ⭐ FULL Fare Immediately OfferPrice Call
 if (f._raw?.matchResult === 'FULL') {
 handleSelectFlight(f); // Immediately OfferPrice
 } else if (activeJourney === 'outbound') {
 handleSelectOutbound(f); // PARTIAL: Status only Update
 } else {
 handleSelectInbound(f); // PARTIAL: Status only Update
 }
 }}
/>
```

### handleProceedToBooking Verify Logic

```typescript
const handleProceedToBooking = () => {
 if (!priceBreakdown) return;

 // ⭐ FULL Fare Select Whether Confirm
 const isFullOffer = selectedFlight?._raw?.matchResult === 'FULL';

 // PARTIAL Mode Verify (FULL Fare not In the case of)
 if (isPartialMode && !isFullOffer && (!outboundFlight || !inboundFlight)) {
 alert('Outbound and Return All Select.');
 return;
 }

 // ⭐ bookingData when Save Actual Mode Judgment
 const actualPartialMode = isPartialMode && !isFullOffer;

 const bookingData = {
 // ...
 flight: actualPartialMode ? outboundFlight : selectedFlight,
 outboundFlight: actualPartialMode ? outboundFlight : undefined,
 inboundFlight: actualPartialMode ? inboundFlight : undefined,
 isPartialMode: actualPartialMode, // ⭐ Actual Mode
 // ...
 };
};
```

---

## OfferPrice Call

### ⚠️ Core: per Mode Handler Split

```typescript
// FULL Mode: FlightCard Click → Immediately OfferPrice Call
// PARTIAL Mode: FlightCard Click → Status only Update (OfferPrice Call )

const handleFlightCardClick = (flight: Flight) => {
 if (isPartialMode) {
 // PARTIAL: Status only Update, OfferPrice Call !
 if (activeJourney === 'outbound') {
 handleSelectOutbound(flight);
 } else {
 handleSelectInbound(flight);
 }
 } else {
 // FULL: Immediately OfferPrice Call
 handleSelectFlight(flight);
 }
};
```

### FULL Mode Handler

```typescript
// ⭐ FULL Mode: FlightCard Click → Immediately OfferPrice API Call
const handleSelectFlight = async (flight: Flight) => {
 setSelectedFlight(flight);
 setOfferPriceLoading(true);

 // paxList filtering (Select offer's pax)
 const offerPaxRefIds = new Set(
 (flight._raw?.offerItems || []).flatMap(item => item.paxRefId)
 );
 const filteredPaxList = paxList.filter(pax => offerPaxRefIds.has(pax.paxId));

 const data = await getOfferPrice({
 transactionId,
 offers: [{
 responseId: flight._raw!.responseId,
 offerId: flight._raw!.offerId,
 owner: flight._raw!.owner,
 offerItems: flight._raw!.offerItems,
 }],
 paxList: filteredPaxList,
 });

 // ...
};
```

### PARTIAL Mode Select Handler (OfferPrice Call !)

```typescript
// ⭐ PARTIAL Mode: FlightCard Click → Status only Update
// ❌ OfferPrice if Call !
const handleSelectOutbound = (flight: Flight) => {
 setOutboundFlight(flight); // Status only Update
 setActiveJourney('inbound'); // Return Tabto Navigate
 // ⚠️ OfferPrice Call None!
};

const handleSelectInbound = (flight: Flight) => {
 setInboundFlight(flight); // Status only Update
 // ⚠️ OfferPrice Call None!
};
```

### PARTIAL Mode OfferPrice Handler ("Selection complete" Button)

```typescript
// ⭐ PARTIAL Mode: "Selection complete" Button click when in only OfferPrice Call
// Outbound + Return two offer Doestogether Transmission
const handlePartialOfferPrice = async () => {
 if (!outboundFlight || !inboundFlight) {
 alert('Outbound and Return All Select.');
 return;
 }

 setOfferPriceLoading(true);

 // two offer Composition
 const offers = [
 {
 responseId: outboundFlight._raw!.responseId,
 offerId: outboundFlight._raw!.offerId,
 owner: outboundFlight._raw!.owner,
 offerItems: outboundFlight._raw!.offerItems,
 },
 {
 responseId: inboundFlight._raw!.responseId,
 offerId: inboundFlight._raw!.offerId,
 owner: inboundFlight._raw!.owner,
 offerItems: inboundFlight._raw!.offerItems,
 },
 ];

 // paxList merge
 const allPaxRefIds = new Set([
 ...(outboundFlight._raw!.offerItems || []).flatMap(i => i.paxRefId),
 ...(inboundFlight._raw!.offerItems || []).flatMap(i => i.paxRefId),
 ]);
 const mergedPaxList = paxList.filter(p => allPaxRefIds.has(p.paxId));

 const data = await getOfferPrice({
 transactionId,
 offers,
 paxList: mergedPaxList,
 });

 // ...
};
```

---

## Reference

- **🔗 Service Layer**: `src/lib/api/polarhub-service.ts` (searchFlights, getOfferPrice)
- **🔗 Offer Transformer Template**: `.claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template`
- **MatchResult Concepts**: `.claude/skills/whitelabel-dev/references/concepts/match-result.md`
- **OfferPrice Mapping**: `.claude/skills/whitelabel-dev/references/api-mapping/offer-price.md`
- **Actual Implementation Example**: `apps/DEMO001/src/pages/results.tsx`
