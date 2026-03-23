/**
 * Passenger information change type definitions (v3.11.0)
 *
 * Airline-specific passenger change feature settings and request/response types
 *
 * ============================================================
 * Airline support scope
 * ============================================================
 * | Airline | Hold | After ticketing | Operation mode | UpdatePax configuration |
 * |--------|------|--------|----------|----------------|
 * | AF | Yes | Yes | MODIFY only | CurrentPaxRefID only |
 * | KL | Yes | Yes | MODIFY only | CurrentPaxRefID only |
 * | AY | Yes | Yes | ADD/DELETE only | Add:New, Delete:Current |
 * | HA | Yes | Yes | All | Add:New, Delete:Current, Change:Both |
 * | TK | Yes | Yes | All | Add:New, Delete:Current, Change:Both |
 * | KE | Yes | Yes | All | Ticketingbefore:Name/DOCA, After ticketing:DOCS/FFN |
 * ============================================================
 */

// ============================================================
// Operation mode types
// ============================================================

/**
 * Passenger change operation mode
 * - MODIFY_ONLY: Supports modify only (AF, KL)
 * - ADD_DELETE_ONLY: Supports add/delete only (AY)
 * - ALL: Supports add/delete/modify (HA, TK)
 */
export type PaxChangeMode = 'MODIFY_ONLY' | 'ADD_DELETE_ONLY' | 'ALL';

/**
 * Individual action type
 */
export type PaxActionType = 'ADD' | 'DELETE' | 'MODIFY';

// ============================================================
// Airline-specific passenger change support matrix
// ============================================================

/**
 * Field Change Support Status
 */
export interface FieldChangeSupport {
  supported: boolean;
  /** Supported only pre-ticketing (Hold) */
  heldOnly?: boolean;
  /** Supported only post-ticketing (Ticketed) */
  ticketedOnly?: boolean;
}

/**
 * Airline-specific passenger change feature settings
 */
export interface CarrierPaxChangeFeatures {
  carrierCode: string;
  /** Hold from status Support Whether */
  holdSupported: boolean;
  /** Whether post-ticketing is supported */
  ticketedSupported: boolean;
  /** Operation mode */
  mode: PaxChangeMode;
  /** Name change support */
  name: FieldChangeSupport;
  /** Contact (email/phone) change support */
  contact: FieldChangeSupport;
  /** APIS (passport) change support */
  apis: FieldChangeSupport;
  /** FFN (frequent flyer) change support */
  ffn: FieldChangeSupport;
  /** DOCA (address of stay) change support */
  doca?: FieldChangeSupport;
  /** FTN (Free Text Notes) change support - HA */
  ftn?: FieldChangeSupport;
  /** Redress Number change support - HA */
  redress?: FieldChangeSupport;
  /** Notes */
  notes?: string;
}

/**
 * Airline-specific passenger change support matrix
 */
export const CARRIER_PAX_CHANGE_MATRIX: Record<string, CarrierPaxChangeFeatures> = {
  AF: {
    carrierCode: 'AF',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'MODIFY_ONLY',
    name: { supported: true },
    contact: { supported: true },
    apis: { supported: true },
    ffn: { supported: true },
    notes: 'Uses only CurrentPaxRefID',
  },
  KL: {
    carrierCode: 'KL',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'MODIFY_ONLY',
    name: { supported: true },
    contact: { supported: true },
    apis: { supported: true },
    ffn: { supported: true },
    notes: 'Uses only CurrentPaxRefID',
  },
  AY: {
    carrierCode: 'AY',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'ADD_DELETE_ONLY',
    name: { supported: false }, // AY does not support name change
    contact: { supported: true },
    apis: { supported: true },
    ffn: { supported: false },
    notes: 'Add: NewPaxRefID, Delete: CurrentPaxRefID',
  },
  HA: {
    carrierCode: 'HA',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'ALL',
    name: { supported: true },
    contact: { supported: true },
    apis: { supported: true },
    ffn: { supported: false },
    doca: { supported: true },
    ftn: { supported: true, heldOnly: true },
    redress: { supported: true, heldOnly: true },
    notes: 'Add: NewPaxRefID, Delete: CurrentPaxRefID, Change: Both',
  },
  TK: {
    carrierCode: 'TK',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'ALL',
    name: { supported: true },
    contact: { supported: true },
    apis: { supported: true },
    ffn: { supported: false },
    notes: 'Add: NewPaxRefID, Delete: CurrentPaxRefID, Change: Both',
  },
  KE: {
    carrierCode: 'KE',
    holdSupported: true,
    ticketedSupported: true,
    mode: 'ALL',
    name: { supported: true, heldOnly: true },
    contact: { supported: true },
    apis: { supported: true, ticketedOnly: true },
    ffn: { supported: true },
    doca: { supported: true, heldOnly: true },
    notes: 'Pre-ticketing: Name/DOCA allowed, Post-ticketing: DOCS/FFN only',
  },
};

