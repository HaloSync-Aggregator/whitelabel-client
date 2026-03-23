# Page Implementation Workflow

specialspecific Page Implementation Detail Guide.

## Support Page

| Page | Route Path | API | Key/Main Component |
|--------|------|-----|-------------|
| Search results | /flights | AirShopping | FlightCard, FilterPanel |
| Booking detail | /booking/:pnr | OrderRetrieve | BookingDetail |
| Seat selection | (Modal) | SeatAvailability | SeatMap |
| Service purchase | (Modal) | ServiceList | ServiceList |
| Journey change | /booking/:pnr/change | OrderReshop | JourneyChange |
| Cancellation/Refund | /booking/:pnr/cancel | OrderCancel | CancelRefund |
| Information change | (Modal) | OrderChange | InfoChange |

> **Routing**: Uses `react-router-dom` with `<BrowserRouter>`. Dynamic segments use `:param` syntax (e.g., `:pnr`).
> **Service Layer**: Pages call functions from `polarhub-service.ts` directly (no API routes).

---

## Search results Page

### File Structure

```
src/
├── pages/FlightsPage.tsx
└── components/search/
 ├── SearchForm.tsx
 ├── SortOptions.tsx
 ├── FilterPanel.tsx
 ├── FlightCard.tsx
 └── PromoBanner.tsx
```

### FlightCard Required Element

| UI Element | API Path | Conversion |
|---------|----------|------|
| Carrier Logo | CarrierList[].CarrierDesigCode | Image path |
| Carrierperson | CarrierList[].Name | - |
| Flight number | Flight.MarketingCarrier.FlightNumber | {carrier}{number} |
| Departure Time | Flight.Departure.Time | HH:mm |
| Departure Airport | Flight.Departure.AirportCode | - |
| Arrival Time | Flight.Arrival.Time | HH:mm |
| Arrival Airport | Flight.Arrival.AirportCode | - |
| FlightTime | Flight.FlightDetail.FlightDuration | ISO8601 → Korean |
| Stopover Information | FlightRefList.length - 1 | Non-stop/StopoverN |
| SeatClass | FareDetail.CabinType | Code → Korean |
| Baggage | BaggageAllowance | Format Conversion |
| Price | Offer.TotalPrice | 천Unit 콤마 |

### FilterPanel Required Category

```
□ Stopover (Non-stop/Stopover1 time(s)/Stopover2 time(s)+)
□ Free Baggage (Include/unInclude)
□ Carrier (+ Lowest price Display!)
□ Seat Class
□ Departure Time
□ Arrival Time
□ PaymentCondition (exists Case)
```

---

## Booking detail Page

### File Structure

```
src/
├── pages/BookingPage.tsx
└── components/booking/
 ├── BookingHeader.tsx
 ├── PassengerList.tsx
 ├── ItineraryList.tsx
 ├── PaymentInfo.tsx
 ├── SSRInfo.tsx
 └── TicketInfo.tsx
```

### Before ticketing/after Branch

```tsx
import { useParams } from 'react-router-dom';
import { useBooking } from '@/hooks/useBooking';

export default function BookingPage() {
 const { pnr } = useParams<{ pnr: string }>();
 const { booking, loading } = useBooking(pnr);

 if (loading || !booking) return <div>Loading...</div>;

 const isTicketed = booking.tickets && booking.tickets.length > 0;

 return (
 <div>
 <BookingHeader booking={booking} isTicketed={isTicketed} />
 <PassengerList passengers={booking.passengers} />
 <ItineraryList segments={booking.segments} />

 {!isTicketed && <PaymentInfo amount={booking.paymentAmount} />}
 {isTicketed && <TicketInfo tickets={booking.tickets} />}

 <SSRInfo ssrs={booking.ssrs} />
 </div>
 );
}
```

### BookingHeader Required Element

