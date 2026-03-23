# Post-ticketing (Post-Booking Ticketing) API Mapping

## Overview

unPayment Hold Status in Booking About Payment and Ticketing Feature.
**WF_HELD_CONFIRM** in Workflow Corresponding.

## Carrier per Group API Flow

| Group | Carrier | API Flow | Notes |
|------|--------|----------|------|
| **Group A** | LH, LX, OS, EK, QR, BA, AA | OrderReshop → OrderChange | Fare recalculation Required |
| **Group B** | KE, HA, SQ, **AY**, TK | OrderQuote → OrderChange | Fare recalculation Required |
| **Group C** | AF, KL, TR, AS | Directly OrderChange | Fare recalculation not required |

**⚠️ AY Group B!** OrderQuote Required하 `OrderItemRefID` Required.

## Payment method

| Payment method | Supported carriers |
|-----------|------------|
| Card | All Carrier (TR Exclude) |
| Cash | All Carrier (TR Exclude) |
| AGT (Agent Deposit) | TR Dedicated |
| Voucher | AF, KL |
| Voucher+Cash | AF, KL |

---

## ⚠️ CRITICAL: API Request/Response structure

### OrderQuote Request (Group B: KE, HA, SQ, AY, TK)

```typescript
const quoteRequest = {
 transactionId,
 orderId, // ⚠️ Top-level orderId Required!
 repricedOrderId: {
 orderId,
 orderItemRefId, // ⚠️ CRITICAL: Required! booking._orderData.orderItemIds Use
 },
};
```

### OrderQuote Response structure

```typescript
// ⚠️ response Wrapper Exists! RepricedOffer Use (OrderQuote Not!)
interface MiddlewareOrderQuoteResponse {
 transactionId: string;
 response: {
 ResultMessage: { Code: string; Message?: string; };
 RepricedOffer?: {
 ResponseID: string;
 OfferID: string;
 Owner: string;
 TotalPrice?: {
 TotalAmount?: { Amount: number; CurCode: string; } // ⚠️ SimpleCurrencyPrice Not!
 };
 };
 };
}
```

### OrderChange Request (All Group)

```typescript
const changeRequest = {
 transactionId,
 orderId,
 changeOrderChoice: {
 acceptRepricedOrder: {
 offerRefId, // ⚠️ Minimum 1items Element Required!
 },
 },
 paymentList, // ⚠️ Must be outside changeOrderChoice!
};
```

### AY Two-Step OrderChange (Seat/Service Include)

AY Always **2Step**로 must Split .

**Step 1 (acceptOnly)**
`AcceptSelectedQuotedOfferList` or `AcceptRepricedOrder`send only
`paymentList` None

**Step 2 (Payment)**
`OrderID + PaymentList`send only
`changeOrderChoice`, `quoteData` **Include Prohibited**

⚠️ Already Seat/Service to OrderChange Add Case
`PaymentPopup` Step 1 **cases너뛰and Step 2 only Call**must .

```typescript
// Step 2 (AY): paymentList only
const changeRequest = {
 transactionId,
 orderId,
 paymentList: [{
 type: 'Card',
 amount,
 curCode: 'KRW',
 orderItemId: [],
 offerItemId: [],
 paxRefId: [],
 }],
};
```

### ⚠️ paymentList Structure (OpenAPI and different!)

```typescript
// ❌ Wrong Structure (OpenAPI Spec)
{
 paymentMethod: { card: { ... } },
 amount: { currencyCode: "KRW", amount: 1453900 }
}

// ✅ Correct Structure (Actual Middleware)
{
 type: "card", // string! 'card' | 'cash' | 'agt' | 'voucher'
 amount: 1453900, // Number! (Object Not)
 curCode: "KRW", // currencyCode Not!
 // Card Dedicated field (Same in Level Placement)
 cardCode: "VI",
 cardNumber: "4111...",
 cardHolderName: "HONG GILDONG",
 expiration: "1225",
 seriesCode: "123"
}
```

### OrderChange Response structure

```typescript
// ⚠️ response Wrapper Exists!
interface MiddlewareOrderChangeResponse {
 transactionId: string;
 response: {
 ResultMessage: { Code: string; Message?: string; };
 TicketDocInfo?: Array<{ TicketDocNbr?: string; Type?: string; }>;
 };
}
```

---

## Data Flow

