/**
 * Post-Booking Ticketing related type definitions
 *
 * Airline group API flow:
 * - Group A (LH, LX, OS, EK, QR, BA, AA): OrderReshop → OrderChange(F)
 * - Group B (KE, HA, SQ, AY, TK): OrderQuote → OrderChange(F)
 * - Group C (AF, KL, TR, AS): Direct OrderChange(F)
 *
 * CRITICAL: Group B OrderItemRefID is required for OrderQuote!
 * CRITICAL (v1.4.0): AY always requires Two-Step OrderChange! (regardless of services)
 */

// ============================================================
// Carrier group constants
// ============================================================

export const CARRIER_GROUPS = {
  /** Group A: OrderReshop → OrderChange(F) - Fare recalculation required */
  GROUP_A_RESHOP: ['LH', 'LX', 'OS', 'EK', 'QR', 'BA', 'AA'],
  /** Group B: OrderQuote → OrderChange(F) - Fare recalculation required (repricedOrderId Mode) */
  GROUP_B_QUOTE: ['KE', 'HA', 'SQ', 'AY', 'TK'],
  /** Group C: Direct OrderChange(F) - Fare recalculation not required */
  GROUP_C_DIRECT: ['AF', 'KL', 'TR', 'AS'],
  /** Airlines supporting only AGT payment */
  AGT_ONLY: ['TR'],
  /** Airlines supporting Voucher payment */
  VOUCHER_SUPPORT: ['AF', 'KL'],
  /**
   * Airlines always requiring Two-Step OrderChange (v1.5.0)
   * - Always separated into two steps regardless of ancillary services
   * - Step 1: OrderChange(acceptRepricedOrder, no paymentList)
   * - Step 2: OrderChange(paymentList, no acceptRepricedOrder)
   */
  TWO_STEP_TICKETING: ['AY'],
  /**
   * conditional Two-Step OrderChange Airline (v1.5.0)
   * - Two-Step only needed when ancillary services are included
   * - Ticket-only post-ticketing: Quote → Change(paymentList)
   * - Ticket+service post-ticketing: Quote → Change → Change(paymentList)
   */
  CONDITIONAL_TWO_STEP: ['SQ'],
} as const;

// ============================================================
// Payment method Type
// ============================================================

export type PaymentMethodType = 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';

// ============================================================
// Card info
// ============================================================

export interface CardPayment {
  /** Card brand code (VI=Visa, MC=MasterCard, AX=Amex, JC=JCB) */
  cardCode: 'VI' | 'MC' | 'AX' | 'JC' | string;
  /** Card number (16 digits) */
  cardNumber: string;
  /** Cardholder name */
  cardHolderName: string;
  /** Expiration date (MMYY format) */
  expiration: string;
  /** CVV/CVC security code */
  seriesCode?: string;
}

// ============================================================
// Fare difference info
// ============================================================

export interface FareDifference {
  /** Original fare */
  originalFare: number;
  /** New fare (after recalculation) */
  newFare: number;
  /** Difference (positive: additional payment, negative: refund) */
  difference: number;
  /** Currency code */
  currency: string;
  /** Difference display label (e.g.: "Additional payment: KRW 50,000") */
  differenceLabel: string;
}

// ============================================================
// Quote response (OrderQuote / OrderReshop)
// ============================================================

export interface TicketingQuote {
  /** Response ID (used in OrderChange) */
  responseId: string;
  /** Offer ID */
  offerId: string;
  /** Carrier code */
  owner: string;
  /** Fare difference info */
  fareDifference: FareDifference;
  /**
   * Offer item list (used in OrderChange)
   * CRITICAL (v1.6.0): seatSelection required!
   * Quote API response does not include seatSelection, so it must be built from the original selectedSeats
   */
  offerItems?: Array<{
    offerItemId: string;
    paxRefId: string[];
    /** Seat selection info (AY/SQ Change when Request Required!) */
    seatSelection?: {
      column: string;
      row: string;
    };
  }>;
  /** Whether confirmation is needed (AY edge case) */
  requiresConfirmation?: boolean;
}

// ============================================================
// Payment request (OrderChange)
// ============================================================

export interface PaymentRequest {
  /** Transaction ID (same as OrderRetrieve) */
  transactionId: string;
  /** Order ID */
  orderId: string;
  /** Carrier code */
  owner: string;
  /** Payment method */
  paymentMethod: PaymentMethodType;
  /** Card payment information */
  card?: CardPayment;
  /** Agent Deposit info (TR only) */
  agentDeposit?: {
    agentDepositId?: string;
  };
  /** Voucher info (AF/KL) */
  voucher?: {
    voucherId: string;
    voucherAmount: number;
  };
  /**
   * Quote data (Group A/B)
   * CRITICAL (v1.6.0): in offerItems seatSelection required!
   */
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      /** Seat selection info (AY/SQ Change when Request Required!) */
      seatSelection?: {
        column: string;
        row: string;
      };
    }>;
  };
  /** Payment amount */
  amount: {
    currencyCode: string;
    amount: number;
  };
  /**
   * SQ ticketing after service addition: exclude changeOrderChoice
   * If true, send only paymentList (when services already added via OrderChange)
   * AY is always processed as Two-Step regardless of this option
   * - AY Step 2 must be called with skipChangeOrderChoice=true (paymentList only)
   */
  skipChangeOrderChoice?: boolean;
  /**
   * v1.4.0: AY Two-Step - acceptRepricedOrder send only (no paymentList)
   * Used in Step 1: send only acceptRepricedOrder to create repriced order
   */
  acceptOnly?: boolean;
}

