/**
 * Journey Change type definitions
 *
 * ============================================================
 * Per carrier Flow
 * ============================================================
 *
 * | Group | Carrier | Step 2-1 (Retrieval) | Step 2-2 (Reprice/Quote) | Step 3 (Change) |
 * |------|--------|----------------|--------------------------|---------------|
 * | A | QR, TK | OrderReshop | OrderReshop (Reprice) | OrderChange |
 * | B | AF, KL | OrderReshop | OrderReshop (Reprice) | OrderChange x2|
 * | C | SQ, AY, KE, HA | OrderReshop | OrderQuote | OrderChange |
 *
 * Middleware API camelCase Field name Use.
 * PolarHub Directly Call Log(PascalCase) differs!
 */

// ============================================================
// Carrier-specific pattern definitions
// ============================================================

/**
 * Journey change patterns (3 types)
 * - A: OrderReshop → Reprice → OrderChange (QR, TK)
 * - B: OrderReshop → Reprice → OrderChange x2 (AF, KL)
 * - C: OrderReshop → OrderQuote → OrderChange (SQ, AY, KE, HA)
 */
export type JourneyChangePattern = 'A' | 'B' | 'C';

/**
 * Change mode
 */
export type JourneyChangeMode = 'change' | 'add' | 'delete';

/**
 * Settings by pattern
 */
export interface JourneyPatternConfig {
  pattern: JourneyChangePattern;
  /** Quote API Type */
  quoteApi: 'ORDER_RESHOP_REPRICE' | 'ORDER_QUOTE';
  /** OrderChange Step */
  orderChangeSteps: 1 | 2;
  /** Pre-ticketing support */
  supportsHeld: boolean;
  /** Post-ticketing support */
  supportsTicketed: boolean;
  /** One-way/multi-segment support */
  supportsOneWay: boolean;
  /** Journey add/delete support (only HA, TK) */
  supportsAddDelete: boolean;
  /** Payment method */
  paymentTypes: ('Card' | 'Cash' | 'Voucher')[];
}

/**
 * Per carrier Pattern Configuration
 */
export const JOURNEY_CHANGE_CONFIG: Record<string, JourneyPatternConfig> = {
  // Pattern A: OrderReshop Reprice + 1Step OrderChange
  QR: {
    pattern: 'A',
    quoteApi: 'ORDER_RESHOP_REPRICE',
    orderChangeSteps: 1,
    supportsHeld: false,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash'],
  },
  TK: {
    pattern: 'A',
    quoteApi: 'ORDER_RESHOP_REPRICE',
    orderChangeSteps: 1,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: true, // TK supports add/delete
    paymentTypes: ['Card', 'Cash'],
  },

  // Pattern B: OrderReshop Reprice + 2Step OrderChange
  AF: {
    pattern: 'B',
    quoteApi: 'ORDER_RESHOP_REPRICE',
    orderChangeSteps: 2,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: false,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash', 'Voucher'],
  },
  KL: {
    pattern: 'B',
    quoteApi: 'ORDER_RESHOP_REPRICE',
    orderChangeSteps: 2,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: false,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash', 'Voucher'],
  },

  // Pattern C: OrderQuote + 1Step OrderChange
  SQ: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash'],
  },
  AY: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash'],
  },
  KE: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: false,
    paymentTypes: ['Card', 'Cash'],
  },
  HA: {
    pattern: 'C',
    quoteApi: 'ORDER_QUOTE',
    orderChangeSteps: 1,
    supportsHeld: true,
    supportsTicketed: true,
    supportsOneWay: true,
    supportsAddDelete: true, // HA supports add/delete
    paymentTypes: ['Card', 'Cash'],
  },
};

/**
 * Journey change supported carrier list
 */
export const JOURNEY_CHANGE_SUPPORTED_CARRIERS = [
  'AF', 'AY', 'HA', 'KE', 'KL', 'QR', 'SQ', 'TK'
] as const;

/**
 * Unsupported carriers (NDC not supported)
 */
