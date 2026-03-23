# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-tenant whitelabel flight booking **frontend** generation platform. Leverages Claude Code's multi-agent architecture to automatically generate tenant-specific Vite + React SPA websites.

> The backend (PolarHub NDC API) is maintained as a separate project and shared across tenants.

## Development Commands

Run from the tenant app directory:

```bash
cd apps/{tenant-id}

npm install # Install dependencies
npm run dev # Vite dev server (http://localhost:5173)
npm run build # Vite production build (dist/)
npm run preview # Preview production build
npm run lint # Run ESLint
npx tsc --noEmit # Type check
```

Load environment variables: `source scripts/env.sh`

## Architecture

### Agent Workflow (3 Stages)

```
[New Tenant Site]
design-analyzer → design-system-setup → component-builder → app-builder

[Specific Page] → app-builder
[Component Work] → component-builder
[Style Update] → design-system-setup
```

| Agent | Model | Role | Output |
|-------|-------|------|--------|
| `design-system-setup` | haiku | Design tokens + tenant config → Tailwind/CSS/tenant.ts conversion | `tailwind.config.ts`, `globals.css`, `tenant.ts` |
| `component-builder` | sonnet | Reusable component implementation (feature-based conditional rendering) | `components/` |
| `app-builder` | sonnet | Per-page implementation (feature-based page creation/guards) | `app/` |

Supporting: `design-analyzer` (site analysis)

### Key Skills

- `/whitelabel-dev` - Main development skill, 3-stage sub-agent orchestration
- `/tenant-config` - Tenant configuration file generation

### Directory Structure

```
apps/{tenant-id}/                  # Generated Vite + React SPA project
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite build configuration
├── nginx.conf                     # SPA routing (production)
├── Dockerfile                     # 2-stage build (node → nginx)
└── src/
 ├── main.tsx                      # React entry (BrowserRouter)
 ├── App.tsx                       # Route definitions (5 routes)
 ├── app/                          # Page components
 ├── components/                   # UI components
 ├── lib/api/                      # Service layer + transformers
 │   ├── polarhub-service.ts       # 23 service functions (replaces API routes)
 │   ├── order-retrieve-transformer.ts
 │   ├── pax-change-service.ts
 │   └── middleware-client.ts      # Middleware HTTP client
 └── types/                        # TypeScript type definitions

tenant/{tenant-id}.yaml            # Tenant contract/sample settings
tenant/{tenant-id}/                # Tenant design tokens
└── design-system.json

.claude/
├── agents/                        # Sub-agent definitions
├── skills/                        # Skill definitions (whitelabel-dev, tenant-config)
└── assets/
 ├── whitelabel-middleware.openapi.yaml # API spec
 ├── plan/api-ui-mapping/          # API-UI mapping assets
 └── ui-component-guide/           # UI reference
```

## API Integration

OpenAPI spec: `.claude/assets/whitelabel-middleware.openapi.yaml`

| Feature | Endpoint |
|---------|----------|
| Flight Search | POST /middleware/polarhub/air-shopping |
| Offer Price Check | POST /middleware/polarhub/offer-price |
| Create Booking | POST /middleware/polarhub/order |
| Retrieve Booking | POST /middleware/polarhub/order/retrieve |
| Seat Availability | POST /middleware/polarhub/seat-availability |
| Service List | POST /middleware/polarhub/service-list |

API-UI mapping docs: `.claude/skills/whitelabel-dev/references/api-mapping/`

### Carrier-Specific Service Purchase API Branching

| Group | Carriers | Quote API | Flow | Notes |
|-------|----------|-----------|------|-------|
| A | EK, LH | OfferPrice | Quote → Confirm | Post-ticketing only |
| B | AY, SQ | OrderQuote | Quote → Confirm | Both Hold/Ticketed |
| C | AF, KL | OfferPrice | Quote → Add → Confirm | 2-step OrderChange |
| D | HA | OrderQuote | Quote → Confirm | Post-ticketing only |

**BookingInstructions field** (KG/PC unit services):
```typescript
// Weight input required when ServiceList Method contains %WVAL%
bookingInstructions: {
 text: ["TTL20KG"], // Actual value
 ositext: ["TTL\\s?%WVAL%KG"] // Pattern
}
```

Type definitions: `src/types/service-purchase.ts`

## Code Style

### TypeScript
- `strict: true` required, `any` prohibited → use `unknown` with type narrowing
- Explicit Props interface for all components

### React (Vite SPA)
- All components are client-side (no 'use client' directive needed)
- React Router: `useNavigate`, `useParams`, `useSearchParams`, `Link` from `react-router-dom`
- Service layer: Import functions from `@/lib/api/polarhub-service` (no fetch/apiUrl)

### Styling
- Reference design tokens from `design-system.json`
- Class merging: use `cn()` utility
- Mobile-first responsive (`sm:`, `md:`, `lg:`)

