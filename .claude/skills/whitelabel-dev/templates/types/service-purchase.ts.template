/**
 * Post-Booking ancillary service purchase type definitions
 *
 * ============================================================
 * Service purchase flow by carrier
 * ============================================================
 *
 * | Group | Carrier | Hold Status | Ticketed Status | OrderQuote | 2 OrderChange |
 * |------|--------|-----------|---------------|------------|-----------------|
 * | C | AF, KL | Yes | Yes | X | O (OfferPrice → OrderChange → OrderChange(Pay)) |
 * | B | AY, SQ | Yes | Yes | O | O (OrderQuote → OrderChange → OrderChange(Pay)) |
 * | A | EK, LH | No | Yes | X (OfferPrice) | O (After ticketing only Available, HN→when HD Payment) |
 * | D | HA | No | Yes | O | O (EK/LH and Same, REQUESTED→CONFIRMED) |
 * | E | TK | Yes | Yes | Conditional | Conditional (Free: X, Paid/KGUnit: O) |
 *
 * ============================================================
 * Payment requirement based on status
 * ============================================================
 *
 * - HN → when HD Payment Required: EK, LH, HA
 * - REQUESTED → when CONFIRMED Payment Required: AY, SQ
 * - Direct payment: AF, KL
 */

// ============================================================
// Service Purchase Status
// ============================================================

/**
 * Service purchase status codes
 * - HN: Hold Needs (Awaiting response)
 * - HD: Hold Done (Ready to confirm)
 * - HI: Hold Issued (Issued)
 * - HK: Hold Confirmed (Confirmed)
 * - REQUESTED: Requested (AY, SQ)
 * - CONFIRMED: Confirmed (AY, SQ)
 * - PENDING_PAYMENT: Awaiting payment (AY 2-step Intermediate state)
 */
export type ServicePurchaseStatus =
  | 'HN'
  | 'HD'
  | 'HI'
  | 'HK'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'PENDING_PAYMENT';

// ============================================================
// Carrier group constants
// ============================================================

/**
 * Service purchase group definitions
 *
 * CRITICAL: Service purchase flow by carrier different!
 * - Group A/B/D: Quote → OrderChange (with Payment) - Single OrderChange
 * - Group C (AF, KL): OfferPrice → OrderChange (Add) → OrderChange (Pay) - 2Step
 */
export const SERVICE_PURCHASE_GROUPS = {
  /**
   * Group A: Service addition only available after ticketing
   * Flow: OfferPrice → OrderChange (with Payment) - Single OrderChange!
   */
  GROUP_A_TICKETED_ONLY: ['EK', 'LH'],

  /**
   * Group B: OrderQuote Use
   * Flow: OrderQuote → OrderChange (with Payment) - Single OrderChange!
   * Add Step None! after Quote to Bar Payment Include OrderChange Call
   */
  GROUP_B_QUOTE: ['AY', 'SQ'],

  /**
   * Group C: 2Step OrderChange Required (AF, KL!)
   * Flow: OfferPrice → OrderChange (Add, Payment None) → OrderChange (Pay)
   * Add Step exists Group!
   */
  GROUP_C_DIRECT: ['AF', 'KL'],

  /**
   * Group D: OrderQuote Use + After ticketing only Available
   * Flow: OrderQuote → OrderChange (with Payment) - Single OrderChange!
   * Add Step None! after Quote to Bar Payment Include OrderChange Call
   */
  GROUP_D_QUOTE_TICKETED: ['HA'],

  /**
   * Group E: Conditional (Free service X, Paid/KGUnit O)
   * Flow: Branching by condition
   */
  GROUP_E_CONDITIONAL: ['TK'],

  /**
   * 2-Step OrderChange (Payment separation) Required Carrier
   * - AF, KL: OfferPrice -> Add -> Pay
   * - AY: OrderQuote -> Accept -> Pay
   */
  REQUIRES_TWO_STEP_PAYMENT: ['AF', 'KL', 'AY'],

  /**
   * Add Step(1 OrderChange) Required Carrier - AF, KL!
   * Different Carrier after Quote to Bar Payment Include OrderChange Call
   */
  REQUIRES_ADD_STEP: ['AF', 'KL'],

  /**
   * HN → HD Status when Switch Carriers requiring payment
   */
  PAYMENT_ON_HN_HD: ['EK', 'LH', 'HA'],

  /**
   * REQUESTED → CONFIRMED Status when Switch Carriers requiring payment
   */
  PAYMENT_ON_REQUESTED_CONFIRMED: ['AY', 'SQ'],
} as const;

// ============================================================
// Service Purchase Step
// ============================================================

/**
 * Service Purchase Modal Step
 */
