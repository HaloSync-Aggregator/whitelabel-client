# Before ticketing Ancillary service Include Ticketing (Ticketing with Service) API Mapping

> **Feature**: Hold Status from Booking Ancillary service after Select Integration Payment Ticketing
> **Related 플랜**: `docs/plans/prime-booking-ancillary-ticketing.md`
> **Reference Implementation**: `apps/DEMO001/`

---

## Overview

unPayment Hold Status in Booking About Ancillary service(Baggage, etc.) first Addand, Fare + Service Integration using Payment Ticketing Feature.

### Core strategy: 2Step Split

```
Step 1: Add service (skipPayment: true → Payment without Service only Add)
Step 2: Integration Ticketing (Fare + Service Amount Sum Payment)
```

---

## ⚠️ CRITICAL: Carrier Support Whether

### Hold from Status Add service Available Carrier

| Group | Carrier | Support Whether | Notes |
|------|--------|----------|------|
| **Group B** | AY, SQ | ✅ | Hold/Ticketed All Available |
| **Group C** | AF, KL | ✅ | Hold/Ticketed All Available |
| **Group E** | TK | ✅ | Conditionsection (Partial Service) |
| Group A | EK, LH | ❌ | Available after ticketing only |
| Group D | HA | ❌ | Available after ticketing only |

### Support Whether Judgment Function

```typescript
// src/types/service-purchase.ts
import { canAddServiceInHoldStatus } from '@/types/service-purchase';

// src/types/ticketing-with-service.ts
export const canAddServiceBeforeTicketing = canAddServiceInHoldStatus;

// Use e.g.
if (canAddServiceBeforeTicketing(carrierCode)) {
 // → TicketingWithServiceModal Display
} else {
 // → Existing PaymentPopup Display (Service without Ticketing)
}
```

---

## API Flow

### All/Total Sequence

```
[Ticketing Button click]
 │
 ▼
canAddServiceBeforeTicketing(carrierCode)?
 │
 ├─ No → PaymentPopup (Existing Ticketing flow)
 │
 └─ Yes → TicketingWithServiceModal
 │
 ▼
 ServiceList API → Service list Retrieval
 │
 ▼
 User Service Select
 │
 ▼
 ┌───── Step 1: /service-purchase (skipPayment: true) ─────┐
 │ - OrderQuote → OrderChange (No payment) │
 │ - Service only in Booking Add (Status: HN → HD or HK) │
 │ - Return: quoteData, paymentAmount (Service Amount) │
 └──────────────────────────────────────────────────────────┘
 │
 ▼
 ┌───── Step 2: PaymentPopup → /order-change-ticketing ────┐
 │ - Enter payment information │
 │ - Integration Amount: baseFare + serviceFee │
 │ - OrderQuote → OrderChange (with Payment) │
 │ - Ticket Issued │
 └──────────────────────────────────────────────────────────┘
```

### Step 1: Add service (No payment)

```typescript
// processServicePurchase() in src/lib/api/polarhub-service.ts
const addRequest = {
 transactionId: "...",
 orderId: "...",
 owner: "SQ",
 isTicketed: false, // Hold Status
 skipPayment: true, // ⭐ Core! Payment skip
 selectedServices: [
 {
 serviceId: "SVC001",
 offerItemId: "OI001",
 paxId: "PAX1",
 segmentId: "SEG1",
 quantity: 1,
 price: 90000,
 currency: "KRW",
 // KG Unit Service's Case
 weightValue: 20,
 bookingInstructions: {
 text: ["TTL20KG"],
 ositext: ["TTL\\s?%WVAL%KG"],
 },
 }
 ],
 serviceListData: {
 responseId: "...", // ServiceList Response ID
 offerId: "...", // ServiceList Response OfferID
 owner: "SQ",
 },
};

// Response
{
 success: true,
 orderId: "...",
 requiresPayment: false, // skipPayment from Mode Always false
 paymentAmount: 90000, // ⭐ Service Amount (when Ticketing Sum)
 currency: "KRW",
 quoteData: {
 responseId: "...",
 offerId: "...",
 offerItems: [...],
 },
}
```

### Step 2: Integration Ticketing (Fare + Service)

