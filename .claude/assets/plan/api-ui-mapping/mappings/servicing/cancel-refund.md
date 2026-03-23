# Cancel/Refund API-UI Mapping

> Cancel API: `POST /middleware/polarhub/order/cancel`
> Refund Quote: `POST /middleware/polarhub/order-reshop` (with cancelOrderRefId)
> Response: `OrderCancelRS`, `OrderReshopRS`

---

## API Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Before ticketing Cancellation (Cancel) │
│ OrderRetrieve → OrderCancel │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Ticketing Same day Cancellation (VOID) - REFUND and Same Workflow │
│ OrderRetrieve → OrderReshop (cancelOrderRefId) → OrderCancel │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Refund (REFUND) │
│ OrderRetrieve → OrderReshop (cancelOrderRefId) → OrderCancel │
└─────────────────────────────────────────────────────────────────┘
```

> **Note**: VOID and REFUND Same API Workflow Use.
> Differences Ticketing Same day in Whether According to UI Display and penalty Amount.

---

## 0. Payment/Ticketing Status per Determine Logic ⭐

OrderRetrieve from Response Payment/Ticketing Status Determine Logic.

### per Determine Order

```typescript
interface OrderStatus {
 isTicketed: boolean; // Ticketing complete
 isPaid: boolean; // Payment Complete (Ticketing without)
 isHeld: boolean; // unPayment Hold
 canCancel: boolean; // Cancel Available
 canVoidRefund: boolean; // VOID/REFUND Available
}

function determineOrderStatus(orderViewRS: OrderViewRS): OrderStatus {
 const order = orderViewRS.Order;

 // 1priority: TicketDocList Confirm (Ticketing complete)
 const hasTicket = order.TicketDocList && order.TicketDocList.length > 0;

 // 2priority: PaymentList Confirm (Payment Complete, Ticketing None - TR Case)
 const hasPaidWithoutTicket = !hasTicket &&
 order.PaymentList &&
 order.PaymentList.length > 0;
 // TODO: PaymentList.Status Success Code Confirm Required

 // Status Determine
 const isTicketed = hasTicket;
 const isPaid = hasPaidWithoutTicket;
 const isHeld = !isTicketed && !isPaid;

 // Available Action Determine
 const canCancel = isHeld; // unPayment Hold only Cancel Available
 const canVoidRefund = isTicketed; // if Ticketing only VOID/REFUND Available

 return {
 isTicketed,
 isPaid,
 isHeld,
 canCancel,
 canVoidRefund,
 };
}
```

### per Status Action

| Status | TicketDocList | PaymentList | Available Action | Example Carrier |
|------|:-------------:|:-----------:|------------|------------|
| **HELD (unPayment)** | None | None | Cancel | All Carrier |
| **TICKETED (Ticketing)** | Exists | Exists | VOID/REFUND | SQ, AF, etc. |
| **PAID (Payment, unTicketing)** | None | Exists | **None** | **TR (Scoot)** |

### TR (Scoot) special Case

```
General Carrier: Payment → Ticketing (TicketDocList Create) → VOID/REFUND Available
TR (Scoot): Payment → Ticketing (PaymentList) → Refund Not possible
```

---

## 1. Cancel (Before ticketing Cancellation)

### Response Structure (OrderCancelRS)

```
OrderCancelRS
├── ResultMessage
│ ├── Code
│ └── Message
├── Recipient
├── PointOfSale
└── TransactionID
```

### Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| success | `ResultMessage.Code === "OK"` | boolean | - |
| orderId | Requestimported from | - | - |
| pnr | Requestimported from | - | - |
| status | "CANCELLED" | FixedValue | - |
| statusLabel | "CancellationComplete" | FixedValue | - |
| cancelDate | Current Time | new Date() | KST |
| message | `ResultMessage.Message` or DefaultValue | - | - |

---

## 2. VOID (Ticketing Same day Cancellation)

### VOID Available Whether Confirm

```typescript
function isVoidAvailable(ticketedDate: string): boolean {
 const today = new Date().toISOString().split('T')[0];
 const ticketDate = ticketedDate.split('T')[0];
 return ticketDate === today;
}
```

### Mapping

| UI Field | source | Conversion logic | Notes |
|---------|------|----------|------|
| ticketNumbers | OrderViewRS.Order.TicketDocInfo[] | Extract | VOID Target Ticket |
| ticketedDate | OrderViewRSimported from | - | Ticketing |
| isVoidAvailable | Calculate | Ticketing Same day Whether | - |
| voidedTickets | from Response Confirm | - | VOID Complete Ticket |
| voidDate | Current Time | new Date() | - |

---

## 3. REFUND (Refund Quote/Estimate Retrieval)

### Request (OrderReshop with cancelOrderRefId)

```typescript
interface OrderReshopRefundRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 cancelOrderRefId: string; // Refund when Retrieval Required
 actionContext: "8"; // Voluntary
}
```

### Response Structure (Refund Quote/Estimate)

```
OrderReshopRS
├── ResultMessage
├── TransactionID
├── ReshopOffers[]
│ ├── ResponseID
│ ├── OfferID
│ ├── Owner
│ ├── TotalPrice
│ │ └── TotalAmount # All/Total Expected refund amount
│ └── DeleteOrderItem[] # Delete(Refund) Target Item
│ ├── OrderItemID
│ ├── OriginalOrderItem # KRW래 order Information
│ │ └── Total
│ │ ├── Amount
│ │ └── CurCode
│ ├── PenaltyAmount # Cancellation fee
│ │ └── Total
│ │ ├── Amount
│ │ └── CurCode
│ └── ReshopDue # Expected refund amount
│ └── Total
│ ├── Amount
│ └── CurCode
└── DataLists
```

### RefundQuote Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| originalFare | `ReshopOffers[].DeleteOrderItem[].OriginalOrderItem.Total.Amount` | Total | Original fare |
| penalty | `ReshopOffers[].DeleteOrderItem[].PenaltyAmount.Total.Amount` | Total | Cancellation fee |
| refundAmount | `ReshopOffers[].DeleteOrderItem[].ReshopDue.Total.Amount` | Total | Expected refund amount |
| currency | `ReshopOffers[].DeleteOrderItem[].ReshopDue.Total.CurCode` | - | Currency |
| responseId | `ReshopOffers[].ResponseID` | - | Refund when Progress Required |
| offerId | `ReshopOffers[].OfferID` | - | Refund when Progress Required |

### per Passenger Refund Detail (RefundBreakdown)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| paxId | `OrderItem[].PaxRefID` | - | - |
| passengerName | DataLists Connection | - | - |
| ptc | DataLists.PaxList[].Ptc | - | - |
| ticketNumber | TicketDocInfo[].TicketDocNbr | - | - |
| originalFare | OrderItem[].Price.TotalAmount | - | items Fare |
| penalty | Calculate (비율 분배) | - | items Fee |
| refundAmount | originalFare - penalty | Calculate | items Refundamount |

---

## 4. Refund Amount Calculate Logic

```typescript
interface RefundCalculation {
 originalFare: number;
 penalty: number;
 refundAmount: number;
 currency: string;
 responseId: string;
 offerId: string;
}

