# Whitelabel Code Template

> **Version**: 4.0.0
> **Final Update**: 2026-02-15
> **Architecture**: Vite + React SPA (migrated from Next.js)
> **Criteria Code**: DEMO001

---

## Overview

This folder contains code templates used when creating a new tenant.
Agents (component-builder, app-builder) must create code based on these templates.
All output is created under **`apps/{tenant_id}/`**, not `tenant/{tenant_id}/apps/`.

**Architecture Change (v4.0)**: Templates now generate **Vite + React SPA** apps instead of Next.js apps.
- No API routes (removed `api-routes/` directory)
- Service layer calls middleware directly from browser (`polarhub-service.ts`)
- React Router instead of Next.js App Router
- No `'use client'` directives (everything is client-side)
- Static build output (`dist/`) served by nginx or CloudFront

---

## Folder Structure

```
templates/
├── config/                         # Configuration Templates
│   ├── design-system.json          # Design tokens (Color, typography, spacing)
│   ├── header.json                 # Header Spec (brand, navigation, bottom menu)
│   ├── footer.json                 # Footer Spec (link, copyright)
│   ├── vite.config.ts.template     # ⭐ Vite build configuration
│   ├── index.html.template         # ⭐ HTML entry point (Material Symbols font)
│   ├── main.tsx.template           # ⭐ React entry with BrowserRouter
│   ├── App.tsx.template            # ⭐ Route definitions (5 routes)
│   ├── vite-env.d.ts.template      # ⭐ Vite env type declarations
│   ├── nginx.conf.template         # ⭐ SPA routing config
│   └── Dockerfile.template         # ⭐ Static SPA Docker build
├── lib/                            # Service Layer Templates
│   ├── polarhub-service.ts.template    # ⭐ Main service module (23 functions, replaces API routes)
│   ├── order-retrieve-transformer.ts.template  # ⭐ OrderRetrieve response transformer
│   ├── pax-change-service.ts.template  # ⭐ Passenger change service
│   ├── middleware-client.ts.template   # Middleware API Client (browser-compatible)
│   ├── offer-transformer.ts.template   # Offer Response transformer
│   ├── seat-transformer.ts.template    # SeatAvailability Response transformer
│   ├── service-transformer.ts.template # ServiceList Response transformer
│   └── error-messages.ts.template      # Error message constants
├── pages/                          # Page Templates
│   ├── search-page.tsx.template        # Home/Search Page
│   ├── results-page.tsx.template       # Search Results Page
│   ├── booking-page.tsx.template       # Booking Page (seat/service selection)
│   ├── booking-detail-page.tsx.template # Booking Detail Page
│   └── cancel-page.tsx.template        # Cancel/Refund Page
├── components/                     # Component Templates (59 files)
│   ├── layout/
│   │   ├── Header.tsx.template         # Header (react-router-dom Link, useLocation)
│   │   └── Footer.tsx.template         # Footer (react-router-dom Link)
│   ├── ui/ (6 files)                   # Base UI (Button, Card, Modal, Badge, Input)
│   ├── booking/ (14 files)             # Booking components
│   │   ├── journey-change/ (6 files)   # Journey change modals
│   │   └── pax-change/ (8 files)       # Passenger change forms
│   ├── cancel/ (4 files)               # Cancel/Refund components
│   ├── flight/ (3 files)               # Flight display
│   ├── payment/ (4 files)              # Payment components
│   ├── search/ (1 file)                # SearchForm
│   ├── seat/ (4 files)                 # Seat components
│   └── service/ (3 files)              # Service components
├── types/ (12 files)               # TypeScript type definitions
└── README.md
```

