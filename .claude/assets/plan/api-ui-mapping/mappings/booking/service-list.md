# ServiceList API-UI Mapping

> API: `POST /middleware/polarhub/service-list`
> Response: `ServiceListRS`

---

## Response Structure Overview

```
ServiceListRS
├── ResultMessage
├── Recipient
├── PointOfSale
├── TransactionID
├── ResponseID # Subsequent API for Call
├── AlaCarteOffer
│ ├── OfferID
│ ├── Owner
│ ├── ValidatingCarrier
│ └── AlaCarteOfferItem[] # Service list
│ ├── OfferItemID
│ ├── Eligibility # Applied Condition (Segment, Passenger)
│ ├── Service
│ │ ├── ServiceID
│ │ ├── ServiceCode # XBAG, BULK etc.
│ │ ├── Name # Serviceperson
│ │ └── Desc[] # Detail Description
│ └── UnitPrice
│ └── TotalAmount
│ ├── Amount
│ └── CurCode
└── DataLists
```

---

## 1. Service Category Classify

### ServiceCode based Category Mapping

| ServiceCode Pattern | Category | Description |
|------------------|----------|------|
| XBAG, MBAG, ABAG, FBAG, BAGGAGE, BG* | baggage | abovedelegatedBaggage |
| PDBG, XHBG | baggage | Baggage (AY) |
| BULK, PIEC, HEAV | baggage | Exceed Baggage (SQ) |
| CBAG, HBAG | cabin | in-flightBaggage |
| LOUNGE, LNG* | lounge | lounge |
| MEAL, MLXX | meal | in-flight meal |
| SEAT, ST* | seat | Seat (SeatAvailability Use) |
| Other | others | Other Service |

```typescript
function categorizeService(serviceCode: string): string {
 const code = serviceCode.toUpperCase();

 // Baggage
 if (/^(XBAG|MBAG|ABAG|FBAG|PDBG|XHBG|BULK|PIEC|HEAV|BG\d+)/.test(code)) {
 return 'baggage';
 }

 // in-flightBaggage
 if (/^(CBAG|HBAG)/.test(code)) {
 return 'cabin';
 }

 // lounge
 if (/^(LOUNGE|LNG)/.test(code)) {
 return 'lounge';
 }

 // in-flight meal
 if (/^(MEAL|ML)/.test(code)) {
 return 'meal';
 }

 return 'others';
}
```

---

## 2. Service Item (ServiceItem) Mapping

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| serviceId | `AlaCarteOfferItem.Service.ServiceID` | - | and유 ID |
| serviceCode | `AlaCarteOfferItem.Service.ServiceCode` | - | XBAG, etc. |
| serviceName | `AlaCarteOfferItem.Service.Name` | - | Englishperson |
| serviceNameKr | `ServiceCode` → nameMap | Conversion | Koreanperson |
| description | `AlaCarteOfferItem.Service.Desc[].Text` | Combination | Detail Description |
| weightOrCount | `AlaCarteOfferItem.Service.Desc[]` Parsing | Extract | 23KG, 1PC |
| price | `AlaCarteOfferItem.UnitPrice.TotalAmount.Amount` | - | Price |
| currency | `AlaCarteOfferItem.UnitPrice.TotalAmount.CurCode` | - | Currency |
| eligibleSegments | `AlaCarteOfferItem.Eligibility.PaxSegmentRefID` | Segment Conversion | ICN-SIN |
| eligiblePax | `AlaCarteOfferItem.Eligibility.PaxRefs` | - | PAX1, PAX2 |

---

## 3. Applied Condition (Eligibility) Mapping

```
AlaCarteOfferItem.Eligibility
├── FlightRefs[] # Applied Flight
├── PaxSegmentRefID[] # Applied Segment
├── PaxRefs[] # Applied Passenger
└── ServiceDefinitionRef
```

| UI Field | API Response Path | Conversion logic | Notes |
|---------|------------------|----------|------|
| eligibleSegments[] | `Eligibility.PaxSegmentRefID` | PaxSegmentList Connection | Segment Display |
| eligiblePax[] | `Eligibility.PaxRefs` | - | Passenger ID |
| isAllSegments | `Eligibility.PaxSegmentRefID` if absent | true | All/Total Segment |
| isAllPax | `Eligibility.PaxRefs` if absent | true | All/Total Passenger |

---

## 4. Per carrier Baggage Service Mapping

### LHG (LH, LX, OS)

| ServiceCode | Serviceperson (English) | Serviceperson (Korean) | Description |
|-------------|----------------|----------------|------|
| MBAG | Additional Baggage M | Additional baggage M | -type |
| ABAG | Additional Baggage | Additional baggage | General |
| FBAG | Additional Baggage F | Additional baggage F | vs-type |