```typescript
// processTicketing() in src/lib/api/polarhub-service.ts
const ticketRequest = {
 transactionId: "...",
 orderId: "...",
 owner: "SQ",
 paymentMethod: "card",
 card: {
 cardCode: "VI",
 cardNumber: "4111111111111111",
 cardHolderName: "HONG GILDONG",
 expiration: "1225",
 seriesCode: "123",
 },
 amount: {
 currencyCode: "KRW",
 amount: 1543900, // ⭐ baseFare(1453900) + serviceFee(90000)
 },
 orderItemRefIds: [...], // Required: booking._orderData.orderItemIds
};
```

---

## Amount Calculate

### Integration Amount Calculate Function

```typescript
// src/types/ticketing-with-service.ts
export interface TicketingAmount {
 baseFare: number; // Base fare
 serviceFee: number; // Add Service for
 total: number; // Total
 currency: string;
}

export function calculateTicketingAmount(
 baseFare: number,
 serviceFee: number,
 currency: string = 'KRW'
): TicketingAmount {
 return {
 baseFare,
 serviceFee,
 total: baseFare + serviceFee,
 currency,
 };
}
```

### UI Display Example

```
┌─────────────────────────────────────┐
│ Payment Amount │
├─────────────────────────────────────┤
│ AviationFare KRW 1,453,900 │
│ Add Service KRW 90,000 │
├─────────────────────────────────────┤
│ Total PaymentAmount KRW 1,543,900 │
└─────────────────────────────────────┘
```

---

## Implementation File

### Type definition

```
src/types/ticketing-with-service.ts
├── canAddServiceBeforeTicketing() # Carrier Support Whether
├── TicketingWithServiceStep # Status Type
├── SelectedServiceItem # Select Service Item
├── AddServiceBeforeTicketingRequest # Step 1 Request
├── AddServiceBeforeTicketingResponse # Step 1 Response
├── TicketingWithServiceRequest # Step 2 Request
├── TicketingAmount # Amount Calculate Result
└── calculateTicketingAmount() # Amount Calculate Function
```

### Service Function

```
src/lib/api/polarhub-service.ts
├── processServicePurchase() - skipPayment Parameter Process
└── Payment without Add after service quoteData Return
```

### UI Component

```
src/components/booking/TicketingWithServiceModal.tsx
├── Step 1: ServiceList Retrieval → Service Select → Add service
├── Step 2: PaymentPopup Re-Use → Integration Payment
└── Amount Display: baseFare + serviceFee = total
```

### Page integration

```typescript
// src/pages/booking/[id].tsx

import { canAddServiceBeforeTicketing } from '@/types/ticketing-with-service';
import TicketingWithServiceModal from '@/components/booking/TicketingWithServiceModal';

// Status
const [showTicketingWithServiceModal, setShowTicketingWithServiceModal] = useState(false);

// Ticketing Button Handler
const handlePayment = () => {
 if (!booking) return;
 if (booking.isTicketed) {
 alert('Already Ticketing Booking.');
 return;
 }

 // ⭐ Carrier-specific branching
 if (canAddServiceBeforeTicketing(booking.carrierCode)) {
 setShowTicketingWithServiceModal(true); // Service Include Ticketing
 } else {
 setShowPaymentPopup(true); // Existing Ticketing
 }
};

// Rendering
{showTicketingWithServiceModal && booking && (
 <TicketingWithServiceModal
 isOpen={showTicketingWithServiceModal}
 onClose={() => setShowTicketingWithServiceModal(false)}
 orderId={booking.orderId}
 owner={booking.carrierCode}
 transactionId={booking._orderData.transactionId}
 passengers={booking.passengers.map(p => ({
 paxId: p.paxId,
 name: p.fullName,
 type: p.ptc,
 typeLabel: p.ptcLabel,
 }))}
 baseFare={booking.price.totalAmount}
 currency={booking.price.currency}
 orderItemRefIds={booking._orderData.orderItemIds}
 onSuccess={handleTicketingWithServiceSuccess}
 />
)}
```

---

## 주 Occurs Error

### 1. "Payment information Required" (skipPayment unProcess)

- **Cause**: `processServicePurchase()` `skipPayment: true` Process Missing
- **Resolution**: skipPayment Branch Add
 ```typescript
 if (params.skipPayment) {
 return {
 success: true,
 orderId,
 requiresPayment: false,
 paymentAmount: quoteData?.totalPrice,
 currency: quoteData?.currency || 'KRW',
 quoteData: { responseId, offerId, offerItems },
 };
 }
 ```

### 2. Amount mismatch (Service Amount Missing)

- **Cause**: Step from 2 Service Amount Sumdoes not
- **Resolution**: calculateTicketingAmount() Use
 ```typescript
 const { total } = calculateTicketingAmount(baseFare, serviceFee, currency);
 // in PaymentPopup total Pass
 ```

