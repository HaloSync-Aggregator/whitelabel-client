/**
 * Booking Detail type definitions
 *
 * PNR detail page and booking data structure
 */

// Booking status
export type BookingStatus = 'HD' | 'CONFIRMED' | 'TICKETED' | 'CANCELLED';

// ============================================================
// Additional type definitions (passport, mileage, OCN, SSR)
// ============================================================

// APIS information (passport)
export interface ApisInfo {
  passportNumber: string;
  nationality: string; // Two-digit country code (KR, US, etc.)
  expiryDate: string; // YYYY-MM-DD
}

// Mileage information
export interface FfnInfo {
  programCode: string; // Carrier code (KE, OZ, etc.)
  memberNumber: string; // Member number
}

// OCN item (Order Change Notice - AF/KL only)
export interface OcnItem {
  actionType: string; // CANCEL, MODIFY, SCHEDULE_CHANGE
  context: string; // Context number (001, 002, etc.)
  description?: string; // Description text
  receivedAt: string; // ISO8601 format received datetime
}

// ============================================================
// SSR Item (⭐ v3.9 Enhanced: OrderItem to Pax to Segment hierarchy)
// ============================================================

/**
 * Service detail information (individual service)
 */
export interface ServiceDetail {
  serviceId: string; // Service ID
  serviceDefinitionRefId?: string; // ServiceDefinition Reference ID
  serviceName: string; // Service name (e.g.: "Seat 10A", "Extra Baggage 23kg")
  serviceType?: 'SEAT' | 'BAGGAGE' | 'MEAL' | 'LOUNGE' | 'OTHER'; // Service type
  description?: string; // Detailed description
  // Seat information (Service type SEAT Case)
  seatInfo?: {
    row: string;
    column: string;
    seatNumber: string; // "10A" Format
  };
  // Baggage information (Service type BAGGAGE Case)
  baggageInfo?: {
    weight?: number;
    unit?: string; // "KG" etc.
    pieces?: number;
  };
  // Price information
  price?: {
    amount: number;
    currency: string;
  };
  status: string; // HK, HD, HI, HN
  statusLabel: string; // Status label
}

/**
 * Service group by segment
 */
export interface SegmentServiceGroup {
  segmentId: string;
  segmentLabel: string; // "ICN → SIN" Format
  departureAirport: string;
  arrivalAirport: string;
  flightNumber?: string;
  services: ServiceDetail[];
}

/**
 * Service group by passenger
 */
export interface PaxServiceGroup {
  paxId: string;
  paxName: string; // "HONG/GILDONG" Format
  ptc: string; // ADT, CHD, INF
  ptcLabel: string; // Adult, Child, Infant
  segments: SegmentServiceGroup[];
}

/**
 * Service group by OrderItem
 * OrderItem to Pax to Segment hierarchy
 */
export interface ServiceOrderItemGroup {
  orderItemId: string;
  owner?: string; // Carrier code
  statusCode?: string; // OrderItem Status
  statusLabel?: string; // Status label
  totalPrice?: {
    amount: number;
    currency: string;
  };
  passengers: PaxServiceGroup[];
}

/**
 * SSR item (for backward compatibility - flat structure)
 */
export interface SsrItem {
  paxId: string; // PAX Reference ID
  paxName: string; // "HONG/GILDONG (ADT)" Format
  segment: string; // "ICN-SIN" Format
  ssrName: string; // "Seat Reservation 10A"
  status: string; // HK, HD, HI, HN
  statusLabel: string; // Status label
}

// ============================================================
// OrderItem detail info (for subsequent API calls) ⭐ v3.5 Add
// ============================================================

/**
 * OrderItem type
 * - FLIGHT: Ticket (has FareDetail.PaxRefID)
 * - SERVICE: Ancillary services (has Service array, seat/baggage etc.)
 */
export type OrderItemType = 'FLIGHT' | 'SERVICE';

/**
 * OrderItem details
 * Used when selecting specific OrderItems in subsequent APIs (journey change, cancel, refund, etc.)
 */
export interface OrderItemInfo {
  orderItemId: string;
  type: OrderItemType;
  owner?: string;
  statusCode?: string;
  paxRefIds: string[];
  paxSegmentRefIds: string[];
  paxJourneyRefIds: string[];
  // Ticket information (type === 'FLIGHT')
  fareInfo?: {
    baseFare: number;
    taxes: number;
    total: number;
    currency: string;
  };
  // Service information (type === 'SERVICE')
  serviceInfo?: {
    serviceId: string;
    serviceName: string;
    serviceDefinitionRefId?: string;
    seatInfo?: { row: string; column: string }; // When selecting seat
    price: number;
    currency: string;
  };
}