### EK (에un레이트)

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| ASVC | PrePaid Bags | 5kg Unit (5~50kg) |

### SQ (Singapore Airlines)

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| XBAG | Extra Baggage | Weight Unit (1kg) |
| BULK | Bulk Baggage | size Exceed |
| PIEC | Piece Baggage | Count Exceed |
| HEAV | Heavy Baggage | Weight Exceed |

### AF/KL

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| ABAG | Luggage First | firstth Additional baggage |
| BBAG | Luggage Second | twoth Additional baggage |
| CBAG | Luggage Third+ | th Or more |

### AY (핀에)

| ServiceCode | Serviceperson | Description |
|-------------|----------|------|
| PDBG | Pre Paid Baggage | pre- Purchase Baggage |
| XHBG | Heavy Baggage | 32kg Or less |
| SKIS | Ski Equipment | 스key equipment |
| GOLF | Golf Equipment | 골 equipment |
| BIKE | Bicycle | before거 |

### TR (Scoot)

| ServiceCode | Serviceperson | Weight |
|-------------|----------|------|
| BG20 | Check-in Baggage | 20kg |
| BG25 | Check-in Baggage | 25kg |
| BG30 | Check-in Baggage | 30kg |
| BG35 | Check-in Baggage | 35kg |
| BG40 | Check-in Baggage | 40kg |

---

## 5. Serviceperson Korean Conversion

```typescript
const serviceNameMap: Record<string, string> = {
 // Baggage
 'ADDITIONAL BAGGAGE': 'Additional baggage',
 'PREPAID BAGS': 'pre- Purchase Baggage',
 'EXTRA BAGGAGE': 'Additional baggage',
 'CHECK-IN BAGGAGE': 'abovedelegated Baggage',
 'LUGGAGE-FIRST': 'firstth Additional baggage',
 'LUGGAGE-SECOND': 'twoth Additional baggage',

 // 스포츠
 'SKI EQUIPMENT': '스key equipment',
 'GOLF EQUIPMENT': '골 equipment',
 'BICYCLE': 'before거',
 'SURFBOARD': '서핑보드',

 // Other
 'LOUNGE ACCESS': 'lounge 이for',
 'PRIORITY BOARDING': 'priority boarding',
 'EXTRA LEGROOM': 'Legroom Seat'
};

function translateServiceName(name: string): string {
 const upperName = name.toUpperCase();
 return serviceNameMap[upperName] || name;
}
```

---

## 6. Weight/Count Information Extract

```typescript
function extractWeightOrCount(desc: ServiceDesc[]): string {
 for (const d of desc) {
 const text = d.Text || '';

 // Weight Pattern: 23KG, 23 KG, 23kg
 const weightMatch = text.match(/(\d+)\s*KG/i);
 if (weightMatch) {
 return `${weightMatch[1]}KG`;
 }

 // Count Pattern: 1PC, 1 PC, 1 piece
 const pieceMatch = text.match(/(\d+)\s*(PC|PIECE)/i);
 if (pieceMatch) {
 return `${pieceMatch[1]}PC`;
 }
 }

 return '';
}
```

---

## 7. Select Service (SelectedService)

| UI Field | source | Description |
|---------|------|------|
| serviceId | AlaCarteOfferItem.OfferItemID | offer Item ID |
| paxId | Client Select | Select Passenger |
| passengerName | DataLists.PaxList[] Connection | Passengerperson |
| serviceName | Service.Name | Serviceperson |
| segment | Eligibility.PaxSegmentRefID | Applied Segment |
| weightOrCount | Extract Logic | Weight/Count |
| price | UnitPrice.TotalAmount.Amount | Price |
| currency | UnitPrice.TotalAmount.CurCode | Currency |
| quantity | Client Select | quantity |

---

## 8. Subsequent API Call Reference

```
ServiceListRS
├── ResponseID ────────────────┐
├── AlaCarteOffer │
│ └── OfferID ───────────────┤
└── AlaCarteOfferItem[] │ OrderQuote / OrderChange when Call Use
 └── OfferItemID ───────────┘

OrderQuote Request:
├── offer.responseId = ResponseID
├── offer.offerId = AlaCarteOffer.OfferID
└── selectedOfferItems = [
 { offerItemId: "...", paxId: "PAX1", segmentId: "SEG1" }
 ]
```

---

## 9. Service purchase Not possible Process

```typescript
// Service unSupported carriers
const unsupportedCarriers = ['AA', 'HA'];

// Baggage unSupported carriers
const baggageUnsupportedCarriers = ['AA', 'HA', 'QR'];

function getServiceAvailability(carrierCode: string): {
 showServiceButton: boolean;
 showBaggageCategory: boolean;
} {
 return {
 showServiceButton: !unsupportedCarriers.includes(carrierCode),
 showBaggageCategory: !baggageUnsupportedCarriers.includes(carrierCode)
 };
}
```

