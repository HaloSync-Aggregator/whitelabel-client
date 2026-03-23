/**
 * Ancillary service related type definitions
 *
 * ============================================================
 * Service purchase flow
 * ============================================================
 *
 * Prime Booking (at booking - WF_PB_SERVICE):
 * AirShopping → OfferPrice → ServiceList → OfferPrice → OrderCreate
 *
 * Post-Booking Held (pre-ticketing - WF_HELD_SERVICE):
 * OrderRetrieve → ServiceList → OrderQuote → OrderChange
 *
 * Post-Booking Ticketed (post-ticketing - WF_TKT_SERVICE):
 * OrderRetrieve → ServiceList → OrderQuote → OrderChange
 *
 * ============================================================
 */

// ============================================================
// Service categories
// ============================================================

export type ServiceCategory = 'baggage' | 'cabin' | 'lounge' | 'meal' | 'other';

/**
 * ServiceCode → Category mapping
 */
export const SERVICE_CODE_CATEGORY: Record<string, ServiceCategory> = {
  // Checked baggage
  XBAG: 'baggage',
  MBAG: 'baggage',
  ABAG: 'baggage',
  FBAG: 'baggage',
  BBAG: 'baggage',
  BULK: 'baggage',
  PIEC: 'baggage',
  HEAV: 'baggage',
  PDBG: 'baggage',
  XHBG: 'baggage',
  // TR (Scoot) pattern
  BG20: 'baggage',
  BG25: 'baggage',
  BG30: 'baggage',
  BG35: 'baggage',
  BG40: 'baggage',
  // Cabin baggage
  CBAG: 'cabin',
  HBAG: 'cabin',
  // Lounge
  LOUNGE: 'lounge',
  // In-flight meal (IATA Special Meal Codes)
  MEAL: 'meal',
  MLXX: 'meal',
  AVML: 'meal', // Asian Vegetarian / Indian Hindu Vegetarian
  BBML: 'meal', // using Ba Meal
  BLML: 'meal', // Bland Meal
  CHML: 'meal', // Child Meal
  DBML: 'meal', // Diabetic Meal
  FPML: 'meal', // Fruit Platter
  GFML: 'meal', // Gluten-free Meal
  HNML: 'meal', // Hindu Non-Vegetarian
  KSML: 'meal', // Kosher Meal
  LCML: 'meal', // Low Calorie Meal
  LFML: 'meal', // Low Fat Meal
  LSML: 'meal', // Low Sodium Meal
  MOML: 'meal', // Muslim Meal
  NLML: 'meal', // No Lactose Meal
  RVML: 'meal', // Raw Vegetarian
  SFML: 'meal', // Seafood Meal
  SPML: 'meal', // Special Meal (generic)
  VGML: 'meal', // Vegetarian Vegan
  VJML: 'meal', // Vegetarian Jain
  VLML: 'meal', // Vegetarian Lacto-Ovo
  VOML: 'meal', // Vegetarian Oriental
};

/**
 * Category code patterns (BG* etc.)
 */
export function getServiceCategory(serviceCode: string): ServiceCategory {
  // Exact match
  if (SERVICE_CODE_CATEGORY[serviceCode]) {
    return SERVICE_CODE_CATEGORY[serviceCode];
  }
  // Pattern match
  if (serviceCode.startsWith('BG')) return 'baggage';
  if (serviceCode.startsWith('LNG')) return 'lounge';
  if (serviceCode.startsWith('ML')) return 'meal';
  return 'other';
}

// ============================================================
// Service items
// ============================================================

/**
 * BookingInstructions type
 * Weight-based baggage service (XBAG, etc.)from Use
 */
export interface BookingInstructions {
  ssrCode?: string[];
  text?: string[];
  // Method: Pattern when weight input is needed (e.g.: "TTL\\s?%WVAL%KG")
  method?: string;
  // OsiText: Pass through Method pattern as-is (e.g.: ["WVAL", "[0-9]{1,3}"])
  osiText?: string[];
}

/**
 * Individual Service info
 */
export interface ServiceItem {
  serviceId: string;
  offerItemId: string;
  serviceCode: string;
  serviceName: string;
  serviceNameKr: string;
  description: string;
  category: ServiceCategory;
  categoryLabel: string;
  // Weight/count
  weightOrCount: string;
  // Price
  price: number;
  currency: string;
  // Eligibility
  eligibleSegments: string[]; // ICN-SIN, SIN-ICN
  eligiblePax: string[]; // PAX1, PAX2
  // Status
  status?: string; // HN, HD, HI, HK
  statusLabel?: string;
  // Whether weight input is needed (BookingInstructions.Method Exists time)
  requiresWeightInput?: boolean;
  // Original BookingInstructions (OfferPrice when Request Required)
  bookingInstructions?: BookingInstructions;
}

/**
 * Selected service
 */
export interface SelectedService {
  serviceId: string;
  offerItemId: string;
  serviceCode: string;
  serviceName: string;
  category: ServiceCategory;
  paxId: string;
  passengerName: string;
  segmentId: string;
  segmentLabel: string;
  quantity: number;
  price: number; // Weight-based: unit price × weightValue
  currency: string;
  // XBAG, etc. For weight-specified services
  // Included in OfferPrice request when weight is entered
  weightValue?: number; // Entered weight (kg)
  // ⚠️ Middleware spec: ositext (lowercase t)
  bookingInstructions?: {
    text: string[]; // e.g.: ["TTL10KG"]
    ositext?: string[]; // Method Original (e.g.: ["TTL\\s?%WVAL%KG"])
  };
}