```
getBookingDetail() → orderItemIds Extract
 ↓
booking page → in PaymentPopup Pass
 ↓
PaymentPopup.tsx → getOrderQuote() service function Call
 ↓
polarhub-service.ts → repricedOrderId.to orderItemRefId Pass
 ↓
Middleware → OrderQuote API Call
```

---

## 주 Occurs Error

### 1. "paymentList should not exist" (OrderChange)
- **Cause**: `paymentList` `changeOrderChoice` in Internal Position
- **Resolution**: `changeOrderChoice` Bar깥 to Top-level Navigate

### 2. "offerRefId must contain at least 1 elements"
- **Cause**: Group from C Empty array Pass
- **Resolution**: All from Group `[orderId]` Use (Minimum 1items)

### 3. "Failed to read request" (OrderQuote)
- **Cause**: `OrderItemRefID` Missing
- **Resolution**: `repricedOrderId.orderItemRefId` `booking._orderData.orderItemIds` Pass

### 4. "Fare during recalculation Error Occurs."
- **Cause**: Middleware Response structure mismatch
- **Resolution**: `response` Wrapper Process + `RepricedOffer` Structure Support

### 5. "paymentMethod should not exist" / "type must be a string"
- **Cause**: paymentList Structure mismatch (OpenAPI vs Actual)
- **Resolution**: flattening Structure Use
 - ❌ `paymentMethod: { card: {...} }`
 - ✅ `type: "card", cardCode: "VI", ...`
 - ❌ `amount: { currencyCode, amount }`
 - ✅ `amount: 1453900, curCode: "KRW"`

### 6. "offerList should not exist" (OrderChange - Add service)
- **Cause**: `acceptSelectedQuotedOfferList` Structure Error
- **Resolution**: `offerList` instead `selectedPricedOffer` Array Use
 - ❌ `acceptSelectedQuotedOfferList: { offerList: [...] }`
 - ✅ `acceptSelectedQuotedOfferList: { selectedPricedOffer: [...] }`

### 7. "selectedOffer must be an array" (OrderQuote)
- **Cause**: `selectedOffer` to Object Pass
- **Resolution**: `selectedOffer` **Array**must be Does
 - ❌ `selectedOffer: { responseId, offerId, owner, offerItems }`
 - ✅ `selectedOffer: [{ responseId, offerId, owner, offerItems }]`

### 8. AY Seat Post-ticketing 1 OrderChange Failure (SeatSelection Missing)
- **Cause**: OrderQuote from the response `ReshopOffers.AddOfferItem.Service.SelectedSeat` `quoteData.offerItems[].seatSelection`to Mappingdoes not
- **Resolution**: SelectedSeat exists when only `seatSelection` Include
 - `Column` → `column`, `Row` → `row`

### 9. AY 2 OrderChange Failure (changeOrderChoice Include)
- **Cause**: Step in 2 `changeOrderChoice` or `quoteData` Include
- **Resolution**: **OrderID + PaymentList** Transmission (Empty array Field Include)

### 10. Service after purchase Payment Error (Add Step not required)
- **Cause**: AY, SQ etc.from Add Step after Call Confirm Call
- **Resolution**: Add Step **AF, KL** Required!
 - Group A/B/D: Quote → OrderChange (with Payment) - **Single OrderChange**
 - Group C (AF, KL): Quote → Add (No payment) → Confirm (Payment) - **2Step**

### 11. Group C (AF/KL) service-purchase 2nd OrderChange never called (v3.24.0)
- **Cause**: `processServicePurchase()` Group C branch only checks `addResponse.requiresPayment && body.payment`
  - FE doesn't send `body.payment` on initial call → condition is `true && undefined` = false
  - Falls through to "free service" return → `requiresPayment` missing → PaymentPopup never shows
- **Resolution**: Add 3-branch logic for Group C:
 ```typescript
 // ✅ Correct pattern - 3 branches
 if (addResponse.requiresPayment && body.payment) {
   // Full flow (called from main route with payment)
   await callInternalAPI('/service-purchase/confirm', { ...payment, orderItemRefIds });
 } else if (addResponse.requiresPayment) {
   // ⭐ Add succeeded, return data for FE PaymentPopup
   return {
     success: true, requiresPayment: true,
     paymentAmount: addResponse.paymentAmount || quoteData?.totalPrice,
     currency: addResponse.currency || quoteData?.currency || 'KRW',
     orderChangeData: addResponse.orderChangeData,
     quoteData: { responseId, offerId, offerItems },
   });
 } else {
   // Free service
   return { success: true, orderId, message: 'Service added.' });
 }

 // ❌ Wrong pattern - 2 branches only (PaymentPopup data never returned!)
 if (addResponse.requiresPayment && body.payment) { /* ... */ }
 return { success: true, orderId });  // requiresPayment missing!
 ```
