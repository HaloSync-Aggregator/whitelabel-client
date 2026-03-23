# JourneyChange (OrderReshop) API-UI Mapping

> API: `POST /middleware/polarhub/order-reshop`
> Response: `OrderReshopRS`

---

## API Flow Overview

```
Step 1: Select PaxJourney cards (OrderViewRS DataLists.PaxJourneyList)
  |
Step 2-1: OrderReshop (Reshop) - Retrieve available flights
  |
Step 2-2: OrderReshop (Reprice) or OrderQuote - Get fare difference
  |
Step 3: OrderChange (with payment) - Apply journey change
```

---

## Response Structure (OrderReshopRS)

```
OrderReshopRS
  |- ResultMessage
  |- TransactionID
  |- ReshopOffers[]
  |   |- ResponseID
  |   |- OfferID
  |   |- Owner
  |   |- TotalPrice
  |   |   '- TotalAmount { Amount, CurCode }
  |   |- PriceDifference { Amount, CurCode }
  |   '- AddOfferItem[]
  |       |- OfferItemID
  |       |- PaxRefID[]
  |       '- PaxJourneyRefID[]   # v3.24: journey refs for flight extraction
  '- DataLists
      |- PaxSegmentList[]
      |   |- PaxSegmentID
      |   |- Departure { AirportCode, Date, Time }     # PolarHub format
      |   |- Arrival { AirportCode, Date, Time }
      |   |- MarketingCarrier { AirlineID, FlightNumber }
      |   '- FlightDuration
      '- PaxJourneyList[]
          |- PaxJourneyID
          |- OnPoint / OffPoint
          |- FlightTime
          '- PaxSegmentRefID[]
```

---

## 1. Step 1: Select Journey (PaxJourney-based, v3.24)

> Use DataLists.PaxJourneyList from OrderViewRS for journey cards

| UI Field | Source (OrderViewRS) | Notes |
|---------|------|------|
| paxJourneyId | `DataLists.PaxJourneyList[].PaxJourneyID` | Selection key |
| origin | `PaxJourneyList[].OnPoint` | Journey origin |
| destination | `PaxJourneyList[].OffPoint` | Journey destination |
| flightTime | `PaxJourneyList[].FlightTime` | Total time (ISO) |
| segments | `PaxSegmentRefID -> PaxSegmentList` | Segment details |
| serviceIds | `OrderItem.Service[].ServiceID` where `PaxSegmentRefID` matches | For RetainServiceID |

### Per Segment (within PaxJourney)

| UI Field | Source | Conversion |
|---------|------|------|
| carrierCode | `PaxSegmentList[].MarketingCarrier.AirlineID` | - |
| flightNumber | `PaxSegmentList[].MarketingCarrier.FlightNumber` | - |
| origin | `PaxSegmentList[].Departure.AirportCode` | - |
| destination | `PaxSegmentList[].Arrival.AirportCode` | - |
| departureTime | `PaxSegmentList[].Departure.Time` | HH:mm |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | HH:mm |
| departureDate | `PaxSegmentList[].Departure.Date` | - |

---

## 2. Step 2-1: OrderReshop (Reshop) - Available Flights

### Request (camelCase!)

```typescript
{
  transactionId: string,  // Reuse from OrderRetrieve!
  orderId: string,
  actionContext: "8",     // Voluntary
  updateOrder: {
    reshopOrder: {
      serviceOrder: {
        add: {
          originDestList: OriginDest[],  // v3.24: ALL selected journeys
          cabin: "Y"
        },
        delete: DeleteItem[]  // v3.24: with RetainServiceID
      }
    }
  }
}
```

### ReshopOffers Response Mapping

| UI Field | API Path | Notes |
|---------|------|------|
| offerId | `ReshopOffers[].OfferID` | Offer ID |
| responseId | `ReshopOffers[].ResponseID` | For subsequent API |
| carrierCode | `ReshopOffers[].Owner` | - |
| newFare | `TotalPrice.TotalAmount.Amount` | - |
| currency | `TotalPrice.TotalAmount.CurCode` | - |
| priceDifference | `PriceDifference.Amount` | Fare difference |

