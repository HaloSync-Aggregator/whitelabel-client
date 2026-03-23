# SearchForm (MainPage) API-UI Mapping

> **API**: `POST /middleware/polarhub/air-shopping`
> **UI Guide**: `.claude/assets/ui-component-guide/03-booking/air-shopping.md` (Search Condition Input)

## Common reference

| Document | Path |
|------|------|
| Design system | `.claude/assets/ui-component-guide/02-common/design-system.md` |
| Common components | `.claude/assets/ui-component-guide/02-common/common-components.md` |
| Date Format | `.claude/assets/ui-component-guide/02-common/date-format.md` |

---

## Key/Main UI Component

- **SearchForm**: Main Search Form
- **AirportSelect**: Departure/Arrival Select
- **DatePicker**: Date Select
- **PassengerCounter**: Passenger Number of passengers Select
- **CabinClassSelect**: SeatClass Select
- **CarrierSelect**: Carrier Select (Multiple)

---

## Search Form Field Mapping

### Required Input Item

| UI Field | Request Path | Format | Example |
|---------|-------------|------|------|
| Departure | `originDest[].origin` | 3Seat AirportCode | ICN |
| Arrival | `originDest[].destination` | 3Seat AirportCode | SIN |
| Departure | `originDest[].departureDate` | YYYY-MM-DD | 2025-03-15 |
| Adult | `paxList[].ptc = "ADT"` | Number (1-9) | 2 |
| Child | `paxList[].ptc = "CHD"` | Number (0-9) | 1 |
| Infant | `paxList[].ptc = "INF"` | Number (0-Adult수) | 0 |
| SeatClass | `cabinType` | Code | Y, W, C, F |

### Select Input Item

| UI Field | Request Path | Format | Description |
|---------|-------------|------|------|
| 복귀 | `originDest[1].departureDate` | YYYY-MM-DD | Round-when trip |
| Non-stop only | `preference.nonStop` | boolean | true: Non-stop only |
| Carrier | `preference.carriers[]` | Code Array | ["KE", "OZ"] |
| Promotion Code | `promoCode` | string | Discount Code |

---

## Journey/Itinerary per Type Request Composition

### One-way (One-Way)

```typescript
{
 originDest: [{
 origin: "ICN",
 destination: "SIN",
 departureDate: "2025-03-15"
 }]
}
```

### Round-trip (Round-Trip)

```typescript
{
 originDest: [
 {
 origin: "ICN",
 destination: "SIN",
 departureDate: "2025-03-15"
 },
 {
 origin: "SIN",
 destination: "ICN",
 departureDate: "2025-03-20"
 }
 ]
}
```

### Multi-city (Multi-City)

```typescript
{
 originDest: [
 { origin: "ICN", destination: "SIN", departureDate: "2025-03-15" },
 { origin: "SIN", destination: "BKK", departureDate: "2025-03-18" },
 { origin: "BKK", destination: "ICN", departureDate: "2025-03-22" }
 ]
}
```

---

## Passenger type

| PTC | Koreanperson | 나 Condition | Limit |
|-----|--------|----------|------|
| ADT | Adult | only 12 Or more | Minimum 1person |
| CHD | Child | only 2 ~ 12 Under | Adult Accompanying Required |
| INF | Infant | only 2 Under | 1 Adult당 1person |

### Passenger Request Composition

```typescript
{
 paxList: [
 { paxId: "PAX1", ptc: "ADT" },
 { paxId: "PAX2", ptc: "ADT" },
 { paxId: "PAX3", ptc: "CHD" },
 { paxId: "PAX4", ptc: "INF" }
 ]
}
```

---

## SeatClass Mapping

| UI Display | Code | Description |
|---------|------|------|
| Economy class | Y | Economy |
| Premium/Business Economy class | W | Premium Economy |
| Business class | C | Business |
| First class | F | First |

---

## Validation

### per Field 검사

| Field | 검사 Rules | Error message |
|------|----------|------------|
| Departure | Required, 3Seat AirportCode | Departure Select |
| Arrival | Required, Departure and different | Arrival Select |
| Departure | Required, 오늘 after | Departure Select |
| 복귀 | Departure after (Round-trip time) | 복귀 Departure after여must |
| Adult | 1 Or more | 1 Adult Or more Required |
| Infant | Adult Or less | Infant Adult Exceed . |

### Validation Function

```typescript
function validateSearchForm(form: SearchForm): ValidationResult {
 const errors: string[] = [];

 // Departure/Arrival
 if (!form.origin) errors.push('Departure Select');
 if (!form.destination) errors.push('Arrival Select');
 if (form.origin === form.destination) {
 errors.push('Departure and Arrival Same');
 }

 // Date
 const today = new Date().toISOString().split('T')[0];
 if (form.departureDate < today) {
 errors.push('Departure 오늘 after여must ');
 }
 if (form.returnDate && form.returnDate < form.departureDate) {
 errors.push('복귀 Departure after여must ');
 }

 // Passenger
 if (form.adultCount < 1) errors.push('1 Adult Or more Required');
 if (form.infantCount > form.adultCount) {
 errors.push('Infant Adult Exceed .');
 }

 return { valid: errors.length === 0, errors };
}
```

---

## Airport Search (AutoComplete)

### Search source

| Field | Search Target |
|------|----------|
| Airport Code | ICN, SIN, NRT |
| Airport Name | 천국제Airport, Singapore Changi |
| City Name | 서울, Seoul, Singapore |

### Display format

```
ICN - 천국제Airport (서울)
SIN - Changi Airport (Singapore)
```

---

## 최근 Search Save

### Save Item

```typescript
interface RecentSearch {
 origin: string;
 destination: string;
 departureDate: string;
 returnDate?: string;
 passengers: { adults: number; children: number; infants: number };
 cabinClass: string;
 searchedAt: string;
}
```

### Save Position

- LocalStorage: `recentSearches`
- Maximum 보관 Count: 5items

---

## Request All/Total Structure

```typescript
interface AirShoppingRequest {
 transactionId: string;
 pointOfSale: {
 country: string;
 city: string;
 };
 originDest: Array<{
 origin: string;
 destination: string;
 departureDate: string;
 }>;
 paxList: Array<{
 paxId: string;
 ptc: "ADT" | "CHD" | "INF";
 }>;
 cabinType?: string;
 preference?: {
 nonStop?: boolean;
 carriers?: string[];
 };
 promoCode?: string;
}
```

---

## Subsequent Flow

```
SearchForm → AirShopping API → Search results (air-shopping.md Reference)
```

Search results from Screen `air-shopping.md` Mapping document Reference.