- ⚠️ **Button colors**: Use `bg-red-500` for delete/error, custom colors (`bg-error`) prohibited

### Naming
- Components: PascalCase (`FlightCard.tsx`)
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

## Agent Guidelines

- **One at a time**: app-builder implements only one page per invocation
- **API mapping reference required**: Check the relevant mapping doc before implementing a page
- **Preserve Header structure**: If the original has 2 rows, keep 2 rows — no simplification
- **No missing required elements**: Search bar, promotion badges, airline lowest prices, etc.
- Run `npm run lint` and `npx tsc --noEmit` after implementation

#### ⛔ CRITICAL: Use tenant.ts config values (No placeholders!)

**Always import config values from tenant.ts for API requests.**
Using placeholders (`{{POINT_OF_SALE}}`, etc.) directly will not be substituted and will cause API errors.

```typescript
// ✅ Correct pattern - import from tenant.ts
import { POINT_OF_SALE, AGENCY_ID, TENANT_ID } from '@/lib/tenant';

const request = {
 pointOfSale: POINT_OF_SALE, // ← 'KR' (from tenant.ts)
 agencyId: AGENCY_ID,
};

// ❌ Wrong pattern - direct placeholder usage (not substituted!)
pointOfSale: '{{POINT_OF_SALE}}', // Sends literal '{{POINT_OF_SALE}}' string to API!
```

Required tenant.ts exports: `POINT_OF_SALE`, `AGENCY_ID`, `SITE_CODE`, `AGENCY_NAME`

#### ⚠️ CRITICAL: contactInfoList phone.label required! (v3.21.0)

**The phone object in contactInfoList must include the `label` field.**
Omitting it causes OrderCreate 500 errors on some carriers like TK (Turkish Airlines).

```typescript
// ✅ Correct pattern - includes label: 'Mobile'
const contactInfoList = passengers.map((p) => ({
 contactInfoId: `CI_${p.paxId}`,
 phone: {
 label: 'Mobile', // ⚠️ Required!
 countryDialingCode: '82',
 phoneNumber: p.phone,
 },
 emailAddress: p.email,
}));

// ❌ Wrong pattern - missing label (TK etc. 500 error!)
phone: {
 countryDialingCode: '82',
 phoneNumber: p.phone,
 // No label → OrderCreate fails on some carriers!
},
```

### Post-Booking API Required Patterns

#### ⚠️ CRITICAL: OrderChange API request structure (camelCase required!)
- **Do not use Sender, PointOfSale, Query wrappers!**
- **All fields must be camelCase** (PascalCase causes 400 errors)

```typescript
// ❌ Wrong pattern (legacy NDC XML style)
const request = {
 Sender: { TravelAgency: {...} },
 PointOfSale: 'KR',
 TransactionID: txnId, // PascalCase prohibited!
 Query: {
 OrderID: orderId, // PascalCase prohibited!
 ChangeOrderChoice: {...},
 },
};

// ✅ Correct pattern (camelCase, no wrappers)
// ⚠️ transactionId must be reused from OrderRetrieve response! (Do not generate new!)
const request = {
 transactionId: body.transactionId, // ⚠️ Reused from OrderRetrieve response!
 orderId,
 changeOrderChoice: {
 updatePax: [{ currentPaxRefId: paxId }],
 },
 paxList: [...],
 contactInfoList: [...],
 paymentList: [],
};
```

#### API response success code validation
```typescript
// Always use this pattern (codes vary by carrier)
const resultCode = response.ResultMessage?.Code;
const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS' || !resultCode;
```

#### ⚠️ TR carrier payment type branching (v3.14.0)
- TR carrier uses `'Ag'` type for post-booking payments (post-ticketing, service additions, etc.)
- Other carriers use `'AGT'` type

```typescript
// ✅ Correct pattern - TR carrier branching
const agtType = owner === 'TR' ? 'Ag' : 'AGT';
paymentList.push({
 type: agtType as 'AGT' | 'Ag',
 amount: amount.amount,
 curCode: amount.currencyCode,
});

// ❌ Wrong pattern - using 'AGT' for all carriers
type: 'AGT', // TR must use 'Ag'!
```

#### ⚠️ Post-ticketing OrderReshop request structure (Group A: LH, EK, etc.)
- `updateOrder` must include `repricedOrderRefId`!
- Sending an empty object causes 400 errors

```typescript
// ✅ Correct pattern - includes repricedOrderRefId
const reshopRequest: OrderReshopRequest = {
 transactionId,
 orderId,
 actionContext: '8', // Voluntary change
 updateOrder: {
 repricedOrderRefId: orderId, // ⚠️ Required!
 },
};

// ❌ Wrong pattern - empty object
updateOrder: {}, // 400 error!
```

#### ⚠️ Refund quote (OrderReshop) response carrier-specific branching (v3.15.0)
- `DeleteOrderItem` structure differs by carrier
- LH, etc.: `DeleteOrderItem` contains only `OrderItemID` (no amount details)
- QR, etc.: `DeleteOrderItem` contains `OriginalOrderItem`, `ReshopDue`

