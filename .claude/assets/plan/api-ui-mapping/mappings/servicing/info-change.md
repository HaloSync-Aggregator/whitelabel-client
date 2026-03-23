# InfoChange (OrderChange) API-UI Mapping

> API: `POST /middleware/polarhub/order-change`
> Response: `OrderViewRS`

---

## API Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Information change (PaxInfo / ContactInfo) │
│ OrderRetrieve → OrderChange (UpdatePax) → OrderRetrieve │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ AY special Case (Add/Delete) │
│ OrderRetrieve → OrderChange (Add/Delete) → OrderRetrieve │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Supported carriers and Change method

| Carrier | PaxInfo | ContactInfo | Change method |
|--------|:-------:|:-----------:|----------|
| AF (Air France) | O | O | Update |
| KL (KLM) | O | O | Update |
| AY (핀에) | X | O | Add/Delete |
| KE (Korean Air) | O | O | Update |
| HA (Hawaiian Airlines) | O | O | Update |

---

## 2. Current Information Retrieval (OrderViewRS)

### Passenger information Extract

| UI Field | API Response Path | Notes |
|---------|------------------|------|
| paxId | `DataLists.PaxList[].PaxID` | - |
| title | `DataLists.PaxList[].Individual.NameTitle` | MR, MS, etc. |
| property | `DataLists.PaxList[].Individual.Surname` | English property |
| givenName | `DataLists.PaxList[].Individual.GivenName[0]` | English Name |
| ptc | `DataLists.PaxList[].Ptc` | ADT, CHD, INF |

### Contact Information Extract

| UI Field | API Response Path | Notes |
|---------|------------------|------|
| contactInfoId | `DataLists.ContactInfoList[].ContactInfoID` | - |
| mobile | `DataLists.ContactInfoList[].Phone.PhoneNumber` | - |
| countryCode | `DataLists.ContactInfoList[].Phone.CountryDialingCode` | - |
| email | `DataLists.ContactInfoList[].EmailAddress.EmailAddressValue` | - |

---

## 3. PaxInfo Change (AF, KL, KE, HA)

### Request ting

```typescript
interface OrderChangeUpdatePaxRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 updatePax: {
 paxId: string;
 individual: {
 nameTitle?: string; // MR, MS, MSTR, MISS
 surname?: string; // Change surname
 givenName?: string; // Change Name
 };
 };
}
```

### UI → API Mapping

| UI Field | Request Path | Validation |
|---------|-------------|------------|
| title | `updatePax.individual.nameTitle` | enum: MR/MS/MSTR/MISS |
| property | `updatePax.individual.surname` | English Uppercase only |
| givenName | `updatePax.individual.givenName` | English Uppercase only |

### KE, HA special Process

```typescript
// KE, HA Change Target Passenger out All/Total Passenger information also ting Required
interface OrderChangeUpdatePaxKEHARequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 paxList: PaxInfo[]; // All/Total Passenger (Change Information Include)
}
```

---

## 4. ContactInfo Change (AF, KL, KE, HA)

### Request ting

```typescript
interface OrderChangeUpdateContactRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 updateContact: {
 paxId: string;
 contactInfo: {
 phone?: {
 countryDialingCode: string;
 phoneNumber: string;
 };
 emailAddress?: string;
 };
 };
}
```

### UI → API Mapping

| UI Field | Request Path | Validation |
|---------|-------------|------------|
| mobile | `updateContact.contactInfo.phone.phoneNumber` | Number/+/- |
| email | `updateContact.contactInfo.emailAddress` | Email Format |

---

## 5. ContactInfo Change - AY (Add/Delete)

### Contact Add Request

```typescript
interface OrderChangeAddContactRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 addContact: {
 paxId: string;
 contactInfoList: Array<{
 type: "PHONE" | "EMAIL";
 value: string;
 }>;
 };
}
```

### Contact Delete Request

```typescript
interface OrderChangeDeleteContactRequest {
 transactionId: string;
 order: {
 orderId: string;
 owner: string;
 };
 deleteContact: {
 paxId: string;
 contactInfoIds: string[]; // Delete ContactInfoID Array
 };
}
```