// ============================================================
// Penalty information (⭐ v3.7 Enhanced: Departure before/after Fee Split)
// ============================================================

/**
 * Fee amount range
 * If min/max are equal, fixed amount; if different, show range
 */
export interface FeeAmount {
  min: number;
  max: number;
  currency: string;
}

/**
 * Fee by timing (before/after departure)
 * Application.Code: "1" = Departure before, "2" = Departure after(no-show Include)
 */
export interface TimedFee {
  beforeDeparture: FeeAmount | null; // Pre-departure fee
  afterDeparture: FeeAmount | null; // Post-departure fee
}

/**
 * Penalty information
 * PriceBreakdown.tsx and Same Structure (OfferPriceRS and unified)
 */
export interface PenaltyInfo {
  canChange: boolean; // Whether change is allowed
  canRefund: boolean; // Whether refund is allowed
  changeFee?: TimedFee | null; // Change fee (before/after departure)
  cancelFee?: TimedFee | null; // Cancel fee (before/after departure)
}

// Main Interface: BookingDetail
export interface BookingDetail {
  // Header information
  orderId: string;
  pnr: string;
  carrierCode: string;
  carrierName: string;
  status: BookingStatus;
  statusLabel: string;
  paymentTimeLimit?: string;
  ticketingTimeLimit?: string;
  isTicketed: boolean;
  // ⚠️ isPaid: TR, etc. Partial Carrier Payment after in also Ticket None
  // PaymentList not emptyexistsif Payment Complete Status
  isPaid?: boolean;
  createdAt?: string;

  // Passenger information
  passengers: PassengerInfo[];

  // Itinerary information
  itineraries: ItineraryInfo[];

  // Price information
  price: PriceInfo;

  // Ancillary service charges (separated from ticket fare) ⭐
  serviceCharges?: ServiceChargeItem[];

  // Penalty information (⭐ v3.6)
  penaltyInfo?: PenaltyInfo;

  // Ticket information (after ticketing)
  tickets?: TicketInfo[];

  // SSR information (ancillary services) - ⭐ v3.9 Enhanced
  ssrList?: SsrItem[]; // Existing flat structure (for compatibility)
  serviceGroups?: ServiceOrderItemGroup[]; // ⭐ v3.9: Hierarchy (OrderItem → Pax → Segment)
  hasPendingSsr?: boolean;

  // OCN information (AF/KL only)
  ocnList?: OcnItem[];
  showOcnAgreeButton?: boolean;

  // Action button state
  actions: ActionState;

  // ⭐ v3.10: Modifiable passenger information items
  allowedPaxChanges?: AllowedPaxChanges;

  // Original data for subsequent API calls
  _orderData: {
    transactionId: string;
    orderId: string;
    owner: string;
    orderItemIds: string[];
    // ⭐ v3.5: OrderItem details (Air ticket/Service Distinction, Subsequent API)
    orderItems?: OrderItemInfo[];
    // v3.24: PaxJourney-based data for Journey Change
    paxJourneys?: PaxJourneyData[];
  };
}

// v3.24: PaxJourney data for Journey Change
export interface PaxJourneyData {
  paxJourneyId: string;
  onPoint: string;
  offPoint: string;
  flightTime?: string;
  paxSegmentRefIds: string[];
  /** Service IDs on segments belonging to this journey */
  serviceIds: string[];
  /** OrderItem ID this journey belongs to */
  orderItemId: string;
}

// ⚠️ v3.13.0: Contact detail information (ContactInfoRefID based)
export interface ContactDetail {
  contactInfoId: string; // ContactInfoID (e.g., "CTCPAX2_1")
  phones: PhoneDetail[]; // Phone number list
  emails: EmailDetail[]; // Email list
  postalAddresses?: PostalAddressDetail[]; // Address list
}

export interface PhoneDetail {
  phoneNumber: string; // Phone number
  countryDialingCode?: string; // Country code (e.g., "82")
  label?: string; // label (e.g., "Mobile", "Home")
  formatted?: string; // Formatted number (e.g., "+82-10-1234-5678")
}

export interface EmailDetail {
  emailAddress: string; // Email address
  label?: string; // label (e.g., "Primary", "Work")
}

export interface PostalAddressDetail {
  street?: string[];
  cityName?: string;
  postalCode?: string;
  countryCode?: string;
}

