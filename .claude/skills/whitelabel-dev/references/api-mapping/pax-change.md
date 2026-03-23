# Passenger information Change API-UI Mapping

> **Service Function**: `changePax()` in `src/lib/api/pax-change-service.ts`
> **Template File**:
> - `templates/types/pax-change.ts.template`
> - `templates/components/booking/PassengerEditModal.tsx.template`
> - `templates/components/booking/pax-change/*.tsx.template`

---

## Core Concepts

### Per carrier Task Mode

| Mode | Description | Supported carriers |
|------|------|------------|
| `MODIFY_ONLY` | Change only Support | AF, KL |
| `ADD_DELETE_ONLY` | Add/Delete only Support | AY |
| `ALL` | All Support | HA, TK, KE |

### Per carrier UpdatePax Structure

| Carrier | Task Mode | UpdatePax Structure |
|--------|----------|----------------|
| AF, KL | MODIFY only | `CurrentPaxRefID` only |
| AY | ADD/DELETE only | Add: `NewPaxRefID`, Delete: `CurrentPaxRefID` |
| HA, TK, KE | All | Add: `NewPaxRefID`, Delete: `CurrentPaxRefID`, Change: Both |

---

## Before/After Ticketing Dynamic Branching

### FieldChangeSupport Extension

```typescript
export interface FieldChangeSupport {
 supported: boolean;
 heldOnly?: boolean; // Only supports before ticketing (Hold)
 ticketedOnly?: boolean; // Only supports after ticketing (Ticketed)
}
```

### KE Carrier Branch Example

| Field | Before ticketing | After ticketing | Configuration |
|------|:------:|:------:|------|
| Name | ✅ | ❌ | `{ supported: true, heldOnly: true }` |
| Contact | ✅ | ✅ | `{ supported: true }` |
| Passport | ❌ | ✅ | `{ supported: true, ticketedOnly: true }` |
| FFN | ✅ | ✅ | `{ supported: true }` |
| DOCA | ✅ | ❌ | `{ supported: true, heldOnly: true }` |

### Branch Function

```typescript
export function getAllowedPaxChanges(
 carrierCode: string,
 isTicketed: boolean
): AllowedPaxChanges {
 const features = getCarrierPaxChangeFeatures(carrierCode);

 const isFieldAllowed = (field: FieldChangeSupport | undefined): boolean => {
 if (!field?.supported) return false;
 if (isTicketed && field.heldOnly) return false;
 if (!isTicketed && field.ticketedOnly) return false;
 return true;
 };

 return {
 canChangeName: isFieldAllowed(features.name),
 canChangeContact: isFieldAllowed(features.contact),
 canChangeApis: isFieldAllowed(features.apis),
 canChangeFfn: isFieldAllowed(features.ffn),
 canChangeDoca: isFieldAllowed(features.doca),
 mode: features.mode,
 allowedActions: getAllowedActions(carrierCode),
 };
}
```

---

## Change Type (PaxChangeType)

| Type | Description | Form Component |
|------|------|------------|
| `NAME` | Name/Title/Honorific Change | `NameChangeForm.tsx` |
| `CONTACT` | Contact (Email/Phone) | `ContactChangeForm.tsx`, `ContactAddDeleteForm.tsx` |
| `APIS` | Passport Information | `ApisChangeForm.tsx` |
| `FFN` | Mileage Information | `FfnChangeForm.tsx` |
| `DOCA` | Residence Information | `DocaChangeForm.tsx` |

---

## API Request/Response structure

### Request (Request)

```typescript
// changePax() in src/lib/api/pax-change-service.ts
{
 paxId: string; // Passenger ID (PAX1, PAX2, ...)
 changeType: PaxChangeType; // NAME, CONTACT, APIS, FFN, DOCA
 action: PaxActionType; // ADD, DELETE, MODIFY
 carrierCode: string; // Carrier code
 data: {
 // NAME
 property?: string;
 givenName?: string;
 title?: string;

 // CONTACT
 email?: string;
 phone?: { countryCode?: string; number: string };

 // APIS
 passportNumber?: string;
 nationality?: string;
 expiryDate?: string;
 issuingCountry?: string;

 // FFN
 programCode?: string;
 memberNumber?: string;

 // DOCA
 street?: string;
 cityName?: string;
 postalCode?: string;
 countryCode?: string;
 };
}
```

### Response (Response)

```typescript
{
 success: boolean;
 orderId: string;
 paxId: string;
 changeType: PaxChangeType;
 message?: string;
 error?: string;
}
```

---

## Validation Pattern

```typescript
export const VALIDATION_PATTERNS = {
 NAME: /^[A-Z\s]+$/, // English uppercase only
 EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 PHONE: /^[\d+\-\s]+$/,
 PASSPORT: /^[A-Z0-9]+$/,
 COUNTRY_CODE: /^[A-Z]{2}$/,
 DATE: /^\d{4}-\d{2}-\d{2}$/,
};
```

---

## Component Use

### PassengerEditModal

```tsx
<PassengerEditModal
 isOpen={showModal}
 onClose={() => setShowModal(false)}
 orderId={orderId}
 carrierCode={carrierCode}
 passengers={passengers}
 allowedChanges={allowedChanges} // getAllowedPaxChanges() Result
 departureDate={departureDate}
 onSuccess={refreshOrder}
/>
```

### allowedChanges Calculate

```tsx
// booking/[id]/page.tsxfrom
const allowedChanges = getAllowedPaxChanges(carrierCode, isTicketed);
```

---

## Related files

