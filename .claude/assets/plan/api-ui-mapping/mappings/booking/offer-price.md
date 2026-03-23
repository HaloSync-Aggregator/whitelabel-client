# OfferPrice API-UI Mapping

> API: `POST /middleware/polarhub/offer-price`
> Response: `OfferPriceRS`

---

## Response Structure Overview

```
OfferPriceRS
├── ResultMessage
├── TransactionID
├── PricedOffer
│ ├── ResponseID
│ ├── OfferID
│ ├── Owner
│ ├── TotalPrice
│ │ ├── TotalAmount { Amount, CurCode }
│ │ ├── TotalBaseAmount { Amount, CurCode }
│ │ └── TotalTaxAmount { Amount, CurCode }
│ ├── OfferTimeLimit # offer valid period
│ ├── PaymentTimeLimit # Payment deadline Time
│ ├── JourneyOverview[] # Journey/per Itinerary Fare class Information
│ │ ├── PaxJourneyRefID
│ │ └── PriceClassInfo
│ │ ├── Code, Name
│ │ └── Descriptions[] # Mileage, Baggage, Cancellation/Change fee etc.
│ ├── BaggageAllowance[] # Baggage allowance
│ │ ├── PaxJourneyRefID
│ │ ├── PaxRefID[]
│ │ └── MaximumWeightAllowance
│ └── OfferItem[]
│ ├── OfferItemID
│ ├── Price.TotalAmount
│ ├── FareDetail[] # per Passenger Fee Detail
│ │ ├── BaseAmount
│ │ ├── TaxTotal
│ │ ├── Tax[]
│ │ ├── FareComponent[] # per Segment Fare
│ │ │ ├── Penalty # Change/Cancellation fee ⭐
│ │ │ └── FareBasis
│ │ └── PaxRefID[]
│ └── PaxJourneyRefID[]
└── DataLists
 ├── OriginDestList[]
 ├── PaxJourneyList[]
 ├── PaxSegmentList[]
 └── PaxList[]
```

---

## 1. PriceBreakdown Mapping (Payment Detail)

### Total Amount Information

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| totalAmount | `PricedOffer.TotalPrice.TotalAmount.Amount` | - | Total payment amount |
| currency | `PricedOffer.TotalPrice.TotalAmount.CurCode` | - | KRW, USD |
| baseFare | `PricedOffer.TotalPrice.TotalBaseAmount.Amount` | - | Base fare |
| totalTax | `PricedOffer.TotalPrice.TotalTaxAmount.Amount` | - | Total Tax |
| formattedTotal | Calculate | `${totalAmount.toLocaleString()} ${currency}` | for Display |

### per Passenger Fee Detail

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| passengerType | `DataLists.PaxList[].Ptc` | ptcMap Conversion | ADT→Adult |
| count | Calculate | Same Ptc Count | - |
| farePerPax | `PricedOffer.OfferItem[].FareDetail[].BaseAmount.Amount` | - | 1 Fare |
| taxPerPax | `PricedOffer.OfferItem[].FareDetail[].TaxTotal.Amount` | - | 1 Tax |
| subtotal | Calculate | `(farePerPax + taxPerPax) * count` | Subtotal |

### Tax Detail

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| taxCode | `PricedOffer.OfferItem[].FareDetail[].Tax[].TaxCode` | taxCodeMap Conversion | BP, YR, etc. |
| taxName | `TaxCode` → Taxperson Retrieval | Separate Tax List Required | Fuel Surcharge, etc. |
| taxAmount | `PricedOffer.OfferItem[].FareDetail[].Tax[].Amount.Amount` | - | - |

---

## 2. FareRule Mapping (Fare rules)

### Fare class Information

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| priceClassName | `PricedOffer.JourneyOverview[].PriceClassInfo.Name` | - | Economy Lite, etc. |
| priceClassCode | `PricedOffer.JourneyOverview[].PriceClassInfo.Code` | - | FF51KRS |
| descriptions | `PricedOffer.JourneyOverview[].PriceClassInfo.Descriptions[]` | Parsing | below Reference |

### Descriptions Parsing Rules

PriceClassInfo.Descriptions[]from to key워드 Distinction:

| key워드 | UI Field | Example |
|--------|---------|------|
| `Earn KrisFlyer miles` | mileageEarn | "50%" |
| `Upgrade with miles` | mileageUpgrade | "Not Allowed" |
| `Cabin baggage` | cabinBaggage | "1 piece Up to 7kg" |
| `Check-in baggage` | checkedBaggage | "25kg" |
| `Booking cancellation fee` | cancellationFee | "USD 200" |
| `Booking change fee` | changeFee | "USD 75" |
| `Booking no-show fee` | noShowFee | "USD 100" |
| `Seat Selection` | seatSelection | "Chargeable" |

