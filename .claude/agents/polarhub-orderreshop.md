---
name: polarhub-orderreshop
description: PolarHub OrderReshop API implementation. Handles itinerary change option lookup and refund quote retrieval.
tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch
model: sonnet
---

# PolarHub OrderReshop API Agent

Agent responsible for itinerary change option lookup and refund quote retrieval.

---

## Supported Workflows

| Workflow | Description | API Flow |
|-----------|------|-----------|
| **WF_HELD_ITIN** | Pre-ticketing itinerary change | OrderRetrieve → **OrderReshop** → OrderChange |
| **WF_TKT_VOLCHANGE** | Post-ticketing voluntary itinerary change | OrderRetrieve → **OrderReshop** → OrderQuote → OrderChange |
| **WF_TKT_REFUND** | Post-ticketing refund quote | OrderRetrieve → **OrderReshop** → OrderCancel |

---

## API Spec

### Endpoint

```
POST /middleware/polarhub/order-reshop
```

### Request DTO (OrderReshopRequestDto)

```typescript
interface OrderReshopRequest {
 transactionId: string; // Required: Same as OrderRetrieve
 orderId: string; // Required: Target order ID
 actionContext?: string; // Optional: '8' = Voluntary, '9' = Involuntary
 updateOrder: UpdateOrder; // Required: Change details
 pointOfSale?: string; // Optional: Point of sale
}

interface UpdateOrder {
 // Used for itinerary change (reshopOrder)
 reshopOrder?: {
 serviceOrder: {
 // v3.24: delete uses orderItemRefId + retainServiceId
 delete?: Array<{
 orderItemRefId: string;
 retainServiceId?: string[]; // v3.24: services on NON-selected journeys to retain
 }>;
 add?: {
 originDestList: Array<{ // v3.24: ALL selected journeys
  origin: string;
  destination: string;
  departureDate: string;
 }>;
 cabin?: string; // Y, W, C, F
 };
 };
 };

 // Used for refund quote (cancelOrderRefId)
 // WARNING CRITICAL: STRING type! Not an object!
 cancelOrderRefId?: string;
}
```

---

## Scenario-Specific Implementation

### 1. Itinerary Change Option Lookup (WF_HELD_ITIN, WF_TKT_VOLCHANGE)

```typescript
// v3.24: PaxJourney-based request structure
// originDestList includes ALL selected journeys
// retainServiceId = services on NON-selected journeys
const reshopRequest = {
 transactionId,
 orderId,
 actionContext: '8', // Voluntary
 updateOrder: {
 reshopOrder: {
 serviceOrder: {
 // v3.24: delete with RetainServiceID
 delete: [{
  orderItemRefId: 'fc65de5b-...',
  retainServiceId: ['SRV_PAX1_SEG2', 'SRVID2_CO_PAX1_SEG2'], // NON-selected journey services
 }],
 // v3.24: add with originDestList (ALL selected journeys)
 add: {
  originDestList: [
  { origin: 'ICN', destination: 'CDG', departureDate: '2026-03-15' },
  // Include other selected journeys if multiple
  ],
  cabin: 'Y',
 },
 }
 }
 }
};
```

### 2. Refund Quote Retrieval (WF_TKT_REFUND)

```typescript
// WARNING CRITICAL: cancelOrderRefId is STRING type!
// WRONG: { cancelOrderRefId: { orderId: "..." } }
// CORRECT: { cancelOrderRefId: "ORDER_ID" }

const refundQuoteRequest = {
 transactionId,
 orderId,
 actionContext: '8', // Voluntary
 updateOrder: {
 cancelOrderRefId: orderId // Pass directly as string
 }
};

const response = await fetch('/middleware/polarhub/order-reshop', {
 method: 'POST',
 body: JSON.stringify(refundQuoteRequest)
});
```

---

## Refund Quote Response Handling

### Response Structure

```typescript
interface OrderReshopResponse {
 ResultMessage: {
 Code: string;
 Message?: string;
 };
 TransactionID: string;
 ReshopOffers?: Array<{
 ResponseID: string; // Needed for OrderCancel
 OfferID: string; // Needed for OrderCancel (RefundQuoteID)
 Owner: string;
 TotalPrice?: {
 TotalAmount: {
 Amount: number;
 CurCode: string;
 };
 };
 DeleteOrderItem?: Array<{
 OrderItemID: string;
 OriginalOrderItem?: {
 Total: { Amount: number; CurCode: string; };
 };
 PenaltyAmount?: {
 Total: { Amount: number; CurCode: string; };
 };
 ReshopDue?: {
 Total: { Amount: number; CurCode: string; };
 };
 }>;
 }>;
}
```

### Refund Amount Calculation

