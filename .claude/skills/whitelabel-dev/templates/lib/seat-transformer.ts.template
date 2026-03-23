/**
 * SeatAvailability Response transformer
 *
 * ============================================================
 * Data flow
 * ============================================================
 *
 * SeatAvailabilityRS
 * ├── ALaCarteOffer
 * │   ├── OfferID, Owner, ResponseID
 * │   ├── ALaCarteOfferItem[] → Seat price Information
 * │   └── SeatMap[] → Seat map
 * │       └── Cabins[] → per cabin seats
 * │           ├── Columns[] → Column information
 * │           └── RowInfo[] → per row Seat
 * └── DataLists
 *     └── PaxSegmentList → Segment information
 *
 * ============================================================
 */

import {
  SeatAvailabilityData,
  SegmentSeatMap,
  CabinInfo,
  SeatRow,
  Seat,
  SeatColumn,
  SeatLegend,
  SeatAvailability,
  SeatType,
  DEFAULT_SEAT_LEGEND,
} from '@/types/seat';

// ============================================================
// API Response Types
// ============================================================

interface SeatAvailabilityResponse {
  ResultMessage?: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  ResponseID: string;
  ALaCarteOffer: {
    OfferID: string;
    Owner: string;
    ValidatingCarrier?: string;
    // API from response case may vary (ALaCarteOfferItem or AlaCarteOfferItem)
    ALaCarteOfferItem?: Array<any>;
    AlaCarteOfferItem?: Array<any>;
    SeatMap?: Array<{
      PaxSegmentRefID: string;
      Cabins?: Array<{
        CabinType?: {
          Code: string;
          Definition?: string;
        };
        Columns?: Array<{
          Designation: string;
          Position?: string; // L, C, R
        }>;
        RowInfo?: Array<{
          Number: number | string;
          Seats?: Array<{
            Column: string;
            SeatStatus?: string;
            SeatCharacteristics?: string[];
            OfferItemRefID?: string;
          }>;
        }>;
      }>;
    }>;
  };
  DataLists?: {
    PaxSegmentList?: Array<{
      PaxSegmentID: string;
      Departure: {
        AirportCode: string;
        Date: string;
        Time: string;
      };
      Arrival: {
        AirportCode: string;
        Date: string;
        Time: string;
      };
      MarketingCarrier: {
        AirlineID: string;
        FlightNumber: string;
      };
    }>;
  };
}

// ============================================================
// Main Transform Function
// ============================================================

