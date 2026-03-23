# System Architecture

## Service Flow

### Booking/Ticketing Flow
```
Flight Search -> Flight Selection -> Fare Confirmation -> Passenger Info Input -> Payment -> Booking Complete
```

---

## Key Pages

| Page | Function |
|------|----------|
| Flight Search | Search flights by origin, destination, date, and passenger count |
| Search Results | View and filter searched flight list |
| Payment | Enter passenger information and proceed with payment |

---

## Booking Status

### Pre-Ticketing
- Booking only completed
- Payment required within payment deadline
- PNR cancellation available

### Post-Ticketing
- Airline ticket issued
- VOID (same-day cancellation) or REFUND available
- Ancillary services (seat, baggage, etc.) purchase available

### Cancelled
- Booking has been cancelled
- Refund processed based on cancellation reason

---

## Airline Feature Support

| Feature | Supported Airlines |
|---------|-------------------|
| Seat Selection | AF, KL, SQ, QR, LH, LX, OS, EK, AA |
| Service Purchase | AF, KL, SQ, QR, LH, LX, OS, EK |
| Journey Change | AF, KL, SQ, QR |
| Passenger Split | SQ, QR |
| Info Change | AF, KL |
