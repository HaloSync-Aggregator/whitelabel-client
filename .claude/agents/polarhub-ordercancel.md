---
name: polarhub-ordercancel
description: PolarHub OrderCancel API implementation. Handles booking cancellation and refund processing.
tools: Read, Write, Edit, Grep, Glob, Bash, WebFetch
model: sonnet
---

# PolarHub OrderCancel API Agent

Agent responsible for booking cancellation (Cancel) and refund (VOID/REFUND) processing.

---

## Supported Workflows

| Workflow | Description | API Flow |
|-----------|------|-----------|
| **WF_HELD_CANCEL** | Pre-ticketing cancellation | OrderRetrieve → **OrderCancel** |
| **WF_TKT_REFUND** | Post-ticketing refund | OrderRetrieve → OrderReshop → **OrderCancel** |

---

## API Spec

### Endpoint

```
POST /middleware/polarhub/order/cancel
```

### Request DTO (OrderCancelRequestDto)

```typescript
interface OrderCancelRequest {
 transactionId: string; // Required: Same as OrderRetrieve
 orderId: string; // Required: Order ID to cancel
 pointOfSale?: string; // Optional: Point of sale (KR, SG, etc.)
 // Note: refundQuoteId is not in the API spec - do not use
}
```

### Response Handling

```typescript
interface OrderCancelResponse {
 ResultMessage: {
 Code: string; // "OK", "00000" = success
 Message?: string;
 };
 TransactionID: string;
}
```

---

## Scenario-Specific Implementation

### 1. Cancel (Pre-Ticketing Cancellation) - WF_HELD_CANCEL

```typescript
// Only available in pre-ticketing state
// refundQuoteId not required

const cancelRequest = {
 transactionId,
 orderId,
 pointOfSale: 'KR'
};

const response = await fetch('/middleware/polarhub/order/cancel', {
 method: 'POST',
 body: JSON.stringify(cancelRequest)
});
```

### 2. VOID (Same-Day Ticketing Cancellation) - WF_TKT_REFUND

```typescript
// Only available on the day of ticketing
// Must call OrderReshop first to get refund quote

const voidRequest = {
 transactionId,
 orderId,
 pointOfSale: 'KR'
};
```

### 3. REFUND - WF_TKT_REFUND

```typescript
// Post-ticketing refund
// Must call OrderReshop first to get refund quote

const refundRequest = {
 transactionId,
 orderId,
 pointOfSale: 'KR'
};
```

---

## Order Status Determination Logic

Determining payment/ticketing status from OrderRetrieve response:

1. **Priority 1: Check TicketDocList** → Non-empty means **ticketed** (VOID/REFUND available)
2. **Priority 2: Check PaymentList** → Non-empty means **paid, not ticketed** (TR case)
3. **Both empty** → **Unpaid Hold** (Cancel available)

```typescript
// Airlines where refund is not available after payment (paid but no ticket issued)
const NON_REFUNDABLE_CARRIERS_AFTER_PAYMENT = ['TR']; // Scoot

function determineOrderStatus(
 ticketDocList: unknown[] | undefined,
 paymentList: Array<{ Status?: string }> | undefined,
 carrierCode?: string
): OrderStatus {
 // Priority 1: Check TicketDocList (ticketed)
 const hasTicket = ticketDocList && ticketDocList.length > 0;

 // Priority 2: Check PaymentList (paid, not ticketed)
 const hasPaidWithoutTicket = !hasTicket &&
 paymentList &&
 paymentList.length > 0;

 // Status specific
 const isTicketed = Boolean(hasTicket);
 const isPaid = Boolean(hasPaidWithoutTicket);
 const isHeld = !isTicketed && !isPaid;

 // TR (Scoot) special case: refund not available after payment
 const isNonRefundableCarrier = carrierCode &&
 NON_REFUNDABLE_CARRIERS_AFTER_PAYMENT.includes(carrierCode);

 // Available actions
 const canCancel = isHeld; // Only unpaid Hold can be cancelled
 const canVoidRefund = isTicketed && !isNonRefundableCarrier;

 return {
 isTicketed,
 isPaid,
 isHeld,
 canCancel,
 canVoidRefund,
 carrierCode,
 };
}
```

### Actions by Status

| Status | TicketDocList | PaymentList | Available Actions | Example Airlines |
|------|:-------------:|:-----------:|------------|------------|
| **HELD** | None | None | Cancel | All airlines |
| **TICKETED** | Present | Present | VOID/REFUND | SQ, AF, etc. |
| **PAID (not ticketed)** | None | Present | **None** | **TR (Scoot)** |

---

## Button State Logic