| File | Description |
|------|------|
| `types/pax-change.ts` | Type definition, Matrix, helper Function |
| `types/booking.ts` | PassengerInfo, AllowedPaxChanges |
| `lib/api/pax-change-service.ts` | Pax change service function (`changePax()`) |
| `components/booking/PassengerEditModal.tsx` | Main Modal Component |
| `components/booking/pax-change/*.tsx` | Individual Change Form Component |

---

## ⚠️⚠️⚠️ CRITICAL: Middleware Request structure (v3.12.0) ⚠️⚠️⚠️

> **Sender, PointOfSale, Query Wrapper Use Prohibited!**
> **All Field camelCase** (PascalCase when Use 400 Error)

### ❌ Wrong pattern (old NDC XML Style)

```typescript
// 400 Error occurs!
const request = {
 Sender: { TravelAgency: {...} },
 PointOfSale: 'KR',
 TransactionID: txnId,
 Query: {
 OrderID: orderId,
 ChangeOrderChoice: {...},
 },
};
```

### ✅ Correct pattern (camelCase, No wrapper)

```typescript
const request = {
 transactionId: generateTransactionId(), // 32-char hex Required!
 orderId,
 changeOrderChoice: {
 updatePax: [{ currentPaxRefId: paxId }],
 },
 paxList: [{
 paxId,
 ptc: 'ADT',
 individual: { surname, givenName: [givenName], ... },
 }],
 contactInfoList: [...],
 paymentList: [],
};
```

### camelCase Field Mapping

| Old NDC (PascalCase) | New Middleware (camelCase) |
|---------------------|--------------------------|
| `TransactionID` | `transactionId` |
| `OrderID` | `orderId` |
| `ChangeOrderChoice` | `changeOrderChoice` |
| `UpdatePax` | `updatePax` |
| `CurrentPaxRefID` | `currentPaxRefId` |
| `NewPaxRefID` | `newPaxRefId` |
| `PaxList` | `paxList` |
| `PaxID` | `paxId` |
| `ContactInfoList` | `contactInfoList` |
| `ContactInfoID` | `contactInfoId` |
| `PaymentList` | `paymentList` |

---

## ⚠️ transactionId Re-Use Pattern (v3.12.1)

> **OrderRetrieve from the response transactionId using Save Subsequent from API Re-Required!**
> **New transactionId when Create 500 Error occurs**

### Correct Flow

```
1. OrderRetrieve API Call
 → Response: { _orderData: { transactionId: "abc123..." } }

2. booking from page transactionId Save
 → booking._orderData.transactionId

3. in PassengerEditModal transactionId Pass
 → <PassengerEditModal transactionId={booking._orderData.transactionId} />

4. pax-change API when Call transactionId Include
 → body: { transactionId, paxId, changeType, ... }

5. pax-change from route receive transactionId to as-is Use
 → const transactionId = body.transactionId; // ⚠️ Create Prohibited!
```

### ❌ Wrong pattern

```typescript
// pax-change-service.tsfrom
const transactionId = generateTransactionId(); // 500 Error!
```

### ✅ Correct pattern

```typescript
// pax-change-service.tsfrom
const transactionId = body.transactionId; // OrderRetrieve ResponseValue Re-Use
```

---

## ⚠️ Individual Block Conditionsection Include (v3.12.4)

> **Important**: Individual Block **birthdate exists when** Includemust be done!
> Sending Individual block without birthdate causes 400 Error:
> `"paxList.0.individual.birthdate must be a string"`

### CONTACT when Change

```typescript
// ✅ v3.13.6: AF, KL: Empty PaxList when changing Contact (Empty array)
request.paxList = [];
```

### APIS when Change (AF, KL)

```typescript
// ⚠️ birthdate exists when only Individual Include
const hasRequiredFields = apisData.birthdate && apisData.property && apisData.givenName;

if (hasRequiredFields) {
 // Individual Block Include
} else {
 // Individual Block Omitted, IdentityDoc only Pass
}
```

---

## ⚠️ NDC Spec + OpenAPI Spec combined (v3.12.3)

> **Important**: Middleware expects **camelCase**, but **Required Fields** from NDC Spec must all be included!
> Required fields exist in NDC Spec even if not specified in OpenAPI Spec.

### to IndividualD (Name Change)

```typescript
// ✅ Correct Fields (OpenAPI + NDC Spec combined)
individual: {
 // NDC Spec: Required for AF, KL, AY (pass even if absent in OpenAPI!)
 individualId: paxId.replace('PAX', 'ID'), // PAX1 → ID1 (AF, KL), PAX1 to as-is (AY)
 givenName: ['GILDONG'], // Required! Array!
 middleName: [], // ⚠️ NDC Spec required! All from Carrier Empty array Pass!
 surname: 'HONG', // Required!
 nameTitle: 'MR', // Select
 birthdate: '1990-01-15', // Select
 gender: 'MALE', // Select, Uppercase!
}
```

### ContactInfoID Pattern (Per carrier)

```typescript
// ⚠️ Per carrier Pattern different!
// AF, KL: CTC1, CTC2 (PAX1 → CTC1)
// KE, HA, TK: CI1, CI1-1 (when MODIFY -1 suffix)
// AY: CTCPAX1_1, CTCPAX1_2
```

### to LoyaltyProgramAccountD (FFN Change)

```typescript
// ✅ Correct Field (OpenAPI Spec)
loyaltyProgramAccount: [{
 accountNumber: '345908306', // Member Number
 programCode: 'KE', // Carrier code
}]

// ⚠️ NDC Spec: contactInfoRefId, identityDoc: [] Required!
paxList: [{
 paxId: 'PAX1',
 ptc: 'ADT',
 contactInfoRefId: ['CI1'], // NDC Spec required!
 identityDoc: [], // NDC Spec required!
 loyaltyProgramAccount: [{ accountNumber, programCode }],
}]
```

