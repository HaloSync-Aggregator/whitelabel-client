# Order Transformer Template

> **Range**: OrderCreate, OrderRetrieve, OrderReshop, OrderCancel API Request/Response Conversion
> **File Position**: `src/lib/api/order-transformer.ts`

---

## ⭐ OrderCreate Request Guide

### Middleware Endpoint

```
✅ POST /middleware/polarhub/order (올Bar)
❌ POST /middleware/polarhub/order/create (잘못 - 404 Error!)
```

### Request Structure (OpenAPI Spec comply)

> **⚠️ Important**: OpenAPI in Spec correct춘 Structure.
> - `responseId`, `offerId`, `owner` **Top-level not `orders[]` Array not** existsmust Does!
> - `offerItems`도 `orders[]` Array in Includemust Does

```typescript
interface OrderCreateRequest {
 transactionId: string;

 // ⭐ orders Array - Offer Information to Array wrap Pass (OrderSelectionDto)
 orders: Array<{
 responseId: string; // OfferPriceRSimported from
 offerId: string; // OfferPriceRSimported from
 owner: string; // OfferPriceRSimported from
 offerItems: Array<{
 offerItemId: string;
 paxRefId: string[]; // OfferPriceRS.FareDetail.from PaxRefID Extract
 }>;
 }>;

 // ⭐ Passenger List (PassportInformation Include) - PaxDetailDto
 paxList: Array<{
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 individual: {
 surname: string; // surname (English Uppercase)
 givenName: string[]; // Name (Array)
 birthdate?: string; // YYYY-MM-DD
 gender?: 'MALE' | 'FEMALE'; // ⭐ gender individual Internal! (IndividualDto)
 };
 identityDoc?: Array<{
 identityDocType: 'PT'; // Passport
 identityDocId: string;
 expiryDate?: string;
 issuingCountryCode?: string;
 citizenshipCountryCode?: string;
 }>;
 citizenshipCountryCode?: string;
 residenceCountryCode?: string;
 contactInfoRefId?: string[]; // ⭐ contactInfoList Reference
 }>;

 // ⭐ Contact List (Passenger and Split!) - ContactInfoDto
 contactInfoList?: Array<{
 contactInfoId: string;
 phone?: {
 countryDialingCode?: string;
 phoneNumber: string;
 };
 emailAddress?: string;
 }>;

 // ⭐ Payment information (Empty array = Hold, Value if exists Immediately Ticketing) - PaymentDto
 paymentList?: Array<{
 paymentMethod: {
 card?: {
 cardCode: 'VI' | 'MC' | 'AX' | 'JC';
 cardNumber: string;
 cardHolderName: string;
 expiration: string; // MMYY
 seriesCode?: string; // CVV
 };
 };
 amount: {
 currencyCode: string;
 amount: number;
 };
 }>;
}
```

### Booking per Option paymentList

| Option | paymentList | Description |
|------|-------------|------|
| **Hold (Booking)** | `[]` (Empty array) | Payment without Booking only Progress. Payment within Deadline Payment Required |
| **Immediately Ticketing** | `[{...}]` | Payment and in Concurrent Ticket Ticketing |

### BookingPage.tsx API Request Build (via polarhub-service.ts)

```typescript
import { createOrder } from '@/lib/api/polarhub-service';

const handleSubmit = async () => {
 // 1. paxList Build (PassportInformation Include)
 const paxList = passengers.map((p) => ({
 paxId: p.paxId,
 ptc: p.ptc,
 individual: {
 surname: p.property.toUpperCase(),
 givenName: [p.givenName.toUpperCase()],
 birthdate: p.birthdate || undefined,
 // ⭐ gender individual in Internal Position! (IndividualDto Spec)
 ...(p.gender && { gender: p.gender }),
 },
 identityDoc: [
 {
 identityDocType: 'PT' as const,
 identityDocId: p.passportNumber.toUpperCase(),
 expiryDate: p.passportExpiry,
 issuingCountryCode: p.passportCountry,
 citizenshipCountryCode: p.citizenship,
 },
 ],
 citizenshipCountryCode: p.citizenship,
 residenceCountryCode: p.residence,
 contactInfoRefId: [`CI_${p.paxId}`], // ⭐ Contact Reference
 }));

 // 2. contactInfoList Build (Split!)
 const contactInfoList = passengers.map((p) => ({
 contactInfoId: `CI_${p.paxId}`, // from paxList Reference
 phone: {
 countryDialingCode: '82',
 phoneNumber: p.phone.replace(/-/g, ''),
 },
 emailAddress: p.email,
 }));

 // 3. paymentList Build (OptionDepending on)
 const paymentList = bookingOption === 'ticketing'
 ? [{
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
 }]
 : []; // ⭐ Hold Case Empty array

 // 4. API Call via polarhub-service.ts - ⭐ orders to Array wrap Pass!
 await createOrder({
 transactionId: bookingData.transactionId,
 // ⭐ orders Array - OpenAPI Spec comply
 orders: [{
 responseId: bookingData.responseId,
 offerId: bookingData.offerId,
 owner: bookingData.owner,
 offerItems: bookingData.offerItems, // ⭐ from OfferPriceRS Extract offerItems
 }],
 paxList,
 contactInfoList,
 paymentList,
 });
};
```

