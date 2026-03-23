# Booking Page - Payment Option 설계

> **Purpose**: Passenger information Input + Payment method Select
> **Path**: `/booking`
> **API**: `POST /middleware/polarhub/order` (OrderCreate)

---

## 1. Payment Option type

| Option | paymentList | Description |
|------|-------------|------|
| **Hold (Booking)** | `[]` (Empty array) | Payment without Booking only Progress. Payment within Deadline Payment Required |
| **Cash ImmediatelyTicketing** | `[{ cash: {...} }]` | Cash to Payment Immediately Ticketing |
| **Card ImmediatelyTicketing** | `[{ card: {...} }]` | Card to Payment Immediately Ticketing |

---

## 2. Payment DTO Structure (OpenAPI Spec)

### 2.1 PaymentDto

```typescript
interface to PaymentD {
 paymentMethod: PaymentMethodDto;
 amount: AmountDto;
}

interface to PaymentMethodD {
 cash?: CashPaymentDto;
 card?: CardPaymentDto;
}

interface to CashPaymentD {
 cashPaymentInd: boolean; // to true Configuration
}

interface to CardPaymentD {
 cardCode: 'VI' | 'MC' | 'AX' | 'JC' | string;
 cardNumber: string;
 cardHolderName: string;
 expiration: string; // MMYY
 seriesCode?: string; // CVV
}

interface to AmountD {
 currencyCode: string;
 amount: number;
}
```

---

## 3. Request Example

### 3.1 Hold (Booking)

```json
{
 "transactionId": "...",
 "orders": [...],
 "paxList": [...],
 "contactInfoList": [...],
 "paymentList": [] // ⭐ Empty array
}
```

### 3.2 Cash ImmediatelyTicketing

```json
{
 "transactionId": "...",
 "orders": [...],
 "paxList": [...],
 "contactInfoList": [...],
 "paymentList": [
 {
 "paymentMethod": {
 "cash": {
 "cashPaymentInd": true // ⭐ Cash Payment
 }
 },
 "amount": {
 "currencyCode": "KRW",
 "amount": 1234000
 }
 }
 ]
}
```

### 3.3 Card ImmediatelyTicketing

```json
{
 "transactionId": "...",
 "orders": [...],
 "paxList": [...],
 "contactInfoList": [...],
 "paymentList": [
 {
 "paymentMethod": {
 "card": {
 "cardCode": "VI",
 "cardNumber": "4111111111111111",
 "cardHolderName": "HONG GILDONG",
 "expiration": "1225",
 "seriesCode": "123"
 }
 },
 "amount": {
 "currencyCode": "KRW",
 "amount": 1234000
 }
 }
 ]
}
```

---

## 4. UI Component 설계

### 4.1 BookingOption Type

```typescript
type BookingOption = 'hold' | 'cash' | 'card';

interface PaymentForm {
 // Card for Payment
 cardCode: 'VI' | 'MC' | 'AX' | 'JC' | '';
 cardNumber: string;
 cardHolder: string;
 expiry: string;
 cvv: string;
}
```

### 4.2 Booking Option UI

```tsx
{/* Booking Option */}
<div className="bg-surface border border-border rounded-lg p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">Booking Option</h3>
 <div className="space-y-3">
 {/* Hold (Booking) */}
 <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-background">
 <input
 type="radio"
 name="bookingOption"
 value="hold"
 checked={bookingOption === 'hold'}
 onChange={() => setBookingOption('hold')}
 className="mt-1"
 />
 <div>
 <div className="font-medium text-foreground">Hold Booking Only</div>
 <div className="text-sm text-muted">
 Payment without Booking only Progress. Payment Deadline within in Paymentnot notif Auto Cancellation.
 </div>
 </div>
 </label>

 {/* Cash ImmediatelyTicketing */}
 <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-background">
 <input
 type="radio"
 name="bookingOption"
 value="cash"
 checked={bookingOption === 'cash'}
 onChange={() => setBookingOption('cash')}
 className="mt-1"
 />
 <div>
 <div className="font-medium text-foreground">Cash after Payment Immediately Ticketing</div>
 <div className="text-sm text-muted">
 Cash to Payment Immediately Ticket Ticketing.
 </div>
 </div>
 </label>

 {/* Card ImmediatelyTicketing */}
 <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-background">
 <input
 type="radio"
 name="bookingOption"
 value="card"
 checked={bookingOption === 'card'}
 onChange={() => setBookingOption('card')}
 className="mt-1"
 />
 <div>
 <div className="font-medium text-foreground">Card after Payment Immediately Ticketing</div>
 <div className="text-sm text-muted">
 Card to Payment Immediately Ticket Ticketing.
 </div>
 </div>
 </label>
 </div>
</div>

{/* Card Information Input (card Select time) */}
{bookingOption === 'card' && (
 <PaymentCardForm payment={payment} onChange={handlePaymentChange} />
)}
```

---

## 5. paymentList Build Logic

