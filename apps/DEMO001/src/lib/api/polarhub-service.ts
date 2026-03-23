/**
 * PolarHub NDC Service Layer - Barrel Re-export
 * @version 3.1.0
 * @description Re-exports all service functions from split modules.
 * Maintains single import path: `import { ... } from '@/lib/api/polarhub-service'`
 *
 * Split modules:
 * - polarhub-service-prebooking.ts: Flight search, pricing, booking, cancellation
 * - polarhub-service-postbooking.ts: Ticketing, reshop, pax split, journey change
 * - polarhub-service-ancillary.ts: Seat purchase, service purchase workflows
 */

// Pre-Booking Functions
export {
  searchFlights,
  getOfferPrice,
  getSeatAvailability,
  getServiceList,
  createBooking,
  getBookingDetail,
  cancelBooking,
  getRefundQuote,
} from './polarhub-service-prebooking';
export type {
  SearchResult,
  OfferPriceResult,
  SeatAvailabilityResult,
  ServiceListResult,
  CreateBookingResult,
  CancelResult,
  RefundQuote,
  RefundBreakdownItem,
  RefundQuoteResult,
} from './polarhub-service-prebooking';

// Post-Booking Functions
export {
  getOrderQuote,
  processTicketing,
  getReshopTicketing,
  splitPax,
  changePax,
  ApiError,
  processJourneyChange,
  getJourneyChangeQuote,
  confirmJourneyChange,
} from './polarhub-service-postbooking';
export type {
  ChangePaxParams,
  PaxInfoFromOrder,
  OrderQuoteResult,
  TicketingResult,
  ReshopTicketingResult,
  JourneyChangeResult,
  JourneyChangeQuoteResult,
  JourneyChangeConfirmResult,
} from './polarhub-service-postbooking';

// Ancillary Purchase Functions
export {
  getSeatPurchaseQuote,
  confirmSeatPurchase,
  processSeatPurchase,
  getServicePurchaseQuote,
  addServicePurchase,
  confirmServicePurchase,
  processServicePurchase,
} from './polarhub-service-ancillary';
export type {
  SeatPurchaseQuoteParams,
  SeatPurchaseQuoteResult,
  SeatConfirmParams,
  SeatConfirmResult,
  ProcessSeatPurchaseParams,
  ServicePurchaseQuoteResult,
  ProcessServicePurchaseParams,
  ProcessServicePurchaseResult,
} from './polarhub-service-ancillary';
