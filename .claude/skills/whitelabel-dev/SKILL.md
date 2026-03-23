---
name: whitelabel-dev
description: |
 Whitelabel flight booking website development skill. Implements tenant-specific custom Vite + React SPA websites using a 3-stage sub-agent architecture.

 **Sub Agents:**
 - design-system-setup: Design system configuration (Tailwind, CSS)
 - component-builder: Reusable component implementation (Header, FilterPanel, etc.)
 - app-builder: Individual page implementation (one at a time)

 **Trigger scenarios:**
 - "Create a whitelabel site for tenant DEMO001"
 - "Implement the search results page"
 - "Develop the booking detail screen"
 - "Add a search bar to the header"
 - "Modify the filter component"
 - Any requests related to whitelabel, flight booking, or tenant website development
---

# Whitelabel Website Development Skill

Develops tenant-specific custom flight booking websites (Vite + React SPA) using a 3-stage sub-agent architecture.

## Output Path (Important!)

All artifacts are generated in the **`apps/{tenant_id}/`** directory.
Only **JSON configurations** are stored in `tenant/{tenant_id}`.

```
apps/{tenant_id}/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── index.html
├── nginx.conf
├── Dockerfile
└── src/
 ├── main.tsx              # App entry point
 ├── App.tsx               # React Router routes
 ├── app/                  # Page components
 ├── components/
 ├── lib/
 │   └── api/
 │       ├── polarhub-service.ts          # Service layer (23 functions)
 │       ├── middleware-client.ts          # callMiddlewareAPI helper
 │       ├── order-retrieve-transformer.ts # OrderRetrieve response transformer
 │       ├── pax-change-service.ts        # Pax change service functions
 │       ├── offer-transformer.ts
 │       ├── seat-transformer.ts
 │       └── service-transformer.ts
 └── types/
```

> **Note**: Creating `tenant/{tenant_id}/apps/` is **prohibited** (path error)

---

## Sub Agent Structure

```
whitelabel-dev skill
├── design-system-setup # Stage 1: Design system configuration
├── component-builder # Stage 2: Reusable component implementation
└── app-builder # Stage 3: Page implementation (per page)
```

| Agent | Role | Model | Output |
|-------|------|-------|--------|
| design-system-setup | Tailwind/CSS configuration | haiku | `tailwind.config.ts`, `globals.css` |
| component-builder | Common components | sonnet | `components/` |
| app-builder | Individual pages | sonnet | `app/` (one page at a time) |

---

## Workflow Selection

Select the appropriate workflow based on the request type:

