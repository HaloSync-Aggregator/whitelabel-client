/**
 * Cancel/Refund related type definitions
 *
 * Major changes (v1.1.0):
 * - refundQuoteId Removed (not in API spec)
 * - OrderStatus Type Added (TicketDocList, PaymentList based Determine)
 * - TR (Scoot) special Case Process Added
 */

// ============================================================
// Order Status (Payment/Ticketing Status Determine)
// ============================================================

export interface OrderStatus {
  isTicketed: boolean; // Ticketing Complete (TicketDocList Exists)
  isPaid: boolean; // Payment Complete, Ticketing None (TR Case)
  isHeld: boolean; // Unpaid Hold
  canCancel: boolean; // Can cancel
  canVoidRefund: boolean; // Can void/refund
  carrierCode?: string; // Carrier code (TR special Case Process)
}

// ============================================================
// Button State
// ============================================================

export interface CancelRefundButtonState {
  showCancelButton: boolean; // Unpaid Hold: Cancel Button
  showVoidRefundButton: boolean; // After ticketing: VOID/REFUND button
  buttonLabel: string; // 'Cancel Booking' | 'VOID/Refund' | 'Request Refund'
  isEnabled: boolean;
  disabledReason?: string; // Disabled reason (e.g., TR non-refundable after payment)
}

// ============================================================
// Cancel (Unpaid Hold Cancellation)
// ============================================================

export interface CancelConfirmPopupData {
  title: string;
  message: string;
  pnr: string;
  orderId: string;
  carrierCode: string;
  carrierName?: string;
  passengerCount: number;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
}

export interface CancelResult {
  success: boolean;
  orderId: string;
  pnr?: string;
  status: 'CANCELLED' | 'VOIDED' | 'REFUNDED';
  statusLabel: string;
  cancelDate: string;
  message: string;
}

// ============================================================
// VOID (same-day ticket cancellation)
// ============================================================

export interface VoidConfirmPopupData {
  title: string;
  message: string;
  warningMessage: string;
  pnr: string;
  orderId: string;
  ticketNumbers: string[];
  ticketedDate: string;
  isVoidAvailable: boolean;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
}

export interface VoidResult {
  success: boolean;
  orderId: string;
  pnr?: string;
  voidedTickets: string[];
  status: 'VOIDED';
  statusLabel: string;
  voidDate: string;
  message: string;
}

// ============================================================
// REFUND
// ============================================================

export interface RefundQuote {
  originalFare: number;
  originalFareLabel: string;
  penalty: number;
  penaltyLabel: string;
  refundAmount: number;
  refundAmountLabel: string;
  currency: string;
  responseId: string;
  // refundQuoteId Removed (not in API spec)
  refundBreakdown?: RefundBreakdownItem[];
}

export interface RefundBreakdownItem {
  paxId: string;
  passengerName: string;
  ptc: string;
  ticketNumber: string;
  originalFare: number;
  penalty: number;
  refundAmount: number;
}

export interface RefundConfirmPopupData {
  title: string;
  message: string;
  pnr: string;
  orderId: string;
  refundQuote: RefundQuote;
  confirmButtonLabel: string;
  cancelButtonLabel: string;
}

export interface RefundResult {
  success: boolean;
  orderId: string;
  pnr?: string;
  refundedTickets: string[];
  refundAmount: number;
  currency: string;
  status: 'REFUNDED';
  statusLabel: string;
  refundDate: string;
  message: string;
}

// ============================================================
// API Request/Response
// ============================================================

export interface CancelRequest {
  transactionId: string;
  orderId: string;
  pnr?: string;
  cancelType?: 'CANCEL' | 'VOID' | 'REFUND';
}

export interface RefundQuoteRequest {
  transactionId: string;
  orderId: string;
}

export interface RefundQuoteResponse {
  success: boolean;
  refundQuote?: {
    originalFare: number;
    penalty: number;
    refundAmount: number;
    currency: string;
    responseId: string;
    breakdown?: Array<{
      orderItemId: string;
      originalAmount: number;
      penaltyAmount: number;
      refundAmount: number;
      currency: string;
    }>;
  };
  error?: string;
  errorCode?: string;
}

// ============================================================
// Utility Types
// ============================================================

export type CancelStatus = 'CANCELLED' | 'VOIDED' | 'REFUNDED';

export type CancelAction = 'CANCEL' | 'VOID' | 'REFUND';

