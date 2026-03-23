# Fare Recalculation

## Overview
This is the step to confirm the final fare after selecting a flight. Fares may change from the time of search, so recalculation is performed.

---

## Fare Change Notification

### When fare is unchanged
- Navigate directly to payment information input popup

### When fare has changed
- Display fare difference popup before proceeding

---

## Fare Difference Popup

### Display Items

| Item | Before Change | After Change | Difference |
|------|--------------|--------------|------------|
| Base Fare | Previous amount | New amount | Difference |
| Tax | Previous amount | New amount | Difference |
| Total | Previous amount | New amount | Difference |

### Difference Amount Display
- When increased: **red** text, +amount displayed
- When decreased: **-amount** displayed

### Popup Example
```
┌─────────────────────────────────────────────┐
│ Fare has been changed │
├─────────────────────────────────────────────┤
│ │
│ Item Before After Difference│
│ ───────────────────────────────────────── │
│ Base Fare 800,000 850,000 +50,000 │
│ Tax 50,000 52,000 +2,000 │
│ Total 850,000 902,000 +52,000 │
│ │
│ ※ Do you wish to proceed? │
│ │
│ [Cancel] [Confirm] │
└─────────────────────────────────────────────┘
```

---

## Buttons

| Button | Action |
|--------|--------|
| Confirm | Proceed to payment with updated fare |
| Cancel | Return to search results |

---

## Deferred Ticketing

A method where only the booking is created and payment is made within the deadline to issue the ticket.

### Deferred Ticketing Supported Airlines
LH, LX, OS, AA, EK, HA, BA, SQ, QR, AF, KL, AY, KE, TK, TR

### Deferred Ticketing Fare Recalculation Flow

| Airline | API Flow | Notes |
|---------|----------|-------|
| LH, AA, EK, HA | OrderRetrieve → OrderReshop → OrderChange(F) | ResponseID required when price changes |
| BA | OrderRetrieve → OrderReshop → OrderChange(F) | ResponseID required regardless of price |
| SQ, QR (18.1) | OrderRetrieve → OrderReshop → OrderChange(F) | OfferID required |
| SQ, AY (21.3) | OrderRetrieve → OrderQuote → OrderChange(F) | Uses AcceptRepricedOrder |
| AF, KL | OrderRetrieve → OrderChange(F) | No OrderReshop performed |
| TR | OrderRetrieve → OrderChange(F) | No OrderQuote performed (no fare change) |
| KE | OrderRetrieve → OrderQuote(optional) → OrderChange(F) | OrderQuote optional |
| TK, AS | OrderRetrieve → OrderChange(F) | No fare change within TL |

### Price Change Detection

| Airline | Detection Method |
|---------|-----------------|
| FLX 17.2 (LH, AA, EK, HA) | NoPriceChangeInd = "true" means no change |
| FLX 21.3 (KE, HA) | Check NoChangeInd value |
| BA | Compare TotalPrice (ReshopOffer vs OrderView) |
| 1A (SQ, QR, AY) | Compare TotalAmount (RepricedOffer vs OriginalOrderItem) |
| AF, KL | No OrderReshop - use OrderView amount |
| TR, AS | No fare change after booking |

### UI Handling Guide

#### When no price change
- Proceed directly to payment without fare difference popup
- Call OrderChange(F)

#### When price has changed
1. Display fare difference popup
2. After user confirmation, proceed with payment at updated amount
3. Call OrderChange(F)

---

## Fare Time Limit

After booking, there is a payment deadline. The booking is automatically cancelled if the deadline is exceeded.

### Time Limit Information

| Airline | Time Limit | Notes |
|---------|------------|-------|
| LH, LX, OS | Airline-provided value | Check from OrderViewRS |
| AF, KL | Airline-provided value | Immediate ticketing recommended |
| SQ | Airline-provided value | |
| QR | Airline-provided value | |
| TR | Airline-provided value | |
| AS | 20 minutes | Booking-only available for TMC |

### UI Display
- Display payment deadline date/time
- Show warning message when deadline is approaching
- Disable payment button when deadline has passed