### to IdentityDocD (APIS Change)

```typescript
// ✅ Correct Fields (OpenAPI + NDC Spec combined)
identityDoc: [{
 identityDocType: 'PT', // Document Type
 identityDocId: 'M12345678', // Passport Number
 expiryDate: '2030-01-01',
 issuingCountryCode: 'KR',
 citizenshipCountryCode: 'KR',
 // ⚠️ NDC Spec required Field들!
 givenName: ['GILDONG'], // NDC Spec required!
 middleName: [], // NDC Spec required!
 surname: 'HONG', // NDC Spec required!
 visa: [], // NDC Spec required!
 // from AY Add
 residenceCountryCode: 'KR', // from AY Required
 gender: 'MALE', // AF, from KL Required
}]
```

### PaxList Common Field (NDC Spec)

```typescript
// ⚠️ Most changes require the following fields!
paxList: [{
 paxId: 'PAX1',
 ptc: 'ADT',
 contactInfoRefId: ['CI1'], // NDC Spec required!
 identityDoc: [], // NDC Spec required! (Pass empty array even if not used)
 loyaltyProgramAccount: [], // NDC Spec required! (Pass empty array even if not used)
}]
```

---

## ⚠️ paxInfo Pass Required (v3.12.5)

> **Individual in Block birthdate, surname, givenName, gender Required!**
> ** Passenger information must be retrieved from OrderRetrieve response and included in API request!**

### Problem Scenario

Individual in Block `birthdate` Field if not present 400 Error occurs:
```
"paxList.0.individual.birthdate must be a string"
```

### Resolution: from PassengerEditModal paxInfo Pass

```typescript
// PassengerEditModal.tsxfrom
import { changePax } from '@/lib/api/pax-change-service';

const result = await changePax({
 transactionId,
 orderId,
 paxId: selectedPaxId,
 changeType: selectedChangeType,
 action: selectedAction,
 carrierCode,
 data,
 // ⚠️ CRITICAL: NDC Spec - Passenger information from OrderViewRS data is required!
 paxInfo: {
 property: selectedPax.property,
 givenName: selectedPax.givenName,
 birthdate: selectedPax.birthdate, // ⚠️ Core!
 gender: selectedPax.gender, // ⚠️ Core!
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

### pax-change/route.from ts paxInfo Use

```typescript
// PaxInfoFromOrder Interface
interface PaxInfoFromOrder {
 property: string;
 givenName: string;
 birthdate?: string; // ⚠️ Individual in Block Required!
 gender?: 'MALE' | 'FEMALE';
 title?: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 email?: string;
 mobile?: string;
 apisInfo?: {...};
 ffn?: {...};
 docaInfo?: {...};
}

// from buildOrderChangeRequest paxInfo Use
function buildOrderChangeRequest(
 transactionId: string,
 orderId: string,
 changeRequest: AnyPaxChangeRequest & { action: PaxActionType },
 mode: PaxChangeMode,
 paxInfo?: PaxInfoFromOrder // ⚠️ Required Parameter!
): OrderChangeRequestBody {
 // NAME when Change
 const birthdate = paxInfo?.birthdate; // OrderRetrieve Responseimported from
 const gender = paxInfo?.gender;
 const ptc = paxInfo?.ptc || 'ADT';

 // APIS when Change
 const property = paxInfo?.property;
 const givenName = paxInfo?.givenName;
 ...
}
```

### Data flow

```
OrderRetrieve (getBookingDetail())
 ↓
booking page (booking._orderData.passengers)
 ↓
PassengerEditModal (passengers prop, selectedPax Select)
 ↓
changePax() service function (paxInfo Parameter)
 ↓
buildOrderChangeRequest (paxInfo Parameter)
 ↓
