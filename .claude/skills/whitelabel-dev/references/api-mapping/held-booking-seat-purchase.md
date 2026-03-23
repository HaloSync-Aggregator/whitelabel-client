# Held Booking Seat purchase API-UI Mapping

> **Service Functions**:
> - `getSeatPurchaseQuote()` in `src/lib/api/polarhub-service.ts` (Quote)
> - `confirmSeatPurchase()` in `src/lib/api/polarhub-service.ts` (OrderChange)
> **Template File**:
> - `templates/types/seat-purchase.ts.template`
> - `templates/components/booking/PostTicketingSeatPopup.tsx.template`

---

## Core Concepts

### Held Booking vs Ticketed Booking

| Distinction | Held Booking | Ticketed Booking |
|------|--------------|------------------|
| Status | Booking Complete, unPayment/unTicketing | Ticketing complete |
| Supported carriers | 7items (AF, AY, HA, KL, SQ, TK, TR) | Separate Implementation Required |
| Payment | in OrderChange paymentList Include | EMD Issue Required |
| TR Special notes | LCC specialproperty상 Payment after in also `isTicketed` `false` Exists. `isPaid` Status Criteriato Seat/Service purchase Button Exposedmust be done. 또 Payment to Type `Ag` (Agent Deposit) Usemust be done. |

---

## 5items Pattern Flow

### Pattern A: AF, KL (OfferPrice + 2-step OC)

```
SeatAvailability → OfferPrice → OrderChange(w/o FOP) → Payment → OrderChange(w/ FOP)
 │ │ │ │
 │ │ │ └── Payment Include Confirmed
 │ │ └── Seat hold (Payment without)
 │ └── Seat Price Retrieval
 └── Seat List Retrieval
```

**Configuration**:
```typescript
{
 pattern: 'A',
 quoteApi: 'OFFER_PRICE',
 orderChangeSteps: 2,
 requiresPolling: false,
 paymentTypes: ['Card', 'Cash', 'Voucher'],
}
```

### Pattern B: AY, SQ (OrderQuote + 2-step OC)

```
SeatAvailability → OrderQuote → OrderChange(w/o FOP) → Payment → OrderChange(w/ FOP)
 │ │ │ │
 │ │ │ └── Payment Include Confirmed
 │ │ └── Seat hold (Payment without)
 │ └── Seat Price Retrieval
 └── Seat List Retrieval
```

**Configuration**:
```typescript
{
 pattern: 'B',
 quoteApi: 'ORDER_QUOTE',
 orderChangeSteps: 2,
 requiresPolling: false,
 paymentTypes: ['Card', 'Cash'],
}
```

### Pattern C: TR, TK(Paid) (OrderQuote + 1-step OC)

```
SeatAvailability → OrderQuote → Payment → OrderChange(w/ FOP)
 │ │ │
 │ │ └── Payment + Confirmed (1Step)
 │ └── Seat Price Retrieval
 └── Seat List Retrieval
```

**Configuration**:
```typescript
// TR
{
 pattern: 'C',
 quoteApi: 'ORDER_QUOTE',
 orderChangeSteps: 1,
 requiresPolling: false,
 paymentTypes: ['AGT'], // AGT!
}

// TK (Paid)
{
 pattern: 'C',
 quoteApi: 'ORDER_QUOTE',
 orderChangeSteps: 1,
 requiresPolling: false,
 paymentTypes: ['Card', 'Cash'],
}
```

### Pattern D: HA (Direct + Polling + 2-step OC)

```
SeatAvailability → OrderChange(w/o FOP) → Polling(OrderRetrieve) → Payment → OrderChange(w/ FOP)
 │ │ │ │
 │ │ │ └── Payment Include Confirmed
 │ │ └── CONFIRMED Status Pending (2초 spacing, Maximum 30초)
 │ └── Seat hold (Payment without)
 └── Seat List Retrieval
```

**Configuration**:
```typescript
{
 pattern: 'D',
 quoteApi: 'NONE',
 orderChangeSteps: 2,
 requiresPolling: true,
 paymentTypes: ['Card', 'Cash'],
}
```

### Pattern E: TK(Free) (Direct OC)