### ⚠️ OrderCreate Precautions

1. **Endpoint**: `/middleware/polarhub/order` (NOT `/middleware/polarhub/order/create`)
2. **⭐ orders Array Required**: `responseId`, `offerId`, `owner`, `offerItems` **Top-level not `orders[]` Array not**에!
3. **offerItems Required**: from OfferPriceRS Extract `offerItems` (offerItemId, paxRefId) Include
4. **paxList vs passengers**: `paxList` Use (PolarHub Spec)
5. **contactInfoList Split**: Contact paxList and **Split**by Transmission
6. **identityDoc Array**: Passport Information **Array**로 Pass
7. **⭐ gender Position**: `individual` in Internal Position! (IndividualDto Spec) - paxList Top-level Not!

---

## Overview

```
OrderCreateRS → transformOrderCreateResponse() → BookingConfirmation
OrderRetrieveRS → transformOrderRetrieveResponse() → BookingDetail
OrderReshopRS → transformOrderReshopResponse() → ReshopOption[]
OrderCancelRS → transformOrderCancelResponse() → CancelResult
```

---

## 1. OrderRetrieveRS → BookingDetail

### 1.1 Response Type definition

```typescript
export interface OrderRetrieveResponse {
 ResultMessage?: {
 Code: string;
 Message?: string;
 };
 TransactionID: string;
 Order: OrderType;
 DataLists?: OrderDataListsType;
}

export interface OrderType {
 OrderID: string;
 Owner: string;
 OrderStatus: string; // HD, CONFIRMED, TICKETED, CANCELLED
 BookingReference?: Array<{
 Id: string;
 AirlineID?: string;
 }>;
 PaymentTimeLimit?: string;
 TicketTimeLimit?: string;
 TotalPrice: {
 TotalAmount: { Amount: number; CurCode: string };
 TotalBaseAmount?: { Amount: number; CurCode: string };
 TotalTaxAmount?: { Amount: number; CurCode: string };
 };
 OrderItem?: OrderItemType[];
 TicketDocInfo?: TicketDocInfoType[];
}

export interface OrderItemType {
 OrderItemID: string;
 StatusCode: string; // HK, TK, HD
 PaxRefID?: string[];
 PaxJourneyRefID?: string[];
 PaxSegmentRefID?: string[];
 ServiceRefID?: string;
 FareDetail?: FareDetailType;
}

export interface TicketDocInfoType {
 TicketDocNbr: string;
 Type: string; // TICKET, EMD-A, EMD-S
 PaxRefID: string;
 Payment?: {
 TotalAmount: { Amount: number; CurCode: string };
 };
}

export interface OrderDataListsType {
 PaxList?: OrderPaxType[];
 PaxSegmentList?: PaxSegmentType[];
 PaxJourneyList?: PaxJourneyType[];
 ContactInfoList?: ContactInfoType[];
 ServiceDefinitionList?: ServiceDefinitionType[];
 BaggageAllowanceList?: BaggageAllowanceType[];
}

export interface OrderPaxType {
 PaxID: string;
 Ptc: string; // ADT, CHD, INF
 Individual?: {
 Surname: string;
 GivenName: string[];
 Birthdate?: string;
 Gender?: string;
 NameTitle?: string;
 };
 // ⚠️ ContactInfoRefID string or string[] Both Available!
 ContactInfoRefID?: string | string[];
 // ⚠️ IdentityDoc Field name Caution: IdentityDocumentType (not IdentityDocTypeCode)
 IdentityDoc?: Array<{
 IdentityDocID?: string;
 IdentityDocumentNumber?: string; // ⚠️ PolarHub uses this
 IdentityDocTypeCode?: string;
 IdentityDocumentType?: string; // ⚠️ PolarHub uses this (PT=Passport)
 ExpiryDate?: string;
 IssuingCountryCode?: string;
 CitizenshipCountryCode?: string;
 }>;
 LoyaltyProgram?: Array<{
 LoyaltyProgramAccount?: { AccountNumber?: string };
 LoyaltyProgramProviderName?: string;
 }>;
}

export interface ContactInfoType {
 ContactInfoID: string;
 // ⚠️ Phone Array! PhoneNumber Number Exists!
 Phone?: Array<{
 PhoneNumber: number | string;
 CountryDialingCode?: string;
 }>;
 // ⚠️ EmailAddress string Array!
 EmailAddress?: string[] | { EmailAddressValue?: string };
}

export interface ServiceDefinitionType {
 ServiceDefinitionID: string;
 ServiceCode: string;
 Name?: string;
 Desc?: string[];
}
```

