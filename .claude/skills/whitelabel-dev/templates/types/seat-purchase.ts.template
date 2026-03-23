/**
 * Held Booking seat purchase type definitions
 *
 * ============================================================
 * Held Booking seat purchase flow (7 Airline)
 * ============================================================
 *
 * | Pattern | Airline | Flow |
 * |------|--------|------|
 * | A | AF, KL | SeatAvail → OfferPrice → OC(w/o FOP) → OC(w/ FOP) |
 * | B | AY, SQ | SeatAvail → OrderQuote → OC(w/o FOP) → OC(w/ FOP) |
 * | C | TR, TK(chargeable) | SeatAvail → OrderQuote → OC(w/ FOP) |
 * | D | HA | SeatAvail → OC(w/o FOP) → Retrieve(CONFIRMED) → OC(w/ FOP) |
 * | E | TK(free) | SeatAvail → OC |
 *
 * File is Held Booking (Booking Complete, unPayment/unTicketing) Dedicated.
 * Ticketed Booking Flow requires separate implementation.
 */

// ============================================================
// Pattern type definitions (Held Booking only)
// ============================================================

/**
 * Seat purchase patterns (5 types)
 */
export type SeatPurchasePattern = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Pattern-specific configuration
 */
export interface PatternConfig {
  pattern: SeatPurchasePattern;
  quoteApi: 'OFFER_PRICE' | 'ORDER_QUOTE' | 'NONE';
  orderChangeSteps: 1 | 2;
  requiresPolling: boolean;
  paymentTypes: ('Card' | 'Cash' | 'AGT' | 'Voucher')[];
}

/**
 * Airline-specific pattern settings (Held Booking)
 */
export const AIRLINE_CONFIG: Record<string, PatternConfig> = {
  // Pattern A: OfferPrice + 2-step OC
  AF: {
    pattern: 'A',
    quoteApi: 'OFFER_PRICE',
    orderChangeSteps: 2,
    requiresPolling: false,
    paymentTypes: ['Card', 'Cash', 'Voucher'],
  },
  KL: {
    pattern: 'A',
    quoteApi: 'OFFER_PRICE',
    orderChangeSteps: 2,
    requiresPolling: false,
    paymentTypes: ['Card', 'Cash', 'Voucher'],
  },

  // Pattern B: OrderQuote + 2-step OC
  AY: {
    pattern: 'B',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 2,
    requiresPolling: false,
    paymentTypes: ['Card', 'Cash'],
  },
  SQ: {
    pattern: 'B',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 2,
    requiresPolling: false,
    paymentTypes: ['Card', 'Cash'],
  },

  // Pattern C: OrderQuote + 1-step OC
  TR: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    requiresPolling: false,
    paymentTypes: ['AGT'], // AGT!
  },
  TK_PAID: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    requiresPolling: false,
    paymentTypes: ['Card', 'Cash'],
  },

  // Pattern D: Direct + polling
  HA: {
    pattern: 'D',
    quoteApi: 'NONE',
    orderChangeSteps: 2,
    requiresPolling: true,
    paymentTypes: ['Card', 'Cash'],
  },

  // Pattern E: Direct
  TK_FREE: {
    pattern: 'E',
    quoteApi: 'NONE',
    orderChangeSteps: 1,
    requiresPolling: false,
    paymentTypes: [], // free
  },
};

// ============================================================
// Held Booking supported carriers (7)
// ============================================================

/**
 * Held Booking seat purchase supported carriers
 */
export const HELD_BOOKING_SEAT_SUPPORTED_CARRIERS = [
  'AF', 'AY', 'HA', 'KL', 'SQ', 'TK', 'TR'
] as const;

/**
 * Legacy compatibility (deprecated)
 * @deprecated Use HELD_BOOKING_SEAT_SUPPORTED_CARRIERS
 */
export const POST_TICKETING_SEAT_SUPPORTED_CARRIERS = HELD_BOOKING_SEAT_SUPPORTED_CARRIERS;

/**
 * Legacy group definitions (for backward compatibility)
 * @deprecated Recommended to use getAirlineConfig function
 */
export const SEAT_PURCHASE_GROUPS = {
  GROUP_A_CONFIRM: ['LH', 'LX', 'OS', 'EK', 'HA', 'KE'], // for Ticketed
  GROUP_B_QUOTE: ['SQ', 'AY', 'TK', 'TR'],
  GROUP_C_OFFER_PRICE: ['AF', 'KL'],
  GROUP_D_DIRECT: ['QR', 'AS'], // for Ticketed
  FREE_SEAT_ONLY: ['AA'], // for Ticketed
  NOT_SUPPORTED: ['BA'],
} as const;