```
SeatAvailability → OrderChange
 │ │
 │ └── Free seat Confirmed (No payment)
 └── Seat List Retrieval
```

**Configuration**:
```typescript
{
 pattern: 'E',
 quoteApi: 'NONE',
 orderChangeSteps: 1,
 requiresPolling: false,
 paymentTypes: [], // Free
}
```

---

## API Request/Response structure

### Quote API Request

```typescript
// getSeatPurchaseQuote() in src/lib/api/polarhub-service.ts
{
 transactionId: string;
 orderId: string;
 owner: string;
 isPaid?: boolean; // TK for Branch
 seatAvailabilityData?: {
 responseId: string;
 offerId: string;
 owner: string;
 };
 selectedSeats: Array<{
 segmentKey: string;
 paxId: string;
 column: string; // "K"
 row: string; // "37"
 seatNumber: string; // "37K"
 offerItemId: string;
 price: number;
 currency: string;
 }>;
}
```

### Confirm API Request

```typescript
// confirmSeatPurchase() in src/lib/api/polarhub-service.ts
{
 transactionId: string;
 orderId: string;
 owner: string;
 purchaseType: 'paid' | 'free';
 step?: 1 | 2; // ⭐ 2Step pattern Distinction
 quoteData?: {
 responseId: string;
 offerId: string;
 offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
 };
 selectedSeats: SeatSelection[];
 // step 2 or Pattern from C Required
 paymentMethod?: 'card' | 'cash' | 'agt' | 'voucher';
 paymentType?: 'Card' | 'Cash' | 'AGT' | 'Voucher' | 'Ag'; // TR: Ag
 card?: { ... };
 agentDeposit?: { ... };
 voucher?: { ... };
 amount?: {
 currencyCode: string;
 amount: number;
 };
}
```

### Confirm API Response (step 1)

```typescript
// 2Step pattern, step 1 when Complete
{
 success: true;
 orderId: string;
 message: 'Seat hold Complete. Payment Progress.';
 seatStatus: 'HN' | 'HD';
 requiresPayment: true;
 paymentAmount: number;
 currency: string;
 nextStep: 2; // step 2 Call Required
 orderItemIds?: string[]; // ⭐ v3.25.0: OrderItemIDs for Step 2 PaymentList
 // ⭐ SQ/AY (Pattern B): quoteData Return → from PaymentPopup Re-Use
 quoteData?: {
 responseId: string;
 offerId: string;
 offerItems: Array<{ offerItemId: string; paxRefId: string[] }>;
 };
}
```

---

## ⚠️ CRITICAL: Precautions

### 0. seat-availability API owner restriction (PolarHub)

```typescript
// ❌ Wrong pattern - order in Internal owner Include
body: JSON.stringify({
 transactionId,
 order: { orderId, owner }, // "order.property owner should not exist" Error!
 paxList: [...],
});

// ✅ Correct pattern - owner order in External Separate Pass
body: JSON.stringify({
 transactionId,
 order: { orderId }, // owner Exclude!
 owner, // Separate Pass
 paxList: [...],
});
```

### 1. step Parameter Required (2Step pattern)

```typescript
// ❌ Wrong e.g. - step without Call
await confirmSeatPurchase({
 transactionId,
 orderId,
 owner: 'AF', // Pattern A
 // step Missing!
});

// ✅ Correct e.g.
await confirmSeatPurchase({
 transactionId,
 orderId,
 owner: 'AF',
 step: 1, // 1 Call
 // ... 나머
});
```

### 2. seatSelection Required Include

```typescript
// ⭐ OrderChange when Request seatSelection Required!
const offerItems = selectedSeats.map(seat => ({
 offerItemId: seat.offerItemId,
 paxRefId: [seat.paxId],
 seatSelection: { // Required!
 column: seat.column,
 row: seat.row,
 },
}));
```

### 3. Success Code Confirm (isSuccessCode)

```typescript
// multiple format's Success Code Process
function isSuccessCode(code?: string): boolean {
 if (!code) return true;
 return ['OK', '00000', 'SUCCESS'].includes(code);
}
```

### 4. TK Carrier Paid/Free Branch