/**
 * Default passenger change settings (for airlines not in matrix)
 */
export const DEFAULT_PAX_CHANGE_FEATURES: CarrierPaxChangeFeatures = {
  carrierCode: 'DEFAULT',
  holdSupported: false,
  ticketedSupported: false,
  mode: 'MODIFY_ONLY',
  name: { supported: false },
  contact: { supported: false },
  apis: { supported: false },
  ffn: { supported: false },
};

/**
 * Get airline passenger change features
 */
export function getCarrierPaxChangeFeatures(carrierCode: string): CarrierPaxChangeFeatures {
  return CARRIER_PAX_CHANGE_MATRIX[carrierCode] || {
    ...DEFAULT_PAX_CHANGE_FEATURES,
    carrierCode,
  };
}

/**
 * Get allowed action types by airline
 */
export function getAllowedActions(carrierCode: string): PaxActionType[] {
  const features = getCarrierPaxChangeFeatures(carrierCode);
  switch (features.mode) {
    case 'MODIFY_ONLY':
      return ['MODIFY'];
    case 'ADD_DELETE_ONLY':
      return ['ADD', 'DELETE'];
    case 'ALL':
      return ['ADD', 'DELETE', 'MODIFY'];
    default:
      return [];
  }
}

/**
 * Ticketing in Status According to for allow Change Item Retrieval
 * @param carrierCode Carrier code
 * @param isTicketed Ticketing Complete Whether
 * @returns Allowed change fields
 */
export function getAllowedPaxChanges(
  carrierCode: string,
  isTicketed: boolean
): AllowedPaxChanges {
  const features = getCarrierPaxChangeFeatures(carrierCode);

  const isFieldAllowed = (field: FieldChangeSupport | undefined): boolean => {
    if (!field?.supported) return false;
    if (isTicketed && field.heldOnly) return false;
    if (!isTicketed && field.ticketedOnly) return false;
    return true;
  };

  return {
    canChangeName: isFieldAllowed(features.name),
    canChangeContact: isFieldAllowed(features.contact),
    canChangeApis: isFieldAllowed(features.apis),
    canChangeFfn: isFieldAllowed(features.ffn),
    canChangeDoca: isFieldAllowed(features.doca),
    mode: features.mode,
    allowedActions: getAllowedActions(carrierCode),
  };
}

// ============================================================
// Change types and request/response types
// ============================================================

/**
 * Change type (field-based)
 */
export type PaxChangeType = 'NAME' | 'CONTACT' | 'APIS' | 'FFN' | 'DOCA';

/**
 * Base interface for change request
 */
export interface PaxChangeRequest {
  orderId: string;
  paxId: string;
  carrierCode: string;
  changeType: PaxChangeType;
  /** Action type (ADD/DELETE/MODIFY) */
  action: PaxActionType;
}

/**
 * Name change request
 */
export interface NameChangeRequest extends PaxChangeRequest {
  changeType: 'NAME';
  data: {
    property: string; // Uppercase English
    givenName: string; // Uppercase English
    title?: string; // MR, MRS, MS, MSTR, MISS
  };
}

/**
 * Contact change request
 */
export interface ContactChangeRequest extends PaxChangeRequest {
  changeType: 'CONTACT';
  data: {
    email?: string;
    phone?: {
      countryCode?: string; // Country code (e.g., 82)
      number: string; // Phone number
    };
    /** Existing contact ID for DELETE */
    contactInfoId?: string;
  };
}

/**
 * APIS (passport) change request
 */
export interface ApisChangeRequest extends PaxChangeRequest {
  changeType: 'APIS';
  data: {
    passportNumber: string; // Uppercase English + Number
    nationality: string; // 2-letter country code (KR, US, etc.)
    expiryDate: string; // YYYY-MM-DD
    issuingCountry?: string; // Issuing country code
    birthdate?: string; // Date of birth YYYY-MM-DD
    gender?: 'MALE' | 'FEMALE';
  };
}

/**
 * FFN (frequent flyer) change request
 */
export interface FfnChangeRequest extends PaxChangeRequest {
  changeType: 'FFN';
  data: {
    programCode: string; // Carrier code (AF, KL, etc.)
    memberNumber: string; // Member number
  };
}