```typescript
// ✅ Correct pattern - check for detailed amount presence
const hasDetailedAmounts = deleteItems.some(item =>
 item.OriginalOrderItem?.Total?.Amount !== undefined ||
 item.ReshopDue?.Total?.Amount !== undefined
);

if (deleteItems.length > 0 && hasDetailedAmounts) {
 // Case 1: Detailed amounts available (QR, etc.)
 deleteItems.forEach(item => {...});
} else {
 // Case 2: No detailed amounts (LH, SQ, etc.) → use TotalPrice.TotalAmount
 refundAmount = reshopOffer.TotalPrice?.TotalAmount?.Amount || 0;
}

// ❌ Wrong pattern - only checking DeleteOrderItem existence
if (deleteItems.length > 0) {
 // LH has deleteItems but no amounts, so everything becomes 0!
}
```

#### ⚠️ AY/SQ Post-ticketing Two-Step OrderChange (v3.18.0)

| Carrier | Ticket-only post-ticketing | Ticket+service post-ticketing |
|---------|---------------------------|-------------------------------|
| **AY** | Quote → Change → Change(paymentList) | Quote → Change → Change(paymentList) |
| **SQ** | Quote → Change(paymentList) | Quote → Change → Change(paymentList) |

- **AY**: Always Two-Step (regardless of services)
- **SQ**: Two-Step only when services are included (conditional)

**Two-Step Flow**:
1. Step 1: Send only `acceptRepricedOrder` (no paymentList!)
2. Step 2: Send only `paymentList` (no changeOrderChoice!)

```typescript
// ✅ Correct pattern - Two-Step branching
// AY: requiresTwoStepTicketing() → always true
// SQ: requiresConditionalTwoStep() && !skipChangeOrderChoice

const alwaysTwoStep = requiresTwoStepTicketing(carrierCode); // AY only
const conditionalTwoStep = requiresConditionalTwoStep(carrierCode) && !skipChangeOrderChoice; // SQ (only with services)
const needsTwoStepTicketing = alwaysTwoStep || conditionalTwoStep;

if (needsTwoStepTicketing) {
 // Step 1: acceptRepricedOrder only
 // Step 2: paymentList only
}
```

**Related types**:
- `requiresTwoStepTicketing()` - AY (always Two-Step)
- `requiresConditionalTwoStep()` - SQ (conditional Two-Step)
- `CARRIER_GROUPS.TWO_STEP_TICKETING: ['AY']`
- `CARRIER_GROUPS.CONDITIONAL_TWO_STEP: ['SQ']`

#### ⚠️ AF/KL Seat Confirm Step 2 requires acceptRepricedOrder + Cash (v3.26.0)

**Pattern A (AF/KL) vs Pattern B (AY/SQ) Step 2 difference:**
- Pattern A (AF/KL): Step 2 needs `changeOrderChoice.acceptRepricedOrder` + **Cash paymentList** with orderItemId
- Pattern B (AY/SQ): Step 2 needs paymentList only (no changeOrderChoice)
- **⚠️ AF/KL Step 2 MW rejects Card fields** (cardCode, cardNumber, etc.) → must use `Cash` type!
- **seatOrderItemIds must flow**: seat-purchase/confirm → TicketingWithServiceModal state → PaymentPopup → order-change-ticketing

```typescript
// ✅ Correct pattern - AF/KL Pattern A Step 2: Cash type + orderItemIds
const isPatternAStep2 = ['AF', 'KL'].includes(owner) && body.seatOrderItemIds?.length;
if (isPatternAStep2) {
  changeRequest = {
    transactionId, orderId,
    changeOrderChoice: { acceptRepricedOrder: { offerRefId: [orderId] } },
    paymentList: [{
      type: 'Cash',  // ⚠️ Must be Cash! Card fields rejected by MW!
      amount: step2Amount, curCode: step2CurCode,
      orderItemId: body.seatOrderItemIds,  // ⚠️ From seat-purchase/confirm Step 1!
      offerItemId: [], paxRefId: [],
    }],
    paxList: [], contactInfoList: [],
  };
} else {
  // AY/SQ Step 2: paymentList only
  changeRequest = { transactionId, orderId, paymentList };
}

// ❌ Wrong pattern - Card type for AF/KL Step 2
paymentList: [{ type: 'Card', cardCode: 'VI', ... }], // MW 400: cardCode should not exist!

// ❌ Wrong pattern - missing seatOrderItemIds
paymentList: [{ orderItemId: [] }], // MW cannot identify which items to charge!
```

#### ⚠️ AF/KL PaymentList FOP entries cause false isPaid (v3.26.0)

