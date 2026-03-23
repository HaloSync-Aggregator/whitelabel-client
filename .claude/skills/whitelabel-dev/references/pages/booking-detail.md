# Booking Detail (PNR Detail) Page 설계

> **Purpose**: Booking after Complete Detail Retrieval + PNR Search results Display (공)
> **Path**: `/booking/[id]` or `/booking/[pnr]`
> **API**: `POST /middleware/polarhub/order/retrieve`

---

## ⚠️⚠️⚠️ Warning: Action Handler Required Implementation ⚠️⚠️⚠️

Booking detail Page's All Action Button Handler **Actual Behavior**하도록 must Implementation .
`console.log`only if exists Button 작동not not bug Occurs!

```typescript
// ❌ Wrong Example - console.log only Exists
const handleVoidRefund = () => {
 console.log('Refund Request'); // Button click also 아infinite day also remaining!
};

// ✅ Correct Example - Cancellation/Refund Navigate to page (owner Parameter Required!)
const handleVoidRefund = () => {
 if (!booking) return;
 navigate(`/booking/${orderId}/cancel?owner=${booking.carrierCode}`); // owner Required!
};
```

**Required Handler List:**
| Handler | Behavior |
|--------|------|
| `handlePayment` | Payment Page Navigate or Payment Modal |
| `handleCancel` | Booking cancellation API Call (confirm after) |
| `handleVoidRefund` | `/booking/[id]/cancel?owner=${carrierCode}` Navigate to page (**owner Required!**) |
| `handleChangeJourney` | `/booking/[id]/change` Navigate to page |
| `handleChangeInfo` | PassengerEditModal 열기 (setIsEditModalOpen(true)) |

> ⚠️ **owner Parameter**: Cancellation from Page Booking Information Retrieval하려when `owner` (carrierCode) Required. when Missing "Booking Information is not available" Error occurs!

---

## ⚠️ PolarHub API Field Precautions

Passenger information(Contact, Passport) when Extract Next Field in difference Caution:

| Distinction | Expected Field name | PolarHub Actual Field name |
|------|------------|---------------------|
| Passport Type | `IdentityDocTypeCode` | `IdentityDocumentType` |
| Passport Number | `IdentityDocID` | `IdentityDocumentNumber` |
| Contact Reference | `ContactInfoRefID` (string) | `ContactInfoRefID` (string[]) |
| PhoneNumber | `Phone.PhoneNumber` (string) | `Phone[].PhoneNumber` (number) |
| Email | `EmailAddress.EmailAddressValue` | `EmailAddress[]` (string[]) |

 Extract Logic `order-retrieve.md` "Passenger Contact/Passport Information Extract Precautions" Note.

---

## 1. Page Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Header │
├─────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ BookingHeader (PNR, Status, Deadline) │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌──────────────────────────┐ ┌────────────────────────────┐ │
│ │ │ │ │ │
│ │ ItineraryCard │ │ PriceSummary │ │
│ │ (Journey information) │ │ (Fare Summary) │ │
│ │ │ │ │ │
│ ├──────────────────────────┤ ├────────────────────────────┤ │
│ │ │ │ │ │
│ │ PassengerList │ │ ActionButtons │ │
│ │ (Passenger List) │ │ (Action Button) │ │
│ │ │ │ │ │
│ ├──────────────────────────┤ └────────────────────────────┘ │
│ │ │ │
│ │ TicketList (After ticketing) │ │
│ │ (Ticket Information) │ │
│ │ │ │
│ └──────────────────────────┘ │
│ │
├─────────────────────────────────────────────────────────────────┤
│ Footer │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Structure

```
src/components/booking/
├── BookingHeader.tsx # PNR, Status, Payment/Ticketing Deadline
├── ItineraryCard.tsx # Journey information (Segment List)
├── PassengerList.tsx # Passenger List
├── TicketList.tsx # Ticket Information (After ticketing)
├── PriceSummary.tsx # Fare Summary
├── ActionButtons.tsx # Action Button (Payment, Cancellation, Change, etc.)
└── index.ts # Component export
```

---

## 3. Data Interface

### 3.1 BookingDetail (for UI Integration Interface)

