# Middleware Client Template

> **Important**: Communicates with the FE Middleware Backend and does not call the PolarHub API directly.
> **Warning: Spec compliance**: All Request DTOs must conform to the spec in `.claude/assets/whitelabel-middleware.openapi.yaml`.
> **Related Template**: `.claude/skills/whitelabel-dev/templates/lib/middleware-client.ts.template`

## Architecture

```
[Browser (Vite + React SPA)]                    [Middleware Backend]
 │                                                │
 │ polarhub-service.ts                            │
 │   → middleware-client.ts                       │
 │       POST /middleware/polarhub/air-shopping    │
 ├───────────────────────────────────────────────>│
 │                                                │ → PolarHub API
 │<───────────────────────────────────────────────┤
 │   AirShoppingRS (Raw)                          │
 │                                                │
 │   transformOffersToFlights()                   │
 │   Flight[] (UI)                                │
```

### Core Points

1. **Browser → Middleware**: `polarhub-service.ts` calls `middleware-client.ts` which sends requests directly to the Middleware Backend (browser-compatible, no server-side proxy needed)
2. **Response Conversion**: Service layer uses the offer transformer to convert to UI data
3. **Environment variable**: `VITE_MIDDLEWARE_URL` (Vite env var with `VITE_` prefix, accessed via `import.meta.env`)

---

## File Location

```
src/lib/api/
├── polarhub-service.ts  # Service layer (orchestrates API calls + transforms)
├── middleware-client.ts # Low-level Middleware HTTP client (browser-compatible)
└── offer-transformer.ts # API Response → UI Conversion
```

---

## middleware-client.ts

