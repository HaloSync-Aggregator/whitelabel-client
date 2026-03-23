# InformationChange

## Overview
Booking Passenger's Information(Name, Contact, etc.) Change Feature.
Before ticketing/after All Availablenot only CarrierDepending on Support Range differs.

---

## 1. 진입 Path

Booking detail > Passenger information Section > **Information Modify** Button

---

## 2. Supported carriers

| Carrier | PaxInfo | ContactInfo | Change method |
|--------|:-------:|:-----------:|----------|
| AF (Air France) | O | O | Update |
| KL (KLM) | O | O | Update |
| AY (핀에) | X | O | Add/Delete |
| KE (Korean Air) | O | O | Update |
| HA (Hawaiian Airlines) | O | O | Update |

---

## 3. Change Available Information Type

### PaxInfo (Passenger -likenotes)

| Item | Description | Supported carriers |
|------|------|------------|
| Title | MR, MS, MSTR, MISS | AF, KL, KE, HA |
| Surname | English property | AF, KL, KE, HA |
| GivenName | English Name | AF, KL, KE, HA |

### ContactInfo (Contact)

| Item | Description | Supported carriers |
|------|------|------------|
| Mobile | 휴폰 Number | AF, KL, AY, KE, HA |
| Email | Email address | AF, KL, AY, KE, HA |

---

## 4. Screen Composition

### Passenger information Change Popup (AF, KL)

AF, KL Carrier Information **Update**하 Methodto Change.

#### Composition area

| area | Content |
|------|------|
| ChangeItem Select | PaxInfo / during ContactInfo Select |
| Information Modify | Select in Item About Input Field |
| Button | PassengerInformationChange / Close |

#### PaxInfo when Select

| Field | Input Format | Notes |
|------|----------|------|
| Title | dropdown | MR/MS/MSTR/MISS |
| Surname | Text | English Uppercase |
| GivenName | Text | English Uppercase |

#### ContactInfo when Select

| Field | Input Format | Notes |
|------|----------|------|
| Mobile | Text | CountryNumber + Number |
| Email | Text | Email Format |

#### Button activationpropertyconversion Condition

- Minimum text Or more Modify Case activationpropertyconversion
- PaxInfo and ContactInfo Concurrent Modify Not possible

---

### Passenger information Change Popup (AY)

AY Carrier Information **Add/Delete**하 Methodto Change.

#### Information Add

| Step | Description |
|------|------|
| 1. ⊕ Add Button click | Corresponding Passenger's Information Add Mode 진입 |
| 2. Input Field Display | New Contact Input Field Create |
| 3. Information Input | mobile/Email Input (파란color 하even if이트) |
| 4. Applied | "Passenger information Add Applied" Button click |

#### Information Delete

| Step | Description |
|------|------|
| 1. Checkbox Select | Delete Contact Select (빨간color 하even if이트) |
| 2. Applied | "Passenger information Delete Applied" Button click |

#### AY Limitnotes

| Limit | Description |
|------|------|
| Minimum Contact | Passenger당 Minimum 1items Contact Required |
| Concurrent Change | in 번 1person's Passenger only Change Available |
| Maximum Add | in 1 time(s) Maximum 4items Contact Add Available |

---

## 5. API Flow

### AF, KL, KE, HA

```
OrderRetrieve → OrderChange → OrderRetrieve
```

### AY (Add)

```
OrderRetrieve → OrderChange (Add) → OrderRetrieve
```

### AY (Delete)

```
OrderRetrieve → OrderChange (Delete) → OrderRetrieve
```

---

## 6. OrderChange RQ ting

### PaxInfo Change (AF, KL)

| Element | Path | Description |
|---------|------|------|
| PaxList | Change Information only ting | |
| Individual/Surname | Change property | |
| Individual/GivenName | Change Name | |
| Individual/NameTitle | Change Title | |

### ContactInfo Change (AF, KL)

| Element | Path | Description |
|---------|------|------|
| ContactInfoList | Change Information only ting | |
| Phone/PhoneNumber | Change PhoneNumber | |
| EmailAddress | Change Email | |

### KE, HA Differences

- Change Information뿐 아니라 All/Total Passenger information tingmust be done

---

## 7. UI Process Guide

### Button Exposed Condition

| Condition | Description |
|------|------|
| Carrier | AF, KL, AY, KE, HA only Exposed |
| Booking Status | valid Booking only |

### Input Field 하even if이트

| Status | Color | 의un |
|------|------|------|
| Change | 파란color | Modify Information |
| Delete Select | 빨간color | Delete Information (AY) |

### Infant Process

- Infant(INF) Contact Information None
- Accompanying Adult's Contact 따라감
- ContactInfo when Change Infant in List Exposeddoes not

---

## 8. Change after Complete

1. OrderChange when Success 토스트 Message Display
2. OrderRetrieve Auto to Call Booking detail 갱신
3. when Failure 오른side in Top Error message Display

---

## 9. Error handling

| Error scenarios | Process |
|----------|------|
| InputValue unChange | Button 비activationpropertyconversion |
| All/Total Contact when Delete also | "Minimum 1items Contact Required" Guide |
| API Failure | Error message Display |
| validnot not Email | Format Error Guide |

---

## 10. Precautions

1. **PaxInfo + ContactInfo Concurrent Change Not possible**: to Separate Progressmust be done
2. **Name Change Limit**: After ticketing Name Change Carrier specificpolicyDepending on Limitwill be Exists
3. **AY special Logic**: Change not Add/Delete Methodto Process

---

## Related documents

- [Booking detail](../04-booking-detail/booking-detail.md)
- [Passenger split](./passenger-split.md)
