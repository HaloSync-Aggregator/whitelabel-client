# ServiceList UI Field definitions

> Source: `.claude/assets/ui-component-guide/07-popups/service-popup.md`

---

## 1. Service Select Screen (ServiceSelection)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| segmentInfo | SegmentInfo | O | Header | - | Service Applied Segment |
| passengerList | ServicePassenger[] | O | List | - | per Passenger Service Select |
| serviceCategories | ServiceCategory[] | O | Tab List | - | Service Category |
| selectedServices | SelectedService[] | O | List | - | Select Service Summary |
| totalPrice | number | O | Number | 160000 | Total Service Fee |
| currency | string | O | CurrencyCode | KRW | - |

---

## 2. Supported carriers

| Carrier | Baggage Purchase | Service purchase | Notes |
|--------|:----------:|:----------:|------|
| AF, KL | O | O | LUGGAGE 계열 |
| SQ | O | O | XBAG, PIEC, HEAV, BULK |
| QR | X | O | Baggage NDC Not possible |
| LH, LX, OS | O | O | MBAG, ABAG, FBAG |
| EK | O | O | PrePaid Bags (5kg Unit) |
| AY | O | O | PDBG, XHBG, 스포츠 equipment |
| TR | O | O | Check-in Baggage |
| TK | O | O | XBAG_PIECE, XBAG_WEIGHT |
| AA, HA | X | X | ServiceList unProvide |

---

## 3. Service Category (ServiceCategory)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| categoryCode | string | O | Code | baggage, cabin, others | - |
| categoryLabel | string | O | Koreanperson | abovedelegatedBaggage, in-flightBaggage, Other | - |
| services | ServiceItem[] | O | Service list | - | Corresponding Category Services |
| isActive | boolean | O | true/false | true | Current Select Tab |

### Category type

| Code | Displayperson | Include Service |
|------|--------|------------|
| baggage | abovedelegatedBaggage | ADDITIONAL BAGGAGE, Check-in Baggage, etc. |
| cabin | in-flightBaggage | Carry-on Baggage, etc. |
| others | Other Service | Lounge, Priority, etc. |

---

## 4. Service Item (ServiceItem)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| serviceId | string | O | ID | SVC001 | Service and유 ID |
| serviceCode | string | O | SSR Code | MBAG, ABAG, BG23 | - |
| serviceName | string | O | English | ADDITIONAL BAGGAGE | Serviceperson |
| serviceNameKr | string | X | Korean | Additional baggage | Korean Serviceperson |
| description | string | X | Text | 23kg abovedelegated Baggage 1items | Detail Description |
| weightOrCount | string | O | Text | 23KG, 1PC, 5kg | Weight/Count Information |
| price | number | O | Number | 80000 | Service Price |
| currency | string | O | CurrencyCode | KRW | - |
| eligibleSegments | string[] | O | Segment Array | ['ICN-SIN', 'SIN-ICN'] | Applied Available Segment |
| eligiblePax | string[] | O | PAX ID Array | ['PAX1', 'PAX2'] | Applied Available Passenger |
| isSelected | boolean | O | true/false | false | Select Whether |
| quantity | number | X | Number | 1 | Select quantity |
| maxQuantity | number | X | Number | 3 | Maximum Purchase quantity |
| requiresWeightInput | boolean | X | true/false | false | ⭐ Weight input Whether needed |
| bookingInstructions | object | X | - | - | ⭐ Weight-based for service |

---

## 4-1. Weight-based service (XBAG, etc.)

### per Determine Condition
`BookingInstructions.Method` `%WVAL%` Pattern when Include `requiresWeightInput = true`

### ⭐ Price Calculate (Important)

```typescript
// Weight-based service: Unit price × kg
// General service: Unit price × quantity
function calculateServicePrice(
 service: ServiceItem,
 quantity: number,
 weightValue?: number
): number {
 if (service.requiresWeightInput && weightValue) {
 return service.price * weightValue; // e.g.: 33,200 × 12 = 398,400
 }
 return service.price * quantity;
}
```

### Applied Position (Total 3군데)
1. `totalPrice` useMemo - Total Price Calculate
2. `handleConfirm` - SelectedService.price Configuration
3. Select Service Summary Rendering - Individual Price Display