### 3. Supportnot not from Carrier Modal Display

- **Cause**: canAddServiceBeforeTicketing() Check Missing
- **Resolution**: handlePayment()from Carrier Support Whether Confirm

### 4. Add after service Ticketing Failure

- **Cause**: quoteData Step to 2 Passnot not
- **Resolution**: Step 1 from the response quoteData to Status after Save Step in 2 Pass

### 5. AF/KL Seat Add + Ticketing Step 2 Failure (v3.26.0)

- **Cause 1**: `seatOrderItemIds` from seat-purchase/confirm Step 1 not forwarded to order-change-ticketing
- **Cause 2**: AF/KL Step 2 MW rejects Card fields (cardCode, cardNumber, etc.) — must use `Cash` type
- **Resolution**:
  1. `TicketingWithServiceModal`: Save `confirmData.orderItemIds` to `seatOrderItemIds` state
  2. Pass `seatOrderItemIds` to `PaymentPopup` via `orderInfo.seatOrderItemIds`
  3. `order-change-ticketing`: Branch `isPatternAStep2 = ['AF', 'KL'].includes(owner) && body.seatOrderItemIds?.length`
  4. Use `Cash` type paymentList with `orderItemId: body.seatOrderItemIds`

---

## BookingInstructions (KG/PC Unit Service)

### ServiceList Method Pattern Confirm

```typescript
// ServiceList from Response Method Confirm
const method = service.BookingInstructions?.Method;
// "TTL\\s?%WVAL%KG" → KG Unit Weight input Required
// "%CNT%PC" → PC Unit Count Input Required

if (method?.includes('%WVAL%')) {
 // Weight input UI Display
}
```

### BookingInstructions Pass

```typescript
const selectedService = {
 serviceId: "...",
 offerItemId: "...",
 paxId: "PAX1",
 quantity: 1,
 weightValue: 20,
 bookingInstructions: {
 text: ["TTL20KG"], // Actual Value
 ositext: ["TTL\\s?%WVAL%KG"], // Original Pattern
 },
};
```

---

## Reference documents

| Document | Path |
|------|------|
| Service list API | `api-mapping/service-list.md` |
| Post-ticketing API | `api-mapping/post-booking-ticketing.md` |
| Carrier Support Matrix | `.claude/assets/plan/api-ui-mapping/carrier-support-matrix.yaml` |
| Service purchase Type | `src/types/service-purchase.ts` |
| Ticketing + Service Type | `src/types/ticketing-with-service.ts` |

---

## UI Component Guide

### TicketingWithServiceModal Status Flow

```
idle → service-select → service-adding → service-added → payment → ticketing → success
 │ │
 └── Service without Ticketing ───────────────────────┘
```

### Required Props

| Prop | Type | Description |
|------|------|------|
| orderId | string | Booking ID |
| owner | string | Carrier code |
| transactionId | string | transaction ID |
| passengers | Array | Passenger List (Service Select) |
| baseFare | number | Base fare |
| currency | string | Currency Code |
| orderItemRefIds | string[] | OrderItem Reference ID List |
| onSuccess | () => void | Ticketing Success Callback |

### PaymentPopup Re-Use

```typescript
// TicketingWithServiceModal Internal
<PaymentPopup
 isOpen={step === 'payment'}
 onClose={() => setStep('service-added')}
 orderInfo={{
 transactionId,
 orderId,
 pnr,
 carrierCode: owner,
 originalAmount: ticketingAmount.total, // ⭐ Sum Amount
 currency,
 orderItemRefIds,
 }}
 onSuccess={handlePaymentSuccess}
/>
```

---

## Test Scenario

### Normal Case

1. **SQ Hold Booking → Baggage Add → Ticketing**
 - Service list Retrieval Confirm
 - Service after Select Add Confirm (skipPayment)
 - Integration Amount Display Confirm
 - Ticketing complete Confirm

2. **Service without Ticketing**
 - "Service without Ticketing" Button click
 - Base fareonlyto Payment Progress

### e.g.out Case

1. **unSupported carriers (EK, LH)**
 - TicketingWithServiceModal Displaynot not아must Does
 - Existing PaymentPopupto Ticketing

2. **ServiceList Failure**
 - Error message Display
 - "Service without Ticketing" Option Provide

3. **Add service Failure**
 - Error message Display
 - Retry or Service without Ticketing Option
