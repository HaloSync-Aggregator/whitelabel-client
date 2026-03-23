# Passenger Split (Passenger Split) API Mapping

> **Version**: 1.2.3 (paxRefId completely Exclude + phoneNumber string)

## Overview

Partial Passenger using Split Separate's to PNR Management Feature.
**WF_HELD_SPLIT** (Before ticketing), **WF_TKT_SPLIT** (After ticketing) in Workflow Corresponding.

## Supported carriers

| Carrier | Before ticketing | After ticketing | Concurrent Split Number of passengers |
|--------|:------:|:------:|:-------------:|
| AY | O | O | 1person |
| HA | O | O | 1person |
| KL | O | O | 1person |
| SQ | O | O | 1person |
| TK | O | O | 1person |
| TR | O | O | 1person |

**Supported carriers Code**: `['AY', 'HA', 'KL', 'SQ', 'TK', 'TR']`

---

## API Flow

```
OrderRetrieve → OrderChange (reasonCode="DIV") → OrderRetrieve (new PNR)
```

---

## ⚠️ CRITICAL: API Request/Response structure (v1.2.3)

### Middleware Request Rules

> **⚠️ Important**: Middleware API **camelCase** Structure Use!
>
> **Wrong e.g. (PascalCase + Query Wrapper)**:
> - `Sender`, `PointOfSale`, `TransactionID`, `Query: { OrderID, ReasonCode, ... }` ❌
>
> **Correct example (camelCase, flat structure)**:
> - `transactionId`, `orderId`, `reasonCode`, `changeOrderChoice`, `paxList`, ... ✅

### OrderChange Split Request

```typescript
interface MiddlewarePaxSplitRequest {
 transactionId: string;
 orderId: string;
 /** ⚠️ CRITICAL: "DIV" = Split Task 식별 (Top-level Level!) */
 reasonCode: 'DIV';
 changeOrderChoice: {
 updatePax: Array<{
 /** Split Passenger ID */
 newPaxRefId: string;
 }>;
 };
 /** All/Total Passenger List (INF Include) */
 paxList: MiddlewarePaxInfo[];
 contactInfoList: MiddlewareContactInfo[];
 paymentList: [];
}
```

> **⚠️ CRITICAL v1.2.3**: `updatePax`in **Select Passenger** Include!
> Accompanying INF existseven without ADT only if Include Middleware **Autoto Doestogether Split**.
> INF Doestogether if Include 500 Error occurs!

### PaxList Item (camelCase!)

> **⚠️ CRITICAL v1.2.2**: `paxRefId` **from paxList completelyly Exclude**must !
> INF Include **떤 Passenger에** `paxRefId` Field if Include Error occurs!

```typescript
interface MiddlewarePaxInfo {
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 individual: {
 individualId?: string;
 birthdate?: string;
 gender?: string;
 nameTitle?: string;
 givenName: string[];
 middleName: string[];
 surname: string;
 };
 contactInfoRefId: string[];
 // ⚠️ paxRefId Field None! if Include API Error!
 identityDoc?: Array<{
 identityDocumentNumber?: string;
 identityDocumentType?: string;
 issuingCountryCode?: string;
 citizenshipCountryCode?: string;
 expiryDate?: string;
 gender?: string;
 givenName?: string[];
 middleName?: string[];
 surname?: string;
 }>;
 loyaltyProgramAccount?: unknown[];
}
```

**paxRefId Process Logic (v1.2.2):**
```typescript
// ⚠️ CRITICAL: paxRefId from paxList completelyly Exclude!
// OrderRetrieve from the response PaxRefID INF-ADT in Mapping only Useand,
// OrderChange Request's paxListin Never Includedoes not!

const paxInfo: MiddlewarePaxInfo = {
 paxId: pax.PaxID,
 ptc: pax.Ptc,
 individual: { ... },
 contactInfoRefId: contactRefIds,
 identityDoc: pax.IdentityDoc?.map(doc => ({ ... })),
 loyaltyProgramAccount: pax.LoyaltyProgramAccount || [],
 // paxRefId Field None!
};
```

### ContactInfoList Item (camelCase!)