- **Also**: `ServicePurchaseModal.handleServicePayment` must pass `orderItemRefIds`:
 ```typescript
 orderItemRefIds: addResponse?.orderChangeData?.orderItemRefIds,
 ```
- **Payment amount priority**: `addResponse.paymentAmount` (MW response) > `quoteData.totalPrice` (quote)

### 12. ServiceList/Quote API infinite pending (ref Gate Prohibited!)
- **Cause**: `fetchingRef.current`로 effect Gate Use + React Strict Mode
- **Symptom**: Strict from Mode cleanup → re-mount synchronous Execution, finally Async → ref Reset되기 before in effect Re-Execution
- **Resolution**: ref Gate Remove, AbortController only Use
 ```typescript
 // ❌ Wrong pattern (infinite pending occurs!)
 if (fetchingRef.current) return; // Strict from Mode issue!
 fetchingRef.current = true;

 // ✅ Correct pattern
 abortControllerRef.current?.abort();
 const abortController = new AbortController();

 const fetchData = async () => {
 try {
 const response = await fetch(url, { signal: abortController.signal });
 if (abortController.signal.aborted) return; // ⭐ Status Change Prevention
 // ...
 } finally {
 if (!abortController.signal.aborted) setIsLoading(false);
 }
 };
 fetchData();

 return () => abortController.abort();
 ```

### 13. OrderQuote Duplicate Call (Service purchase time)
- **Cause**: `/service-purchase`from Already Quote Call했는데, PaymentPopup 또 `/api/order-quote` Call
- **Flow**:
 1. ServicePurchaseModal → `/service-purchase` → Internal `/service-purchase/quote` Call (1)
 2. in Response `requiresPayment: true` + `quoteData` Return
 3. PaymentPopup 열림 → `needsQuote=true`라 `/api/order-quote` Call (2 - Duplicate!)
- **Resolution**: in PaymentPopup `skipInternalQuote` + `existingQuote` prop Add
 ```typescript
 // PaymentPopup Props
 interface PaymentPopupProps {
 // ...
 existingQuote?: TicketingQuote;
 skipInternalQuote?: boolean; // ⭐ Core! truewhen Internal Quote Call cases너뜀
 }

 // PaymentPopup Internal - skipInternalQuote=truewhen Quote cases너뜀
 useEffect(() => {
 if (skipInternalQuote) {
 if (existingQuote) {
 setQuote(existingQuote);
 setStep('fare');
 } else {
 setStep('form'); // Quote without to Bar Payment Form
 }
 return;
 }
 // ...
 }, [skipInternalQuote, existingQuote, ...]);

 // ServicePurchaseModal - skipInternalQuote={true} Required!
 <PaymentPopup
 existingQuote={existingQuote}
 skipInternalQuote={true} // ⭐ Duplicate Call Prevention!
 ...
 />
 ```
- **Add Modify**: in PaymentPopup AbortController Pattern Applied (React Strict Mode Handling)

### 14. Service when purchase Wrong API Call (acceptRepricedOrder Error)
- **Error**: `changeOrderChoice.acceptRepricedOrder.offerRefId must contain at least 1 elements`
- **Cause**: PaymentPopup to Default-like `/api/order-change-ticketing` (Post-ticketing) Call
 - Post-ticketing: `acceptRepricedOrder.offerRefId` Use
 - Service purchase: `acceptSelectedQuotedOfferList.selectedPricedOffer` Use
- **Resolution**: in PaymentPopup `onPaymentSubmit` Custom Payment Handler prop Add
 ```typescript
 // PaymentPopup Props
 interface PaymentPopupProps {
 // ...
 onPaymentSubmit?: (formData: PaymentFormData) => Promise<PaymentResult>;
 }

 // ServicePurchaseModal - Custom Payment Handler
 const handleServicePayment = async (formData: PaymentFormData) => {
 // ⭐ Direct service function call instead of fetch
 const result = await confirmServicePurchase({
 transactionId,
 orderId,
 owner,
 quoteData: addResponse?.quoteData, // Service Quote Data
 selectedServices: [...],
 paymentMethod: formData.paymentMethod,
 card: formData.card,
 amount: { currencyCode, amount },
 });
 // ...
 };

 <PaymentPopup
 onPaymentSubmit={handleServicePayment} // ⭐ Core! Custom Payment Handler
 skipInternalQuote={true}
 existingQuote={existingQuote}
 ...
 />
 ```