---

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{TENANT_ID}}` | Tenant identifier | `DEMO001`, `DEMO001` |

> **Note**: `POINT_OF_SALE`, `AGENCY_ID`, etc. are imported from `tenant.ts` (not placeholders).
> `VITE_MIDDLEWARE_URL` is set via `.env` file (not a template placeholder).

---

## Service Layer Architecture (v4.0)

### Architecture Diagram

```
Browser (Vite SPA)
  │
  ├── polarhub-service.ts ────────────► Middleware Server
  │   (23 functions)                     /middleware/polarhub/*
  │   ├── searchFlights()
  │   ├── getOfferPrice()
  │   ├── createBooking()
  │   ├── getBookingDetail()     ┌── order-retrieve-transformer.ts
  │   │   └── transforms via ────┘   (1,200 LOC, 12-carrier matrix)
  │   ├── changePax()            ┌── pax-change-service.ts
  │   │   └── delegates to ──────┘   (900 LOC, 3 operation modes)
  │   ├── processTicketing()
  │   ├── processSeatPurchase()
  │   ├── processServicePurchase()
  │   └── ...18 more functions
  │
  └── middleware-client.ts ───────────► callMiddlewareAPI()
      (single HTTP channel)              fetch('/middleware/...')
```

### Service Function Usage Pattern

```typescript
// Import service functions directly (no fetch/apiUrl needed)
import { searchFlights, getBookingDetail, ApiError } from '@/lib/api/polarhub-service';

// Call service function
try {
  const result = await searchFlights({ origin, destination, departureDate, ... });
  setFlights(result.flights);
} catch (error) {
  if (error instanceof ApiError) {
    setError(error.message);
  }
}
```

### Service Functions by Domain

| Domain | Functions | Notes |
|--------|-----------|-------|
| Pre-Booking | `searchFlights`, `getOfferPrice`, `getSeatAvailability`, `getServiceList` | |
| Booking | `createBooking`, `getBookingDetail`, `cancelBooking` | |
| Post-Booking Ticketing | `getOrderQuote`, `processTicketing`, `getRefundQuote`, `getReshopTicketing` | |
| Pax Changes | `changePax`, `splitPax` | Delegates to pax-change-service.ts |
| Seat Purchase | `getSeatPurchaseQuote`, `confirmSeatPurchase` | |
| Service Purchase | `processServicePurchase`, `getServicePurchaseQuote`, `confirmServicePurchase`, `addServicePurchase` | |
| Journey Change | `processJourneyChange`, `getJourneyChangeQuote`, `confirmJourneyChange` | |

---

## Required Logic (Never Omit)

### polarhub-service.ts

1. **ApiError class for typed error handling**
   ```typescript
   export class ApiError extends Error {
     constructor(message: string, public status: number, public code?: string) {
       super(message);
       this.name = 'ApiError';
     }
   }
   ```

2. **Result code validation (carrier-specific)**
   ```typescript
   const resultCode = response.ResultMessage?.Code;
   const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS' || !resultCode;
   ```

3. **DataLists pass-through for search results**
   ```typescript
   return {
     flights,
     paxList,
     originDestList,
     paxJourneyList,  // Required for PARTIAL mode!
     paxSegmentList,   // Required for PARTIAL mode!
   };
   ```

### order-retrieve-transformer.ts

1. **DataLists Parsing** - Extract from `DataLists`, NOT `Order`
   ```typescript
   const dataLists = data.DataLists;
   const paxList = dataLists?.PaxList || [];
   const paxSegmentList = dataLists?.PaxSegmentList || [];
   ```

2. **isPaid detection (v3.26)** - Filter FOP entries with Amount=0
   ```typescript
   const hasPaymentList = paymentList.some(p => {
     const amount = typeof p.Amount === 'number' ? p.Amount
       : (p.Amount as { Amount?: number } | undefined)?.Amount ?? 0;
     return amount > 0;
   });
   const isPaid = hasPaymentList || hasTickets;
   ```

3. **Phone/Passport field mapping (v3.7)** - PolarHub field names differ from NDC standard
   ```typescript
   // Phone: Array with Number type
   // Passport: IdentityDocumentType (not IdentityDocTypeCode)
   // ContactInfoRefID: may be string[] (not just string)
   ```

### offer-transformer.ts

1. **MatchResult Normalization** (`"Partial"` → `"PARTIAL"`)
2. **JourneyOverview Type** (PARTIAL offer per-journey pricing)
3. **PARTIAL OD Mapping** (JourneyOverview → OriginDestList)
4. **Segment-based fallback** (TR etc. without JourneyOverview)

### service-transformer.ts (Weight-based service)

1. **requiresWeightInput** - Check `%WVAL%` in BookingInstructions.Method
2. **BookingInstructions Extract** - SsrCode, Text, Method, OsiText
3. **Price Calculation** - `price × weightValue` for weight-based, `price × quantity` for general

### middleware-client.ts

1. **Browser-compatible** - Uses `import.meta.env.VITE_MIDDLEWARE_URL`
2. **Single HTTP channel** - All middleware calls go through `callMiddlewareAPI()`
3. **Dev logging** - Wrapped in `import.meta.env.DEV` checks

---

## Routing Configuration (v4.0)

### React Router (not Next.js App Router)

```typescript
// App.tsx - Route definitions
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/:id" element={<BookingDetailPage />} />
      <Route path="/booking/:id/cancel" element={<CancelPage />} />
    </Routes>
  );
}
```

### Navigation API Mapping

```typescript
// React Router hooks (not next/navigation)
import { useNavigate, useParams, useSearchParams, useLocation, Link } from 'react-router-dom';

const navigate = useNavigate();       // replaces useRouter()
navigate('/results');                  // replaces router.push()
navigate(-1);                         // replaces router.back()

const { id } = useParams<{ id: string }>();
const [searchParams] = useSearchParams();
const { pathname } = useLocation();   // replaces usePathname()

<Link to="/">Home</Link>              // replaces <Link href="/">
```

---

## Config Templates (v4.0)

### vite.config.ts.template
- `@/` path alias matching tsconfig
- Dev proxy: `/middleware/*` → backend server
- `base` option for basePath support

### index.html.template
- Material Symbols Outlined font CDN
- `<div id="root">` for React mount
- `{{TENANT_ID}}` in title

### Dockerfile.template
- 2-stage build: node (build) → nginx (serve)
- SPA fallback via nginx.conf
- Build args: `VITE_MIDDLEWARE_URL`, `VITE_BASE_PATH`

---

## Carrier-Specific Patterns (Preserved in Service Layer)

| Pattern | Carriers | Service Function |
|---------|----------|-----------------|
| Two-Step Ticketing | AY, SQ | `processTicketing()` |
| Pattern A (acceptRepricedOrder + Cash) | AF, KL | `confirmSeatPurchase()` |
| 'Ag' payment type | TR | All payment functions |
| seatSelection in offerItems | All | `getSeatPurchaseQuote()`, `confirmSeatPurchase()` |
| offerItems fallback | AF, KL | `addServicePurchase()` |
| bookingInstructions | KG/PC services | `processServicePurchase()` |
| Empty paxList for contacts | AF, KL | `changePax()` |
| phone.label: 'Mobile' | TK, etc. | `createBooking()` |
| DeleteOrderItem branching | LH vs QR | `getRefundQuote()` |
| FOP PaymentList filtering | AF, KL | `getBookingDetail()` |

---

## JSON Configuration Templates

### design-system.json
Design tokens: colors, typography, spacing.

### header.json
Header spec: brand logo, navigation, bottom navigation, results header mode.

### footer.json
Footer spec: brand, link columns, copyright.

---

## Flight Type Field Mapping

| Wrong Field | Correct Field | Notes |
|-------------|---------------|-------|
| `offer.outbound.departure` | `offer.departure` | Direct access |
| `offer.offerId` | `offer.id` | Flight.id |
| `offer.owner` | `offer.airline.code` | Inside airline object |
| `offer.totalPrice` | `offer.price` | price field |

---

## Template Update History

| Date | Version | Change Content |
|------|---------|---------------|
| 2026-02-15 | 4.0.0 | **Vite + React Migration**: Removed 23 API route templates, added 3 service layer templates + 7 config templates. All page/component templates updated (react-router-dom, service imports, no 'use client'). |
| 2026-01-29 | 3.8.0 | SQ/AY Support for ticketing after service addition |
| 2026-01-26 | 3.7.0 | Fix passenger phone/passport extraction bug |
| 2026-01-23 | 3.1.0 | TR and other airline support: isPaid flag |
| 2026-01-23 | 3.0.0 | Critical bug fix: OrderRetrieve API response field mapping |
| 2026-01-23 | 2.0.0 | Booking Component Template Added |
| 2026-01-22 | 1.2.0 | Cancel/Refund Template Added |
| 2026-01-21 | 1.1.0 | Service Template Added (Weight-based service) |
| 2026-01-20 | 1.0.0 | Initial Template Create (based on DEMO001) |

---

## Related Documents

- `references/api-client/middleware-client.md` - Middleware Client Guide
- `references/api-client/offer-transformer.md` - Transformer Guide
- `references/api-mapping/` - API-UI Mapping Guides (13 files)
- `references/workflows/new-tenant.md` - New Tenant Workflow