```typescript
// src/types/booking.ts

export interface BookingDetail {
 // Header Information
 orderId: string;
 pnr: string;
 carrierCode: string;
 carrierName: string;
 status: BookingStatus;
 statusLabel: string;
 paymentTimeLimit?: string; // ISO8601 → Format Conversion Required
 ticketingTimeLimit?: string;
 isTicketed: boolean;
 createdAt?: string;

 // Passenger information
 passengers: PassengerInfo[];

 // Journey information
 itineraries: ItineraryInfo[];

 // Price Information
 price: PriceInfo;

 // Ticket Information (After ticketing)
 tickets?: TicketInfo[];

 // Action Button Status
 actions: ActionState;

 // ⭐ Subsequent API for Call Original Data
 _orderData: {
 transactionId: string;
 orderId: string;
 owner: string;
 orderItemIds: string[];
 };
}

export type BookingStatus = 'HD' | 'CONFIRMED' | 'TICKETED' | 'CANCELLED';

export interface PassengerInfo {
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 ptcLabel: string; // Adult, Child, Infant
 title?: string; // MR, MS etc.
 fullName: string; // HONG/GILDONG
 property: string;
 givenName: string;
 birthdate?: string;
 gender?: 'MALE' | 'FEMALE';
 mobile?: string; // ⚠️ when Extract Array Process Required
 email?: string; // ⚠️ when Extract Array Process Required
 // After ticketing TicketNumber Connection
 ticketNumber?: string;
 // Passport/Mileage Information (Extension)
 apisInfo?: {
 passportNumber: string;
 nationality: string;
 expiryDate: string;
 };
 ffn?: {
 programCode: string;
 memberNumber: string;
 };
}

export interface ItineraryInfo {
 journeyId: string;
 direction: 'outbound' | 'inbound';
 directionLabel: string; // Outbound, Return
 segments: SegmentInfo[];
}

export interface SegmentInfo {
 segmentId: string;
 segmentNo: number; // 1, 2, 3...
 carrierCode: string;
 flightNumber: string; // SQ608
 aircraft?: string; // A350
 departure: {
 airport: string; // ICN
 airportName?: string; // 천국제Airport
 date: string; // 2024-03-15
 time: string; // 09:30
 terminal?: string; // T1
 };
 arrival: {
 airport: string;
 airportName?: string;
 date: string;
 time: string;
 terminal?: string;
 };
 duration?: string; // 6Time 30 min
 cabinClass?: string; // Economy class
 cabinCode?: string; // Y
 bookingClass?: string; // M
 baggage?: string; // 23KG
 status: string; // HK
 statusLabel: string; // Confirmed
 isCodeShare?: boolean;
 operatingCarrier?: string; // when Code쉐 Actual Operation사
}

export interface PriceInfo {
 currency: string;
 totalAmount: number;
 baseFare: number;
 taxes: number;
 // per Passenger Breakdown
 passengerBreakdown: Array<{
 ptc: string;
 ptcLabel: string;
 count: number;
 baseFare: number;
 taxes: number;
 subtotal: number;
 }>;
 formattedTotal: string; // "1,234,000 KRW"
}

// ⚠️⚠️⚠️ Important: API from Response Type Extract Position ⚠️⚠️⚠️
// API: TicketDocList[].TicketDocument[0].Type (TicketDocument Array!)
// Type Value: "T"=TICKET, "J"=EMD-A, "Y"=EMD-S, "INF"=InfantAir ticket
export interface TicketInfo {
 ticketNumber: string; // 618-1234567890 (TicketDocument[0].TicketDocNbr)
 type: 'TICKET' | 'EMD-A' | 'EMD-S'; // ⚠️ API: TicketDocument[0].Type → T/J/Y Conversion
 typeLabel: string; // Air ticket, EMD-A (Ancillary service), EMD-S, Infant Air ticket
 paxId: string;
 passengerName: string;
 issuedDate?: string; // TicketDocument[0].IssueDate
 segments?: string[]; // ICN-SIN, SIN-ICN (TICKET)
 serviceName?: string; // Seat 10A (EMD)
 totalFare?: number;
 currency?: string;
}

export interface ActionState {
 canPay: boolean; // Payment Button (unTicketing time)
 canCancel: boolean; // Cancellation Button (unTicketing time)
 canVoidRefund: boolean; // Void/Refund Button (After ticketing)
 canChangeJourney: boolean; // Journey change (Per carrier)
 canChangeInfo: boolean; // Information change (Per carrier)
 canPurchaseService: boolean; // SSR Payment (HD Status Exists time)
}
```

