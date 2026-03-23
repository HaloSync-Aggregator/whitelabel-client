# Workflow Support Matrix vs Component Document compare

 Document `assert/carrier_support_matrix.yaml` (Matrix)과 each Component Document's Per carrier Support Information difference specific리 Thing.

**Select method**: each in Differences About `[1]` (Matrix Information correct) or `[2]` (Component Information correct) Select.

---

## 1. InformationChange (WF_HELD_PAX)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_HELD_PAX)
- Component: `06-change/info-change.md`, `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (WF_HELD_PAX) | Component (info-change.md) | Component (booking-detail.md) | Select |
|---|--------|---------------------|---------------------------|------------------------------|------|
| 1.1 | KE | NONE | O (PaxInfo + ContactInfo) | - | [ ] |
| 1.2 | QR | NONE | (un언급) | O | [ ] |
| 1.3 | SQ | PROD | (un언급) | O | [ ] |
| 1.4 | AF | PROD | O | - | [ ] |
| 1.5 | KL | PROD | O | - | [ ] |

**mismatch Summary:**
- **1.1 (KE)**: Matrix unSupport(NONE), info-change.md Support(O)
- **1.2 (QR)**: Matrix unSupport(NONE), booking-detail.md Support(O)
- **1.3~1.5**: booking-detail.in md InformationChange to SupportCarrier SQ/QR only Display exists나, Matrix and info-change.mdin AF/KL, etc. also Supportto Display

---

## 2. Passenger split (WF_HELD_SPLIT)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_HELD_SPLIT)
- Component: `06-change/passenger-split.md`, `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (WF_HELD_SPLIT) | Component (passenger-split.md) | Component (booking-detail.md) | Select |
|---|--------|------------------------|-------------------------------|------------------------------|------|
| 2.1 | QR | NONE | O (2person Or more Split) | O | [ ] |
| 2.2 | KL | PROD | (un언급) | - | [ ] |
| 2.3 | HA | PROD | (un언급) | (unInclude) | [ ] |
| 2.4 | TK | PROD | (un언급) | - | [ ] |
| 2.5 | TR | PROD | (un언급) | - | [ ] |
| 2.6 | AF | NONE | (un언급) | - | [ ] |

**mismatch Summary:**
- **2.1 (QR)**: Matrix unSupport(NONE), Component Support(O) - **Important mismatch**
- **2.2~2.5**: Matrix Support(PROD), Componentin un언급 or unSupport(-)

---

## 3. Journey/ItineraryChange (WF_HELD_ITIN, WF_TKT_VOLCHANGE)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_HELD_ITIN=Ticketingbefore, WF_TKT_VOLCHANGE=Ticketingafter)
- Component: `06-change/journey-change.md`, `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (HELD_ITIN/TKT_VOLCHANGE) | Component (journey-change.md) | Component (booking-detail.md) | Select |
|---|--------|----------------------------------|------------------------------|------------------------------|------|
| 3.1 | QR | NONE / NONE | Ticketingbefore=X, Ticketingafter=O | O | [ ] |
| 3.2 | KE | NONE / NONE | Ticketingbefore=O, Ticketingafter=O | - | [ ] |
| 3.3 | HA | NONE / PROD | Ticketingbefore=O, Ticketingafter=O | (unInclude) | [ ] |
| 3.4 | SQ | PROD / PROD | Ticketingbefore=X, Ticketingafter=O | O | [ ] |
| 3.5 | TK | NONE / PROD | (un언급) | - | [ ] |

**mismatch Summary:**
- **3.1 (QR)**: Matrix beforesection unSupport(NONE), Component Ticketingafter Support(O) - **Important mismatch**
- **3.2 (KE)**: Matrix beforesection unSupport(NONE), journey-change.md beforesection Support(O) - **Important mismatch**
- **3.3 (HA)**: Matrix Ticketingbefore unSupport(NONE), journey-change.md Ticketingbefore Support(O)
- **3.4 (SQ)**: Matrix Ticketingbefore Support(PROD), journey-change.md Ticketingbefore unSupport(X)
- **3.5 (TK)**: Matrix Ticketingafter Support(PROD), booking-detail.md unSupport(-)

---

## 4. SeatPurchase (WF_HELD_SEAT, WF_TKT_SEAT, WF_PB_SEAT)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_PB_SEAT=Booking, WF_HELD_SEAT=Ticketingbefore, WF_TKT_SEAT=Ticketingafter)
- Component: `07-popups/seat-popup.md`, `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (PB_SEAT / HELD_SEAT / TKT_SEAT) | Component (seat-popup.md) | Component (booking-detail.md) | Select |
|---|--------|----------------------------------------|--------------------------|------------------------------|------|
| 4.1 | AA | NONE / NONE / NONE | O | O | [ ] |
| 4.2 | BA | NONE / NONE / NONE | (un언급) | O | [ ] |
| 4.3 | KE | NONE / NONE / NONE | O | O | [ ] |
| 4.4 | TR | PROD / PROD / NONE | O | O | [ ] |
| 4.5 | EK | NONE / NONE / PROD | O | O | [ ] |
| 4.6 | LH | NONE / NONE / PROD | O | O | [ ] |