function calculateRefund(
 response: OrderReshopRS
): RefundCalculation {
 const reshopOffer = response.ReshopOffers?.[0];

 if (!reshopOffer) {
 throw new Error('No reshop offer found');
 }

 // DeleteOrderItem from Array Total Calculate
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
 offerId: reshopOffer.OfferID
 };
}
```

---

## 5. Button Status Determine

```typescript
function getCancelRefundButtonState(
 orderViewRS: OrderViewRS
): ButtonState {
 const order = orderViewRS.Order;
 const isTicketed = order.TicketDocInfo && order.TicketDocInfo.length > 0;

 if (!isTicketed) {
 return {
 showCancelButton: true,
 showVoidRefundButton: false,
 buttonLabel: 'Cancel',
 isEnabled: true
 };
 }

 // Ticketingif/when
 const ticketedDate = order.TicketDocInfo[0]?.IssuedDate;
 const isVoidAvailable = checkVoidAvailable(ticketedDate);

 return {
 showCancelButton: false,
 showVoidRefundButton: true,
 buttonLabel: isVoidAvailable ? 'VOID/REFUND' : 'REFUND',
 isEnabled: true
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

## 6. Per carrier Support 현황

| Carrier | Cancel | VOID | REFUND | Notes |
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
| **TR** | **O** | **X** | **X** | **after Payment Refund Not possible** |
| **KE** | **X** | **X** | **X** | unSupport |

### TR (Scoot) Special notes

TR Carrier Payment Complete also **Ticket Issuednot .** (`TicketDocList` None).
따라 Payment afterin VOID/REFUND unavailable하, **unPayment Hold from Status only Cancel Available**.

```
TR Payment Flow:
OrderCreate → Payment Complete → TicketDocList None (Ticketing )
 → in PaymentList Payment 기록 only Exists
 → Refund Not possible
```

---

## 7. Request ting Guide

### OrderCancel Request

```typescript
interface OrderCancelRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 cancelAction?: "CANCEL" | "VOID" | "REFUND";
}
```

### Refund Progress (OrderCancel with REFUND)

```typescript
interface OrderCancelRefundRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 cancelAction: "REFUND";
 refundInfo: {
 responseId: string; // from OrderReshop receive Value
 offerId: string;
 };
}
```

---

## 8. Result Process

### when Success

```typescript
interface CancelResult {
 success: true;
 orderId: string;
 pnr: string;
 status: "CANCELLED" | "VOIDED" | "REFUNDED";
 statusLabel: string;
 actionDate: string;
 message: string;
 refundAmount?: number;
 currency?: string;
}
```

### when Failure

```typescript
interface CancelError {
 success: false;
 errorCode: string;
 errorMessage: string;
}
```

---

## 9. UI per Status Display

### Cancel Confirmation popup

| Status | Display Content |
|------|----------|
| Title | Booking cancellation |
| Message | Booking Cancellation?? |
| Confirm Button | Cancellation Progress |
| Cancellation Button | Close |

### VOID Confirmation popup

| Status | Display Content |
|------|----------|
| Title | Ticketing Cancellation (VOID) |
| Warning Message | VOID Ticketing Same day only Available |
| Ticket List | VOID Target TicketNumber List |
| Confirm Button | VOID Progress |

### REFUND Confirmation popup

| Status | Display Content |
|------|----------|
| Title | Refund Request |
| Original fare | 1,700,000 KRW |
| Cancellation fee | -200,000 KRW |
| Expected refund amount | 1,500,000 KRW (emphasis) |
| Confirm Button | Refund Progress |

---

## 10. Error handling

| Error scenarios | Error Code | User Message |
|----------|----------|--------------|
| Already Cancellation | ALREADY_CANCELLED | Already Cancellation Booking |
| VOID Deadline Exceed | VOID_EXPIRED | VOID Available Time Exceed |
| Refund Not possible Fare | NON_REFUNDABLE | Refund unavailable Fare |
| Carrier Response None | CARRIER_TIMEOUT | Carrier Response receive |
| unSupported carriers | NOT_SUPPORTED | Corresponding Carrier Cancellation Supportdoes not |
