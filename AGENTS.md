# Agent Instructions: Whitelabel Multiagent

A guide document referenced by AI agents when working in this repository.

---

## Project Overview

A multi-tenant whitelabel flight booking **frontend** generation platform.
Leverages Claude Code's multi-agent architecture to automatically generate tenant-specific **Vite + React SPA** websites.

> **Note**: The backend (PolarHub API) is maintained as a separate project and shared across tenants.
> Generated apps are pure static frontends (HTML/JS/CSS) deployable to S3 + CloudFront.

---

## 1. Agent Architecture

### Sub-Agents (3-Stage Workflow)

| Agent | Model | Role | Output |
|-------|-------|------|--------|
| `design-system-setup` | haiku | Design tokens → Tailwind/CSS/tenant.ts conversion | `tailwind.config.ts`, `globals.css`, `tenant.ts` |
| `component-builder` | sonnet | Reusable component implementation | `components/` |
| `app-builder` | sonnet | Per-page implementation (one page at a time) | `app/` |

### Supporting Agents

| Agent | Model | Role |
|-------|-------|------|
| `design-analyzer` | sonnet | URL-based source site analysis, design token extraction |
| `tenant-architect` | sonnet | Tenant configuration file generation (config.ts, design-system.json) |

### Workflow

```
[New Tenant Site]
design-analyzer → tenant-architect → design-system-setup → component-builder → app-builder (per page)

[Specific Page]
app-builder

[Component Work]
component-builder

[Style Update]
design-system-setup
```

---

## 2. Skills

### whitelabel-dev

Main development skill. Orchestrates the 3-stage sub-agent workflow.

```
.claude/skills/whitelabel-dev/
├── SKILL.md
├── templates/                 # Code templates for generated files
│   ├── lib/                   # Service layer, tenant.ts, middleware-client
│   ├── types/                 # TypeScript type definitions
│   ├── config/                # Vite, Tailwind, package.json, Dockerfile
│   ├── components/            # Component templates
│   └── pages/                 # Page templates
└── references/
    └── api-mapping/           # API-UI mapping documents
        ├── air-shopping.md
        ├── offer-price.md
        ├── order-retrieve.md
        ├── seat-availability.md
        ├── service-list.md
        ├── journey-change.md
        └── cancel-refund.md
```

### tenant-config

Tenant configuration file generation skill.

```
.claude/skills/tenant-config/
├── SKILL.md
├── references/schemas.md
└── assets/templates/          # Design templates
    ├── light-modern/
    └── google-stitch/
```

---

## 3. Project Structure

### Tenant Configuration

```
tenant/{tenant-id}.yaml            # Tenant contract/sample settings
tenant/{tenant-id}/
└── design-system.json         # Design tokens (colors, typography, spacing)
```

### Generated App

```
apps/{tenant-id}/
├── index.html                 # HTML entry point
├── vite.config.ts             # Vite build configuration
├── tailwind.config.ts         # Brand colors, fonts
├── nginx.conf                 # SPA routing (production)
├── Dockerfile                 # 2-stage build (node → nginx)
└── src/
    ├── main.tsx               # React entry (BrowserRouter)
    ├── App.tsx                # Route definitions (5 routes)
    ├── app/
    │   ├── globals.css        # CSS variables, utilities
    │   ├── page.tsx           # Home (search form)
    │   ├── results/page.tsx   # Search results
    │   ├── booking/page.tsx   # Passenger input
    │   ├── booking/[id]/page.tsx     # Booking detail
    │   └── booking/[id]/cancel/page.tsx  # Cancellation
    ├── components/
    │   ├── layout/            # Header, Footer
    │   ├── ui/                # Button, Input, Card, Badge, Modal
    │   ├── search/            # SearchForm
    │   ├── flight/            # FlightCard, FilterPanel, PriceBreakdown
    │   ├── booking/           # Booking detail components + modals
    │   ├── seat/              # SeatMap, SeatSelector, SeatLegend
    │   ├── service/           # ServiceCard, ServiceSelector
    │   ├── payment/           # PaymentPopup, PaymentForm, FareDifferencePopup
    │   └── cancel/            # CancelConfirmPopup, RefundQuotePopup
    ├── lib/
    │   ├── tenant.ts          # Tenant config (POINT_OF_SALE, AGENCY_ID, etc.)
    │   ├── utils.ts           # Utility functions (cn, formatPrice)
    │   └── api/               # Service layer
    │       ├── polarhub-service.ts          # Re-exports from split files
    │       ├── polarhub-service-prebooking.ts   # 8 functions (search → refund)
    │       ├── polarhub-service-ancillary.ts    # 7 functions (seat/service purchase)
    │       ├── polarhub-service-postbooking.ts  # 7 functions (ticketing, journey change)
    │       ├── middleware-client.ts          # HTTP client for middleware
    │       ├── order-retrieve-transformer.ts # OrderRetrieve response → BookingDetail
    │       ├── pax-change-service.ts         # Passenger change logic
    │       └── *-transformer.ts             # Offer, seat, service, journey transformers
    └── types/                 # TypeScript definitions (12 files)
```

