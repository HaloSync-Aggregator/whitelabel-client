# BookingDetail UI Field definitions

> Source: `.claude/assets/ui-component-guide/04-booking-detail/booking-detail.md`

---

## 1. Header area (Header)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| pnr | string | O | Number 6Seat | ABC123 | when Click 갱신 |
| orderId | string | O | Luna OrderID | ORD-2024-001 | - |
| tabLabel | string | O | Text | BookingDetail ABC123 | Tab label |
| cancelButtonLabel | string | O | Text | Cancel / VOID/REFUND | Ticketing WhetherDepending on different |

---

## 2. OCN Information (OcnInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| ocnList | OcnItem[] | X | table | - | OCN receive history |
| ocnList[].actionType | string | O | English | CANCEL, MODIFY | ActionType |
| ocnList[].context | string | O | Number | 001 | Context Number |
| ocnList[].description | string | X | Text | schedule Change | Remarks (if absent 공백) |
| ocnList[].receivedAt | string | O | YYYY-MM-DD HH:mm | 2024-02-21 14:30 | receiveDate/Time (KST) |
| showOcnAgreeButton | boolean | O | true/false | true | AF, KL only Exposed |

---

## 3. Booking Information (BookingInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| carrierCode | string | O | 2Seat code | KE, SQ | Carrier |
| carrierName | string | O | Text | Korean Air | Carrierperson |
| pnr | string | O | Number 6Seat | ABC123 | Carrier PNR |
| paymentTL | string | X | YYYY-MM-DD HH:mm | 2024-02-25 23:59 | Payment TL (KST) |
| ticketingTL | string | X | YYYY-MM-DD HH:mm | 2024-02-26 23:59 | Ticketing TL (KST) |
| fareGuaranteeTL | string | X | YYYY-MM-DD HH:mm | 2024-02-24 23:59 | FeeEnsure TL (KST) |
| createdAt | string | O | YYYY-MM-DD HH:mm | 2024-02-21 10:30 | BookingDate/Time (Luna DB) |
| status | string | O | Status code | CONFIRMED, TICKETED | BookingStatus |
| statusLabel | string | O | Text | BookingComplete, TicketingComplete | Status Displayperson |
| isTicketed | boolean | O | true/false | false | Ticketing Whether |
| ticketedAt | string | X | YYYY-MM-DD HH:mm | 2024-02-22 15:00 | TicketingDate/Time (After ticketing) |
| showPaymentButton | boolean | O | true/false | true | Payment&Issue Button Exposed |

---

## 4. Passenger information (PassengerInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxList | PassengerItem[] | O | table | - | Passenger List |
| paxList[].paxId | string | O | PAX + Number | PAX1 | - |
| paxList[].ptc | string | O | English Code | ADT, CHD, INF | Passenger type |
| paxList[].ptcLabel | string | O | Korean | Adult, Child, Infant | Displayperson |
| paxList[].title | string | O | English | MR, MRS, MSTR, MISS | - |
| paxList[].property | string | O | English Uppercase | HONG | English property |
| paxList[].givenName | string | O | English Uppercase | GILDONG | English Name |
| paxList[].fullName | string | O | English | HONG/GILDONG | property/Name |
| paxList[].birthdate | string | O | YYYY-MM-DD | 1990-01-15 | Date of Birth |
| paxList[].mobile | string | X | CountryNumber + Number | +82-10-1234-5678 | Infant Exclude |
| paxList[].email | string | X | Email | hong@email.com | Infant Exclude |
| paxList[].apisInfo | ApisInfo | X | Object | - | when Booking Input Case |
| paxList[].accompanyingInfant | string | X | English property/given name | KIM/BABY | in Adult Display |
| paxList[].ffn | FfnInfo | X | Object | - | Mileage Information |
| showInfoChangeButton | boolean | O | true/false | true | InformationChange Button Exposed |
| showPaxSplitButton | boolean | O | true/false | false | Passenger split Button Exposed |

### ApisInfo (Passport Information)

| Field name | Type | Required | Display format | Example |
|--------|------|:----:|----------|------|
| passportNumber | string | O | Text | M12345678 |
| nationality | string | O | CountryCode | KR |
| expiryDate | string | O | YYYY-MM-DD | 2030-01-15 |

### FfnInfo (Mileage Information)

| Field name | Type | Required | Display format | Example |
|--------|------|:----:|----------|------|
| programCode | string | O | Log Code | KE |
| memberNumber | string | O | Text | 1234567890 |

---

