# CancelRefund UI Field definitions

> Source: `.claude/assets/plan/api-ui-mapping/plan.md` (Booking Change Flow Section)

---

## 1. Cancellation/Refund Overview

### Feature Distinction

| Feature | Before ticketing | After ticketing | Description |
|------|:------:|:------:|------|
| Cancel | O | X | Booking cancellation (Before ticketing) |
| VOID | X | O | Ticketing Same day Cancellation |
| REFUND | X | O | After ticketing Refund |

### Supported carriers

| Carrier | Cancel | VOID | REFUND |
|--------|:------:|:----:|:------:|
| AF, KL | O | O | O |
| SQ | O | O | O |
| QR | O | O | O |
| LH, LX, OS | O | O | O |
| EK | O | O | O |
| AA | O | O | O |
| BA | O | O | O |
| TR | O | O | O |
| TK | O | O | O |
| KE, HA | X | X | X |

---

## 2. Cancel (Before ticketing Cancellation)

### Cancellation Confirmation popup (CancelConfirmPopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| title | string | O | Text | Booking cancellation | Popup Title |
| message | string | O | Text | Booking Cancellation?? | Confirm Message |
| pnr | string | O | Number 6Seat | ABC123 | Cancellation Target PNR |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| carrierCode | string | O | 2Seat code | SQ | Carrier |
| passengerCount | number | O | Number | 2 | Passenger |
| confirmButtonLabel | string | O | Text | Cancellation Progress | - |
| cancelButtonLabel | string | O | Text | Close | - |

### Cancellation Complete Result (CancelResult)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| success | boolean | O | true/false | true | Cancellation Success Whether |
| orderId | string | O | Luna OrderID | ORD-2024-001 | Cancellation order ID |
| pnr | string | O | Number 6Seat | ABC123 | Cancellation PNR |
| status | string | O | StatusCode | CANCELLED | Cancellation Status |
| statusLabel | string | O | Korean | CancellationComplete | - |
| cancelDate | string | O | YYYY-MM-DD HH:mm | 2024-02-21 15:30 | Cancellation Date/Time (KST) |
| message | string | O | Text | Booking Cancellation | Result Message |

---

## 3. VOID (Ticketing Same day Cancellation)

### VOID Confirmation popup (VoidConfirmPopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| title | string | O | Text | Ticketing Cancellation (VOID) | Popup Title |
| message | string | O | Text | Ticketing Cancellation?? | Confirm Message |
| warningMessage | string | O | Text | VOID Ticketing Same day only Available | Warning Message |
| pnr | string | O | Number 6Seat | ABC123 | - |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| ticketNumbers | string[] | O | TicketNumber Array | ['1234567890123'] | VOID Target Ticket |
| ticketedDate | string | O | YYYY-MM-DD | 2024-02-21 | Ticketing |
| isVoidAvailable | boolean | O | true/false | true | VOID Available Whether |
| confirmButtonLabel | string | O | Text | VOID Progress | - |
| cancelButtonLabel | string | O | Text | Close | - |

### VOID Complete Result (VoidResult)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| success | boolean | O | true/false | true | VOID Success Whether |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| pnr | string | O | Number 6Seat | ABC123 | - |
| voidedTickets | string[] | O | TicketNumber Array | ['1234567890123'] | VOID Ticket |
| status | string | O | StatusCode | VOIDED | Status |
| statusLabel | string | O | Korean | VOIDComplete | - |
| voidDate | string | O | YYYY-MM-DD HH:mm | 2024-02-21 15:30 | VOID Date/Time |
| message | string | O | Text | Ticketing Cancellation | Result Message |

---

## 4. REFUND (Refund)

### Refund Quote/Estimate Retrieval (RefundQuote)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| originalFare | number | O | Number | 1700000 | Original fare |
| originalFareLabel | string | O | Text | Payment Amount | - |
| penalty | number | O | Number | 200000 | Cancellation fee |
| penaltyLabel | string | O | Text | Cancellation fee | - |
| refundAmount | number | O | Number | 1500000 | Expected refund amount |
| refundAmountLabel | string | O | Text | Refund e.g.specific Amount | - |
| currency | string | O | CurrencyCode | KRW | - |
| refundBreakdown | RefundBreakdownItem[] | X | List | - | per Passenger Detail |

### RefundBreakdownItem (per Passenger Refund Detail)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxId | string | O | PAX ID | PAX1 | - |
| passengerName | string | O | English property/given name | HONG/GILDONG | - |
| ptc | string | O | Passenger type | ADT | - |
| ticketNumber | string | O | TicketNumber | 1234567890123 | - |
| originalFare | number | O | Number | 850000 | Original fare |
| penalty | number | O | Number | 100000 | items Fee |
| refundAmount | number | O | Number | 750000 | Refundamount |

### Refund Confirmation popup (RefundConfirmPopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| title | string | O | Text | Refund Request | Popup Title |
| message | string | O | Text | Refund Progress?? | Confirm Message |
| pnr | string | O | Number 6Seat | ABC123 | - |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| refundQuote | RefundQuote | O | Object | - | Refund Quote/Estimate |
| confirmButtonLabel | string | O | Text | Refund Progress | - |
| cancelButtonLabel | string | O | Text | Close | - |