### UI Display
| Distinction | quantity Display | Price Display |
|------|----------|----------|
| Weight-based | `x12KG` | 398,400 KRW (Unit price × kg) |
| General service | `x2` | 160,000 KRW (Unit price × quantity) |

---

## 5. per Passenger Service (ServicePassenger)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| paxId | string | O | PAX ID | PAX1 | - |
| passengerName | string | O | English property/given name | HONG/GILDONG | - |
| ptc | string | O | Passenger type | ADT | - |
| ptcLabel | string | O | Korean | Adult | - |
| selectedServices | SelectedServicePerPax[] | O | Select Service list | - | per Passenger Select |
| isActive | boolean | O | true/false | true | Current Select Target |

---

## 6. Select Service (SelectedService)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| serviceId | string | O | ID | SVC001 | - |
| paxId | string | O | PAX ID | PAX1 | - |
| passengerName | string | O | English property/given name | HONG/GILDONG | - |
| serviceName | string | O | English | ADDITIONAL BAGGAGE | - |
| segment | string | O | Segment | ICN-SIN | Applied Segment |
| weightOrCount | string | O | Text | 23KG | - |
| price | number | O | Number | 80000 | ⭐ Weight-based: Unit price × weightValue |
| currency | string | O | CurrencyCode | KRW | - |
| quantity | number | O | Number | 1 | quantity |
| weightValue | number | X | Number | 12 | ⭐ Weight-based service: Input kg |
| bookingInstructions | object | X | - | - | ⭐ OfferPrice for Request |

---

## 7. SSR Information Display (SsrDisplay)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| carrierCode | string | O | 2Seat code | LH | Carrier |
| passengerName | string | O | English property/given name (PTC) | MOON/CINDY (ADT) | - |
| ssrName | string | O | SSRperson + Information | Additional Baggage 23KG | - |
| segments | string | O | Flight Information | LH0001 ICN-FRA 01/FEB/2023 | - |
| status | string | O | StatusCode | HN, HD, HI, HK | - |
| statusLabel | string | O | Korean | Pending, Confirmed Available | - |
| showCheckbox | boolean | O | true/false | true | HD Status when |

---

## 8. Purchase Confirmed process (PurchaseConfirm)

### Target Carrier

| Carrier | PurchaseConfirmed Required | Status Flow |
|--------|:------------:|----------|
| LH, LX, OS, EK | O | HN → HD → HI |
| KE, HA | O | REQUESTED → CONFIRMED |
| Other | X | HK (to Bar Confirmed) |

### PurchaseConfirmed Button Exposed Condition

| Condition | Description |
|------|------|
| StatusValue | HD or CONFIRMED |
| Free Service Exclude | BaseAmount ≠ 0 |
| unPayment Status | Corresponding Service unPayment |
| unTicketing Status | Corresponding in Service Ticket unIssue |

---

## 9. Payment information Popup (PaymentPopup)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| serviceSummary | SelectedService[] | O | List | - | Select Service list |
| subtotal | number | O | Number | 160000 | Service Amount Subtotal |
| taxes | number | X | Number | 16000 | Tax |
| totalAmount | number | O | Number | 176000 | Total payment |
| currency | string | O | CurrencyCode | KRW | - |
| paymentMethods | PaymentMethod[] | O | radio Button | - | Payment method List |

---

## 10. Per carrier Baggage Detail

### LHG (LH, LX, OS)

| Item | Value |
|------|---|
| Serviceperson | ADDITIONAL BAGGAGE |
| SSR Code | MBAG, ABAG, FBAG |
| Status Flow | HN → HD → HI |
| Purchase Unit | per Segment or All/Total Journey/Itinerary |

### EK (에un레이트)

| Item | Value |
|------|---|
| Serviceperson | PrePaid Bags |
| SSR Code | ASVC |
| Status Flow | HN → HD → HI |
| Purchase Unit | 5kg Unit (5kg ~ 50kg) |

### SQ (Singapore Airlines)

| Item | Value |
|------|---|
| Service Type | XBAG (Weight), BULK (size), PIEC (Count), HEAV (WeightExceed) |
| StatusValue | HK (to Bar Confirmed) |
| Special notes | XBAG after Add Same Segment Re-Purchase Not possible |

### AF/KL