// ============================================================
// Seat purchase status/steps (service-purchase.ts pattern)
// ============================================================

/**
 * Seat status Code
 * - HN: Hold Needs (awaiting response) → Group A First after OrderChange
 * - HD: Hold Done (confirmable)
 * - HI: Hold Issued (Issue Complete)
 * - HK: Hold Confirmed
 */
export type SeatPurchaseStatus = 'HN' | 'HD' | 'HI' | 'HK';

/**
 * Seat purchase modal steps (same pattern as ServicePurchaseModal)
 */
export type SeatPurchaseStep =
  | 'loading'  // Calling SeatAvailability
  | 'select'   // Selecting seats (SeatSelector Display)
  | 'quote'    // Querying Quote/OfferPrice
  | 'confirm'  // 1st OrderChange (Group A/C)
  | 'payment'  // Payment popup (paid seats)
  | 'result';  // Complete/Failure Display

// ============================================================
// Seat purchase request/response types
// ============================================================

/**
 * Seat selection info
 */
export interface SeatSelection {
  segmentKey: string;
  paxId: string;
  column: string;
  row: string;
  seatNumber: string; // "37K" format
  offerItemId: string;
  price: number;
  currency: string;
}

/**
 * Seat Quote request
 */
export interface SeatQuoteRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  /** SeatAvailability response data */
  seatAvailabilityData: {
    responseId: string;
    offerId: string;
    owner: string;
  };
  selectedSeats: SeatSelection[];
}

/**
 * Seat Quote response
 */
export interface SeatQuoteResponse {
  success: boolean;
  responseId?: string;
  offerId?: string;
  totalPrice?: number;
  currency?: string;
  offerItems?: Array<{
    offerItemId: string;
    paxRefId: string[];
    seatSelection?: {
      column: string;
      row: string;
    };
  }>;
  error?: string;
}

/**
 * Seat purchase response (main route)
 * Same pattern as ServiceAddResponse
 */
export interface SeatPurchaseResponse {
  success: boolean;
  orderId?: string;
  /** Seat status (Group A Judgment) */
  seatStatus?: SeatPurchaseStatus;
  /** Whether payment is required */
  requiresPayment: boolean;
  /** Payment amount */
  paymentAmount?: number;
  currency?: string;
  /** Data for 2nd OrderChange */
  orderChangeData?: {
    transactionId: string;
    orderId: string;
  };
  /** Quote data (prevent duplicate Quote in PaymentPopup) */
  quoteData?: {
    responseId?: string;
    offerId?: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: {
        column: string;
        row: string;
      };
    }>;
  };
  error?: string;
}

/**
 * Seat purchase confirmation request (with payment)
 * Same pattern as ServiceConfirmRequest
 */
export interface SeatConfirmRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  purchaseType: 'paid' | 'free';
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: {
        column: string;
        row: string;
      };
    }>;
  };
  selectedSeats: SeatSelection[];
  /** Payment info (paid seats) */
  paymentMethod?: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
  card?: {
    cardCode: string;
    cardNumber: string;
    cardHolderName: string;
    expiration: string;
    seriesCode?: string;
  };
  agentDeposit?: {
    agentDepositId?: string;
  };
  voucher?: {
    voucherId: string;
    voucherAmount: number;
  };
  amount?: {
    currencyCode: string;
    amount: number;
  };
}

/**
 * Seat purchase confirmation response
 */
export interface SeatConfirmResponse {
  success: boolean;
  orderId?: string;
  message: string;
  seatStatus?: SeatPurchaseStatus;
}

/**
 * Overall seat purchase result
 */
export interface SeatPurchaseResult {
  success: boolean;
  orderId?: string;
  message: string;
  seatStatus?: SeatPurchaseStatus;
}

// ============================================================
// Helper functions (Held Booking only)
// ============================================================

/**
 * Get airline-specific pattern config
 * Core function: used for all flow branching
 */
export function getAirlineConfig(owner: string, isPaid: boolean): PatternConfig {
  // TK chargeable/free Distinction
  if (owner === 'TK') {
    return isPaid ? AIRLINE_CONFIG.TK_PAID : AIRLINE_CONFIG.TK_FREE;
  }
  // Return default config (SQ pattern if not found)
  return AIRLINE_CONFIG[owner] || AIRLINE_CONFIG.SQ;
}

/**
 * Get Quote API type
 */
export function getQuoteApiType(owner: string, isPaid: boolean = true): 'OFFER_PRICE' | 'ORDER_QUOTE' | 'NONE' {
  const config = getAirlineConfig(owner, isPaid);
  return config.quoteApi;
}