## 5. Journey information (ItineraryInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| itineraryList | ItineraryItem[] | O | table | - | Journey/Itinerary List |
| itineraryList[].segmentNo | number | O | Number | 1, 2 | SEG Order |
| itineraryList[].carrierCode | string | O | 2Seat code | SQ | 마케ting캐리 |
| itineraryList[].flightNumber | string | O | Flight number | SQ608 | - |
| itineraryList[].departureAirport | string | O | AirportCode | ICN | - |
| itineraryList[].departureTime | string | O | HH:mm | 09:30 | - |
| itineraryList[].departureDate | string | O | DD/MMM/YYYY | 21/FEB/2024 | - |
| itineraryList[].arrivalAirport | string | O | AirportCode | SIN | - |
| itineraryList[].arrivalTime | string | O | HH:mm | 15:00 | - |
| itineraryList[].cabinClass | string | O | Koreanperson | Economy class | - |
| itineraryList[].priceClass | string | O | English Code | Y, M, L | Price Class / RBD |
| itineraryList[].baggage | string | O | Count/Weight | 1PC, 23KG | - |
| itineraryList[].codeShare | string | X | 2Seat code | OZ | if absent 공백 |
| itineraryList[].hiddenStops | string | X | AirportCode | NRT | if absent 공백 |
| itineraryList[].status | string | O | StatusCode | HK, TK | Journey/ItineraryStatus |
| showSeatButton | boolean | O | true/false | true | Seat Button Exposed |
| showServiceButton | boolean | O | true/false | true | Service Button Exposed |
| showJourneyChangeButton | boolean | O | true/false | false | Journey/ItineraryChange Button Exposed |

---

## 6. Payment Target Amount (PaymentAmount) - Before ticketing only Exposed

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paymentInfo | PaymentItem[] | O | table | - | Payment Target Amount List |
| paymentInfo[].paxId | string | O | PAX ID | PAX1 | - |
| paymentInfo[].ptc | string | O | English Code | ADT | Passenger type |
| paymentInfo[].ptcLabel | string | O | Korean | Adult | - |
| paymentInfo[].baseFare | number | O | Number | 800000 | Fare |
| paymentInfo[].taxes | number | O | Number | 50000 | Tax |
| paymentInfo[].totalFare | number | O | Number | 850000 | Totalamount |
| paymentInfo[].currency | string | O | CurrencyCode | KRW | - |
| totalBaseFare | number | O | Number | 1600000 | All/Total Fare Total |
| totalTaxes | number | O | Number | 100000 | All/Total Tax Total |
| grandTotal | number | O | Number | 1700000 | Total payment |

---

## 7. SSR Information (SsrInfo)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| ssrList | SsrItem[] | X | table | - | SSR List |
| ssrList[].paxId | string | O | PAX ID | PAX1 | - |
| ssrList[].paxName | string | O | English property/given name (PTC) | HONG/GILDONG (ADT) | - |
| ssrList[].segment | string | O | Segment | ICN-SIN | - |
| ssrList[].ssrName | string | O | Serviceperson | Seat Reservation 10A | - |
| ssrList[].status | string | O | StatusCode | HK, HD, HI | - |
| ssrList[].statusLabel | string | O | Korean | Confirmed, Confirmed Pending | - |
| showPurchaseConfirmButton | boolean | O | true/false | true | PurchaseConfirmed Button Exposed |
| hasPendingSsr | boolean | O | true/false | true | Pending SSR Exists Whether |

---

## 8. Ticket Information (TicketInfo) - After ticketing only Exposed

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| ticketList | TicketItem[] | O | table | - | Ticket List |
| ticketList[].ticketNumber | string | O | 13Seat Number | 1234567890123 | when Click Detail Popup |
| ticketList[].ticketType | string | O | TICKET/EMDA/EMDS | TICKET | Ticket Type |
| ticketList[].ticketTypeLabel | string | O | Korean | Air ticket, Ancillary service | - |
| ticketList[].emdDetail | string | X | SSRperson | Seat 10A | EMD only Display |
| ticketList[].passengerName | string | O | English full name | HONG/GILDONG | - |
| ticketList[].paxId | string | O | PAX ID | PAX1 | - |
| ticketList[].segments | string | X | Segment | ICN-SIN | TICKET only |
| ticketList[].totalFare | number | X | Number | 850000 | TICKET only |
| ticketList[].currency | string | X | CurrencyCode | KRW | - |
| ticketList[].isOriginal | boolean | O | true/false | false | Re-Issue Whether |
| showFareRulesButton | boolean | O | true/false | true | rules Button Exposed |

---

## 9. PNR History (Change history Popup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| historyList | HistoryItem[] | O | table | - | Change history List |
| historyList[].dateTime | string | O | YYYY-MM-DD HH:mm | 2024-02-21 10:30 | KST |
| historyList[].site | string | O | Text | Luna Web | 채널/사이트 |
| historyList[].user | string | O | Text | admin@test.com | User |
| historyList[].userRole | string | O | Text | Admin | 권 |
| historyList[].changeType | string | O | English Code | CREATE, TICKETING | Change type |
| historyList[].changeTypeLabel | string | O | Korean | Booking creation, Ticketing | - |

