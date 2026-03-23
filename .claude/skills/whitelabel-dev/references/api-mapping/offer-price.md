# OfferPrice API-UI Mapping

> **API**: `POST /middleware/polarhub/offer-price`
> **Purpose**: Select Flight's Detail Fare inquiry

---

## Common reference

| Document | Path |
|------|------|
| Concepts: MatchResult | `.claude/skills/whitelabel-dev/references/concepts/match-result.md` |
| AirShopping Mapping | `.claude/skills/whitelabel-dev/references/api-mapping/air-shopping.md` |
| Offer Transformer | `.claude/skills/whitelabel-dev/references/api-client/offer-transformer.md` |

---

## API Flow

```
AirShopping → FlightCard Select → OfferPrice → PriceBreakdown Modal → Booking in progress
```

---

## Request Composition

### FULL Offer (Single offer)

```typescript
{
 transactionId: string;
 offers: [
 {
 responseId: flight._raw.responseId,
 offerId: flight._raw.offerId,
 owner: flight._raw.owner,
 offerItems: flight._raw.offerItems
 }
 ],
 paxList: [
 { paxId: "SQ_PAX1", ptc: "ADT" },
 { paxId: "SQ_PAX2", ptc: "CHD" }
 ]
}
```

### PARTIAL Offer (Plural offers)

> **Caution**: PARTIAL from Case Outbound/Return Each's offer to Array Transmission

```typescript
{
 transactionId: string;
 offers: [
 {
 // Outbound offer
 responseId: outboundFlight._raw.responseId,
 offerId: outboundFlight._raw.offerId,
 owner: outboundFlight._raw.owner,
 offerItems: outboundFlight._raw.offerItems
 },
 {
 // Return offer
 responseId: inboundFlight._raw.responseId,
 offerId: inboundFlight._raw.offerId,
 owner: inboundFlight._raw.owner,
 offerItems: inboundFlight._raw.offerItems
 }
 ],
 paxList: [...] // two offer's paxRefId Union
}
```

---

## paxList Process

### FULL Offer

Select offer's `offerItems[].paxRefId` Corresponding Passenger only filtering:

```typescript
const offerPaxRefIds = new Set(
 flight._raw.offerItems.flatMap(item => item.paxRefId)
);
const filteredPaxList = paxList.filter(pax => offerPaxRefIds.has(pax.paxId));
```

### PARTIAL Offer

two offer's paxRefId 합쳐 Duplicate Remove:

```typescript
const allPaxRefIds = new Set([
 ...outboundFlight._raw.offerItems.flatMap(i => i.paxRefId),
 ...inboundFlight._raw.offerItems.flatMap(i => i.paxRefId),
]);
const mergedPaxList = paxList.filter(pax => allPaxRefIds.has(pax.paxId));
```

---

## Response → UI Conversion

### PriceBreakdown Core Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| totalAmount | `PricedOffer.TotalPrice.TotalAmount.Amount` | - |
| currency | `PricedOffer.TotalPrice.TotalAmount.CurCode` | - |
| baseFare | `PricedOffer.TotalPrice.TotalBaseAmount.Amount` | - |
| totalTax | `PricedOffer.TotalPrice.TotalTaxAmount.Amount` | - |
| offerTimeLimit | `PricedOffer.OfferTimeLimit` | ISO 8601 |
| paymentTimeLimit | `PricedOffer.PaymentTimeLimit` | ISO 8601 |

### per Passenger Fare Classify

```typescript
passengerBreakdown = PricedOffer.OfferItem[].FareDetail[].map(fd => ({
 type: formatPtc(fd.PaxRefID[0]), // "Adult", "Child", "Infant"
 baseFare: fd.BaseAmount.Amount,
 tax: fd.TaxTotal.Amount,
 subtotal: fd.BaseAmount.Amount + fd.TaxTotal.Amount,
 taxDetails: fd.Tax[].map(t => ({
 code: t.TaxCode,
 name: getTaxName(t.TaxCode),
 amount: t.Amount.Amount
 }))
}))
```

### Fare rules

```typescript
fareRules = PricedOffer.JourneyOverview[].map(j => ({
 journeyRef: j.PaxJourneyRefID,
 priceClassName: j.PriceClassInfo.Name,
 priceClassCode: j.PriceClassInfo.Code,
 rules: parseDescriptions(j.PriceClassInfo.Descriptions)
}))
```

---

## _orderData Composition

OfferPrice from Response OrderCreate API in Call Required Data Extract:

```typescript
_orderData: {
 transactionId: response.TransactionID,
 responseId: PricedOffer.ResponseID,
 offerId: PricedOffer.OfferID,
 owner: PricedOffer.Owner,
 // ⭐ OfferPriceRS's offerItems - in OrderCreate Required
 offerItems: PricedOffer.OfferItem[].map(item => ({
 offerItemId: item.OfferItemID,
 paxRefId: item.FareDetail[].flatMap(fd => fd.PaxRefID)
 })),
 // ⭐ OfferPriceRS's paxList - booking Page Form for Create
 paxList: DataLists.PaxList[].map(pax => ({
 paxId: pax.PaxID,
 ptc: pax.Ptc
 }))
}
```