export const JOURNEY_CHANGE_UNSUPPORTED_CARRIERS = [
  'EK', 'LH', 'AA', 'AS', 'BA'
] as const;

// ============================================================
// API Request Types (Middleware camelCase)
// ============================================================

/**
 * Origin/destination information
 */
export interface OriginDest {
  origin: string; // Departure airport code (3 chars)
  destination: string; // Destination airport code (3 chars)
  departureDate: string; // YYYY-MM-DD
}

/**
 * OrderItem info to delete
 */
export interface DeleteItem {
  orderItemRefId: string; // OrderItemID to delete
  retainServiceId?: string[]; // ServiceID list to retain
}

/**
 * OrderReshop Request (Middleware)
 */
export interface OrderReshopRequest {
  transactionId: string;
  orderId: string;
  actionContext?: string; // "8"=Voluntary, "9"=Involuntary
  updateOrder: {
    reshopOrder: {
      serviceOrder: {
        add: {
          originDestList: OriginDest[];
          cabin?: string; // Y, W, C, F
        };
        delete: DeleteItem[];
      };
    };
  };
  pointOfSale?: string;
}

/**
 * OrderReshop Reprice Request (Middleware - TK/QR/AF/KL)
 */
export interface OrderReshopRepriceRequest {
  transactionId: string;
  orderId: string;
  requestType: 'reprice';
  selectedOffer: SelectedOffer[];
  affect: AffectItem[];
  pointOfSale?: string;
}

/**
 * Affect item (for Reprice)
 */
export interface AffectItem {
  orderItemRefId: string;
  retainServiceId: string[];
}

/**
 * Selected Offer
 */
export interface SelectedOffer {
  offerId: string;
  owner: string;
  responseId: string;
  offerItems: OfferItem[];
}

/**
 * Offer Item
 */
export interface OfferItem {
  offerItemId: string;
  paxRefId: string[];
}

/**
 * OrderQuote Request (Middleware - SQ/AY/KE/HA)
 */
export interface JourneyQuoteRequest {
  transactionId: string;
  orderId: string;
  selectedOffer: SelectedOffer[];
  affect?: AffectItem[];
  pointOfSale?: string;
}

/**
 * OrderChange Request (Middleware)
 */
export interface JourneyChangeConfirmRequest {
  transactionId: string;
  orderId: string;
  changeOrderChoice: {
    acceptSelectedQuotedOfferList: {
      selectedPricedOffer: SelectedOffer[];
    };
  };
  paymentList?: PaymentItem[];
  pointOfSale?: string;
}

/**
 * OrderChange 2 Request (AF/KL - with FOP)
 */
export interface JourneyChangeConfirmSecondRequest {
  transactionId: string;
  orderId: string;
  changeOrderChoice: {
    acceptRepricedOrder: {
      offerRefId: string[]; // OrderID Use
    };
  };
  paymentList: PaymentItem[];
  pointOfSale?: string;
}

/**
 * Payment item
 */
export interface PaymentItem {
  type: 'Card' | 'Cash' | 'Voucher';
  amount: number;
  curCode: string;
  orderItemId?: string[];
  offerItemId?: string[];
  paxRefId?: string[];
  // Card only
  cardCode?: string;
  cardNumber?: string;
  cardHolderName?: string;
  expiration?: string;
  seriesCode?: string;
  // Voucher only
  voucherId?: string;
}

// ============================================================
// API Response Types
// ============================================================

/**
 * Reshop Offer (search result)
 */
export interface ReshopOffer {
  responseId: string;
  offerId: string;
  owner: string;
  totalPrice: {
    totalAmount: {
      amount: number;
      curCode: string;
    };
  };
  priceDifference?: {
    amount: number;
    curCode: string;
  };
  offerItems: OfferItem[];
  /** Flight information (for UI display) */
  flights?: ReshopFlight[];
}

/**
 * Reshop Flight information (for UI)
 */
export interface ReshopFlight {
  segmentKey: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabin: string;
  stops: number;
}

/**
 * OrderReshop Response
 */
export interface OrderReshopResponse {
  success: boolean;
  transactionId?: string;
  reshopOffers?: ReshopOffer[];
  error?: string;
}