// ============================================================
// ServiceList API response Conversion Result
// ============================================================

export interface ServiceListData {
  transactionId: string;
  responseId: string;
  owner: string;
  offerId: string;
  // Service list by category
  services: {
    baggage: ServiceItem[];
    cabin: ServiceItem[];
    lounge: ServiceItem[];
    meal: ServiceItem[];
    other: ServiceItem[];
  };
  // All services (flat)
  allServices: ServiceItem[];
  // For subsequent API calls
  _apiData: {
    transactionId: string;
    responseId: string;
    offerId: string;
    owner: string;
    alaCarteOfferItems: Array<{
      offerItemId: string;
      serviceId: string;
      price: number;
      currency: string;
      paxRefId?: string[];
      segmentRefId?: string[];
    }>;
  };
}

// ============================================================
// Airline-specific settings
// ============================================================

/**
 * Ancillary service unSupported carriers
 */
export const CARRIERS_SERVICE_UNSUPPORTED = ['AA', 'BA', 'KE'];

/**
 * Baggage Service unSupported carriers
 */
export const CARRIERS_BAGGAGE_UNSUPPORTED = ['AA', 'BA', 'KE'];

/**
 * Weight-based services (BookingInstructions required)
 */
export const WEIGHT_BASED_SERVICE_CODES = ['XBAG'];

/**
 * Airline-specific baggage service codes
 */
export const CARRIER_BAGGAGE_CODES: Record<string, string[]> = {
  LH: ['MBAG', 'ABAG', 'FBAG'],
  LX: ['MBAG', 'ABAG', 'FBAG'],
  OS: ['MBAG', 'ABAG', 'FBAG'],
  SQ: ['XBAG', 'BULK', 'PIEC', 'HEAV'],
  AF: ['ABAG', 'BBAG', 'CBAG'],
  KL: ['ABAG', 'BBAG', 'CBAG'],
  TR: ['BG20', 'BG25', 'BG30', 'BG35', 'BG40'],
  EK: ['XBAG'],
  AY: ['PDBG', 'XHBG'],
};

// ============================================================
// Category labels
// ============================================================

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  baggage: 'Checked Baggage',
  cabin: 'Cabin Baggage',
  lounge: 'Lounge',
  meal: 'In-flight Meal',
  other: 'Other Services',
};

// ============================================================
// Service name Korean Conversion
// ============================================================

export const SERVICE_NAME_KR: Record<string, string> = {
  'ADDITIONAL BAGGAGE': 'Added Baggage',
  'PREPAID BAGS': 'Prepaid Baggage',
  'CHECK-IN BAGGAGE': 'Checked Baggage',
  'EXTRA BAGGAGE': 'Added Baggage',
  'SKI EQUIPMENT': 'Ski Equipment',
  'GOLF EQUIPMENT': 'Golf Equipment',
  'LOUNGE ACCESS': 'Lounge Access',
  'PRIORITY BOARDING': 'Priority Boarding',
  'MEAL': 'In-flight Meal',
  'SPECIAL MEAL': 'Special Meal',
};

/**
 * Service name Korean Conversion
 */
export function getServiceNameKr(serviceName: string): string {
  const upperName = serviceName.toUpperCase();
  if (SERVICE_NAME_KR[upperName]) {
    return SERVICE_NAME_KR[upperName];
  }
  // Partial match
  for (const [key, value] of Object.entries(SERVICE_NAME_KR)) {
    if (upperName.includes(key)) return value;
  }
  return serviceName;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Weight/count Extract
 */
export function extractWeightOrCount(description: string): string {
  // Weight: 23KG, 23 KG
  const weightMatch = description.match(/(\d+)\s*KG/i);
  if (weightMatch) return `${weightMatch[1]}KG`;

  // Count: 1PC, 1 piece
  const pieceMatch = description.match(/(\d+)\s*(PC|PIECE)/i);
  if (pieceMatch) return `${pieceMatch[1]}PC`;

  return '';
}

/**
 * Check ancillary service support
 */
export function isServiceSupported(carrierCode: string): boolean {
  return !CARRIERS_SERVICE_UNSUPPORTED.includes(carrierCode);
}

/**
 * Check baggage service support
 */
export function isBaggageSupported(carrierCode: string): boolean {
  return !CARRIERS_BAGGAGE_UNSUPPORTED.includes(carrierCode);
}

/**
 * Whether BookingInstructions is needed
 */
export function needsBookingInstructions(serviceCode: string): boolean {
  return WEIGHT_BASED_SERVICE_CODES.includes(serviceCode);
}

/**
 * SSR Status Label
 */
export function getStatusLabel(status?: string): string {
  switch (status) {
    case 'HN': return 'Awaiting Response';
    case 'HD': return 'PurchaseConfirmable';
    case 'HI': return 'Issue Complete';
    case 'HK': return 'Confirmed';
    default: return '';
  }
}
