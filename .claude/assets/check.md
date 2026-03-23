# Frontend-Whitelabel Agent Development Readiness Check

## Overview

This document analyzes the current status and gaps in the required materials needed to start development of the `frontend-whitelabel` agent.

**Analysis targets:**
1. `polarhub-api-swagger.json` - API specification
2. `ui-component-guide/` - UI component guide
3. `frontend-whitelabel.md` - Agent system prompt

---

## 1. API Specification (polarhub-api-swagger.json) Analysis

### Well-Defined Items

| Item | Status | Remarks |
|------|:----:|------|
| Endpoint list | O | 10 APIs defined |
| Request DTO schema | O | All request schemas defined in detail |
| HTTP Method | O | All POST methods |
| Workflow description | O | PRE-BOOKING, POST-BOOKING flow described |
| TransactionID guide | O | Created by FE, reused within the same flow |

### Missing Items (Critical)

| Item | Current Status | Required Information | Priority |
|------|----------|------------|:--------:|
| **Response schema** | "returns raw PolarHub response" | Detailed response structure definition for frontend parsing | P0 |
| **API Base URL** | servers: [] (empty) | URLs per environment (development/staging/production) | P0 |
| **Error response schema** | Only HTTP status codes defined | Error codes, message format, retry eligibility | P0 |
| **Authentication method** | Undefined | Authentication header format: JWT, API Key, session, etc. | P0 |
| **Rate Limiting** | Undefined | API call limits, throttling policy | P1 |
| **Timeout policy** | Undefined | Recommended timeout value per API | P1 |

### APIs Requiring Response Schema Definition

```
1. /middleware/polarhub/air-shopping
 - Flight list data structure
 - Offer, OfferItem, Flight, Segment relationships
 - Price information (Base, Tax, Total)
 - Baggage, cabin class information

2. /middleware/polarhub/offer-price
 - Recalculated price information
 - Price difference comparison data

3. /middleware/polarhub/seat-availability
 - Seat map structure (Row, Column, Position)
 - Per-seat price, characteristics (Window, Aisle, ExtraLegroom)
 - Availability status

4. /middleware/polarhub/service-list
 - Ancillary service list (baggage, in-flight meals, lounge)
 - Per-service price and restriction conditions
```

---

## 2. UI Component Guide Analysis

### Well-Defined Items

| Category | Document | Status | Remarks |
|----------|------|:----:|------|
| System architecture | system-architecture.md | O | Full flow defined |
| Search screen | air-shopping.md | O | Search conditions, results, flight card details |
| Fare confirmation | offer-price.md | O | Price difference popup, post-ticketing flow |
| Booking details | booking-detail.md | O | Pre-ticketing/post-ticketing screen details |
| Design system | design-system.md | O | Buttons, colors, layout |
| Common components | common-components.md | O | DatePicker, Select, Button, etc. |
| Seat popup | seat-popup.md | O | Seat map UI |
| Service popup | service-popup.md | O | Ancillary service purchase |
| Per-airline baggage | air-shopping.md | O | Per-airline baggage purchase method details |

### Missing Items

| Item | Current Status | Required Information | Priority |
|------|----------|------------|:--------:|
| **API-UI data mapping** | Partially defined | Response field to UI component mapping table | P0 |
| **Component code examples** | None | Actual React/Next.js implementation code | P1 |
| **State management strategy** | Undefined | State management for search results, selected flights, passenger info | P1 |
| **Loading/error UI** | Undefined | Skeleton, error boundary, retry UI | P1 |
| **Responsive design** | Undefined | Mobile/tablet breakpoints | P2 |
| **Accessibility (a11y)** | Undefined | ARIA attributes, keyboard navigation | P2 |

---

## 3. Agent Document (frontend-whitelabel.md) Analysis

### Well-Defined Items

| Item | Status | Remarks |
|------|:----:|------|
| Header implementation checklist | O | Row structure, logo, search bar, menu |
| Search result page checklist | O | Layout, sorting, filters, banners |
| Filter component checklist | O | Categories, lowest price display |
| Flight card checklist | O | All information display items |
| TSX code examples | O | Header, ResultsPage, FilterComponent |
| Common mistakes list | O | 10 precautions |

### Missing Items (Critical)

| Item | Current Status | Required Information | Priority |
|------|----------|------------|:--------:|
| **API integration guide** | None | API call methods, data fetching strategy | P0 |
| **API error handling** | None | UI handling methods per error type | P0 |
| **Booking flow guide** | None | Full flow: search -> select -> payment -> confirmation | P0 |
| **Tenant config file structure** | References exist | Actual schema for design-system.json, header.json | P0 |
| **State management pattern** | None | Context, Store structure guide | P1 |
| **Loading state handling** | None | Skeleton, spinner application guide | P1 |
| **Form validation** | None | Passenger info, payment info validation rules | P1 |
| **Payment screen guide** | None | Payment method, payment info input UI | P0 |
| **Booking details screen guide** | None | Pre-ticketing/post-ticketing screen implementation guide | P1 |
| **Mobile support** | None | Responsive implementation guide | P2 |