/**
 * OrderQuote Response (Journey Change)
 */
export interface JourneyQuoteResponse {
  success: boolean;
  responseId?: string;
  quotedOffer?: {
    offerId: string;
    owner: string;
    totalPrice: {
      totalAmount: {
        amount: number;
        curCode: string;
      };
    };
    offerItems: OfferItem[];
  };
  error?: string;
}

/**
 * OrderChange Response
 */
export interface JourneyChangeResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  /** AF/KL: Whether 2nd call is required */
  requiresSecondCall?: boolean;
  error?: string;
}

// ============================================================
// UI State Types
// ============================================================

/**
 * ItineraryChange Modal Step
 */
export type JourneyChangeStep =
  | 'select'   // Step 1: Itinerary selection and change mode
  | 'search'   // Step 2: Search/query new itinerary
  | 'confirm'  // Step 3: Confirm difference and payment
  | 'loading'  // Loading
  | 'result';  // Complete/Failed

/**
 * Segment info within a PaxJourney (for UI display)
 */
export interface JourneySegmentInfo {
  segmentId: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  status: string;
}

/**
 * Current Itinerary information (PaxJourney-based, from OrderRetrieve)
 *
 * v3.24: Changed from segment-based to PaxJourney-based.
 * Each entry represents one PaxJourney (e.g., ICN→CDG via connecting flights).
 * A PaxJourney may contain multiple segments (connecting flights).
 */
export interface CurrentItinerary {
  /** PaxJourney ID (PJ1, PJ2, etc.) */
  paxJourneyId: string;
  /** OrderItem ID this journey belongs to */
  orderItemId: string;
  /** Journey origin (OnPoint) */
  origin: string;
  /** Journey destination (OffPoint) */
  destination: string;
  /** First segment departure date */
  departureDate: string;
  /** First segment departure time */
  departureTime: string;
  /** Last segment arrival time */
  arrivalTime: string;
  /** Total flight time (e.g., PT14H20M) */
  flightTime?: string;
  /** Marketing carrier of first segment */
  carrierCode: string;
  /** Flight number of first segment */
  flightNumber: string;
  /** Status */
  status: string;
  /** All segments in this journey (for multi-segment display) */
  segments: JourneySegmentInfo[];
  /** Service IDs on segments of this journey (for RetainServiceID) */
  serviceIds: string[];
}

/**
 * Search criteria
 */
export interface JourneySearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  cabin: string;
}

/**
 * ItineraryChange Modal All/Total Status
 */
export interface JourneyChangeState {
  step: JourneyChangeStep;

  // Step 1: Itinerary selection
  currentItineraries: CurrentItinerary[];
  selectedOrderItemIds: string[];
  changeMode: JourneyChangeMode;

  // Step 2: Search and results
  searchCriteria: JourneySearchCriteria | null;
  reshopOffers: ReshopOffer[];
  selectedOffer: ReshopOffer | null;

  // Step 3: Confirmation and payment
  quotedPrice: {
    amount: number;
    curCode: string;
  } | null;
  priceDifference: {
    amount: number;
    curCode: string;
  } | null;
  paymentMethod: 'Card' | 'Cash' | 'Voucher' | null;

  // Common state
  loading: boolean;
  error: string | null;
}

// ============================================================
// FE API Route Request/Response Types
// ============================================================

/**
 * /booking/[id]/journey-change POST Request
 */
export interface JourneyChangeAPIRequest {
  transactionId: string;
  changeMode: JourneyChangeMode;
  originDestList: OriginDest[];
  deleteItems: DeleteItem[];
  cabin?: string;
}

/**
 * /booking/[id]/journey-change POST Response
 */
export interface JourneyChangeAPIResponse {
  success: boolean;
  reshopOffers?: ReshopOffer[];
  error?: string;
}

/**
 * /booking/[id]/journey-change/quote POST Request
 */