- **AF/KL MW OrderRetrieve returns FOP (Form of Payment) entries in PaymentList**
- These entries have `Amount: 0`, `Status: "395"` — available payment methods, NOT actual payments
- `paymentList.length > 0` alone is NOT sufficient for `isPaid` determination!
- Must filter by `Amount > 0` to detect actual payments

```typescript
// ✅ Correct pattern (v3.26) - filter FOP entries with Amount=0
const hasPaymentList = paymentList.some(p => {
  const amount = typeof p.Amount === 'number' ? p.Amount
    : (p.Amount as { Amount?: number } | undefined)?.Amount ?? 0;
  return amount > 0;
});
const isPaid = hasPaymentList || hasTickets;

// ❌ Wrong pattern - FOP entries (Amount=0) make isPaid=true for HELD bookings!
const hasPaymentList = paymentList.length > 0; // AF/KL: 14 FOP entries → true!
const isPaid = hasPaymentList || hasTickets; // HELD booking treated as CONFIRMED!
```

#### ⚠️ AF/KL seat-purchase/quote must use OfferPrice RS data (v3.25.0)

- **OfferPrice RS returns NEW OfferItemIDs** different from SeatAvailability IDs
- **Must extract `PricedOffer.OfferItem[].OfferItemID`** and return in `quoteData.offerItems`
- **Must use `PricedOffer.TotalPrice.TotalAmount`** for price (not `selectedSeats.reduce()`)
- Without this, OrderChange Step 1 sends wrong OfferItemID → seat not applied → Step 2 payment fails

```typescript
// ✅ Correct pattern - Extract OfferItemID from OfferPrice RS
const pricedOfferItems = response.PricedOffer?.OfferItem || [];
const offerItems = pricedOfferItems.length > 0
  ? pricedOfferItems.map(item => ({
    offerItemId: item.OfferItemID,  // ⭐ NEW ID from OfferPrice RS!
    paxRefId: item.PaxRefID || item.FareDetail?.[0]?.PaxRefID || [],
  }))
  : selectedSeats.map(seat => ({  // Fallback only
    offerItemId: seat.offerItemId,
    paxRefId: [seat.paxId],
  }));

// ✅ Use OfferPrice RS TotalAmount for price
const offerPriceTotal = response.PricedOffer?.TotalPrice?.TotalAmount;
const totalPrice = offerPriceTotal?.Amount ?? selectedSeats.reduce((sum, s) => sum + s.price, 0);

// ❌ Wrong pattern - using SeatAvailability OfferItemID
offerItemId: seat.offerItemId, // This is SeatAvailability's ID, NOT OfferPrice RS!

// ❌ Wrong pattern - computing price from FE selectedSeats
totalPrice: selectedSeats.reduce((sum, s) => sum + s.price, 0), // Wrong amount!
```

#### ⚠️ AF/KL (Pattern A) OrderChange RQ structure differences (v3.25.0)

**Step 1 (1st OrderChange)**:
- AF/KL does NOT include `seatSelection` in OfferItems (already passed in OfferPrice)
- Must include `paxList: []`, `contactInfoList: []`, `paymentList: []` at request level

**Step 2 (2nd OrderChange)**:
- `PaymentList.orderItemId` must contain actual OrderItemIDs from 1st OC response
- Must include `paxList: []`, `contactInfoList: []` at request level

```typescript
// ✅ Correct pattern - Step 1: no seatSelection for AF/KL
const isPatternA = config.pattern === 'A';
const finalOfferItems = isPatternA
  ? offerItemsWithSeatSelection.map(({ seatSelection: _removed, ...rest }) => rest)
  : offerItemsWithSeatSelection;

changeRequest = {
  transactionId, orderId,
  changeOrderChoice: { acceptSelectedQuotedOfferList: { selectedPricedOffer: [{ offerItems: finalOfferItems }] } },
  paxList: [], contactInfoList: [], paymentList: [], // ⚠️ Required!
};

// ✅ Correct pattern - Step 2: use orderItemIds from 1st OC response
changeRequest = {
  transactionId, orderId,
  changeOrderChoice: { acceptRepricedOrder: { offerRefId: [orderId] } },
  paymentList: [{
    type, amount, curCode,
    orderItemId: body.orderItemIds || [], // ⚠️ From 1st OC response!
    offerItemId: [], paxRefId: [],
  }],
  paxList: [], contactInfoList: [], // ⚠️ Required!
};

// ❌ Wrong pattern - includes seatSelection for AF/KL
offerItems: items.map(i => ({ ...i, seatSelection: { column, row } })), // Not needed for Pattern A!

// ❌ Wrong pattern - empty orderItemId in Step 2
orderItemId: [], // MW cannot identify which items to charge!
```

#### ⚠️ OrderChange payment amount must use MW response total (v3.23.0)

- **AY/SQ 2-step**: Step 1 OrderChange response contains `Order.TotalPrice.TotalAmount.Amount`
  → Use this for Step 2 payment (not Quote price!)