Individual Block / in IdentityDoc birthdate, surname, givenName Include
```

## ⚠️ AY Contact when ADD contactInfoRefIds Required (v3.12.6)

> **NDC Spec section 4.2: Contact Info when ADD OrderViewRS's Existing ContactInfoRefID List Required!**
> **Do not create new IDs, use existing list as-is!**

### Problem Scenario

AY Carrier Contact Info when ADD Individual Block emptyexists거나, ContactInfoRefID 잘못 Create:
```json
{
 "Individual": {
 "GivenName": [],
 "Surname": "",
 "Birthdate": ""
 },
 "ContactInfoRefID": ["CTCPAX2_1", "CTCPAX2_2"] // ← Newly Create ID (잘못!)
}
```

### NDC Spec section 4.2 requirementnotes

```json
{
 "Individual": {
 "IndividualID": "PAX2",
 "Birthdate": "1992-08-17",
 "Gender": "FEMALE",
 "NameTitle": "MS",
 "GivenName": ["JANICE"],
 "MiddleName": [],
 "Surname": "CHRIS"
 },
 "ContactInfoRefID": ["CTCPAX2_1", "CTCPAX2_2"], // ← OrderViewRS's Existing List!
 "IdentityDoc": [],
 "LoyaltyProgramAccount": []
}
```

### Resolution: in PaxInfoFromOrder contactInfoRefIds Add

```typescript
// pax-change-service.ts
interface PaxInfoFromOrder {
 property: string;
 givenName: string;
 birthdate?: string;
 gender?: 'MALE' | 'FEMALE';
 title?: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 email?: string;
 mobile?: string;
 // ⚠️ v3.12.6: Contact when ADD OrderViewRS's Existing ContactInfoRefID List Required!
 contactInfoRefIds?: string[];
 apisInfo?: {...};
 ffn?: {...};
 docaInfo?: {...};
}
```

### PassengerInfo in Type contactInfoRefIds Add

```typescript
// types/booking.ts
export interface PassengerInfo {
 paxId: string;
 ptc: 'ADT' | 'CHD' | 'INF';
 // ...
 // ⚠️ NDC Spec section 4.2: OrderViewRS's Existing ContactInfoRefID List
 contactInfoRefIds?: string[];
 // ...
}
```

### from OrderRetrieve contactInfoRefIds Extract

```typescript
// order-retrieve-transformer.ts's passengers Conversion partial
const passengers = paxList.map((pax) => {
 const contactRefIds = Array.isArray(pax.ContactInfoRefID)
 ? pax.ContactInfoRefID
 : pax.ContactInfoRefID ? [pax.ContactInfoRefID] : [];

 return {
 paxId: pax.PaxID,
 ptc: pax.Ptc,
 // ...
 contactInfoRefIds: contactRefIds, // ⚠️ OrderViewRS's Existing List as-is!
 // ...
 };
});
```

### from PassengerEditModal contactInfoRefIds Pass

```typescript
// PassengerEditModal.tsx
paxInfo: {
 property: selectedPax.property,
 givenName: selectedPax.givenName,
 birthdate: selectedPax.birthdate,
 gender: selectedPax.gender,
 title: selectedPax.title,
 ptc: selectedPax.ptc,
 email: selectedPax.email,
 mobile: selectedPax.mobile,
 // ⚠️ v3.12.6: OrderViewRS's Existing ContactInfoRefID List Required!
 contactInfoRefIds: selectedPax.contactInfoRefIds,
 apisInfo: selectedPax.apisInfo,
 ffn: selectedPax.ffn,
 docaInfo: selectedPax.docaInfo,
},
```

### pax-change-service from contactInfoRefIds Use

```typescript
// CONTACT case's ADD_DELETE_ONLY Branch
if (mode === 'ADD_DELETE_ONLY' && action === 'ADD') {
 const existingContactInfoRefIds = paxInfo?.contactInfoRefIds || [];

 request.paxList = [{
 paxId: paxId,
 ptc: ptc,
 individual: {
 individualId: paxId,
 surname: property,
 givenName: givenName ? [givenName] : [],
 middleName: [],
 ...(birthdate && { birthdate }),
 ...(gender && { gender }),
 ...(title && { nameTitle: title }),
 },
 // ⚠️ OrderViewRS's Existing ContactInfoRefID List to as-is Use!
 contactInfoRefId: existingContactInfoRefIds,
 identityDoc: [],
 loyaltyProgramAccount: [],
 }];
}
```

### Data flow (v3.12.6)

```
OrderRetrieve API Response (PaxList.ContactInfoRefID)
 ↓
order-retrieve-transformer.ts (contactInfoRefIds Extract)
 ↓
PassengerInfo.contactInfoRefIds
 ↓
PassengerEditModal → paxInfo.contactInfoRefIds
 ↓
changePax() service → paxInfo.contactInfoRefIds
 ↓
buildOrderChangeRequest → existingContactInfoRefIds
 ↓
ContactInfoRefID: existingContactInfoRefIds (to as-is Use!)
```

---

## ⚠️ ContactInfoID Existing ID Re-Use (v3.12.7)

> **NDC Spec section 4.2: ContactInfoID Newly Createnot notand Existing from ContactInfoRefID Select!**
> - Mobile ADD → 1th ID (index 0)
> - Email ADD → 2th ID (index 1)
> - Both → 1th ID (index 0)

### Problem Scenario

AY Carrier Contact when ADD ContactInfoID Newly using Create Error occurs:
```json
{
 "ContactInfoRefID": ["CTCPAX2_1", "CTCPAX2_2"], // Existing ID List
 "ContactInfoList": [{
 "ContactInfoID": "CTCPAX2_3", // ❌ Newly Create ID! Error occurs!
 "Phone": [...],
 "EmailAddress": [...]
 }]
}
```

### NDC Spec section 4.2 requirementnotes

```json
// NDC Spec AY Sample
{
 "ContactInfoRefID": ["CTC_PAX2_7", "CTC_PAX2_10"], // Existing ID List
 "ContactInfoList": [{
 "ContactInfoID": "CTC_PAX2_10", // ✅ Existing ID Use!
 "Phone": [...],
 "EmailAddress": [...]
 }]
}
```

### Resolution: Existing from ID Select Logic Implementation (v3.12.7)

```typescript
// pax-change-service.ts
// ❌ Wrong pattern (new ID Create)
const newContactInfoId = existingContactInfoRefIds.length > 0
 ? `CTC${paxId}_${existingContactInfoRefIds.length + 1}` // CTCPAX2_3 Create!
 : `CTC${paxId}_1`;