```typescript
// booking/page.tsx - handleSubmit

const buildPaymentList = (): PaymentDto[] => {
 switch (bookingOption) {
 case 'hold':
 // Booking only - Empty array
 return [];

 case 'cash':
 // Cash ImmediatelyTicketing
 return [{
 paymentMethod: {
 cash: {
 cashPaymentInd: true,
 },
 },
 amount: {
 currencyCode: bookingData.priceBreakdown.currency,
 amount: bookingData.priceBreakdown.totalAmount,
 },
 }];

 case 'card':
 // Card ImmediatelyTicketing
 return [{
 paymentMethod: {
 card: {
 cardCode: payment.cardCode,
 cardNumber: payment.cardNumber.replace(/\s/g, ''),
 cardHolderName: payment.cardHolder.toUpperCase(),
 expiration: payment.expiry,
 seriesCode: payment.cvv,
 },
 },
 amount: {
 currencyCode: bookingData.priceBreakdown.currency,
 amount: bookingData.priceBreakdown.totalAmount,
 },
 }];

 default:
 return [];
 }
};

// Service Function Call
import { createBooking } from '@/lib/api/polarhub-service';

const result = await createBooking({
 transactionId: bookingData.transactionId,
 orders: [{
 responseId: bookingData.responseId,
 offerId: bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems,
 }],
 paxList,
 contactInfoList,
 paymentList: buildPaymentList(), // ⭐ OptionDepending on Build
});
```

---

## 6. Validation

```typescript
// Booking per Option Validation
const isPaymentValid = (): boolean => {
 switch (bookingOption) {
 case 'hold':
 case 'cash':
 return true; // Add Input not required

 case 'card':
 return (
 payment.cardCode !== '' &&
 payment.cardNumber.length >= 13 &&
 payment.cardHolder.trim() !== '' &&
 payment.expiry.length === 4 &&
 payment.cvv.length >= 3
 );

 default:
 return false;
 }
};
```

---

## 7. middleware-client.ts Type definition

```typescript
// src/lib/api/middleware-client.ts

export interface OrderCreateRequest {
 transactionId: string;
 orders: Array<{...}>;
 paxList: Array<{...}>;
 contactInfoList?: Array<{...}>;

 // ⭐ Payment information - Empty array = Hold, cash or card Include = ImmediatelyTicketing
 paymentList?: Array<{
 paymentMethod: {
 cash?: {
 cashPaymentInd: boolean;
 };
 card?: {
 cardCode: 'VI' | 'MC' | 'AX' | 'JC' | string;
 cardNumber: string;
 cardHolderName: string;
 expiration: string;
 seriesCode?: string;
 };
 };
 amount: {
 currencyCode: string;
 amount: number;
 };
 }>;
}
```

---

## 8. Booking after Complete redirect

```typescript
// Booking when Success
if (data.success) {
 sessionStorage.removeItem('bookingData');

 // per Option Message
 let message = '';
 switch (bookingOption) {
 case 'hold':
 message = `Booking Complete!\nPNR: ${data.pnr}\nPayment Deadline: ${data.paymentTimeLimit || '24Time in'}`;
 break;
 case 'cash':
 case 'card':
 message = `Ticketing Complete!\nPNR: ${data.pnr}`;
 break;
 }
 alert(message);

 // ⭐ Booking detail Navigate to page
 navigate(`/booking/${data.orderId}?owner=${bookingData.owner}`);
}
```

---

## 9. Checklist

```
□ BookingOption in Type 'cash' Add
□ Booking Option in UI Cash radio Button Add
□ buildPaymentList in Function cash Case Add
□ isPaymentValid in Function cash Case Add
□ middleware-client.ts PaymentDto Type Update
□ Booking after Complete Detail Page redirect
```

---

## 10. Seat purchase Logic (Prime Booking)

> **Reference**: `references/api-mapping/seat-availability.md`

### 10.1 Status Management

```typescript
// Seat Related state
const [showSeatSelector, setShowSeatSelector] = useState(false);
const [seatData, setSeatData] = useState<SeatAvailabilityData | null>(null);
const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
const [loadingSeat, setLoadingSeat] = useState(false);

// Seat Offer Information (when OrderCreate Use)
// ⭐ WF_PB_SEAT_REPRICE: offerItems also Save Required
const [seatOfferData, setSeatOfferData] = useState<{
 responseId: string;
 offerId: string;
 owner: string;
 offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
} | null>(null);
```

### 10.2 handleSeatConfirm - Seat selection when Complete