### 1.2 BookingDetail Interface (UI)

```typescript
export interface BookingDetail {
 // Header Information
 orderId: string;
 pnr: string;
 carrierCode: string;
 status: string;
 statusLabel: string;
 paymentTimeLimit?: string;
 ticketingTimeLimit?: string;
 isTicketed: boolean;

 // Passenger information
 passengers: PassengerInfo[];

 // Journey information
 itineraries: ItineraryInfo[];

 // Price Information
 price: {
 total: number;
 baseFare: number;
 tax: number;
 currency: string;
 };

 // Ticket Information (After ticketing)
 tickets?: TicketInfo[];

 // Action Button Status
 actions: {
 canPay: boolean;
 canCancel: boolean;
 canVoidRefund: boolean;
 canChangeJourney: boolean;
 canChangeInfo: boolean;
 };

 // ⭐ Subsequent API for Call Original Data
 _orderData: {
 transactionId: string;
 orderId: string;
 owner: string;
 orderItemIds: string[];
 };
}

export interface PassengerInfo {
 paxId: string;
 ptc: string;
 ptcLabel: string;
 fullName: string;
 property: string;
 givenName: string;
 birthdate?: string;
 gender?: string;
 mobile?: string;
 email?: string;
}

export interface ItineraryInfo {
 journeyId: string;
 direction: 'outbound' | 'inbound';
 segments: SegmentInfo[];
}

export interface SegmentInfo {
 segmentId: string;
 flightNumber: string;
 departure: {
 airport: string;
 airportName?: string;
 date: string;
 time: string;
 terminal?: string;
 };
 arrival: {
 airport: string;
 airportName?: string;
 date: string;
 time: string;
 terminal?: string;
 };
 duration?: string;
 cabinClass?: string;
 baggage?: string;
 status: string;
 statusLabel: string;
}

export interface TicketInfo {
 ticketNumber: string;
 type: string;
 passengerName: string;
 totalFare: number;
 currency: string;
}
```

### 1.3 Transform Function

