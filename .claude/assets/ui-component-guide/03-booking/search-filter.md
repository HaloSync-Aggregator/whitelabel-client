# Search Result Filters

## Overview
Filter flight search results by various criteria to easily find desired flights.

---

## Filter Categories

### 1. Direct/Connecting

| Option | Description |
|--------|-------------|
| Direct | Non-stop flights without layovers |
| Connecting | Flights with intermediate stops |

---

### 2. Airline

- Display list of airlines included in search results
- Filter by selecting desired airlines only
- Multiple airline selection supported

---

### 3. Departure Time

| Time Period | Range |
|-------------|-------|
| Early morning | 00:00 ~ 05:59 |
| Morning | 06:00 ~ 11:59 |
| Afternoon | 12:00 ~ 17:59 |
| Evening | 18:00 ~ 23:59 |

- Based on departure time of the first segment of the journey
- Multiple time period selection supported

---

### 4. Arrival Time

| Time Period | Range |
|-------------|-------|
| Early morning | 00:00 ~ 05:59 |
| Morning | 06:00 ~ 11:59 |
| Afternoon | 12:00 ~ 17:59 |
| Evening | 18:00 ~ 23:59 |

- Based on arrival time of the last segment of the journey
- Multiple time period selection supported

---

### 5. Free Checked Baggage

| Option | Description |
|--------|-------------|
| Checked | Show only fares with baggage included |
| Unchecked | Show all fares |

---

## Filter Usage Guide

### Filter Combinations
- Multiple selections within the same group: Show if any selected item matches (OR)
- Selections across different groups: Must satisfy all conditions (AND)

### Example
```
[Direct] + [Korean Air, Asiana] + [Morning, Afternoon]
→ Direct flights operated by Korean Air or Asiana departing in the morning or afternoon
```

### No Results
- If no flights match the selected filter criteria, display "No search results found"
- Reset filters button available to view all results again