```typescript
/**
 * Middleware Backend API Client
 *
 * Browser (SPA) → Middleware Backend → PolarHub
 *
 * This client is browser-compatible and called from polarhub-service.ts.
 * In the Vite + React SPA architecture, there are no API routes.
 */

// Middleware Backend URL (Vite environment variable)
const MIDDLEWARE_BASE_URL = import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:3000';

/**
 * Generate 32-char hex transaction ID
 * Used for session tracking with the PolarHub API via transactionId.
 */
export function generateTransactionId(): string {
 return Array.from({ length: 32 }, () =>
 Math.floor(Math.random() * 16).toString(16)
 ).join('');
}

// ============================================================
// Request DTOs
// ============================================================

export interface AirShoppingRequest {
 transactionId: string;
 originDestList: Array<{
 origin: string;
 destination: string;
 departureDate: string;
 }>;
 passengers: Array<{
 type: 'ADT' | 'CHD' | 'INF';
 count: number;
 }>;
 cabin?: 'Y' | 'W' | 'C' | 'F';
 pointOfSale?: string;
 criteria?: {
 direct?: boolean;
 airlinePreference?: {
 airlineId?: string[];
 };
 };
}

export interface OfferPriceRequest {
 transactionId: string;
 offers: Array<{
 responseId: string;
 offerId: string;
 owner: string;
 offerItems: Array<{
 offerItemId: string;
 paxRefId: string[];
 // ⭐ Seat selection (WF_PB_SEAT, WF_PB_SEAT_REPRICE)
 seatSelection?: {
 column: string;
 row: string;
 };
 // ⭐ Weight-based service (XBAG, etc.) BookingInstructions
 // Substitutes weight value into the Method pattern to produce the text
 // Example: Method "TTL\\s?%WVAL%KG" + 10kg → Text ["TTL10KG"]
 // ⚠️ Middleware spec: ositext (lowercase t)
 bookingInstructions?: {
 text: string[]; // Includes weight input value (e.g., ["TTL10KG"])
 ositext?: string[]; // Original method pattern (e.g., ["TTL\\s?%WVAL%KG"])
 };
 }>;
 }>;
 paxList: Array<{
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 }>;
 // ⭐ Post-booking OfferPrice: ExistingOrderCriteria required for seat/service reprice (AF, KL, etc.)
 criteria?: {
 existingOrderCriteria?: {
 orderId: string;
 paxRefId: string[];
 };
 };
}

export interface OrderRetrieveRequest {
 transactionId: string;
 orderId: string;
 owner: string;
}

/**
 * ⭐ OrderCreate Request DTO (OrderCreateRequestDto)
 *
 * ⚠️ Important: Structure conforming to the OpenAPI spec
 * - responseId, offerId, owner must be inside the orders[] array, not at the top level!
 * - Use paxList, not passengers
 * - Use paymentList array, not payment
 */
export interface OrderCreateRequest {
 transactionId: string;

 // ⭐ orders array - Wrap offer information in an array (OrderSelectionDto)
 orders: Array<{
 responseId: string;
 offerId: string;
 owner: string;
 offerItems: Array<{
 offerItemId: string;
 paxRefId: string[];
 }>;
 }>;

 // Passenger List (PaxDetailDto)
 paxList: Array<{
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 individual: {
 surname: string;
 givenName: string[];
 birthdate?: string;
 gender?: 'MALE' | 'FEMALE'; // ⭐ gender is inside individual! (IndividualDto)
 };
 identityDoc?: Array<{
 identityDocType: 'PT' | 'NI' | 'DL';
 identityDocId: string;
 expiryDate?: string;
 issuingCountryCode?: string;
 citizenshipCountryCode?: string;
 }>;
 citizenshipCountryCode?: string;
 residenceCountryCode?: string;
 contactInfoRefId?: string[];
 }>;

 // Contact List (ContactInfoDto)
 // ⚠️ phone.label is required! ('Mobile') - Some carriers return 500 error when missing
 contactInfoList?: Array<{
 contactInfoId: string;
 phone?: { label?: string; countryDialingCode?: string; phoneNumber: string };
 emailAddress?: string;
 }>;

 // Payment information (PaymentDto)
 // - Empty array = Hold (booking only)
 // - cash = Cash immediate ticketing
 // - card = Card immediate ticketing
 paymentList?: Array<{
 paymentMethod: {
 cash?: {
 cashPaymentInd: boolean; // ⭐ Cash payment (set to true)
 };
 card?: {
 cardCode: 'VI' | 'MC' | 'AX' | 'JC' | string;
 cardNumber: string;
 cardHolderName: string;
 expiration: string;
 seriesCode?: string;
 };
 };
 amount: { currencyCode: string; amount: number };
 }>;
}

// ============================================================
// API Functions
// ============================================================

/**
 * AirShopping API - Flight search
 */
export async function airShopping<T>(request: AirShoppingRequest): Promise<T> {
 return callMiddlewareAPI<T>('/middleware/polarhub/air-shopping', request);
}

/**
 * OfferPrice API - Fare Detail Retrieval
 */
export async function offerPrice<T>(request: OfferPriceRequest): Promise<T> {
 return callMiddlewareAPI<T>('/middleware/polarhub/offer-price', request);
}

/**
 * OrderRetrieve API - Booking detail retrieval
 */
export async function orderRetrieve<T>(request: OrderRetrieveRequest): Promise<T> {
 return callMiddlewareAPI<T>('/middleware/polarhub/order/retrieve', request);
}

/**
 * OrderCreate API - Booking creation ⭐ Required
 * ⚠️ Caution: Endpoint is /order, not /order/create!
 */
export async function orderCreate<T>(request: OrderCreateRequest): Promise<T> {
 return callMiddlewareAPI<T>('/middleware/polarhub/order', request); // ⚠️ Not /order/create!
}

// ============================================================
// Internal Helper
// ============================================================

async function callMiddlewareAPI<T>(endpoint: string, body: unknown): Promise<T> {
 const url = `${MIDDLEWARE_BASE_URL}${endpoint}`;

 // Dev-only logging (stripped in production builds)
 if (import.meta.env.DEV) {
 console.log(`[Middleware Client] ${endpoint} Request:`, JSON.stringify(body, null, 2));
 }

 const response = await fetch(url, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(body),
 });

 if (!response.ok) {
 const errorText = await response.text();
 console.error(`[Middleware Client] ${endpoint} HTTP Error:`, response.status, errorText);
 throw new Error(`Middleware API error: ${response.status} - ${errorText}`);
 }

 const data = await response.json();

 // Dev-only response logging (truncated)
 if (import.meta.env.DEV) {
 const responseStr = JSON.stringify(data);
 console.log(`[Middleware Client] ${endpoint} Response:`,
 responseStr.length > 2000
 ? responseStr.substring(0, 2000) + `... (${responseStr.length} chars)`
 : responseStr
 );
 }

 return data as T;
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Cabin class mapping (UI → API)
 */
export function mapCabinClass(cabinClass: string): 'Y' | 'W' | 'C' | 'F' {
 switch (cabinClass) {
 case 'economy': return 'Y';
 case 'premium': return 'W';
 case 'business': return 'C';
 case 'first': return 'F';
 default: return 'Y';
 }
}
```