---

## 4. Component 설계

### 4.1 BookingHeader

```typescript
// src/components/booking/BookingHeader.tsx

interface BookingHeaderProps {
 pnr: string;
 carrierCode: string;
 carrierName: string;
 status: BookingStatus;
 statusLabel: string;
 isTicketed: boolean;
 paymentTimeLimit?: string;
 ticketingTimeLimit?: string;
}

/**
 * Booking Header Component
 *
 * UI Element:
 * - PNR (큰 text)
 * - Carrier Logo + Name
 * - Status 뱃 (per Color)
 * - Payment Deadline (unTicketing time)
 * - Ticketing Deadline
 */
```

**Status 뱃 Color:**
| Status | Color | Label |
|------|------|------|
| HD | yellow | BookingPending |
| CONFIRMED | blue | BookingComplete |
| TICKETED | green | TicketingComplete |
| CANCELLED | red | Cancellation |

---

### 4.2 ItineraryCard

```typescript
// src/components/booking/ItineraryCard.tsx

interface ItineraryCardProps {
 itineraries: ItineraryInfo[];
}

/**
 * Journey information Card
 *
 * UI Element:
 * - Outbound / Return Section
 * - Segment별:
 * - Flight number (SQ608)
 * - Departure/Arrival Airport, Time, Date
 * - terminal, Duration
 * - SeatClass, Baggage
 * - Status 뱃
 * - Code쉐 Display
 */
```

---

### 4.3 PassengerList

```typescript
// src/components/booking/PassengerList.tsx

interface PassengerListProps {
 passengers: PassengerInfo[];
 isTicketed: boolean;
}

/**
 * Passenger List Component
 *
 * UI Element:
 * - per Passenger Card
 * - PassengerType (Adult/Child/Infant)
 * - Name (HONG/GILDONG)
 * - Date of Birth
 * - Contact, Email
 * - TicketNumber (After ticketing)
 */
```

---

### 4.4 TicketList (After ticketing Display)

```typescript
// src/components/booking/TicketList.tsx

interface TicketListProps {
 tickets: TicketInfo[];
}

/**
 * Ticket List Component (After in ticketing only Display)
 *
 * UI Element:
 * - Ticket type icon
 * - TicketNumber
 * - Passengerperson
 * - Segment (TICKET)
 * - Serviceperson (EMD)
 * - Amount
 */
```

---

### 4.5 PriceSummary

```typescript
// src/components/booking/PriceSummary.tsx

interface PriceSummaryProps {
 price: PriceInfo;
}

/**
 * Fare Summary Component
 *
 * UI Element:
 * - per Passenger Fare Breakdown
 * - DefaultFare, Fuel Surcharge, Tax
 * - Total payment amount (emphasis)
 */
```

---

### 4.6 ActionButtons

```typescript
// src/components/booking/ActionButtons.tsx

interface ActionButtonsProps {
 actions: ActionState;
 orderId: string;
 owner: string;
 onPayment?: () => void;
 onCancel?: () => void;
 onVoidRefund?: () => void;
 onChangeJourney?: () => void;
 onChangeInfo?: () => void;
}

/**
 * Action Button Component
 *
 * Button Exposed Condition:
 * - Pay now: canPay (unTicketing + PaymentDeadline Exists)
 * - BookingCancellation: canCancel (unTicketing)
 * - Void/Refund: canVoidRefund (After ticketing)
 * - Journey/ItineraryChange: canChangeJourney (Per carrier)
 * - InformationChange: canChangeInfo (Per carrier)
 */
```

---

## 5. API Integration

### 5.1 Service Function

```typescript
// src/lib/api/polarhub-service.ts

import { getBookingDetail } from '@/lib/api/polarhub-service';

// Direct call from React component
const booking = await getBookingDetail(orderId);
// Returns BookingDetail directly (no fetch wrapper needed)
```

### 5.2 Transformer Function