---

## 4. Tenant Config File Schema (Required)

The schema for tenant config files referenced in the agent document is not defined.

### Required Schema Definitions

```
tenant/{tenant_id}/
├── design-system.json # Schema required
├── components/
│ ├── header.json # Schema required
│ ├── footer.json # Schema required
│ └── filters.json # Schema required
└── pages/
 └── results.json # Schema required
```

### Expected design-system.json Schema (Definition Required)

```json
{
 "colors": {
 "primary": "string",
 "secondary": "string",
 "text": { "primary": "string", "secondary": "string" },
 "border": { "light": "string", "dark": "string" },
 "background": { "primary": "string", "secondary": "string" }
 },
 "typography": {
 "fontFamily": "string",
 "fontSize": { "xs": "string", "sm": "string", ... }
 },
 "spacing": { "xs": "string", "sm": "string", ... },
 "borderRadius": { "sm": "string", "md": "string", ... },
 "shadows": { ... }
}
```

### Expected header.json Schema (Definition Required)

```json
{
 "structure": "1row | 2row | 3row",
 "rows": [
 {
 "height": "number",
 "background": "string",
 "items": ["logo", "search", "navigation", "utility"]
 }
 ],
 "logo": {
 "src": "string",
 "width": "number",
 "height": "number"
 },
 "searchBar": {
 "enabled": "boolean",
 "placeholder": "string",
 "width": "string"
 },
 "navigation": {
 "items": [
 { "label": "string", "href": "string", "badge": "string | null" }
 ]
 }
}
```

---

## 5. API-UI Data Mapping (Required)

### AirShopping Response -> Flight Card

| UI Element | API Response Path | Example Value |
|---------|------------------|---------|
| Airline logo | ??? | - |
| Airline name | ??? | - |
| Flight number | ??? | "SQ608" |
| Departure time | ??? | "09:30" |
| Departure airport | ??? | "ICN" |
| Arrival time | ??? | "15:00" |
| Arrival airport | ??? | "SIN" |
| Flight duration | ??? | "6h 30m" |
| Transfer info | ??? | "Nonstop" / "1 stop" |
| Cabin class | ??? | "Economy" |
| Fare type | ??? | "Economy Flex" |
| Baggage | ??? | "23KG" |
| Total fare | ??? | "1,234,500 KRW" |

**Response schema must be defined before mapping is possible**

---

## 6. Required Tasks by Priority

### P0 - Immediately Required (Before Development Start)

1. **API Response Schema Definition**
 - Detailed definition of all API response structures
 - Especially AirShopping, SeatAvailability, ServiceList

2. **API Base URL and Authentication Information**
 - API endpoints per environment
 - Authentication header format (Authorization, API-Key, etc.)

3. **Error Response Schema**
 - Error code list
 - Error message format
 - Retry eligibility

4. **Tenant Config File Schema**
 - design-system.json
 - header.json, footer.json
 - results.json

5. **Payment Screen Guide Addition**
 - Passenger information input form
 - Payment method selection
 - Payment confirmation and processing

### P1 - Required in Early Development

1. **API-UI data mapping table**
2. **State management strategy guide**
3. **Loading/error UI guide**
4. **Form validation rules**
5. **Booking details screen guide**

### P2 - Required During Development

1. **Responsive design guide**
2. **Accessibility (a11y) guide**
3. **Performance optimization guide**
4. **Testing strategy**

---

## 7. Recommended Actions

### Immediate Actions

1. **Obtain PolarHub API Response Documentation**
 - Actual API call examples and response samples required
 - Add response schema to swagger.json

2. **Create Tenant Config File Examples**
 - At least 1 tenant with a complete config file set
 - Actual examples that agents can reference

3. **Add API Integration Guide (frontend-whitelabel.md)**
 ```markdown
 ## API Integration Guide

 ### Data Fetching Pattern
 - TransactionID creation and management
 - API call sequence (AirShopping -> OfferPrice -> OrderCreate)
 - Error handling patterns

 ### State Management
 - Search result caching
 - Selected Offer management
 - Passenger information management
 ```

4. **Add Payment Flow Guide**
 - Immediate payment (WF_PB_IMMEDIATE) flow
 - Deferred payment (WF_PB_DEFERRED) flow
 - Processing per payment method

---

## 8. Summary

| Category | Readiness Status | Development Start Feasibility |
|----------|:---------:|:------------------:|
| API specification | 60% | Partially possible (Response schema required) |
| UI guide | 80% | Mostly possible |
| Agent document | 50% | API integration/payment flow addition required |
| **Overall** | **63%** | **Possible after P0 items are addressed** |

**Conclusion:** In the current state, UI component development is possible, but the Response schema and tenant config file schema are essential for API integration and full flow implementation.

---

## Update History

| Date | Content |
|------|------|
| 2026-01-16 | Initial composition |