### 15. Service purchase Payment Amount 0to Transmission
- **Error**: `{"success":false,"error":"Payment Amount Required.","message":""}`
- **Cause**: `addResponse?.paymentAmount` undefined when fallback 0
 ```typescript
 // ❌ Wrong code
 amount: addResponse?.paymentAmount || 0 // paymentAmount if not present 0
 ```
- **Resolution**: `selectedServices`from Price Total fallbackto Use
 ```typescript
 // ✅ Correct code
 const totalFromServices = selectedServices.reduce((sum, svc) => sum + (svc.price || 0), 0);
 const paymentAmount = addResponse?.paymentAmount || totalFromServices;
 const currency = addResponse?.currency || selectedServices[0]?.currency || 'KRW';

 // Amount Verify
 if (paymentAmount <= 0) {
 throw new Error('Payment Amount 0. Service Price Confirm.');
 }

 amount: {
 currencyCode: currency,
 amount: paymentAmount,
 }
 ```

### 16. paymentList type capitalization and Required Field Missing
- **Error**: `{"statusCode":500,"message":"Internal server error"}` (Middleware 500 Error)
- **Cause 1**: `paymentList.type` Lowercase (`card`, `cash`)로 Transmitted
 - Middleware to Uppercase Start Value 기: `Card`, `Cash`, `AGT`, `Voucher`
- **Cause 2**: `paymentList` Required Field Missing
 - Service when purchase `orderItemId`, `offerItemId`, `paxRefId` Field Required (Empty arrayeven if)
- **Expected Request structure**:
 ```json
 "paymentList": [
 {
 "type": "Cash", // ⭐ to Uppercase Start!
 "amount": 90000,
 "curCode": "KRW",
 "orderItemId": [], // ⭐ Required (Empty array)
 "offerItemId": [], // ⭐ Required (Empty array)
 "paxRefId": [] // ⭐ Required (Empty array)
 }
 ]
 ```
- **Resolution**:
 ```typescript
 // ⚠️ type uppercase conversion map
 const paymentTypeMap: Record<string, 'Card' | 'Cash' | 'AGT' | 'Voucher'> = {
 card: 'Card',
 cash: 'Cash',
 agt: 'AGT',
 voucher: 'Voucher',
 voucher_cash: 'Voucher',
 };

 const paymentItem = {
 type: paymentTypeMap[body.paymentMethod] || 'Cash',
 amount: body.amount.amount,
 curCode: body.amount.currencyCode,
 // ⭐ Required for service purchase (even if empty array!)
 orderItemId: [],
 offerItemId: [],
 paxRefId: [],
 };
 ```
- **Modify Position**:
 - `polarhub-service.ts (confirmServicePurchase)` - Service purchase Payment
 - `polarhub-service.ts (processTicketing)` - Post-ticketing Payment
 - `middleware-client.ts` (shared types) - Type definition

### 17. Quote from the response ResponseID/OfferID Usenot notand fallback Value Use
- **Error**: Middleware 500 Error or Wrong OrderChange Request
- **Cause**: `processServicePurchase()`from Quote Response Value instead fallback Use
 ```typescript
 // ❌ Wrong code - transactionId/orderId fallbackto Use!
 quoteData: {
 responseId: quoteData?.responseId || body.transactionId, // ❌
 offerId: quoteData?.offerId || orderId, // ❌
 ...
 }
 ```
- **issue점**:
 - from QuoteRS receive Actual `OfferID`와 `ResponseID` Usemust be done
 - `transactionId`와 `orderId` Quote and irrelevant Value!
 - from Middleware Wrong to Data OrderChange Request
- **Resolution**:
 1. Quote Response validation Add
 ```typescript
 if (!quoteData?.responseId || !quoteData?.offerId) {
 return {
 success: false,
 error: 'Quote from Response responseId or offerId Missing.',
 }, { status: 400 });
 }
 ```
 2. fallback Removeand Actual Value Use
 ```typescript
 // ✅ Correct code - QuoteRS Value Directly Use!
 quoteData: {
 responseId: quoteData.responseId,
 offerId: quoteData.offerId,
 offerItems: quoteData.offerItems,
 }
 ```