| Item | Value |
|------|---|
| Serviceperson | LUGGAGE |
| SSR Code | ABAG (1st), BBAG (2nd), CBAG (3rd+) |
| bundles Purchase | A+B, A+B+C Concurrent Purchase Available |

### AY (핀에)

| Item | Value |
|------|---|
| Service Type | PDBG (General), XHBG (32kg), XBGG (Exceed) |
| 스포츠 equipment | SKIS, SURF, GOLF, BIKE, etc. |

### TR (Scoot)

| Item | Value |
|------|---|
| Serviceperson | Check-in Baggage |
| SSR Code | BG20, BG25, BG30, BG35, BG40 |
| Purchase Unit | 20kg, 25kg, 30kg, 35kg, 40kg |
| Special notes | 리un엄 이코노un when Booking Required |

---

## TypeScript Interface

```typescript
interface ServiceSelectionData {
 segmentInfo: SegmentInfo;
 passengerList: ServicePassenger[];
 serviceCategories: ServiceCategory[];
 selectedServices: SelectedService[];
 totalPrice: number;
 currency: string;
 showPurchaseConfirmButton: boolean;
}

interface SegmentInfo {
 segmentNo: number;
 carrierCode: string;
 flightNumber: string;
 departureAirport: string;
 arrivalAirport: string;
 departureDate: string;
}

interface ServiceCategory {
 categoryCode: 'baggage' | 'cabin' | 'others';
 categoryLabel: string;
 services: ServiceItem[];
 isActive: boolean;
}

interface ServiceItem {
 serviceId: string;
 serviceCode: string;
 serviceName: string;
 serviceNameKr?: string;
 description?: string;
 weightOrCount: string;
 price: number;
 currency: string;
 eligibleSegments: string[];
 eligiblePax: string[];
 isSelected: boolean;
 quantity?: number;
 maxQuantity?: number;
 // ⭐ Weight-based service (XBAG, etc.)
 requiresWeightInput?: boolean;
 bookingInstructions?: {
 method?: string; // "TTL\\s?%WVAL%KG"
 };
}

interface ServicePassenger {
 paxId: string;
 passengerName: string;
 ptc: string;
 ptcLabel: string;
 selectedServices: SelectedServicePerPax[];
 isActive: boolean;
}

interface SelectedServicePerPax {
 serviceId: string;
 segment: string;
 quantity: number;
}

interface SelectedService {
 serviceId: string;
 paxId: string;
 passengerName: string;
 serviceName: string;
 segment: string;
 weightOrCount: string;
 price: number; // ⭐ Weight-based: Unit price × weightValue
 currency: string;
 quantity: number;
 // ⭐ Weight-based service
 weightValue?: number; // Input Weight (kg)
 bookingInstructions?: {
 text: string[]; // ["TTL10KG"]
 ositext?: string[]; // Method Original
 };
}

interface SsrDisplay {
 carrierCode: string;
 passengerName: string;
 ssrName: string;
 segments: string;
 status: string;
 statusLabel: string;
 showCheckbox: boolean;
}

interface PaymentPopup {
 serviceSummary: SelectedService[];
 subtotal: number;
 taxes?: number;
 totalAmount: number;
 currency: string;
 paymentMethods: PaymentMethod[];
}

interface PaymentMethod {
 code: string;
 label: string;
 isDefault: boolean;
}
```

---

## Service purchase Not possible Carrier Process

```typescript
// Service purchase unSupported carriers
const unsupportedCarriers = ['AA', 'HA'];

function showServiceButton(carrierCode: string): boolean {
 return !unsupportedCarriers.includes(carrierCode);
}

// Baggage Purchase unSupported carriers
const baggageUnsupportedCarriers = ['AA', 'HA', 'QR'];

function showBaggageCategory(carrierCode: string): boolean {
 return !baggageUnsupportedCarriers.includes(carrierCode);
}

// SSR Status Label
const ssrStatusLabels: Record<string, string> = {
 'HN': 'Carrier Response Pending',
 'HD': 'PurchaseConfirmed Available',
 'HI': 'EMD Issue Complete',
 'HK': 'Confirmed',
 'REQUESTED': 'Carrier Response Pending',
 'CONFIRMED': 'Confirmed'
};
```