export function transformSeatAvailabilityResponse(
  response: SeatAvailabilityResponse
): SeatAvailabilityData {
  const offer = response.ALaCarteOffer;

  // defensive check: offer if not present Error
  if (!offer) {
    throw new Error('ALaCarteOffer not found in response');
  }

  const dataLists = response.DataLists;
  const segmentList = dataLists?.PaxSegmentList || [];

  // Create OfferItem → Price map
  // API from response AlaCarteOfferItem or ALaCarteOfferItem Both Process
  const offerItems = offer.ALaCarteOfferItem || offer.AlaCarteOfferItem || [];
  const priceMap = new Map<string, { price: number; currency: string }>();

  console.log('[SeatTransformer] OfferItems count:', offerItems.length);
  if (offerItems.length > 0) {
    console.log('[SeatTransformer] First OfferItem sample:', JSON.stringify(offerItems[0]).substring(0, 500));
  }

  offerItems.forEach((item: any) => {
    // OfferItemID or OfferItemId Process
    const offerItemId = item.OfferItemID || item.OfferItemId;

    // UnitPrice or UnitPriceDetail Structure Process
    const price = item.UnitPriceDetail?.TotalAmount?.Amount
      || item.UnitPrice?.TotalAmount?.Amount
      || item.UnitPrice?.Amount
      || item.Price?.Amount
      || 0;
    const currency = item.UnitPriceDetail?.TotalAmount?.CurCode
      || item.UnitPrice?.TotalAmount?.CurCode
      || item.UnitPrice?.CurCode
      || item.Price?.CurCode
      || 'KRW';

    if (offerItemId) {
      priceMap.set(offerItemId, { price, currency });
    }
  });

  console.log('[SeatTransformer] PriceMap size:', priceMap.size);

  // SeatMap → SegmentSeatMap Conversion
  console.log('[SeatTransformer] SeatMap count:', (offer.SeatMap || []).length);

  const segments: SegmentSeatMap[] = (offer.SeatMap || []).map((seatMap, idx) => {
    const segmentId = seatMap.PaxSegmentRefID;
    const segment = segmentList.find((s) => s.PaxSegmentID === segmentId);

    console.log(`[SeatTransformer] Segment ${idx}: Cabins count:`, (seatMap.Cabins || []).length);
    if (seatMap.Cabins?.[0]) {
      console.log(`[SeatTransformer] First Cabin keys:`, Object.keys(seatMap.Cabins[0]));
      console.log(`[SeatTransformer] Columns count:`, (seatMap.Cabins[0].Columns || []).length);
      console.log(`[SeatTransformer] RowInfo count:`, (seatMap.Cabins[0].RowInfo || []).length);
      if (seatMap.Cabins[0].Columns?.[0]) {
        console.log(`[SeatTransformer] First Column:`, JSON.stringify(seatMap.Cabins[0].Columns[0]));
      }
      if (seatMap.Cabins[0].RowInfo?.[0]) {
        console.log(`[SeatTransformer] First Row keys:`, Object.keys(seatMap.Cabins[0].RowInfo[0]));
      }
    }

    // cabin transformation
    const cabins: CabinInfo[] = (seatMap.Cabins || []).map((cabin) => {
      // Column information - from API Provide하거나, Seat from Data Extract
      let columns: SeatColumn[] = [];

      if (cabin.Columns && cabin.Columns.length > 0) {
        // from API Columns Provide Case
        columns = cabin.Columns.map((col: any) => ({
          designation: col.Designation,
          position: (col.Position as 'L' | 'C' | 'R') || 'C',
        }));
      } else {
        // Columns if absent Seat from Data Extract
        const columnSet = new Set<string>();
        (cabin.RowInfo || []).forEach((row: any) => {
          (row.Seats || []).forEach((seat: any) => {
            if (seat.Column) columnSet.add(seat.Column);
          });
        });

        // sort alphabetically then infer position
        const sortedColumns = Array.from(columnSet).sort();
        columns = sortedColumns.map((col, colIdx) => ({
          designation: col,
          position: inferColumnPosition(col, sortedColumns.length, colIdx),
        }));

        console.log('[SeatTransformer] Generated columns from seats:', sortedColumns);
      }

      // row Information
      const rows: SeatRow[] = (cabin.RowInfo || []).map((row) => {
        const rowNumber = typeof row.Number === 'string' ? parseInt(row.Number) : row.Number;

        const seats: Seat[] = (row.Seats || []).map((seat) => {
          // SeatCharacteristics Object Array Case Code Extract
          const characteristics = extractCharacteristics(seat.SeatCharacteristics);

          // Seat status Determine (SeatStatus + SeatCharacteristics All Confirm)
          let availability = mapSeatStatus(seat.SeatStatus);

          // in SeatCharacteristics R, 1, Z if exists to restricted Process
          if (availability === 'available' && characteristics.some(c => ['R', '1', 'Z'].includes(c.toUpperCase()))) {
            availability = 'restricted';
          }

          const seatType = classifySeatType(characteristics);

          // OfferItemRefID may be an array
          const offerItemRefId = Array.isArray(seat.OfferItemRefID)
            ? seat.OfferItemRefID[0]
            : seat.OfferItemRefID;
          const priceInfo = offerItemRefId ? priceMap.get(offerItemRefId) : null;

          return {
            column: seat.Column,
            seatNumber: `${rowNumber}${seat.Column}`,
            availability,
            availabilityLabel: getAvailabilityLabel(availability),
            seatType,
            seatTypeLabel: getSeatTypeLabel(seatType),
            characteristics,
            price: priceInfo?.price || 0,
            currency: priceInfo?.currency || 'KRW',
            isSelected: false,
            offerItemRefId,
          };
        });

        return { rowNumber, seats };
      });

      return {
        cabinType: cabin.CabinType?.Code || 'Y',
        cabinTypeLabel: getCabinLabel(cabin.CabinType?.Code),
        columns,
        rows,
      };
    });

    return {
      segmentId,
      segmentNo: idx + 1,
      carrierCode: segment?.MarketingCarrier.AirlineID || offer.Owner,
      flightNumber: segment
        ? `${segment.MarketingCarrier.AirlineID}${segment.MarketingCarrier.FlightNumber}`
        : '',
      departureAirport: segment?.Departure.AirportCode || '',
      arrivalAirport: segment?.Arrival.AirportCode || '',
      departureDate: segment?.Departure.Date || '',
      cabins,
    };
  });

  // legend Create (only seat types that actually exist)
  const legend = generateLegend(segments);

  // ⚠️ ResponseID absent Case OfferID fallbackto Use
  // (when OrderCreate Seat order entry's to responseId Required)
  const responseId = response.ResponseID || offer.OfferID;

  return {
    transactionId: response.TransactionID,
    responseId,
    owner: offer.Owner,
    offerId: offer.OfferID,
    segments,
    legend,
    _apiData: {
      transactionId: response.TransactionID,
      responseId, // fallback Applied
      offerId: offer.OfferID,
      owner: offer.Owner,
      offerItems: (offer.ALaCarteOfferItem || []).map((item) => ({
        offerItemId: item.OfferItemID,
        price: item.UnitPrice?.TotalAmount.Amount || 0,
        currency: item.UnitPrice?.TotalAmount.CurCode || 'KRW',
        eligibility: item.Eligibility
          ? {
              paxRefId: item.Eligibility.PaxRefID,
              segmentRefId: item.Eligibility.SegmentRefID,
            }
          : undefined,
      })),
    },
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * column position inference (Left side L, Center C, Right side R)
 * Based on typical aircraft seat layout
 */
function inferColumnPosition(col: string, totalColumns: number, idx: number): 'L' | 'C' | 'R' {
  // 3열 (A, B, C) - small aircraft
  if (totalColumns <= 3) {
    if (idx === 0) return 'L';
    if (idx === totalColumns - 1) return 'R';
    return 'C';
  }

  // 6열 (A, B, C, D, E, F) - narrow-body
  if (totalColumns === 6) {
    if (idx < 3) return idx < 2 ? 'L' : 'C'; // A, B = L, C = aisle
    return idx > 3 ? 'R' : 'C'; // D = aisle, E, F = R
  }

  // 9열 (A, B, C, D, E, F, G, H, J) - wide-body
  if (totalColumns >= 9) {
    if (idx < 3) return 'L';
    if (idx >= totalColumns - 3) return 'R';
    return 'C';
  }

  // Default: infer by ratio
  const ratio = idx / (totalColumns - 1);
  if (ratio < 0.33) return 'L';
  if (ratio > 0.66) return 'R';
  return 'C';
}

/**
 * from SeatCharacteristics Code Extract
 * API response can be [{Code: "1"}, {Code: "B"}] or ["1", "B"] format
 */
function extractCharacteristics(chars: unknown): string[] {
  if (!chars || !Array.isArray(chars)) return [];

  return chars.map((c) => {
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object' && 'Code' in c) return String((c as { Code: unknown }).Code);
    return '';
  }).filter(Boolean);
}

/**
 * Seat status Mapping
 *
 * PolarHub API Criteria:
 * - Occupied (occupied): SeatStatus = T, O
 * - Restricted (restricted): SeatStatus = R, 1, Z
 * - Available: all others
 */
function mapSeatStatus(status?: string | unknown): SeatAvailability {
  if (!status || typeof status !== 'string') return 'available';

  const upperStatus = status.toUpperCase();

  // Occupied (occupied) - T, O
  if (['T', 'O', 'OCCUPIED'].includes(upperStatus)) {
    return 'occupied';
  }

  // Restricted (restricted) - R, 1, Z
  if (['R', '1', 'Z', 'RESTRICTED'].includes(upperStatus)) {
    return 'restricted';
  }

  // No Seat (Seat None)
  if (['N', 'N/A', 'NOSEAT'].includes(upperStatus)) {
    return 'noSeat';
  }

  // Available (Available) - A, F, VACANT, AVAILABLE etc.
  return 'available';
}

/**
 * Seat type Classify
 *
 * IATA Seat characteristic codes:
 * - 1, Z, R = Restricted (restricted Seat)
 * - E = Exit row (exit row)
 * - L, LS = Leg space (legroom)
 * - K = Bulkhead (bulkhead)
 * - A = Aisle (aisle)
 * - W = Window (window)
 * - CH = Chargeable (chargeable)
 * - P = Preferred (preferred)
 */
function classifySeatType(characteristics: string[]): SeatType {
  const chars = (characteristics || []).map((c) => c.toUpperCase());

  // Exit Row (exit row Seat)
  if (chars.some((c) => c === 'E' || c.includes('EXIT'))) {
    return 'exitRow';
  }

  // Extra Legroom (legroom Seat)
  if (chars.some((c) => c === 'L' || c === 'LS' || c === 'K' || c.includes('LEG'))) {
    return 'extraLegroom';
  }

  // Preferred (preferred Seat) - chargeableSeat(CH) or P Code
  if (chars.some((c) => c === 'P' || c.includes('PREFERRED'))) {
    return 'preferred';
  }

  return 'standard';
}

/**
 * Seat status Korean Label
 */
function getAvailabilityLabel(availability: SeatAvailability): string {
  const labels: Record<SeatAvailability, string> = {
    available: 'Selectable',
    occupied: 'Occupied',
    restricted: 'Restricted',
    noSeat: 'Seat None',
    selected: 'Select',
  };
  return labels[availability];
}

/**
 * Seat type Korean Label
 */
function getSeatTypeLabel(seatType: SeatType): string {
  const labels: Record<SeatType, string> = {
    standard: 'Standard Seat',
    preferred: 'Preferred Seat',
    extraLegroom: 'Extra Legroom Seat',
    exitRow: 'Exit Row Seat',
  };
  return labels[seatType];
}

/**
 * Cabin class Korean label
 */
function getCabinLabel(code?: string): string {
  const cabinMap: Record<string, string> = {
    Y: 'Economy class',
    W: 'Premium economy',
    M: 'Economy class',
    C: 'Business class',
    J: 'Business class',
    F: 'First',
    // Number Code Process
    '1': 'First',
    '2': 'Business class',
    '3': 'Premium economy',
    '4': 'Economy class',
    '5': 'Economy class',
  };
  return code ? cabinMap[code] || 'Economy class' : 'Economy class';
}

/**
 * legend Create (only seat types that actually exist)
 */
function generateLegend(segments: SegmentSeatMap[]): SeatLegend[] {
  const types = new Set<string>();

  segments.forEach((segment) => {
    segment.cabins.forEach((cabin) => {
      cabin.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (seat.availability !== 'noSeat') {
            types.add(seat.seatType);
            if (seat.availability === 'occupied') types.add('occupied');
            if (seat.availability === 'restricted') types.add('restricted');
          }
        });
      });
    });
  });

  return DEFAULT_SEAT_LEGEND.filter((legend) => types.has(legend.type));
}
