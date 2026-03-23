# Journey/Itinerary Retrieval

## Overview
Air ticket Searchand Result Confirm Page.

---

## 1. Search Condition Input

### Required Input Item

| Item | Input Format | Description |
|------|----------|------|
| Departure | Airport/City Search | 3Seat AirportCode (e.g.: ICN) |
| Arrival | Airport/City Search | 3Seat AirportCode (e.g.: SIN) |
| Departure | Date Select | YYYY-MM-DD |
| Passenger | Number of passengers Select | Adult/Child/Infant Each Select |
| SeatClass | Select | Economy class/Premium/Business Economy class/비즈니스/First class |
| Carrier | Multiple Select | Desired Carrier Select (All/Total Available) |

### Select Input Item

| Item | Description |
|------|------|
| Non-stop only | when Check Non-stop편 only Search |
| Promotion Code | Carrier Discount Code Input |
| Mileage Number | Accumulate Mileage Log Information |

### Passenger type

| Type | Description |
|------|------|
| Adult (ADT) | only 12 Or more |
| Child (CHD) | only 2 ~ only 12 Under |
| Infant (INF) | only 2 Under |

---

## 2. Search results Display

### Result Header

| Item | Display format | Example |
|------|----------|------|
| Segment | Departure → Arrival | ICN → SIN |
| Date | DD/MMM/YYYY | 21/FEB/2024 |

### Multi-city Journey/Itinerary
```
Segment1: ICN → SIN 30/MAR/2024
Segment2: SIN → ICN 03/APR/2024
```

---

## 3. Flight Card

### Default Information

| Item | Display format | Example |
|------|----------|------|
| Carrier | Logo + Carrierperson | Korean Air |
| Flight number | CarrierCode + 4Seat | KE0645 |
| Departure | AirportCode + Time | ICN 10:30 |
| Arrival | AirportCode + Time | SIN 16:00 |
| terminal | T + Number | T2 |
| FlightTime | Time minutes | 6Time 30 min |
| Stopover | Non-stop/Stopovercount | Non-stop, Stopover1 time(s) |

### Fare information

| Item | Display format | Example |
|------|----------|------|
| SeatClass | Koreanperson | Economy class |
| Faretype | Englishperson | Economy Flex |
| Baggage | Count or Weight | 23KG, 2PC, notInclude |
| 기종 | Aviation기 Code | A380, B777 |

### Fee Information

| Item | Display format | Example |
|------|----------|------|
| Total Fee | Amount + Currency | 1,234,500 KRW |
| FeeDetail | Information icon Click | per Passenger Fare+Tax |
| rules | icon Click | Change/Refund rules |

### Fee Detail tooltip
```
Adult General 850,000KRW X 2
 Fare 800,000KRW
 Tax 50,000KRW
```

---

## 4. Add Display Information

### Code쉐 (공동Operation)
- Determine매 Carrier and Actual Operation Carrier Different Case
- "공동Operation OZ" to format Display

### 숨 Stopover
- Same Flight number이 only 간 기착 Case
- Stopover AirportCode Display

---

## 5. Stopover편 Detail (toggle)

Stopover편 when Select 펼쳐 per Segment Detail Information Confirm Available

| Item | Description |
|------|------|
| per Segment Flight | each Segment's Flight Information |
| Stopover Time | in 환승 Duration Pending Time |
| Stopover Airport | 환승 Airport Information |

---

## 6. Fare Select (Upsell)

Same Journey/in Itinerary multiple Fare type exists Case Selectable

| Fare type | feature |
|----------|------|
| Economy Light | 저렴, Baggage Separate |
| Economy Standard | Default Baggage Include |
| Economy Flex | Change/Refund 유연 |

### per Fare Display Information
- Fare typeperson
- Baggage Include Whether
- Change/Refund Condition
- Total Fee

---

## 7. MatchResult (Fare Combination Method)

Per to carrier Fare Provide Method 다르, MatchResult ValueDepending on Fare Combination Available Whether Determine.

### MatchResult Type

| Type | Description | Fare Combination |
|------|------|----------|
| **Partial** | Branded Fare Shopping | per Segment Fare Individual after Select Combination Available |
| **Full** | Itinerary Fare Shopping | All/Total Journey/in Itinerary About Integration Fare Provide |

### Per carrier MatchResult

| Carrier | One-way | Round-trip | Multi-city | Combinability |
|--------|------|------|--------|---------------|
| LH (Lufthansa) | Partial | Partial | Partial/Full | O (PriceClass) |
| AA (아메리칸Aviation) | Full | Full | Full | O (PriceClass) |
| EK (에un레이트) | Partial | Partial | Partial/Full | O (FareBasisCode) |
| HA (Hawaiian Airlines) | Partial | Partial | Partial/Full | O (PriceClass) |
| KE (Korean Air) | Partial | Partial | Partial/Full | O (PriceClass) |
| SQ (Singapore Airlines) | Full | Full | Full | X |
| QR (Qatar Airways) | Full | Full | Full | X |
| AF/KL (Air France/KLM) | Full | Full | Full | X |
| BA (국Aviation) | Full | Full | Full | X |

### UI Process Guide