| Request Type | Workflow | Agent(s) Called |
|-------------|----------|----------------|
| New tenant site creation | [New Tenant](#new-tenant) | Sequential: design-system-setup → component-builder → app-builder (per page) |
| Specific page implementation | [Page Implementation](#page-implementation) | app-builder |
| Component addition/modification | [Component Work](#component-work) | component-builder |
| Style modification | [Style Update](#style-update) | design-system-setup |

---

## ⛔ Cross-Tenant Isolation Rule (Mandatory)

When generating a new tenant, sub-agents must NEVER read code from other tenants' `apps/` directories.

- ❌ `Read("apps/DEMO001/src/components/Header.tsx")` — FORBIDDEN
- ❌ `Glob("apps/*/src/**/*.ts")` — FORBIDDEN
- ❌ `Grep(pattern="...", path="apps/DEMO001/")` — FORBIDDEN
- ✅ `Read(".claude/skills/whitelabel-dev/templates/components/layout/Header.tsx.template")` — CORRECT

**Why**: Existing tenant apps may contain outdated API patterns (e.g., pre-v3.25 OfferPrice handling, missing phone.label). Templates are the single source of truth, maintained in sync with CLAUDE.md API rules.

**Enforcement**: Include this rule in every sub-agent prompt. If an agent references another tenant's code, the orchestrator must reject the output and re-invoke with a fresh context.

---

## New Tenant

Full new tenant website creation **(4 stages executed sequentially)**:

### Recommended Execution Order (Important)

1. **Step 1: Design system configuration**
2. **Step 3: Lib and Types implementation** (types/client first)
3. **Step 2: Common component implementation**
4. **Step 4: Page and API implementation**

> WARNING: When creating a new tenant, **types/lib must be created first** to prevent type errors in subsequent components/pages.

### Step 0: Verify Design Configuration

#### Default Templates (JSON Configuration)

```
.claude/skills/whitelabel-dev/templates/config/
├── design-system.json # Design tokens (colors, typography, spacing)
├── header.json # Header spec (brand, navigation, mobile bottom menu)
└── footer.json # Footer spec (links, copyright)
```

#### Header JSON Structure Example

```json
{
 "structure": "1row",
 "style": "mobile-first",
 "brand": {
 "logo": { "src": "...", "height": 32, "fallback": "HS" },
 "text": { "name": "SkyDemo", "subtitle": "Travel Agency" }
 },
 "bottomNavigation": {
 "enabled": true,
 "style": "floating",
 "items": [
 { "icon": "home", "label": "Home", "href": "/" },
 { "icon": "search", "label": "Search", "href": "/search", "style": "fab" }
 ]
 }
}
```

#### Footer JSON Structure Example

```json
{
 "style": "minimal",
 "sections": {
 "brand": { "logo": {...}, "description": "..." },
 "links": { "columns": [...] },
 "copyright": { "text": "...", "showYear": true }
 }
}
```

> **Note**: If custom configuration is needed, request original site analysis via the design-analyzer agent

### Step 1: Design System Configuration

```
Task(subagent_type="design-system-setup", prompt="""
Set up the design system for tenant {tenant_id}.

Input:
- .claude/skills/whitelabel-dev/templates/config/design-system.json
- .claude/skills/whitelabel-dev/templates/config/.eslintrc.json.template

Output: apps/{tenant_id}/
 - package.json, vite.config.ts, tsconfig.json, postcss.config.mjs
 - .eslintrc.json
 - tailwind.config.ts
 - index.html (⚠️ Must include Material Symbols Outlined font link in <head>)
 - src/main.tsx, src/App.tsx
 - src/app/globals.css
 - src/app/layout.tsx
 - nginx.conf, Dockerfile
""")
```

### Step 2: Common Component Implementation (7 batches)

> **RULE: Max 8 files per batch. Each batch is a separate component-builder invocation.**
> This prevents context window exhaustion and ensures templates remain in active context.
> **WARNING**: `// @ts-nocheck` is prohibited in generated artifacts (fix type errors in code)

**Prerequisite**: Step 3 (Lib/Types) must be completed first.

**Batch 2-1: Layout + UI base** (8 files)
```
Task(subagent_type="component-builder", prompt="""
Implement layout and UI base components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates to read & copy:
1. templates/components/layout/Header.tsx.template → components/Header.tsx
2. templates/components/layout/Footer.tsx.template → components/Footer.tsx
3. templates/components/ui/Button.tsx.template → components/ui/Button.tsx
4. templates/components/ui/Input.tsx.template → components/ui/Input.tsx
5. templates/components/ui/Card.tsx.template → components/ui/Card.tsx
6. templates/components/ui/Modal.tsx.template → components/ui/Modal.tsx
7. templates/components/ui/Badge.tsx.template → components/ui/Badge.tsx

Input config: templates/config/header.json, footer.json, design-system.json

Public starter note: standalone `Select`, `DatePicker`, `AirportSelect`, and `PassengerCounter`
templates are not included in this repo. Keep search controls inside `SearchForm.tsx`
unless you add those templates yourself.

⚠️ Footer Data from Tenant YAML (REQUIRED):
 - Read tenant YAML: tenant/{tenant_id}.yaml
 - **footer.links** → `{{FOOTER_LINK_SECTIONS}}`: link sections with external/internal routing
 - **polarhub.airlines** → `{{SUPPORTED_AIRLINES}}`: airline badges
   - If ["ALL"] → use all 12 airlines; if specific codes → use only those
 - **brand.name / brand.logo_url** → `{{BRAND_NAME}}`, `{{BRAND_LOGO_URL}}`
 - **footer.company.description** → `{{BRAND_DESCRIPTION}}`
 - Airline name mapping: AF=Air France, KL=KLM, QR=Qatar Airways, AY=Finnair,
   SQ=Singapore Airlines, HA=Hawaiian Airlines, TK=Turkish Airlines, TR=Scoot,
   EK=Emirates, LH=Lufthansa, AA=American Airlines, BA=British Airways
 - ❌ Popular Destinations section must NOT be generated (removed from templates)

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-2: Search + shared exports** (3 files)
```
Task(subagent_type="component-builder", prompt="""
Implement the remaining shared exports and search components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/ui/index.ts.template → components/ui/index.ts
2. templates/components/search/SearchForm.tsx.template → components/search/SearchForm.tsx
3. templates/components/flight/FilterPanel.tsx.template → components/flight/FilterPanel.tsx

Important: in the public starter, airport selection and passenger count UI stay embedded
inside `SearchForm.tsx`. Do not assume separate `AirportSelect` or `PassengerCounter`
templates exist.

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-3: Flight + Booking core** (8 files)
```
Task(subagent_type="component-builder", prompt="""
Implement flight and booking core components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/flight/FlightCard.tsx.template → components/flight/FlightCard.tsx
2. templates/components/flight/PriceBreakdown.tsx.template → components/flight/PriceBreakdown.tsx
3. templates/components/booking/BookingHeader.tsx.template → components/booking/BookingHeader.tsx
4. templates/components/booking/ItineraryCard.tsx.template → components/booking/ItineraryCard.tsx
5. templates/components/booking/PassengerList.tsx.template → components/booking/PassengerList.tsx
6. templates/components/booking/PriceSummary.tsx.template → components/booking/PriceSummary.tsx
7. templates/components/booking/ActionButtons.tsx.template → components/booking/ActionButtons.tsx
8. templates/components/booking/FareRules.tsx.template → components/booking/FareRules.tsx

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-4: Booking modals + detail** (7 files)
```
Task(subagent_type="component-builder", prompt="""
Implement booking modals and detail components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/booking/PassengerEditModal.tsx.template → components/booking/PassengerEditModal.tsx
2. templates/components/booking/PassengerSplitModal.tsx.template → components/booking/PassengerSplitModal.tsx
3. templates/components/booking/ServicePurchaseModal.tsx.template → components/booking/ServicePurchaseModal.tsx
4. templates/components/booking/PostTicketingSeatPopup.tsx.template → components/booking/PostTicketingSeatPopup.tsx
5. templates/components/booking/TicketingWithServiceModal.tsx.template → components/booking/TicketingWithServiceModal.tsx
6. templates/components/booking/TicketList.tsx.template → components/booking/TicketList.tsx
7. templates/components/booking/OcnCard.tsx.template → components/booking/OcnCard.tsx

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-5: Seat + Service + Cancel** (8 files)
```
Task(subagent_type="component-builder", prompt="""
Implement seat, service, and cancel components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/seat/SeatMap.tsx.template → components/seat/SeatMap.tsx
2. templates/components/seat/SeatSelector.tsx.template → components/seat/SeatSelector.tsx
3. templates/components/seat/SeatLegend.tsx.template → components/seat/SeatLegend.tsx
4. templates/components/seat/index.ts.template → components/seat/index.ts
5. templates/components/service/ServiceCard.tsx.template → components/service/ServiceCard.tsx
6. templates/components/service/ServiceSelector.tsx.template → components/service/ServiceSelector.tsx
7. templates/components/service/index.ts.template → components/service/index.ts
8. templates/components/booking/SsrInfo.tsx.template → components/booking/SsrInfo.tsx

⚠️ seat/ and service/ directories MUST have index.ts files! Missing = import errors in booking/page.tsx.

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-6: Pax-Change + Journey-Change** (8 files)
```
Task(subagent_type="component-builder", prompt="""
Implement pax-change and journey-change components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/booking/pax-change/index.ts.template → components/booking/pax-change/index.ts
2. templates/components/booking/pax-change/NameChangeForm.tsx.template → components/booking/pax-change/NameChangeForm.tsx
3. templates/components/booking/pax-change/ContactChangeForm.tsx.template → components/booking/pax-change/ContactChangeForm.tsx
4. templates/components/booking/pax-change/ContactAddDeleteForm.tsx.template → components/booking/pax-change/ContactAddDeleteForm.tsx
5. templates/components/booking/pax-change/ApisChangeForm.tsx.template → components/booking/pax-change/ApisChangeForm.tsx
6. templates/components/booking/pax-change/FfnChangeForm.tsx.template → components/booking/pax-change/FfnChangeForm.tsx
7. templates/components/booking/pax-change/DocaChangeForm.tsx.template → components/booking/pax-change/DocaChangeForm.tsx
8. templates/components/booking/journey-change/index.ts.template → components/booking/journey-change/index.ts

Output: apps/{tenant_id}/src/components/
""")
```

**Batch 2-7: Journey-Change remaining + Payment** (8 files)
```
Task(subagent_type="component-builder", prompt="""
Implement journey-change and payment components for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates:
1. templates/components/booking/journey-change/ItinerarySelector.tsx.template → components/booking/journey-change/ItinerarySelector.tsx
2. templates/components/booking/journey-change/FlightOptionList.tsx.template → components/booking/journey-change/FlightOptionList.tsx
3. templates/components/booking/journey-change/ChangeModeSelector.tsx.template → components/booking/journey-change/ChangeModeSelector.tsx
4. templates/components/booking/journey-change/JourneyChangeModal.tsx.template → components/booking/journey-change/JourneyChangeModal.tsx
5. templates/components/booking/journey-change/PriceSummaryCard.tsx.template → components/booking/journey-change/PriceSummaryCard.tsx
6. templates/components/payment/index.ts.template → components/payment/index.ts
7. templates/components/payment/PaymentPopup.tsx.template → components/payment/PaymentPopup.tsx
8. templates/components/payment/PaymentForm.tsx.template → components/payment/PaymentForm.tsx

> Note: FareDifferencePopup.tsx.template → created in follow-up if template exists.

Output: apps/{tenant_id}/src/components/
""")
```

### Step 3: Lib and Types Implementation (2 batches)

> RULE: Re-read each template file immediately before writing the output file. Do NOT write from memory.
> CRITICAL: Use tenant.ts config imports (`POINT_OF_SALE`, `AGENCY_ID`, etc.), NOT placeholder strings!
> WARNING: All `{{TENANT_ID}}` / `{{MIDDLEWARE_URL}}` placeholders must be replaced.

**Batch 3-1: Types** (11 files)
```
Task(subagent_type="component-builder", prompt="""
Implement TypeScript type definitions for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.

Templates to read & copy (in order):
1. templates/types/seat.types.ts.template → src/types/seat.ts
2. templates/types/service.types.ts.template → src/types/service.ts
3. templates/types/cancel.types.ts.template → src/types/cancel.ts
4. templates/types/payment.ts.template → src/types/payment.ts
5. templates/types/pax-split.ts.template → src/types/pax-split.ts
6. templates/types/seat-purchase.ts.template → src/types/seat-purchase.ts
7. templates/types/service-purchase.ts.template → src/types/service-purchase.ts
8. templates/types/ticketing-with-service.ts.template → src/types/ticketing-with-service.ts
9. templates/types/theme.ts.template → src/types/theme.ts
10. templates/types/journey-change.ts.template → src/types/journey-change.ts
11. templates/types/pax-change.ts.template → src/types/pax-change.ts

Output: apps/{tenant_id}/src/types/
""")
```

**Batch 3-2: Lib/API** (15 files)
```
Task(subagent_type="component-builder", prompt="""
Implement API client and service layer for tenant {tenant_id}.

RULE: Re-read each template before writing. Do NOT reference other tenants' apps/.
RULE: Use tenant.ts config imports (POINT_OF_SALE, AGENCY_ID, etc.), NOT placeholder strings!

Templates to read & copy (in order):
1. templates/lib/tenant.ts.template → src/lib/tenant.ts
2. templates/lib/utils.ts.template → src/lib/utils.ts
3. templates/lib/status-codes.ts.template → src/lib/status-codes.ts
4. templates/lib/error-messages.ts.template → src/lib/error-messages.ts
5. templates/lib/middleware-client.ts.template → src/lib/api/middleware-client.ts
6. templates/lib/polarhub-service.ts.template → src/lib/api/polarhub-service.ts (barrel)
7. templates/lib/polarhub-service-prebooking.ts.template → src/lib/api/polarhub-service-prebooking.ts
8. templates/lib/polarhub-service-postbooking.ts.template → src/lib/api/polarhub-service-postbooking.ts
9. templates/lib/polarhub-service-ancillary.ts.template → src/lib/api/polarhub-service-ancillary.ts
10. templates/lib/order-retrieve-transformer.ts.template → src/lib/api/order-retrieve-transformer.ts
11. templates/lib/pax-change-service.ts.template → src/lib/api/pax-change-service.ts
12. templates/lib/offer-transformer.ts.template → src/lib/api/offer-transformer.ts
13. templates/lib/seat-transformer.ts.template → src/lib/api/seat-transformer.ts
14. templates/lib/service-transformer.ts.template → src/lib/api/service-transformer.ts
15. templates/lib/journey-transformer.ts.template → src/lib/api/journey-transformer.ts

⚠️ middleware-client.ts and *-transformer.ts MUST be under src/lib/api/ (not src/lib/)

Output: apps/{tenant_id}/src/lib/, apps/{tenant_id}/src/lib/api/
""")
```

### Step 4: Page Implementation (called per page)

> **WARNING: Important: app-builder must READ and COPY template files!**
> Writing code from scratch causes mismatches with the Middleware API spec and results in errors.

**4-1. Main Page**
```
Task(subagent_type="app-builder", prompt="""
Implement the main page (search form) for tenant {tenant_id}.

WARNING: Required task order (do not skip!) WARNING:

Stage 1: READ template files
 - Read(".claude/skills/whitelabel-dev/templates/pages/search-page.tsx.template")

Stage 2: COPY template contents as-is
 - page.tsx ← COPY from search-page.tsx.template
 - WARNING: Do NOT write code from scratch! The template contains critical patterns:
   - navigate(`/results?${params.toString()}`) — URL params required for results page
   - sessionStorage.setItem('lastSearch', ...) — backup storage
   - SearchFormData type import from SearchForm component

Reference:
- API mapping: references/api-mapping/search-form.md
- Components: apps/{tenant_id}/src/components/

RULE: Re-read the template file immediately before writing the page. Do NOT write from memory.

Output: apps/{tenant_id}/src/app/page.tsx
""")
```

**4-2. Search Results Page**
```
Task(subagent_type="app-builder", prompt="""
Implement the search results page for tenant {tenant_id}.

WARNING: Required task order (do not skip!) WARNING:

Stage 1: READ template files
 - Read(".claude/skills/whitelabel-dev/templates/pages/results-page.tsx.template")
 - Read(".claude/skills/whitelabel-dev/templates/lib/offer-transformer.ts.template")

Stage 2: COPY template contents as-is
 - results/page.tsx ← COPY from results-page.tsx.template
 - WARNING: Do NOT write code from scratch! The template contains critical patterns:
   - passengerList conversion: { adults, children, infants } → { type: 'ADT'|'CHD'|'INF', count }[]
   - paxList type: Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>
   - Header mode: 'results' (NOT 'compact')

Stage 3: Verify service layer
 - Ensure polarhub-service.ts exists with searchFlights(), getOfferPrice() functions
 - Import service functions: import { searchFlights, getOfferPrice, ApiError } from '@/lib/api/polarhub-service';

Implementation scope:
1. results/page.tsx - Search results page (calls polarhub-service functions directly)

RULE: Re-read the template file immediately before writing the page. Do NOT write from memory.

Output: apps/{tenant_id}/src/app/
""")
```

**4-3. Passenger Information Page**
```
Task(subagent_type="app-builder", prompt="""
Implement the passenger information input page (booking flow) for tenant {tenant_id}.

WARNING: Required task order WARNING:

Stage 1: READ templates
 - Read(".claude/skills/whitelabel-dev/templates/pages/booking-page.tsx.template")

Stage 2: Verify service layer
 - Ensure polarhub-service.ts exists with createOrder() function
 - Import: import { createOrder, ApiError } from '@/lib/api/polarhub-service';

Implementation scope:
1. booking/page.tsx ← copy from booking-page.tsx.template

WARNING: Required:
- Load bookingData from sessionStorage (saved from search page)
- Dynamically generate PassengerForm based on paxList
- Implement all 3 booking options: hold (hold only) / cash (cash instant ticketing) / card (card instant ticketing)
- Call createOrder() from polarhub-service.ts → navigate to /booking/:orderId
- Use react-router-dom: useNavigate, useSearchParams, Link

Reference:
- Page guide: references/pages/booking-payment.md

RULE: Re-read the template file immediately before writing the page. Do NOT write from memory.

Output: apps/{tenant_id}/src/app/
""")
```

**4-4. Booking Detail Page (Enhanced v3.1)**
```
Task(subagent_type="app-builder", prompt="""
Implement the booking detail page for tenant {tenant_id}.

WARNING: Required: Use templates! Do not implement from scratch! WARNING:
WARNING: Import service functions from polarhub-service.ts (no API routes needed):
 import { retrieveOrder, getSeatAvailability, getServiceList, ... } from '@/lib/api/polarhub-service';
RULE: Re-read the template file immediately before writing the page. Do NOT write from memory.
WARNING: Use react-router-dom: useParams, useNavigate, Link

CRITICAL Bug Warning #1: OrderRetrieve API Response Structure (v3.4 Update)
- PaxList, PaxSegmentList, etc. are in **DataLists**, NOT inside Order!
- **WARNING: PaymentList, TicketDocList are also in DataLists!**
- Wrong location:
 - Order.PaxList → DataLists.PaxList
 - Order.PaymentList → **DataLists.PaymentList**
 - Order.TicketDocList → **DataLists.TicketDocList**
- Correct code:
 ```typescript
 const ticketDocInfoList = dataLists?.TicketDocList || order.TicketDocList || [];
 const paymentList = dataLists?.PaymentList || order.PaymentList || [];
 ```

CRITICAL Bug Warning #2: isPaid Determination Logic (v3.3 Fix, v3.26 Update)
- OrderStatus === 'OK' does NOT mean payment complete! (Hold bookings also return OK)
- ⚠️ PaymentList.length > 0 alone is NOT sufficient! (v3.26 Fix)
  AF/KL returns FOP entries (Amount=0, Status="395") = available payment methods, NOT actual payments!
- Correct isPaid criteria (v3.26):
 1. PaymentList with Amount > 0 → isPaid = true (actual payment)
 2. Tickets exist → isPaid = true (ticketing = payment required)
- Wrong logic (never use!):
 ```typescript
 const orderStatusPaid = order.OrderStatus === 'OK'; // X - Hold is also OK!
 const isPaid = hasPaymentList || orderStatusPaid; // X
 const isPaid = paymentList.length > 0 || hasTickets; // X - AF/KL FOP entries have Amount=0!
 ```
- Correct logic:
 ```typescript
 const hasPaymentList = paymentList.some(p => {
   const amount = typeof p.Amount === 'number' ? p.Amount
     : (p.Amount as { Amount?: number } | undefined)?.Amount ?? 0;
   return amount > 0;
 });
 const isPaid = hasPaymentList || hasTickets; // O
 ```
- canPay: !isPaid && !isTicketed (based on isPaid!)

CRITICAL Bug Warning #3: TicketDocInfo vs TicketDocList
- API returns either TicketDocInfo or TicketDocList depending on the call!
- Must fallback to both fields:
 const ticketDocInfoList = order.TicketDocInfo || order.TicketDocList || [];
- TicketDocList type must also be defined in the interface!

CRITICAL Bug Warning #4: Airline Logo Image CDN
- Do not use local image paths! (`/assets/airlines/XX.png`)
- Use **pics.avs.io CDN**:
 ```typescript
 function getAirlineLogo(code: string): string {
 return `https://pics.avs.io/70/70/${code}.png`;
 }
 ```
- Provide fallback with onError in FlightCard:
 ```tsx
 <img src={logo} onError={() => setImgError(true)} />
 {imgError && <div className="fallback">{code}</div>}
 ```

CRITICAL Bug Warning #5: title vs nameTitle (OrderCreate)
- UI uses `title` field, but **API expects `nameTitle`**!
- Wrong example (causes 400 error):
 ```typescript
 individual: { title: p.title } // X - API rejects!
 ```
- Correct example:
 ```typescript
 individual: { nameTitle: p.title } // O - Use API field name
 ```
- This mistake causes 400 error: `"property title should not exist"`

CRITICAL Bug Warning #6: SeatAvailability API Response Structure
- Response structure varies by airline!
- **Case 1 (SQ, etc.)**: `response.ALaCarteOffer.SeatMap`
- **Case 2 (TR, etc.)**: `response.SeatMap` (no ALaCarteOffer!)
- Wrong code:
 ```typescript
 const offer = response.ALaCarteOffer;
 const seatMaps = offer.SeatMap; // X - offer is undefined!
 ```
- Correct code:
 ```typescript
 const offer = response.ALaCarteOffer;
 const seatMapList = offer?.SeatMap || response.SeatMap || [];
 const offerItemList = offer?.ALaCarteOfferItem || response.ALaCarteOfferItem || [];
 ```

CRITICAL Bug Warning #7: SeatSelector Placeholder Rendering Bug
- If SeatSelector is defined as placeholder in index.ts, it returns `() => null`!
- **Symptom**: Clicking seat selection button shows API 200 response but popup doesn't appear
- Wrong code (index.ts):
 ```typescript
 // Placeholder components - WRONG!
 export const SeatSelector: React.FC<SeatSelectorProps> = () => null;
 ```
- Correct code:
 ```typescript
 // Actual component export
 export { SeatSelector } from './SeatSelector';
 export type { Passenger, SeatSelectorProps } from './SeatSelector';
 ```
- **SeatSelector.tsx file must be created first!**
- Template reference: `templates/components/seat/SeatSelector.tsx.template`

CRITICAL Bug Warning #8: seat-transformer Columns Fallback Missing
- **Some APIs don't provide the cabin.Columns field!**
- **Symptom**: Seat popup shows only row numbers, no seat buttons (broken layout)
- Cause: Empty Columns array means no column headers and no seats render
- Wrong code:
 ```typescript
 // Empty array when Columns missing - WRONG!
 const columns = (cabin.Columns || []).map(col => ({...}));
 ```
- Correct code:
 ```typescript
 // Extract from seat data when Columns missing (required!)
 let columns = [];
 if (cabin.Columns && cabin.Columns.length > 0) {
 columns = cabin.Columns.map(col => ({...}));
 } else {
 // Extract Columns from seat data
 const columnSet = new Set<string>();
 cabin.RowInfo.forEach(row => {
 row.Seats.forEach(seat => {
 if (seat.Column) columnSet.add(seat.Column);
 });
 });
 const sortedColumns = Array.from(columnSet).sort();
 columns = sortedColumns.map((col, idx) => ({
 designation: col,
 position: inferColumnPosition(col, sortedColumns.length, idx),
 }));
 }
 ```
- **inferColumnPosition() function required**: Infers column position (L/C/R)
- Template reference: `templates/lib/seat-transformer.ts.template` v1.2.0

CRITICAL Bug Warning #9: SeatAvailability API Response Normalization Required
- **Must handle AlaCarteOffer vs ALaCarteOffer case variants!**
- **Symptom**: Seat prices displayed as 0 KRW
- Cause: Transformer expects ALaCarteOffer but API returns AlaCarteOffer (different case)
- Wrong code (seat-availability route):
 ```typescript
 // Pass directly without normalization - WRONG!
 const seatData = transformSeatAvailabilityResponse(response);
 ```
- Correct code:
 ```typescript
 // Response normalization required!
 const alaCarteOffer = response.AlaCarteOffer || response.ALaCarteOffer;
 const seatMap = response.SeatMap || alaCarteOffer.SeatMap;
 const alaCarteOfferItem = response.AlaCarteOfferItem || alaCarteOffer.AlaCarteOfferItem || alaCarteOffer.ALaCarteOfferItem;

 const normalizedResponse = {
 ...response,
 ALaCarteOffer: {
 ...alaCarteOffer,
 SeatMap: seatMap,
 ALaCarteOfferItem: alaCarteOfferItem,
 },
 };
 const seatData = transformSeatAvailabilityResponse(normalizedResponse);
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (seat-availability logic)

CRITICAL Bug Warning #10: OrderCreate pointOfSale Prohibited
- **Setting pointOfSale field on OrderCreateRequest causes errors!**
- **Symptom**: "Agency provider is not found" 400 error
- Cause: Middleware tries to find agency by pointOfSale but it doesn't exist
- Wrong code (booking route):
 ```typescript
 const orderCreateRequest = {
 transactionId,
 orders,
 paxList,
 pointOfSale: 'KR', // X - causes error!
 };
 ```
- Correct code:
 ```typescript
 const orderCreateRequest = {
 transactionId,
 orders,
 paxList,
 contactInfoList: contactInfoList || [],
 paymentList: paymentList || [],
 // No pointOfSale field!
 };
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (createOrder logic)

CRITICAL Bug Warning #11: TR Seat Purchase OfferItemID Change
- **TR (Scoot) and some airlines change OfferItemID after OrderQuote!**
- **Symptom**: OrderChange call returns 500 error or "Offer Item not found"
- Cause: Using OLD IDs from SeatAvailability in OrderChange
- Solution:
 1. Extract and save new `OfferItemID` from `OrderQuote` response
 2. Use new IDs from `quoteData.offerItems` when calling `OrderChange`
 3. Reassemble `seatSelection` info by matching `paxRefId` from `selectedSeats`
- Template reference: `templates/lib/polarhub-service.ts.template` (seat-purchase confirm logic)

CRITICAL Bug Warning #12: AY Post-Ticketing 2-Step OrderChange Required (v3.17.0)
- **AY airline always requires two-step split regardless of ancillary service purchase!**
- **Symptom**: 500 error when calling OrderChange with payment after Quote
- **Flow**:
 1. `OrderQuote` (if needed)
 2. `OrderChange` Step 1: `acceptSelectedQuotedOfferList` (no payment info!)
 3. `OrderChange` Step 2: PaymentList Only (no changeOrderChoice!)
- **Template reference**: `templates/lib/polarhub-service.ts.template` (service-purchase confirm logic)

WARNING: Must use order-retrieve-transformer.ts.template v3.1!

Required templates:
1. Service layer: Read(".claude/skills/whitelabel-dev/templates/lib/polarhub-service.ts.template")
2. Type definition: Read(".claude/skills/whitelabel-dev/templates/types/booking.ts.template")

Required components (8):
1. BookingHeader.tsx.template - PNR, orderId, status, createdAt
2. ItineraryCard.tsx.template - Itinerary, priceClass, baggage, hiddenStops
3. PassengerList.tsx.template - Passengers, apisInfo (passport), ffn (frequent flyer)
4. PriceSummary.tsx.template - Fare summary
5. ActionButtons.tsx.template - Action buttons, service purchase confirmation
6. OcnCard.tsx.template - OCN information (AF/KL only)
7. SsrInfo.tsx.template - SSR information (ancillary services)
8. TicketList.tsx.template - Ticket information

Required field checklist:

BookingHeader:
- pnr, orderId, carrierCode, carrierName
- status, statusLabel, isTicketed
- paymentTimeLimit, ticketingTimeLimit, createdAt

PassengerList:
- Basic: paxId, ptc, title, fullName, birthdate
- Contact: mobile, email
- Passport (apisInfo): passportNumber, nationality, expiryDate
- Frequent flyer (ffn): programCode, memberNumber
- Accompanying infant: accompanyingInfant

ItineraryCard:
- Itinerary: direction, directionLabel, flightNumber
- Departure/arrival: airport, time, date, terminal
- Class: cabinClass, bookingClass
- Fare class: priceClass
- Baggage: baggage
- Stopover: hiddenStops

SsrInfo (new):
- ssrList: paxId, paxName, segment, ssrName, status
- hasPendingSsr, onPurchaseConfirm

OcnCard (new - AF/KL only):
- ocnList: actionType, context, receivedAt
- showOcnAgreeButton, onAgree

Implementation scope:
1. types/booking.ts - Including ApisInfo, FfnInfo, OcnItem, SsrItem types
2. lib/api/order-retrieve-transformer.ts - Including DataLists parsing logic
3. components/booking/ - All 8 components
4. booking/[id]/page.tsx - Full page composition

Reference:
- Page guide: references/pages/booking-detail.md
- API mapping: references/api-mapping/order-retrieve.md

Output: apps/{tenant_id}/src/
""")
```

**4-5 ~ 4-12: Service Layer (No API Routes Needed)**

> **All API logic is handled by `polarhub-service.ts` (23 service functions).**
> Steps 4-5 through 4-12 are no longer separate API route creation steps.
> Pages call service functions directly. Example:
>
> ```typescript
> import { getSeatAvailability, purchaseSeat, getServiceList, purchaseService,
>          cancelOrder, getRefundQuote, changePax, splitPax,
>          orderChangeTicketing, orderQuote, orderReshopTicketing,
>          journeyChange, journeyChangeQuote, journeyChangeConfirm,
>          ApiError } from '@/lib/api/polarhub-service';
> ```
>
> **Service Layer Architecture:**
> ```
> Browser (React SPA) → polarhub-service.ts → callMiddlewareAPI() → Middleware API
> ```
>
> All carrier-specific branching, quote flows, and multi-step OrderChange logic
> are implemented inside polarhub-service.ts functions.

WARNING: Important: If OrderQuote response has ReshopOffers.AddOfferItem.Service.SelectedSeat,
map it to seat-purchase/quote's quoteData.offerItems.seatSelection (AY seats)
WARNING: Important: If seat-purchase/confirm has quoteData.offerItems.seatSelection,
use it as-is instead of reconstructing from selectedSeats (prevents OrderChange Step 1 omission)
WARNING: AY Step 2: OrderChange sends only paymentList (no changeOrderChoice/quoteData!)
WARNING: If services/seats are already added via OrderChange, PaymentPopup should skip Step 1
and only call Step 2 (paymentList only)

**4-13. Cancel Page (Post-Booking)**
```
Task(subagent_type="app-builder", prompt="""
Implement the cancel page for tenant {tenant_id}.

WARNING: Required task order (do not skip!) WARNING:

Stage 1: READ template files
 - Read(".claude/skills/whitelabel-dev/templates/pages/cancel-page.tsx.template")

Stage 2: COPY template contents as-is
 - booking/[id]/cancel/page.tsx ← COPY from cancel-page.tsx.template
 - WARNING: Do NOT write code from scratch! The template contains critical patterns:
   - Import functions: getBookingDetail, cancelBooking, getRefundQuote (NOT retrieveOrder/cancelOrder!)
   - Import from '@/lib/api/polarhub-service' (NOT custom fetch calls!)
   - CancelConfirmPopup, RefundQuotePopup, CancelResultCard from '@/components/cancel'

Output: apps/{tenant_id}/src/app/booking/[id]/cancel/
""")
```

### Step 5: Verification

Post-implementation checklist:

**Project setup:**
- [ ] package.json created
- [ ] tailwind.config.ts created
- [ ] globals.css created
- [ ] `tenant/{tenant_id}/apps/` path NOT created
- [ ] lib files only exist under `src/lib/api/`

**Components (55+):**
- [ ] layout/: Header, Footer
- [ ] ui/: Button, Input, Card, Badge, Modal (5+)
- [ ] search/: SearchForm (required)
- [ ] flight/: FlightCard, FilterPanel, PriceBreakdown
- [ ] booking/: BookingHeader, ItineraryCard, PassengerList, PriceSummary, ActionButtons
- [ ] booking/: FareRules, TicketList, OcnCard, SsrInfo
- [ ] booking/: PassengerEditModal, PassengerSplitModal, ServicePurchaseModal
- [ ] booking/: PostTicketingSeatPopup, TicketingWithServiceModal
- [ ] seat/: SeatMap, SeatSelector, SeatLegend, **index.ts** ← required!
- [ ] service/: ServiceCard, ServiceSelector, **index.ts** ← required!
- [ ] cancel/: CancelConfirmPopup, RefundQuotePopup, CancelResultCard
- [ ] booking/pax-change/: **index.ts** + NameChangeForm, ContactChangeForm, ContactAddDeleteForm, ApisChangeForm, FfnChangeForm, DocaChangeForm (7)
- [ ] booking/journey-change/: **index.ts** + ItinerarySelector, FlightOptionList, ChangeModeSelector, JourneyChangeModal, PriceSummaryCard (6)
- [ ] payment/: **index.ts** + PaymentPopup, PaymentForm, FareDifferencePopup (4)

**Pages (5):**
- [ ] page.tsx (main)
- [ ] results/page.tsx (search results)
- [ ] booking/page.tsx (passenger information input)
- [ ] booking/[id]/page.tsx (booking detail) - uses `useParams()` from react-router-dom
- [ ] booking/[id]/cancel/page.tsx (cancel)

> **Note**: React Router routes are defined in `App.tsx` using `:id` syntax (e.g., `/booking/:id`).
> Page components use `const { id } = useParams()` to access route parameters.

**Service Layer (replaces API routes):**
- [ ] lib/api/polarhub-service.ts (barrel re-export)
- [ ] lib/api/polarhub-service-prebooking.ts (8 functions)
- [ ] lib/api/polarhub-service-postbooking.ts (7 functions)
- [ ] lib/api/polarhub-service-ancillary.ts (7 functions)
- [ ] lib/api/middleware-client.ts (callMiddlewareAPI helper)
- [ ] lib/api/order-retrieve-transformer.ts
- [ ] lib/api/pax-change-service.ts

**Vite + React SPA Config:**
- [ ] vite.config.ts
- [ ] index.html
- [ ] src/main.tsx
- [ ] src/App.tsx (React Router routes)
- [ ] nginx.conf
- [ ] Dockerfile

**Lib/Types (24+):**
- [ ] lib/api/polarhub-service.ts (barrel re-export)
- [ ] lib/api/polarhub-service-prebooking.ts
- [ ] lib/api/polarhub-service-postbooking.ts
- [ ] lib/api/polarhub-service-ancillary.ts
- [ ] lib/api/middleware-client.ts
- [ ] lib/api/order-retrieve-transformer.ts
- [ ] lib/api/pax-change-service.ts
- [ ] lib/api/offer-transformer.ts
- [ ] lib/api/seat-transformer.ts
- [ ] lib/api/service-transformer.ts
- [ ] lib/api/journey-transformer.ts
- [ ] lib/status-codes.ts
- [ ] lib/error-messages.ts
- [ ] types/booking.ts
- [ ] types/seat.ts
- [ ] types/service.ts
- [ ] types/cancel.ts
- [ ] types/payment.ts
- [ ] types/pax-split.ts
- [ ] types/pax-change.ts
- [ ] types/seat-purchase.ts
- [ ] types/service-purchase.ts
- [ ] types/ticketing-with-service.ts
- [ ] types/theme.ts
- [ ] types/journey-change.ts

**Type safety verification (required!):**
- [ ] Header.tsx: `import Button from` (Default import)
- [ ] seat/index.ts: Props interfaces defined
- [ ] service/index.ts: Props interfaces defined
- [ ] polarhub-service.ts: All 23 service functions exported
- [ ] order-retrieve-transformer.ts: hasTickets ?? false handled
- [ ] order-retrieve-transformer.ts: status as BookingStatus cast
- [ ] order-retrieve-transformer.ts: passengerBreakdown includes ptcLabel
- [ ] `npm run build` succeeds (produces dist/ folder)
- [ ] `npm run lint` succeeds
- [ ] `npx tsc --noEmit` succeeds

**Quality gate (must comply):**
- [ ] No `@ts-nocheck` in generated artifacts
- [ ] No `'use client'` directives (not needed in Vite SPA)
- [ ] No `process.env` usage (use `import.meta.env` instead)
- [ ] No `src/app/api/` directory (service layer replaces API routes)

---

## Core Guidelines (Must Follow!)

> **CRITICAL: Do not write code from scratch! Always READ and COPY templates.**
>
> Implementing without templates causes mismatches with the Middleware API spec and errors.
> The guidelines below are summaries of template contents. **Always reference the actual template files during implementation.**

### 0. Import/Export Rules (TypeScript Error Prevention!)

**Always** follow these rules when importing components:

| Component | Export Type | Import Method |
|----------|-------------|-------------|
| **Header** | Named (`export { Header }`) | `import { Header } from '@/components/layout/Header'` |
| **Footer** | Named (`export { Footer }`) | `import { Footer } from '@/components/layout/Footer'` |
| FlightCard | Default | `import FlightCard from '@/components/flight/FlightCard'` |
| FilterPanel | Default | `import FilterPanel from '@/components/flight/FilterPanel'` |
| PriceBreakdown | Default | `import PriceBreakdown from '@/components/flight/PriceBreakdown'` |
| Booking components | Default | `import BookingHeader from '@/components/booking/BookingHeader'` |
| UI components | Named (index.ts) | `import { Button, Input, Card } from '@/components/ui'` |

```typescript
// Correct import example
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import FlightCard, { Flight } from '@/components/flight/FlightCard';
import { Button, Input, Card } from '@/components/ui';

// Wrong import example (TypeScript error!)
import Header from '@/components/layout/Header'; // Header is named export!
import Footer from '@/components/layout/Footer'; // Footer is named export!
```

### 0-1. Required Dependencies (package.json)

The design-system-setup agent **must** include these dependencies:

```json
{
 "dependencies": {
 "clsx": "^2.1.1",
 "tailwind-merge": "^2.5.2"
 }
}
```

> **WARNING: If missing**: `Cannot find module 'clsx'` error occurs

### 0-2. TypeScript Configuration (tsconfig.json)

```json
{
 "compilerOptions": {
 "noUnusedLocals": false,
 "noUnusedParameters": false
 }
}
```

> **WARNING: If set to true**: Template component unused variable warnings occur

---

### 1. API Basic Configuration

| Item | Value | Template Reference |
|------|-------|-------------------|
| Middleware port | `localhost:3000` | `middleware-client.ts.template` |
| API prefix | `/middleware/polarhub/` | `middleware-client.ts.template` |
| Method | All **POST** | `polarhub-service.ts.template` |
| transactionId | 32-char hex | `generateTransactionId()` function |

### 2. Middleware API Endpoint Summary

| Feature | Endpoint | Service Function |
|---------|----------|----------|
| Flight search | `/middleware/polarhub/air-shopping` | `searchFlights()` |
| Fare details | `/middleware/polarhub/offer-price` | `getOfferPrice()` |
| Booking creation | `/middleware/polarhub/order` | `createOrder()` |
| Booking retrieval | `/middleware/polarhub/order/retrieve` | `retrieveOrder()` |
| Booking cancellation | `/middleware/polarhub/order/cancel` | `cancelOrder()` |
| Seat availability | `/middleware/polarhub/seat-availability` | `getSeatAvailability()` |
| Service list | `/middleware/polarhub/service-list` | `getServiceList()` |
| Refund quote | `/middleware/polarhub/order-reshop` | `getRefundQuote()` |

> **WARNING: Do not use RESTful style!** Include orderId in the body, not as a path parameter.

### 3. Request/Response Format

**See templates for detailed formats:**

- **Request format**: `AirShoppingRequest`, `OfferPriceRequest`, etc. in `middleware-client.ts.template`
- **Response transformation**: `AirShoppingResponse` type and `transformOffersToFlights()` function in `offer-transformer.ts.template`
- **Key point**: `response.Offer` (capital O), `offer.TotalPrice.TotalAmount.Amount` (nested structure)

### 4. Tailwind CSS Text Color Rules

Do not rely solely on custom color tokens (`text-primary`, `text-error`, etc.).
**Always use explicit default color classes:**

```tsx
// Correct example - explicit color specification
<label className="text-sm font-medium text-gray-700">Label</label>
<span className="text-red-500">*</span>
<p className="text-gray-500">Description text</p>

// Wrong example - only custom tokens
<label className="text-sm font-medium">Label</label>
<span className="text-error">*</span>
<p className="text-muted">Description text</p>
```

**Recommended color classes:**
| Usage | Recommended Class |
|-------|------------------|
| General text | `text-gray-900` |
| Labels, subtitles | `text-gray-700` |
| Descriptions, helper text | `text-gray-500` |
| Required indicator (*) | `text-red-500` |
| Success messages | `text-green-600` |

---

## Template Usage Rules (Absolutely Required!)

> **WARNING**: Writing service functions from scratch causes mismatches with the Middleware API spec and errors!
> **Always copy from templates.** Do not write code from scratch!

The following files **must** be generated based on templates:

### Service Layer (templates/lib/)

| Service Function | Template | Core Logic |
|-----|----------|-----------|
| `searchFlights()` | polarhub-service.ts.template | Pass paxList, originDestList, paxJourneyList |
| `getOfferPrice()` | polarhub-service.ts.template | offers array, seatSelection, bookingInstructions support |
| `createOrder()` | polarhub-service.ts.template | **transactionId pass-through required!** orders array, **identityDoc.issuingCountryCode required!** |
| `retrieveOrder()` | polarhub-service.ts.template | WARNING: **generateTransactionId() required!** |
| `getSeatAvailability()` | polarhub-service.ts.template | offer/order based query |
| `getServiceList()` | polarhub-service.ts.template | ALaCarteOffer case handling |
| `cancelOrder()` | polarhub-service.ts.template | Cancel vs VOID/REFUND branching |
| `getRefundQuote()` | polarhub-service.ts.template | cancelOrderRefId is STRING |

### Service Layer Pattern (Required!)

> **WARNING: Never use `TXN_${Date.now()}` format! WARNING:**
>
> PolarHub API requires transactionId to be **exactly a 32-character hex string**.
> Using incorrect format causes error: `transactionId must be a 32-character hexadecimal string`

All API calls go through the service layer (no API routes):

```typescript
// Pages call service functions directly:
import { retrieveOrder, searchFlights, getOfferPrice, ApiError } from '@/lib/api/polarhub-service';

// Service functions call callMiddlewareAPI() internally:
// polarhub-service.ts → callMiddlewareAPI() → Middleware API

// Environment variable for middleware URL:
const MIDDLEWARE_URL = import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:3000';
```

**Absolutely prohibited:**
```typescript
transactionId: `TXN_${Date.now()}` // Causes error!
process.env.POLARHUB_API_URL // Wrong! Use import.meta.env.VITE_MIDDLEWARE_URL
```

**Correct method:**
```typescript
transactionId: generateTransactionId() // 32-char hex string
import.meta.env.VITE_MIDDLEWARE_URL // Vite environment variable
```

### WARNING: transactionId Pass-through Required! WARNING:

> **CRITICAL: OrderCreate transactionId must match OfferPrice!**
>
> OpenAPI spec: "Transaction ID: Must be same as OfferPrice (pass-through from FE)"
>
> transactionId mismatch causes **Middleware API 500 Internal Server Error**.
> Do not generate a new transactionId!

**Wrong example:**
```typescript
// booking/page.tsx - transactionId missing
const result = await createOrder({
 orders: [...], // No transactionId!
});
```

**Correct example:**
```typescript
// booking/page.tsx - transactionId included!
const result = await createOrder({
 transactionId: bookingData.transactionId, // Required! From OfferPrice response
 orders: [...],
});

// polarhub-service.ts - uses transactionId passed from page!
// Do not generate new transactionId for OrderCreate!
```

### WARNING: identityDoc.issuingCountryCode Missing Causes 500 Error! WARNING:

> **CRITICAL: `issuingCountryCode` is required when sending passport info (identityDoc)!**
>
> Per OpenAPI IdentityDocDto spec, `issuingCountryCode` (issuing country code) is a required field.
> Missing this field causes **Middleware API 500 Internal Server Error**.

**Absolutely prohibited (issuingCountryCode missing):**
```typescript
identityDoc: [{
 identityDocType: 'PT',
 identityDocId: passportNumber,
 expiryDate: passportExpiry,
 citizenshipCountryCode: nationality, // ← no issuingCountryCode!
}]
```

**Correct method:**
```typescript
identityDoc: [{
 identityDocType: 'PT',
 identityDocId: passportNumber,
 expiryDate: passportExpiry,
 issuingCountryCode: nationality || 'KR', // Required!
 citizenshipCountryCode: nationality,
}]
```

| Service Function | Middleware Endpoint | Method | Request Body |
|--------|-------------------|--------|--------------|
| `retrieveOrder(orderId)` | `/middleware/polarhub/order/retrieve` | POST | `{ transactionId, orderId }` |
| `getSeatAvailability(params)` | `/middleware/polarhub/seat-availability` | POST | `{ transactionId, order: { orderId } }` |
| `purchaseSeat(params)` | `/middleware/polarhub/order-change` | POST | `{ transactionId, orderId, ... }` |
| `getServiceList(params)` | `/middleware/polarhub/service-list` | POST | `{ transactionId, order: { orderId } }` |
| `purchaseService(params)` | `/middleware/polarhub/order-change` | POST | `{ transactionId, orderId, ... }` |
| `cancelOrder(orderId)` | `/middleware/polarhub/order/cancel` | POST | `{ transactionId, orderId }` |
| `getRefundQuote(params)` | `/middleware/polarhub/order-reshop` | POST | `{ transactionId, orderId, ... }` |

### Lib (templates/lib/)

| File | Template | Core Logic |
|------|----------|-----------|
| polarhub-service.ts | polarhub-service.ts.template | Barrel re-export (single import path for all 22 functions) |
| polarhub-service-prebooking.ts | polarhub-service-prebooking.ts.template | Pre-booking: search, price, seat/service availability, booking, cancel, refund (8 functions) |
| polarhub-service-postbooking.ts | polarhub-service-postbooking.ts.template | Post-booking: ticketing, reshop, pax split, journey change (7 functions) |
| polarhub-service-ancillary.ts | polarhub-service-ancillary.ts.template | Ancillary: seat purchase, service purchase workflows (7 functions) |
| middleware-client.ts | middleware-client.ts.template | callMiddlewareAPI helper, generateTransactionId, isSuccessCode |
| order-retrieve-transformer.ts | order-retrieve-transformer.ts.template | OrderRetrieve response transformation |
| pax-change-service.ts | pax-change-service.ts.template | Pax change service functions |
| offer-transformer.ts | offer-transformer.ts.template | MatchResult normalization, PARTIAL OD mapping |
| seat-transformer.ts | seat-transformer.ts.template | SeatAvailability response transformation |
| service-transformer.ts | service-transformer.ts.template | requiresWeightInput specific, BookingInstructions |

### Pages (templates/pages/)

| Page | Template | Core Logic |
|------|----------|-----------|
| Search results | search-page.tsx.template | OfferPrice call → PriceBreakdown modal → navigate to /booking |
| Passenger info | **booking-page.tsx.template** | Load bookingData from sessionStorage, **3 booking options (hold/cash/card)**, OrderCreate call |

### Components (templates/components/)

| Category | Templates |
|----------|----------|
| seat/ | SeatMap.tsx, SeatSelector.tsx, SeatLegend.tsx, **index.ts** |
| service/ | ServiceCard.tsx, ServiceSelector.tsx, **index.ts** |
| cancel/ | CancelConfirmPopup.tsx, RefundQuotePopup.tsx, CancelResultCard.tsx |

> **WARNING: Required**: Missing **index.ts** files in seat/ and service/ directories causes import errors in booking/page.tsx!

### Types (templates/types/)

| File | Template |
|------|----------|
| seat.ts | seat.types.ts.template |
| service.ts | service.types.ts.template |
| cancel.ts | cancel.types.ts.template |

---

## Page Implementation

For implementing specific pages only **(app-builder standalone call)**:

### Supported Page List

| Page | File | Key Components | API Mapping Reference |
|------|------|---------------|----------------------|
| **Main (search form)** | page.tsx | SearchForm | references/api-mapping/search-form.md |
| Search results | results/page.tsx | FlightCard, FilterPanel, PriceBreakdown | references/api-mapping/air-shopping.md |
| **Passenger info** | booking/page.tsx | PassengerForm, PaymentForm | references/pages/booking-payment.md |
| Booking detail | booking/[id]/page.tsx | BookingHeader, ItineraryCard | references/api-mapping/order-retrieve.md |
| Seat selection | booking/[id]/seats/page.tsx | SeatMap, SeatSelector | references/api-mapping/seat-availability.md |
| Service purchase | booking/[id]/services/page.tsx | ServiceCard, ServiceSelector | references/api-mapping/service-list.md |
| Cancel/refund | booking/[id]/cancel/page.tsx | CancelConfirmPopup, RefundQuotePopup | references/api-mapping/cancel-refund.md |

### Implementation Order

1. Read the API mapping document for the page
2. Verify service layer functions exist in `polarhub-service.ts`
3. Import service functions: `import { functionName, ApiError } from '@/lib/api/polarhub-service';`
4. Verify existing components (`apps/{tenant_id}/src/components/`)
5. Implement via app-builder agent (use react-router-dom for navigation)

```
Task(subagent_type="app-builder", prompt="""
Implement the {page_name} page for tenant {tenant_id}.

Reference:
- API mapping: references/api-mapping/{mapping_file}.md
- Existing components: apps/{tenant_id}/src/components/
- Templates: .claude/skills/whitelabel-dev/templates/

Output: apps/{tenant_id}/src/app/{page_path}/page.tsx
""")
```

---

## Component Work

For adding/modifying components **(call component-builder)**:

### Adding Components

```
Task(subagent_type="component-builder", prompt="""
Add {component_name} component to tenant {tenant_id}.

Reference:
- Component spec: tenant/{tenant_id}/components/{component_name}.json
- Design system: tenant/{tenant_id}/design-system.json
- Templates (if applicable): .claude/skills/whitelabel-dev/templates/components/

Output: apps/{tenant_id}/src/components/{category}/{ComponentName}.tsx
""")
```

### Modifying Components

```
Task(subagent_type="component-builder", prompt="""
Modify the {component_name} component for tenant {tenant_id}.

Modification: {modification_description}

Existing code: apps/{tenant_id}/src/components/{category}/{ComponentName}.tsx
Output: Modify in same location
""")
```

---

## Style Update

For style/design system modifications **(call design-system-setup)**:

```
Task(subagent_type="design-system-setup", prompt="""
Update the design system for tenant {tenant_id}.

Changes: {style_changes}

Input: tenant/{tenant_id}/design-system.json (modified version)
Output:
- apps/{tenant_id}/tailwind.config.ts
- apps/{tenant_id}/src/app/globals.css
""")
```

---

## Required Reference Materials (Assets)

### Middleware API Spec

```
.claude/assets/whitelabel-middleware.openapi.yaml
```

- All API endpoint definitions
- Request DTO schemas
- Workflow descriptions

### API-UI Mapping Documents

```
.claude/assets/plan/api-ui-mapping/
├── plan.md # Full mapping plan
├── mappings/
│ ├── booking/ # Booking/ticketing flow
│ │ ├── air-shopping.md # AirShoppingRS → FlightCard
│ │ ├── offer-price.md # OfferPriceRS → PriceBreakdown
│ │ ├── order-retrieve.md # OrderViewRS → BookingDetail
│ │ ├── seat-availability.md # SeatAvailabilityRS → SeatMap
│ │ └── service-list.md # ServiceListRS → ServiceList
│ ├── servicing/ # Booking change flow
│ │ ├── journey-change.md
│ │ ├── info-change.md
│ │ └── cancel-refund.md
│ └── ui-fields/ # UI component field definitions
│ ├── flight-card-fields.md
│ ├── filter-fields.md
│ ├── booking-detail-fields.md
│ └── ...
└── response-sample/ # Actual API response samples
 ├── 17.2/ # (AA, EK, LH)
 └── 21.3/ # (SQ, AY, HA, ...)
```

### Workflow Sequences

```
.claude/assets/carrier-support-matrix.yaml
```

- API call order (WF_PB_DEFERRED, WF_PB_IMMEDIATE, etc.)
- Airline-specific feature support matrix

### UI Component Guide

```
.claude/assets/ui-component-guide/
├── 02-common/ # Common components, design system
├── 03-booking/ # Search, results, payment
├── 04-booking-detail/ # Booking detail
├── 06-change/ # Journey change, info change
└── 07-popups/ # Seat, service popups
```

---

## Sub Agent Reference Materials

| Agent | Assets to Reference |
|-------|-------------------|
| **design-system-setup** | `ui-component-guide/02-common/design-system.md` |
| **component-builder** | `templates/components/`, `api-ui-mapping/mappings/ui-fields/`, `ui-component-guide/` |
| **app-builder** | `templates/lib/`, `templates/config/`, `whitelabel-middleware.openapi.yaml`, `api-ui-mapping/mappings/booking/` |

### Code Templates (Required Reference for All Agents)

```
.claude/skills/whitelabel-dev/templates/
├── config/ # Vite + React SPA config templates
│ ├── vite.config.ts.template
│ ├── index.html.template
│ ├── main.tsx.template
│ ├── App.tsx.template
│ ├── vite-env.d.ts.template
│ ├── nginx.conf.template
│ └── Dockerfile.template
├── components/ # Component templates (10)
│ ├── seat/ # SeatMap, SeatSelector, SeatLegend, index.ts
│ ├── service/ # ServiceCard, ServiceSelector, index.ts
│ └── cancel/
├── lib/ # Lib templates (10)
│ ├── polarhub-service.ts.template # Barrel re-export (single import path)
│ ├── polarhub-service-prebooking.ts.template # Pre-booking (8 functions)
│ ├── polarhub-service-postbooking.ts.template # Post-booking (7 functions)
│ ├── polarhub-service-ancillary.ts.template # Ancillary purchase (7 functions)
│ ├── middleware-client.ts.template # callMiddlewareAPI helper
│ ├── order-retrieve-transformer.ts.template
│ ├── pax-change-service.ts.template
│ ├── offer-transformer.ts.template
│ ├── seat-transformer.ts.template
│ └── service-transformer.ts.template
└── types/ # Type templates (3)
```

### API Client Guide

```
.claude/skills/whitelabel-dev/references/api-client/
├── middleware-client.md # Middleware communication client
├── offer-transformer.md # Offer domain (AirShopping, OfferPrice → Flight[], PriceBreakdown)
└── order-transformer.md # Order domain (OrderRetrieve, OrderReshop → BookingDetail, ReshopOption)
```

> **Important**: `_raw` structure and `paxRefId` extraction paths must follow the templates.

---

## Final Artifact Structure

```
apps/{tenant_id}/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── tailwind.config.ts
├── index.html                     # HTML entry point
├── nginx.conf                     # nginx SPA config
├── Dockerfile                     # 2-stage build (node → nginx)
└── src/
 ├── main.tsx                      # App entry point (ReactDOM.createRoot)
 ├── App.tsx                       # React Router routes
 ├── vite-env.d.ts                 # Vite type declarations
 ├── app/
 │ ├── layout.tsx
 │ ├── globals.css
 │ ├── page.tsx                    # Main (search form)
 │ ├── results/
 │ │ └── page.tsx                  # Search results
 │ └── booking/
 │   ├── page.tsx                  # Passenger info input
 │   └── [id]/
 │     └── page.tsx                # Booking detail
 ├── components/
 │ ├── layout/
 │ │ ├── Header.tsx
 │ │ └── Footer.tsx
 │ ├── ui/
 │ │ ├── Button.tsx
 │ │ ├── Input.tsx
 │ │ └── Card.tsx
 │ ├── search/
 │ │ └── SearchForm.tsx
 │ ├── flight/
 │ │ ├── FlightCard.tsx
 │ │ ├── FilterPanel.tsx
 │ │ └── PriceBreakdown.tsx
 │ ├── booking/
 │ │ ├── BookingHeader.tsx
 │ │ ├── ItineraryCard.tsx
 │ │ ├── PassengerList.tsx
 │ │ ├── PriceSummary.tsx
 │ │ └── ActionButtons.tsx
 │ ├── seat/
 │ │ ├── SeatMap.tsx
 │ │ ├── SeatSelector.tsx
 │ │ ├── SeatLegend.tsx
 │ │ └── index.ts                  # ← Barrel export required!
 │ └── service/
 │   ├── ServiceCard.tsx
 │   ├── ServiceSelector.tsx
 │   └── index.ts                  # ← Barrel export required!
 ├── lib/
 │ ├── api/
 │ │ ├── polarhub-service.ts       # Service layer (23 functions)
 │ │ ├── middleware-client.ts      # callMiddlewareAPI helper
 │ │ ├── order-retrieve-transformer.ts
 │ │ ├── pax-change-service.ts
 │ │ ├── offer-transformer.ts
 │ │ ├── seat-transformer.ts
 │ │ └── service-transformer.ts
 │ └── status-codes.ts
 └── types/
   ├── booking.ts
   ├── seat.ts
   └── service.ts
```

---

## Error Handling

| Scenario | Solution |
|----------|---------|
| No tenant configuration | Generate with design-analyzer or request from user |
| Page implementation requested without components | Run component-builder first |
| Component implementation requested without design system | Run design-system-setup first |
| Missing API mapping | Check api-mapping documents, request additions if needed |
| No template for file | Implement referencing existing guide documents |

CRITICAL Bug Warning #11: SeatAvailability Owner Fallback Required
- **Must get Owner from request when ALaCarteOffer.Owner is missing in API response!**
- **Symptom**: "Agency provider is not found" 400 error on OfferPrice re-call after seat selection
- Cause: seat-transformer sets Owner to 'XX', middleware can't find that agency
- Wrong code (seat-transformer):
 ```typescript
 const owner = offer?.Owner || 'XX'; // Causes error!
 ```
- Correct code (fallback handling in seat-availability route):
 ```typescript
 // Owner fallback in polarhub-service.ts
 const owner = alaCarteOffer.Owner || body.offer?.owner || body.order?.owner || '';

 const normalizedResponse = {
 ...response,
 ALaCarteOffer: {
 ...alaCarteOffer,
 Owner: owner, // Fallback Owner included
 SeatMap: seatMap,
 ALaCarteOfferItem: alaCarteOfferItem,
 },
 };
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (seat-availability normalization)

CRITICAL Bug Warning #12: WF_PB_SEAT_REPRICE offerItems Extraction Missing
- **TR, AF, KL airlines re-call OfferPrice after seat selection (2nd OfferPrice)**
- **2nd OfferPrice response OfferItems contain 3 mixed types**
- **Symptom**: 500 Internal Server Error on OrderCreate
- Cause: offer-transformer only processes FareDetail, leaving seat/service item paxRefId as empty array
- Wrong code (offer-transformer):
 ```typescript
 paxRefId: item.FareDetail?.flatMap((fd) => fd.PaxRefID) || []
 // → Seat item paxRefId is empty array! → OrderCreate 500 error
 ```
- Correct code (must handle 3 cases):
 ```typescript
 offerItems: pricedOffer.OfferItem.map((item) => {
 let paxRefId: string[] = [];
 // 1. Seat item (direct PaxRefID)
 if (item.PaxRefID?.length > 0) {
 paxRefId = item.PaxRefID;
 }
 // 2. Fare item (FareDetail)
 else if (item.FareDetail?.length > 0) {
 paxRefId = item.FareDetail.flatMap((fd) => fd.PaxRefID);
 }
 // 3. Service item (Service)
 else if (item.Service?.length > 0) {
 paxRefId = item.Service.flatMap((svc) => {
 const ref = svc.PaxRefID;
 return Array.isArray(ref) ? ref : [ref];
 });
 }
 return { offerItemId: item.OfferItemID, paxRefId };
 })
 ```
- Template reference: `templates/lib/offer-transformer.ts.template` (transformOfferPriceResponse)
- Document reference: `references/api-client/offer-transformer.md`

CRITICAL Bug Warning #13: WF_PB_SEAT_REPRICE Orders Construction Error
- **TR, AF, KL airlines must send a single order with 2nd OfferPrice merged offerItems!**
- **Symptom**: 500 Internal Server Error on OrderCreate
- Cause: booking/page.tsx uses bookingData.offerItems (1st OfferPrice) and splits into 2 orders
- **Key**: 2nd OfferPrice response returns offerItems with itinerary+seats already merged
- Wrong code (2 orders, 1st OfferPrice offerItems):
 ```typescript
 orders = [
 { ...seatOfferData, offerItems: bookingData.offerItems }, // 1st OfferPrice!
 { ...seatOfferData, offerItems: buildSeatOfferItems() },
 ];
 ```
- Correct code (single order, 2nd OfferPrice merged offerItems):
 ```typescript
 orders = [{
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: seatOfferData.offerItems, // 2nd OfferPrice merged offerItems!
 }];
 ```
- **Comparison**: WF_PB_SEAT (SQ, etc.) requires 2 orders (no OfferPrice re-call)
 - Itinerary order: use bookingData
 - Seat order: use seatOfferData + buildSeatOfferItems()
- Template reference: `templates/pages/booking-page.tsx.template`

CRITICAL Bug Warning #14: Tailwind Semantic Color Token Undefined
- **Popup component backgrounds appear transparent/black**
- **Symptom**: SeatSelector, ServiceSelector popup backgrounds are translucent black
- Cause: Components use single color classes like `bg-background`, `bg-surface`, but tailwind.config.ts defines nested objects
- Wrong definition (tailwind.config.ts):
 ```typescript
 colors: {
 background: {
 primary: '#FFFFFF',
 secondary: '#F8F9FA',
 },
 border: {
 light: '#E8EAED',
 dark: '#DADCE0',
 },
 }
 // → Generates bg-background-primary class (not bg-background!)
 // → Component's bg-background is undefined → transparent background
 ```
- Correct definition (single colors required!):
 ```typescript
 colors: {
 // Single colors (required!) - bg-background, bg-surface, text-foreground, etc.
 background: '#FFFFFF',
 surface: '#F8F9FA',
 foreground: '#202124',
 muted: '#5f6368',
 border: '#E8EAED',

 // Brand colors
 primary: '#1a73e8',
 ...
 }
 ```
- Spread design-system.json's `colors.semantic` field at the top level
- Reference: `templates/config/design-system.json`, `.claude/agents/design-system-setup.md`

CRITICAL Bug Warning #16: OrderRetrieve Fare Separation (Flight/Service)
- **Symptom**: serviceCharges is null, ancillary service charges not displayed
- **Cause**: Service OrderItem prices are in `FareDetail`, not `Price` field
- **Key difference**:
 - Flight FareDetail: `PaxRefID: ["PAX8CEC1"]` (has passenger ID)
 - Service FareDetail: `PaxRefID: []` (empty array!)
- Wrong code:
 ```typescript
 // Attempt to extract service price from Price field - WRONG!
 const itemPrice = item.Price?.BaseAmount?.Amount || 0;
 const itemTaxes = item.Price?.Taxes?.TotalAmount?.Amount || 0;
 if (totalServicePrice === 0) return []; // Always returns empty array!
 ```
- Correct code:
 ```typescript
 // Find service FareDetail (one with empty PaxRefID)
 const serviceFareDetail = item.FareDetail?.find(fd =>
 !fd.PaxRefID || fd.PaxRefID.length === 0
 );

 // Extract price from FareDetail (priority 1), Price (priority 2)
 const itemPrice = serviceFareDetail?.BaseAmount?.Amount || item.Price?.BaseAmount?.Amount || 0;
 const itemTaxes = serviceFareDetail?.TaxTotal?.Amount || item.Price?.Taxes?.TotalAmount?.Amount || 0;
 ```
- **Must add fields to Service type**:
 ```typescript
 Service?: Array<{
 ServiceID?: string;
 ServiceDefinitionRefID?: string;
 PaxRefID?: string;
 PaxSegmentRefID?: string;
 Status?: string;
 SelectedSeat?: { Column: string; Row: string }; // Add
 Definition?: { Name?: string; Desc?: Array<{ Text?: string }> }; // Add
 }>;
 ```
- **Service name extraction priority**:
 1. `service.Definition?.Name` (directly inside Service)
 2. `serviceDefMap.get(service.ServiceDefinitionRefID)?.Name`
 3. `service.ServiceID`
- **For seats, include seat number**: `"4F EXTRA COMFORT"`
- Template reference: `templates/lib/order-retrieve-transformer.ts.template` v3.5.0

CRITICAL Bug Warning #17: OrderChange API Request Structure (Post-Ticketing)
- **Symptom**: 400 error - "changeOrderChoice.property paymentList should not exist"
- **Cause**: Placing paymentList inside changeOrderChoice causes error!
- **API spec**: paymentList is a **top-level property** of OrderChangeRequestDto
- Wrong structure:
 ```typescript
 const changeRequest = {
 transactionId, orderId,
 changeOrderChoice: {
 acceptRepricedOrder: { offerRefId },
 paymentList, // Wrong - 400 error if here!
 },
 };
 ```
- Correct structure:
 ```typescript
 const changeRequest = {
 transactionId, orderId,
 changeOrderChoice: {
 acceptRepricedOrder: { offerRefId }, // At least 1 offerRefId required!
 },
 paymentList, // Correct - at top level!
 };
 ```
- **Additional note**: offerRefId also needs at least 1 element!
 - Group A/B: `[quoteData.offerId]`
 - Group C: `[orderId]` (empty array `[]` absolutely prohibited!)
- Reference: `references/api-mapping/post-booking-ticketing.md`

CRITICAL Bug Warning #18: OrderQuote API Request Structure (Post-Ticketing Group B)
- **Symptom**: Error during fare recalculation (Middleware 500 or 400)
- **Cause**: **Missing top-level orderId** in OrderQuoteRequestDto
- **API spec**: `required: [transactionId, orderId]`
- Wrong structure:
 ```typescript
 const quoteRequest = {
 transactionId,
 repricedOrderId: { orderId }, // Wrong - no top-level orderId!
 };
 ```
- Correct structure:
 ```typescript
 const quoteRequest = {
 transactionId,
 orderId, // Required at top level!
 repricedOrderId: {
 orderId,
 orderItemRefId,
 },
 };
 ```
- **Two required fields for OrderQuote request**: transactionId, orderId (top-level)
- Reference: `references/api-mapping/post-booking-ticketing.md`

CRITICAL Bug Warning #19: ServiceList API order.owner Field Prohibited
- **Including owner field in order object for Post-Booking ServiceList call causes 400 error!**
- **Symptom**: ServiceList API 400 error - "API error: 400"
- **Cause**: API spec (OrderRefDto) has no owner field
- **API spec (OrderRefDto)**:
 ```yaml
 OrderRefDto:
 properties:
 orderId:
 type: string
 required:
 - orderId
 # No owner field!
 ```
- Wrong code (causes 400 error!):
 ```typescript
 if (body.order) {
 apiRequestBody.order = {
 orderId: body.order.orderId,
 owner: body.order.owner, // Wrong - field not in API spec!
 };
 }
 ```
- Correct code:
 ```typescript
 if (body.order) {
 apiRequestBody.order = {
 orderId: body.order.orderId,
 // Exclude owner field - not in API spec!
 };
 }
 ```
- **Note**: Even if FE passes owner, it must be excluded when calling Middleware API
- Template reference: `templates/lib/polarhub-service.ts.template` (service-list logic)
- Mapping document: `references/api-mapping/service-list.md`

CRITICAL Bug Warning #20: OrderChange acceptSelectedQuotedOfferList Structure Error
- **acceptSelectedQuotedOfferList must use selectedPricedOffer array!**
- **Symptom**: OrderChange 400 error:
 - "acceptSelectedQuotedOfferList.property offerList should not exist"
 - "acceptSelectedQuotedOfferList.selectedPricedOffer must be an array"
- **Cause**: Using different field name from API spec (offerList vs selectedPricedOffer)
- **API spec (AcceptSelectedQuotedOfferListDto)**:
 ```yaml
 AcceptSelectedQuotedOfferListDto:
 properties:
 selectedPricedOffer: # Correct field name
 type: array
 items:
 $ref: '#/components/schemas/SelectedPricedOfferDto'
 required:
 - selectedPricedOffer
 ```
- Wrong code (causes 400 error!):
 ```typescript
 changeRequest.changeOrderChoice.acceptSelectedQuotedOfferList = {
 responseId: quoteData.responseId,
 offerList: [{...}], // Wrong - field not in API spec!
 };
 ```
- Correct code:
 ```typescript
 changeRequest.changeOrderChoice.acceptSelectedQuotedOfferList = {
 selectedPricedOffer: [{ // Correct field name!
 offerId: quoteData.offerId,
 owner,
 responseId: quoteData.responseId,
 offerItems: [...],
 }],
 };
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (service-purchase add logic)

CRITICAL Bug Warning #21: Post-Booking Service Purchase Quote Step Required
- **All airlines require ServiceList → Quote → OrderChange order!**
- **Symptom**: Failure when calling OrderChange immediately after ServiceList
- **Cause**: Missing Quote (OrderQuote or OfferPrice) step
- **Workflow (carrier-support-matrix.yaml)**:
 - WF_HELD_SERVICE: `OrderRetrieve → ServiceList → OrderQuote → OrderChange`
 - WF_TKT_SERVICE: `OrderRetrieve → ServiceList → OrderQuote → OrderChange`
- **Airline-specific Quote API**:
 - Group B/D (AY, SQ, HA): **OrderQuote**
 - Group A/C (EK, LH, AF, KL): **OfferPrice**
- **CRITICAL**: Quote call requires responseId, offerId from ServiceList response!
- Wrong flow:
 ```
 ServiceList → OrderChange (Add) // Wrong - Quote missing!
 ```
- Correct flow:
 ```
 ServiceList → OrderQuote/OfferPrice → OrderChange
 ```
- **ServicePurchaseModal implementation**:
 - Do not call add step directly!
 - `purchaseService()` function handles the full flow (Quote → Add → Confirm)
 - Must pass `serviceListData` (responseId, offerId, owner)
 ```typescript
 // Call service function (auto-handles Quote → Add)
 import { purchaseService } from '@/lib/api/polarhub-service';

 await purchaseService({
 orderId,
 serviceListData: {
 responseId: serviceData._apiData.responseId,
 offerId: serviceData._apiData.offerId,
 owner: serviceData._apiData.owner,
 },
 selectedServices: [...],
 });
 ```
- Template reference: `templates/components/booking/ServicePurchaseModal.tsx.template`

CRITICAL Bug Warning #22: OrderQuote selectedOffer Must Be Array!
- **selectedOffer must be an array! Do not pass an object!**
- **Symptom**: OrderQuote 400 error:
 - `"selectedOffer must be an array"`
- **Cause**: Using different type from API spec (object vs array)
- **API spec (OpenAPI)**:
 ```yaml
 selectedOffer:
 description: Selected offers for seat/service quote
 type: array # WARNING: Array!
 items:
 $ref: '#/components/schemas/SelectedOfferDto'
 ```
- Wrong code (causes 400 error!):
 ```typescript
 const quoteRequest: OrderQuoteRequest = {
 transactionId,
 orderId,
 selectedOffer: { // Wrong - object! Causes error!
 responseId: ...,
 offerId: ...,
 owner: ...,
 offerItems: [...],
 },
 };
 ```
- Correct code:
 ```typescript
 const quoteRequest: OrderQuoteRequest = {
 transactionId,
 orderId,
 selectedOffer: [{ // Correct - wrap in array!
 responseId: ...,
 offerId: ...,
 owner: ...,
 offerItems: [...],
 }],
 };
 ```
- **OrderQuoteRequest type definition** (middleware-client.ts):
 ```typescript
 selectedOffer?: Array<{ // Array type!
 responseId: string;
 offerId: string;
 owner: string;
 offerItems?: Array<{...}>;
 }>;
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (service-purchase quote logic)
- Template reference: `templates/lib/polarhub-service.ts.template` (service-purchase quote logic)

CRITICAL Bug Warning #23: Service Purchase Add Step Only for AF, KL!
- **Add step (1st OrderChange, no payment) is only needed for AF, KL (Group C)!**
- **Symptom**: Error when calling Add then Confirm for AY, SQ, HA, EK, LH service purchase
- **Cause**: Airline-specific flow differences not reflected
- **Correct flow**:
 | Group | Airlines | Flow |
 |-------|----------|------|
 | **A** | EK, LH | Quote → OrderChange (with Payment) - **single OrderChange** |
 | **B** | AY, SQ | Quote → OrderChange (with Payment) - **single OrderChange** |
 | **C** | AF, KL | OfferPrice → Add (no payment) → Confirm (payment) - **2 steps** |
 | **D** | HA | Quote → OrderChange (with Payment) - **single OrderChange** |
- **Code branching**:
 ```typescript
 import { requiresAddStep } from '@/types/service-purchase';

 if (requiresAddStep(owner)) {
 // Group C (AF, KL): Quote → Add → Confirm
 } else {
 // Group A/B/D: Quote → Confirm (skip Add!)
 }
 ```
- **SERVICE_PURCHASE_GROUPS.REQUIRES_ADD_STEP**: `['AF', 'KL']` - only these airlines need Add step
- Template reference: `templates/lib/polarhub-service.ts.template` (service-purchase logic)

CRITICAL Bug Warning #24: Must Return Quote Data When Called Without Payment Info!
- **When purchaseService() is called without payment info, must return Quote data, not error!**
- **Symptom**: FE cannot display PaymentPopup (error "Payment info required" after Quote success)
- **Cause**: Returning error when no payment info → FE doesn't know payment amount/Quote data
- **Wrong response**:
 ```typescript
 if (!params.payment) {
 throw new ApiError('Payment info required.', 400);
 }
 ```
- **Correct response** (include Quote data):
 ```typescript
 if (!params.payment) {
 return {
 success: true,
 orderId,
 requiresPayment: true,
 paymentAmount: quoteData?.totalPrice, // Payment amount
 currency: quoteData?.currency || 'KRW',
 orderChangeData: { transactionId, orderId },
 quoteData: { // Needed for Confirm call
 responseId: quoteData.responseId,
 offerId: quoteData.offerId,
 offerItems: quoteData.offerItems,
 },
 };
 }
 ```
- **Note**: FE needs Quote result (amount, quoteData) to display PaymentPopup
- Template reference: `templates/lib/polarhub-service.ts.template`

CRITICAL Bug Warning #25: Prevent Duplicate API Calls (useEffect + useRef)
- **useEffect dependency issue causes duplicate API calls!**
- **Symptom**: ServiceList, Quote API called 2+ times consecutively
- **Cause**:
 1. Including `useCallback` function in useEffect dependency array
 2. Effect runs twice in React Strict Mode
 3. Callback dependencies (passengers, etc.) change → function recreated → useEffect re-runs
- **Solution**:
 ```typescript
 // Refs for preventing duplicate API calls
 const fetchingRef = useRef(false);
 const abortControllerRef = useRef<AbortController | null>(null);
 const purchasingRef = useRef(false);

 useEffect(() => {
 // Skip if already fetching (prevent duplicate calls)
 if (fetchingRef.current) {
 console.log('Skip duplicate API call');
 return;
 }
 fetchingRef.current = true;

 // Cancel previous request
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }
 abortControllerRef.current = new AbortController();

 const fetchData = async () => {
 try {
 // Call polarhub-service function directly
 const data = await someServiceFunction(params);
 // ...
 } finally {
 fetchingRef.current = false;
 }
 };

 fetchData();

 return () => {
 abortControllerRef.current?.abort();
 };
 }, [/* Exclude functions from dependencies! */]);
 ```
- **Key points**:
 - Track API call state with `useRef` (use ref instead of state)
 - Cancel previous requests with `AbortController`
 - Remove functions from dependency array, include only needed values
- Template reference: `templates/components/booking/ServicePurchaseModal.tsx.template`

CRITICAL Bug Warning #26: Post-Booking OfferPrice ExistingOrderCriteria Required (AF, KL)
- **Post-booking OfferPrice for seat/service reprice requires `criteria.existingOrderCriteria`!**
- **Symptom**: OfferPrice 400/500 error when repricing seats or services for AF, KL in held/ticketed bookings
- **Cause**: Missing `criteria.existingOrderCriteria` with `orderId` and `paxRefId`
- **Applies to**:
 - Seat purchase quote (Pattern A: AF, KL) - `polarhub-service.ts` seatPurchaseQuote()
 - Service purchase quote (Group A/C: EK, LH, AF, KL) - `polarhub-service.ts` servicePurchaseQuote()
- **Key**: `paxRefId` must include ALL booking passengers, not just those selecting seats/services
- **Use `bookingPaxList`** (passed from FE with actual PTC values) when available
- Correct code:
 ```typescript
 // Use bookingPaxList (ALL booking pax) if available, fallback to selected pax
 const paxListForRequest = body.bookingPaxList && body.bookingPaxList.length > 0
 ? body.bookingPaxList.map(p => ({ paxId: p.paxId, ptc: p.ptc as 'ADT' | 'CHD' | 'INF' }))
 : uniquePaxIds.map(paxId => ({ paxId, ptc: 'ADT' as const }));

 const priceRequest: OfferPriceRequest = {
 transactionId,
 offers: [{ ... }],
 paxList: paxListForRequest,
 // ⭐ Required for post-booking seat/service reprice!
 criteria: {
 existingOrderCriteria: {
 orderId,
 paxRefId: paxListForRequest.map(p => p.paxId),
 },
 },
 };
 ```
- Wrong code (missing criteria):
 ```typescript
 const priceRequest: OfferPriceRequest = {
 transactionId,
 offers: [{ ... }],
 paxList: uniquePaxIds.map(paxId => ({ paxId, ptc: 'ADT' as const })),
 // No criteria! → AF/KL OfferPrice error!
 };
 ```
- Template reference: `templates/lib/polarhub-service.ts.template` (seat/service-purchase quote logic)
- Type reference: `OfferPriceRequest.criteria` in `templates/lib/middleware-client.ts.template`

CRITICAL Bug Warning #27: Seat Confirm Step 2 Pattern A vs Pattern B (AF/KL vs AY/SQ)
- **Pattern A (AF/KL) Step 2 requires `acceptRepricedOrder` + paymentList!**
- **Pattern B (AY/SQ) Step 2 requires paymentList only (no changeOrderChoice content)**
- **Symptom**: MW 500 on seat confirm Step 2 for AF/KL when sending empty `changeOrderChoice: {}`
- Correct code:
  ```typescript
  const isPatternA = config.pattern === 'A';
  changeRequest = {
    transactionId, orderId,
    ...(isPatternA
      ? { changeOrderChoice: { acceptRepricedOrder: { offerRefId: [orderId] } } }
      : { changeOrderChoice: {} }),
    paymentList: [{ type, amount, curCode, paxRefId: [], orderItemId: [], offerItemId: [] }],
  };
  ```
- Also: Use `body.agentDeposit?.agentDepositId &&` (not `body.agentDeposit &&`) to prevent `undefined` spread from empty `{}`
- Template reference: `templates/lib/polarhub-service.ts.template` (seat-purchase confirm logic)

CRITICAL Bug Warning #28: Service Add offerItems fallback (AF/KL post-booking)
- **OfferPrice response may lack PricedOfferItem for post-booking service reprice (AF/KL)**
- **Symptom**: Service Add 400 error "offerItems must contain at least 1 elements"
- **Cause**: `quoteData.offerItems` is undefined, MW rejects null offerItems
- Correct code:
  ```typescript
  offerItems: body.quoteData.offerItems || body.selectedServices.map(svc => ({
    offerItemId: svc.offerItemId,
    paxRefId: [svc.paxId],
    ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
  })),
  ```
- Template reference: `templates/lib/polarhub-service.ts.template` (service-purchase add logic)

## WF_PB_SERVICE (Ancillary Service Flow)

### Service Purchase Flow

```
ServiceList → OfferPrice (re-call) → OrderCreate
```

**Important**: All airlines use the same flow (no branching like CARRIERS_SERVICE_REPRICE)

### handleServiceConfirm Implementation

```typescript
const handleServiceConfirm = async (services: SelectedService[]) => {
 if (services.length > 0) {
 // Build service offerItems
 const serviceOfferItems = services.map((svc) => ({
 offerItemId: svc.offerItemId,
 paxRefId: [svc.paxId],
 // Weight-based services like XBAG need BookingInstructions
 ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
 }));

 // Re-call OfferPrice (2 offers: itinerary + service)
 import { getOfferPrice } from '@/lib/api/polarhub-service';

 const data = await getOfferPrice({
 offers: [
 { ...bookingData... }, // Itinerary Offer
 {
 responseId: serviceData?._apiData.responseId,
 offerId: serviceData?._apiData.offerId,
 owner: serviceData?._apiData.owner,
 offerItems: serviceOfferItems, // Service OfferItems
 },
 ],
 });

 // Set serviceOfferData with new OfferPrice response
 setServiceOfferData({
 responseId: data.responseId,
 offerId: data.offerId,
 owner: data.owner,
 offerItems: data.offerItems, // Itinerary + service merged
 });
 }
};
```

### SQ Special Case (XBAG Weight-Based Service)

| Item | Description |
|------|-------------|
| `requiresWeightInput` | Flag for services requiring weight input |
| `weightValue` | Weight entered by user (kg) |
| `bookingInstructions` | Weight info to pass to OfferPrice/OrderCreate |

**BookingInstructions Generation Logic**:
```typescript
if (service.requiresWeightInput && weightValue && service.bookingInstructions) {
 const method = service.bookingInstructions.method || '';
 const textValue = method
 .replace('\\s?', '')
 .replace('%WVAL%', weightValue.toString());
 // e.g.: "TTL\\s?%WVAL%KG" → "TTL10KG"

 bookingInstructions = {
 text: [textValue], // ["TTL10KG"]
 ositext: [method], // ["TTL\\s?%WVAL%KG"]
 };
}
```

### OrderCreate Service Handling

```typescript
// When services selected: use serviceOfferData (highest priority)
if (selectedServices.length > 0 && serviceOfferData) {
 orders = [{
 responseId: serviceOfferData.responseId,
 offerId: serviceOfferData.offerId,
 owner: serviceOfferData.owner,
 offerItems: serviceOfferData.offerItems, // Itinerary + service merged
 }];
}
```

### ServiceSelector Component

Required components:
- `components/service/ServiceSelector.tsx` - Per-passenger service selection UI
- `components/service/ServiceCard.tsx` - Individual service card
- `components/service/index.ts` - barrel export

Templates:
- `templates/components/service/ServiceSelector.tsx.template`
- `templates/components/service/ServiceCard.tsx.template`
- `templates/components/service/index.ts.template`