### Refund Complete Result (RefundResult)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| success | boolean | O | true/false | true | Refund Success Whether |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| pnr | string | O | Number 6Seat | ABC123 | - |
| refundedTickets | string[] | O | TicketNumber Array | ['1234567890123'] | Refund Ticket |
| refundAmount | number | O | Number | 1500000 | Refund Amount |
| currency | string | O | CurrencyCode | KRW | - |
| status | string | O | StatusCode | REFUNDED | Status |
| statusLabel | string | O | Korean | RefundComplete | - |
| refundDate | string | O | YYYY-MM-DD HH:mm | 2024-02-21 15:30 | Refund Date/Time |
| message | string | O | Text | Refund Complete | Result Message |

---

## 5. Button Status (ButtonState)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| showCancelButton | boolean | O | true/false | true | Cancel Button (Before ticketing) |
| showVoidRefundButton | boolean | O | true/false | false | VOID/REFUND Button (After ticketing) |
| buttonLabel | string | O | Text | Cancel / VOID/REFUND | Button Label |
| isEnabled | boolean | O | true/false | true | Button activationpropertyconversion |

---

## 6. API Flow

### Cancel (Before ticketing)

```
OrderRetrieve → OrderCancel
```

### VOID (Ticketing Same day)

```
OrderRetrieve → OrderCancel (VOID)
```

### REFUND (Refund Quote/Estimate Retrieval)

```
OrderRetrieve → OrderReshop (cancelOrderRefId) → [Refund Amount Confirm]
```

### REFUND (Refund Progress)

```
OrderRetrieve → OrderReshop → OrderCancel (REFUND)
```

---

## TypeScript Interface

```typescript
interface CancelRefundData {
 // Default Information
 pnr: string;
 orderId: string;
 carrierCode: string;
 isTicketed: boolean;

 // Cancel (Before ticketing)
 cancelConfirm?: CancelConfirmPopup;
 cancelResult?: CancelResult;

 // VOID (Ticketing Same day)
 voidConfirm?: VoidConfirmPopup;
 voidResult?: VoidResult;

 // REFUND (Refund)
 refundQuote?: RefundQuote;
 refundConfirm?: RefundConfirmPopup;
 refundResult?: RefundResult;

 // Button Status
 buttonState: ButtonState;
}

interface CancelConfirmPopup {
 title: string;
 message: string;
 pnr: string;
 orderId: string;
 carrierCode: string;
 passengerCount: number;
 confirmButtonLabel: string;
 cancelButtonLabel: string;
}

interface CancelResult {
 success: boolean;
 orderId: string;
 pnr: string;
 status: string;
 statusLabel: string;
 cancelDate: string;
 message: string;
}

interface VoidConfirmPopup {
 title: string;
 message: string;
 warningMessage: string;
 pnr: string;
 orderId: string;
 ticketNumbers: string[];
 ticketedDate: string;
 isVoidAvailable: boolean;
 confirmButtonLabel: string;
 cancelButtonLabel: string;
}

interface VoidResult {
 success: boolean;
 orderId: string;
 pnr: string;
 voidedTickets: string[];
 status: string;
 statusLabel: string;
 voidDate: string;
 message: string;
}

interface RefundQuote {
 originalFare: number;
 originalFareLabel: string;
 penalty: number;
 penaltyLabel: string;
 refundAmount: number;
 refundAmountLabel: string;
 currency: string;
 refundBreakdown?: RefundBreakdownItem[];
}

interface RefundBreakdownItem {
 paxId: string;
 passengerName: string;
 ptc: string;
 ticketNumber: string;
 originalFare: number;
 penalty: number;
 refundAmount: number;
}

interface RefundConfirmPopup {
 title: string;
 message: string;
 pnr: string;
 orderId: string;
 refundQuote: RefundQuote;
 confirmButtonLabel: string;
 cancelButtonLabel: string;
}

interface RefundResult {
 success: boolean;
 orderId: string;
 pnr: string;
 refundedTickets: string[];
 refundAmount: number;
 currency: string;
 status: string;
 statusLabel: string;
 refundDate: string;
 message: string;
}

interface ButtonState {
 showCancelButton: boolean;
 showVoidRefundButton: boolean;
 buttonLabel: string;
 isEnabled: boolean;
}
```

---

## Refund Amount Calculate Logic

```typescript
interface RefundCalculation {
 originalFare: number; // Original fare
 penalty: number; // Cancellation fee
 refundAmount: number; // Refundamount
}

function calculateRefund(
 originalFare: number,
 penaltyRate: number,
 minPenalty: number
): RefundCalculation {
 // penalty Calculate (비율 or during MinimumAmount 큰 Value)
 const calculatedPenalty = originalFare * penaltyRate;
 const penalty = Math.max(calculatedPenalty, minPenalty);

 // Refundamount Calculate
 const refundAmount = Math.max(originalFare - penalty, 0);

 return {
 originalFare,
 penalty,
 refundAmount
 };
}

// VOID Available Whether Confirm
function isVoidAvailable(ticketedDate: string): boolean {
 const today = new Date().toISOString().split('T')[0];
 return ticketedDate === today;
}

// Button Label Determine
function getButtonLabel(isTicketed: boolean, ticketedDate?: string): string {
 if (!isTicketed) {
 return 'Cancel';
 }

 if (ticketedDate && isVoidAvailable(ticketedDate)) {
 return 'VOID/REFUND';
 }

 return 'REFUND';
}
```

---

## Precautions

1. **KE, HA**: Cancel/VOID/REFUND unSupport
2. **VOID Time Limit**: Ticketing Same day only VOID Available
3. **Refund Quote/Estimate**: OrderReshop to API pre- Retrieval Required
4. **penalty**: Per carrier/per Fare 상 (API ResponseValue Use)