- **Modify Position**:
 - `polarhub-service.ts (processServicePurchase)` - 3군데 (Add, Response Return, Confirm)
 - `polarhub-service.ts (confirmServicePurchase)` - 1군데

### 18. Service when purchase "quoteData Required" Error
- **Error**: `{"success":false,"error":"quoteData Required.","message":""}`
- **Cause**: `processServicePurchase()`from `quoteData?.responseId` exists when only quoteData Include
 ```typescript
 // ❌ Wrong code
 quoteData: quoteData?.responseId ? {
 responseId: quoteData.responseId,
 offerId: quoteData.offerId,
 offerItems: quoteData.offerItems,
 } : undefined, // responseId if not present undefined → /from confirm Verify Failure!
 ```
- **Resolution**: Always quoteData Includeand fallback Value Use
 ```typescript
 // ✅ Correct code - Always quoteData Include!
 quoteData: {
 responseId: quoteData?.responseId || body.transactionId,
 offerId: quoteData?.offerId || orderId,
 offerItems: quoteData?.offerItems || body.selectedServices.map(svc => ({
 offerItemId: svc.offerItemId,
 paxRefId: [svc.paxId],
 })),
 },
 ```
- **Modify Position**:
 1. `polarhub-service.ts (processServicePurchase)` - Group C Add Step
 2. `polarhub-service.ts (processServicePurchase)` - Group A/B/D Payment information absent when Return
 3. `polarhub-service.ts (processServicePurchase)` - Group A/B/D Confirm when Call

### 19. Service purchase Quote Response Parsing Failure (ReshopOffers vs RepricedOffer)
- **Error**: Quote from Response `responseId`, `offerId` `undefined`, "Quote/Estimate Retrieval Failure"
- **Cause**: OrderQuote API Response structure **ModeDepending on different!**
 - **Post-ticketing (repricedOrderId Mode)**: `response.RepricedOffer` (Single Object)
 - **Service purchase (selectedOffer Mode)**: `response.ReshopOffers` (Array!)

 **⚠️ CRITICAL**: Both `response` Wrapper Exists! Differences Internal Field name only different!

 ```typescript
 // ❌ Wrong code - Post-ticketing Response structure to as-is Use
 interface MiddlewareOrderQuoteResponse {
 transactionId: string;
 response: {
 ResultMessage: {...};
 RepricedOffer?: {...}; // ❌ selectedOffer Mode ReshopOffers!
 };
 }

 // ❌❌ more Wrong code - response Wrapper absent다and 착each!
 const resultCode = quoteResponse.ResultMessage?.Code; // undefined!
 ```
- **Resolution**:
 ```typescript
 // ✅ Correct code - Middleware Always response Wrapper Use!
 interface MiddlewareOrderQuoteResponse {
 transactionId: string;
 response: { // ⭐ response Wrapper Required!
 ResultMessage: { Code: string; Message?: string; };
 ReshopOffers?: Array<{ // ⭐ selectedOffer Modefor!
 ResponseID: string;
 OfferID: string;
 Owner: string;
 TotalPrice?: { TotalAmount?: { Amount: number; CurCode: string; } };
 AddOfferItem?: Array<{ // RepricedOfferItem Not!
 OfferItemID: string;
 PaxRefID?: string[];
 }>;
 }>;
 };
 }

 // Parsing Logic - response. Required!
 const resultCode = quoteResponse.response?.ResultMessage?.Code;
 const reshopOffer = quoteResponse.response?.ReshopOffers?.[0];
 response = {
 responseId: reshopOffer?.ResponseID,
 offerId: reshopOffer?.OfferID,
 offerItems: reshopOffer?.AddOfferItem?.map(...),
 };
 ```
- **Modify Position**:
 - `polarhub-service.ts (getServicePurchaseQuote)` - Response Type and Parsing Logic
- **Core Differences**:
 | Item | Post-ticketing (repricedOrderId) | Service purchase (selectedOffer) |
 |------|-------------------------|---------------------------|
 | Response Wrapper | `response.` Exists | `response.` Exists (Same!) |
 | Offer Field | `response.RepricedOffer` (Object) | `response.ReshopOffers` (Array) |
 | OfferItem | `RepricedOfferItem` | `AddOfferItem` |