---

## Environment Variable Configuration

### .env (or .env.example)

```bash
# Middleware Backend URL (Vite requires VITE_ prefix for client-side access)
VITE_MIDDLEWARE_URL=http://localhost:3000

# Production environment
# VITE_MIDDLEWARE_URL=https://middleware.your-domain.com
```

---

## API Endpoint List

| API | Endpoint | Purpose |
|-----|----------|------|
| AirShopping | `POST /middleware/polarhub/air-shopping` | Flight search |
| OfferPrice | `POST /middleware/polarhub/offer-price` | Fare detail / recalculation |
| **OrderCreate** | `POST /middleware/polarhub/order` | Booking creation (**⚠️ Not /order/create!**) |
| OrderRetrieve | `POST /middleware/polarhub/order/retrieve` | Booking detail retrieval |
| SeatAvailability | `POST /middleware/polarhub/seat-availability` | Seat map retrieval |
| ServiceList | `POST /middleware/polarhub/service-list` | Ancillary service list |
| OrderReshop | `POST /middleware/polarhub/order/reshop` | Journey change / refund quote |
| OrderChange | `POST /middleware/polarhub/order/change` | Booking change |
| OrderCancel | `POST /middleware/polarhub/order/cancel` | Booking cancellation |

> **Reference**: Full spec available at `.claude/assets/whitelabel-middleware.openapi.yaml` or `/spec/middleware-openapi.json`

---

## Post-Booking OfferPrice: ExistingOrderCriteria

When calling OfferPrice for **post-booking** seat or service reprice (AF, KL, etc.), the `criteria.existingOrderCriteria` field is required.

This field tells the middleware which existing order and passengers the reprice applies to.

```typescript
const priceRequest: OfferPriceRequest = {
 transactionId,
 offers: [{ ... }],
 paxList: paxListForRequest,
 // ⭐ Required for post-booking seat/service reprice (AF, KL, etc.)
 criteria: {
 existingOrderCriteria: {
 orderId,              // The existing booking orderId
 paxRefId: paxListForRequest.map(p => p.paxId), // ALL booking passengers
 },
 },
};
```

**Key points:**
- `paxRefId` must include **all** booking passengers, not just the ones selecting seats/services
- Use `bookingPaxList` (passed from the FE with actual PTC values) when available
- Fallback to selected seat/service passenger IDs with `'ADT'` as default PTC
- This field is only needed for post-booking (held/ticketed) OfferPrice calls, not pre-booking

---

## Precautions

1. **Browser-compatible**: middleware-client runs in the browser and is called from `polarhub-service.ts` (no API routes)
2. **Environment variable**: Use `VITE_MIDDLEWARE_URL` (Vite requires `VITE_` prefix for client-side env vars, accessed via `import.meta.env`)
3. **Dev logging**: Wrap `console.log` calls in `import.meta.env.DEV` to avoid logging in production
4. **TransactionID**: Reuse the same ID within the same session (Pre-Booking → Post-Booking)
5. **Error handling**: ResultMessage.Code `"00000"` or `"0"` or `"SUCCESS"` indicates success

---

## Reference

- **Template**: `.claude/skills/whitelabel-dev/templates/lib/middleware-client.ts.template`
- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml`
- **Offer Transformer**: `.claude/skills/whitelabel-dev/references/api-client/offer-transformer.md`