```typescript
interface RefundQuote {
 originalFare: number; // Original fare
 penalty: number; // Cancellation fee
 refundAmount: number; // Expected refund amount
 currency: string;
 responseId: string; // For response reference
 // Note: offerId (RefundQuoteID) is not passed to OrderCancel - not in API spec
}

function calculateRefundQuote(response: OrderReshopResponse): RefundQuote {
 const reshopOffer = response.ReshopOffers?.[0];

 if (!reshopOffer) {
 throw new Error('No reshop offer found');
 }

 const deleteItems = reshopOffer.DeleteOrderItem || [];

 let originalFare = 0;
 let penalty = 0;
 let refundAmount = 0;
 let currency = 'KRW';

 deleteItems.forEach(item => {
 originalFare += item.OriginalOrderItem?.Total?.Amount || 0;
 penalty += item.PenaltyAmount?.Total?.Amount || 0;
 refundAmount += item.ReshopDue?.Total?.Amount || 0;
 currency = item.ReshopDue?.Total?.CurCode || currency;
 });

 return {
 originalFare,
 penalty,
 refundAmount: Math.max(refundAmount, 0),
 currency,
 responseId: reshopOffer.ResponseID,
 // Note: offerId is not passed to OrderCancel (not in API spec)
 };
}
```

---

## Refund Processing Flow

```
+-------------------------------------------------------------+
| 1. OrderReshop (Refund Quote Retrieval) |
| - cancelOrderRefId: orderId (STRING!) |
| - Response: Refund amount info (original fare, fees, refund)|
+----------------------------+---------------------------------+
 |
 v
+-------------------------------------------------------------+
| 2. User Confirmation |
| - Original fare: 1,700,000 KRW |
| - Cancellation fee: -200,000 KRW |
| - Expected refund: 1,500,000 KRW |
+----------------------------+---------------------------------+
 |
 v
+-------------------------------------------------------------+
| 3. OrderCancel (Execute Refund) |
| - Only transactionId and orderId needed |
| - (refundQuoteId not required - not in API spec) |
+-------------------------------------------------------------+
```

---

## Airline Support Matrix

| Airline | Itinerary Change | Refund Quote | Notes |
|--------|:-------:|:-------:|------|
| AF, KL | O | O | |
| SQ | O | O | |
| QR | O | O | |
| LH, LX, OS | O | O | |
| EK | O | O | |
| AA | O | O | |
| BA | O | O | |
| HA | O | O | |
| TK | O | O | |
| **TR** | **X** | **X** | **Refund not available after payment** |
| **KE** | **X** | **X** | Not supported |

### TR (Scoot) Special Case

TR airline does not issue tickets even after payment (`TicketDocList` is empty).
Therefore **refund quote retrieval (OrderReshop) is not possible**, and **Cancel is only available in unpaid Hold state**.

```
Normal airlines: Payment → Ticketing → OrderReshop (refund quote) → OrderCancel (refund)
TR (Scoot): Payment → No ticketing → OrderReshop not available → Refund not available
```

---

## Journey Change Confirm (OrderChange)

### Server-Side 2-Step Flow (AF/KL)

The confirm API route handles both OrderChange calls internally for AF/KL carriers.
The client calls `/journey-change/confirm` **once** — no client-side 2-step logic needed.

**Step 1**: `acceptSelectedQuotedOfferList` + empty PaymentList
**Step 2**: `acceptRepricedOrder` + PaymentList with Cash payment from Step 1 response

### MW OrderChange Response Structure (CRITICAL)

MW wraps the Order inside a `response` object:
```json
{ "transactionId": "...", "response": { "Order": { ... } } }
```

**Order extraction MUST chain fallbacks:**
```typescript
const order = step1Data.Order || step1Data.order
  || step1Data.response?.Order || step1Data.response?.order;
```

Without this fallback chain:
- `order` = undefined
- `paymentAmount` = 0
- `orderItemIds` = []
- Step 2 sends empty payment → MW accepts but no actual payment occurs

### Step 2 Payment Construction

```typescript
paymentList: [{
  type: 'Cash',
  amount: order.TotalPrice.TotalAmount.Amount,  // From Step 1 response
  curCode: order.TotalPrice.TotalAmount.CurCode,
  paxRefId: [],
  orderItemId: [...orderItemIds],  // From Step 1 response OrderItem[]
  offerItemId: [],
}]
```

---

## Error Handling

| Error Scenario | Error Code | User Message |
|----------|----------|--------------|
| Non-refundable fare | NON_REFUNDABLE | This fare is non-refundable |
| Non-changeable fare | NON_CHANGEABLE | This fare cannot be changed |
| No airline response | CARRIER_TIMEOUT | Could not receive response from airline |
| Unsupported airline | NOT_SUPPORTED | This airline does not support this feature |

---

## Reference Documents

- **API-UI Mapping**: `.claude/assets/plan/api-ui-mapping/mappings/servicing/cancel-refund.md`
- **UI Field Definitions**: `.claude/assets/plan/api-ui-mapping/mappings/ui-fields/cancel-refund-fields.md`
- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml` (OrderReshopRequestDto, UpdateOrderDto)
- **Workflows**: `.claude/assets/carrier-support-matrix.yaml` (WF_TKT_REFUND)

---

## Implementation Checklist

- [ ] transactionId must be the same as OrderRetrieve
- [ ] **cancelOrderRefId is STRING type** (not an object!)
- [ ] Refund amount calculation: originalFare - penalty = refundAmount
- [ ] After refund quote retrieval → OrderCancel (refundQuoteId not required)
- [ ] Display user-friendly messages on error responses
- [ ] TR (Scoot): Refund quote not available after payment
- [ ] KE airline: Show refund not supported