### AY Limitnotes Process

```typescript
function validateAYContactChange(
 currentContacts: ContactInfo[],
 deleteIds: string[],
 addContacts: NewContact[]
): { valid: boolean; error?: string } {
 // after Delete remaining Contact
 const remainingCount = currentContacts.length - deleteIds.length + addContacts.length;

 if (remainingCount < 1) {
 return { valid: false, error: 'Minimum 1items's Contact Required' };
 }

 if (addContacts.length > 4) {
 return { valid: false, error: '한 in 번 Maximum 4items Add Available' };
 }

 return { valid: true };
}
```

---

## 6. Response Process (OrderViewRS)

### when Success

```typescript
interface InfoChangeResult {
 success: true;
 orderId: string;
 pnr: string;
 message: string;
 updatedPax?: {
 paxId: string;
 title?: string;
 property?: string;
 givenName?: string;
 mobile?: string;
 email?: string;
 };
}
```

### Response Mapping

| UI Field | API Response Path | Notes |
|---------|------------------|------|
| success | `ResultMessage.Code === "OK"` | - |
| message | `ResultMessage.Message` | - |
| updatedPax | `DataLists.PaxList[]` (Corresponding PaxID) | Change Information |

---

## 7. Validation Logic

```typescript
// English Uppercase only for allow (Name)
function validateName(value: string): string | null {
 if (!value.trim()) {
 return 'Required Input Item';
 }
 if (!/^[A-Z\s]+$/.test(value)) {
 return 'English Uppercase only allowed';
 }
 return null;
}

// Email Format 검사
function validateEmail(value: string): string | null {
 if (!value.trim()) {
 return 'Required Input Item';
 }
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
 return 'Correct Email Format is not';
 }
 return null;
}

// PhoneNumber Format 검사
function validatePhone(value: string): string | null {
 if (!value.trim()) {
 return 'Required Input Item';
 }
 if (!/^[\d\+\-\s]+$/.test(value)) {
 return 'Correct PhoneNumber Format is not';
 }
 return null;
}
```

---

## 8. Button activationpropertyconversion Condition

```typescript
function isSubmitEnabled(
 originalData: PaxInfoForm | ContactInfoForm,
 currentData: PaxInfoForm | ContactInfoForm,
 validationErrors: Record<string, string>
): boolean {
 // validproperty Error absentmust Does
 if (Object.keys(validationErrors).length > 0) {
 return false;
 }

 // Minimum Field Changemust Does
 const hasChanges = Object.keys(currentData).some(
 key => currentData[key] !== originalData[key]
 );

 return hasChanges;
}
```

---

## 9. Infant Process

```typescript
function filterPaxListForContactChange(paxList: PaxInfo[]): PaxInfo[] {
 // Infant(INF) Contact to absent므 ContactInfo Change from Target Exclude
 return paxList.filter(pax => pax.ptc !== 'INF');
}
```

---

## 10. Error handling

| Error scenarios | Error Code | User Message |
|----------|----------|--------------|
| Change 권 None | UNAUTHORIZED | Information change 권 . |
| Name Change Limit | NAME_CHANGE_RESTRICTED | After ticketing Name Change Limit |
| Carrier specificpolicy above반 | POLICY_VIOLATION | Carrier specificpolicyDepending on Change . |
| unSupported carriers | NOT_SUPPORTED | Corresponding Carrier Information change Supportdoes not |
| validproperty Error | VALIDATION_ERROR | {Field name} Format 올Bar르 . |

---

## 11. Precautions

1. **PaxInfo + ContactInfo Concurrent Change Not possible**: Separate API Call Required
2. **After ticketing Name Change**: Carrier specificpolicyDepending on Limitwill be Exists
3. **AY special Logic**: Update not Add/Delete Method
4. **Infant Contact**: Infant Contact Information None (Accompanying Adult Contact Use)
5. **KE/HA All/Total Information**: when Change All/Total Passenger information Include Required
