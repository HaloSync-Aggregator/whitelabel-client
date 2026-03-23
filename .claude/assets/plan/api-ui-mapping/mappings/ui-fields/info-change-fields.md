# InfoChange UI Field definitions

> Source: `.claude/assets/ui-component-guide/06-change/info-change.md`

---

## 1. Supported carriers

| Carrier | PaxInfo (Name) | ContactInfo (Contact) | Change method |
|--------|:-------------:|:------------------:|----------|
| AF (Air France) | O | O | Update |
| KL (KLM) | O | O | Update |
| AY (핀에) | X | O | Add/Delete |
| KE (Korean Air) | O | O | Update |
| HA (Hawaiian Airlines) | O | O | Update |

---

## 2. Information change Popup - Common (InfoChangePopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| passengerInfo | PassengerDisplay | O | Header | - | Change Target Passenger |
| changeType | string | O | radio Button | paxInfo, contactInfo | Change Type |
| carrierCode | string | O | 2Seat code | AF | Carrier |
| changeMode | string | O | Code | update, add, delete | Change method |

### PassengerDisplay (Passenger Display)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxId | string | O | PAX ID | PAX1 | - |
| fullName | string | O | English property/given name | HONG/GILDONG | - |
| ptc | string | O | Passenger type | ADT | - |
| ptcLabel | string | O | Korean | Adult | - |

---

## 3. PaxInfo Change - AF, KL, KE, HA (UpdatePaxInfo)

### Change Available Item

| Field name | Type | Required | Input Format | Example | Notes |
|--------|------|:----:|----------|------|------|
| title | string | O | dropdown | MR, MS, MSTR, MISS | 경칭 |
| property | string | O | Text | HONG | English Uppercase |
| givenName | string | O | Text | GILDONG | English Uppercase |

### Title Option

| Code | Displayperson | Target |
|------|--------|------|
| MR | MR (Male) | Adult Male |
| MS | MS (Female) | Adult Female |
| MSTR | MSTR (Boy) | remaining 린 |
| MISS | MISS (Girl) | 여 린 |

### Input Field Status (FieldState)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| originalValue | string | O | Text | HONG | KRW래 Value |
| currentValue | string | O | Text | KIM | Current InputValue |
| isModified | boolean | O | true/false | true | Modify Whether |
| highlightColor | string | X | ColorCode | blue | when Modify 파란color |
| validationError | string | X | Text | English only Input | validproperty Error |

---

## 4. ContactInfo Change - AF, KL, KE, HA (UpdateContactInfo)

### Change Available Item

| Field name | Type | Required | Input Format | Example | Notes |
|--------|------|:----:|----------|------|------|
| mobile | string | O | Text | +82-10-1234-5678 | CountryNumber + Number |
| email | string | O | Text | hong@email.com | Email Format |

### Input Field Status (FieldState)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| originalValue | string | O | Text | hong@email.com | KRW래 Value |
| currentValue | string | O | Text | kim@email.com | Current InputValue |
| isModified | boolean | O | true/false | true | Modify Whether |
| highlightColor | string | X | ColorCode | blue | when Modify 파란color |
| validationError | string | X | Text | Email Format Error | validproperty Error |

---

## 5. ContactInfo Change - AY (AddDeleteContactInfo)

### Information Add (AddContact)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| contactType | string | O | dropdown | mobile, email | Contact Type |
| contactValue | string | O | Text | +82-10-1234-5678 | Contact Value |
| highlightColor | string | O | ColorCode | blue | when Add 파란color |

### Information Delete (DeleteContact)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| contactId | string | O | ID | CNT001 | Contact ID |
| contactType | string | O | Code | mobile, email | Contact Type |
| contactValue | string | O | Text | +82-10-1234-5678 | Contact Value |
| isSelected | boolean | O | true/false | false | Delete Select Whether |
| highlightColor | string | X | ColorCode | red | Delete when Select 빨간color |

### AY Limitnotes

| Limit | Description |
|------|------|
| Minimum Contact | Passenger당 Minimum 1items Contact Required |
| Concurrent Change | in 번 1person's Passenger only Change Available |
| Maximum Add | in 1 time(s) Maximum 4items Contact Add Available |

---

## 6. Existing Contact List (ContactList) - AY

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| contacts | ContactItem[] | O | Checkbox List | - | Contact List |
| minContacts | number | O | Number | 1 | Minimum Required Count |
| canDeleteAll | boolean | O | true/false | false | All/Total Delete Available Whether |

### ContactItem

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| contactId | string | O | ID | CNT001 | - |
| type | string | O | Code | mobile, email | - |
| typeLabel | string | O | Korean | 휴폰, Email | - |
| value | string | O | Text | +82-10-1234-5678 | - |
| isSelected | boolean | O | true/false | false | Delete Select |
| isDeletable | boolean | O | true/false | true | Delete Available Whether |

---

## 7. Button Status (ButtonState)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| showInfoChangeButton | boolean | O | true/false | true | InformationChange Button Exposed |
| isSubmitEnabled | boolean | O | true/false | false | Change Applied Button activationpropertyconversion |
| submitButtonLabel | string | O | Text | PassengerInformationChange | Button Label |
| showAddButton | boolean | X | true/false | true | Add Button (AY) |
| addButtonLabel | string | X | Text | Passenger information Add Applied | AY Dedicated |
| showDeleteButton | boolean | X | true/false | true | Delete Button (AY) |
| deleteButtonLabel | string | X | Text | Passenger information Delete Applied | AY Dedicated |