---

## UI Flow

### FULL Offer

```
FlightCard Click
 ↓
OfferPrice API Call (Single offer)
 ↓
PriceBreakdown Modal Display
 ↓
"Booking in progress" Click → /booking Page
```

### PARTIAL Offer

```
Outbound FlightCard Select (outboundFlight Save)
 ↓
Return FlightCard Select (inboundFlight Save)
 ↓
"Selection complete" Button activationpropertyconversion
 ↓
OfferPrice API Call (2items offers Array)
 ↓
PriceBreakdown Modal Display (Sum Amount)
 ↓
"Booking in progress" Click → /booking Page
```

---

## Price variation Process

| Scenario | Process |
|------|------|
| Price Same | to Bar Payment Progress |
| Price variation | Difference Popup after Display Progress |

### Difference Popup UI

```
┌─────────────────────────────────────────────┐
│ Fare Change │
├─────────────────────────────────────────────┤
│ Item before Change after Change variationAmount │
│ Fare 800,000 850,000 +50,000 │
│ Tax 50,000 52,000 +2,000 │
│ Total 850,000 902,000 +52,000 │
│ │
│ [Cancellation] [Confirm] │
└─────────────────────────────────────────────┘
```

---

## Code Example

### PARTIAL Offer OfferPrice Call

```typescript
const handleOfferPrice = async () => {
 const isPartialMode = outboundFlight?._raw?.matchResult === 'PARTIAL';

 if (isPartialMode) {
 if (!outboundFlight || !inboundFlight) {
 alert('Outbound and Return All Select.');
 return;
 }

 // two offer Composition
 const offers = [
 {
 responseId: outboundFlight._raw!.responseId,
 offerId: outboundFlight._raw!.offerId,
 owner: outboundFlight._raw!.owner,
 offerItems: outboundFlight._raw!.offerItems,
 },
 {
 responseId: inboundFlight._raw!.responseId,
 offerId: inboundFlight._raw!.offerId,
 owner: inboundFlight._raw!.owner,
 offerItems: inboundFlight._raw!.offerItems,
 },
 ];

 // paxList merge
 const allPaxRefIds = new Set([
 ...(outboundFlight._raw!.offerItems || []).flatMap(i => i.paxRefId),
 ...(inboundFlight._raw!.offerItems || []).flatMap(i => i.paxRefId),
 ]);
 const mergedPaxList = paxList.filter(p => allPaxRefIds.has(p.paxId));

 const result = await getOfferPrice({
 transactionId,
 offers,
 paxList: mergedPaxList,
 });

 // ...
 } else {
 // FULL: Existing Single offer Process
 // ...
 }
};
```

---

## ⭐ PriceBreakdown Component Use Guide

### Required: Modal Component based

PriceBreakdown `Modal` Component basedto must Implementation .

```typescript
// components/flight/PriceBreakdown.tsx
import { Modal } from '@/components/ui/Modal';

<Modal
 open={open}
 onClose={onClose}
 title="Price Detail"
 className="max-w-2xl max-h-[90vh] overflow-y-auto"
>
 {/* Content */}
</Modal>
```

### Required: `open` prop Use

```typescript
// ✅ Correct Use - open propto control
{priceBreakdown && (
 <PriceBreakdown
 data={priceBreakdown}
 open={!!selectedFlight || (isPartialMode && !!outboundFlight && !!inboundFlight)}
 onClose={handleClose}
 onProceed={handleProceed}
 />
)}
```

### PriceBreakdown Required Display items

```
□ Payment deadline Time (Warning Style + remaining Time)
□ Total payment amount (text-3xl font-bold text-primary)
□ Base fare / Tax Split
□ per Passenger Fee
 □ Base fare (1)
 □ Tax (1)
 □ Tax Detail (collapse힌 Status, details/summary)
□ Fare rules (fareRules)
 □ Fare classperson
 □ abovedelegated/in-flight Baggage
 □ Seat selection Available Whether
□ Change/Cancellation rules (penaltyInfo)
 □ Change/Refund Available Whether (Badge: success/error)
 □ Fee (Before departure/after)
□ Baggage allowance
□ Cancellation/BookingProgress Button
```

---

## Reference

- **OpenAPI Spec**: `.claude/assets/whitelabel-middleware.openapi.yaml`
- **MatchResult Concepts**: `.claude/skills/whitelabel-dev/references/concepts/match-result.md`
- **Search results UI**: `.claude/skills/whitelabel-dev/references/pages/search-results.md`
