# JourneyChange (OrderReshop) API-UI Mapping

> **API**: `POST /middleware/polarhub/order-reshop`
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/servicing/journey-change.md`
> **UI Guide**: `.claude/assets/ui-component-guide/06-change/journey-change.md`

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |
| Date Format | `.claude/assets/ui-component-guide/02-common/date-format.md` |

---

## Key/Main UI Component

- **ItinerarySelector**: PaxJourney-based journey card selection (v3.24)
- **ChangeModeSelector**: Change mode selector (add/delete restricted to HA/TK only)
- **FlightOptionList**: Available flight list from OrderReshop response
- **PriceSummaryCard**: Fare difference summary and payment

---

## v3.24 Critical Changes

### PaxJourney-based Selection (NOT Segment-based)
- Journey selection is by **PaxJourney** (not individual segments)
- Each PaxJourney card may contain multiple segments (connecting flights)
- Data source: `DataLists.PaxJourneyList` from OrderRetrieve response
- Selection key: `paxJourneyId` (PJ1, PJ2, etc.)

### Journey Add/Delete Restriction
- Only **HA** and **TK** carriers support journey add/delete
- All other carriers: only 'change' mode available
- Config: `JourneyPatternConfig.supportsAddDelete`
- When only 'change' mode available, ChangeModeSelector returns null (hidden)

### RetainServiceID Logic (PaxJourney-based)
- RetainServiceID = services on segments of **NON-selected** journeys within same OrderItem
- When ALL journeys in an OrderItem are selected -> RetainServiceID = [] (empty)
- When only SOME journeys selected -> RetainServiceID = serviceIds from non-selected journeys

### OriginDestList Construction
- Build from ALL selected journeys (not just the first one)
- Each selected journey contributes one OriginDest entry
- v3.25: Each journey uses **user-editable** origin/destination/date (not hardcoded from original)

---

## v3.25 Critical Changes

### Per-Journey Search Criteria (ItinerarySelector v1.2.0)
- Each selected journey now has **editable** origin, destination, and departure date inputs
- `JourneyCriteria` interface: `{ origin: string; destination: string; departureDate: string }`
- Criteria auto-initialized from original journey values on selection, removed on deselection
- `ItinerarySelector` exports `JourneyCriteria` and accepts `criteriaMap`/`onCriteriaChange` props
- `handleSearchFlights` is now **parameterless** — reads from `journeyCriteria` state
- Search button validates all criteria are filled before proceeding
- Flight status validation: use `status.startsWith('HK')` (not exact match — variants like `HK K`, `HK T` exist)

### Server-Side 2-Step OrderChange (AF/KL)
- Confirm route handles **both** OrderChange calls internally (no client-side 2-step logic)
- Client only calls `/journey-change/confirm` once, with no `paymentData` parameter
- `PriceSummaryCard` simplified — no payment method selection UI

### MW OrderChange Response Structure
- MW wraps Order inside `response`: `{ transactionId, response: { Order: {...} } }`
- Order extraction **must** chain fallbacks: `step1Data.Order || step1Data.order || step1Data.response?.Order || step1Data.response?.order`
- Without this, payment amount = 0 and orderItemIds = [] in Step 2

---

## API Flow

```
Step 1: Select PaxJourney cards (from OrderRetrieve DataLists.PaxJourneyList)
  |
Step 2-1: OrderReshop (Reshop) - Retrieve available flights
  |
Step 2-2: Reshop price pass-through (Pattern A/B) or OrderQuote (Pattern C) - Get fare difference
  |