---

## 8. Validation (Validation)

### Common Rules

| Field | Rules | Error Message |
|------|------|-----------|
| property | English Uppercase only | English Uppercase only allowed |
| givenName | English Uppercase only | English Uppercase only allowed |
| email | Email Format | Correct Email Format is not |
| mobile | Number/+/- only | Correct PhoneNumber Format is not |

### Button activationpropertyconversion Condition

| Condition | Description |
|------|------|
| Minimum Change | Minimum text Or more Modify |
| validproperty through and | All Field Validation through and |
| PaxInfo/ContactInfo Split | Concurrent Modify Not possible |

---

## 9. Error handling (ErrorHandling)

| Error scenarios | Process |
|----------|------|
| InputValue unChange | Button 비activationpropertyconversion |
| All/Total Contact when Delete also | "Minimum 1items Contact Required" Guide |
| API Failure | 오른side Top Error message |
| validnot not Email | Format Error Guide |

---

## 10. Infant Process (InfantHandling)

| Rules | Description |
|------|------|
| Contact None | Infant(INF) Contact Information None |
| Accompanying Adult | Accompanying Adult's Contact 따라감 |
| ContactInfo when Change | Infant in List unExposed |

---

## TypeScript Interface

```typescript
interface InfoChangeData {
 // Common
 passengerInfo: PassengerDisplay;
 changeType: 'paxInfo' | 'contactInfo';
 carrierCode: string;
 changeMode: 'update' | 'add' | 'delete';

 // PaxInfo Change (AF, KL, KE, HA)
 paxInfo?: PaxInfoForm;

 // ContactInfo Change (AF, KL, KE, HA)
 contactInfo?: ContactInfoForm;

 // ContactInfo Change (AY)
 contactList?: ContactList;
 newContacts?: NewContact[];
 selectedForDelete?: string[];

 // Button Status
 buttonState: ButtonState;

 // Validation
 validationErrors: Record<string, string>;
 isFormValid: boolean;
}

interface PassengerDisplay {
 paxId: string;
 fullName: string;
 ptc: string;
 ptcLabel: string;
}

interface PaxInfoForm {
 title: FieldState;
 property: FieldState;
 givenName: FieldState;
}

interface ContactInfoForm {
 mobile: FieldState;
 email: FieldState;
}

interface FieldState {
 originalValue: string;
 currentValue: string;
 isModified: boolean;
 highlightColor?: 'blue' | 'red';
 validationError?: string;
}

interface ContactList {
 contacts: ContactItem[];
 minContacts: number;
 canDeleteAll: boolean;
}

interface ContactItem {
 contactId: string;
 type: 'mobile' | 'email';
 typeLabel: string;
 value: string;
 isSelected: boolean;
 isDeletable: boolean;
}

interface NewContact {
 contactType: 'mobile' | 'email';
 contactValue: string;
 highlightColor: 'blue';
}

interface ButtonState {
 showInfoChangeButton: boolean;
 isSubmitEnabled: boolean;
 submitButtonLabel: string;
 showAddButton?: boolean;
 addButtonLabel?: string;
 showDeleteButton?: boolean;
 deleteButtonLabel?: string;
}

// Title Option
const titleOptions = [
 { code: 'MR', label: 'MR (Male)', target: 'adult_male' },
 { code: 'MS', label: 'MS (Female)', target: 'adult_female' },
 { code: 'MSTR', label: 'MSTR (Boy)', target: 'child_male' },
 { code: 'MISS', label: 'MISS (Girl)', target: 'child_female' }
];
```

---

## Validation Logic

```typescript
// English Uppercase only for allow
function validateName(value: string): string | null {
 const pattern = /^[A-Z\s]+$/;
 if (!pattern.test(value)) {
 return 'English Uppercase only allowed';
 }
 return null;
}

// Email Format 검사
function validateEmail(value: string): string | null {
 const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!pattern.test(value)) {
 return 'Correct Email Format is not';
 }
 return null;
}

// PhoneNumber Format 검사
function validatePhone(value: string): string | null {
 const pattern = /^[\d\+\-\s]+$/;
 if (!pattern.test(value)) {
 return 'Correct PhoneNumber Format is not';
 }
 return null;
}

// Button activationpropertyconversion Whether Judgment
function isSubmitEnabled(data: InfoChangeData): boolean {
 // Minimum Field Modify되었는
 const hasModification = checkModification(data);

 // Validation through and Whether
 const isValid = Object.keys(data.validationErrors).length === 0;

 return hasModification && isValid;
}

// AY: All/Total Delete Prevention
function canDeleteContact(contactList: ContactList, contactId: string): boolean {
 const selectedCount = contactList.contacts.filter(c => c.isSelected).length;
 const totalCount = contactList.contacts.length;

 // 마막 1items Delete Not possible
 if (totalCount - selectedCount <= contactList.minContacts) {
 return false;
 }
 return true;
}
```

---

## Precautions

1. **PaxInfo + ContactInfo Concurrent Change Not possible**: to Separate Progressmust be done
2. **Name Change Limit**: After ticketing Name Change Carrier specificpolicyDepending on Limitwill be Exists
3. **AY special Logic**: Change not Add/Delete Methodto Process
4. **Infant Contact**: Infant Contact Information to absent므 ContactInfo Change from Target Exclude