```typescript
import { CARRIERS_SEAT_REPRICE } from '@/types/seat';

const handleSeatConfirm = async (seats: SelectedSeat[]) => {
 setSelectedSeats(seats);
 setShowSeatSelector(false);

 // ⭐ WF_PB_SEAT_REPRICE (AF, KL, TR): OfferPrice Re-Call Required
 if (seats.length > 0 && CARRIERS_SEAT_REPRICE.includes(bookingData.owner)) {
 setLoadingSeat(true);
 try {
 // Seat offerItems Composition
 const seatOfferItems = seats.map((seat) => {
 const match = seat.seatNumber.match(/^(\d+)([A-Z]+)$/i);
 const row = match ? match[1] : seat.seatNumber.replace(/[A-Z]/gi, '');
 const column = match ? match[2] : seat.seatNumber.replace(/[0-9]/g, '');
 return {
 offerItemId: seat.offerItemId,
 paxRefId: [seat.paxId],
 seatSelection: { column: column.toUpperCase(), row },
 };
 });

 // ⭐ Core: Journey/Itinerary/Seat Separate Offer to entry Split
 import { getOfferPrice } from '@/lib/api/polarhub-service';

 const data = await getOfferPrice({
 transactionId: bookingData.transactionId,
 offers: [
 // 1. Journey/Itinerary Offer (OfferPrice Response Criteria)
 {
 responseId: bookingData.responseId,
 offerId: bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems,
 },
 // 2. Seat Offer (SeatAvailability Response Criteria)
 {
 responseId: seatOfferData?.responseId,
 offerId: seatOfferData?.offerId,
 owner: seatOfferData?.owner,
 offerItems: seatOfferItems,
 },
 ],
 paxList: bookingData.paxList,
 });

 if (!data.success) {
 throw new Error(data.error || 'Seat Amount in Re-Calculate Failure.');
 }

 // ⭐ OfferPrice Re-Call Response Save (from OrderCreate Use)
 setSeatOfferData({
 responseId: data.responseId,
 offerId: data.offerId,
 owner: data.owner || bookingData.owner,
 offerItems: data.offerItems,
 });

 // Price Information Update
 if (data.priceBreakdown) {
 setBookingData((prev) => prev ? { ...prev, priceBreakdown: data.priceBreakdown } : null);
 }
 } catch (err) {
 alert(err instanceof Error ? err.message : 'Seat Amount in Re-Calculate Failure.');
 setSelectedSeats([]);
 } finally {
 setLoadingSeat(false);
 }
 }
};
```

### 10.3 handleSubmit - when OrderCreate Seat Include

```typescript
// ⭐ Orders Array Composition - Journey/Itinerary/Seat Separate order entry
type OrderOfferItem = {
 offerItemId: string;
 paxRefId: string[];
 seatSelection?: { column: string; row: string };
};

// Seat offerItems Build Function
const buildSeatOfferItems = (): OrderOfferItem[] => {
 return selectedSeats.map((seat) => {
 const match = seat.seatNumber.match(/^(\d+)([A-Z]+)$/i);
 const row = match ? match[1] : seat.seatNumber.replace(/[A-Z]/gi, '');
 const column = match ? match[2] : seat.seatNumber.replace(/[0-9]/g, '');
 return {
 offerItemId: seat.offerItemId,
 paxRefId: [seat.paxId],
 seatSelection: { column: column.toUpperCase(), row },
 };
 });
};

let orders: Array<{
 responseId: string;
 offerId: string;
 owner: string;
 offerItems: OrderOfferItem[];
}>;

// ⭐ WF_PB_SEAT_REPRICE (AF, KL, TR)
if (selectedSeats.length > 0 && CARRIERS_SEAT_REPRICE.includes(bookingData.owner) && seatOfferData) {
 // OfferPrice Re-Call from the response responseId/offerId Use
 // only, Journey/Itinerary and Seat Separate order to entry Split
 orders = [
 // 1. Journey/Itinerary Order
 {
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: bookingData.offerItems,
 },
 // 2. Seat Order
 {
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: buildSeatOfferItems(),
 },
 ];
} else {
 // ⭐ WF_PB_SEAT (SQ, etc.) or Seat unSelect
 orders = [
 // 1. Journey/Itinerary Order (OfferPrice Response Criteria)
 {
 responseId: bookingData.responseId,
 offerId: bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems,
 },
 ];

 // 2. Seat Order (Selectif/when에)
 if (selectedSeats.length > 0 && seatOfferData) {
 orders.push({
 responseId: seatOfferData.responseId,
 offerId: seatOfferData.offerId,
 owner: seatOfferData.owner,
 offerItems: buildSeatOfferItems(),
 });
 }
}
```

### 10.4 Flow compare

| Workflow | Carrier | API Flow | Offer/Order Structure |
|----------|--------|----------|------------------|
| **WF_PB_SEAT** | SQ, AY, TK, QR, HA, etc. | OfferPrice → SeatAvailability → OrderCreate | Separate entry |
| **WF_PB_SEAT_REPRICE** | AF, KL, TR | OfferPrice → SeatAvailability → **OfferPrice** → OrderCreate | Separate entry |

> **⭐ Important**: two Flow All Journey/Itinerary and Seat **Separate Offer/Order entry**로 must Split !

---

## 11. Reference

- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml` - PaymentMethodDto
- **Order Transformer**: `.claude/skills/whitelabel-dev/references/api-client/order-transformer.md`
- **Seat purchase Detail**: `references/api-mapping/seat-availability.md`