### Change Type type

| Code | Displayperson |
|------|--------|
| CREATE | Booking creation |
| TICKETING | Ticketing |
| CANCEL | Cancellation |
| VOID | 보이드 |
| REFUND | Refund |
| PAX_SPLIT | Passenger Split |
| INFO_CHANGE | Information change |
| JOURNEY_CHANGE | Journey change |
| SEAT_PURCHASE | Seat purchase |
| SERVICE_PURCHASE | Service purchase |

---

## TypeScript Interface

```typescript
interface BookingDetailData {
 // Header
 pnr: string;
 orderId: string;
 tabLabel: string;
 cancelButtonLabel: string;

 // OCN Information
 ocnList: OcnItem[];
 showOcnAgreeButton: boolean;

 // Booking Information
 bookingInfo: BookingInfo;

 // Passenger information
 paxList: PassengerItem[];
 showInfoChangeButton: boolean;
 showPaxSplitButton: boolean;

 // Journey information
 itineraryList: ItineraryItem[];
 showSeatButton: boolean;
 showServiceButton: boolean;
 showJourneyChangeButton: boolean;

 // Payment Target Amount (Before ticketing)
 paymentInfo?: PaymentItem[];
 totalBaseFare?: number;
 totalTaxes?: number;
 grandTotal?: number;

 // SSR Information
 ssrList: SsrItem[];
 showPurchaseConfirmButton: boolean;
 hasPendingSsr: boolean;

 // Ticket Information (After ticketing)
 ticketList?: TicketItem[];
 showFareRulesButton: boolean;
}

interface OcnItem {
 actionType: string;
 context: string;
 description?: string;
 receivedAt: string;
}

interface BookingInfo {
 carrierCode: string;
 carrierName: string;
 pnr: string;
 paymentTL?: string;
 ticketingTL?: string;
 fareGuaranteeTL?: string;
 createdAt: string;
 status: string;
 statusLabel: string;
 isTicketed: boolean;
 ticketedAt?: string;
 showPaymentButton: boolean;
}

interface PassengerItem {
 paxId: string;
 ptc: string;
 ptcLabel: string;
 title: string;
 property: string;
 givenName: string;
 fullName: string;
 birthdate: string;
 mobile?: string;
 email?: string;
 apisInfo?: ApisInfo;
 accompanyingInfant?: string;
 ffn?: FfnInfo;
}

interface ApisInfo {
 passportNumber: string;
 nationality: string;
 expiryDate: string;
}

interface FfnInfo {
 programCode: string;
 memberNumber: string;
}

interface ItineraryItem {
 segmentNo: number;
 carrierCode: string;
 flightNumber: string;
 departureAirport: string;
 departureTime: string;
 departureDate: string;
 arrivalAirport: string;
 arrivalTime: string;
 cabinClass: string;
 priceClass: string;
 baggage: string;
 codeShare?: string;
 hiddenStops?: string;
 status: string;
}

interface PaymentItem {
 paxId: string;
 ptc: string;
 ptcLabel: string;
 baseFare: number;
 taxes: number;
 totalFare: number;
 currency: string;
}

interface SsrItem {
 paxId: string;
 paxName: string;
 segment: string;
 ssrName: string;
 status: string;
 statusLabel: string;
}

interface TicketItem {
 ticketNumber: string;
 ticketType: 'TICKET' | 'EMDA' | 'EMDS';
 ticketTypeLabel: string;
 emdDetail?: string;
 passengerName: string;
 paxId: string;
 segments?: string;
 totalFare?: number;
 currency?: string;
 isOriginal: boolean;
}

interface HistoryItem {
 dateTime: string;
 site: string;
 user: string;
 userRole: string;
 changeType: string;
 changeTypeLabel: string;
}
```

---

## Per carrier Support Feature Mapping

```typescript
const carrierFeatureSupport: Record<string, Record<string, boolean>> = {
 'AF': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: true, ocnAgree: true },
 'KL': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: true, ocnAgree: true },
 'SQ': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: true, paxSplit: true, seat: true, service: true, journeyChange: true, ocnAgree: false },
 'QR': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: true, paxSplit: true, seat: true, service: true, journeyChange: true, ocnAgree: false },
 'LH': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false },
 'EK': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false },
 'AA': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: false, journeyChange: false, ocnAgree: false },
 'KE': { pnrRetrieve: true, ticketing: true, cancel: false, voidRefund: false, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false },
 'BA': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false },
 'TR': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false },
 'TK': { pnrRetrieve: true, ticketing: true, cancel: true, voidRefund: true, infoChange: false, paxSplit: false, seat: true, service: true, journeyChange: false, ocnAgree: false }
};
```