```typescript
// src/lib/api/order-transformer.ts

export function transformOrderRetrieveResponse(
 response: OrderRetrieveResponse
): BookingDetail {
 const order = response.Order;
 const dataLists = response.DataLists;

 // Lookup maps
 const paxMap = new Map(dataLists?.PaxList?.map(p => [p.PaxID, p]));
 const segmentMap = new Map(dataLists?.PaxSegmentList?.map(s => [s.PaxSegmentID, s]));
 const contactMap = new Map(dataLists?.ContactInfoList?.map(c => [c.ContactInfoID, c]));

 // PNR Extract
 const pnr = order.BookingReference?.find(
 ref => ref.AirlineID === order.Owner || !ref.AirlineID
 )?.Id || order.OrderID;

 // Ticket Ticketing Whether
 const isTicketed = !!order.TicketDocInfo?.length;

 // Passenger Conversion
 const passengers = transformPassengers(dataLists?.PaxList, contactMap, order.TicketDocInfo);

 // Journey/Itinerary Conversion
 const itineraries = transformItineraries(dataLists?.PaxJourneyList, segmentMap, order.OrderItem);

 // Price Conversion
 const price = transformPrice(order.TotalPrice, order.OrderItem, paxMap);

 // Ticket Conversion
 const tickets = transformTickets(order.TicketDocInfo, paxMap);

 // Action Status
 const actions = getActionState(order.Owner, isTicketed, order.OrderStatus);

 return {
 orderId: order.OrderID,
 pnr,
 carrierCode: order.Owner,
 carrierName: getCarrierName(order.Owner),
 status: order.OrderStatus as BookingStatus,
 statusLabel: getStatusLabel(order.OrderStatus),
 paymentTimeLimit: order.PaymentTimeLimit,
 ticketingTimeLimit: order.TicketTimeLimit,
 isTicketed,
 passengers,
 itineraries,
 price,
 tickets: tickets.length > 0 ? tickets : undefined,
 actions,
 _orderData: {
 transactionId: response.TransactionID,
 orderId: order.OrderID,
 owner: order.Owner,
 orderItemIds: order.OrderItem?.map(item => item.OrderItemID) || [],
 },
 };
}
```

---

## 6. Page Component

