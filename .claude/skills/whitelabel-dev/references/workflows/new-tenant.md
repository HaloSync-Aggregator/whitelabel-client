# New Tenant Workflow

new Tenant website All/Total Create Detail Guide.

---

## ⭐ Required Reference documents (Assets)

| Category | Path | Purpose |
|----------|------|------|
| **Middleware API Spec** | `.claude/assets/whitelabel-middleware.openapi.yaml` | API Endpoint, Request DTO Definition |
| **API-UI Mapping** | `.claude/assets/plan/api-ui-mapping/mappings/` | Response → UI Conversion logic |
| **UI Field definitions** | `.claude/assets/plan/api-ui-mapping/mappings/ui-fields/` | Component Props Interface |
| **Workflow** | `.claude/assets/carrier-support-matrix.yaml` | API Call Order, Per carrier Support Feature |
| **Response Sample** | `.claude/assets/plan/api-ui-mapping/response-sample/` | Actual API Response (Per carrier) |
| **UI Guide** | `.claude/assets/ui-component-guide/` | Luna B2C UI Note |

---

## All/Total process

```
1. Tenant Configuration Confirm/Create
 ↓
2. Vite + React SPA Project Scaffolding
 ↓
3. Design system Applied
 ↓
4. Service Layer Verification (polarhub-service.ts) ← NEW
 ↓
5. Common components Implementation
 ↓
6. per Page Implementation
 ↓
7. Verify
```

---

## 1. Tenant Configuration Confirm

### Required File

```
tenant/{tenant_id}/
├── design-system.json # Color, font, spacing
├── components/
│ ├── header.json # Header Structure
│ └── filters.json # Filter Configuration
└── pages/
 └── results.json # Result Page Layout
```

### design-system.json Schema

```json
{
 "colors": {
 "primary": "#ColorCode",
 "secondary": "#ColorCode",
 "text": {
 "primary": "#ColorCode",
 "secondary": "#ColorCode",
 "tertiary": "#ColorCode"
 },
 "border": {
 "light": "#ColorCode",
 "dark": "#ColorCode"
 },
 "background": {
 "primary": "#ColorCode",
 "secondary": "#ColorCode"
 }
 },
 "typography": {
 "fontFamily": "fontperson",
 "fontSize": {
 "xs": "12px",
 "sm": "14px",
 "base": "16px",
 "lg": "18px",
 "xl": "20px"
 }
 },
 "spacing": {
 "xs": "4px",
 "sm": "8px",
 "md": "16px",
 "lg": "24px",
 "xl": "32px"
 }
}
```

### header.json Schema

```json
{
 "structure": "2row",
 "rows": [
 {
 "height": 40,
 "background": "#ffffff",
 "items": ["utility-menu"]
 },
 {
 "height": 60,
 "background": "#ffffff",
 "items": ["logo", "search", "navigation", "right-menu"]
 }
 ],
 "logo": {
 "src": "logo-primary.png",
 "width": 100,
 "height": 32
 },
 "searchBar": {
 "enabled": true,
 "placeholder": "Where are you going?",
 "width": "280px"
 },
 "promotionBadge": {
 "enabled": true,
 "text": "APP Cancellation fee 0KRW",
 "backgroundColor": "#primary",
 "textColor": "#ffffff"
 },
 "navigation": {
 "items": [
 { "label": "Aviation", "href": "/flights", "active": true },
 { "label": "Accommodation", "href": "/hotels" },
 { "label": "Tours & Tickets", "href": "/tours" },
 { "label": "Direct Fare", "href": "/direct", "badge": "Luxury" }
 ]
 }
}
```

---

## 2. Vite + React SPA Project Scaffolding

### Directory structure

```
apps/{tenant_id}/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── index.html                     # Vite entry HTML
├── public/
│ └── assets/
│ ├── logo/
│ ├── airlines/
│ └── banners/
├── src/
│ ├── main.tsx                     # React entry point
│ ├── App.tsx                      # Root component + react-router-dom routes
│ ├── pages/
│ │ ├── HomePage.tsx
│ │ ├── FlightsPage.tsx
│ │ └── BookingPage.tsx
│ ├── components/
│ │ ├── common/
│ │ │ ├── Header.tsx
│ │ │ ├── Footer.tsx
│ │ │ └── Button.tsx
│ │ ├── search/
│ │ │ ├── SearchForm.tsx
│ │ │ ├── FlightCard.tsx
│ │ │ └── FilterPanel.tsx
│ │ └── booking/
│ │ ├── BookingDetail.tsx
│ │ ├── PassengerList.tsx
│ │ └── ItineraryList.tsx
│ ├── hooks/
│ │ ├── useFlightSearch.ts
│ │ └── useBooking.ts
│ ├── lib/
│ │ ├── api/
│ │ │ ├── polarhub-service.ts  # Service layer (Browser → Middleware)
│ │ │ ├── middleware-client.ts  # Low-level HTTP client
│ │ │ └── offer-transformer.ts # API → UI Conversion
│ │ └── utils/
│ │ └── formatters.ts
│ └── styles/
│ └── globals.css
└── tenant.config.ts
```