---

## 4. Development Commands

Run from the tenant app directory:

```bash
cd apps/{tenant-id}

# Install dependencies
npm install

# Vite dev server (http://localhost:5173)
npm run dev

# Vite production build (dist/)
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## 5. Code Style & Guidelines

### TypeScript

- **Strict Mode**: `strict: true` required
- **No Implicit Any**: `any` prohibited, use `unknown` with type narrowing
- **Props Interface**: Explicit Props interface for all components

### React (Vite SPA)

- **All components are client-side** (no `'use client'` directive needed)
- **Routing**: React Router 6 — `useNavigate`, `useParams`, `useSearchParams`, `Link` from `react-router-dom`
- **Service layer**: Import functions from `@/lib/api/polarhub-service` (no fetch/apiUrl)
- **Environment**: `import.meta.env.VITE_*` (not `process.env`)

### Styling (Tailwind CSS)

- **Design tokens**: Reference colors/fonts from `design-system.json`
- **Class merging**: Use `cn()` utility function
- **Responsive**: Mobile-first (`sm:`, `md:`, `lg:`)

### Naming Conventions

- **Components**: PascalCase (`FlightCard.tsx`)
- **Functions/Variables**: camelCase (`handleSearchSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CURRENCY`)
- **Files**: kebab-case (`airport-select.ts`)

---

## 6. API Integration

### OpenAPI Spec

```
.claude/assets/whitelabel-middleware.openapi.yaml
```

### Service Layer Architecture

The SPA calls the PolarHub middleware directly via the service layer:

```
React Component → polarhub-service.ts → middleware-client.ts → PolarHub Middleware → Airlines
```

### Core Service Functions

| Function | Middleware Endpoint |
|----------|-------------------|
| `searchFlights()` | POST /middleware/polarhub/air-shopping |
| `getOfferPrice()` | POST /middleware/polarhub/offer-price |
| `createBooking()` | POST /middleware/polarhub/order |
| `getBookingDetail()` | POST /middleware/polarhub/order/retrieve |
| `getSeatAvailability()` | POST /middleware/polarhub/seat-availability |
| `getServiceList()` | POST /middleware/polarhub/service-list |

### Request Rules

- **camelCase required**: `transactionId`, `originDestList`
- **Environment variable**: `VITE_MIDDLEWARE_URL`
- **Import from tenant.ts**: `POINT_OF_SALE`, `AGENCY_ID`, `SITE_CODE`, `AGENCY_NAME`

---

## 7. UI Component Guide

```
.claude/assets/ui-component-guide/
├── 02-common/         # Common components, design system
├── 03-booking/        # Search, results, payment
├── 04-booking-detail/ # Booking detail
├── 06-change/         # Journey change, info change
└── 07-popups/         # Seat, service popups
```

---

## 8. Best Practices for Agents

### Working Principles

- **One at a time**: app-builder implements only one page per invocation
- **Max 10 files per batch**: component-builder should not exceed 10 files per invocation to avoid context exhaustion
- **Reuse existing code**: Prioritize component reuse
- **API mapping reference required**: Check the relevant mapping doc before implementing a page
- **READ then COPY**: Always read template files first, then faithfully copy — do not write from scratch

### Validation

- Run `npm run lint` and `npx tsc --noEmit` after implementation
- Do not simplify Header structure (if the original has 2 rows, keep 2 rows)
- Do not omit required elements (search bar, promotion badges, airline lowest prices, etc.)

### Deployment

- Build output is pure static: `dist/` contains `index.html` + `assets/*.js` + `assets/*.css`
- Deployable to S3 + CloudFront, nginx, Vercel, Netlify, or any static hosting
- SPA routing requires 404 → `index.html` redirect configuration

---

## 9. Maintenance

- Update this document when adding new agents/skills
- `README.md` is for human developers, `AGENTS.md` is for optimizing AI agent efficiency