**mismatch Summary:**
- **4.1 (AA)**: Matrix beforesection unSupport(NONE), Component Support(O)
- **4.2 (BA)**: Matrix beforesection unSupport(NONE), booking-detail.md Support(O)
- **4.3 (KE)**: Matrix beforesection unSupport(NONE), Component Support(O) - **Important mismatch**
- **4.4 (TR)**: Matrix Ticketingafter unSupport(TKT_SEAT=NONE), Component Support(O)
- **4.5~4.6**: Matrix Booking/Ticketingbefore unSupport, Ticketingafter Support - from Component Distinction without Support(O)

---

## 5. Ancillary servicePurchase (WF_HELD_SERVICE, WF_TKT_SERVICE, WF_PB_SERVICE)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_PB_SERVICE=Booking, WF_HELD_SERVICE=Ticketingbefore, WF_TKT_SERVICE=Ticketingafter)
- Component: `07-popups/service-popup.md`, `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (PB_SERVICE / HELD_SERVICE / TKT_SERVICE) | Component (service-popup.md) | Component (booking-detail.md) | Select |
|---|--------|------------------------------------------------|----------------------------|------------------------------|------|
| 5.1 | BA | NONE / NONE / NONE | (un언급) | O | [ ] |
| 5.2 | KE | NONE / NONE / NONE | (un언급) | O | [ ] |
| 5.3 | TR | NONE / PROD / NONE | (un언급) | O | [ ] |
| 5.4 | AA | NONE / NONE / NONE | (un언급) | - | [ ] |
| 5.5 | HA | PROD / PROD / PROD | (un언급) | (unInclude) | [ ] |
| 5.6 | AY | PROD / PROD / PROD | (un언급) | (unInclude) | [ ] |
| 5.7 | TK | PROD / PROD / PROD | (un언급) | O | [ ] |

**mismatch Summary:**
- **5.1 (BA)**: Matrix beforesection unSupport(NONE), booking-detail.md Support(O)
- **5.2 (KE)**: Matrix beforesection unSupport(NONE), booking-detail.md Support(O) - **Important mismatch**
- **5.3 (TR)**: Matrix Ticketingafter unSupport(TKT_SERVICE=NONE), booking-detail.md Support(O)
- **5.4 (AA)**: Matrix=NONE, booking-detail.md=- (Match)
- **5.5~5.6 (HA, AY)**: Matrix Support(PROD), service-popup.mdin unInclude
- **5.7 (TK)**: Matrix=PROD, booking-detail.md=O (Match하나 service-popup.in md unInclude)

---

## 6. OCN 동's (WF_TKT_OCN)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_TKT_OCN)
- Component: `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (WF_TKT_OCN) | Component (booking-detail.md OCN동) | Select |
|---|--------|---------------------|--------------------------------------|------|
| 6.1 | AY | PROD | (unInclude) | [ ] |
| 6.2 | SQ | PROD | - | [ ] |
| 6.3 | HA | PROD | (unInclude) | [ ] |
| 6.4 | AF | PROD | O | [ ] |
| 6.5 | KL | PROD | O | [ ] |