```typescript
export function transformOrderRetrieveResponse(response: OrderRetrieveResponse): BookingDetail {
 const order = response.Order;
 const dataLists = response.DataLists;

 // Lookup maps Create
 const paxMap = new Map<string, OrderPaxType>();
 const segmentMap = new Map<string, PaxSegmentType>();
 const journeyMap = new Map<string, PaxJourneyType>();
 const contactMap = new Map<string, ContactInfoType>();

 dataLists?.PaxList?.forEach(p => paxMap.set(p.PaxID, p));
 dataLists?.PaxSegmentList?.forEach(s => segmentMap.set(s.PaxSegmentID, s));
 dataLists?.PaxJourneyList?.forEach(j => journeyMap.set(j.PaxJourneyID, j));
 dataLists?.ContactInfoList?.forEach(c => contactMap.set(c.ContactInfoID, c));

 // PNR Extract (Owner Carrier Criteria)
 const pnr = order.BookingReference?.find(
 ref => ref.AirlineID === order.Owner || !ref.AirlineID
 )?.Id || order.OrderID;

 // Ticket Ticketing Whether
 const isTicketed = !!order.TicketDocInfo?.length;

 // Passenger information Conversion
 // ⚠️ Caution: ContactInfoRefID Array, Phone/Email Separate to ContactInfo Splitwill be Exists
 const passengers = (dataLists?.PaxList || []).map(pax => {
 // ContactInfoRefID string or string[] Both Available
 const contactRefIds = Array.isArray(pax.ContactInfoRefID)
 ? pax.ContactInfoRefID
 : pax.ContactInfoRefID ? [pax.ContactInfoRefID] : [];

 // Phone and Email Separate in ContactInfo exists to exists므 All merge
 let mergedPhone: { CountryDialingCode?: string; PhoneNumber?: number | string } | undefined;
 let mergedEmail: string | undefined;
 for (const refId of contactRefIds) {
 const ci = contactMap.get(refId);
 if (ci) {
 if (!mergedPhone && ci.Phone && ci.Phone.length > 0) mergedPhone = ci.Phone[0];
 if (!mergedEmail && ci.EmailAddress) {
 if (Array.isArray(ci.EmailAddress) && ci.EmailAddress.length > 0) mergedEmail = ci.EmailAddress[0];
 else if (typeof ci.EmailAddress === 'object' && ci.EmailAddress.EmailAddressValue) mergedEmail = ci.EmailAddress.EmailAddressValue;
 }
 }
 }

 // ⚠️ Passport: IdentityDocumentType (not IdentityDocTypeCode)
 const passportDoc = pax.IdentityDoc?.find(doc =>
 doc.IdentityDocumentType === 'PT' || doc.IdentityDocumentType === 'PP' ||
 doc.IdentityDocTypeCode === 'PT' || doc.IdentityDocTypeCode === 'PP'
 );
 const apisInfo = passportDoc ? {
 passportNumber: passportDoc.IdentityDocumentNumber || passportDoc.IdentityDocID || '',
 nationality: passportDoc.CitizenshipCountryCode || passportDoc.IssuingCountryCode || '',
 expiryDate: passportDoc.ExpiryDate || '',
 } : undefined;

 return {
 paxId: pax.PaxID,
 ptc: pax.Ptc,
 ptcLabel: formatPtc(pax.Ptc),
 title: pax.Individual?.NameTitle,
 fullName: pax.Individual
 ? `${pax.Individual.Surname}/${pax.Individual.GivenName.join(' ')}`
 : '',
 property: pax.Individual?.Surname || '',
 givenName: pax.Individual?.GivenName?.join(' ') || '',
 birthdate: pax.Individual?.Birthdate,
 gender: pax.Individual?.Gender,
 mobile: mergedPhone?.PhoneNumber
 ? (mergedPhone.CountryDialingCode ? `+${mergedPhone.CountryDialingCode}-` : '') + String(mergedPhone.PhoneNumber)
 : undefined,
 email: mergedEmail,
 apisInfo,
 };
 });

 // Journey information Conversion
 const itineraries = (dataLists?.PaxJourneyList || []).map((journey, idx) => ({
 journeyId: journey.PaxJourneyID,
 direction: idx === 0 ? 'outbound' : 'inbound' as const,
 segments: journey.PaxSegmentRefID.map(segId => {
 const segment = segmentMap.get(segId);
 if (!segment) return null;

 const orderItem = order.OrderItem?.find(
 item => item.PaxSegmentRefID?.includes(segId)
 );

 return {
 segmentId: segment.PaxSegmentID,
 flightNumber: `${segment.MarketingCarrier.AirlineID}${segment.MarketingCarrier.FlightNumber || ''}`,
 departure: {
 airport: segment.Departure.AirportCode,
 airportName: segment.Departure.AirportName,
 date: segment.Departure.Date,
 time: segment.Departure.Time.substring(0, 5),
 terminal: segment.Departure.Terminal?.Name,
 },
 arrival: {
 airport: segment.Arrival.AirportCode,
 airportName: segment.Arrival.AirportName,
 date: segment.Arrival.Date,
 time: segment.Arrival.Time.substring(0, 5),
 terminal: segment.Arrival.Terminal?.Name,
 },
 duration: segment.FlightDuration ? formatDuration(segment.FlightDuration) : undefined,
 cabinClass: segment.CabinType ? mapCabinClass(segment.CabinType) : undefined,
 status: orderItem?.StatusCode || 'HK',
 statusLabel: mapStatusCode(orderItem?.StatusCode || 'HK'),
 };
 }).filter(Boolean) as SegmentInfo[],
 }));

 // Ticket Information Conversion
 const tickets = (order.TicketDocInfo || []).map(ticket => {
 const pax = paxMap.get(ticket.PaxRefID);
 return {
 ticketNumber: ticket.TicketDocNbr,
 type: ticket.Type,
 passengerName: pax?.Individual
 ? `${pax.Individual.Surname}/${pax.Individual.GivenName.join(' ')}`
 : '',
 totalFare: ticket.Payment?.TotalAmount?.Amount || 0,
 currency: ticket.Payment?.TotalAmount?.CurCode || 'KRW',
 };
 });

 // Action Button Status Determine
 const carrierFeatures = getCarrierFeatures(order.Owner);
 const actions = {
 canPay: !isTicketed && order.OrderStatus !== 'CANCELLED',
 canCancel: !isTicketed && order.OrderStatus !== 'CANCELLED',
 canVoidRefund: isTicketed,
 canChangeJourney: carrierFeatures.journeyChange,
 canChangeInfo: carrierFeatures.infoChange,
 };

 return {
 orderId: order.OrderID,
 pnr,
 carrierCode: order.Owner,
 status: order.OrderStatus,
 statusLabel: mapOrderStatus(order.OrderStatus),
 paymentTimeLimit: order.PaymentTimeLimit,
 ticketingTimeLimit: order.TicketTimeLimit,
 isTicketed,
 passengers,
 itineraries,
 price: {
 total: order.TotalPrice.TotalAmount.Amount,
 baseFare: order.TotalPrice.TotalBaseAmount?.Amount || 0,
 tax: order.TotalPrice.TotalTaxAmount?.Amount || 0,
 currency: order.TotalPrice.TotalAmount.CurCode,
 },
 tickets: tickets.length > 0 ? tickets : undefined,
 actions,

 // ⭐ Subsequent API for Call
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

## 2. OrderReshopRS → ReshopOption[]

### 2.1 Response Type definition

```typescript
export interface OrderReshopResponse {
 ResultMessage?: {
 Code: string;
 Message?: string;
 };
 TransactionID: string;
 ReshopOffer?: ReshopOfferType[];
 CancelOffer?: CancelOfferType[]; // Cancellation Option Include
 DataLists?: OrderDataListsType;
}