// ✅ v3.13.7: ContactInfoID selection logic (common)
const selectContactInfoId = (): string => {
 const contactDetails = paxInfo?.contactDetails || [];

 if (existingContactInfoRefIds.length === 0) {
 // Fallback: AF/KL CTC1 format, AY CTCPAX1_1 format, KE/HA/TK CI1 format
 if (['AF', 'KL'].includes(carrierCode)) {
 return `CTC${paxId.replace('PAX', '')}`;
 }
 if (carrierCode === 'AY') {
 return `CTC${paxId}_1`;
 }
 return `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;
 }

 const hasOnlyEmail = emails.length > 0 && phones.length === 0;
 const hasOnlyPhone = phones.length > 0 && emails.length === 0;

 // If contactDetails exists, select specific ID (v3.13.0+)
 if (contactDetails.length > 0) {
 if (hasOnlyEmail) {
 const emailContactInfo = contactDetails.find(cd => cd.emails && cd.emails.length > 0);
 if (emailContactInfo) return emailContactInfo.contactInfoId;
 }
 if (hasOnlyPhone) {
 const phoneContactInfo = contactDetails.find(cd => cd.phones && cd.phones.length > 0);
 if (phoneContactInfo) return phoneContactInfo.contactInfoId;
 }
 return existingContactInfoRefIds[0];
 }

 // Fallback: existing logic if contactDetails absent
 if (hasOnlyEmail && existingContactInfoRefIds.length >= 2) {
 return existingContactInfoRefIds[1];
 }
 return existingContactInfoRefIds[0];
};

const contactInfoIdToUse = selectContactInfoId();

request.contactInfoList = [{
 contactInfoId: contactInfoIdToUse, // ✅ Existing ID Re-Use!
 emailAddress: emails,
 phone: phones,
 postalAddress: [],
}];
```

### ID Select Rules (NDC Spec section 4.2)

| Add Type | Select ID | Example |
|----------|--------|------|
| Mobile only ADD | 1th ID (index 0) | `CTCPAX2_1` |
| Email only ADD | 2th ID (index 1) | `CTCPAX2_2` |
| Both ADD | 1th ID (index 0) | `CTCPAX2_1` |
| Existing ID None | fallback ID Create | `CTCPAX2_1` |

---

## ⚠️ v3.13.0: Contact Detail Information (contactDetails) Enhanced

> **Passenger당 multiple items's Contact/Email Support!**
> **to contactDetails per ContactInfoRefID Detail Information Provide!**
> **Contact when Change Corresponding Data exists ContactInfoID Auto Select!**

### Existing issue점 (v3.12.x)

1. in PassengerInfo `mobile: string`, `email: string` 하나each only Save
2. ContactInfoRefID List exists only Actual Detail Information Confirm Not possible
3. Contact when Change 떤 RefID must Use notperson확

### v3.13.0 Resolutionpolicy

#### 1. ContactDetail Type Add (types/booking.ts)

```typescript
export interface ContactDetail {
 contactInfoId: string; // e.g., "CTCPAX2_1"
 phones: PhoneDetail[]; // multiple items's PhoneNumber
 emails: EmailDetail[]; // multiple items's Email
 postalAddresses?: PostalAddressDetail[];
}

export interface PhoneDetail {
 phoneNumber: string;
 countryDialingCode?: string;
 formatted?: string; // e.g., "+82-10-1234-5678"
}

export interface EmailDetail {
 emailAddress: string;
}
```

#### 2. in PassengerInfo contactDetails Add

```typescript
export interface PassengerInfo {
 // ... Existing Field
 mobile?: string; // Backward compatibility maintain
 email?: string; // Backward compatibility maintain
 contactInfoRefIds?: string[];
 contactDetails?: ContactDetail[]; // ⚠️ v3.13.0 Add!
}
```

#### 3. order-retrieve-transformer.from ts contactDetails Extract

```typescript
// Transform passengers with contactDetails
const passengers = paxList.map((pax) => {
 const contactDetails: ContactDetail[] = [];

 for (const refId of contactRefIds) {
 const ci = contactInfoMap.get(refId);
 if (ci) {
 contactDetails.push({
 contactInfoId: refId,
 phones: ci.Phone?.map(p => ({
 phoneNumber: String(p.PhoneNumber),
 countryDialingCode: p.CountryDialingCode,
 })) || [],
 emails: ci.EmailAddress?.map(e => ({ emailAddress: e })) || [],
 });
 }
 }

 return {
 // ... Existing Field
 contactDetails: contactDetails.length > 0 ? contactDetails : undefined,
 };
});
```

#### 4. pax-change-service specific ContactInfoID Select

```typescript
const selectExistingContactInfoId = (): string => {
 const contactDetails = paxInfo?.contactDetails || [];

 if (contactDetails.length > 0) {
 // Email only Change → email exists ContactInfo Use
 if (hasOnlyEmail) {
 const emailContactInfo = contactDetails.find(cd => cd.emails?.length > 0);
 if (emailContactInfo) return emailContactInfo.contactInfoId;
 }

 // Phone only Change → phone exists ContactInfo Use
 if (hasOnlyPhone) {
 const phoneContactInfo = contactDetails.find(cd => cd.phones?.length > 0);
 if (phoneContactInfo) return phoneContactInfo.contactInfoId;
 }
 }

 // fallback
 return existingContactInfoRefIds[0];
};
```

### Data flow (v3.13.0)

```
OrderRetrieve API Response
 ↓
ContactInfoList → contactInfoMap (ContactInfoID → DetailInformation)
 ↓
PaxList.ContactInfoRefID → contactDetails[] Build
 ↓
PassengerInfo.contactDetails (in FE Pass)
 ↓
PassengerEditModal → paxInfo.contactDetails (changePax() service function Pass)
 ↓
selectExistingContactInfoId() → specific ContactInfoID Select
```

### v3.13.0 Contact DELETE Mode Enhanced

⚠️ **from ContactAddDeleteForm contactDetails Utilize Required!**

```typescript
// DELETE from Mode Delete Target List Create
const deleteTargets = useMemo<DeleteTarget[]>(() => {
 return contactDetails.flatMap(cd => [
 ...cd.phones.map((phone, idx) => ({
 type: 'phone',
 contactInfoId: cd.contactInfoId,
 displayValue: phone.formatted || phone.phoneNumber,
 })),
 ...cd.emails.map((email, idx) => ({
 type: 'email',
 contactInfoId: cd.contactInfoId,
 displayValue: email.emailAddress,
 })),
 ]);
}, [contactDetails]);

// to Checkbox Select Delete
{deleteTargets.map((target) => (
 <label key={target.value}>
 <input type="checkbox" checked={selectedDeleteTargets.has(target.value)} />
 <span>{target.displayValue}</span>
 </label>
))}
```

---

## ⚠️ v3.13.1: Contact DELETE Request Structure Modify

> **Contact when DELETE ContactInfoID and ContactInfoList Required!**
> **Empty to array if Transmission Delete Target specifiednot not아 Error occurs!**

### Existing issue점 (v3.13.0)

Contact DELETE when Request Empty arraysend using only Delete Target unSpecified:

```json
{
 "PaxList": [{
 "ContactInfoRefID": [] // ❌ Empty array - Delete Target None!
 }]
 // ContactInfoList None!
}
```

### v3.13.1 Resolutionpolicy

#### 1. from ContactAddDeleteForm Delete Target Pass

```typescript
// DELETE from Mode when 제출
await onSubmit({
 contactInfoId: deleteContactInfoId, // Delete Target ContactInfoID
 deletePhones: phonesToDelete, // Delete PhoneNumber List
 deleteEmails: emailsToDelete, // Delete Email List
});
```

#### 2. pax-change-service Delete Request Build

```typescript
// DELETE Branch
const deleteContactInfoId = contactData.contactInfoId || existingContactInfoRefIds[0];

request.paxList = [{
 paxId: paxId,
 ptc: ptc,
 individual: { ... },
 // ⚠️ v3.13.1: Delete Target ContactInfoID Include!
 contactInfoRefId: [deleteContactInfoId],
 identityDoc: [],
 loyaltyProgramAccount: [],
}];

// ⚠️ v3.13.1: Delete ContactInfo specified (empty Phone/to EmailAddress Delete Display)
request.contactInfoList = [{
 contactInfoId: deleteContactInfoId,
 emailAddress: [], // Empty array = Delete
 phone: [], // Empty array = Delete
 postalAddress: [],
}];
```

#### 3. from PassengerEditModal contactInfoId prop Pass

```tsx
<ContactAddDeleteForm
 currentEmail={selectedPax.email}
 currentPhone={selectedPax.mobile}
 // ⚠️ v3.13.1: for fallback contactInfoId
 contactInfoId={selectedPax.contactInfoRefIds?.[0]}
 contactDetails={selectedPax.contactDetails}
 action={selectedAction}
 onSubmit={submitChange}
 onCancel={handleBack}
 isSubmitting={isSubmitting}
/>
```

### DELETE Request Example (v3.13.1)

```json
{
 "transactionId": "abc123...",
 "orderId": "ORDER123",
 "changeOrderChoice": {
 "updatePax": [{ "currentPaxRefId": "PAX2" }]
 },
 "paxList": [{
 "paxId": "PAX2",
 "ptc": "ADT",
 "individual": {
 "individualId": "PAX2",
 "surname": "MOON",
 "givenName": ["SOO"],
 "middleName": [],
 "birthdate": "1977-09-11",
 "gender": "FEMALE",
 "nameTitle": "MS"
 },
 "contactInfoRefId": ["CTCPAX2_1"], // ✅ Delete Target ID!
 "identityDoc": [],
 "loyaltyProgramAccount": []
 }],
 "contactInfoList": [{
 "contactInfoId": "CTCPAX2_1", // ✅ Delete Target ID!
 "emailAddress": [], // Empty array = Delete
 "phone": [], // Empty array = Delete
 "postalAddress": []
 }],
 "paymentList": []
}
```

### Data flow (v3.13.1 DELETE)

```
ContactAddDeleteForm (Delete Target Select)
 ↓
onSubmit({ contactInfoId, deletePhones, deleteEmails })
 ↓
PassengerEditModal → changePax() service function
 ↓
pax-change-service.ts: contactData.contactInfoId Use
 ↓
ContactInfoRefID: [deleteContactInfoId] // Delete Target Include!
ContactInfoList: [{ contactInfoId, emailAddress: [], phone: [] }]
```

---

## ⚠️ v3.13.2: Contact DELETE Request Structure Modify (NDC Spec section 4.3 comply)

> **CRITICAL: ContactInfoListin "after Delete to keep" Item Include!**
> **Delete Item 아니라 to keep Item specifiedmust be done!**

### Existing issue점 (v3.13.1)

Empty arraysend using only Middleware Field Remove:

```json
{
 "ContactInfoList": [{
 "ContactInfoID": "CTCPAX2_2",
 "ContactRefusedInd": false // emailAddress, phone Field Missing!
 }]
}
```

### NDC Spec section 4.3 requirementnotes

ContactInfoListin **after Delete to keep Item** Include:

```json
// e.g.: TEST@TIDEQUEARE.COM only Deleteand 나머 maintain
{
 "ContactInfoList": [{
 "ContactInfoID": "CTCPAX2_1",
 "EmailAddress": ["USER@EXAMPLE.COM", "DEV@EXAMPLE.COM"], // to keep Email
 "Phone": [
 { "CountryDialingCode": "82", "PhoneNumber": "1012341234" },
 { "CountryDialingCode": "82", "PhoneNumber": "1046900081" }
 ], // to keep PhoneNumber
 "PostalAddress": []
 }]
}
```

### v3.13.2 Resolutionpolicy

#### 1. from ContactAddDeleteForm to keep Item Calculate

```typescript
if (action === 'DELETE') {
 // All from Contact Delete Target Exclude "to keep" Contact Calculate
 const allPhones = allDeleteTargets.filter(t => t.type === 'phone');
 const allEmails = allDeleteTargets.filter(t => t.type === 'email');

 // to keep Contact (Delete Target Exclude)
 const phonesToKeep = allPhones
 .filter(t => !selectedDeleteTargets.has(t.value))
 .map(t => t.displayValue);
 const emailsToKeep = allEmails
 .filter(t => !selectedDeleteTargets.has(t.value))
 .map(t => t.displayValue);

 await onSubmit({
 contactInfoId: deleteContactInfoId,
 deletePhones: phonesToDelete, // for logging
 deleteEmails: emailsToDelete, // for logging
 keepPhones: phonesToKeep, // ⚠️ API in Request Use!
 keepEmails: emailsToKeep, // ⚠️ API in Request Use!
 });
}
```

#### 2. pax-change-service to keep Itemto ContactInfoList Build

```typescript
// to keep Contact (from ContactAddDeleteForm Calculate Pass)
const keepPhones = contactData.keepPhones || [];
const keepEmails = contactData.keepEmails || [];

// PhoneNumber Parsing
const keepPhoneItems: PhoneItem[] = keepPhones.map(phoneStr => {
 const cleaned = phoneStr.replace(/[^\d+]/g, '');
 const match = cleaned.match(/^\+?(\d{1,3})?(\d+)$/);
 if (match) {
 return {
 countryDialingCode: match[1] || undefined,
 phoneNumber: match[2],
 };
 }
 return { phoneNumber: cleaned };
});

request.contactInfoList = [{
 contactInfoId: deleteContactInfoId,
 emailAddress: keepEmails, // to keep Email
 phone: keepPhoneItems, // to keep PhoneNumber
 postalAddress: [],
}];
```

### DELETE Request Example (v3.13.2)

User `TEST@TIDEQUEARE.COM` using Select Delete time:

```json
{
 "transactionId": "...",
 "orderId": "...",
 "changeOrderChoice": {
 "updatePax": [{ "currentPaxRefId": "PAX2" }]
 },
 "paxList": [{
 "paxId": "PAX2",
 "ptc": "ADT",
 "individual": { ... },
 "contactInfoRefId": ["CTCPAX2_1"],
 "identityDoc": [],
 "loyaltyProgramAccount": []
 }],
 "contactInfoList": [{
 "contactInfoId": "CTCPAX2_1",
 "emailAddress": ["USER@EXAMPLE.COM", "DEV@EXAMPLE.COM"], // ✅ to keep Thing!
 "phone": [
 { "countryDialingCode": "82", "phoneNumber": "1012341234" },
 { "countryDialingCode": "82", "phoneNumber": "1046900081" }
 ], // ✅ to keep Thing!
 "postalAddress": []
 }],
 "paymentList": []
}
```

### Data flow (v3.13.2 DELETE)

```
ContactAddDeleteForm
 ↓
User Delete Contact Select
 ↓
phonesToKeep = All/Total - DeleteTarget (to keep PhoneNumber)
emailsToKeep = All/Total - DeleteTarget (to keep Email)
 ↓
onSubmit({ keepPhones, keepEmails, ... })
 ↓
pax-change-service: contactData.keepPhones/keepEmails Use
 ↓
ContactInfoList: { emailAddress: keepEmails, phone: keepPhoneItems }
```

---

## ⚠️ v3.13.3: Contact DELETE - per ContactInfoID Data filtering

> **CRITICAL: Corresponding in ContactInfoID 속 Data only Process!**
> **All ContactDetails not Delete Target ContactInfoID's phones/emails only filtering!**

### Existing issue점 (v3.13.2)

All from ContactDetails using filtering Wrong Data Include:

```typescript
// ❌ All from contacts filtering - Different ContactInfoID's Data also Include!
const allPhones = allDeleteTargets.filter(t => t.type === 'phone');
const phonesToKeep = allPhones.filter(t => !selectedDeleteTargets.has(t.value));
```

### v3.13.3 Resolutionpolicy

Corresponding in ContactInfoID 속 Data only filtering:

```typescript
// ✅ Corresponding ContactInfoID's Data only filtering
const sameIdTargets = allDeleteTargets.filter(t => t.contactInfoId === deleteContactInfoId);
const sameIdPhones = sameIdTargets.filter(t => t.type === 'phone');
const sameIdEmails = sameIdTargets.filter(t => t.type === 'email');

// Corresponding from ID to keep Contact
const phonesToKeep = sameIdPhones
 .filter(t => !selectedDeleteTargets.has(t.value))
 .map(t => t.displayValue);
const emailsToKeep = sameIdEmails
 .filter(t => !selectedDeleteTargets.has(t.value))
 .map(t => t.displayValue);
```

### PaxList ContactInfoRefID - All ID Include

```typescript
// ✅ v3.13.3: All ContactInfoRefID Include (Change Target only Not!)
request.paxList = [{
 paxId: paxId,
 contactInfoRefId: existingContactInfoRefIds, // All ID!
 ...
}];
```

### PhoneNumber parsing priority (v3.13.3)

```typescript
// ✅ "+82-1012341234" → { countryDialingCode: "82", phoneNumber: "1012341234" }
let cleaned = phoneStr.replace(/[-\s]/g, '');
if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

// CountryCode Extract (2Seat Fixed)
if (cleaned.startsWith('82') && cleaned.length >= 11) {
 countryCode = '82';
 phoneNumber = cleaned.substring(2);
}
```

### UI Button CSS Modify (v3.13.3)

```tsx
// ✅ min-w-0 to Add flex shrink for allow
<button className="flex-1 min-w-0 py-2 px-4 ...">
 Delete ({count}) // Text only축
</button>
```

---

## ⚠️ v3.13.4: ALL Mode (KE, HA, TK) Contact ADD/DELETE Support

> **issue**: `ALL` Mode Carrier's CONTACT ADD/DELETE Wrong code to Path 진입

### Existing issue점 (v3.13.3)

`ALL` Mode (KE, HA, TK)from `action === 'DELETE'` or `action === 'ADD'` time:
- `mode === 'ALL' && action === 'MODIFY'` Condition → **not충족**
- `mode === 'ADD_DELETE_ONLY'` Condition → **not충족**
- **MODIFY_ONLY (AF, KL) to Branch 잘못 진입!**

### v3.13.4 Resolutionpolicy

`ALL` Mode DELETE/ADD For Separate Branch Add:

```typescript
// ✅ v3.13.4
if (mode === 'ALL' && action === 'MODIFY') {
 // KE, HA, TK MODIFY
} else if (mode === 'ALL' && action === 'DELETE') {
 // ⚠️ NEW! KE, HA, TK DELETE - follows NDC Spec section 4.3
 // PhoneNumber Parsing and to keep Item Process
} else if (mode === 'ALL' && action === 'ADD') {
 // ⚠️ NEW! KE, HA, TK ADD
} else if (mode === 'ADD_DELETE_ONLY') {
 // AY ADD/DELETE
} else {
 // MODIFY_ONLY (AF, KL)
}
```

### Branch table (v3.13.4 after)

| Mode | Action | Branch |
|------|--------|------|
| `ALL` | MODIFY | `mode === 'ALL' && action === 'MODIFY'` |
| `ALL` | DELETE | `mode === 'ALL' && action === 'DELETE'` ← NEW! |
| `ALL` | ADD | `mode === 'ALL' && action === 'ADD'` ← NEW! |
| `ADD_DELETE_ONLY` | ADD/DELETE | `mode === 'ADD_DELETE_ONLY'` |
| `MODIFY_ONLY` | MODIFY | `else` (fallback) |

---

## ⚠️ v3.13.5: Button Container overflow issue Resolution

> **issue**: within Modal Delete Button 잘려 not 보이 (mobile/좁 from Screen Especially 심each)

### Cause Analysis

1. **Modal Container**: `overflow-y-auto`only Configuration → `overflow-x` DefaultValue `visible`
2. **Button Container**: `flex gap-3`only existsand **overflow-hidden None**
3. **긴 Button Text**: "Contact Delete" 좁 from Screen space Exceed
4. **min-w-0 Missing**: flex Item shrinknot not
5. **Result**: 오른side Button Modal area outsideto 밀려나 잘림

### v3.13.5 Resolutionpolicy

```tsx
{/* ⚠️ v3.13.5: overflow-hidden Add, 양side Button min-w-0 Applied */}
<div className="flex gap-3 pt-2 w-full overflow-hidden">
 <button className="flex-1 min-w-0 py-2 px-4 ...">
 Cancellation
 </button>
 <button className="flex-1 min-w-0 py-2 px-4 ...">
 {action === 'DELETE' ? 'Delete' : 'Add'} {/* Text only축 */}
 </button>
</div>
```

### Core CSS Modifynotes

| Element | before Change | after Change | Reason |
|------|--------|---------|------|
| Button Container | `flex gap-3 pt-2` | `flex gap-3 pt-2 w-full overflow-hidden` | 식 Element not 넘치도록 |
| Cancellation Button | `flex-1 py-2 px-4` | `flex-1 min-w-0 py-2 px-4` | flex shrink for allow |
| Delete Button | `flex-1 py-2 px-4` | `flex-1 min-w-0 py-2 px-4` | flex shrink for allow |
| Button Text | "Contact Delete/Add" | "Delete/Add" | space 절약 |

### Note: flex and min-width relation

- `flex-1` `flex: 1 1 0%` only축-type (grow=1, shrink=1, basis=0)
- not only flex Item's Default `min-width: auto`로 than 콘텐츠 not 작아
- `min-w-0` (min-width: 0) must Add to Actual shrink Available
- in Parent `overflow-hidden` if absent shrink Content also outsideto 넘침

---

## ⚠️ v3.13.5 Add: Custom 테마 Color vs standard Tailwind Color

### issue: bg-error Color not 보이

Custom 테마 Color `bg-error` Tailwind in config Definitionnot notif Button transparent Rendering.

### Cause

```tsx
// ❌ Custom Color - Tailwind in config Definition Required
className="bg-error hover:bg-error/90"

// per Tenant tailwind.config.in ts error Color if absent Applied
```

### Resolutionpolicy

**Important UI Element(Button, etc.)in standard Tailwind Color Use Recommended:**

```tsx
// ✅ standard Tailwind Color - Always 작동
className="bg-red-500 hover:bg-red-600" // Delete/Error
className="bg-primary hover:bg-primary/90" // Default (테마 Color)
```

### Color Use Guide

| Purpose | Recommended Color | 비Recommended |
|------|----------|--------|
| Delete/Error Button | `bg-red-500` | `bg-error` |
| Warning Button | `bg-yellow-500` | `bg-warning` |
| Success Button | `bg-green-500` | `bg-success` |
| Default Button | `bg-primary` | - |
| 보조 Button | `bg-gray-500` | `bg-secondary` |

> **Note**: `bg-primary`, `bg-secondary` etc. Default 테마 Color All from Tenant Definition to exists므 Use Available.
> only, `bg-error`, `bg-warning`, `bg-success` to per Tenant Definition Whether 다 Exists.
