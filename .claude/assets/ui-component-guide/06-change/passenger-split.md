# Passenger split

## Overview
Partial Passenger using Split Separate's to PNR Management exists Feature.
Passenger after Split Journey/ItineraryChange, Cancellation, etc. Individual-liketo Progress .

---

## 1. 진입 Path

Booking detail > Passenger information Section > **Passenger Split** Button

---

## 2. Supported carriers

| Carrier | Before ticketing | After ticketing | Concurrent Split Available Number of passengers | Notes |
|--------|:------:|:------:|:------------------:|------|
| QR (Qatar Airways) | O | O | 2person Or more | - |
| SQ (Singapore Airlines) | O | O | 1person | - |
| AY (핀에) | O | O | 1person | - |

---

## 3. Screen Composition

### Step 1: Passenger Split Popup

Split Passenger Select.

#### Passenger List

| Item | Display format | Description |
|------|----------|------|
| 순번 | Number | 1, 2, 3... |
| PTC | Uppercase | ADT, CHD, INF |
| TITLE | Text | MR, MS, MSTR, MISS |
| Passengerperson | English property/given name | MOON/CINDY |
| Checkbox | Select | Split Passenger Select |

#### Select Rules

| Rules | Description |
|------|------|
| Infant(INF) | in List Exposednot not (AccompanyingAdult and Doestogether Split) |
| Minimum Number of passengers | KRW래 in PNR Minimum 1person Boyexistsmust Does |
| Concurrent Split | QR: 2person Or more / SQ, AY: 1person only |

---

### Step 2: Split Confirmation popup

Select in Passenger About Split Confirm Request.

#### Display Information

| Item | Content |
|------|------|
| Split Target | Select Passenger List |
| after Split PNR | Parent PNR → child PNR Guide |
| Infant Accompanying | Accompanying Infant Auto Include Guide |

---

## 4. Parent/Child PNR Concepts

### Structure

```
Split before: PNR A (Passenger 3person)
 ↓
Split after: PNR A (Parent PNR, Passenger 2person)
 PNR B (child PNR, Passenger 1person)
```

### relation Information

| Item | Description |
|------|------|
| Parent PNR | before Split KRW래 PNR |
| child PNR | after Split Newly Create PNR |
| relation Display | Booking detail in Header Parent-child relation Exposed |

---

## 5. Infant Passenger Process

### Accompanying Rules

- Infant(INF) standaloneto Split Not possible
- Accompanying Adult when Split Infant Auto Include
- Split from Popup Infant in List Exposeddoes not

### Accompanying Adult Confirm

```
OrderViewRS/DataLists/PaxList from
- Ptc = "INF" Case
- PaxRefID using Confirm Accompanying Adult Mapping
```

---

## 6. API Flow

### Call Order

```
OrderRetrieve → OrderChange (split) → OrderRetrieve (Split PNR)
```

### API Detail

| API | Purpose |
|-----|------|
| OrderRetrieve | Current Booking Information Retrieval |
| OrderChange | Passenger Split Request |
| OrderRetrieve | Split child PNR Retrieval |

### OrderChange RQ ting

| Element | Description |
|---------|------|
| OrderID | KRW래 PNR's OrderID |
| SplitPax | Split Passenger's PaxID List |

---

## 7. UI Process Guide

### Button Exposed Condition

| Condition | Description |
|------|------|
| Carrier | QR, SQ, AY only Exposed |
| Passenger | 2person Or more In the case of only Exposed |
| Booking Status | valid Booking Status Case only |

### Checkbox control

| Carrier | control Method |
|--------|----------|
| QR | Multiple Selectable (KRW래 in PNR 1person Boymust Does) |
| SQ, AY | Single Select only Available |

### Split after Complete

1. Success 토스트 Message Display
2. Booking detail Page NewlyRefresh
3. in Header Parent-child PNR relation Display

---

## 8. after Split Booking detail Display

### Header Information

```
Parent PNR: ABC123
child PNR: DEF456, GHI789
```

### Retrieval method

| method | Description |
|------|------|
| Parent PNR | General PNR Searchto Retrieval |
| child PNR | Individual PNR Search or Parent from PNR link |

---

## 9. Precautions

1. **Split Cancellation Not possible**: Split PNR again 합칠 None
2. **Ancillary service**: after Split Ancillary service(Seat, Baggage) Re-Purchase Required
3. **Fare information**: after Split OfferPrice Information Retrieval Not possible (Penalty, PriceClass, etc.)
4. **Ticket Status**: Ticketing Ticket Splitnot not (Passenger information only Split)

---

## 10. Error handling

| Error scenarios | Process method |
|----------|----------|
| All/Total Passenger Select | "Minimum 1person KRW래 in Booking Boyexistsmust " |
| Infant only Select | "Infant standaloneto Split ." |
| Carrier unSupport | Split Button 비Exposed |
| API Failure | Error message Display and Retry Guide |

---

## Related documents

- [Booking detail](../04-booking-detail/booking-detail.md)
- [Journey/ItineraryChange](./journey-change.md)
