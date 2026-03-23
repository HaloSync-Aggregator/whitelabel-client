/**
 * Passenger Split related type definitions
 *
 * Workflow:
 * - WF_HELD_SPLIT: Pre-ticketing split
 * - WF_TKT_SPLIT: Post-ticketing split
 *
 * API Flow:
 * OrderRetrieve → OrderChange (reasonCode="DIV") → OrderRetrieve
 *
 * Supported carriers: AY, HA, KL, SQ, TK, TR
 *
 * CRITICAL (v1.2.2): Middleware Request structure
 * - All fields use camelCase!
 * - No Sender, Query wrappers!
 * - reasonCode placed at top level!
 * - paxRefId field completely excluded from paxList (including INF)!
 *
 * restrictionnotes:
 * - Only one passenger at a time (ADT+INF split as a set)
 * - INF cannot be split alone
 * - At least 1 passenger must remain in the original PNR
 * - Cannot merge after split
 */

// ============================================================
// Carrier support constants
// ============================================================

/** Passenger Split Supported carriers */
export const SPLIT_SUPPORTED_CARRIERS = ['AY', 'HA', 'KL', 'SQ', 'TK', 'TR'] as const;

export type SplitSupportedCarrier = typeof SPLIT_SUPPORTED_CARRIERS[number];

// ============================================================
// Splittable passenger types
// ============================================================

/** Splittable passenger info */
export interface SplittablePassenger {
  paxId: string;
  ptc: 'ADT' | 'CHD'; // INF not shown in list
  name: string; // "SURNAME/GIVENNAME" Format
  title?: string; // MR, MS, MSTR, MISS
  /** Accompanying infant info (for ADT) */
  infant?: {
    paxId: string;
    name: string;
    title?: string;
  };
}

// ============================================================
// API request/response types
// ============================================================

/** OrderChange Split request body (frontend → API Route) */
export interface PaxSplitRequestBody {
  /** PaxID of passenger to split (only 1) */
  splitPaxId: string;
}

/** API response */
export interface PaxSplitResult {
  success: boolean;
  /** Newly created PNR (child PNR) */
  newOrderId?: string;
  /** New PNR number */
  newPnr?: string;
  /** Original PNR (parent PNR) */
  parentOrderId: string;
  message: string;
}

// ============================================================
// CRITICAL: Middleware request types (camelCase!)
// Based on OpenAPI spec - Sender/Query No wrapper!
// ============================================================

/**
 * Middleware OrderChange Split request structure
 *
 * CRITICAL (v1.2.0):
 * - All fields use camelCase!
 * - Sender, Query, PointOfSale, TransactionID No wrapper!
 * - reasonCode placed at top level!
 * - paxRefId field completely excluded from paxList (including INF)!
 *
 * @example
 * ```typescript
 * const request: MiddlewarePaxSplitRequest = {
 *   transactionId: '32-char hex',
 *   orderId: 'ORD-123',
 *   reasonCode: 'DIV', // Top-level!
 *   changeOrderChoice: {
 *     updatePax: [{ newPaxRefId: 'PAX1' }]
 *   },
 *   paxList: [...],
 *   contactInfoList: [...],
 *   paymentList: []
 * };
 * ```
 */
export interface MiddlewarePaxSplitRequest {
  transactionId: string;
  orderId: string;
  /** CRITICAL: "DIV" = Split operation identifier (top level!) */
  reasonCode: 'DIV';
  changeOrderChoice: {
    updatePax: Array<{
      /** Split Passenger ID */
      newPaxRefId: string;
    }>;
  };
  /** Full passenger list (including INF) */
  paxList: MiddlewarePaxInfo[];
  contactInfoList: MiddlewareContactInfo[];
  paymentList: unknown[];
}

/** PaxList item (camelCase!) */
export interface MiddlewarePaxInfo {
  paxId: string;
  ptc: 'ADT' | 'CHD' | 'INF';
  individual: {
    individualId?: string;
    birthdate?: string;
    gender?: string;
    nameTitle?: string;
    givenName: string[];
    middleName: string[];
    surname: string;
  };
  contactInfoRefId: string[];
  identityDoc?: Array<{
    identityDocumentNumber?: string;
    identityDocumentType?: string;
    issuingCountryCode?: string;
    citizenshipCountryCode?: string;
    expiryDate?: string;
    gender?: string;
    givenName?: string[];
    middleName?: string[];
    surname?: string;
  }>;
  loyaltyProgramAccount?: unknown[];
}

/** ContactInfoList item (camelCase!) */
export interface MiddlewareContactInfo {
  contactInfoId: string;
  emailAddress?: string[];
  phone?: Array<{
    countryDialingCode?: string;
    /** CRITICAL: Must string! number when Transmission Error */
    phoneNumber?: string;
  }>;
}

/**
 * Middleware Split response structure
 */
export interface MiddlewarePaxSplitResponse {
  transactionId: string;
  response: {
    ResultMessage: {
      Code: string;
      Message?: string;
    };
    Order?: {
      OrderID: string;
      OrderStatus?: string;
      BookingReference?: Array<{
        Id: string;
        AirlineID: string;
        /** "ASSOCIATED_BOOKING" = Parent-child relation */
        Type?: string;
      }>;
    };
  };
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Check if airline supports passenger split
 */
export function supportsPaxSplit(carrierCode: string): boolean {
  return SPLIT_SUPPORTED_CARRIERS.includes(carrierCode as SplitSupportedCarrier);
}

/**
 * Generate splittable passenger list
 * - INF excluded from list (automatically split with ADT)
 * - Cannot select all since at least 1 must remain in original PNR
 *
 * @param passengers Full passenger list
 * @returns Splittable passenger list
 */
export function getSplittablePassengers(
  passengers: Array<{
    paxId: string;
    ptc: string;
    name: string;
    title?: string;
    /** INF's Case Accompanying adult ID */
    paxRefId?: string;
  }>
): SplittablePassenger[] {
  // INF → ADT Mapping (Find accompanying adult)
  const infantMap = new Map<string, { paxId: string; name: string; title?: string }>();
  passengers
    .filter(p => p.ptc === 'INF' && p.paxRefId)
    .forEach(inf => {
      infantMap.set(inf.paxRefId!, {
        paxId: inf.paxId,
        name: inf.name,
        title: inf.title,
      });
    });

  // Return only ADT/CHD excluding INF
  return passengers
    .filter(p => p.ptc === 'ADT' || p.ptc === 'CHD')
    .map(p => ({
      paxId: p.paxId,
      ptc: p.ptc as 'ADT' | 'CHD',
      name: p.name,
      title: p.title,
      infant: infantMap.get(p.paxId),
    }));
}

/**
 * Validate split eligibility
 *
 * @param totalPaxCount Total passenger count (excluding INF)
 * @returns Split eligibility and message
 */
export function canSplit(totalPaxCount: number): { canSplit: boolean; message?: string } {
  if (totalPaxCount < 2) {
    return {
      canSplit: false,
      message: 'Passenger split requires at least 2 passengers.',
    };
  }
  return { canSplit: true };
}