---

## 3. Design system Applied

### tailwind.config.js Create

```javascript
// design-system.from json Value using Extract Applied
module.exports = {
 theme: {
 extend: {
 colors: {
 primary: 'var(--color-primary)',
 secondary: 'var(--color-secondary)',
 // ...
 },
 fontFamily: {
 sans: ['var(--font-family)', 'sans-serif'],
 },
 },
 },
}
```

### CSS variable Configuration

```css
/* globals.css */
:root {
 --color-primary: #ColorCode;
 --color-secondary: #ColorCode;
 --font-family: 'fontperson';
 /* ... */
}
```

---

## 4. Common components Implementation

### Implementation Order

1. **Header** - header.json based
2. **Footer** - footer.json based
3. **Button** - design-system.json based
4. **Input** - design-system.json based
5. **Modal** - Common Popup

### Header Implementation Checklist

```
□ row Structure (1-row/2-row/3-row)
□ each row Height
□ Logo Image
□ SearchBar (exists Case)
□ Promotion Badge (exists Case)
□ menu Item
□ Special Badge (Luxury, NEW, etc.)
□ activationproperty menu Style
□ Right side menu
□ Distinction
```

---

## 5. per Page Implementation

### Search results Page

**Implementation Component:**
- SearchForm
- SortOptions
- FilterPanel
- FlightCard
- PromoBanner (exists Case)

**Layout Confirm:**
- 2Column vs 3Column
- Column width

### Booking detail Page

**Implementation Component:**
- BookingHeader
- PassengerList
- ItineraryList
- PaymentInfo
- SSRInfo
- TicketInfo (After ticketing)

---

## 6. API Integration

> **Reference documents**:
> - API Spec: `.claude/assets/whitelabel-middleware.openapi.yaml`
> - API-UI Mapping: `.claude/assets/plan/api-ui-mapping/mappings/booking/`
> - Client Template: `.claude/skills/whitelabel-dev/references/api-client/`

### Architecture

```
[Browser] → [polarhub-service.ts] → [Middleware Backend] → [PolarHub]
 ↑
 middleware-client.ts (HTTP client)
```

**Core**: FE calls `polarhub-service.ts` functions directly from React components/hooks. No API routes needed. The service layer communicates with the Middleware Backend. PolarHub API is never called directly.

### Environment Variable Configuration

```bash
# .env (Vite environment variables must use VITE_ prefix)
VITE_MIDDLEWARE_URL=http://localhost:3000
```

### Service Layer Usage Example

```typescript
// src/lib/api/polarhub-service.ts — called directly from components/hooks
import { airShopping } from './middleware-client';

export async function searchFlights(params: SearchParams): Promise<Flight[]> {
 const request = buildAirShoppingRequest(params);

 // Middleware Call (Response Conversion logic air-shopping.md Reference)
 const response = await airShopping(request);

 return transformOffersToFlights(response);
}
```

### Required Files

| File | Purpose | Reference |
|------|------|------|
| `polarhub-service.ts` | Service layer (orchestrates API calls + transforms) | N/A |
| `middleware-client.ts` | Low-level Middleware HTTP client | `references/api-client/middleware-client.md` |

### API Response → UI Conversion

Response Conversion logic `.claude/assets/plan/api-ui-mapping/mappings/booking/` Document Reference:

| API | Mapping document | UI Component |
|-----|----------|-------------|
| AirShopping | `air-shopping.md` | FlightCard, FilterPanel |
| OfferPrice | `offer-price.md` | PriceBreakdown, FareRule |
| OrderRetrieve | `order-retrieve.md` | BookingDetail |

### _raw Field (Important!)

FlightCard when Select `_raw` Field Subsequent API in Call Use:

```typescript
// FlightCard Select → OfferPrice when Call (via polarhub-service.ts)
import { priceOffer } from '@/lib/api/polarhub-service';

const result = await priceOffer({
 transactionId: savedTransactionId,
 offer: {
 responseId: flight._raw?.responseId,
 offerId: flight._raw?.offerId,
 owner: flight._raw?.owner,
 offerItems: flight._raw?.offerItems,
 },
});
```

 Data **OfferPrice, OrderCreate** etc. Subsequent API in Call Required.

---

## 7. Verify

### Checklist

```
□ Header Structure Match
□ SearchBar/Promotion Badge Include
□ Result Page Layout Match
□ Filter Category completelyproperty
□ FlightCard Information completelyproperty
□ Booking detail Information completelyproperty
□ Responsive-type Handling (exists Case)
□ API Integration Normal 작동
```