```typescript
// src/pages/booking/[id].tsx (Vite + React SPA)

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
 BookingHeader,
 ItineraryCard,
 PassengerList,
 TicketList,
 PriceSummary,
 ActionButtons,
} from '@/components/booking';
import { BookingDetail } from '@/types/booking';
import { getBookingDetail, cancelBooking, ApiError } from '@/lib/api/polarhub-service';

export default function BookingDetailPage() {
 const params = useParams();
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 const [booking, setBooking] = useState<BookingDetail | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const orderId = params.id as string;
 const owner = searchParams.get('owner');

 useEffect(() => {
 const fetchBooking = async () => {
 if (!orderId || !owner) {
 setError('Booking Information is not available.');
 setLoading(false);
 return;
 }

 try {
 const bookingDetail = await getBookingDetail(orderId);
 setBooking(bookingDetail);
 } catch (err) {
 if (err instanceof ApiError) {
 setError(err.message);
 } else {
 setError('Booking during retrieval Error Occurs.');
 }
 } finally {
 setLoading(false);
 }
 };

 fetchBooking();
 }, [orderId, owner]);

 // ============================================================
 // ⭐ Action Handler - All Handler Implementation Required!
 // ============================================================
 const handlePayment = () => {
 // TODO: Payment Navigate to page or Payment Modal
 };

 const handleCancel = async () => {
 if (!booking) return;

 const confirmCancel = confirm('Booking Cancellation??');
 if (!confirmCancel) return;

 try {
 const result = await cancelBooking({
 transactionId: booking._orderData.transactionId,
 orderId: booking.orderId,
 });

 if (result.success) {
 alert('Booking Cancellation.');
 window.location.reload();
 } else {
 alert(result.error || 'Booking in cancellation Failure.');
 }
 } catch (err) {
 if (err instanceof ApiError) {
 alert(err.message);
 } else {
 alert('Booking during cancellation Error Occurs.');
 }
 }
 };

 // ⚠️⚠️⚠️ Important: handleVoidRefund Cancellation/Refund Navigate to pagemust be done!
 // ⚠️⚠️⚠️ owner Parameter Required Pass! when Missing Cancellation from Page Booking retrieval Failure!
 const handleVoidRefund = () => {
 if (!booking) return;
 // Cancellation/Refund Navigate to page (console.log only if/when !)
 // owner Parameter Required! carrierCode Passmust be done
 navigate(`/booking/${orderId}/cancel?owner=${booking.carrierCode}`);
 };

 const handleChangeJourney = () => {
 if (!booking) return;
 navigate(`/booking/${orderId}/change`);
 };

 // ⚠️ v3.12.5: to PassengerEditModal Passenger information Change
 const handleChangeInfo = () => {
 setIsEditModalOpen(true); // Page Navigate instead Modal 열기!
 };

 if (loading) {
 return <LoadingSkeleton />;
 }

 if (error || !booking) {
 return <ErrorState message={error} />;
 }

 return (
 <>
 <Header />
 <main className="max-w-6xl mx-auto px-4 py-8">
 {/* Booking Header */}
 <BookingHeader
 pnr={booking.pnr}
 carrierCode={booking.carrierCode}
 carrierName={booking.carrierName}
 status={booking.status}
 statusLabel={booking.statusLabel}
 isTicketed={booking.isTicketed}
 paymentTimeLimit={booking.paymentTimeLimit}
 ticketingTimeLimit={booking.ticketingTimeLimit}
 />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
 {/* Left side: Journey/Itinerary + Passenger + Ticket */}
 <div className="lg:col-span-2 space-y-6">
 <ItineraryCard itineraries={booking.itineraries} />
 <PassengerList
 passengers={booking.passengers}
 isTicketed={booking.isTicketed}
 />
 {booking.tickets && <TicketList tickets={booking.tickets} />}
 </div>

 {/* Right side: Fare + Action */}
 <div className="space-y-6">
 <PriceSummary price={booking.price} />
 <ActionButtons
 actions={booking.actions}
 orderId={booking.orderId}
 owner={booking.carrierCode}
 onPayment={handlePayment}
 onCancel={handleCancel}
 onVoidRefund={handleVoidRefund}
 onChangeJourney={handleChangeJourney}
 onChangeInfo={handleChangeInfo}
 />
 </div>
 </div>
 </main>
 <Footer />

 {/* ⚠️ v3.12.5: PassengerEditModal - paxInfo Pass Required! */}
 {booking.allowedPaxChanges && (
 <PassengerEditModal
 isOpen={isEditModalOpen}
 onClose={() => setIsEditModalOpen(false)}
 orderId={booking.orderId}
 carrierCode={booking.carrierCode}
 passengers={booking.passengers}
 allowedChanges={booking.allowedPaxChanges}
 departureDate={booking.itineraries[0]?.segments[0]?.departure.date}
 onSuccess={refreshBooking}
 // ⚠️ CRITICAL: OrderRetrieve from the response transactionId Pass Required!
 transactionId={booking._orderData.transactionId}
 />
 )}
 </>
 );
}
```

---

## ⚠️⚠️⚠️ PassengerEditModal paxInfo Pass (v3.12.5) ⚠️⚠️⚠️

> **Individual in Block birthdate, property, givenName, gender Required!**
> **paxInfo when Missing 400 Error: "birthdate must be a string"**

PassengerEditModal from Internal API when Call paxInfo must Include :

```typescript
// PassengerEditModal.tsx Internal submitChange Function
import { changePax } from '@/lib/api/pax-change-service';

const result = await changePax({
 transactionId, // ⚠️ OrderRetrieve from Response Re-Use!
 orderId,
 paxId: selectedPaxId,
 changeType: selectedChangeType,
 action: selectedAction,
 carrierCode,
 data,
 // ⚠️ CRITICAL: paxInfo Required! OrderRetrieve Response Dataimported from
 paxInfo: {
 property: selectedPax.property,
 givenName: selectedPax.givenName,
 birthdate: selectedPax.birthdate, // ⚠️ Individual in Block Required!
 gender: selectedPax.gender,
 title: selectedPax.title,
 ptc: selectedPax.ptc,
 email: selectedPax.email,
 mobile: selectedPax.mobile,
 apisInfo: selectedPax.apisInfo,
 ffn: selectedPax.ffn,
 docaInfo: selectedPax.docaInfo,
 },
});
```

---

## 7. Per carrier Feature Support