### 20. Service purchase Confirm Response Parsing Failure (response Wrapper Missing)
- **Error**: `{"success":false,"error":"Payment processing failed","message":"Payment processing failed"}`
- **Cause**: `confirmServicePurchase()`from OrderChange from the response `response` Wrapper Processdoes not
 ```typescript
 // ❌ Wrong code - response Wrapper without Directly Access
 interface MiddlewareOrderChangeResponse {
 ResultMessage: {...}; // ❌ response No wrapper
 Response?: {...}; // ❌ Uppercase R (Actual Lowercase)
 }
 const resultCode = changeResponse.ResultMessage?.Code; // undefined!
 ```
- **Resolution**:
 ```typescript
 // ✅ Correct code - response Wrapper Required!
 interface MiddlewareOrderChangeResponse {
 transactionId: string;
 response: { // ⭐ response Wrapper!
 ResultMessage: { Code: string; Message?: string; };
 Order?: { OrderID: string; ... };
 TicketDocInfo?: Array<{...}>;
 };
 }

 // Parsing Logic - response. Required!
 const resultCode = changeResponse.response?.ResultMessage?.Code;
 const ticketDocs = changeResponse.response?.TicketDocInfo || [];
 const orderId = changeResponse.response?.Order?.OrderID;
 ```
- **Modify Position**:
 - `polarhub-service.ts (confirmServicePurchase)` - Response Type and Parsing Logic
- **Core**: Middleware **All API Response** `response` to Wrapper wrap Return!
 - OrderQuote: `response.ReshopOffers`, `response.RepricedOffer`
 - OrderChange: `response.ResultMessage`, `response.TicketDocInfo`

---

## Post-Booking Service purchase (WF_*_SERVICE)

### ⚠️ CRITICAL: Per carrier Flow different!

| Group | Carrier | Flow | Notes |
|------|--------|------|------|
| **A** | EK, LH | `ServiceList → OfferPrice → OrderChange (with Payment)` | Single OrderChange |
| **B** | AY, SQ | `ServiceList → OrderQuote → OrderChange (with Payment)` | Single OrderChange |
| **C** | AF, KL | `ServiceList → OfferPrice → OrderChange (Add) → OrderChange (Pay)` | **2Step!** |
| **D** | HA | `ServiceList → OrderQuote → OrderChange (with Payment)` | Single OrderChange |

### ⚠️ Add Step AF, KL!

```typescript
import { requiresAddStep } from '@/types/service-purchase';

if (requiresAddStep(owner)) {
 // Group C (AF, KL): Quote → Add → Confirm (2Step)
} else {
 // Group A/B/D: Quote → Confirm (Single OrderChange)
}
```

### ⚠️ Quote Step Required! ServiceList 직after OrderChange Call Prohibited!

```typescript
// ❌ Wrong Flow (Quote Missing!)
ServiceList → OrderChange (Add)

// ✅ Correct Flow
ServiceList → OrderQuote/OfferPrice → OrderChange
```

### Quote when Call ServiceList Data Required

```typescript
// ServicePurchaseModal.tsx
import { processServicePurchase } from '@/lib/api/polarhub-service';

const purchaseResult = await processServicePurchase({
 // ⭐ ServiceList Response Data Pass (Quote in Call Required!)
 serviceListData: {
 responseId: serviceData._apiData.responseId,
 offerId: serviceData._apiData.offerId,
 owner: serviceData._apiData.owner,
 },
 selectedServices: [...],
});
```

### OrderChange Request structure (Add service)

```typescript
// ⚠️ CRITICAL: selectedPricedOffer Use! (offerList Not!)
const changeRequest = {
 transactionId,
 orderId,
 changeOrderChoice: {
 acceptSelectedQuotedOfferList: {
 selectedPricedOffer: [{ // ✅ Correct Field name
 offerId: quoteData.offerId || orderId,
 owner,
 responseId: quoteData.responseId, // Quote exists Case
 offerItems: [...],
 }],
 },
 },
};
```

### API Spec (AcceptSelectedQuotedOfferListDto)

```yaml
AcceptSelectedQuotedOfferListDto:
 properties:
 selectedPricedOffer: # ⚠️ offerList Not!
 type: array
 items:
 $ref: '#/components/schemas/SelectedPricedOfferDto'
 required:
 - selectedPricedOffer
```
