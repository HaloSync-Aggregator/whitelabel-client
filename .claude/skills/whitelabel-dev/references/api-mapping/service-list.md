# ServiceList API-UI Mapping

> **API**: `POST /middleware/polarhub/service-list`
> **Detail Document**: `.claude/assets/plan/api-ui-mapping/mappings/booking/service-list.md`
> **UI Guide**: `.claude/assets/ui-component-guide/07-popups/service-popup.md`

---

## ⚠️ CRITICAL: API Spec Precautions

### Post-when Booking order Object Structure

```typescript
// ❌ Wrong e.g. - 400 Error occurs!
apiRequestBody.order = {
 orderId: body.order.orderId,
 owner: body.order.owner, // API in Spec absent Field!
};

// ✅ Correct e.g.
apiRequestBody.order = {
 orderId: body.order.orderId,
 // owner Field Exclude - in OrderRefDto None!
};
```

**API Spec (OrderRefDto)**:
```yaml
OrderRefDto:
 properties:
 orderId:
 type: string
 required:
 - orderId
 # owner Field None!
```

---

## Ancillary service Purchase Workflow

### when Booking Ancillary service Purchase (WF_PB_SERVICE)

```
AirShopping → OfferPrice → ServiceList → OfferPrice → OrderCreate
 │ │ │ │ │
 │ │ │ │ └── Booking creation (Service Include)
 │ │ │ └── 2: Service Include Price Re-Calculate
 │ │ └── Ancillary service List Retrieval (ResponseID, OfferID Required)
 │ └── 1: offer Price Confirmed (ResponseID 획득)
 └── Flight search
```

**Important**: ServiceList in Call `ResponseID`, `OfferID` to Requiredsince **OfferPrice pre행 Required**

### Before ticketing Ancillary service Add (WF_HELD_SERVICE)

```
OrderRetrieve → ServiceList → OrderQuote → OrderChange
 │ │ │ │
 │ │ │ └── Add service Confirmed
 │ │ └── Service Price Retrieval
 │ └── Ancillary service List Retrieval (OrderID only Required, owner Exclude!)
 └── Existing Booking retrieval
```

### After ticketing Ancillary service Add (WF_TKT_SERVICE)

```
OrderRetrieve → ServiceList → OrderQuote → OrderChange
 │ │ │ │
 │ │ │ └── Add service + EMD Issued
 │ │ └── Service Price Retrieval
 │ └── Ancillary service List Retrieval (OrderID only Required, owner Exclude!)
 └── Existing Booking retrieval
```

---

## API Request structure

### Prime Booking (offer based)

```typescript
const apiRequestBody = {
 transactionId: "...",
 responseParameter: { currencyCode: "KRW" },
 paxList: [{ paxId: "PAX1", ptc: "ADT" }],
 offer: {
 responseId: "...", // Required
 offerId: "...", // Required
 owner: "SQ", // Required
 offerItems: [...] // Select
 }
};
```

### Post-Booking (order based)

```typescript
const apiRequestBody = {
 transactionId: "...", // OrderRetrieve and Same transactionId Use
 responseParameter: { currencyCode: "KRW" },
 paxList: [{ paxId: "PAX1", ptc: "ADT" }],
 order: {
 orderId: "...", // Required
 // ⚠️ owner Exclude!
 }
};
```

---

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Status code | `.claude/assets/ui-component-guide/02-common/status-codes.md` |

---

## Key/Main UI Component

- **ServiceList**: Service list
- **ServiceCard**: Individual Service Card
- **SelectedServiceSummary**: Select Service Summary

---

## Service Category Classify

| ServiceCode Pattern | Category | Description |
|------------------|----------|------|
| XBAG, MBAG, ABAG, FBAG, BG* | baggage | abovedelegatedBaggage |
| PDBG, XHBG | baggage | Baggage (AY) |
| BULK, PIEC, HEAV | baggage | Exceed Baggage (SQ) |
| CBAG, HBAG | cabin | in-flightBaggage |
| LOUNGE, LNG* | lounge | lounge |
| MEAL, MLXX | meal | in-flight meal |

---

## Service Item Mapping

| UI Field | API Path | Conversion |
|---------|----------|------|
| serviceId | `AlaCarteOfferItem.Service.ServiceID` | - |
| serviceCode | `Service.ServiceCode` | XBAG |
| serviceName | `Service.Name` | Englishperson |
| serviceNameKr | `ServiceCode` | Korean Conversion |
| description | `Service.Desc[].Text` | Combination |
| weightOrCount | `Service.Desc[]` Parsing | 23KG, 1PC |
| price | `UnitPrice.TotalAmount.Amount` | - |
| currency | `UnitPrice.TotalAmount.CurCode` | - |
| eligibleSegments | `Eligibility.PaxSegmentRefID` | ICN-SIN |
| eligiblePax | `Eligibility.PaxRefs` | PAX1, PAX2 |

---

## Per carrier Baggage Service

### LHG (LH, LX, OS)

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| MBAG | Additional baggage M | -type |
| ABAG | Additional baggage | General |
| FBAG | Additional baggage F | vs-type |

### SQ (Singapore Airlines)

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| XBAG | Extra Baggage | Weight Unit (1kg) |
| BULK | Bulk Baggage | size Exceed |
| PIEC | Piece Baggage | Count Exceed |

### AF/KL

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| ABAG | Luggage First | firstth Add |
| BBAG | Luggage Second | twoth Add |
| CBAG | Luggage Third+ | th Or more |

### TR (Scoot)

| ServiceCode | Weight |
|-------------|------|
| BG20 | 20kg |
| BG25 | 25kg |
| BG30 | 30kg |
| BG35 | 35kg |
| BG40 | 40kg |

---

## Serviceperson Korean Conversion

```typescript
const serviceNameMap = {
 'ADDITIONAL BAGGAGE': 'Additional baggage',
 'PREPAID BAGS': 'pre- Purchase Baggage',
 'CHECK-IN BAGGAGE': 'abovedelegated Baggage',
 'SKI EQUIPMENT': '스key equipment',
 'GOLF EQUIPMENT': '골 equipment',
 'LOUNGE ACCESS': 'lounge 이for',
 'PRIORITY BOARDING': 'priority boarding',
};
```

---

## Weight/Count Extract

```typescript
function extractWeightOrCount(desc: ServiceDesc[]): string {
 // Weight: 23KG, 23 KG
 const weightMatch = text.match(/(\d+)\s*KG/i);
 if (weightMatch) return `${weightMatch[1]}KG`;

 // Count: 1PC, 1 piece
 const pieceMatch = text.match(/(\d+)\s*(PC|PIECE)/i);
 if (pieceMatch) return `${pieceMatch[1]}PC`;

 return '';
}
```

---

## Service purchase Not possible Carrier

```typescript
// Service unSupport
const unsupportedCarriers = ['AA', 'HA'];

// Baggage unSupport
const baggageUnsupportedCarriers = ['AA', 'HA', 'QR'];
```

---

## SSR Status Flow

| Step | StatusValue | UI Display | Next Action |
|------|--------|---------|----------|
| Purchase Request | HN | Response Pending | 기다림 |
| Confirmed Available | HD | PurchaseConfirmed Button | OrderChange(F) |
| Confirmed Complete | HI | IssueComplete | - |
| Immediately Confirmed | HK | Confirmed | - |

---

## Subsequent API Connection

```
OrderQuote Request:
├── offer.responseId = ResponseID
├── offer.offerId = AlaCarteOffer.OfferID
└── selectedOfferItems = [
 { offerItemId, paxId, segmentId }
 ]
```