export interface JourneyQuoteAPIRequest {
  transactionId: string;
  selectedOffer: SelectedOffer;
  /** TK/QR/AF/KL: for Reprice */
  affect?: AffectItem[];
  /** TK/QR/AF/KL: Reprice Mode */
  isReprice?: boolean;
}

/**
 * /booking/[id]/journey-change/quote POST Response
 */
export interface JourneyQuoteAPIResponse {
  success: boolean;
  responseId?: string;
  offerId?: string;
  totalPrice?: number;
  currency?: string;
  priceDifference?: number;
  offerItems?: OfferItem[];
  error?: string;
}

/**
 * /booking/[id]/journey-change/confirm POST Request
 */
export interface JourneyConfirmAPIRequest {
  transactionId: string;
  carrierCode: string;
  selectedOffer: SelectedOffer;
  payment?: {
    type: 'Card' | 'Cash' | 'Voucher';
    amount: number;
    curCode: string;
    card?: {
      cardCode: string;
      cardNumber: string;
      cardHolderName: string;
      expiration: string;
      seriesCode?: string;
    };
    voucher?: {
      voucherId: string;
    };
  };
  /** AF/KL: 2 Call Whether */
  isSecondCall?: boolean;
}

/**
 * /booking/[id]/journey-change/confirm POST Response
 */
export interface JourneyConfirmAPIResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  /** AF/KL: Whether 2nd call is required */
  requiresSecondCall?: boolean;
  error?: string;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get carrier-specific pattern settings
 */
export function getJourneyChangeConfig(carrierCode: string): JourneyPatternConfig | null {
  return JOURNEY_CHANGE_CONFIG[carrierCode] || null;
}

/**
 * ItineraryChange Support Whether
 */
export function supportsJourneyChange(carrierCode: string): boolean {
  return JOURNEY_CHANGE_SUPPORTED_CARRIERS.includes(
    carrierCode as typeof JOURNEY_CHANGE_SUPPORTED_CARRIERS[number]
  );
}

/**
 * Pre-ticketing journey change support
 */
export function supportsHeldJourneyChange(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.supportsHeld ?? false;
}

/**
 * Post-ticketing journey change support
 */
export function supportsTicketedJourneyChange(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.supportsTicketed ?? false;
}

/**
 * One-way/multi-segment journey change support
 */
export function supportsOneWayJourneyChange(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.supportsOneWay ?? false;
}

/**
 * Whether OrderQuote is required (Pattern C)
 */
export function requiresOrderQuote(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.quoteApi === 'ORDER_QUOTE';
}

/**
 * Whether OrderReshop Reprice is required (Pattern A/B)
 */
export function requiresReshopReprice(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.quoteApi === 'ORDER_RESHOP_REPRICE';
}

/**
 * Whether two-step OrderChange is required (Pattern B: AF/KL)
 */
export function requiresTwoStepOrderChange(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.orderChangeSteps === 2;
}

/**
 * ItineraryWhether change is allowed comprehensive Judgment
 */
export function canChangeJourney(
  carrierCode: string,
  isTicketed: boolean,
  tripType: 'RT' | 'OW' | 'MC'
): { canChange: boolean; reason?: string } {
  // Check supported carriers
  if (!supportsJourneyChange(carrierCode)) {
    return { canChange: false, reason: `${carrierCode} airline does not support journey change.` };
  }

  const config = getJourneyChangeConfig(carrierCode)!;

  // Check ticketing status
  if (isTicketed && !config.supportsTicketed) {
    return { canChange: false, reason: 'Journey change is not available for ticketed bookings.' };
  }
  if (!isTicketed && !config.supportsHeld) {
    return { canChange: false, reason: 'Journey change is only available after ticketing.' };
  }

  // Check journey type (AF/KL Round Trip)
  if (tripType !== 'RT' && !config.supportsOneWay) {
    return { canChange: false, reason: 'Only round trip itineraries can be changed.' };
  }

  return { canChange: true };
}

/**
 * Success Response Code Confirm
 */
export function isSuccessCode(code?: string): boolean {
  if (!code) return true;
  return ['OK', '0', '00000', 'SUCCESS'].includes(code);
}