export interface ReshopOfferType {
 ReshopOfferID: string;
 OriginalOrderItemRefID: string[];
 Penalty?: {
 Amount: { Amount: number; CurCode: string };
 TypeCode?: string; // CHANGE, NOSHOW
 };
 NewOffer: {
 OfferID: string;
 TotalPrice: {
 TotalAmount: { Amount: number; CurCode: string };
 };
 OfferItem: Array<{
 OfferItemID: string;
 PaxJourneyRefID?: string[];
 }>;
 };
 PriceDifference?: {
 Amount: number;
 CurCode: string;
 };
}

export interface CancelOfferType {
 CancelOfferID: string;
 OriginalOrderItemRefID: string[];
 RefundAmount?: { Amount: number; CurCode: string };
 PenaltyAmount?: { Amount: number; CurCode: string };
 NetRefundAmount?: { Amount: number; CurCode: string };
}
```

### 2.2 ReshopOption Interface (UI)

```typescript
export interface ReshopOption {
 reshopOfferId: string;
 originalOrderItemIds: string[];

 // new Journey information
 newJourney: {
 segments: SegmentInfo[];
 duration: string;
 };

 // for Information
 pricing: {
 newPrice: number;
 priceDifference: number;
 penaltyFee: number;
 totalToPay: number;
 currency: string;
 };

 // ⭐ OrderChange API for Call
 _reshopData: {
 transactionId: string;
 reshopOfferId: string;
 newOfferId: string;
 newOfferItemIds: string[];
 };
}

export interface CancelOption {
 cancelOfferId: string;
 originalOrderItemIds: string[];

 // Refund Information
 refund: {
 grossRefund: number;
 penalty: number;
 netRefund: number;
 currency: string;
 };