- **TR 1-step**: Payment = OrderRetrieve booking total + Quote price
- **Service Step 1 (accept only)**: Skip `amount > 0` validation (free services have amount=0)

```typescript
// ✅ Correct pattern - Step 2 uses MW response total from Step 1
const mwTotal = res?.Order?.TotalPrice?.TotalAmount;
paymentAmount: mwTotal?.Amount || fallbackPrice,
currency: mwTotal?.CurCode || 'KRW',

// ✅ Correct pattern - TR 1-step: booking total + quote price
const totalPrice = bookingTotal + seatOrServicePrice; // TR only

// ❌ Wrong pattern - using Quote price for Step 2
paymentAmount: selectedSeats.reduce((sum, s) => sum + s.price, 0), // Wrong amount!
```

#### ⚠️⚠️ CRITICAL: Group C (AF/KL) service-purchase route must return requiresPayment (v3.24.0)

- **AF/KL 2-step service purchase**: Add (1st OC) → PaymentPopup → Confirm (2nd OC with payment)
- **FE doesn't send `body.payment` on initial call** — PaymentPopup collects payment, then calls `/service-purchase/confirm` directly
- **Must return `requiresPayment: true`** when `addResponse.requiresPayment && !body.payment`
- **Payment amount priority**: `addResponse.paymentAmount` (MW 1st OC response) takes priority over `quoteData.totalPrice`

```typescript
// ✅ Correct pattern - 3 branches for Group C
if (addResponse.requiresPayment && body.payment) {
  // Full flow with payment (called via main route with payment info)
  await callInternalAPI('/service-purchase/confirm', { ...payment, orderItemRefIds });
} else if (addResponse.requiresPayment) {
  // ⭐ Add succeeded, return data for FE PaymentPopup
  return { success: true, requiresPayment: true, paymentAmount, orderChangeData, quoteData };
} else {
  // Free service - no payment needed
  return { success: true, orderId, message: 'Service added.' };
}

// ❌ Wrong pattern - only 2 branches (payment never returned!)
if (addResponse.requiresPayment && body.payment) { /* ... */ }
// Falls through to "free service" → requiresPayment missing → PaymentPopup never shows!
```

**ServicePurchaseModal must pass `orderItemRefIds`** in `handleServicePayment`:
```typescript
// ✅ Correct - pass orderItemRefIds for Group C acceptRepricedOrder
orderItemRefIds: addResponse?.orderChangeData?.orderItemRefIds,

// ❌ Wrong - missing orderItemRefIds → confirm route uses fallback [orderId]
```

#### ⚠️ Service Add offerItems fallback required (v3.22.0)

- Post-booking OfferPrice for AF/KL may lack `PricedOfferItem` in response
- `quoteData.offerItems` will be undefined → MW 400 "offerItems must contain at least 1 elements"
- **Always fallback to `selectedServices`** when `quoteData.offerItems` is missing

```typescript
// ✅ Correct pattern - offerItems fallback
offerItems: body.quoteData.offerItems || body.selectedServices.map(svc => ({
  offerItemId: svc.offerItemId,
  paxRefId: [svc.paxId],
  ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
})),

// ❌ Wrong pattern - no fallback
offerItems: body.quoteData.offerItems, // undefined for AF/KL → 400 error!
```

#### ⚠️ agentDeposit null-safety (v3.22.0)

- Empty `agentDeposit: {}` is truthy → spreads `agentDepositId: undefined`
- Use optional chaining: `body.agentDeposit?.agentDepositId &&` (not `body.agentDeposit &&`)

#### ⚠️ All carriers must call Quote before seat-purchase/confirm (v3.26.0)

**When adding seats in TicketingWithServiceModal**:
- All carriers with a non-NONE quote type must call `seat-purchase/quote` before `seat-purchase/confirm`!
- AF/KL (Pattern A): OfferPrice → gets NEW OfferItemIDs
- AY/SQ (Pattern B): OrderQuote
- TR/TK-paid (Pattern C): OrderQuote
- Use `getQuoteApiType(owner, isPaid)` to determine quote requirement

```typescript
// ✅ Correct flow (v3.26 - all carriers)
import { getQuoteApiType } from '@/types/seat-purchase';
import { getSeatPurchaseQuote, confirmSeatPurchase } from '@/lib/api/polarhub-service';
const needsQuoteFirst = getQuoteApiType(owner, isPaid) !== 'NONE';

if (needsQuoteFirst) {
 // 1. Call Quote first
 const quoteResult = await getSeatPurchaseQuote({ orderId, transactionId, selectedSeats, ... });
 seatQuoteData = quoteResult.quoteData;
}

// 2. Call Confirm (pass Quote result)
const confirmResult = await confirmSeatPurchase({
 orderId, transactionId,
 quoteData: seatQuoteData, // ⭐ Quote result!
 ...
});

// ❌ Wrong pattern (v3.19 - hardcoded AY/SQ only, AF/KL skipped!)
const needsQuoteFirst = ['AY', 'SQ'].includes(owner) && isPaid; // AF/KL missing!

// ❌ Wrong pattern (confirm without Quote for AF/KL)
// AF/KL sends SeatAvailability OfferItemIDs to OrderChange → MW 500 (911)
```

