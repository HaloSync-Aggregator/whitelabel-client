# Luna B2C UI Guide

## Overview

A B2C service that provides all NDC content from flight search to booking and payment in a single interface.

### Key Features
- Flight search and booking
- Payment and ticketing
- Ancillary services (seat, baggage) purchase

---

## Document Structure

```
luna-ui-component-guide/
├── README.md # Overview
├── 01-overview/
│ └── system-architecture.md # Service flow
├── 02-common/
│ ├── common-components.md # Common UI elements
│ ├── date-format.md # Date/time formats
│ ├── status-codes.md # Status display
│ └── design-system.md # Design system (NEW)
├── 03-booking/
│ ├── air-shopping.md # Flight search, MatchResult, baggage purchase
│ ├── search-filter.md # Search filter
│ ├── offer-price.md # Fare confirmation, post-ticketing fare recalculation
│ └── payment-popup.md # Payment input, airline-specific FOP
├── 04-booking-detail/
│ └── booking-detail.md # Booking detail, PNR lookup, ticket info
├── 06-change/
│ ├── journey-change.md # Journey change (NEW)
│ ├── passenger-split.md # Passenger split (NEW)
│ └── info-change.md # Info change (NEW)
├── 07-popups/
│ ├── service-popup.md # Ancillary service purchase
│ ├── seat-popup.md # Seat purchase
│ └── post-ticketing.md # Post-ticketing (NEW)
├── 08-data-types/
│ ├── api-elements.md # Data display
│ └── glossary.md # Terminology glossary
└── 09-missing-info.md # Missing information summary (NEW)
```

---

## Key Screens

### 1. Flight Search
- Origin/destination, date, passenger count input
- Cabin class, airline selection
- Direct/connecting flight filter

### 2. Search Results
- Flight list display
- Time range, airline-specific filtering
- Fare type selection

### 3. Payment
- Passenger information input
- Payment method selection
- Amount confirmation

### 4. Booking Detail
- PNR lookup and detailed information
- Pre-/post-ticketing screen differentiation
- Ticket information, SSR information display
- Seat/service purchase, journey change, and other features

### 5. Booking Changes
- Journey change: Date/segment changes
- Passenger split: Create separate PNR for some passengers
- Info change: Passenger name/contact modification

### 6. Post-Ticketing
- Payment and ticketing after booking
- Fare recalculation and difference confirmation
- Ticketing with ancillary services

---

## Supported Airlines

| Airline | Seat Selection | Service Purchase | Journey Change | Passenger Split | Info Change | Card Payment |
|---------|:--------------:|:----------------:|:--------------:|:---------------:|:-----------:|:------------:|
| AF (Air France) | O | O | O | - | O | O |
| KL (KLM) | O | O | O | - | O | O |
| SQ (Singapore Airlines) | O | O | O | O | - | O |
| QR (Qatar Airways) | O | O | O | O | - | O |
| LH (Lufthansa) | O | O | - | - | - | O |
| LX (Swiss) | O | O | - | - | - | O |
| OS (Austrian Airlines) | O | O | - | - | - | O |
| EK (Emirates) | O | O | - | - | - | O |
| AA (American Airlines) | O | - | - | - | - | O |
| KE (Korean Air) | O | O | O | - | O | O |
| HA (Hawaiian Airlines) | O | - | O | - | O | O |
| BA (British Airways) | O | O | - | - | - | O |
| AY (Finnair) | O | O | O | O | O | Planned |
| TR (Scoot) | O | O | - | - | - | O |
| TK (Turkish Airlines) | O | O | - | - | - | O |
| AS (Alaska Airlines) | O | - | - | - | - | O |
