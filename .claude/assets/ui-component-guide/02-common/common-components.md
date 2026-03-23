# Common Components

## 1. Date Picker (DatePicker)

### Usage
- Date input for departure date, date of birth, etc.

### Display Format
- DD/MM/YYYY (e.g., 17/02/2023)

---

## 2. Dropdown Select (Select)

### Usage
- Airline selection
- Cabin class selection
- Country selection

### Features
- Single or multi-select
- Text search support

---

## 3. Text Input (TextInput)

### Usage
- Passenger name input
- Email input
- Contact number input

---

## 4. Passenger Counter (Counter)

### Usage
- Passenger count selection

### Structure
- Adult, child, infant each with +/- buttons

---

## 5. Checkbox (Checkbox)

### Usage
- Filter selection
- Agreement item check
- Primary contact designation

---

## 6. Button (Button)

### Button Types

| Type | Usage | Example |
|------|-------|---------|
| Primary Button | Main action | Pay & Issue, Confirm |
| Secondary Button | Secondary action | Cancel, Close |
| Danger Button | Dangerous action | Cancel PNR, VOID |
| Text Button | Link style | PNR click, View details |

### Airline Button Support

| Button | Supported Airlines |
|--------|-------------------|
| Seat | AF, KL, SQ, QR, LH, LX, OS, EK, AA |
| Service | AF, KL, SQ, QR, LH, LX, OS, EK |
| Journey Change | AF, KL, SQ, QR |
| Passenger Split | SQ, QR |
| Info Change | AF, KL |

---

## 7. Tooltip (Tooltip)

### Usage
- Show detailed information on info icon (i) mouse hover
- Fare details, tax breakdown, etc.

---

## 8. Toast Message (Toast)

### Usage
- Success/failure message display
- Error notification

### Examples
- "Booking has been completed."
- "Please check your input information."

---

## 9. Popup (Modal)

### Types

| Type | Usage |
|------|-------|
| Input Popup | Payment info, passenger info input |
| Confirmation Popup | Cancel confirmation, proceed confirmation |
| Information Popup | Policy notice, tax details |

---

## 10. Toggle (Toggle)

### Usage
- Expand/collapse connecting flight details
- Default state: collapsed

---

## 11. Airline Logo

### Display Locations
- Search results flight card
- Payment info itinerary display

---

## 12. Amount Display

### Format
- Thousands separator with comma
- Currency unit displayed alongside
- Example: 1,234,500 KRW

### Colors
- Standard amount: default color
- Increased amount: red
- Discount/refund amount: minus (-) sign