/**
 * Whether 2-step OrderChange is needed (Held Booking)
 * Pattern A, B, D: 2-step
 * Pattern C, E: 1-step
 */
export function requiresTwoStepOrderChange(owner: string, isPaid: boolean = true): boolean {
  const config = getAirlineConfig(owner, isPaid);
  return config.orderChangeSteps === 2;
}

/**
 * Whether polling is needed (HA only)
 */
export function requiresPolling(owner: string): boolean {
  const config = AIRLINE_CONFIG[owner];
  return config?.requiresPolling || false;
}

/**
 * Whether Held Booking seat purchase is supported
 */
export function supportsHeldBookingSeat(carrierCode: string): boolean {
  return HELD_BOOKING_SEAT_SUPPORTED_CARRIERS.includes(
    carrierCode as typeof HELD_BOOKING_SEAT_SUPPORTED_CARRIERS[number]
  );
}

/**
 * Post-ticketing seat purchase support (legacy compatibility)
 * @deprecated Use supportsHeldBookingSeat
 */
export function supportsPostTicketingSeat(carrierCode: string): boolean {
  return supportsHeldBookingSeat(carrierCode);
}

/**
 * free Seat only Support Confirm
 * Not applicable for Held Booking (for Ticketed only)
 */
export function isFreeSeatOnly(carrierCode: string): boolean {
  return SEAT_PURCHASE_GROUPS.FREE_SEAT_ONLY.includes(carrierCode as never);
}

/**
 * Get airline seat purchase group (legacy)
 * @deprecated Recommended to use getAirlineConfig
 */
export function getSeatPurchaseGroup(
  carrierCode: string
): 'A' | 'B' | 'C' | 'D' | 'FREE_ONLY' | 'UNSUPPORTED' {
  if (SEAT_PURCHASE_GROUPS.GROUP_A_CONFIRM.includes(carrierCode as never)) return 'A';
  if (SEAT_PURCHASE_GROUPS.GROUP_B_QUOTE.includes(carrierCode as never)) return 'B';
  if (SEAT_PURCHASE_GROUPS.GROUP_C_OFFER_PRICE.includes(carrierCode as never)) return 'C';
  if (SEAT_PURCHASE_GROUPS.GROUP_D_DIRECT.includes(carrierCode as never)) return 'D';
  if (SEAT_PURCHASE_GROUPS.FREE_SEAT_ONLY.includes(carrierCode as never)) return 'FREE_ONLY';
  return 'UNSUPPORTED';
}

/**
 * Whether OrderQuote is needed
 */
export function requiresSeatQuote(carrierCode: string, isPaid: boolean = true): boolean {
  const quoteType = getQuoteApiType(carrierCode, isPaid);
  return quoteType === 'ORDER_QUOTE';
}

/**
 * Whether OfferPrice is needed
 */
export function requiresSeatOfferPrice(carrierCode: string): boolean {
  const quoteType = getQuoteApiType(carrierCode, true);
  return quoteType === 'OFFER_PRICE';
}

/**
 * Whether 2-step confirmation is needed (for Ticketed Group A - legacy)
 * @deprecated Use requiresTwoStepOrderChange
 */
export function requiresSeatConfirmStep(carrierCode: string): boolean {
  return SEAT_PURCHASE_GROUPS.GROUP_A_CONFIRM.includes(carrierCode as never);
}

/**
 * Whether Add step (1st OrderChange, no payment) is needed
 * Held Booking: needed for Pattern A, B, D
 */
export function requiresSeatAddStep(carrierCode: string, isPaid: boolean = true): boolean {
  return requiresTwoStepOrderChange(carrierCode, isPaid);
}

/**
 * Whether payment is required Judgment
 */
export function isSeatPaymentRequired(
  carrierCode: string,
  purchaseType: 'paid' | 'free',
  _seatStatus?: SeatPurchaseStatus
): boolean {
  // free Seat Payment not required
  if (purchaseType === 'free') return false;

  // Held Booking: payment required if paid
  return true;
}

/**
 * Seat status Label
 */
export function getSeatStatusLabel(status?: SeatPurchaseStatus): string {
  switch (status) {
    case 'HN': return 'Awaiting Response';
    case 'HD': return 'Confirmable';
    case 'HI': return 'Issue Complete';
    case 'HK': return 'Confirmed';
    default: return '';
  }
}

/**
 * Check success response code
 */
export function isSuccessCode(code?: string): boolean {
  if (!code) return true;
  return ['OK', '00000', 'SUCCESS'].includes(code);
}
