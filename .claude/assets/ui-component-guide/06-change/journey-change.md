# Journey Change

## Overview
Change journey/itinerary (date, flight, route, etc.) for ticketed or held bookings.

---

## 1. Entry Point

Booking detail > Journey information section > **Journey Change** button

---

## 2. Supported Carriers

| Carrier | Pre-ticketing | Post-ticketing | Add/Delete | Notes |
|--------|:------:|:------:|:------:|------|
| QR (Qatar Airways) | X | O | X | Post-ticketing only |
| TK (Turkish Airlines) | O | O | **O** | Supports add/delete |
| AF (Air France) | O | O | X | RT only, 2-step OrderChange |
| KL (KLM) | O | O | X | RT only, 2-step OrderChange |
| SQ (Singapore Airlines) | O | O | X | - |
| AY (Finnair) | O | O | X | - |
| KE (Korean Air) | O | O | X | - |
| HA (Hawaiian Airlines) | O | O | **O** | Supports add/delete |

---

## 3. Screen Composition

### Step 1: Select Journey to Change (PaxJourney-based, v3.24)

Display journey cards based on **DataLists.PaxJourneyList** from OrderRetrieve.
Each card represents one PaxJourney which may contain multiple segments (connecting flights).

| Item | Display format | Data source | Notes |
|------|----------|------|------|
| Journey origin | Airport code | PaxJourneyList.OnPoint | e.g., ICN |
| Journey destination | Airport code | PaxJourneyList.OffPoint | e.g., CDG |
| Flight time | Duration | PaxJourneyList.FlightTime | e.g., 14h 20m |
| Stops | Count | PaxSegmentRefID.length - 1 | Non-stop / N stops |
| Segments | Detail list | PaxSegmentList (resolved) | Per-segment info |

#### Per Segment (within journey card)

| Item | Display format | Notes |
|------|----------|------|
| Carrier + Flight | Code + Number | AF AF267 |
| Route | Origin -> Destination | ICN -> CDG |
| Times | HH:mm - HH:mm | 10:30 - 16:00 |
| Status | Badge | HK, HK T, CONFIRMED |
| Departure date | YYYY-MM-DD | 2026-02-24 |

#### Change Mode Selection (HA, TK only)

| Mode | Description | Carriers |
|------|-------------|----------|
| Journey Change | Change selected journey to different flight | All |
| Add Journey | Add new journey to booking (OW -> RT) | HA, TK only |
| Delete Journey | Remove journey from booking (RT -> OW) | HA, TK only |

**Note**: ChangeModeSelector is hidden (returns null) when only 'change' mode is available.
This applies to all carriers except HA and TK.

---

### Step 2: Flight Search Results

Display available flights from OrderReshop response.

| Item | Description |
|------|------|
| Flight info | Carrier, flight number, route, times |
| Duration | Flight duration |
| Stops | Non-stop / N stops |
| New fare | Total price of new itinerary |
| Price difference | Difference from original (+additional / -refund) |

---

### Step 3: Confirm and Change

| Section | Content |
|------|------|
| Original journey | Current booking journey info (PaxJourney-based) |
| New journey | Changed flight info from selected offer |
| Fare information | New total fare, additional payment / refund amount |
| Payment method | Cash, Card, or Voucher (AF/KL) |

---

## 4. Price Difference Display

| Item | Description | Display color |
|------|------|----------|
| New total fare | Fare after change | Default |
| Additional payment | Positive difference | Red |
| Refund amount | Negative difference | Green |

---

## 5. API Flow

### Per carrier API call order

| Carrier | Step 2-1 | Step 2-2 | Step 3 |
|--------|----------|----------|--------|
| QR, TK | OrderReshop (Reshop) | OrderReshop (Reprice) | OrderChange(F) |
| AF, KL | OrderReshop (Reshop) | OrderReshop (Reprice) | OrderChange -> OrderChange(F) |
| SQ, AY, KE, HA | OrderReshop (Reshop) | OrderQuote | OrderChange(F) |

---

## 6. Payment Methods

| Method | Carriers |
|--------|---------|
| Cash/Bank Transfer | All |
| Credit Card | All |
| Voucher | AF, KL |

---

## 7. v3.24 Implementation Notes

### PaxJourney-based Journey Selection
- Use `DataLists.PaxJourneyList` to build journey cards
- Selection is by `paxJourneyId` (PJ1, PJ2, etc.)
- Each PaxJourney resolves to one or more PaxSegments via PaxSegmentRefID

### RetainServiceID Logic
- When changing specific journeys, retain services of NON-changed journeys
- `RetainServiceID` = serviceIds from non-selected journeys within same OrderItem
- Empty array when all journeys are selected (no services to retain)

### OriginDestList Construction
- Include ALL selected journeys in originDestList
- Each journey contributes: { origin, destination, departureDate }
- First journey uses user-specified date; others use original dates

### PolarHub Response Format
- `Departure.AirportCode` (not `Dep.IATALocationCode`)
- `MarketingCarrier.AirlineID` (not `MarketingCarrierInfo.CarrierDesigCode`)
- `MarketingCarrier.FlightNumber` (not `MarketingCarrierFlightNumberText`)
- `Departure.Time` / `Arrival.Time` (not `AircraftScheduledDateTime`)
- `FlightDuration` (not `Duration`)

### Flight Extraction Chain
```
AddOfferItem[].PaxJourneyRefID
  -> PaxJourneyList[].PaxSegmentRefID
    -> PaxSegmentList[] (actual flight details)
```

---

## 8. Precautions

1. **Journey add/delete**: Only HA and TK support (supportsAddDelete config)
2. **PaxJourney-based selection**: Use PaxJourneyList, not segments directly
3. **RetainServiceID**: Must retain services of NON-selected journeys
4. **AF/KL RT only**: One-way/multi-city not supported for change
5. **Pre-ticketing**: AF, KL support; QR does not

---

## Related documents

- [Booking detail](../04-booking-detail/booking-detail.md)
- [Payment Popup](../03-booking/payment-popup.md)
