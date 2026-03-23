# FilterPanel UI Field definitions

> Source: `.claude/assets/ui-component-guide/03-booking/search-filter.md`

---

## 1. Non-stop/Stopover Filter (StopFilter)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| stopOptions | FilterOption[] | O | Checkbox List | - | Non-stop/Stopover Option |
| stopOptions[].value | string | O | Code | direct, 1stop, 2stop+ | FilterValue |
| stopOptions[].label | string | O | Text | Non-stop, Stopover | Displayperson |
| stopOptions[].count | number | X | Number | 15 | Corresponding Option Result |
| stopOptions[].selected | boolean | O | true/false | false | Select Status |

---

## 2. Carrier Filter (AirlineFilter)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| airlines | AirlineOption[] | O | Checkbox List | - | Carrier List |
| airlines[].code | string | O | 2Seat code | KE, OZ, SQ | Carrier code |
| airlines[].name | string | O | Text | Korean Air | Carrierperson |
| airlines[].logo | string | X | Image URL | /assets/airlines/KE.png | Logo |
| airlines[].minPrice | number | X | Number | 850000 | Lowest price |
| airlines[].count | number | X | Number | 12 | Result |
| airlines[].selected | boolean | O | true/false | false | Select Status |

---

## 3. Departure Time Filter (DepartureTimeFilter)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| departureTimeSlots | TimeSlot[] | O | Checkbox List | - | Time Option |
| departureTimeSlots[].value | string | O | Code | dawn, morning, afternoon, evening | FilterValue |
| departureTimeSlots[].label | string | O | Text | Dawn, 오before, Afternoon, Evening | Displayperson |
| departureTimeSlots[].range | string | O | Time Range | 00:00 ~ 05:59 | Time Range |
| departureTimeSlots[].count | number | X | Number | 8 | Result |
| departureTimeSlots[].selected | boolean | O | true/false | false | Select Status |

### Time Definition

| Time | value | Range |
|--------|-------|------|
| Dawn | dawn | 00:00 ~ 05:59 |
| 오before | morning | 06:00 ~ 11:59 |
| Afternoon | afternoon | 12:00 ~ 17:59 |
| Evening | evening | 18:00 ~ 23:59 |

---

## 4. Arrival Time Filter (ArrivalTimeFilter)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| arrivalTimeSlots | TimeSlot[] | O | Checkbox List | - | Time Option |
| arrivalTimeSlots[].value | string | O | Code | dawn, morning, afternoon, evening | FilterValue |
| arrivalTimeSlots[].label | string | O | Text | Dawn, 오before, Afternoon, Evening | Displayperson |
| arrivalTimeSlots[].range | string | O | Time Range | 00:00 ~ 05:59 | Time Range |
| arrivalTimeSlots[].count | number | X | Number | 5 | Result |
| arrivalTimeSlots[].selected | boolean | O | true/false | false | Select Status |

---

## 5. Baggage Filter (BaggageFilter)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| hasBaggage | boolean | O | Checkbox | false | Free abovedelegatedBaggage Include |
| baggageLabel | string | O | Text | Free abovedelegatedBaggage | label |
| baggageCount | number | X | Number | 25 | Baggage Include Result |

---

## 6. Filter Status (FilterState)

| Field name | Type | Required | Display format | Example | Notes |
|--------|------|:----:|----------|------|------|
| activeFilters | string[] | O | Array | ['direct', 'KE'] | activationpropertyconversion Filter |
| filteredCount | number | O | Number | 15 | filtering Result |
| totalCount | number | O | Number | 50 | All/Total Result |
| isFiltered | boolean | O | true/false | true | Filter Applied Whether |

---

## TypeScript Interface