#### Partial (per Segment Fare Select)
- each to per Segment independent-like Fare Select UI Provide
- Select Fares Combination Available한 Combinability Information Confirm Required
- Combination Not possible Fare when Select Warning Message Display

#### Full (Integration Fare)
- All/Total Journey/in Itinerary About Fare in 번 Display
- per Segment Individual Select Not possible, All/Total Fareto only Select

### Combinability (Fare Combination Rules)

Partial Fare's Case AirShoppingRS's `AugmentationPoint`from Combination Available Fare information Provide

```
Combination Available Whether Confirm:
- PriceClass based: Same within PriceClass Fare끼리 Combination Available
- FareBasisCode based: specialspecific FareBasisCode Combination only for allow
```

---

## 8. Per carrier Baggage Purchase Method

Carrier마다 Baggage Add Purchase Support Whether and Purchase Unit differs.

### Baggage Purchase Support 현황

| Carrier | Baggage Purchase | Purchase Unit | Purchase point in time | Notes |
|--------|:----------:|----------|----------|------|
| LH/LX/OS | O | Segment별/All/TotalJourney/Itinerary | After ticketing | ADDITIONAL BAGGAGE |
| EK | O | 5kg Unit (5~50kg) | After ticketing | PrePaid Bags |
| AA | X | - | - | ServiceList unProvide |
| HA (17.2) | X | - | - | ServiceList unProvide |
| HA (21.3) | X | - | - | Paid Baggage unProvide |
| SQ | O | 1kg/Count/size Unit | After ticketing | XBAG, BULK, PIEC, HEAV |
| QR | X | - | - | NDC Purchase Not possible |
| AF/KL | O | Count Unit | After ticketing | LUGGAGE-FIRST/SECOND/THIRD |
| AY | O | Count Unit | After ticketing | PRE PAID BAGGAGE |
| TR | O | 5kg Unit (20~40kg) | when Booking | Check-in Baggage |
| TK | O | Count/Weight Unit | After ticketing | XBAG_PIECE, XBAG_WEIGHT |

### Per carrier Baggage Purchase Detail

#### LHG (LH, LX, OS)
- **Serviceperson**: ADDITIONAL BAGGAGE
- **SSR Code**: `MBAG`, `ABAG`, `FBAG`
- **StatusValue**: HN → HD → HI (Purchase Confirmed Required)
- **Purchase Unit**: per Segment or All/Total Journey/Itinerary

#### EK (에un레이트)
- **Serviceperson**: PrePaid Bags
- **SSR Code**: `ASVC`
- **StatusValue**: HN → HD → HI
- **Purchase Unit**: 5kg Unit (5kg ~ 50kg)

#### SQ (Singapore Airlines)
- **Service Type**:
 - `XBAG`: Weight Unit (1kg Unit)
 - `BULK`: size Exceed
 - `PIEC`: Count Exceed
 - `HEAV`: Weight Exceed
- **StatusValue**: HK
- **Special notes**:
 - XBAG Add after Purchase Same Segment Re-Purchase Not possible
 - PIEC, HEAV, BULK Combination Purchase Available하나 2items Or more 트 Not possible

#### AF/KL (Air France/KLM)
- **Serviceperson**: LUGGAGE
- **SSR Code**:
 - `ABAG`: LUGGAGE-FIRST ADDITIONAL BAG
 - `BBAG`: LUGGAGE-SECOND ADDITIONAL BAG
 - `CBAG`: LUGGAGE-THIRD OR MORE ADDITIONAL BAG
- **bundles Purchase**: 2items(A+B), 3items Or more(A+B+C) Concurrent Purchase Available

#### TR (Scoot)
- **Serviceperson**: Check-in Baggage
- **SSR Code**: `BG20`, `BG25`, `BG30`, `BG35`, `BG40`
- **Purchase Unit**: 20kg, 25kg, 30kg, 35kg, 40kg
- **Special notes**: 리un엄 이코노un's Case when Booking Baggage Add Required

#### AY (핀에)
- **Service Type**:
 - `PDBG`: PRE PAID BAGGAGE
 - `XHBG`: CHECKED BAGGAGE UP TO 32KG
 - `XBGG`: EXCESS PIECE SPECIAL CHARGE
 - 스포츠 equipment: `SKIS`, `SURF`, `GOLF`, `BIKE` etc.

### UI Process Guide

#### Baggage Purchase Not possible Carrier
- AA, HA, QR, etc. ServiceList unProvide Carrier Baggage Add Purchase Button 비activationpropertyconversion
- " Carrier Additional baggage Purchase Supportnot ." Guide Display

#### Purchase Confirmed Required Carrier (LHG, EK)
- StatusValue `HD` (Purchase Confirmed Available) In the case of only Purchase Confirmed Button Exposed
- Free Service(BaseAmount = 0) Purchase Confirmed not required

#### Purchase per Unit UI
- **Weight Unit**: Slider or dropdownto kg Select
- **Count Unit**: +/- Buttonto Count 조절
- **bundles Unit**: to Checkbox Multiple Select

---

## 9. Next Step

Flight after Select "Next" Button click time:
1. Fare recalculation Progress
2. Amount when variation Difference Guide Popup Display
3. Enter payment information Popupto Navigate
