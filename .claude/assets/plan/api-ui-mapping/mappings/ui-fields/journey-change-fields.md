# JourneyChange UI Field definitions

> Source: `.claude/assets/ui-component-guide/06-change/journey-change.md`
> Template: `.claude/skills/whitelabel-dev/templates/types/journey-change.ts.template`

---

## 1. Supported Carriers

| Carrier | Pre-ticketing | Post-ticketing | Add/Delete | Notes |
|--------|:------:|:------:|:------:|------|
| QR (Qatar Airways) | X | O | X | Post-ticketing only |
| TK (Turkish Airlines) | O | O | O | Supports add/delete |
| AF (Air France) | O | O | X | RT only |
| KL (KLM) | O | O | X | RT only |
| SQ (Singapore Airlines) | O | O | X | - |
| AY (Finnair) | O | O | X | - |
| KE (Korean Air) | O | O | X | - |
| HA (Hawaiian Airlines) | O | O | O | Supports add/delete |

---

## 2. Step 1: Select Journey (PaxJourney-based, v3.24)

### CurrentItinerary (PaxJourney card)

| Field | Type | Required | Description | Source |
|-------|------|:----:|-------------|--------|
| paxJourneyId | string | O | PaxJourney ID (PJ1, PJ2) | PaxJourneyList[].PaxJourneyID |
| orderItemId | string | O | OrderItem ID | OrderItem.OrderItemID |
| origin | string | O | Journey origin airport | PaxJourneyList[].OnPoint |
| destination | string | O | Journey destination airport | PaxJourneyList[].OffPoint |
| departureDate | string | O | First segment departure date | PaxSegmentList[].Departure.Date |
| departureTime | string | O | First segment departure time | PaxSegmentList[].Departure.Time |
| arrivalTime | string | O | Last segment arrival time | PaxSegmentList[].Arrival.Time |
| flightTime | string | X | Total flight time (ISO) | PaxJourneyList[].FlightTime |
| carrierCode | string | O | Marketing carrier of first segment | MarketingCarrier.AirlineID |
| flightNumber | string | O | Flight number of first segment | MarketingCarrier.FlightNumber |
| status | string | O | Booking status | HK, HK T, CONFIRMED |
| segments | JourneySegmentInfo[] | O | All segments in journey | Resolved via PaxSegmentRefID |
| serviceIds | string[] | O | Service IDs for RetainServiceID | OrderItem.Service[].ServiceID |

### JourneySegmentInfo (segment within PaxJourney)

| Field | Type | Required | Description |
|-------|------|:----:|-------------|
| segmentId | string | O | PaxSegment ID |
| carrierCode | string | O | Marketing carrier code |
| flightNumber | string | O | Flight number |
| origin | string | O | Departure airport |
| destination | string | O | Arrival airport |
| departureDate | string | O | Departure date |
| departureTime | string | O | Departure time (HH:mm) |
| arrivalDate | string | O | Arrival date |
| arrivalTime | string | O | Arrival time (HH:mm) |
| status | string | O | Segment status |

---

## 3. Change Mode Selection (v3.24)

| Field | Type | Required | Description |
|-------|------|:----:|-------------|
| changeMode | JourneyChangeMode | O | 'change' / 'add' / 'delete' |
| supportedModes | array | O | Filtered by supportsAddDelete config |

### Change Mode Options

| Code | Label | Description | Supported Carriers |
|------|-------|-------------|-------------------|
| change | Journey Change | Change selected journey to different flight | All |
| add | Add Journey | Add new journey to booking | HA, TK only |
| delete | Delete Journey | Remove journey from booking | HA, TK only |

**Note**: When only 'change' mode is available, the ChangeModeSelector component is hidden (returns null).

---

## 4. Step 2: Flight Search Results

### ReshopOffer (Available Flight)

| Field | Type | Required | Description | Source |
|-------|------|:----:|-------------|--------|
| offerId | string | O | Offer ID | ReshopOffers[].OfferID |
| responseId | string | O | Response ID | ReshopOffers[].ResponseID |
| owner | string | O | Carrier code | ReshopOffers[].Owner |
| totalPrice | object | O | Total price | TotalPrice.TotalAmount |
| priceDifference | object | X | Price difference | PriceDifference |
| offerItems | OfferItem[] | O | Offer items | AddOfferItem[] |
| flights | ReshopFlight[] | X | Flight details | Extracted via PaxJourneyList |

