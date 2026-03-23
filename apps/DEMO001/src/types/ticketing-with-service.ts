/**
 * Pre-ticketing with service inclusion types
 *
 * ============================================================
 * Two-step separation strategy:
 * Step 1: Service/seat addition (service-purchase/seat-purchase, no payment)
 * Step 2: Ticketing (order-change-ticketing, consolidated payment)
 * ============================================================
 */

// ============================================================
// Reuse existing helper functions
// ============================================================

import { canAddServiceInHoldStatus } from './service-purchase';
import { supportsHeldBookingSeat } from './seat-purchase';

/**
 * Whether service can be added in Hold status
 * - Group B (AY, SQ): Yes
 * - Group C (AF, KL): Yes
 * - Group E (TK): Yes (conditional)
 * - Group A (EK, LH): No
 * - Group D (HA): No
 *
 * Same as existing canAddServiceInHoldStatus() function!
 */
export const canAddServiceBeforeTicketing = canAddServiceInHoldStatus;

/**
 * Whether seat selection is available in Hold status
 * Reuse supportsHeldBookingSeat() function
 */
export const canAddSeatBeforeTicketing = supportsHeldBookingSeat;

// ============================================================
// Ticketing + Service + Seat combined state
// ============================================================

export type TicketingWithServiceStep =
  | 'idle'            // Initial state
  | 'service-select'  // Selecting services
  | 'service-adding'  // Adding services (Step 1)
  | 'service-added'   // Service addition complete
  | 'seat-select'     // Selecting seats
  | 'seat-adding'     // Adding seats (Step 1)
  | 'seat-added'      // Seat addition complete
  | 'payment'         // Showing payment popup
  | 'ticketing'       // Processing ticketing (Step 2)
  | 'success'         // Complete
  | 'error';          // Error

// ============================================================
// Service addition request (Step 1)
// ============================================================

export interface SelectedServiceItem {
  serviceId: string;
  offerItemId: string;
  paxId: string;
  segmentId?: string;
  quantity: number;
  price?: number;
  currency?: string;
  weightValue?: number;
  bookingInstructions?: {
    text: string[];
    ositext?: string[];
  };
}

export interface ServiceListData {
  responseId: string;
  offerId: string;
  owner: string;
}

export interface AddServiceBeforeTicketingRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  isTicketed: false; // Used only in Hold status
  skipPayment: true; // Payment skip required
  selectedServices: SelectedServiceItem[];
  serviceListData: ServiceListData;
}

export interface AddServiceBeforeTicketingResponse {
  success: boolean;
  orderId: string;
  requiresPayment: false; // Always false in skipPayment mode
  /** Service cost (for ticketing total) */
  paymentAmount?: number;
  /** Currency code */
  currency?: string;
  /** Quote data (for reference) */
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
  /** Error Message */
  error?: string;
}

// ============================================================
// Seat addition request (Step 1)
// ============================================================

export interface SelectedSeatItem {
  /** Seat offerItemId */
  offerItemId: string;
  /** Passenger ID */
  paxId: string;
  /** Segment ID */
  segmentId: string;
  /** Seat column (A, B, C...) */
  column: string;
  /** Seat row (1, 2, 3...) */
  row: string;
  /** Seat price */
  price: number;
  /** Currency */
  currency?: string;
}

export interface AddSeatBeforeTicketingRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  purchaseType: 'paid' | 'free';
  skipPayment: true; // Payment skip required
  selectedSeats: SelectedSeatItem[];
  quoteData?: {
    responseId?: string;
    offerId?: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
}

export interface AddSeatBeforeTicketingResponse {
  success: boolean;
  orderId: string;
  requiresPayment: false; // Always false in skipPayment mode
  /** Seat cost (for ticketing total) */
  paymentAmount?: number;
  /** Currency code */
  currency?: string;
  /** Quote data (for reference) */
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
  /** Seat status */
  seatStatus?: string;
  /** Error Message */
  error?: string;
}

// ============================================================
// Consolidated ticketing request (Step 2)
// ============================================================

export interface TicketingWithServiceRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  /** Payment method */
  paymentMethod: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
  /** Card info (for card payment) */
  card?: {
    cardCode: string;
    cardNumber: string;
    cardHolderName: string;
    expiration: string;
    seriesCode?: string;
  };
  /** Agent Deposit info (for agt payment) */
  agentDeposit?: {
    agentDepositId: string;
  };
  /** Voucher info (for voucher payment) */
  voucher?: {
    voucherId: string;
  };
  /** Payment amount (fare + service + seat total) */
  amount: {
    currencyCode: string;
    amount: number;
  };
  /** Quote data (for ticketing) */
  quoteData?: {
    responseId: string;
    offerId: string;
  };
  /** OrderItem reference ID list */
  orderItemRefIds?: string[];
}

// ============================================================
// Amount calculation helpers
// ============================================================

export interface TicketingAmount {
  /** Base fare */
  baseFare: number;
  /** Added service fee */
  serviceFee: number;
  /** Added seat fee */
  seatFee: number;
  /** Total */
  total: number;
  /** Currency */
  currency: string;
}

/**
 * Calculate ticketing amount (fare + service + seat)
 */
export function calculateTicketingAmount(
  baseFare: number,
  serviceFee: number,
  currency: string = 'KRW',
  seatFee: number = 0
): TicketingAmount {
  return {
    baseFare,
    serviceFee,
    seatFee,
    total: baseFare + serviceFee + seatFee,
    currency,
  };
}

// ============================================================
// Modal Props
// ============================================================

export interface TicketingWithServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  owner: string;
  transactionId: string;
  passengers: Array<{
    paxId: string;
    name: string;
    type: string;
    typeLabel: string;
  }>;
  /** Segment information (for seat selection) */
  segments?: Array<{
    segmentId: string;
    departure: string;
    arrival: string;
    flightNumber: string;
    departureDate: string;
  }>;
  /** Base fare (Ticketing Amount) */
  baseFare: number;
  currency: string;
  /** OrderItem reference ID list (Ticketing Quote) */
  orderItemRefIds: string[];
  onSuccess: () => void;
}