### Flight Extraction (v3.24: PaxJourney-based)

```
AddOfferItem[].PaxJourneyRefID
  -> DataLists.PaxJourneyList[].PaxSegmentRefID
    -> DataLists.PaxSegmentList[] (flight details)
```

| UI Field | API Path | Notes |
|---------|------|------|
| flightNumber | `PaxSegmentList[].MarketingCarrier.AirlineID + FlightNumber` | PolarHub |
| origin | `PaxSegmentList[].Departure.AirportCode` | Not IATALocationCode |
| destination | `PaxSegmentList[].Arrival.AirportCode` | Not IATALocationCode |
| departureTime | `PaxSegmentList[].Departure.Time` | HH:mm |
| arrivalTime | `PaxSegmentList[].Arrival.Time` | HH:mm |
| duration | `PaxSegmentList[].FlightDuration` | ISO -> Xh Xm |
| stops | `PaxJourneyList[].PaxSegmentRefID.length - 1` | Calculate |

---

## 3. RetainServiceID Logic (v3.24)

### Concept
- RetainServiceID specifies services to **keep** (not delete) during journey change
- Services on **NON-selected** journeys must be retained
- Services on **selected** journeys are dropped (because those journeys are being changed)

### Example: Round-trip booking ICN->CDG->ICN

**All journeys selected (change both):**
```json
{
  "orderItemRefId": "fc65de5b-...",
  "retainServiceId": []
}
```

**Only outbound selected (change ICN->CDG only):**
```json
{
  "orderItemRefId": "fc65de5b-...",
  "retainServiceId": ["SRV_PAX1_SEG2", "SRVID2_CO_PAX1_SEG2"]
}
```
(SEG2 services retained because CDG->ICN journey is NOT being changed)

---

## 4. Per carrier API Flow

| Carrier | Step 2-1 | Step 2-2 | Step 3 | Add/Delete |
|--------|----------|----------|--------|------------|
| QR | OrderReshop (Reshop) | OrderReshop (Reprice) | OrderChange(F) | No |
| TK | OrderReshop (Reshop) | OrderReshop (Reprice) | OrderChange(F) | **Yes** |
| AF, KL | OrderReshop (Reshop) | OrderReshop (Reprice) | OrderChange x2 | No |
| SQ, AY, KE | OrderReshop (Reshop) | OrderQuote | OrderChange(F) | No |
| HA | OrderReshop (Reshop) | OrderQuote | OrderChange(F) | **Yes** |

---

## 5. Change Modes (v3.24)

| Mode | Code | Supported Carriers | Description |
|------|------|-------------------|-------------|
| Journey Change | change | All | Change selected journeys to different flights |
| Journey Add | add | HA, TK only | Add new journey to booking |
| Journey Delete | delete | HA, TK only | Remove journey from booking |

---

## 6. Payment Method Mapping

| UI Field | Value | Supported carriers |
|---------|---|------------|
| Cash | CASH | All |
| Card | CC | All |
| Voucher | VOUCHER | AF, KL |

---

## 7. Error handling

| Error scenario | Process |
|----------|------|
| Journey not selectable | Show "Journey cannot be changed" message |
| No search results | Show "No available flights found" message |
| Fare inquiry failed | Provide retry button |
| Payment failed | Error message and retry |

---

## 8. Precautions

1. **Journey add/delete**: Only HA, TK support (`supportsAddDelete` config)
2. **PaxJourney-based selection**: Use PaxJourneyList, not segments directly
3. **RetainServiceID**: Services of NON-selected journeys must be retained
4. **OriginDestList**: Must include ALL selected journeys
5. **PolarHub field names**: AirportCode, MarketingCarrier.AirlineID (not NDC XML format)
6. **Pre-ticketing**: AF, KL support; QR does not
7. **One-way/Multi-city**: AF, KL do not support