```typescript
// TK PriceDepending on Pattern Branch
function getAirlineConfig(owner: string, isPaid: boolean): PatternConfig {
 if (owner === 'TK') {
 return isPaid ? AIRLINE_CONFIG.TK_PAID : AIRLINE_CONFIG.TK_FREE;
 }
 return AIRLINE_CONFIG[owner] || AIRLINE_CONFIG.SQ;
}
```

---

## Component Use

### PostTicketingSeatPopup

```tsx
<PostTicketingSeatPopup
 isOpen={showSeatPopup}
 onClose={() => setShowSeatPopup(false)}
 orderId={orderId}
 owner={owner}
 transactionId={transactionId}
 passengers={passengers}
 onSuccess={() => {
 refreshOrder();
 setShowSeatPopup(false);
 }}
/>
```

---

### 5. AF/KL Quote must use OfferPrice RS OfferItemID & TotalAmount (v3.25.0)

```typescript
// ⚠️ CRITICAL: OfferPrice returns NEW OfferItemIDs (different from SeatAvailability!)
// Must extract PricedOffer.OfferItem[].OfferItemID and return in quoteData.offerItems
// Must use PricedOffer.TotalPrice.TotalAmount for price (not selectedSeats.reduce()!)

// ✅ Correct pattern
const pricedOfferItems = response.PricedOffer?.OfferItem || [];
const offerItems = pricedOfferItems.length > 0
  ? pricedOfferItems.map(item => ({
    offerItemId: item.OfferItemID,  // ⭐ OfferPrice RS ID!
    paxRefId: item.PaxRefID || item.FareDetail?.[0]?.PaxRefID || [],
  }))
  : selectedSeats.map(seat => ({ offerItemId: seat.offerItemId, paxRefId: [seat.paxId] }));

const offerPriceTotal = response.PricedOffer?.TotalPrice?.TotalAmount;
const totalPrice = offerPriceTotal?.Amount ?? selectedSeats.reduce((sum, s) => sum + s.price, 0);

// Return offerItems in quoteData!
return {
  ...result,
  quoteData: { responseId, offerId, offerItems }, // ⭐ offerItems included!
});

// ❌ Wrong pattern - using SeatAvailability OfferItemID → OrderChange sends wrong ID
totalPrice: selectedSeats.reduce((sum, s) => sum + s.price, 0),  // Wrong amount!
quoteData: { responseId, offerId },  // Missing offerItems → fallback to SeatAvail IDs!
```

### 6. Step 2 Payment Amount Source (v3.23.0) (renumbered from 5)

```typescript
// ⚠️ CRITICAL: Step 2 payment amount must use MW response total from Step 1!
// NOT the seat/service quote price!

// ✅ Correct pattern - Use MW OrderChange response TotalPrice
const mwTotal = res?.Order?.TotalPrice?.TotalAmount;
paymentAmount: mwTotal?.Amount || fallbackPrice,  // ⭐ MW total!
currency: mwTotal?.CurCode || 'KRW',

// ✅ TR 1-step: bookingTotal + seatPrice
const totalPrice = (ctx.totalAmount?.amount || 0) + seatPrice;  // TR only

// ❌ Wrong pattern
paymentAmount: selectedSeats.reduce((sum, s) => sum + s.price, 0), // Quote price only!
```

### 6. TicketingWithServiceModal quoteData Pass (Before ticketing Seat)

```typescript
// from handleSeatConfirm confirmData.quoteData Save Required!
const confirmData = await confirmResponse.json();
if (confirmData.quoteData) {
 setQuoteData(confirmData.quoteData); // ⭐ from PaymentPopup Re-Use
}

// in PaymentPopup existingQuote Pass → Quote Re-Call Prevention
<PaymentPopup
 existingQuote={quoteData ? {
 responseId: quoteData.responseId,
 offerId: quoteData.offerId,
 owner,
 // ...
 } : undefined}
 skipInternalQuote={!!existingQuote}
/>
```

### 7. AF/KL (Pattern A) OrderChange RQ structure (v3.25.0)

**Step 1 (1st OrderChange - Seat Hold)**:
- Do NOT include `seatSelection` in OfferItems — OfferPrice already passed seat info to MW
- Must include empty arrays: `paxList: []`, `contactInfoList: []`, `paymentList: []`