**Service purchase calls Quote automatically inside `processServicePurchase()`, so no separate handling is needed.**

#### ⚠️⚠️⚠️ CRITICAL: seatSelection required (seat purchase, v3.20.0)
- `seatSelection` info is **required** for OrderQuote, OfferPrice, and **OrderChange** requests!
- **Quote API response `offerItems` does NOT include seatSelection!**
- **Always build seatSelection from the original `selectedSeats`!**

**When saving quoteData in TicketingWithServiceModal**:
```typescript
// ✅ Correct pattern - build seatSelection from original selectedSeats
const finalQuoteData = {
 responseId: quoteResponse.responseId,
 offerId: quoteResponse.offerId,
 // ⭐ Include seatSelection! (built from original selectedSeats, not Quote response)
 offerItems: seatItems.map(s => ({
 offerItemId: s.offerItemId,
 paxRefId: [s.paxId],
 seatSelection: { column: s.column, row: s.row }, // ⭐ Required!
 })),
};

// ❌ Wrong pattern - using Quote response as-is (missing seatSelection!)
const finalQuoteData = quoteResponse.quoteData; // ← No seatSelection!
```

**In order-change-ticketing API acceptOnly mode** (AY/SQ Two-Step):
```typescript
// ✅ Correct pattern - use acceptSelectedQuotedOfferList
changeRequest = {
 transactionId,
 orderId,
 changeOrderChoice: {
 acceptSelectedQuotedOfferList: {
 selectedPricedOffer: [{
 offerId: quoteData.offerId,
 owner,
 responseId: quoteData.responseId,
 offerItems: quoteData.offerItems.map(item => ({
 offerItemId: item.offerItemId,
 paxRefId: item.paxRefId,
 seatSelection: item.seatSelection, // ⭐ Required!
 })),
 }],
 },
 },
 paxList: [],
 contactInfoList: [],
};

// ❌ Wrong pattern - using only acceptRepricedOrder (no offerItems/seatSelection!)
changeOrderChoice: {
 acceptRepricedOrder: { offerRefId }, // ← seatSelection not passed!
}
```

#### bookingInstructions required (weight-based services)
- `bookingInstructions` field is required for KG/PC unit services
- Structure: `{ text: ["TTL20KG"], ositext: ["TTL\\s?%WVAL%KG"] }`

#### ⚠️ Contact DELETE must specify items to keep (v3.13.2)
- **NDC spec section 4.3: ContactInfoList must contain items to "keep after deletion"!**
- **Specify items to keep, not items to delete!**

```typescript
// ✅ Correct pattern (v3.13.2) - specify items to keep
const keepPhones = contactData.keepPhones || []; // Passed from ContactAddDeleteForm
const keepEmails = contactData.keepEmails || [];

request.contactInfoList = [{
 contactInfoId: deleteContactInfoId,
 emailAddress: keepEmails, // ⚠️ Emails to keep!
 phone: keepPhoneItems, // ⚠️ Phones to keep!
 postalAddress: [],
}];

// ❌ Wrong pattern (v3.13.1) - sending empty arrays causes middleware to remove fields
request.contactInfoList = [{
 emailAddress: [], // Middleware removes this → 500 error!
 phone: [],
}];
```

#### seat-availability API owner constraint (Post-Booking)
- **PolarHub constraint**: `owner` must NOT be inside the `order` object!
- For Post-Booking, `owner` must be passed separately outside `order`

```typescript
// ✅ Correct pattern (Post-Booking)
body: JSON.stringify({
 transactionId,
 order: { orderId }, // Exclude owner!
 owner, // Pass separately
 paxList: [...],
})

// ❌ Wrong pattern
order: { orderId, owner } // "order.property owner should not exist" error
```

#### TicketingWithServiceModal quoteData passing (SQ/AY Pattern B)
- Must save `quoteData` after seat confirm → reused in PaymentPopup
- `seat-purchase/confirm` step 1 response includes `quoteData`
- Without `existingQuote`, PaymentPopup will re-call Quote API

```typescript
// Save quoteData in handleSeatConfirm
if (confirmData.quoteData) {
 setQuoteData(confirmData.quoteData);
}

// Pass existingQuote to PaymentPopup → prevents Quote API re-call
<PaymentPopup
 existingQuote={existingQuote}
 skipInternalQuote={!!existingQuote}
/>
```

#### pax-change carrier-specific field branching (passenger info change)
- Editable fields differ by carrier and ticketing status
- Use `getAllowedPaxChanges()` for dynamic branching