/**
 * Delete Array Build (Change/Delete Mode)
 *
 * v3.24: PaxJourney-based RetainServiceID logic.
 * RetainServiceID = services on segments of NON-selected journeys within the same OrderItem.
 * When all journeys in an OrderItem are selected, RetainServiceID is empty.
 *
 * @param itineraries All current journeys
 * @param selectedJourneyIds Selected PaxJourney IDs to change
 * @param changeMode Change mode
 */
export function buildDeleteItems(
  itineraries: CurrentItinerary[],
  selectedJourneyIds: string[],
  changeMode: JourneyChangeMode
): DeleteItem[] {
  if (changeMode === 'add') {
    return [];
  }

  // Group itineraries by OrderItem
  const orderItemMap = new Map<string, CurrentItinerary[]>();
  for (const itin of itineraries) {
    const existing = orderItemMap.get(itin.orderItemId) || [];
    existing.push(itin);
    orderItemMap.set(itin.orderItemId, existing);
  }

  // For each affected OrderItem, build delete item
  const deleteItems: DeleteItem[] = [];
  const processedOrderItems = new Set<string>();

  for (const journeyId of selectedJourneyIds) {
    const itin = itineraries.find(i => i.paxJourneyId === journeyId);
    if (!itin || processedOrderItems.has(itin.orderItemId)) continue;
    processedOrderItems.add(itin.orderItemId);

    const allJourneysInItem = orderItemMap.get(itin.orderItemId) || [];

    // RetainServiceID = services on NON-selected journeys within this OrderItem
    const retainServiceIds: string[] = [];
    for (const journey of allJourneysInItem) {
      if (!selectedJourneyIds.includes(journey.paxJourneyId)) {
        retainServiceIds.push(...journey.serviceIds);
      }
    }

    deleteItems.push({
      orderItemRefId: itin.orderItemId,
      retainServiceId: retainServiceIds,
    });
  }

  return deleteItems;
}

/**
 * Affect Array Build (Reprice)
 *
 * v3.24: PaxJourney-based. Uses same RetainServiceID logic as buildDeleteItems.
 */
export function buildAffectItems(
  itineraries: CurrentItinerary[],
  selectedJourneyIds: string[]
): AffectItem[] {
  // Same grouping logic as buildDeleteItems
  const orderItemMap = new Map<string, CurrentItinerary[]>();
  for (const itin of itineraries) {
    const existing = orderItemMap.get(itin.orderItemId) || [];
    existing.push(itin);
    orderItemMap.set(itin.orderItemId, existing);
  }

  const affectItems: AffectItem[] = [];
  const processedOrderItems = new Set<string>();

  for (const journeyId of selectedJourneyIds) {
    const itin = itineraries.find(i => i.paxJourneyId === journeyId);
    if (!itin || processedOrderItems.has(itin.orderItemId)) continue;
    processedOrderItems.add(itin.orderItemId);

    const allJourneysInItem = orderItemMap.get(itin.orderItemId) || [];
    const retainServiceIds: string[] = [];
    for (const journey of allJourneysInItem) {
      if (!selectedJourneyIds.includes(journey.paxJourneyId)) {
        retainServiceIds.push(...journey.serviceIds);
      }
    }

    affectItems.push({
      orderItemRefId: itin.orderItemId,
      retainServiceId: retainServiceIds,
    });
  }

  return affectItems;
}

/**
 * Whether carrier supports journey add/delete (only HA, TK)
 */
export function supportsAddDeleteJourney(carrierCode: string): boolean {
  const config = getJourneyChangeConfig(carrierCode);
  return config?.supportsAddDelete ?? false;
}

/**
 * initial Status Create
 */
export function createInitialJourneyChangeState(): JourneyChangeState {
  return {
    step: 'select',
    currentItineraries: [],
    selectedOrderItemIds: [],
    changeMode: 'change',
    searchCriteria: null,
    reshopOffers: [],
    selectedOffer: null,
    quotedPrice: null,
    priceDifference: null,
    paymentMethod: null,
    loading: false,
    error: null,
  };
}