### Change/Cancellation fee (Penalty)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| canChange | `FareComponent[].Penalty.Change` | boolean | "true" → Available |
| canRefund | `FareComponent[].Penalty.Refund` | boolean | "true" → Available |
| changeFeeMin | `Penalty.Detail[Type=Change].Amounts[AmountApplication=MIN]` | - | Minimum Fee |
| changeFeeMax | `Penalty.Detail[Type=Change].Amounts[AmountApplication=MAX]` | - | Maximum Fee |
| cancelFeeMin | `Penalty.Detail[Type=Cancel].Amounts[AmountApplication=MIN]` | - | Minimum Fee |
| cancelFeeMax | `Penalty.Detail[Type=Cancel].Amounts[AmountApplication=MAX]` | - | Maximum Fee |

### Penalty Application Code

| Code | 의un | Description |
|------|------|------|
| `1` | Before Departure | Before departure |
| `2` | After Departure | after Departure |
| `3` | No Show | no-show |

---

## 3. BaggageAllowance Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| journeyRef | `PricedOffer.BaggageAllowance[].PaxJourneyRefID` | - | FLT1, FLT2 |
| passengerRefs | `PricedOffer.BaggageAllowance[].PaxRefID[]` | - | PAX1, PAX2 |
| type | `PricedOffer.BaggageAllowance[].TypeCode` | - | Checked, Cabin |
| weight | `PricedOffer.BaggageAllowance[].MaximumWeightAllowance.Value` | - | 25 |
| unit | `PricedOffer.BaggageAllowance[].MaximumWeightAllowance.UnitCode` | - | KGM |
| formatted | Calculate | `${weight}${unit === 'KGM' ? 'kg' : unit}` | "25kg" |

### per Passenger Baggage Group핑

```typescript
// Same PaxRefID 진 Item Group핑
interface BaggageByPax {
 adultBaggage: string; // "25kg"
 childBaggage: string; // "25kg"
 infantBaggage: string; // "10kg"
}
```

---

## 4. TimeLimit Information

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| offerExpiry | `PricedOffer.OfferTimeLimit` | ISO8601 → Local | offer only료 |
| paymentDeadline | `PricedOffer.PaymentTimeLimit` | ISO8601 → Local | Payment deadline |
| remainingTime | Calculate | `paymentDeadline - now` | remaining Time |

---

## 5. Journey information (DataLists Utilize)

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| departureCity | `DataLists.PaxSegmentList[].Departure.AirportCode` | - | ICN |
| departureTime | `DataLists.PaxSegmentList[].Departure.Time` | - | 12:35 |
| departureDate | `DataLists.PaxSegmentList[].Departure.Date` | - | 2026-01-02 |
| arrivalCity | `DataLists.PaxSegmentList[].Arrival.AirportCode` | - | SIN |
| arrivalTime | `DataLists.PaxSegmentList[].Arrival.Time` | - | 18:20 |
| flightNumber | `MarketingCarrier.AirlineID` + `FlightNumber` | - | SQ611 |
| duration | `DataLists.PaxSegmentList[].FlightDuration` | ISO8601 → Korean | 6Time 45 min |

---

## 6. for OrderCreate Data 보존

OfferPrice from Response OrderCreate in Request Required Data:

```typescript
interface OfferPriceResult {
 // UI for Display Data
 priceBreakdown: PriceBreakdown;
 fareRules: FareRule[];
 baggage: BaggageAllowance[];

 // ⚠️ Important: OrderCreate in Call Required Original Data
 _raw: {
 transactionId: string;
 responseId: string; // PricedOffer.ResponseID
 offerId: string; // PricedOffer.OfferID
 owner: string; // PricedOffer.Owner
 offerItems: Array<{
 offerItemId: string;
 paxRefId: string[];
 }>;
 paymentTimeLimit: string;
 };
}
```

---

## 7. Conversion Function