Step 3: OrderChange - Apply journey change (AF/KL: server-side 2-step internally)
```

---

## Step 1: Current Journey Display (OrderViewRS - PaxJourney-based)

### PaxJourney Card Fields

| UI Field | API Path | Notes |
|---------|----------|------|
| paxJourneyId | `DataLists.PaxJourneyList[].PaxJourneyID` | Selection key |
| origin | `PaxJourneyList[].OnPoint` | Journey origin airport |
| destination | `PaxJourneyList[].OffPoint` | Journey destination airport |
| flightTime | `PaxJourneyList[].FlightTime` | Total flight time (ISO) |
| segments[] | Resolved via `PaxSegmentRefID` -> `PaxSegmentList` | Multi-segment display |

### Segment Fields (within PaxJourney)

| UI Field | API Path | Conversion |
|---------|----------|------|
| carrierCode | `PaxSegmentList[].MarketingCarrier.AirlineID` | - |
| flightNumber | `PaxSegmentList[].MarketingCarrier.FlightNumber` | - |
| origin | `PaxSegmentList[].Departure.AirportCode` | - |
| destination | `PaxSegmentList[].Arrival.AirportCode` | - |
| departureTime | `PaxSegmentList[].Departure.Time` | HH:mm |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | HH:mm |
| departureDate | `PaxSegmentList[].Departure.Date` | DD/MMM/YYYY |

---

## Step 2-1: OrderReshop Request

### Request Structure (camelCase required!)

```typescript
{
  transactionId: string,       // Reuse from OrderRetrieve!
  orderId: string,
  actionContext: "8",          // Voluntary
  updateOrder: {
    reshopOrder: {
      serviceOrder: {
        add: {
          originDestList: [     // v3.24: ALL selected journeys
            { origin: "ICN", destination: "CDG", departureDate: "2026-02-24" },
            { origin: "CDG", destination: "ICN", departureDate: "2026-03-28" }
          ],
          cabin: "Y"
        },
        delete: [{
          orderItemRefId: "fc65de5b-...",
          retainServiceId: []   // v3.24: services of NON-selected journeys
        }]
      }
    }
  }
}
```

### RetainServiceID Examples

**Case 1: All journeys selected (change all)**
```json
{ "retainServiceId": [] }
```

**Case 2: Only return journey selected (change return only)**
```json
{ "retainServiceId": ["SRV_PAX1_SEG1", "SRVID2_CO_PAX1_SEG1"] }
```
(Services on outbound SEG1 are retained because outbound journey is NOT selected)

### ReshopOffers Response Mapping

| UI Field | API Path | Notes |
|---------|----------|------|
| offerId | `ReshopOffers[].OfferID` | - |
| responseId | `ReshopOffers[].ResponseID` | For subsequent API |
| carrierCode | `ReshopOffers[].Owner` | - |
| flights | Extracted via PaxJourneyList chain | v3.24 |

### Flight Extraction (v3.24: PaxJourney-based)

```
AddOfferItem[].PaxJourneyRefID
  -> DataLists.PaxJourneyList[].PaxSegmentRefID
    -> DataLists.PaxSegmentList[] (actual flight info)
```

### PaxSegment Field Mapping (PolarHub format)

| UI Field | API Path | Notes |
|---------|----------|------|
| flightNumber | `PaxSegmentList[].MarketingCarrier.AirlineID + FlightNumber` | PolarHub format |
| origin | `PaxSegmentList[].Departure.AirportCode` | Not IATALocationCode |
| destination | `PaxSegmentList[].Arrival.AirportCode` | Not IATALocationCode |
| departureTime | `PaxSegmentList[].Departure.Time` | HH:mm (not AircraftScheduledDateTime) |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | HH:mm |
| duration | `PaxSegmentList[].FlightDuration` | ISO -> Xh Xm |
| stops | `PaxJourneyList[].PaxSegmentRefID.length - 1` | Calculate |

---

## Per carrier API Flow

| Carrier | Step 2-1 | Step 2-2 | Step 3 | Add/Delete |
|--------|----------|----------|--------|------------|
| QR | OrderReshop | Reshop price (no API call) | OrderChange(F) | No |
| TK | OrderReshop | Reshop price (no API call) | OrderChange(F) | **Yes** |
| AF, KL | OrderReshop | Reshop price (no API call) | OrderChange x2 (server-side) | No |
| SQ, AY, KE | OrderReshop | OrderQuote | OrderChange(F) | No |
| HA | OrderReshop | OrderQuote | OrderChange(F) | **Yes** |

---

## Change Modes

| Mode | Supported Carriers | Description |
|------|-------------------|-------------|
| change | All supported | Change selected journeys to different flights |
| add | HA, TK only | Add new journey to booking |
| delete | HA, TK only | Remove journey from booking |

---

## Precautions

1. **Journey add/delete**: Only HA and TK support (v3.24)
2. **PaxJourney-based selection**: Always use PaxJourneyList, not segments directly
3. **RetainServiceID**: Services of NON-selected journeys must be retained
4. **OriginDestList**: Must include ALL selected journeys, not just the first
5. **PolarHub field names**: Use AirportCode (not IATALocationCode), MarketingCarrier (not MarketingCarrierInfo)
6. **Before ticketing**: AF, KL only support pre-ticketing journey change
7. **One-way/Multi-city**: AF, KL do not support
8. **HK status variants**: Use `startsWith('HK')` — variants like `HK K`, `HK T` exist (v3.25)
9. **MW OrderChange response wrapping**: Order is inside `response.Order`, not top-level (v3.25)
10. **Server-side 2-step**: AF/KL confirm route handles both OrderChange calls; client calls confirm once (v3.25)
11. **Per-journey search criteria**: Each selected journey has editable origin/destination/date (v3.25)
