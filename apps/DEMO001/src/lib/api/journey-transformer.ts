// Template v1.2.0 - Journey Change API Response Transformer
/**
 * Journey Change API Response Transformer
 *
 * @version 1.2.0
 * @description OrderReshop, OrderQuote Response UI to Data Conversion
 *
 * PolarHub Response(PascalCase) → UI Data(camelCase) Conversion
 */

import {
  type ReshopOffer,
  type ReshopFlight,
  type OfferItem,
} from '@/types/journey-change';

// ============================================================
// Types for Raw API Response (PascalCase + camelCase All Support)
// ============================================================

type AnyObject = Record<string, any>;

interface RawReshopOffer {
  ResponseID?: string;
  responseId?: string;
  OfferID?: string;
  offerId?: string;
  Owner?: string;
  owner?: string;
  TotalPrice?: AnyObject;
  totalPrice?: AnyObject;
  PriceDifference?: AnyObject;
  priceDifference?: AnyObject;
  OfferItem?: AnyObject[];
  offerItems?: AnyObject[];
  AddOfferItem?: AnyObject[];
}

interface RawDataLists {
  PaxSegmentList?: AnyObject[];
  paxSegmentList?: AnyObject[];
  PaxJourneyList?: unknown[];
  paxJourneyList?: unknown[];
}

interface RawReshopResponse {
  ReshopOffers?: RawReshopOffer[];
  reshopOffers?: RawReshopOffer[];
  DataLists?: RawDataLists;
  dataLists?: RawDataLists;
  transactionId?: string;
  TransactionID?: string;
}

// ============================================================
// Transform Functions
// ============================================================

/**
 * OrderReshop All/Total Response Conversion
 */
export function transformReshopResponse(response: RawReshopResponse): {
  reshopOffers: ReshopOffer[];
  transactionId: string;
} {
  const rawOffers = response.ReshopOffers || response.reshopOffers || [];
  const dataLists = response.DataLists || response.dataLists || {};

  return {
    reshopOffers: rawOffers.map(offer => transformReshopOffer(offer, dataLists)),
    transactionId: response.transactionId || response.TransactionID || '',
  };
}

/**
 * Individual ReshopOffer Conversion
 */
export function transformReshopOffer(
  offer: RawReshopOffer,
  dataLists: RawDataLists
): ReshopOffer {
  const rawOfferItems = offer.OfferItem || offer.offerItems || offer.AddOfferItem || [];

  const totalPrice = offer.TotalPrice || offer.totalPrice || {};
  const totalAmount = totalPrice.TotalAmount || totalPrice.totalAmount || {};
  const priceDiff = offer.PriceDifference || offer.priceDifference;

  return {
    responseId: offer.ResponseID || offer.responseId || '',
    offerId: offer.OfferID || offer.offerId || '',
    owner: offer.Owner || offer.owner || '',
    totalPrice: {
      totalAmount: {
        amount: totalAmount.Amount || totalAmount.amount || 0,
        curCode: totalAmount.CurCode || totalAmount.curCode || 'KRW',
      },
    },
    priceDifference: priceDiff
      ? {
          amount: priceDiff.Amount || priceDiff.amount || 0,
          curCode: priceDiff.CurCode || priceDiff.curCode || 'KRW',
        }
      : undefined,
    offerItems: rawOfferItems.map(transformOfferItem),
    flights: extractFlights(rawOfferItems, dataLists),
  };
}

/**
 * OfferItem Conversion
 */
export function transformOfferItem(item: AnyObject): OfferItem {
  return {
    offerItemId: item.OfferItemID || item.offerItemId || '',
    paxRefId: item.PaxRefID || item.paxRefId || [],
  };
}

/**
 * Extract flights from DataLists
 *
 * v3.24: PaxJourney-based extraction.
 * Resolves PaxJourneyRefID -> PaxJourneyList -> PaxSegmentRefID -> PaxSegmentList
 * Falls back to direct PaxSegmentRefID if PaxJourneyList is not available.
 */
export function extractFlights(
  offerItems: AnyObject[],
  dataLists: RawDataLists
): ReshopFlight[] {
  const paxSegmentList = (dataLists.PaxSegmentList || dataLists.paxSegmentList || []) as AnyObject[];
  const paxJourneyList = (dataLists.PaxJourneyList || dataLists.paxJourneyList || []) as AnyObject[];

  // Get PaxJourneyRefIDs from AddOfferItem/OfferItem
  const journeyRefs: string[] = [];
  for (const item of offerItems) {
    const refs = item.PaxJourneyRefID || item.paxJourneyRefId || [];
    if (Array.isArray(refs)) {
      journeyRefs.push(...refs);
    }
    // Also check Service array for PaxJourneyRefID (space-separated)
    const services = item.Service || [];
    for (const svc of services) {
      const svcRef = svc.PaxJourneyRefID || svc.paxJourneyRefId || '';
      if (typeof svcRef === 'string' && svcRef.includes(' ')) {
        journeyRefs.push(...svcRef.split(' '));
      }
    }
  }

  // Deduplicate journey refs
  const uniqueJourneyRefs = [...new Set(journeyRefs)];

  // Get segment refs from journeys
  const segmentRefs: string[] = [];
  for (const journeyId of uniqueJourneyRefs) {
    const journey = paxJourneyList.find((j: AnyObject) =>
      (j.PaxJourneyID || j.paxJourneyId) === journeyId
    );
    if (journey) {
      const segRefs = (journey as AnyObject).PaxSegmentRefID || (journey as AnyObject).paxSegmentRefId || [];
      segmentRefs.push(...segRefs);
    }
  }

  // Fallback: direct PaxSegmentRefID from offer items
  if (segmentRefs.length === 0) {
    for (const item of offerItems) {
      const refs = item.PaxSegmentRefID || item.paxSegmentRefId || [];
      if (Array.isArray(refs)) segmentRefs.push(...refs);
    }
  }

  // Transform matching segments
  const segmentRefSet = new Set(segmentRefs.map(String));
  return paxSegmentList
    .filter(seg => segmentRefSet.has(String(seg.PaxSegmentID || seg.paxSegmentId || '')))
    .map(transformSegment);
}