/**
 * DOCA (address of stay) change request
 */
export interface DocaChangeRequest extends PaxChangeRequest {
  changeType: 'DOCA';
  data: {
    street: string; // Street address
    cityName: string; // City name
    postalCode: string; // Postal code
    countryCode?: string; // Country code (default: KR)
  };
}

/**
 * Combined change request type
 */
export type AnyPaxChangeRequest =
  | NameChangeRequest
  | ContactChangeRequest
  | ApisChangeRequest
  | FfnChangeRequest
  | DocaChangeRequest;

/**
 * Change response
 */
export interface PaxChangeResponse {
  success: boolean;
  orderId: string;
  paxId: string;
  changeType: PaxChangeType;
  message?: string;
  error?: string;
}

// ============================================================
// UI types
// ============================================================

/**
 * Allowed changes summary (for UI display)
 */
export interface AllowedPaxChanges {
  canChangeName: boolean;
  canChangeContact: boolean;
  canChangeApis: boolean;
  canChangeFfn: boolean;
  canChangeDoca: boolean;
  /** Operation mode */
  mode: PaxChangeMode;
  /** Allowed action types */
  allowedActions: PaxActionType[];
}

/**
 * Passenger Change Form Status
 */
export interface PaxChangeFormState {
  selectedPaxId: string | null;
  selectedChangeType: PaxChangeType | null;
  selectedAction: PaxActionType | null;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Validation rules
 */
export const VALIDATION_PATTERNS = {
  /** Uppercase English only */
  NAME: /^[A-Z\s]+$/,
  /** Email format */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number: Number, +, - for allow */
  PHONE: /^[\d+\-\s]+$/,
  /** Passport Number: Uppercase English + Number */
  PASSPORT: /^[A-Z0-9]+$/,
  /** CountryCode: 2digit Uppercase English */
  COUNTRY_CODE: /^[A-Z]{2}$/,
  /** Date: YYYY-MM-DD */
  DATE: /^\d{4}-\d{2}-\d{2}$/,
};

/**
 * Validation function
 */
export function validatePaxChangeData(
  changeType: PaxChangeType,
  data: Record<string, unknown>,
  action: PaxActionType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Minimize data validation for DELETE actions
  if (action === 'DELETE') {
    return { valid: true, errors: [] };
  }

  switch (changeType) {
    case 'NAME':
      if (!data.property || !VALIDATION_PATTERNS.NAME.test(data.property as string)) {
        errors.push('Surname must be uppercase English only.');
      }
      if (!data.givenName || !VALIDATION_PATTERNS.NAME.test(data.givenName as string)) {
        errors.push('Name(Given Name) Uppercase English only allowed.');
      }
      break;

    case 'CONTACT':
      if (data.email && !VALIDATION_PATTERNS.EMAIL.test(data.email as string)) {
        errors.push('Correct Email format Input.');
      }
      if (data.phone) {
        const phone = data.phone as { number?: string };
        if (phone.number && !VALIDATION_PATTERNS.PHONE.test(phone.number)) {
          errors.push('Phone number Number, +, - only allowed.');
        }
      }
      if (!data.email && !data.phone) {
        errors.push('Please enter at least one of email or phone number.');
      }
      break;

    case 'APIS':
      if (!data.passportNumber || !VALIDATION_PATTERNS.PASSPORT.test(data.passportNumber as string)) {
        errors.push('Passport Number Uppercase English and Number only allowed.');
      }
      if (!data.nationality || !VALIDATION_PATTERNS.COUNTRY_CODE.test(data.nationality as string)) {
        errors.push('Please enter nationality as a 2-letter country code. (e.g.: KR)');
      }
      if (!data.expiryDate || !VALIDATION_PATTERNS.DATE.test(data.expiryDate as string)) {
        errors.push('Please enter passport expiry date in YYYY-MM-DD format.');
      }
      break;

    case 'FFN':
      if (!data.programCode) {
        errors.push('Please enter the frequent flyer program code.');
      }
      if (!data.memberNumber) {
        errors.push('Mileage Member number Input.');
      }
      break;

    case 'DOCA':
      if (!data.street) {
        errors.push('Street address Input.');
      }
      if (!data.cityName) {
        errors.push('City name Input.');
      }
      if (!data.postalCode) {
        errors.push('Postal code Input.');
      }
      if (data.countryCode && !VALIDATION_PATTERNS.COUNTRY_CODE.test(data.countryCode as string)) {
        errors.push('CountryCode 2digit Uppercase to English Input. (e.g.: KR)');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}