```typescript
// ✅ Correct pattern - dynamic field branching
import { getAllowedPaxChanges } from '@/types/pax-change';

const allowedChanges = getAllowedPaxChanges(carrierCode, isTicketed);
// → { canChangeName, canChangeContact, canChangeApis, canChangeFfn, canChangeDoca, mode, allowedActions }

// Example: KE carrier branching
// Pre-ticketing: Name(O), DOCA(O), Passport(X)
// Post-ticketing: Name(X), DOCA(X), Passport(O)
```

**Carrier-specific operation modes**:
| Mode | Carriers | UpdatePax Structure |
|------|----------|-------------------|
| `MODIFY_ONLY` | AF, KL | `CurrentPaxRefID` only |
| `ADD_DELETE_ONLY` | AY | Add: `NewPaxRefID`, Delete: `CurrentPaxRefID` |
| `ALL` | HA, TK, KE | MODIFY: uses both |

#### ⚠️⚠️⚠️ CRITICAL: paxInfo required (v3.13.0) ⚠️⚠️⚠️
- **birthdate, surname, givenName, gender are required in the Individual block!**
- **Missing paxInfo causes 400 error: "birthdate must be a string"**
- **⚠️ v3.12.6: contactInfoRefIds required for AY Contact ADD! (NDC spec section 4.2)**
- **⚠️ v3.12.7: Do not create new ContactInfoID — reuse existing ID!**
- **⚠️ v3.13.0: contactDetails for multiple contacts & accurate RefID selection!**
 - `contactDetails`: Detailed info per ContactInfoRefID (phones[], emails[])
 - Auto-selects the ContactInfoID that contains the relevant data for contact changes
- Passenger info from OrderRetrieve response must be included in API requests

```typescript
// paxInfo is required when calling pax-change API from PassengerEditModal!
body: JSON.stringify({
 transactionId, // Reused from OrderRetrieve response!
 paxId,
 changeType,
 action,
 carrierCode,
 data,
 // ⚠️ CRITICAL: paxInfo required! Sourced from OrderRetrieve response data
 paxInfo: {
 surname: selectedPax.property,
 givenName: selectedPax.givenName,
 birthdate: selectedPax.birthdate, // ⚠️ Required in Individual block!
 gender: selectedPax.gender,
 title: selectedPax.title,
 ptc: selectedPax.ptc,
 email: selectedPax.email,
 mobile: selectedPax.mobile,
 // ⚠️ v3.12.6: Existing ContactInfoRefID list from OrderViewRS (required for AY Contact ADD!)
 contactInfoRefIds: selectedPax.contactInfoRefIds,
 // ⚠️ v3.13.0: Contact detail info (used for accurate ContactInfoID selection)
 contactDetails: selectedPax.contactDetails,
 apisInfo: selectedPax.apisInfo,
 ffn: selectedPax.ffn,
 docaInfo: selectedPax.docaInfo,
 },
}),
```

**Data flow**: `OrderRetrieve → booking page → PassengerEditModal (paxInfo) → pax-change API → Individual block`

API-UI mapping: `.claude/skills/whitelabel-dev/references/api-mapping/pax-change.md`

#### Journey Change PaxJourney-based selection (v3.24)

**Journey selection must be PaxJourney-based, NOT segment-based.**
- Each journey card = one PaxJourney (from `DataLists.PaxJourneyList`)
- A PaxJourney may contain multiple segments (connecting flights)
- Selection key: `paxJourneyId` (PJ1, PJ2, etc.)

**Journey add/delete restricted to HA, TK only.**
- `supportsAddDelete: boolean` in `JourneyPatternConfig`
- ChangeModeSelector returns `null` when only 'change' mode available

**RetainServiceID = services on NON-selected journeys.**
```typescript
// v3.24: RetainServiceID logic
// When changing only the return journey (PJ2):
// -> Retain services on outbound (PJ1) segments
const retainServiceIds = allJourneysInOrderItem
  .filter(j => !selectedJourneyIds.includes(j.paxJourneyId))
  .flatMap(j => j.serviceIds);

// When ALL journeys selected -> retainServiceId = []
```

**OriginDestList must include ALL selected journeys.**
```typescript
// v3.24: Build originDestList from all selected journeys
const originDestList = selectedJourneyIds.map(id => {
  const journey = itineraries.find(i => i.paxJourneyId === id);
  return { origin: journey.origin, destination: journey.destination, departureDate: ... };
});
```

**PolarHub response format (NOT NDC XML format).**
```typescript
// PolarHub field names (correct)
Departure.AirportCode       // NOT Dep.IATALocationCode
MarketingCarrier.AirlineID   // NOT MarketingCarrierInfo.CarrierDesigCode
MarketingCarrier.FlightNumber // NOT MarketingCarrierFlightNumberText
Departure.Time / Arrival.Time // NOT AircraftScheduledDateTime
FlightDuration               // NOT Duration

// Flight extraction chain (PaxJourney-based)
AddOfferItem[].PaxJourneyRefID
  -> PaxJourneyList[].PaxSegmentRefID
    -> PaxSegmentList[] (actual flight info)
```

