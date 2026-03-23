/**
 * Seat selection related type definitions
 *
 * ============================================================
 * Seat purchase flow
 * ============================================================
 *
 * Prime Booking (at booking):
 * OfferPrice → SeatAvailability → OrderQuote(Select) → OrderCreate
 *
 * Post-Booking (After booking/ticketing):
 * OrderRetrieve → SeatAvailability → OrderQuote/OfferPrice → OrderChange
 *
 * ============================================================
 */

// ============================================================
// Seat map (SeatMap)
// ============================================================

/**
 * Seat status
 */
export type SeatAvailability = 'available' | 'occupied' | 'restricted' | 'noSeat' | 'selected';

/**
 * Seat type
 */
export type SeatType = 'standard' | 'preferred' | 'extraLegroom' | 'exitRow';

/**
 * Individual seat info
 */
export interface Seat {
  column: string; // A, B, C...
  seatNumber: string; // 10A, 15C
  availability: SeatAvailability;
  availabilityLabel: string; // Availability label
  seatType: SeatType;
  seatTypeLabel: string; // Seat type label
  characteristics: string[]; // Window, Aisle etc.
  price: number;
  currency: string;
  isSelected: boolean;
  // For API reference
  offerItemRefId?: string;
}

/**
 * Seat row info
 */
export interface SeatRow {
  rowNumber: number;
  seats: Seat[];
}

/**
 * Column information
 */
export interface SeatColumn {
  designation: string; // A, B, C...
  position: 'L' | 'C' | 'R'; // Left, Center, Right
}

/**
 * Cabin info
 */
export interface CabinInfo {
  cabinType: string; // Y, C, F
  cabinTypeLabel: string; // Economy, Business, First class
  columns: SeatColumn[];
  rows: SeatRow[];
}

/**
 * Segment-specific seat map
 */
export interface SegmentSeatMap {
  segmentId: string;
  segmentNo: number;
  carrierCode: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  cabins: CabinInfo[];
}

// ============================================================
// Seat legend (SeatLegend)
// ============================================================

export interface SeatLegend {
  type: SeatType | 'occupied' | 'restricted';
  label: string;
  color: string;
}

export const DEFAULT_SEAT_LEGEND: SeatLegend[] = [
  { type: 'standard', label: 'Standard Seat', color: '#4CAF50' },
  { type: 'preferred', label: 'Preferred Seat', color: '#2196F3' },
  { type: 'extraLegroom', label: 'Extra Legroom Seat', color: '#9C27B0' },
  { type: 'exitRow', label: 'Exit Row Seat', color: '#FF9800' },
  { type: 'occupied', label: 'Occupied Seat', color: '#757575' },
  { type: 'restricted', label: 'Restricted Seat', color: '#9E9E9E' },
];

// ============================================================
// Selected seat (SelectedSeat)
// ============================================================

export interface SelectedSeat {
  paxId: string;
  passengerName: string;
  passengerType: string; // ADT, CHD, INF
  segmentId: string;
  segmentNo: number;
  flightNumber: string;
  seatNumber: string;
  seatType: SeatType;
  seatTypeLabel: string;
  price: number;
  currency: string;
  // For API calls
  offerItemId: string;
}

// ============================================================
// SeatAvailability API response Conversion Result
// ============================================================

export interface SeatAvailabilityData {
  transactionId: string;
  responseId: string;
  owner: string;
  offerId: string;
  segments: SegmentSeatMap[];
  legend: SeatLegend[];
  // For subsequent API calls
  _apiData: {
    transactionId: string;
    responseId: string;
    offerId: string;
    owner: string;
    offerItems: Array<{
      offerItemId: string;
      price: number;
      currency: string;
      eligibility?: {
        paxRefId?: string[];
        segmentRefId?: string[];
      };
    }>;
  };
}

// ============================================================
// Airline-specific settings
// ============================================================

/**
 * Amount Re-Calculate Required Airline (Post-Booking)
 */
export const CARRIERS_NEED_REQUOTE = {
  ORDER_QUOTE: ['SQ', 'AY', 'TK', 'TR'], // OrderQuote API
  OFFER_PRICE: ['AF', 'KL'], // OfferPrice API
};

/**
 * Airlines requiring OfferPrice re-call after seat purchase at booking (WF_PB_SEAT_REPRICE)
 * In Prime Booking, SeatAvailability → OfferPrice → OrderCreate Flow
 * Important: itinerary/seats must be separated into separate Offer entries
 */
export const CARRIERS_SEAT_REPRICE = ['AF', 'KL', 'TR'];

/**
 * Airlines requiring purchase confirmation (2-step OrderChange)
 */
export const CARRIERS_NEED_CONFIRM = ['LH', 'LX', 'OS', 'EK', 'KE', 'HA'];

/**
 * Seat per status Confirmed Whether needed
 */
export const SEAT_STATUS_NEED_CONFIRM = ['HN', 'HD', 'REQUESTED'];

// ============================================================
// Helper Functions
// ============================================================

/**
 * Amount Re-Calculate Whether needed Confirm
 */
export function needsRequote(carrierCode: string): { needed: boolean; api: 'OrderQuote' | 'OfferPrice' | null } {
  if (CARRIERS_NEED_REQUOTE.ORDER_QUOTE.includes(carrierCode)) {
    return { needed: true, api: 'OrderQuote' };
  }
  if (CARRIERS_NEED_REQUOTE.OFFER_PRICE.includes(carrierCode)) {
    return { needed: true, api: 'OfferPrice' };
  }
  return { needed: false, api: null };
}

/**
 * Check whether purchase confirmation is needed
 */
export function needsConfirmation(carrierCode: string): boolean {
  return CARRIERS_NEED_CONFIRM.includes(carrierCode);
}