```typescript
interface FilterOption {
 value: string;
 label: string;
 count?: number;
 selected: boolean;
}

interface AirlineOption extends FilterOption {
 code: string;
 name: string;
 logo?: string;
 minPrice?: number;
}

interface TimeSlot extends FilterOption {
 range: string;
}

interface FilterPanelData {
 // Non-stop/Stopover Filter
 stopOptions: FilterOption[];

 // Carrier Filter
 airlines: AirlineOption[];

 // Departure Time Filter
 departureTimeSlots: TimeSlot[];

 // Arrival Time Filter
 arrivalTimeSlots: TimeSlot[];

 // Baggage Filter
 hasBaggage: boolean;
 baggageLabel: string;
 baggageCount?: number;

 // Filter Status
 activeFilters: string[];
 filteredCount: number;
 totalCount: number;
 isFiltered: boolean;
}
```

---

## Filter Logic Note

```typescript
// Filter Combination Rules
// - Same Group in: OR Condition (Select during Item 하나라 also Corresponding)
// - Different Group 간: AND Condition (All Condition only족)

interface FilterCriteria {
 stops: string[]; // ['direct', '1stop']
 airlines: string[]; // ['KE', 'OZ']
 departureTime: string[]; // ['morning', 'afternoon']
 arrivalTime: string[]; // ['evening']
 hasBaggage: boolean;
}

function applyFilters(
 flights: FlightCardData[],
 criteria: FilterCriteria
): FlightCardData[] {
 return flights.filter(flight => {
 // Non-stop/Stopover Filter (OR)
 const matchStops = criteria.stops.length === 0 ||
 criteria.stops.includes(getStopCategory(flight.stops));

 // Carrier Filter (OR)
 const matchAirline = criteria.airlines.length === 0 ||
 criteria.airlines.includes(flight.airlineCode);

 // Departure Time Filter (OR)
 const matchDepartureTime = criteria.departureTime.length === 0 ||
 criteria.departureTime.includes(getTimeSlot(flight.departureTime));

 // Arrival Time Filter (OR)
 const matchArrivalTime = criteria.arrivalTime.length === 0 ||
 criteria.arrivalTime.includes(getTimeSlot(flight.arrivalTime));

 // Baggage Filter
 const matchBaggage = !criteria.hasBaggage ||
 flight.baggage !== 'notInclude';

 // AND Conditionto All Group 결합
 return matchStops && matchAirline && matchDepartureTime &&
 matchArrivalTime && matchBaggage;
 });
}

function getStopCategory(stops: number): string {
 if (stops === 0) return 'direct';
 if (stops === 1) return '1stop';
 return '2stop+';
}

function getTimeSlot(time: string): string {
 const hour = parseInt(time.split(':')[0], 10);
 if (hour < 6) return 'dawn';
 if (hour < 12) return 'morning';
 if (hour < 18) return 'afternoon';
 return 'evening';
}
```

---

## initial Status

```typescript
const initialFilterState: FilterPanelData = {
 stopOptions: [
 { value: 'direct', label: 'Non-stop', count: 0, selected: false },
 { value: 'stopover', label: 'Stopover', count: 0, selected: false }
 ],
 airlines: [], // API from Response Dynamic Creation
 departureTimeSlots: [
 { value: 'dawn', label: 'Dawn', range: '00:00 ~ 05:59', count: 0, selected: false },
 { value: 'morning', label: '오before', range: '06:00 ~ 11:59', count: 0, selected: false },
 { value: 'afternoon', label: 'Afternoon', range: '12:00 ~ 17:59', count: 0, selected: false },
 { value: 'evening', label: 'Evening', range: '18:00 ~ 23:59', count: 0, selected: false }
 ],
 arrivalTimeSlots: [
 { value: 'dawn', label: 'Dawn', range: '00:00 ~ 05:59', count: 0, selected: false },
 { value: 'morning', label: '오before', range: '06:00 ~ 11:59', count: 0, selected: false },
 { value: 'afternoon', label: 'Afternoon', range: '12:00 ~ 17:59', count: 0, selected: false },
 { value: 'evening', label: 'Evening', range: '18:00 ~ 23:59', count: 0, selected: false }
 ],
 hasBaggage: false,
 baggageLabel: 'Free abovedelegatedBaggage',
 baggageCount: 0,
 activeFilters: [],
 filteredCount: 0,
 totalCount: 0,
 isFiltered: false
};
```