export type ServicePurchaseStep =
  | 'loading'   // Calling ServiceList API
  | 'select'    // Selecting services
  | 'quote'     // Fetching Quote/OfferPrice
  | 'confirm'   // 1st OrderChange (adding service)
  | 'payment'   // Payment popup
  | 'result';   // Showing completion/failure

// ============================================================
// Service Purchase Request/Response Type
// ============================================================

/**
 * Service Purchase Quote Request
 */
export interface ServiceQuoteRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  /**
   * ServiceList API response data (required!)
   * - responseId and offerId required for OrderQuote/OfferPrice calls
   * - Calling Quote without ServiceList will cause an error
   */
  serviceListData?: {
    responseId: string;
    offerId: string;
    owner: string;
  };
  selectedServices: Array<{
    serviceId: string;
    offerItemId: string;
    paxId: string;
    segmentId?: string;
    quantity: number;
    weightValue?: number;
    bookingInstructions?: {
      text: string[];
      ositext?: string[];
    };
  }>;
  /** All booking passengers (for ExistingOrderCriteria in post-booking OfferPrice) */
  bookingPaxList?: Array<{ paxId: string; ptc: string }>;
}

/**
 * Service Purchase Quote Response
 */
export interface ServiceQuoteResponse {
  success: boolean;
  responseId?: string;
  offerId?: string;
  totalPrice?: number;
  currency?: string;
  offerItems?: Array<{
    offerItemId: string;
    paxRefId: string[];
  }>;
  error?: string;
}

/**
 * Service Add (1 OrderChange) Request
 */
export interface ServiceAddRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
  selectedServices: Array<{
    serviceId: string;
    offerItemId: string;
    paxId: string;
    segmentId?: string;
    quantity: number;
    weightValue?: number;
    bookingInstructions?: {
      text: string[];
      ositext?: string[];
    };
  }>;
}

/**
 * Service Add Response
 *
 * quoteData Field Description:
 * /service-purchase Main from Route Internal-liketo Quote API Calland,
 * Result to quoteData Return.
 * Data PaymentPopup's to existingQuote Passif/when
 * PaymentPopup Duplicateto Quote API Calldoes not.
 */
export interface ServiceAddResponse {
  success: boolean;
  orderId?: string;
  /** Service status (for determining payment necessity) */
  serviceStatus?: ServicePurchaseStatus;
  /** Whether payment is required */
  requiresPayment: boolean;
  /** Payment amount */
  paymentAmount?: number;
  currency?: string;
  /** Data for 2nd OrderChange */
  orderChangeData?: {
    transactionId: string;
    orderId: string;
    orderItemRefIds?: string[];
  };
  /**
   * Quote Data (Service when Purchase from PaymentPopup Duplicate Quote Call Prevention)
   * /service-purchase from Route Quote Call Case Data Include
   */
  quoteData?: {
    responseId?: string;
    offerId?: string;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
  error?: string;
}

/**
 * Service Purchase Confirmed Request
 *
 * two types Mode:
 * 1. Group A/B/D: after Quote to Bar Payment → quoteData + selectedServices Pass
 * 2. Group C (AF, KL): after Add Payment → orderItemRefIds Pass
 */
export interface ServiceConfirmRequest {
  transactionId: string;
  orderId: string;
  owner: string;
  paymentMethod: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
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
  amount: {
    currencyCode: string;
    amount: number;
  };
  /** Group C (AF, KL): after Add when Payment Use */
  orderItemRefIds?: string[];
  /** Group A/B/D: after Quote to Bar when Payment Use */
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
  /** Group A/B/D: Selected service Information */
  selectedServices?: Array<{
    serviceId: string;
    offerItemId: string;
    paxId: string;
    segmentId?: string;
    quantity: number;
  }>;
}

/**
 * Service Purchase Confirmed Response
 */
export interface ServiceConfirmResponse {
  success: boolean;
  orderId?: string;
  message: string;
  emdNumbers?: string[];
  /** Two-step flow: next step number */
  nextStep?: number;
  /** Two-step flow: payment required */
  requiresPayment?: boolean;
  /** v3.23.0: MW OrderChange response TotalPrice for Step 2 payment */
  paymentAmount?: number;
  /** v3.23.0: Currency from MW response */
  currency?: string;
  /** Two-step flow: reuse Quote data */
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
  };
}

/**
 * All/Total Service Purchase Result
 */