 // ⭐ OrderCancel API for Call
 _cancelData: {
 transactionId: string;
 cancelOfferId: string;
 };
}
```

### 2.3 Transform Function

```typescript
export function transformOrderReshopResponse(response: OrderReshopResponse): {
 reshopOptions: ReshopOption[];
 cancelOptions: CancelOption[];
} {
 const dataLists = response.DataLists;

 // Segment lookup map
 const segmentMap = new Map<string, PaxSegmentType>();
 const journeyMap = new Map<string, PaxJourneyType>();

 dataLists?.PaxSegmentList?.forEach(s => segmentMap.set(s.PaxSegmentID, s));
 dataLists?.PaxJourneyList?.forEach(j => journeyMap.set(j.PaxJourneyID, j));

 // Change Option Conversion
 const reshopOptions = (response.ReshopOffer || []).map(reshop => {
 const newOffer = reshop.NewOffer;

 // new Journey/Itinerary's Segment Extract
 const journeyIds = newOffer.OfferItem.flatMap(item => item.PaxJourneyRefID || []);
 const segments = journeyIds.flatMap(jId => {
 const journey = journeyMap.get(jId);
 return (journey?.PaxSegmentRefID || []).map(sId => {
 const segment = segmentMap.get(sId);
 if (!segment) return null;

 return {
 segmentId: segment.PaxSegmentID,
 flightNumber: `${segment.MarketingCarrier.AirlineID}${segment.MarketingCarrier.FlightNumber || ''}`,
 departure: {
 airport: segment.Departure.AirportCode,
 date: segment.Departure.Date,
 time: segment.Departure.Time.substring(0, 5),
 },
 arrival: {
 airport: segment.Arrival.AirportCode,
 date: segment.Arrival.Date,
 time: segment.Arrival.Time.substring(0, 5),
 },
 status: 'HK',
 statusLabel: 'Confirmed',
 } as SegmentInfo;
 });
 }).filter(Boolean) as SegmentInfo[];

 const penaltyFee = reshop.Penalty?.Amount?.Amount || 0;
 const priceDiff = reshop.PriceDifference?.Amount || 0;

 return {
 reshopOfferId: reshop.ReshopOfferID,
 originalOrderItemIds: reshop.OriginalOrderItemRefID,
 newJourney: {
 segments,
 duration: calculateJourneyDuration(segments),
 },
 pricing: {
 newPrice: newOffer.TotalPrice.TotalAmount.Amount,
 priceDifference: priceDiff,
 penaltyFee,
 totalToPay: Math.max(0, priceDiff + penaltyFee),
 currency: newOffer.TotalPrice.TotalAmount.CurCode,
 },
 _reshopData: {
 transactionId: response.TransactionID,
 reshopOfferId: reshop.ReshopOfferID,
 newOfferId: newOffer.OfferID,
 newOfferItemIds: newOffer.OfferItem.map(item => item.OfferItemID),
 },
 };
 });

 // Cancellation Option Conversion
 const cancelOptions = (response.CancelOffer || []).map(cancel => ({
 cancelOfferId: cancel.CancelOfferID,
 originalOrderItemIds: cancel.OriginalOrderItemRefID,
 refund: {
 grossRefund: cancel.RefundAmount?.Amount || 0,
 penalty: cancel.PenaltyAmount?.Amount || 0,
 netRefund: cancel.NetRefundAmount?.Amount || 0,
 currency: cancel.RefundAmount?.CurCode || 'KRW',
 },
 _cancelData: {
 transactionId: response.TransactionID,
 cancelOfferId: cancel.CancelOfferID,
 },
 }));

 return { reshopOptions, cancelOptions };
}
```

---

## 3. OrderCreateRS → BookingConfirmation

### 3.1 Response Type definition

```typescript
export interface OrderCreateResponse {
 ResultMessage?: {
 Code: string;
 Message?: string;
 };
 TransactionID: string;
 Order: {
 OrderID: string;
 Owner: string;
 BookingReference?: Array<{
 Id: string;
 AirlineID?: string;
 }>;
 OrderStatus: string;
 PaymentTimeLimit?: string;
 TicketTimeLimit?: string;
 };
}
```

### 3.2 BookingConfirmation Interface (UI)

```typescript
export interface BookingConfirmation {
 orderId: string;
 pnr: string;
 status: string;
 statusLabel: string;
 paymentTimeLimit?: string;
 ticketingTimeLimit?: string;
 message: string;