```typescript
// src/lib/carrier-features.ts

export interface CarrierFeatures {
 infoChange: boolean; // Information change
 paxSplit: boolean; // Passenger Split
 journeyChange: boolean; // Journey change
 voidRefund: boolean; // Void/Refund
}

const carrierFeaturesMap: Record<string, CarrierFeatures> = {
 AF: { infoChange: false, paxSplit: false, journeyChange: true, voidRefund: true },
 KL: { infoChange: false, paxSplit: false, journeyChange: true, voidRefund: true },
 SQ: { infoChange: true, paxSplit: true, journeyChange: true, voidRefund: true },
 QR: { infoChange: true, paxSplit: true, journeyChange: true, voidRefund: true },
 KE: { infoChange: true, paxSplit: false, journeyChange: true, voidRefund: true },
 // ... Other Carrier
};

export function getCarrierFeatures(carrierCode: string): CarrierFeatures {
 return carrierFeaturesMap[carrierCode] || {
 infoChange: true,
 paxSplit: true,
 journeyChange: true,
 voidRefund: true,
 };
}

export function getActionState(
 carrierCode: string,
 isTicketed: boolean,
 orderStatus: string
): ActionState {
 const features = getCarrierFeatures(carrierCode);
 const isCancelled = orderStatus === 'CANCELLED';

 return {
 canPay: !isTicketed && !isCancelled,
 canCancel: !isTicketed && !isCancelled,
 canVoidRefund: isTicketed && features.voidRefund,
 canChangeJourney: features.journeyChange && !isCancelled,
 canChangeInfo: features.infoChange && !isCancelled,
 canPurchaseService: false, // SSR HD Status Confirm Required
 };
}
```

---

## 8. Status code Mapping

```typescript
// src/lib/status-codes.ts

export function getStatusLabel(status: string): string {
 const map: Record<string, string> = {
 HD: 'BookingPending',
 CONFIRMED: 'BookingComplete',
 TICKETED: 'TicketingComplete',
 CANCELLED: 'Cancellation',
 };
 return map[status] || status;
}

export function getStatusColor(status: string): string {
 const map: Record<string, string> = {
 HD: 'bg-yellow-100 text-yellow-800',
 CONFIRMED: 'bg-blue-100 text-blue-800',
 TICKETED: 'bg-green-100 text-green-800',
 CANCELLED: 'bg-red-100 text-red-800',
 };
 return map[status] || 'bg-gray-100 text-gray-800';
}

export function getSegmentStatusLabel(status: string): string {
 const map: Record<string, string> = {
 HK: 'Confirmed',
 HD: 'ConfirmedPending',
 HI: 'IssueComplete',
 HN: 'ResponsePending',
 TK: 'TicketComplete',
 XX: 'Cancellation',
 };
 return map[status] || status;
}

export function getPtcLabel(ptc: string): string {
 const map: Record<string, string> = {
 ADT: 'Adult',
 CHD: 'Child',
 INF: 'Infant',
 };
 return map[ptc] || ptc;
}

export function getCarrierName(code: string): string {
 const map: Record<string, string> = {
 SQ: 'Singapore Airlines',
 AF: 'Air France',
 KL: 'KLM Royal Dutch Airlines',
 QR: 'Qatar Airways',
 KE: 'Korean Air',
 OZ: 'Asiana Airlines',
 // ... Other Carrier
 };
 return map[code] || code;
}
```

---

## 9. Checklist

### Page Implementation Checklist

```
□ Service Function Setup (getBookingDetail in polarhub-service.ts)
□ order-transformer.in ts transformOrderRetrieveResponse Function Add
□ BookingHeader Component
□ ItineraryCard Component
□ PassengerList Component
□ TicketList Component
□ PriceSummary Component
□ ActionButtons Component
□ Page Component Combination
□ Loading/Error Status Process
□ Responsive-type Layout
```

### Integration Checklist

```
□ Booking after Complete Detail to Page redirect
□ PNR Search Form → Detail Page Integration
□ Payment Button → Payment Flow Integration
□ Cancellation Button → OrderCancel API Integration
```

---

## 10. Reference

- **API Mapping**: `.claude/assets/plan/api-ui-mapping/mappings/booking/order-retrieve.md`
- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml`
- **Transformer Template**: `.claude/skills/whitelabel-dev/references/api-client/order-transformer.md`