```typescript
// ✅ Correct pattern (Pattern A: AF/KL)
const isPatternA = config.pattern === 'A';
const finalOfferItems = isPatternA
  ? offerItemsWithSeatSelection.map(({ seatSelection: _removed, ...rest }) => rest)
  : offerItemsWithSeatSelection;

changeRequest = {
  transactionId, orderId,
  changeOrderChoice: {
    acceptSelectedQuotedOfferList: {
      selectedPricedOffer: [{ offerId, owner, responseId, offerItems: finalOfferItems }],
    },
  },
  paxList: [], contactInfoList: [], paymentList: [], // ⚠️ Required!
};

// ❌ Wrong pattern - includes seatSelection for AF/KL
offerItems: items.map(i => ({ ...i, seatSelection: { column, row } })), // Not needed for Pattern A!
```

**Step 2 (2nd OrderChange - Payment)**:
- `PaymentList.orderItemId` must contain actual IDs from 1st OC response
- Must include `paxList: []`, `contactInfoList: []`
- **⚠️ v3.26: AF/KL Step 2 must use `Cash` type!** Card fields (cardCode, cardNumber, etc.) are rejected by MW
- **seatOrderItemIds data flow**: `seat-purchase/confirm` → `TicketingWithServiceModal` state → `PaymentPopup` → `order-change-ticketing`

```typescript
// ✅ Correct pattern (v3.26) - Cash type + orderItemIds from Step 1
const isPatternAStep2 = ['AF', 'KL'].includes(owner) && body.seatOrderItemIds?.length;
if (isPatternAStep2) {
  changeRequest = {
    transactionId, orderId,
    changeOrderChoice: { acceptRepricedOrder: { offerRefId: [orderId] } },
    paymentList: [{
      type: 'Cash',  // ⚠️ Must be Cash! Card fields rejected by MW!
      amount: step2Amount, curCode: step2CurCode,
      orderItemId: body.seatOrderItemIds, // ⚠️ From seat-purchase/confirm Step 1!
      offerItemId: [], paxRefId: [],
    }],
    paxList: [], contactInfoList: [], // ⚠️ Required!
  };
}

// ❌ Wrong pattern - Card type for AF/KL Step 2
paymentList: [{ type: 'Card', cardCode: 'VI', ... }], // MW 400: cardCode should not exist!

// ❌ Wrong pattern - empty orderItemId
orderItemId: [], // MW cannot identify which items to charge!
```

---

## Component Use (Before ticketing vs After ticketing)

### PostTicketingSeatPopup (After ticketing)

```tsx
<PostTicketingSeatPopup
 isOpen={showSeatPopup}
 onClose={() => setShowSeatPopup(false)}
 orderId={orderId}
 owner={owner}
 transactionId={transactionId}
 passengers={passengers}
 onSuccess={() => {
 refreshOrder();
 setShowSeatPopup(false);
 }}
/>
```

### TicketingWithServiceModal (Before ticketing)

```tsx
// Before ticketing Service/Seat Add Option Provide
<TicketingWithServiceModal
 isOpen={showModal}
 onClose={() => setShowModal(false)}
 orderId={orderId}
 owner={owner}
 transactionId={transactionId}
 passengers={passengers}
 baseFare={baseFare}
 currency={currency}
 orderItemRefIds={orderItemRefIds}
 onSuccess={handleSuccess}
/>
```

---

## Related files

| File | Description |
|------|------|
| `types/seat-purchase.ts` | Type definition and helper Function |
| `types/ticketing-with-service.ts` | Ticketing+Service/Seat Type |
| `lib/api/polarhub-service.ts (getSeatAvailability)` | SeatAvailability service function |
| `lib/api/polarhub-service.ts (getSeatPurchaseQuote)` | Quote service function |
| `lib/api/polarhub-service.ts (confirmSeatPurchase)` | Confirm service function |
| `components/booking/PostTicketingSeatPopup.tsx` | After ticketing Seat purchase Popup |
| `components/booking/TicketingWithServiceModal.tsx` | Before ticketing Service/Seat Modal |
