# API-UI Mapping Reference Index

All/Total API-UI Mapping document Position: `.claude/assets/plan/api-ui-mapping/`

## Mapping document List

### Booking/Ticketing Flow (`mappings/booking/`)

| API | Document | UI Component |
|-----|------|------------|
| AirShopping | `air-shopping.md` | FlightCard, FilterPanel |
| OrderRetrieve | `order-retrieve.md` | BookingDetail |
| SeatAvailability | `seat-availability.md` | SeatMap |
| ServiceList | `service-list.md` | ServiceList |

### Booking Change Flow (`mappings/servicing/`)

| API | Document | UI Component |
|-----|------|------------|
| OrderReshop | `journey-change.md` | JourneyChange |
| OrderCancel | `cancel-refund.md` | CancelRefund |
| OrderChange | `info-change.md` | InfoChange |

---

## Key/Main Mapping Summary

### AirShopping → FlightCard

```
Offer.Owner → airlineLogo, airlineName
Offer.TotalPrice.TotalAmount → totalPrice, currency
DataLists.PaxSegmentList[].Departure → departureAirport, departureTime
DataLists.PaxSegmentList[].Arrival → arrivalAirport, arrivalTime
DataLists.PaxSegmentList[].FlightDuration → duration
DataLists.PaxSegmentList[].CabinType.Code → cabinClass
DataLists.BaggageAllowanceList[] → baggage
DataLists.PaxJourneyList[].PaxSegmentRefID.length - 1 → stops
```

### OrderRetrieve → BookingDetail

```
Order.BookingReferences[0].ID → pnr
Order.OrderID → orderId
Order.StatusCode → status
Order.TimeLimits → paymentTL, ticketingTL
DataLists.PassengerList[].Individual → Passenger information
DataLists.FlightSegmentList[] → Journey information
TicketDocInfos[] → Ticket Information (After ticketing)
```

### SeatAvailability → SeatMap

```
SeatMap.Cabin.Row[] → rows
Row.Number → rowNumber
Row.Seat[] → columns
Seat.Column + Row.Number → seatNumber
Seat.SeatStatus → availability
Seat.SeatCharacteristicCode → characteristics
Seat.Price.TotalAmount → price
```

---

## Conversion Function

### Common utility

```typescript
// FlightTime Conversion
formatDuration("PT6H30M") → "6Time 30 min"

// SeatClass Conversion
cabinClassMap['Y'] → "Economy class"
cabinClassMap['C'] → "Business class"

// Passenger type Conversion
ptcMap['ADT'] → "Adult"
ptcMap['CHD'] → "Child"
ptcMap['INF'] → "Infant"

// Stopover Display
formatStops(1) → "Non-stop"
formatStops(2) → "Stopover1 time(s)"

// Baggage Format
formatBaggage({WeightAllowance: {MaxWeight: 23, WeightUnit: 'KG'}}) → "23KG"
formatBaggage({PieceAllowance: {TotalQuantity: 2}}) → "2PC"
```

---

## Detail Document Position

All/Total Mapping Detail below from Path Confirm:

```
.claude/assets/plan/api-ui-mapping/
├── plan.md # All/Total Plan
├── mappings/
│ ├── ui-fields/ # UI Field definitions
│ │ ├── flight-card-fields.md
│ │ ├── filter-fields.md
│ │ ├── booking-detail-fields.md
│ │ └── ...
│ ├── booking/ # Booking/Ticketing Mapping
│ │ ├── air-shopping.md
│ │ ├── order-retrieve.md
│ │ ├── seat-availability.md
│ │ └── service-list.md
│ └── servicing/ # Booking Change Mapping
│ ├── journey-change.md
│ ├── cancel-refund.md
│ └── info-change.md
└── carrier-differences.md # Per carrier Differences
```