---

## 10. SSR Status Process

| Purchase Step | StatusValue | UI Display | Next Action |
|----------|--------|---------|----------|
| Purchase Request | HN | Response Pending | 기다림 |
| Confirmed Available | HD | PurchaseConfirmed Button Exposed | OrderChange(F) |
| Confirmed Complete | HI | IssueComplete | - |
| Immediately Confirmed | HK | Confirmed | - |

---

## 11. Weight-based service (BookingInstructions)

### Overview

Partial Baggage Service(XBAG, etc.) Fixed Weight not **User Directly Weight Input**must .
이런 Service ServiceListRS's `BookingInstructions.Method` `%WVAL%` Pattern Include .

```
ServiceListRS
└── AlaCarteOfferItem
 └── Service
 └── Definition
 └── BookingInstructions
 ├── SsrCode: ["XBAG"]
 ├── Text: []
 ├── Method: "TTL\\s?%WVAL%KG" # ⭐ Weight input Pattern
 └── Ositext: ["WVAL", "[0-9]{1,3}"]
```

### Weight input Whether needed Judgment

```typescript
interface BookingInstructions {
 ssrCode?: string[];
 text?: string[];
 method?: string; // "TTL\\s?%WVAL%KG"
 osiText?: string[];
}

function requiresWeightInput(bookingInstructions?: BookingInstructions): boolean {
 return bookingInstructions?.method?.includes('%WVAL%') ?? false;
}
```

### UI Implementation

Weight input Required Service Card:
1. "Weight input" Badge Display
2. when Click Immediately Select Done (Weight input Required)
3. Weight input Field (1~100 KG) + "Select" Button
4. Weight after input "Select" Button when click Service Select

### OfferPrice when Request BookingInstructions Pass

Weight input Service Select time, two th OfferPrice in Request BookingInstructions Include:

```typescript
// OfferPriceRQ.offers[].offerItems[]
// ⚠️ Middleware spec: ositext (Lowercase t)
{
 offerItemId: "ITEM_XBAG_001",
 paxRefId: ["PAX1"],
 bookingInstructions: {
 text: ["TTL10KG"], // ⭐ Method from Pattern %WVAL% WeightValueto replacement
 ositext: ["TTL\\s?%WVAL%KG"] // Method Original
 }
}
```

### Pattern Conversion logic

```typescript
// ⚠️ Middleware spec: ositext (Lowercase t)
function buildBookingInstructions(
 original: BookingInstructions,
 weightValue: number
): { text: string[]; ositext: string[] } {
 const method = original.method || '';

 // Method from Pattern %WVAL% WeightValueto replacement
 // "TTL\\s?%WVAL%KG" + 10 → "TTL10KG"
 const textValue = method
 .replace('\\s?', '')
 .replace('%WVAL%', weightValue.toString());

 return {
 text: [textValue], // Weight inputValue Include
 ositext: [method], // Method Original
 };
}
```

### ⭐ Price Calculate (Important)

Weight-based service **Unit price × kg**로 Calculate:

```typescript
// Price Calculate Logic
function calculateServicePrice(
 service: ServiceItem,
 quantity: number,
 weightValue?: number
): number {
 // Weight-based service: Unit price × Weight(kg)
 if (service.requiresWeightInput && weightValue) {
 return service.price * weightValue;
 }
 // General service: Unit price × quantity
 return service.price * quantity;
}

// Example: XBAG Unit price 33,200KRW, 12kg Select
// → 33,200 × 12 = 398,400KRW
```

**Applied Position (Total 3군데)**:
1. `totalPrice` useMemo - Total Price Calculate
2. `handleConfirm` - SelectedService.price Configuration
3. Select Service Summary Rendering - Individual Price Display

**Display format**:
- Weight-based: `Serviceperson x12KG` → `398,400 KRW`
- General service: `Serviceperson x2` → `160,000 KRW`

### Supported carriers and Service Code

| Carrier | ServiceCode | feature |
|--------|-------------|------|
| SQ | XBAG | 1kg Unit Weight input |
| EK | XBAG | 1kg Unit Weight input |

### Data flow

```
[ServiceListRS]
 │
 ▼
BookingInstructions.in Method %WVAL% Include?
 │
 ├── YES: requiresWeightInput = true
 │ └── UI: Weight input Field Display
 │ └── User 10kg Input
 │ └── [OfferPriceRQ] bookingInstructions.text = ["TTL10KG"]
 │
 └── NO: General service
 └── UI: when Click to Bar Select
 └── [OfferPriceRQ] bookingInstructions None
```