> **⚠️ CRITICAL**: `phoneNumber` **Must string**! to number if Transmission Error!

```typescript
interface MiddlewareContactInfo {
 contactInfoId: string;
 emailAddress?: string[];
 phone?: Array<{
 countryDialingCode?: string;
 /** ⚠️ CRITICAL: Must string! number when Transmission Error */
 phoneNumber?: string;
 }>;
}
```

**phoneNumber Conversion logic:**
```typescript
// ⚠️ phoneNumber stringto Conversion (API Spec requirementnotes)
phoneNumber: String(p.PhoneNumber ?? '')
```

### Core Points

| Item | Description |
|------|------|
| `reasonCode: "DIV"` | Split Task's Core 식별 (Top-level Level!) |
| `changeOrderChoice.updatePax` | Split Passenger ID only Include |
| `paxList` | All/Total Passenger List (paxRefId Exclude!) |
| `paymentList` | Empty array (Split Free) |

### OrderChange Split Response

```typescript
interface MiddlewarePaxSplitResponse {
 transactionId: string;
 response: {
 ResultMessage: {
 Code: string;
 Message?: string;
 };
 Order?: {
 OrderID: string;
 OrderStatus?: string;
 BookingReference?: Array<{
 Id: string;
 AirlineID: string;
 /** "ASSOCIATED_BOOKING" = Parent-child relation */
 Type?: string;
 }>;
 };
 };
}
```

### new PNR Information Extract

```typescript
// from BookingReference Type: "ASSOCIATED_BOOKING" Item child PNR
const newBookingRef = response.Order?.BookingReference?.find(
 ref => ref.Type === 'ASSOCIATED_BOOKING'
);
const newPnr = newBookingRef?.Id;
```

---

## restrictionnotes

| restriction | Description |
|------|------|
| 1personeach only Split | in 번 1person only Split Available (QR also 1person) |
| ADT+INF 트 | Accompanying Infant if exists Doestogether Split |
| INF standalone Not possible | Infant standaloneto Split None |
| Minimum 잔여 1person | Original in PNR Minimum 1person Boymust Does |
| merge Not possible | after Split again 합칠 None |

---

## INF Process Logic

```typescript
// OrderRetrieve from Response INF's to PaxRefID Accompanying ADT find
// ( Information Split Target in Determine only Use, paxListin Include Does!)
const accompanyingInfant = paxList.find(
 p => p.Ptc === 'INF' && p.PaxRefID === splitPaxId
);

// Split Target PaxID List
const splitPaxIds = accompanyingInfant
 ? [splitPaxId, accompanyingInfant.PaxID] // ADT + INF
 : [splitPaxId]; // ADT
```

---

## Error handling

| Error scenarios | Message |
|----------|--------|
| Carrier unSupport | "{code} Carrier Passenger Split Supportdoes not." |
| 2person Under | "Passenger 2person Or more In the case of only Split ." |
| INF standalone Select | "Infant standaloneto Split ." |
| Passenger None | "Split Passenger find ." |
| paxRefId Include | "paxList.X.property paxRefId should not exist" |

---

## File Structure

| File | Role |
|------|------|
| `types/pax-split.ts` | Type definition + helper Function |
| `lib/api/polarhub-service.ts (splitPax)` | Pax split service function |
| `components/booking/PassengerSplitModal.tsx` | 2Step Modal UI |
| `pages/booking/[id].tsx` | Page integration |

---

## Change history

| Version | Date | Change Content |
|------|------|----------|
| 1.0.0 | - | initial Version (PascalCase + Query Wrapper) |
| 1.2.0 | 2026-01-27 | **camelCase to Structure Switch**, Sender/Query Wrapper Remove, reasonCode Top-level Level |
| 1.2.1 | 2026-01-27 | paxRefId in INF only when Include also (Failure), phoneNumber Must string |
| 1.2.2 | 2026-01-27 | paxRefId from paxList completely Exclude |
| 1.2.3 | 2026-01-27 | **in updatePax Select Passenger only Include** (Accompanying INF Auto Process, if Include 500 Error) |

---

## Related documents

- [Booking detail](./order-retrieve.md)
- [Passenger information Change](./pax-change.md)