// Passenger information
export interface PassengerInfo {
  paxId: string;
  ptc: 'ADT' | 'CHD' | 'INF';
  ptcLabel: string;
  title?: string;
  fullName: string;
  property: string;
  givenName: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE';
  // ⚠️ v3.13.0: Existing single contact (backward compatibility)
  mobile?: string;
  email?: string;
  ticketNumber?: string;
  // ⚠️ NDC Spec section 4.2: OrderViewRS's Existing ContactInfoRefID List (Contact when ADD Required!)
  contactInfoRefIds?: string[];
  // ⚠️ v3.13.0: Contact detail information (Multiple contacts/emails supported)
  // per ContactInfoRefID Detail Information containing exists pax-when change Accurate RefID selection possible
  contactDetails?: ContactDetail[];
  // Add Information
  apisInfo?: ApisInfo; // Passport information
  ffn?: FfnInfo; // Mileage information
  docaInfo?: DocaInfo; // Address information (DOCA)
  accompanyingInfant?: string; // Accompanying infant name (for adult)
}

// Address information (DOCA)
export interface DocaInfo {
  street?: string;
  cityName?: string;
  postalCode?: string;
  countryCode?: string;
}

// Itinerary information
export interface ItineraryInfo {
  journeyId: string;
  direction: 'outbound' | 'inbound';
  directionLabel: string;
  segments: SegmentInfo[];
}

// Segment information
export interface SegmentInfo {
  segmentId: string;
  segmentNo: number;
  carrierCode: string;
  flightNumber: string;
  aircraft?: string;
  departure: {
    airport: string;
    airportName?: string;
    date: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    airportName?: string;
    date: string;
    time: string;
    terminal?: string;
  };
  duration?: string;
  cabinClass?: string;
  cabinCode?: string;
  bookingClass?: string;
  priceClass?: string; // Fare class (Y, M, L, etc.)
  baggage?: string;
  hiddenStops?: string; // Stopover (NRT, etc.)
  status: string;
  statusLabel: string;
  isCodeShare?: boolean;
  operatingCarrier?: string;
}

// Price information
export interface PriceInfo {
  currency: string;
  totalAmount: number;
  baseFare: number;
  taxes: number;
  passengerBreakdown: Array<{
    ptc: string;
    ptcLabel: string;
    count: number;
    baseFare: number;
    taxes: number;
    subtotal: number;
  }>;
  formattedTotal: string;
}

// Ancillary service charge item
export interface ServiceChargeItem {
  label: string; // Service name (e.g.: "Seat 10A", "Baggage 23kg")
  paxName: string; // Passenger name (e.g.: "HONG/GILDONG")
  segment: string; // Segment (e.g.: "ICN-SIN")
  amount: number; // Amount
  count?: number; // Quantity (default 1)
}

// Ticket information
export interface TicketInfo {
  ticketNumber: string;
  type: 'TICKET' | 'EMD-A' | 'EMD-S';
  typeLabel: string;
  paxId: string;
  passengerName: string;
  issuedDate?: string;
  segments?: string[];
  serviceName?: string;
  totalFare?: number;
  currency?: string;
}

// Action button state
export interface ActionState {
  canPay: boolean;
  canCancel: boolean;
  canVoidRefund: boolean;
  canChangeJourney: boolean;
  canChangeInfo: boolean;
  canPurchaseService: boolean;
}

// ============================================================
// Passenger information change support info (⭐ v3.10.1)
// ============================================================

/**
 * Passenger Change Operation mode
 * - MODIFY_ONLY: Change only (AF, KL)
 * - ADD_DELETE_ONLY: Add/delete only (AY)
 * - ALL: Add/delete/change all supported (HA, TK)
 */
export type PaxChangeMode = 'MODIFY_ONLY' | 'ADD_DELETE_ONLY' | 'ALL';

/**
 * Individual Operation type
 */
export type PaxActionType = 'ADD' | 'DELETE' | 'MODIFY';

/**
 * Modifiable passenger information items Summary (UI Display)
 */
export interface AllowedPaxChanges {
  canChangeName: boolean;
  canChangeContact: boolean;
  canChangeApis: boolean;
  canChangeFfn: boolean;
  canChangeDoca: boolean;
  /** Operation mode */
  mode: PaxChangeMode;
  /** Allowed operation types */
  allowedActions: PaxActionType[];
}

// Feature support by carrier
export interface CarrierFeatures {
  infoChange: boolean;
  paxSplit: boolean;
  journeyChange: boolean;
  voidRefund: boolean;
}

// ============================================================
// PriceSummary for Component Type
// ============================================================

/**
 * Payment information by passenger (Used in PriceSummary)
 */
export interface PaymentInfo {
  paxId: string;
  ptc: string; // ADT, CHD, INF
  ptcLabel: string; // Adult, Child, Infant
  baseFare: number;
  taxes: number;
  totalFare: number;
  currency: string;
}

/**
 * Title option type
 */
export type TitleCode = 'MR' | 'MRS' | 'MS' | 'MSTR' | 'MISS';

export interface TitleOption {
  value: TitleCode;
  label: string;
}