```typescript
// Passenger type Conversion
const ptcMap: Record<string, string> = {
 'ADT': 'Adult',
 'CHD': 'Child',
 'INF': 'Infant'
};

// Tax Code Conversion
const taxCodeMap: Record<string, string> = {
 'BP': 'Departure Tax',
 'YR': 'Fuel Surcharge',
 'SG': 'Singapore Airport Tax',
 'L7': 'Airport Facility Fee',
 'OP': 'Security Fee'
};

// ISO8601 Duration → Korean
function formatDuration(duration: string): string {
 const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
 if (!match) return duration;

 const hours = match[1] ? `${match[1]}Time` : '';
 const minutes = match[2] ? ` ${match[2]}min` : '';
 return `${hours}${minutes}`.trim();
}

// ISO8601 DateTime → Local Time
function formatDateTime(isoString: string): string {
 const date = new Date(isoString);
 return date.toLocaleString('ko-KR', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit'
 });
}

// Fee Format
function formatPenalty(penalty: Penalty): PenaltyDisplay {
 const changeDetail = penalty.Detail.filter(d => d.Type === 'Change');
 const cancelDetail = penalty.Detail.filter(d => d.Type === 'Cancel');

 return {
 canChange: penalty.Change === 'true',
 canRefund: penalty.Refund === 'true',
 changeFee: extractFeeRange(changeDetail),
 cancelFee: extractFeeRange(cancelDetail),
 };
}

function extractFeeRange(details: PenaltyDetail[]): FeeRange | null {
 if (!details.length) return null;

 const beforeDept = details.find(d => d.Application.Code === '1');
 const afterDept = details.find(d => d.Application.Code === '2');

 return {
 beforeDeparture: beforeDept ? {
 min: beforeDept.Amounts.find(a => a.AmountApplication === 'MIN')?.CurrencyAmountValue ?? 0,
 max: beforeDept.Amounts.find(a => a.AmountApplication === 'MAX')?.CurrencyAmountValue ?? 0,
 currency: beforeDept.Amounts[0]?.Code ?? 'KRW'
 } : null,
 afterDeparture: afterDept ? {
 min: afterDept.Amounts.find(a => a.AmountApplication === 'MIN')?.CurrencyAmountValue ?? 0,
 max: afterDept.Amounts.find(a => a.AmountApplication === 'MAX')?.CurrencyAmountValue ?? 0,
 currency: afterDept.Amounts[0]?.Code ?? 'KRW'
 } : null
 };
}
```

---

## 8. All/Total Mapping 다이그

```
OfferPriceRS
│
├─ PricedOffer ───────────────────────────────────────────────────┐
│ ├─ ResponseID ─────────────────────────────────────────────────┼── [OrderCreatefor]
│ ├─ OfferID ────────────────────────────────────────────────────┼── [OrderCreatefor]
│ ├─ Owner ──────────────────────────────────────────────────────┼── [OrderCreatefor]
│ ├─ TotalPrice.TotalAmount.Amount ──────────────────────────────┼── totalAmount
│ ├─ TotalPrice.TotalBaseAmount.Amount ──────────────────────────┼── baseFare
│ ├─ TotalPrice.TotalTaxAmount.Amount ───────────────────────────┼── totalTax
│ ├─ OfferTimeLimit ─────────────────────────────────────────────┼── offerExpiry
│ ├─ PaymentTimeLimit ───────────────────────────────────────────┼── paymentDeadline
│ │
│ ├─ JourneyOverview[] ──────────────────────────────────────────┐
│ │ └─ PriceClassInfo ──────────────────────────────────────────┼── priceClassName, fareRules
│ │
│ ├─ BaggageAllowance[] ─────────────────────────────────────────┼── baggage
│ │
│ └─ OfferItem[]
│ └─ FareDetail[] ────────────────────────────────────────────┐
│ ├─ BaseAmount ───────────────────────────────────────────┼── farePerPax
│ ├─ TaxTotal ─────────────────────────────────────────────┼── taxPerPax
│ ├─ Tax[] ────────────────────────────────────────────────┼── taxDetails
│ ├─ FareComponent[].Penalty ──────────────────────────────┼── changeFee, cancelFee
│ └─ FareComponent[].FareBasis ────────────────────────────┼── fareBasisCode
│
└─ DataLists
 ├─ PaxSegmentList[] ───────────────────────────────────────────┼── Journey/Itinerary Detail Information
 └─ PaxList[] ──────────────────────────────────────────────────┼── Passenger type
```

---

## 9. AirShopping → OfferPrice Flow

```
AirShoppingRS OfferPriceRQ OfferPriceRS
───────────── ──────────── ────────────
Offer.ResponseID ───────────────→ offer.responseId
Offer.OfferID ───────────────→ offer.offerId
Offer.Owner ───────────────→ offer.owner
OfferItem[].OfferItemID ─────────→ offer.offerItems[].offerItemId
OfferItem[].PaxRefID ────────────→ offer.offerItems[].paxRefId
 PricedOffer (Re-Calculate Price)
```

---

## 10. Reference ID Connection

| Reference ID | Position | Connection Target |
|---------|------|----------|
| PaxJourneyRefID | JourneyOverview[], BaggageAllowance[] | PaxJourneyList[].PaxJourneyID |
| PaxSegmentRefID | PaxJourneyList[] | PaxSegmentList[].PaxSegmentID |
| PaxRefID | BaggageAllowance[], FareDetail[] | PaxList[].PaxID |