// Non-refundable carrier list
export const NON_REFUNDABLE_CARRIERS_AFTER_PAYMENT = ['TR']; // Scoot

// ============================================================
// Helper Functions
// ============================================================

/**
 * order Status per Determine (TicketDocList, PaymentList based)
 *
 * Determination order:
 * 1. TicketDocList Exists → Ticketing Complete (Can void/refund)
 * 2. PaymentList Exists (Success) → Payment Complete, Ticketing None (TR Case: Refund Not possible)
 * 3. Both None → Unpaid Hold (Can cancel)
 */
export function determineOrderStatus(
  ticketDocList: unknown[] | undefined,
  paymentList: Array<{ Status?: string }> | undefined,
  carrierCode?: string
): OrderStatus {
  // 1priority: TicketDocList Confirm (Ticketing Complete)
  const hasTicket = ticketDocList && ticketDocList.length > 0;

  // 2priority: PaymentList Confirm (Payment Complete, Ticketing None)
  // TODO: Need to check PaymentList.Status success code (currently only checking existence)
  const hasPaidWithoutTicket = !hasTicket &&
    paymentList &&
    paymentList.length > 0;

  // Status Determine
  const isTicketed = Boolean(hasTicket);
  const isPaid = Boolean(hasPaidWithoutTicket);
  const isHeld = !isTicketed && !isPaid;

  // TR (Scoot) edge case: non-refundable after payment
  const isNonRefundableCarrier = carrierCode &&
    NON_REFUNDABLE_CARRIERS_AFTER_PAYMENT.includes(carrierCode);

  // Determine available actions
  const canCancel = isHeld; // Unpaid Hold only Can cancel
  const canVoidRefund = isTicketed && !isNonRefundableCarrier;

  return {
    isTicketed,
    isPaid,
    isHeld,
    canCancel,
    canVoidRefund,
    carrierCode,
  };
}

/**
 * Button Status Determine
 */
export function getCancelRefundButtonState(
  orderStatus: OrderStatus,
  ticketedDate?: string
): CancelRefundButtonState {
  const { isTicketed, isPaid, isHeld, canCancel, canVoidRefund, carrierCode } = orderStatus;

  // Unpaid Hold → Cancel Button
  if (isHeld && canCancel) {
    return {
      showCancelButton: true,
      showVoidRefundButton: false,
      buttonLabel: 'Cancel Booking',
      isEnabled: true,
    };
  }

  // Payment Complete, Ticketing None (TR Case) → Button disabled
  if (isPaid && !isTicketed) {
    return {
      showCancelButton: false,
      showVoidRefundButton: false,
      buttonLabel: 'Non-refundable',
      isEnabled: false,
      disabledReason: `${carrierCode || 'This'} airline does not support refund after payment.`,
    };
  }

  // Ticketing Complete → VOID/REFUND Button
  if (isTicketed && canVoidRefund) {
    const isVoidAvailable = ticketedDate ? checkVoidAvailable(ticketedDate) : false;
    return {
      showCancelButton: false,
      showVoidRefundButton: true,
      buttonLabel: isVoidAvailable ? 'VOID/Refund' : 'Request Refund',
      isEnabled: true,
    };
  }

  // Other (button disabled)
  return {
    showCancelButton: false,
    showVoidRefundButton: false,
    buttonLabel: 'Cancel/Refund not available',
    isEnabled: false,
    disabledReason: 'Cancellation or Refund unavailable Status.',
  };
}

/**
 * Check VOID availability (only on ticketing day)
 */
export function checkVoidAvailable(ticketedDate: string): boolean {
  if (!ticketedDate) return false;
  const today = new Date().toISOString().split('T')[0];
  const tkDate = ticketedDate.split('T')[0];
  return today === tkDate;
}

/**
 * Status Label Return
 */
export function getStatusLabel(status: CancelStatus): string {
  switch (status) {
    case 'CANCELLED':
      return 'CancellationComplete';
    case 'VOIDED':
      return 'VOIDComplete';
    case 'REFUNDED':
      return 'RefundComplete';
    default:
      return status;
  }
}

/**
 * per Airline Whether refund is allowed Confirm
 */
export function canRefundAfterPayment(carrierCode: string): boolean {
  return !NON_REFUNDABLE_CARRIERS_AFTER_PAYMENT.includes(carrierCode);
}