// ============================================================
// Payment result
// ============================================================

export interface PaymentResult {
  /** Success status */
  success: boolean;
  /** Order ID */
  orderId: string;
  /** Status */
  status: 'TICKETED' | 'ERROR';
  /** Issued ticket number list */
  ticketNumbers?: string[];
  /** Result message */
  message: string;
}

// ============================================================
// API response types (Middleware response)
// ============================================================

export interface OrderQuoteResponse {
  ResultMessage: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  Response?: {
    DataLists?: {
      PaxList?: Array<{ PaxID: string; PTC: string }>;
    };
    OrderQuote?: {
      ResponseID?: string;
      QuotedOrder?: {
        OrderID: string;
        OwnerCode?: string;
        TotalPrice?: {
          SimpleCurrencyPrice?: {
            Code: string;
            value: number;
          };
        };
        OrderItem?: Array<{
          OrderItemID: string;
          PriceDetail?: {
            TotalAmount?: {
              SimpleCurrencyPrice?: {
                Code: string;
                value: number;
              };
            };
          };
        }>;
      };
      OfferPrice?: {
        Offer?: {
          OfferID: string;
          OwnerCode?: string;
          TotalPrice?: {
            SimpleCurrencyPrice?: {
              Code: string;
              value: number;
            };
          };
          OfferItem?: Array<{
            OfferItemID: string;
            PaxRefID: string[];
          }>;
        };
      };
    };
  };
}

export interface OrderReshopResponse {
  ResultMessage: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  Response?: {
    ReshopOffer?: {
      ResponseID?: string;
      Offer?: {
        OfferID: string;
        OwnerCode?: string;
        TotalPrice?: {
          SimpleCurrencyPrice?: {
            Code: string;
            value: number;
          };
        };
        OfferItem?: Array<{
          OfferItemID: string;
          PaxRefID?: string[];
        }>;
      };
    };
    DataLists?: {
      PaxList?: Array<{ PaxID: string; PTC: string }>;
    };
  };
}

export interface OrderChangeResponse {
  ResultMessage: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  Response?: {
    Order?: {
      OrderID: string;
      OwnerCode?: string;
      StatusCode?: string;
    };
    TicketDocInfo?: Array<{
      TicketDocNbr?: string;
      Type?: string;
    }>;
  };
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Determine carrier group (A/B/C)
 */
export function getCarrierGroup(carrierCode: string): 'A' | 'B' | 'C' {
  if (CARRIER_GROUPS.GROUP_A_RESHOP.includes(carrierCode as never)) {
    return 'A';
  }
  if (CARRIER_GROUPS.GROUP_B_QUOTE.includes(carrierCode as never)) {
    return 'B';
  }
  // Default to C (direct OrderChange)
  return 'C';
}

/**
 * Use Available Payment method List Return
 */
export function getAvailablePaymentMethods(carrierCode: string): PaymentMethodType[] {
  // TR: AGT only
  if (CARRIER_GROUPS.AGT_ONLY.includes(carrierCode as never)) {
    return ['agt'];
  }

  // AF/KL: Voucher+Cash supported
  if (CARRIER_GROUPS.VOUCHER_SUPPORT.includes(carrierCode as never)) {
    return ['card', 'cash', 'voucher', 'voucher_cash'];
  }

  // General: Card, Cash
  return ['card', 'cash'];
}

/**
 * Whether fare Quote is needed (Group A/B)
 */
export function requiresFareQuote(carrierCode: string): boolean {
  const group = getCarrierGroup(carrierCode);
  return group === 'A' || group === 'B';
}

/**
 * v1.5.0: Whether Two-Step OrderChange is always required
 * AY airline always requires, regardless of ancillary services:
 * 1) OrderChange(acceptRepricedOrder)
 * 2) OrderChange(paymentList)
 * Two separate calls are needed
 */
export function requiresTwoStepTicketing(carrierCode: string): boolean {
  return CARRIER_GROUPS.TWO_STEP_TICKETING.includes(carrierCode as never);
}

/**
 * v1.5.0: conditional Two-Step OrderChange Whether needed
 * SQ airline requires Two-Step only when ancillary services are included:
 * - Ticket only: Quote → Change(paymentList)
 * - Ticket+service: Quote → Change → Change(paymentList)
 */
export function requiresConditionalTwoStep(carrierCode: string): boolean {
  return CARRIER_GROUPS.CONDITIONAL_TWO_STEP.includes(carrierCode as never);
}

/**
 * Convert card code to card brand name
 */
export function getCardBrandName(cardCode: string): string {
  switch (cardCode) {
    case 'VI': return 'Visa';
    case 'MC': return 'MasterCard';
    case 'AX': return 'American Express';
    case 'JC': return 'JCB';
    default: return cardCode;
  }
}

/**
 * Generate fare difference label
 */
export function formatFareDifferenceLabel(
  difference: number,
  currency: string
): string {
  const formatter = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  if (difference > 0) {
    return `Additional payment: ${formatter.format(difference)}`;
  } else if (difference < 0) {
    return `Expected Refund: ${formatter.format(Math.abs(difference))}`;
  }
  return 'No difference';
}