export interface ServicePurchaseResult {
  success: boolean;
  orderId?: string;
  message: string;
  emdNumbers?: string[];
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Per carrier Service Purchase Group Return
 */
export function getServicePurchaseGroup(
  carrierCode: string
): 'A' | 'B' | 'C' | 'D' | 'E' | 'UNKNOWN' {
  if (SERVICE_PURCHASE_GROUPS.GROUP_A_TICKETED_ONLY.includes(carrierCode as never)) {
    return 'A';
  }
  if (SERVICE_PURCHASE_GROUPS.GROUP_B_QUOTE.includes(carrierCode as never)) {
    return 'B';
  }
  if (SERVICE_PURCHASE_GROUPS.GROUP_C_DIRECT.includes(carrierCode as never)) {
    return 'C';
  }
  if (SERVICE_PURCHASE_GROUPS.GROUP_D_QUOTE_TICKETED.includes(carrierCode as never)) {
    return 'D';
  }
  if (SERVICE_PURCHASE_GROUPS.GROUP_E_CONDITIONAL.includes(carrierCode as never)) {
    return 'E';
  }
  return 'UNKNOWN';
}

/**
 * Check if 2nd OrderChange (payment) is required
 * @param carrierCode Carrier code
 * @param serviceStatus Service Status
 */
export function requiresSecondOrderChange(
  carrierCode: string,
  serviceStatus?: ServicePurchaseStatus
): boolean {
  // HN→HD when Switch Carriers requiring payment
  if (SERVICE_PURCHASE_GROUPS.PAYMENT_ON_HN_HD.includes(carrierCode as never)) {
    return serviceStatus === 'HN' || serviceStatus === 'HD';
  }

  // REQUESTED→CONFIRMED when Switch Carriers requiring payment
  if (SERVICE_PURCHASE_GROUPS.PAYMENT_ON_REQUESTED_CONFIRMED.includes(carrierCode as never)) {
    return serviceStatus === 'REQUESTED';
  }

  // Group C (AF, KL) Always requires 2nd OrderChange
  if (SERVICE_PURCHASE_GROUPS.GROUP_C_DIRECT.includes(carrierCode as never)) {
    return true;
  }

  // AY: Always two-step (Quote -> Accept -> Pay)
  if (carrierCode === 'AY') {
    return true;
  }

  return false;
}

/**
 * Whether two-step payment separation is needed (OrderChange 2 time(s))
 */
export function requiresTwoStepPayment(carrierCode: string): boolean {
  return SERVICE_PURCHASE_GROUPS.REQUIRES_TWO_STEP_PAYMENT.includes(carrierCode as never);
}

/**
 * Check payment necessity
 * @param carrierCode Carrier code
 * @param currentStatus Current Service Status
 * @param targetStatus target Service Status
 */
export function isPaymentRequired(
  carrierCode: string,
  currentStatus?: ServicePurchaseStatus,
  targetStatus?: ServicePurchaseStatus
): boolean {
  // HN → HD Payment required on transition
  if (
    SERVICE_PURCHASE_GROUPS.PAYMENT_ON_HN_HD.includes(carrierCode as never) &&
    currentStatus === 'HN' &&
    targetStatus === 'HD'
  ) {
    return true;
  }

  // REQUESTED → CONFIRMED Payment required on transition
  if (
    SERVICE_PURCHASE_GROUPS.PAYMENT_ON_REQUESTED_CONFIRMED.includes(carrierCode as never) &&
    currentStatus === 'REQUESTED' &&
    targetStatus === 'CONFIRMED'
  ) {
    return true;
  }

  // Group C Direct payment
  if (SERVICE_PURCHASE_GROUPS.GROUP_C_DIRECT.includes(carrierCode as never)) {
    return true;
  }

  return false;
}

/**
 * Whether services can be added in Hold status
 */
export function canAddServiceInHoldStatus(carrierCode: string): boolean {
  const group = getServicePurchaseGroup(carrierCode);
  // Group A, D After in ticketing only Available
  return group !== 'A' && group !== 'D';
}

/**
 * Whether OrderQuote is required
 */
export function requiresOrderQuote(carrierCode: string): boolean {
  const group = getServicePurchaseGroup(carrierCode);
  return group === 'B' || group === 'D';
}

/**
 * Whether OfferPrice is required (instead of Quote)
 */
export function requiresOfferPrice(carrierCode: string): boolean {
  const group = getServicePurchaseGroup(carrierCode);
  return group === 'A' || group === 'C';
}

/**
 * Whether Add step (1st OrderChange, no payment) is required
 * CRITICAL: AF, KL only Add Step Required!
 * Different Carrier after Quote to Bar Payment Include OrderChange Call
 */
export function requiresAddStep(carrierCode: string): boolean {
  return SERVICE_PURCHASE_GROUPS.REQUIRES_ADD_STEP.includes(carrierCode as never);
}

/**
 * Return service status label
 */
export function getServiceStatusLabel(status?: ServicePurchaseStatus): string {
  switch (status) {
    case 'HN':
      return 'Awaiting response';
    case 'HD':
      return 'Ready to confirm';
    case 'HI':
      return 'Issued';
    case 'HK':
      return 'Confirmed';
    case 'REQUESTED':
      return 'Requested';
    case 'CONFIRMED':
      return 'Confirmed';
    default:
      return '';
  }
}