### ReshopFlight (Flight detail)

| Field | Type | Required | Description | Source |
|-------|------|:----:|-------------|--------|
| segmentKey | string | O | PaxSegment ID | PaxSegmentList[].PaxSegmentID |
| carrierCode | string | O | Carrier code | MarketingCarrier.AirlineID |
| flightNumber | string | O | Flight number | MarketingCarrier.FlightNumber |
| origin | string | O | Origin airport | Departure.AirportCode |
| destination | string | O | Destination airport | Arrival.AirportCode |
| departureTime | string | O | Departure time | Departure.Time (HH:mm) |
| arrivalTime | string | O | Arrival time | Arrival.Time (HH:mm) |
| duration | string | O | Flight duration | FlightDuration (Xh Xm) |
| cabin | string | O | Cabin class | Y |
| stops | number | O | Number of stops | 0 |

---

## 5. Step 3: Confirm Change

### PriceSummary

| Field | Type | Required | Description |
|-------|------|:----:|-------------|
| quotedPrice | { amount, curCode } | X | New total fare |
| priceDifference | { amount, curCode } | X | Fare difference |
| paymentType | string | O | Payment method selected |

### Payment Methods

| Method | Supported Carriers |
|--------|-------------------|
| Cash/Bank Transfer | All |
| Credit Card | All |
| Voucher | AF, KL |

---

## 6. API Flow Per Carrier

| Carrier | Step 2-1 | Step 2-2 | Step 3 | Add/Delete |
|--------|----------|----------|--------|------------|
| QR, TK | OrderReshop | Reprice | OrderChange(F) | TK only |
| AF, KL | OrderReshop | Reprice | OrderChange x2 | No |
| SQ, AY, KE, HA | OrderReshop | OrderQuote | OrderChange(F) | HA only |

---

## TypeScript Interface (v3.24)

```typescript
// PaxJourney-based CurrentItinerary
interface CurrentItinerary {
 paxJourneyId: string;     // PaxJourney ID (PJ1, PJ2)
 orderItemId: string;       // OrderItem ID
 origin: string;            // OnPoint
 destination: string;       // OffPoint
 departureDate: string;
 departureTime: string;
 arrivalTime: string;
 flightTime?: string;       // PT14H20M
 carrierCode: string;
 flightNumber: string;
 status: string;
 segments: JourneySegmentInfo[];
 serviceIds: string[];      // For RetainServiceID
}

// Segment within a PaxJourney
interface JourneySegmentInfo {
 segmentId: string;
 carrierCode: string;
 flightNumber: string;
 origin: string;
 destination: string;
 departureDate: string;
 departureTime: string;
 arrivalDate: string;
 arrivalTime: string;
 status: string;
}

// Journey change state
interface JourneyChangeState {
 step: JourneyChangeStep;
 currentItineraries: CurrentItinerary[];
 selectedJourneyIds: string[];  // v3.24: was selectedOrderItemIds
 changeMode: JourneyChangeMode;
 // ... (search, confirm, common state)
}
```

---

## RetainServiceID Logic (v3.24)

```typescript
// Build delete items with correct RetainServiceID
function buildDeleteItems(
 itineraries: CurrentItinerary[],
 selectedJourneyIds: string[],
 changeMode: JourneyChangeMode
): DeleteItem[] {
 // Group by OrderItem
 // For each OrderItem with selected journeys:
 // RetainServiceID = serviceIds from NON-selected journeys in same OrderItem
 // All selected -> RetainServiceID = []
}
```

---

## Precautions

1. **Journey add/delete**: Only HA, TK support (`supportsAddDelete`)
2. **PaxJourney-based**: Use PaxJourneyList for selection, not segments
3. **RetainServiceID**: Services of NON-selected journeys must be retained
4. **OriginDestList**: Include ALL selected journeys
5. **PolarHub format**: AirportCode, MarketingCarrier.AirlineID
6. **Pre-ticketing**: AF, KL support; QR does not
7. **One-way/Multi-city**: AF, KL do not support