/**
 * Individual Segment Conversion
 *
 * v3.24: Handles both PolarHub format and NDC XML format:
 * - PolarHub: Departure.AirportCode, MarketingCarrier.AirlineID/FlightNumber
 * - NDC XML: Dep.IATALocationCode, MarketingCarrierInfo.CarrierDesigCode
 */
export function transformSegment(segment: AnyObject): ReshopFlight {
  // PolarHub uses Departure/Arrival, NDC XML uses Dep
  const departure = segment.Departure || segment.departure || segment.Dep || segment.dep || {};
  const arrival = segment.Arrival || segment.arrival || {};
  const marketingCarrier = segment.MarketingCarrier || segment.marketingCarrier
    || segment.MarketingCarrierInfo || segment.marketingCarrierInfo || {};
  const flightDuration = segment.FlightDuration || segment.flightDuration || segment.Duration || segment.duration || '';

  // Extract origin/destination (PolarHub uses AirportCode, NDC uses IATALocationCode)
  const origin = departure.AirportCode || departure.IATALocationCode || departure.iataLocationCode || '';
  const destination = arrival.AirportCode || arrival.IATALocationCode || arrival.iataLocationCode || '';

  // Extract times (PolarHub uses Date + Time fields, NDC uses AircraftScheduledDateTime)
  const depTime = departure.Time || '';
  const arrTime = arrival.Time || '';
  const depDateTime = departure.AircraftScheduledDateTime || departure.aircraftScheduledDateTime;
  const arrDateTime = arrival.AircraftScheduledDateTime || arrival.aircraftScheduledDateTime;

  // Extract carrier info (PolarHub: AirlineID/FlightNumber, NDC: CarrierDesigCode/MarketingCarrierFlightNumberText)
  const carrierCode = marketingCarrier.AirlineID || marketingCarrier.airlineId
    || marketingCarrier.CarrierDesigCode || marketingCarrier.carrierDesigCode || '';
  const flightNumber = marketingCarrier.FlightNumber || marketingCarrier.flightNumber
    || marketingCarrier.MarketingCarrierFlightNumberText || marketingCarrier.marketingCarrierFlightNumberText || '';

  return {
    segmentKey: String(segment.PaxSegmentID || segment.paxSegmentId || ''),
    carrierCode: String(carrierCode),
    flightNumber: String(flightNumber),
    origin: String(origin),
    destination: String(destination),
    departureTime: depTime ? depTime.substring(0, 5) : formatDateTime(depDateTime),
    arrivalTime: arrTime ? arrTime.substring(0, 5) : formatDateTime(arrDateTime),
    duration: formatDuration(flightDuration),
    cabin: 'Y',
    stops: 0,
  };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * ISO Date/Time → Time string
 */
export function formatDateTime(dateTime?: string): string {
  if (!dateTime) return '';

  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateTime;
  }
}

/**
 * ISO Duration → Human-readable format
 * PT2H30M → 2h 30m
 */
export function formatDuration(duration?: string): string {
  if (!duration) return '';

  const match = duration.match(/PT(\d+)H(?:(\d+)M)?/);
  if (match) {
    const hours = match[1];
    const minutes = match[2] || '0';
    return `${hours}h ${minutes}m`;
  }

  return duration;
}

/**
 * Date string → Display format
 * 2026-02-17 → 2month 17 (conversion)
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Price difference Formatting
 */
export function formatPriceDifference(
  amount: number,
  currency: string = 'KRW'
): string {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}${Math.abs(amount).toLocaleString()} ${currency}`;
}

/**
 * OrderQuote Response Conversion
 */
export function transformQuoteResponse(response: AnyObject): {
  success: boolean;
  responseId?: string;
  offerId?: string;
  totalPrice?: number;
  currency?: string;
  priceDifference?: number;
  offerItems?: OfferItem[];
  error?: string;
} {
  const resultCode = response.ResultMessage?.Code || response.resultMessage?.code;

  if (resultCode && !['OK', '0', '00000', 'SUCCESS'].includes(resultCode)) {
    return {
      success: false,
      error: response.ResultMessage?.Message || response.resultMessage?.message || 'Quote Failure',
    };
  }

  const quotedOffer = response.QuotedOffer || response.quotedOffer || {};
  const totalPrice = quotedOffer.TotalPrice || quotedOffer.totalPrice || {};
  const totalAmount = totalPrice.TotalAmount || totalPrice.totalAmount || {};
  const priceDiff = quotedOffer.PriceDifference || quotedOffer.priceDifference;

  return {
    success: true,
    responseId: response.ResponseID || response.responseId,
    offerId: quotedOffer.OfferID || quotedOffer.offerId,
    totalPrice: totalAmount.Amount || totalAmount.amount,
    currency: totalAmount.CurCode || totalAmount.curCode || 'KRW',
    priceDifference: priceDiff?.Amount || priceDiff?.amount,
    offerItems: (quotedOffer.OfferItem || quotedOffer.offerItems || []).map(transformOfferItem),
  };
}