 // ⭐ OrderRetrieve for Call
 _orderData: {
 transactionId: string;
 orderId: string;
 owner: string;
 };
}
```

### 3.3 Transform Function

```typescript
export function transformOrderCreateResponse(response: OrderCreateResponse): BookingConfirmation {
 const order = response.Order;

 const pnr = order.BookingReference?.find(
 ref => ref.AirlineID === order.Owner || !ref.AirlineID
 )?.Id || order.OrderID;

 return {
 orderId: order.OrderID,
 pnr,
 status: order.OrderStatus,
 statusLabel: mapOrderStatus(order.OrderStatus),
 paymentTimeLimit: order.PaymentTimeLimit,
 ticketingTimeLimit: order.TicketTimeLimit,
 message: `Booking Complete. PNR: ${pnr}`,
 _orderData: {
 transactionId: response.TransactionID,
 orderId: order.OrderID,
 owner: order.Owner,
 },
 };
}
```

---

## 4. Helper Functions

```typescript
// Booking Status code → Label
function mapOrderStatus(status: string): string {
 const map: Record<string, string> = {
 HD: 'BookingPending',
 CONFIRMED: 'BookingComplete',
 TICKETED: 'TicketingComplete',
 CANCELLED: 'Cancellation',
 };
 return map[status] || status;
}

// Segment Status code → Label
function mapStatusCode(code: string): string {
 const map: Record<string, string> = {
 HK: 'Confirmed',
 HD: 'ConfirmedPending',
 HI: 'IssueComplete',
 TK: 'TicketComplete',
 XX: 'Cancellation',
 };
 return map[code] || code;
}

// PassengerType Code → Label
function formatPtc(ptc: string): string {
 const map: Record<string, string> = { ADT: 'Adult', CHD: 'Child', INF: 'Infant' };
 return map[ptc] || ptc;
}

// SeatClass Code → Label
function mapCabinClass(code: string): string {
 const map: Record<string, string> = {
 Y: 'Economy class', M: 'Economy class', W: 'Premium/Business Economy class',
 C: 'Business class', J: 'Business class', F: 'First class',
 };
 return map[code] || code;
}

// ISO 8601 duration → Korean
function formatDuration(duration: string): string {
 const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
 if (!match) return duration;
 const hours = match[1] ? `${match[1]}Time` : '';
 const minutes = match[2] ? ` ${match[2]}min` : '';
 return `${hours}${minutes}`.trim();
}

// Per carrier Feature Support
function getCarrierFeatures(carrierCode: string): {
 journeyChange: boolean;
 infoChange: boolean;
} {
 const features: Record<string, { journeyChange: boolean; infoChange: boolean }> = {
 AF: { journeyChange: true, infoChange: false },
 KL: { journeyChange: true, infoChange: false },
 SQ: { journeyChange: true, infoChange: true },
 QR: { journeyChange: true, infoChange: true },
 KE: { journeyChange: true, infoChange: true },
 // DefaultValue
 DEFAULT: { journeyChange: true, infoChange: true },
 };
 return features[carrierCode] || features.DEFAULT;
}

// Journey/Itinerary Total Duration Calculate
function calculateJourneyDuration(segments: SegmentInfo[]): string {
 if (segments.length === 0) return '';
 const first = segments[0];
 const last = segments[segments.length - 1];

 try {
 const dep = new Date(`${first.departure.date}T${first.departure.time}`);
 const arr = new Date(`${last.arrival.date}T${last.arrival.time}`);
 const diffMs = arr.getTime() - dep.getTime();
 const hours = Math.floor(diffMs / (1000 * 60 * 60));
 const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
 return `${hours}Time ${minutes}min`;
 } catch {
 return '';
 }
}
```

---

## Reference ID Connection 다이그

```
OrderRetrieveRS Structure:

Order
├── OrderID
├── OrderItem[]
│ ├── OrderItemID
│ ├── PaxRefID[] ────────────────→ DataLists.PaxList[].PaxID
│ ├── PaxSegmentRefID[] ─────────→ DataLists.PaxSegmentList[].PaxSegmentID
│ └── ServiceRefID ──────────────→ DataLists.ServiceDefinitionList[]
└── TicketDocInfo[]
 └── PaxRefID ──────────────────→ DataLists.PaxList[].PaxID

DataLists.PaxList[]
├── PaxID
├── Individual (Name, Date of Birth)
└── ContactInfoRefID[] ────────────→ DataLists.ContactInfoList[].ContactInfoID

DataLists.PaxJourneyList[]
├── PaxJourneyID
└── PaxSegmentRefID[] ─────────────→ DataLists.PaxSegmentList[].PaxSegmentID
```

---

## Reference

- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml`
- **API Mapping**: `.claude/skills/whitelabel-dev/references/api-mapping/order-retrieve.md`
- **Status code**: `.claude/assets/ui-component-guide/02-common/status-codes.md`
