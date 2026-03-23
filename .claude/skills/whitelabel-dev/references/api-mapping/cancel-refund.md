# Cancel/Refund API-UI Mapping

> **Cancel API**: `POST /middleware/polarhub/order/cancel`
> **Refund Quote**: `POST /middleware/polarhub/order-reshop` (with cancelOrderRefId)
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/servicing/cancel-refund.md`

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |

---

## Key/Main UI Component

- **CancelConfirmPopup**: Cancellation Confirmation popup
- **VoidConfirmPopup**: VOID Confirmation popup
- **RefundQuotePopup**: Refund Quote/Estimate Popup
- **ResultMessage**: Process Result Display

---

## API Flow Overview

### Before ticketing Cancellation (Cancel)

```
OrderRetrieve → OrderCancel
```

### Ticketing Same day Cancellation (VOID) / Refund (REFUND)

```
OrderRetrieve → OrderReshop (cancelOrderRefId) → OrderCancel
```

> **Note**: VOID and REFUND Same API Workflow. difference Ticketing Same day Whether.

---

## 1. Cancel (Before ticketing Cancellation)

### Response Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| success | `ResultMessage.Code === "OK"` | boolean |
| orderId | Requestimported from | - |
| pnr | Requestimported from | - |
| status | "CANCELLED" | FixedValue |
| statusLabel | "CancellationComplete" | FixedValue |
| cancelDate | Current Time | KST |

### Cancel Confirmation popup

```
┌─────────────────────────────────────────┐
│ Booking cancellation │
├─────────────────────────────────────────┤
│ │
│ Booking Cancellation?? │
│ │
│ PNR: ABC123 │
│ Journey/Itinerary: ICN → SIN (2025-01-20) │
│ │
│ [Close] [Cancellation Progress] │
└─────────────────────────────────────────┘
```

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

### VOID Confirmation popup

```
┌─────────────────────────────────────────┐
│ Ticketing Cancellation (VOID) │
├─────────────────────────────────────────┤
│ │
│ VOID Ticketing Same day only Available │
│ │
│ VOID Target Ticket: │
│ - 1807401234567 (HONG/GILDONG) │
│ - 1807401234568 (KIM/MINSOO) │
│ │
│ [Close] [VOID Progress] │
└─────────────────────────────────────────┘
```

---

## 3. REFUND (Refund)

### Refund Quote/Estimate Retrieval Request

```typescript
{
 transactionId: string,
 order: { orderId, owner },
 cancelOrderRefId: string, // Refund when Retrieval Required
 actionContext: "8" // Voluntary
}
```

### RefundQuote Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| originalFare | `DeleteOrderItem[].OriginalOrderItem.Total.Amount` | Total |
| penalty | `DeleteOrderItem[].PenaltyAmount.Total.Amount` | Total |
| refundAmount | `DeleteOrderItem[].ReshopDue.Total.Amount` | Total |
| currency | `ReshopDue.Total.CurCode` | - |
| responseId | `ReshopOffers[].ResponseID` | Refund for Progress |
| offerId | `ReshopOffers[].OfferID` | Refund for Progress |

### REFUND Confirmation popup

```
┌─────────────────────────────────────────┐
│ Refund Request │
├─────────────────────────────────────────┤
│ │
│ Original fare 1,700,000 KRW │
│ Cancellation fee -200,000 KRW │
│ ───────────────────────────────── │
│ Expected refund amount 1,500,000 KRW (emphasis) │
│ │
│ [Close] [Refund Progress] │
└─────────────────────────────────────────┘
```

---

## Button Status Determine

```typescript
function getCancelRefundButtonState(orderViewRS) {
 const isTicketed = order.TicketDocInfo?.length > 0;

 if (!isTicketed) {
 return {
 showCancelButton: true,
 showVoidRefundButton: false,
 buttonLabel: 'Cancel'
 };
 }

 const isVoidAvailable = checkVoidAvailable(ticketedDate);

 return {
 showCancelButton: false,
 showVoidRefundButton: true,
 buttonLabel: isVoidAvailable ? 'VOID/REFUND' : 'REFUND'
 };
}
```

---

## Per carrier Support 현황

| Carrier | Cancel | VOID | REFUND |
|--------|:------:|:----:|:------:|
| AF, KL | O | O | O |
| SQ, QR | O | O | O |
| LH, LX, OS | O | O | O |
| EK, AA, BA | O | O | O |
| TR, TK | O | O | O |
| **KE, HA** | **X** | **X** | **X** |

---

## Refund Amount Calculate

```typescript
function calculateRefund(response: OrderReshopRS): RefundCalculation {
 const reshopOffer = response.ReshopOffers?.[0];
 const deleteItems = reshopOffer.DeleteOrderItem || [];

 let originalFare = 0;
 let penalty = 0;
 let refundAmount = 0;

 deleteItems.forEach(item => {
 originalFare += item.OriginalOrderItem?.Total?.Amount || 0;
 penalty += item.PenaltyAmount?.Total?.Amount || 0;
 refundAmount += item.ReshopDue?.Total?.Amount || 0;
 });

 return {
 originalFare,
 penalty,
 refundAmount: Math.max(refundAmount, 0),
 responseId: reshopOffer.ResponseID,
 offerId: reshopOffer.OfferID
 };
}
```

---

## Error handling

| Error scenarios | Error Code | User Message |
|----------|----------|--------------|
| Already Cancellation | ALREADY_CANCELLED | Already Cancellation Booking |
| VOID Deadline Exceed | VOID_EXPIRED | VOID Available Time Exceed |
| Refund Not possible Fare | NON_REFUNDABLE | Refund unavailable Fare |
| Carrier Response None | CARRIER_TIMEOUT | Carrier Response receive |
| unSupported carriers | NOT_SUPPORTED | Corresponding Carrier Cancellation Supportdoes not |