API-UI mapping: `.claude/skills/whitelabel-dev/references/api-mapping/journey-change.md`

#### ⚠️ MW OrderChange response wrapping (v3.25)

**MW wraps Order inside `response` object — NOT at top level!**

```typescript
// MW OrderChange response structure:
// { transactionId: "...", response: { Order: { ... } } }

// ✅ Correct pattern — fallback chain required
const order = step1Data.Order || step1Data.order
  || step1Data.response?.Order || step1Data.response?.order;

// ❌ Wrong pattern — Order not at top level for MW responses
const order = step1Data.Order; // undefined! → payment = 0, orderItemIds = []
```

Without this fallback, AF/KL 2-step OrderChange Step 2 sends `amount: 0` and `orderItemId: []`.

#### Per-journey search criteria (v3.25)

**Each selected journey has editable origin/destination/date inputs.**
- `JourneyCriteria` interface exported from ItinerarySelector
- `criteriaMap: Record<string, JourneyCriteria>` state in JourneyChangeModal
- `handleSearchFlights` is parameterless — reads from `journeyCriteria` state
- Search button validates all criteria are filled
- Flight status: use `status.startsWith('HK')` (variants: `HK K`, `HK T`, etc.)

```typescript
// v3.25: OriginDestList from per-journey user-editable criteria
const originDestList = selectedJourneyIds.map(journeyId => {
  const criteria = journeyCriteria[journeyId]; // User-editable!
  return { origin: criteria.origin, destination: criteria.destination, departureDate: criteria.departureDate };
});
```

#### Server-side 2-step OrderChange for AF/KL (v3.25)

**Confirm route handles both OrderChange calls internally.**
- Client calls `/journey-change/confirm` once (no paymentData param)
- PriceSummaryCard has no payment method selection UI
- `handleConfirm` is `() => void` (simplified)

## Hooks

- `PreToolUse`: Protects sensitive files on Write/Edit (`protect_sensitive_files.py`)
- `PostToolUse`: Validates Python syntax after file modifications (`py_compile_after_edit.py`)

## Session Context (Important!)

**Always check the `docs/session-context/` directory when starting a new session.**

This directory stores context from previous sessions:
- In-progress feature implementation status
- Discovered bugs and analysis results
- Issues pending middleware fixes
- Test data and Request Bodies

### On Session Start

```bash
# 1. Check latest context files
ls -la docs/session-context/

# 2. Read the most recent file (sorted by date)
# Filename format: YYYY-MM-DD-{feature-name}.md
```

### Context File Structure

| Section | Content |
|---------|---------|
| Summary | Work overview and current status |
| Work History | Completed commits and changes |
| Discovered Issues | Bugs, middleware problems, etc. |
| Related Files | Key code paths |
| Next Steps | Tasks to continue |

### On Session End

Save work content as `docs/session-context/YYYY-MM-DD-{feature-name}.md` to maintain context for the next session.

#### ⚠️ transactionId reuse required (OrderChange)
- **Save the transactionId from OrderRetrieve response and reuse in subsequent APIs**
- **Do not generate a new transactionId! (Causes 500 error)**

```typescript
// ✅ Correct pattern - reuse OrderRetrieve transactionId
// 1. Save transactionId from OrderRetrieve response
import { getBookingDetail, changePax } from '@/lib/api/polarhub-service';
const booking = await getBookingDetail(orderId);
const transactionId = booking._orderData.transactionId;

// 2. Use as-is in subsequent service calls (pax-change, service-purchase, etc.)
await changePax({
 transactionId, // ⚠️ Value from OrderRetrieve!
 orderId,
 paxId,
 changeType,
 ...
});

// ❌ Wrong pattern - generating new transactionId (500 error!)
const transactionId = generateTransactionId(); // Prohibited!
```

#### ⚠️ OrderChange API field names (NDC spec merge!)
- **PaxList**: For AF, KL contact (`CONTACT`) changes, send as **empty array (`[]`)** (v3.13.6 fix)
- **ContactInfoID**: Must **reuse existing ID** across all carriers! Do not create new ones (v3.13.7 fix)
- **Individual**: For other changes and AY carrier, include `individualId`, `middleName` (recommended per NDC spec required hierarchy)
- **Required**: `givenName` (array), `surname` (string)
- **LoyaltyProgramAccount**: Use `programCode` (not `loyaltyProgramProviderName`!)

```typescript
// ✅ AF, KL contact change (v3.13.7)
const request = {
 transactionId,
 orderId,
 changeOrderChoice: { updatePax: [{ currentPaxRefId: paxId }] },
 paxList: [],
 contactInfoList: [{
 contactInfoId: existingId, // ⚠️ Do not create new IDs (e.g., CTC1)! Reuse existing!
 emailAddress: [...],
 phone: [...],
 }],
};
```