| UI Element | API Path | Notes |
|---------|----------|------|
| PNR | Order.BookingReferences[0].ID | - |
| OrderID | Order.OrderID | Luna OrderID |
| Booking Status | Order.StatusCode | Status 뱃 |
| Payment Deadline | Order.TimeLimits.PaymentTimeLimit | Before ticketing only |
| Ticketing Deadline | Order.TimeLimits.TicketingTimeLimit | Before ticketing only |
| TicketingDate/Time | (Luna DB) | After ticketing only |

### Button Exposed Condition

| Button | Before ticketing | After ticketing | Supported carriers |
|------|:------:|:------:|-----------|
| Payment&Issue | O | X | All/Total |
| Cancel | O | X | AF,KL,SQ,QR,LH,EK,AA,BA,TR,TK |
| VOID | X | O | Same day only |
| REFUND | X | O | AF,KL,SQ,QR,LH,EK,AA,BA,TR,TK |
| Seat | O | O | AF,KL,SQ,QR,LH,EK,AA,BA,TR,TK |
| Service | O | O | AF,KL,SQ,QR,LH,EK,BA,TR,TK |
| Journey/ItineraryChange | △ | O | AF,KL,SQ,QR,KE,HA,AY |
| InformationChange | O | O | AF,KL,KE,HA,AY |

---

## Seat selection (Modal)

### File Structure

```
src/components/seat/
├── SeatModal.tsx
├── SeatMap.tsx
├── SeatLegend.tsx
└── SeatSelection.tsx
```

### SeatMap Implementation

```tsx
function SeatMap({ rows, onSeatSelect }) {
 return (
 <div className="seat-map">
 {rows.map(row => (
 <div key={row.number} className="flex gap-1">
 {row.seats.map(seat => (
 <Seat
 key={seat.column}
 seat={seat}
 onClick={() => onSeatSelect(seat)}
 />
 ))}
 </div>
 ))}
 </div>
 );
}
```

### Seat per Status Style

| Status | Style | Click Available |
|------|--------|:--------:|
| Available | 흰color background | O |
| Occupied | color background | X |
| Selected | blue background | O (Cancellation) |
| Premium | 노랑 background | O |
| Exit Row | 초록 background | O |

---

## Service purchase (Modal)

### Service Category

| Category | Code | Item Example |
|----------|------|----------|
| Baggage | BAGGAGE | Additional baggage 23kg |
| in-flight meal | MEAL | in-flight meal Select |
| lounge | LOUNGE | lounge 이for권 |
| Other | OTHER | priority boarding |

---

## Journey change

### 3Step Flow

```
Step 1: Change Journey/Itinerary Select
 ↓
Step 2: Change Available Flight Retrieval
 ↓
Step 3: Difference Confirm and Payment
```

### Per carrier API Flow

| Carrier | Step 2 | Step 3 |
|--------|--------|--------|
| QR,SQ | OrderReshop → OrderReshop(Reprice) | OrderChange(F) |
| AF,KL | OrderReshop → OrderReshop(Reprice) | OrderChange → OrderChange(F) |
| KE,HA | OrderReshop → OrderQuote | OrderChange(F) |
| AY | OrderReshop → OrderQuote | OrderChange → OrderChange(F) |

---

## Cancellation/Refund

### Cancellation Flow

```
OrderRetrieve → [Confirmation popup] → OrderCancel
```

### Refund Flow

```
OrderRetrieve → OrderReshop(cancelOrderRefId) → [Quote/Estimate Confirm] → OrderCancel
```

### Refund Quote/Estimate Display

| Item | Display |
|------|------|
| Original fare | 1,234,000KRW |
| Cancellation fee | -50,000KRW |
| **Expected refund amount** | **1,184,000KRW** |

---

## Information change

### Change Type

| Type | Item | Supported carriers |
|------|------|-----------|
| PaxInfo | Title, Surname, GivenName | AF,KL,KE,HA |
| ContactInfo | Mobile, Email | AF,KL,KE,HA,AY |

### AY special Logic

AY Modify not Add/Delete Method:
- Contact Add: new Contact Input → OrderChange(Add)
- Contact Delete: Existing Contact Select → OrderChange(Delete)