**mismatch Summary:**
- **6.1~6.3**: Matrix Support(PROD), booking-detail.md unSupport(-) or unInclude
- **6.4~6.5 (AF/KL)**: Match (PROD / O)

---

## 7. Cancellation/Refund (WF_HELD_CANCEL, WF_TKT_REFUND)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml` (WF_HELD_CANCEL, WF_TKT_REFUND)
- Component: `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (HELD_CANCEL / TKT_REFUND) | Component (Cancel / VOID/REFUND) | Select |
|---|--------|----------------------------------|----------------------------------|------|
| 7.1 | KE | NONE / NONE | - / - | (Match) |

**Note**: partial Match. KE only unSupportto Same Display.

---

## 8. Post-ticketing / DefaultBooking (WF_PB_DEFERRED, WF_PB_IMMEDIATE, WF_HELD_CONFIRM)

### Related files
- Matrix: `assert/carrier_support_matrix.yaml`
- Component: `04-booking-detail/booking-detail.md`

### Differences

| # | Carrier | Matrix (PB_DEFERRED / PB_IMMEDIATE / HELD_CONFIRM) | Component (Post-ticketing) | Select |
|---|--------|---------------------------------------------------|-------------------|------|
| 8.1 | KE | NONE / NONE / NONE | O | [ ] |

**mismatch Summary:**
- **8.1 (KE)**: Matrix beforesection unSupport(NONE), booking-detail.md Post-ticketing Support(O) - **Important mismatch**

---

## Summary: Key/Main mismatch Item

### most Important mismatch (Select Required)

| Priority | Carrier | Feature | Matrix | Component | ItemNumber |
|---------|--------|------|--------|-----------|---------|
| 1 | KE | Post-ticketing/DefaultBooking | NONE | O | 8.1 |
| 2 | KE | Journey/ItineraryChange | NONE | O | 3.2 |
| 3 | KE | SeatPurchase | NONE | O | 4.3 |
| 4 | KE | Ancillary service | NONE | O | 5.2 |
| 5 | KE | InformationChange | NONE | O | 1.1 |
| 6 | QR | Passenger split | NONE | O | 2.1 |
| 7 | QR | Journey/ItineraryChange(Ticketingafter) | NONE | O | 3.1 |

### Note: in Matrix KE Carrier Information

```yaml
KE:
 name: "Korean Air"
 support:
 WF_PB_DEFERRED: NONE
 WF_PB_IMMEDIATE: NONE
 # ... All Workflow NONE
 notes:
 - "Minimal support across all features"
```

Matrix in File KE "Minimal support across all features"로 Display exists나, Component from Documents multiple Feature Support Thingto Display .

---

## Select 기록

Selection after complete in below 기록:

```
# Example
1.1: 2 (Component correct - KE InformationChange Support)
1.2: 1 (Matrix correct - QR InformationChange unSupport)
...
```

---

## Select Result

(User after Select 기록)

| Item | Select | Notes |
|------|------|------|
| 1.1 | | |
| 1.2 | | |
| 1.3 | | |
| 1.4 | | |
| 1.5 | | |
| 2.1 | | |
| 2.2 | | |
| 2.3 | | |
| 2.4 | | |
| 2.5 | | |
| 2.6 | | |
| 3.1 | | |
| 3.2 | | |
| 3.3 | | |
| 3.4 | | |
| 3.5 | | |
| 4.1 | | |
| 4.2 | | |
| 4.3 | | |
| 4.4 | | |
| 4.5 | | |
| 4.6 | | |
| 5.1 | | |
| 5.2 | | |
| 5.3 | | |
| 5.4 | | |
| 5.5 | | |
| 5.6 | | |
| 5.7 | | |
| 6.1 | | |
| 6.2 | | |
| 6.3 | | |
| 8.1 | | |
