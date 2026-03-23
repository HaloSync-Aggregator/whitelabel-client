[한국어](./README.md) | English

# Whitelabel Flight Booking Platform

A multi-tenant whitelabel frontend generation platform that enables OTAs to launch branded flight booking websites in minutes. Powered by Claude Code's multi-agent architecture and the PolarHub NDC API.

## Live Demo

Try the platform at **[demo.halosync.kr/demo](https://demo.halosync.kr/)**

> This is a sandbox environment connected to airline test systems. No real bookings are created.

## Overview

Building a flight booking website from scratch is expensive and time-consuming. This platform automates the process: define your brand (colors, logo, fonts), and a multi-agent system generates a fully functional **Vite + React SPA** with search, booking, seat selection, ancillary services, and post-booking management.

Each generated site is a **pure static frontend** (HTML/JS/CSS) deployable to S3 + CloudFront, and connects to the **PolarHub NDC API** middleware, which handles the complexity of communicating with 12+ airlines through the NDC standard.

### Key Highlights

- **Multi-agent code generation** — Claude Code agents handle design tokens, components, and pages in a 3-stage pipeline
- **12 airlines supported** — each with carrier-specific API branching handled automatically
- **Full booking lifecycle** — from search to post-booking management (changes, cancellations, refunds)
- **Sample tenant included** — `apps/DEMO001` provides a working reference app and CI baseline

## How It Works

To build and run your own whitelabel flight booking site, follow these three steps:

```
Step 1                    Step 2                    Step 3
Provisioning              Middleware                Frontend
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Sign up &        │────▶│ Generate NDC     │────▶│ Generate booking │
│ get credentials  │      │ API middleware   │      │ website          │
│                  │      │                  │      │                  │
│ → Tenant ID      │      │ → Backend API    │      │ → Vite+React SPA │
│ → API Key        │      │ → Airline routes │      │ → Branded UI     │
│ → Airline access │      │ → Auth & config  │      │ → Full lifecycle │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Step 1: Provisioning (Onboarding)

Register to get your tenant credentials. You will receive:
- **Tenant ID** — unique identifier for your OTA
- **API Key** — authentication for the PolarHub NDC API
- **Airline access** — list of airlines enabled for your account

> Onboarding portal coming soon. Open an issue on GitHub for early access.

### Step 2: Generate the Middleware

The **PolarHub NDC Middleware** is the backend that handles airline NDC communication, authentication, and carrier-specific protocol differences. It is also generated via Claude Code:

> **Middleware repository**: [whitelabel-middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware)

Clone the middleware repo and use Claude Code to generate your tenant-specific middleware instance with the credentials from Step 1. See the middleware README for setup instructions.

### Step 3: Generate the Frontend (this repo)

With the middleware running, generate your branded booking website using this repository. See [Quick Start](#quick-start) for detailed setup instructions.

#### Design System

The design system defines your tenant's visual identity — colors, typography, spacing, shadows, and layout. There are three ways to set it up:

**Option 1: Extract from an existing website (recommended for rebranding)**

Point the `design-analyzer` agent at a reference URL. It crawls the site and extracts logos, colors, fonts, layout structure, and component specs into design tokens.

```
# In Claude Code
@design-analyzer
Analyze https://your-travel-site.com and extract design tokens for tenant DEMO001.
```

**Option 2: Manually create design-system.json**

Copy the default template and customize it to match your brand:

```bash
# Copy the template
mkdir -p tenant/{tenant-id}
cp .claude/skills/whitelabel-dev/templates/config/design-system.json tenant/{tenant-id}/

# Edit colors, fonts, spacing to match your brand
```

**Option 3: Use the default template**

If no design configuration is provided, the platform uses a built-in default template (Google-inspired blue theme with Roboto typography). Good for quick prototyping.

```
# Just run whitelabel-dev — it will use the default template automatically
/whitelabel-dev
Generate a whitelabel site for tenant {tenant-id}.
```

#### Generation Pipeline

Once the design system is ready, the 3-stage agent pipeline generates the complete application:

```
 Design System          Components              Pages
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ design-system-   │──▶│ component-       │──▶│ app-builder      │
│ setup            │    │ builder          │    │                  │
│                  │    │                  │    │ Search page      │
│ tailwind.config  │    │ Header, Footer   │    │ Results page     │
│ globals.css      │    │ FlightCard       │    │ Booking page     │
│ tenant.ts        │    │ SeatMap, etc.    │    │ Cancel page      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Features

| Category | Capabilities |
|----------|-------------|
| **Search & Book** | One-way / round-trip search, offer pricing, passenger input, booking creation |
| **Seat Selection** | Interactive seat map, carrier-specific pricing (free / paid / restricted) |
| **Ancillary Services** | Baggage, meals, and other add-ons with weight-based booking instructions |
| **Post-Booking** | Passenger info changes, journey changes, cancellation & refund quotes |
| **Ticketing** | Hold-to-ticketing, ticketing with services, two-step payment flows |
| **Per-Tenant Branding** | Logo, color palette, typography, layout — all configurable per tenant |

## Supported Airlines

| Code | Airline | Booking | Seat | Service | Post-Booking |
|------|---------|:-------:|:----:|:-------:|:------------:|
| AY | Finnair | Y | Y | Y | Y |
| SQ | Singapore Airlines | Y | Y | Y | Y |
| AF | Air France | Y | Y | Y | Y |
| KL | KLM | Y | Y | Y | Y |
| TK | Turkish Airlines | Y | * | * | Y |
| QR | Qatar Airways | Y | Y | Y | Y |
| TR | Scoot | Y | Y | Y | Y |
| EK | Emirates | Y | * | - | Y |
| LH | Lufthansa | Y | - | - | Y |
| AA | American Airlines | Y | - | - | - |
| HA | Hawaiian Airlines | Y | Y | Y | Y |
| BA | British Airways | Y | - | - | - |

`Y` = Supported, `*` = Partial / route-dependent, `-` = Not available

For detailed per-carrier capabilities (seat patterns, service groups, ticketing flows, pax change modes), see [docs/carrier-support-matrix.md](./docs/carrier-support-matrix.md).

## Tech Stack

- **Build Tool**: Vite 5
- **Framework**: React 18 / React Router 6 / TypeScript
- **Styling**: Tailwind CSS 3
- **Deployment**: Static files (S3 + CloudFront, nginx, or any CDN)
- **AI Tooling**: Claude Code Max plan+ (multi-agent architecture)
- **Backend**: [PolarHub NDC Middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware) (also generated via Claude Code)
- **Testing**: GitHub Actions CI + local lint/typecheck/build validation

## Quick Start

### Prerequisites

- [Claude Code](https://claude.ai/code) with **Max plan or higher** (required for multi-agent generation)
- [PolarHub NDC Middleware](https://github.com/HaloSync-Aggregator/whitelabel-middleware) — running instance (see [Step 2](#step-2-generate-the-middleware))
- Node.js >= 18
- npm >= 9

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd whitelabel-client

# Configure frontend environment variables
cp .env.example .env
# Edit .env for your local middleware connection
```

Required variables in `.env` ([see .env.example](./.env.example)):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_MIDDLEWARE_URL` | Your middleware instance URL for local dev | `http://localhost:3000` |
| `VITE_BASE_PATH` | Base path used when serving the SPA under a subpath | `/` |

```bash
# Export the variables for the current shell
source scripts/env.sh

# Install and run an existing tenant app
cd apps/DEMO001
npm install
npm run dev
```

> **Note**: This frontend repo does not store PolarHub API credentials. Configure airline and PolarHub secrets in the middleware repo, then point this app at that middleware with `VITE_MIDDLEWARE_URL`.

> **Port note**: Vite dev server defaults to port 5173. The middleware runs separately (commonly port 3000). Set `VITE_MIDDLEWARE_URL=http://localhost:3000` in `.env` so the frontend knows where to reach the middleware.

Open [http://localhost:5173](http://localhost:5173) — you should see the search form. Try searching for a flight to verify the middleware connection.

### Generate a New Tenant Site

In Claude Code, use the `/whitelabel-dev` skill:

```
# Example prompt in Claude Code
/whitelabel-dev
Generate a whitelabel site for tenant DEMO001.
Use https://example-travel.com as the design reference.
```

The agent pipeline will generate the following structure:

```
apps/DEMO001/
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite build configuration
├── tailwind.config.ts             # Brand colors, fonts
├── package.json
├── nginx.conf                     # SPA routing (production)
├── Dockerfile                     # 2-stage build (node → nginx)
└── src/
    ├── main.tsx                   # React entry (BrowserRouter)
    ├── App.tsx                    # Route definitions (5 routes)
    ├── app/
    │   ├── globals.css            # CSS variables, utilities
    │   ├── page.tsx               # Home (search form)
    │   ├── results/page.tsx       # Search results
    │   ├── booking/page.tsx       # Passenger input
    │   ├── booking/[id]/page.tsx  # Booking detail
    │   └── booking/[id]/cancel/page.tsx  # Cancellation
    ├── components/                # UI components (~55 files)
    ├── lib/
    │   ├── tenant.ts              # Tenant config (POINT_OF_SALE, AGENCY_ID, etc.)
    │   └── api/                   # Service layer (23 functions) + transformers
    └── types/                     # TypeScript definitions (12 files)
```

Then run the generated app:

```bash
cd apps/DEMO001
npm install && npm run dev
```

For production deployment (S3 + CloudFront):
```bash
npm run build   # Output: dist/ (index.html + assets/*.js + assets/*.css)
# Upload dist/ to S3, configure CloudFront with 404→index.html redirect for SPA routing
```

## API Access And Usage

- Code in this repository is licensed under MIT.
- PolarHub API access is governed separately through onboarding and API credential issuance.
- OTA developers who have completed PolarHub onboarding and received API credentials may use this project to generate and operate their web application with their provisioned middleware and API access.
- This repository does not grant API access by itself.

## Architecture

### Agent Skills

| Skill | Purpose |
|-------|---------|
| `/whitelabel-dev` | Main orchestrator — runs the 3-stage pipeline |
| `/tenant-config` | Generates tenant configuration files |

See [How It Works](#how-it-works) for the generation pipeline diagram.

## Project Structure

```
whitelabel-client/
├── apps/{tenant-id}/          # Generated Vite + React SPA applications
│   ├── index.html             # HTML entry point
│   ├── vite.config.ts         # Vite build configuration
│   └── src/
│       ├── main.tsx           # React entry (BrowserRouter)
│       ├── App.tsx            # Route definitions
│       ├── app/               # Page components
│       ├── components/        # UI components (layout, search, flight, seat, ...)
│       ├── lib/api/           # Service layer (23 functions) + middleware client
│       └── types/             # TypeScript type definitions
│
├── tenant/{tenant-id}.yaml    # Tenant contract/sample settings
├── tenant/{tenant-id}/        # Tenant design tokens
│   └── design-system.json
│
├── .claude/
│   ├── agents/                # Sub-agent definitions
│   ├── skills/                # Skill definitions + templates + references
│   └── assets/                # OpenAPI spec, UI component guide, API-UI mapping assets
│
├── scripts/
│   └── env.sh                 # Environment variable loader
│
└── docs/                      # Public reference docs
    └── carrier-support-matrix.md
```

## API Integration

The frontend does **not** call airline APIs directly. The **service layer** (`polarhub-service.ts`) calls the PolarHub NDC Middleware directly from the browser:

```
Browser (React SPA) → Service Layer → PolarHub NDC Middleware → Airlines
(this repo)           polarhub-service.ts  (whitelabel-middleware)    (NDC XML)
searchFlights()       middleware-client.ts  /middleware/polarhub/       AY, SQ, ...
                                            air-shopping
```

The service layer handles UI data transformation and carrier-specific branching logic. The **PolarHub middleware** handles NDC protocol communication with airlines.

| Service Function | Middleware Endpoint |
|-----------------|---------------------|
| `searchFlights()` | `POST /middleware/polarhub/air-shopping` |
| `getOfferPrice()` | `POST /middleware/polarhub/offer-price` |
| `createBooking()` | `POST /middleware/polarhub/order` |
| `getBookingDetail()` | `POST /middleware/polarhub/order/retrieve` |
| `getSeatAvailability()` | `POST /middleware/polarhub/seat-availability` |
| `getServiceList()` | `POST /middleware/polarhub/service-list` |

Full middleware OpenAPI spec: `.claude/assets/whitelabel-middleware.openapi.yaml`

## Development

```bash
cd apps/{tenant-id}

npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Vite production build (dist/)
npm run preview      # Preview production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

For carrier-specific API patterns and implementation details, see [CLAUDE.md](./CLAUDE.md).

### Testing

This public seed currently ships CI checks for the sample tenant app:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`

For a quick cold-start smoke test, run the DEMO001 app locally and verify that the home page loads and can reach your middleware.

## Contributing

Contributions are welcome. To get started:

1. Review [CLAUDE.md](./CLAUDE.md) for coding conventions and API patterns
2. Check [docs/carrier-support-matrix.md](./docs/carrier-support-matrix.md) for current carrier capability notes
3. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or proposed change
4. Each agent/skill has its own instruction file under `.claude/`

## License

MIT License. See [LICENSE](./LICENSE).

API access, credential issuance, and onboarding are governed separately by PolarHub.

---

Built with [Claude Code](https://claude.ai/code)