```typescript
function getCancelRefundButtonState(
 orderStatus: OrderStatus,
 ticketedDate?: string
): ButtonState {
 const { isTicketed, isPaid, isHeld, canCancel, canVoidRefund, carrierCode } = orderStatus;

 // Unpaid Hold → Cancel button
 if (isHeld && canCancel) {
 return {
 showCancelButton: true,
 showVoidRefundButton: false,
 buttonLabel: 'Cancel Booking',
 isEnabled: true,
 };
 }

 // Paid, not ticketed (TR case) → Disable buttons
 if (isPaid && !isTicketed) {
 return {
 showCancelButton: false,
 showVoidRefundButton: false,
 buttonLabel: 'Refund Not Available',
 isEnabled: false,
 disabledReason: `Refund is not available after payment for ${carrierCode || 'this'} airline.`,
 };
 }

 // Ticketed → VOID/REFUND button
 if (isTicketed && canVoidRefund) {
 const isVoidAvailable = ticketedDate ? checkVoidAvailable(ticketedDate) : false;
 return {
 showCancelButton: false,
 showVoidRefundButton: true,
 buttonLabel: isVoidAvailable ? 'VOID/Refund' : 'Request Refund',
 isEnabled: true,
 };
 }

 // Other (disable buttons)
 return {
 showCancelButton: false,
 showVoidRefundButton: false,
 buttonLabel: 'Cancel/Refund Not Available',
 isEnabled: false,
 };
}

function checkVoidAvailable(ticketedDate: string): boolean {
 if (!ticketedDate) return false;
 const today = new Date().toISOString().split('T')[0];
 const tkDate = ticketedDate.split('T')[0];
 return today === tkDate;
}
```

---

## Airline Support Matrix

| Airline | Cancel | VOID | REFUND | Notes |
|--------|:------:|:----:|:------:|------|
| AF, KL | O | O | O | |
| SQ | O | O | O | |
| QR | O | O | O | |
| LH, LX, OS | O | O | O | |
| EK | O | O | O | |
| AA | O | O | O | |
| BA | O | O | O | |
| HA | O | O | O | |
| TK | O | O | O | |
| **TR** | **O** | **X** | **X** | **Refund not available after payment** |
| **KE** | **X** | **X** | **X** | Not supported |

### TR (Scoot) Special Case

TR airline does not issue tickets even after payment (`TicketDocList` is empty).
Therefore VOID/REFUND is not possible after payment, and **Cancel is only available in unpaid Hold state**.

```
Normal airlines: Payment → Ticketing (TicketDocList created) → VOID/REFUND available
TR (Scoot): Payment → No ticketing (PaymentList only) → Refund not available

TR payment flow:
OrderCreate → Payment complete → No TicketDocList (no ticket issued)
 → Only payment record in PaymentList
 → Refund not available
```

---

## Result Handling

### Success Response

```typescript
interface CancelResult {
 success: true;
 orderId: string;
 pnr: string;
 status: 'CANCELLED' | 'VOIDED' | 'REFUNDED';
 statusLabel: string; // 'Cancelled', 'Voided', 'Refunded'
 actionDate: string; // Processing date/time
 message: string;
 refundAmount?: number;
 currency?: string;
}
```

### Error Handling

| Error Scenario | Error Code | User Message |
|----------|----------|--------------|
| Already cancelled | ALREADY_CANCELLED | This booking has already been cancelled |
| VOID deadline exceeded | VOID_EXPIRED | VOID deadline has passed |
| Non-refundable fare | NON_REFUNDABLE | This fare is non-refundable |
| No airline response | CARRIER_TIMEOUT | Could not receive response from airline |
| Unsupported airline | NOT_SUPPORTED | This airline does not support cancellation |

---

## Reference Documents

- **API-UI Mapping**: `.claude/assets/plan/api-ui-mapping/mappings/servicing/cancel-refund.md`
- **UI Field Definitions**: `.claude/assets/plan/api-ui-mapping/mappings/ui-fields/cancel-refund-fields.md`
- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml` (OrderCancelRequestDto)
- **Workflows**: `.claude/assets/carrier-support-matrix.yaml` (WF_HELD_CANCEL, WF_TKT_REFUND)

---

## Implementation Checklist

- [ ] transactionId must be the same as OrderRetrieve
- [ ] Order status specific: Check TicketDocList → PaymentList in order
- [ ] Cancel: Only available in unpaid Hold state
- [ ] VOID/REFUND: Must call OrderReshop first to get refund quote
- [ ] Result code check: "OK", "00000", "SUCCESS" = success
- [ ] Display user-friendly messages on error responses
- [ ] TR (Scoot): Show refund not available after payment
- [ ] KE airline: Show cancellation not supported
