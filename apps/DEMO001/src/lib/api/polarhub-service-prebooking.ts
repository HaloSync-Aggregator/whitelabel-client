/**
 * PolarHub NDC Service Layer - Pre-Booking Functions
 * @description Flight search, offer pricing, seat/service availability, booking creation, cancellation, refund
 */

import {
  airShopping,
  offerPrice,
  seatAvailability,
  orderCreate,
  orderRetrieve,
  orderCancel,
  orderReshop,
  generateTransactionId,
  mapCabinClass,
  isSuccessCode,
  type AirShoppingRequest,
  type OfferPriceRequest,
  type OrderCreateRequest,
  type OrderRetrieveRequest,
  type OrderCancelRequest,
  type OrderReshopRequest,
} from '@/lib/api/middleware-client';
import {
  transformOffersToFlights,
  transformOfferPriceResponse,
  type AirShoppingResponse,
  type OfferPriceResponse,
} from '@/lib/api/offer-transformer';
import { transformSeatAvailabilityResponse } from '@/lib/api/seat-transformer';
import { transformServiceListResponse } from '@/lib/api/service-transformer';
import {
  transformOrderRetrieveResponse,
  type OrderRetrieveResponse,
} from '@/lib/api/order-retrieve-transformer';
import { ApiError } from '@/lib/api/pax-change-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import { POINT_OF_SALE } from '@/lib/tenant';
import type { BookingDetail } from '@/types/booking';
import type { Flight } from '@/components/flight/FlightCard';
import type { PriceBreakdownData } from '@/components/flight/PriceBreakdown';
import type { SeatAvailabilityData } from '@/types/seat';
import type { ServiceListData } from '@/types/service';

// ============================================================
// Result Types
// ============================================================

export interface SearchResult {
  success: true;
  flights: Flight[];
  totalCount: number;
  transactionId: string;
  paxList: Array<{ paxId: string; ptc: string }>;
  originDestList: Array<{ OriginDestID: string; PaxJourneyRefID: string[] }>;
  paxJourneyList: Array<{
    PaxJourneyID: string;
    PaxSegmentRefID: string[];
    Duration?: string;
  }>;
  paxSegmentList: Array<{
    PaxSegmentID: string;
    Departure: { AirportCode: string; AirportName?: string; Date: string; Time: string; Terminal?: { Name: string } };
    Arrival: { AirportCode: string; AirportName?: string; Date: string; Time: string; Terminal?: { Name: string } };
    MarketingCarrier: { AirlineID: string; FlightNumber: string };
    OperatingCarrier?: { AirlineID: string };
    CabinType?: { Code: string };
    FlightDuration?: string;
  }>;
}

export interface OfferPriceResult {
  success: true;
  priceBreakdown: PriceBreakdownData;
  transactionId: string;
  responseId?: string;
  offerId?: string;
  owner?: string;
  offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
}

export interface SeatAvailabilityResult {
  success: true;
  seatData: SeatAvailabilityData;
}

export interface ServiceListResult {
  success: true;
  serviceData: ServiceListData;
}

export interface CreateBookingResult {
  success: true;
  orderId: string;
  owner: string;
  pnr: string;
}

export interface CancelResult {
  success: true;
  orderId: string;
  pnr?: string;
  status: 'CANCELLED' | 'VOIDED' | 'REFUNDED';
  statusLabel: string;
  actionDate: string;
  message: string;
}

export interface RefundQuote {
  originalFare: number;
  penalty: number;
  refundAmount: number;
  currency: string;
  responseId: string;
  breakdown?: RefundBreakdownItem[];
}

export interface RefundBreakdownItem {
  orderItemId: string;
  originalAmount: number;
  penaltyAmount: number;
  refundAmount: number;
  currency: string;
}

export interface RefundQuoteResult {
  success: true;
  refundQuote: RefundQuote;
  transactionId: string;
}

// ============================================================
// Middleware response types (internal)
// ============================================================

interface OrderReshopRefundResponse {
  ResultMessage: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  ReshopOffers?: Array<{
    ResponseID: string;
    OfferID: string;
    Owner: string;
    TotalPrice?: {
      TotalAmount: { Amount: number; CurCode: string };
    };
    DeleteOrderItem?: Array<{
      OrderItemID: string;
      OriginalOrderItem?: {
        Total: { Amount: number; CurCode: string };
      };
      PenaltyAmount?: {
        Total: { Amount: number; CurCode: string };
      };
      ReshopDue?: {
        Total: { Amount: number; CurCode: string };
      };
    }>;
  }>;
}

// ============================================================
// ServiceList middleware call helper
// (ServiceList route uses direct fetch, not middleware-client)
// ============================================================

const MIDDLEWARE_BASE_URL = import.meta.env.VITE_MIDDLEWARE_URL || '';

async function callServiceListAPI(body: unknown): Promise<unknown> {
  const url = `${MIDDLEWARE_BASE_URL}/middleware/polarhub/service-list`;

  if (import.meta.env.DEV) {
    console.log('[ServiceList] Request:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (import.meta.env.DEV) {
      console.error('[ServiceList] HTTP Error:', response.status, errorText);
    }
    throw new ApiError(
      ERROR_MESSAGES.SERVICE_RETRIEVE_FAILED,
      response.status
    );
  }

  return response.json();
}

// ============================================================
// 1. searchFlights (from api/search/route.ts)
// ============================================================

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: { type: 'ADT' | 'CHD' | 'INF'; count: number }[];
  cabinClass?: string;
  tripType?: 'oneway' | 'roundtrip';
}): Promise<SearchResult> {
  const { origin, destination, departureDate, returnDate, passengers, cabinClass, tripType } = params;

  // Validation
  if (!origin || !destination || !departureDate) {
    throw new ApiError(ERROR_MESSAGES.SEARCH_REQUIRED, 400);
  }

  // Build originDestList
  const originDestList: AirShoppingRequest['originDestList'] = [
    { origin, destination, departureDate },
  ];

  // Add return leg for roundtrip
  if (tripType === 'roundtrip' && returnDate) {
    originDestList.push({
      origin: destination,
      destination: origin,
      departureDate: returnDate,
    });
  }

  // Build AirShopping request
  const transactionId = generateTransactionId();
  const airShoppingRequest: AirShoppingRequest = {
    transactionId,
    originDestList,
    passengers,
    cabin: cabinClass ? mapCabinClass(cabinClass) : undefined,
    pointOfSale: POINT_OF_SALE,
  };

  if (import.meta.env.DEV) {
    console.log('[Search] AirShopping Request:', JSON.stringify(airShoppingRequest, null, 2));
  }

  // Call middleware backend
  const airShoppingResponse = await airShopping<AirShoppingResponse>(airShoppingRequest);

  // Error handling
  const resultCode = airShoppingResponse.ResultMessage?.Code;
  const isSuccess = resultCode === '00000' || resultCode === '0' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    throw new ApiError(
      airShoppingResponse.ResultMessage?.Message || ERROR_MESSAGES.SEARCH_FAILED,
      400
    );
  }

  // Transform offers to UI-friendly format
  const flights = transformOffersToFlights(airShoppingResponse);

  // Extract paxList for OfferPrice
  const paxList = (airShoppingResponse.DataLists?.PaxList || []).map((pax) => ({
    paxId: pax.PaxID,
    ptc: pax.Ptc,
  }));

  // Extract originDestList for PARTIAL mode
  const originDestListFromResponse = (airShoppingResponse.DataLists?.OriginDestList || []).map((od) => ({
    OriginDestID: od.OriginDestID,
    PaxJourneyRefID: od.PaxJourneyRefID,
  }));

  // Extract PaxJourneyList for segment details
  const paxJourneyList = (airShoppingResponse.DataLists?.PaxJourneyList || []).map((journey) => ({
    PaxJourneyID: journey.PaxJourneyID,
    PaxSegmentRefID: journey.PaxSegmentRefID,
    Duration: journey.Duration,
  }));

  // Extract PaxSegmentList for flight details
  const paxSegmentList = (airShoppingResponse.DataLists?.PaxSegmentList || []).map((seg) => ({
    PaxSegmentID: seg.PaxSegmentID,
    Departure: seg.Departure,
    Arrival: seg.Arrival,
    MarketingCarrier: seg.MarketingCarrier,
    OperatingCarrier: seg.OperatingCarrier,
    CabinType: seg.CabinType,
    FlightDuration: seg.FlightDuration,
  }));

  return {
    success: true,
    flights,
    totalCount: flights.length,
    transactionId: airShoppingResponse.TransactionID,
    paxList,
    originDestList: originDestListFromResponse,
    paxJourneyList,
    paxSegmentList,
  };
}

// ============================================================
// 2. getOfferPrice (from api/offer-price/route.ts)
// ============================================================

export async function getOfferPrice(params: {
  transactionId?: string;
  offers: Array<{
    responseId: string;
    offerId: string;
    owner: string;
    offerItems: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: { column: string; row: string };
      bookingInstructions?: { text: string[]; ositext?: string[] };
    }>;
  }>;
  paxList: Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>;
  criteria?: {
    existingOrderCriteria?: { orderId: string; paxRefId: string[] };
  };
}): Promise<OfferPriceResult> {
  const { offers, paxList } = params;

  // Validation
  if (!offers || offers.length === 0) {
    throw new ApiError(ERROR_MESSAGES.OFFER_PRICE_REQUIRED_OFFERS, 400);
  }

  if (!paxList || paxList.length === 0) {
    throw new ApiError(ERROR_MESSAGES.OFFER_PRICE_REQUIRED_PAX, 400);
  }

  // Build OfferPrice request
  // seatSelection, bookingInstructions also in offerItems included
  const transactionId = params.transactionId || generateTransactionId();
  const offerPriceRequest: OfferPriceRequest = {
    transactionId,
    offers: offers.map((offer) => ({
      responseId: offer.responseId,
      offerId: offer.offerId,
      owner: offer.owner,
      offerItems: offer.offerItems.map((item) => ({
        offerItemId: item.offerItemId,
        paxRefId: item.paxRefId,
        // Seat selection (only include when present)
        ...(item.seatSelection && { seatSelection: item.seatSelection }),
        // Weight-based service BookingInstructions (only include when present)
        ...(item.bookingInstructions && { bookingInstructions: item.bookingInstructions }),
      })),
    })),
    paxList,
    // Post-booking OfferPrice criteria (AF/KL seat/service reprice)
    ...(params.criteria && { criteria: params.criteria }),
  };

  if (import.meta.env.DEV) {
    console.log('[OfferPrice] Request:', JSON.stringify(offerPriceRequest, null, 2));
    // BookingInstructions debug log
    offerPriceRequest.offers.forEach((offer, idx) => {
      offer.offerItems.forEach((item, itemIdx) => {
        if (item.bookingInstructions) {
          console.log(`[OfferPrice] Offer[${idx}] OfferItem[${itemIdx}] BookingInstructions:`, item.bookingInstructions);
        }
      });
    });
  }

  // Call middleware backend
  const offerPriceResponse = await offerPrice<OfferPriceResponse>(offerPriceRequest);

  // Error handling
  const resultCode = offerPriceResponse.ResultMessage?.Code;
  const isSuccess = resultCode === '00000' || resultCode === '0' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    throw new ApiError(
      offerPriceResponse.ResultMessage?.Message || ERROR_MESSAGES.OFFER_PRICE_FAILED,
      400
    );
  }

  // Transform response
  const priceBreakdown = transformOfferPriceResponse(offerPriceResponse);

  // Return _orderData info for downstream usage (OrderCreate, seat reprice)
  return {
    success: true,
    priceBreakdown,
    transactionId: offerPriceResponse.TransactionID,
    responseId: priceBreakdown._orderData?.responseId,
    offerId: priceBreakdown._orderData?.offerId,
    owner: priceBreakdown._orderData?.owner,
    offerItems: priceBreakdown._orderData?.offerItems,
  };
}

// ============================================================
// 3. getSeatAvailability (from api/seat-availability/route.ts)
// ============================================================

export async function getSeatAvailability(params: {
  transactionId: string;
  offer?: {
    responseId: string;
    offerId: string;
    owner: string;
    offerItems: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
  order?: {
    orderId: string;
  };
  owner?: string;
  paxList: Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>;
}): Promise<SeatAvailabilityResult> {
  // Validation
  if (!params.transactionId) {
    throw new ApiError(ERROR_MESSAGES.SEAT_REQUIRED_TXN, 400);
  }

  if (!params.offer && !params.order) {
    throw new ApiError('Either offer or order is required', 400);
  }

  if (!params.paxList || params.paxList.length === 0) {
    throw new ApiError('paxList is required', 400);
  }

  // Post-Booking: owner must NOT be inside order object (PolarHub restriction)
  const orderForMiddleware = params.order ? { orderId: params.order.orderId } : undefined;

  // PolarHub API Call
  const response = await seatAvailability({
    transactionId: params.transactionId,
    offer: params.offer,
    order: orderForMiddleware,
    paxList: params.paxList,
  });

  if (import.meta.env.DEV) {
    console.log('[SeatAvailability] Raw Response:', JSON.stringify(response, null, 2).substring(0, 2000));
  }

  // Response validation
  if ((response as Record<string, unknown>).ResultMessage) {
    const rm = (response as { ResultMessage: { Code: string; Message?: string } }).ResultMessage;
    if (rm.Code !== '00000') {
      throw new ApiError(rm.Message || 'SeatAvailability failed', 400);
    }
  }

  // ============================================================
  // Response Normalization (CRITICAL!)
  // API response: AlaCarteOffer vs ALaCarteOffer case variants
  // SeatMap/OfferItem position normalization
  // ============================================================

  const rawResponse = response as Record<string, unknown>;
  const alaCarteOffer = (rawResponse.AlaCarteOffer || rawResponse.ALaCarteOffer) as Record<string, unknown> | undefined;

  if (!alaCarteOffer) {
    if (import.meta.env.DEV) {
      console.error('[SeatAvailability] No AlaCarteOffer in response.');
      console.error('[SeatAvailability] Response keys:', Object.keys(rawResponse || {}));
    }
    throw new ApiError(ERROR_MESSAGES.SEAT_NOT_AVAILABLE, 400);
  }

  // SeatMap: Root level or inside alaCarteOffer
  const seatMap = rawResponse.SeatMap || alaCarteOffer.SeatMap;
  // OfferItem case variants (AlaCarteOfferItem vs ALaCarteOfferItem)
  const alaCarteOfferItem = rawResponse.AlaCarteOfferItem || alaCarteOffer.AlaCarteOfferItem || alaCarteOffer.ALaCarteOfferItem;

  // Owner Extract: API Response -> offer.owner -> body.owner (Post-Booking)
  const owner = (alaCarteOffer.Owner as string) || params.offer?.owner || params.owner || '';

  if (import.meta.env.DEV) {
    console.log('[SeatAvailability] Owner:', owner, '(from:', alaCarteOffer.Owner ? 'API response' : 'request body', ')');
  }

  // Normalized response for transformer
  const normalizedResponse = {
    ...rawResponse,
    ALaCarteOffer: {
      ...alaCarteOffer,
      Owner: owner,
      SeatMap: seatMap,
      ALaCarteOfferItem: alaCarteOfferItem,
    },
  };

  if (import.meta.env.DEV) {
    console.log('[SeatAvailability] Normalized AlaCarteOffer keys:', Object.keys(normalizedResponse.ALaCarteOffer || {}));
    console.log('[SeatAvailability] SeatMap exists:', !!seatMap);
    console.log('[SeatAvailability] OfferItem exists:', !!alaCarteOfferItem);
  }

  // Transform using normalized response
  const seatData = transformSeatAvailabilityResponse(normalizedResponse as never);

  return {
    success: true,
    seatData,
  };
}

// ============================================================
// 4. getServiceList (from api/service-list/route.ts)
// CRITICAL: This route calls middleware directly via fetch
// ============================================================

export async function getServiceList(params: {
  transactionId: string;
  offer?: {
    responseId: string;
    offerId: string;
    owner: string;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
  order?: {
    orderId: string;
    owner?: string; // Passed from FE but excluded from API call
  };
  paxList?: Array<{
    paxId: string;
    ptc: 'ADT' | 'CHD' | 'INF';
    loyaltyProgram?: { programCode: string; accountNumber: string };
  }>;
  currencyCode?: string;
}): Promise<ServiceListResult> {
  // Validation
  if (!params.transactionId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_TXN, 400);
  }

  if (!params.offer && !params.order) {
    throw new ApiError('Either offer or order is required', 400);
  }

  // offer-based: responseId, offerId required
  if (params.offer && (!params.offer.responseId || !params.offer.offerId)) {
    throw new ApiError('offer.responseId and offer.offerId are required', 400);
  }

  // order-based: orderId required
  if (params.order && !params.order.orderId) {
    throw new ApiError('order.orderId is required', 400);
  }

  // Build PolarHub API request body
  const apiRequestBody: Record<string, unknown> = {
    transactionId: params.transactionId,
    responseParameter: {
      currencyCode: params.currencyCode || 'KRW',
    },
    // paxList required (even if empty array)
    paxList: params.paxList || [],
  };

  // offer-based retrieval (Prime Booking)
  if (params.offer) {
    apiRequestBody.offer = {
      responseId: params.offer.responseId,
      offerId: params.offer.offerId,
      owner: params.offer.owner,
      offerItems: params.offer.offerItems,
    };
  }

  // order-based retrieval (Post-Booking)
  // CRITICAL: API spec requires orderId only (owner EXCLUDED!)
  if (params.order) {
    apiRequestBody.order = {
      orderId: params.order.orderId,
      // owner Field excluded - not in API spec!
    };
  }

  if (import.meta.env.DEV) {
    console.log('[ServiceList] Request:', JSON.stringify(apiRequestBody, null, 2));
  }

  // Call PolarHub API directly (not via middleware-client)
  const response = await callServiceListAPI(apiRequestBody) as Record<string, unknown>;

  if (import.meta.env.DEV) {
    console.log('[ServiceList] Raw Response:', JSON.stringify(response, null, 2).substring(0, 2000));
    // ALaCarteOffer structure logging
    const alaCarteOfferDebug = (response.ALaCarteOffer || response.AlaCarteOffer) as Record<string, unknown> | undefined;
    if (alaCarteOfferDebug) {
      const items = (alaCarteOfferDebug.ALaCarteOfferItem || alaCarteOfferDebug.AlaCarteOfferItem) as unknown[] || [];
      console.log('[ServiceList] ALaCarteOffer keys:', Object.keys(alaCarteOfferDebug));
      console.log('[ServiceList] Total OfferItems:', items.length);
      if (items.length > 0) {
        console.log('[ServiceList] First OfferItem structure:', JSON.stringify(items[0], null, 2).substring(0, 1500));
      }
    }
  }

  // Response validation
  const resultMessage = (response as { ResultMessage?: { Code: string; Message?: string } }).ResultMessage;
  if (resultMessage?.Code !== '00000') {
    const errorMessage = resultMessage?.Message || ERROR_MESSAGES.SERVICE_RETRIEVE_FAILED;
    if (import.meta.env.DEV) {
      console.error('[ServiceList] API Error:', resultMessage);
    }
    throw new ApiError(errorMessage, 400);
  }

  // ALaCarteOffer existence check
  const alaCarteOffer = response.ALaCarteOffer || response.AlaCarteOffer;
  if (!alaCarteOffer) {
    if (import.meta.env.DEV) {
      console.error('[ServiceList] No ALaCarteOffer in response.');
      console.error('[ServiceList] Response keys:', Object.keys(response || {}));
    }
    throw new ApiError(ERROR_MESSAGES.SERVICE_NOT_AVAILABLE, 400);
  }

  // Transform response
  const serviceData = transformServiceListResponse(response as never);

  return {
    success: true,
    serviceData,
  };
}

// ============================================================
// 5. createBooking (from api/booking/route.ts)
// ============================================================

export async function createBooking(params: {
  transactionId: string;
  orders: Array<{
    responseId: string;
    offerId: string;
    owner: string;
    offerItems: Array<{ offerItemId: string; paxRefId: string[] }>;
  }>;
  paxList: Array<{
    paxId: string;
    ptc: 'ADT' | 'CHD' | 'INF';
    individual: {
      surname: string;
      givenName: string[];
      birthdate?: string;
      gender?: 'MALE' | 'FEMALE';
    };
    identityDoc?: Array<{
      identityDocType: 'PT';
      identityDocId: string;
      expiryDate?: string;
      issuingCountryCode?: string;
      citizenshipCountryCode?: string;
    }>;
    citizenshipCountryCode?: string;
    residenceCountryCode?: string;
    contactInfoRefId?: string[];
  }>;
  contactInfoList?: Array<{
    contactInfoId: string;
    phone?: {
      label?: string;
      countryDialingCode?: string;
      phoneNumber: string;
    };
    emailAddress?: string;
  }>;
  paymentList?: Array<{
    paymentMethod: {
      card?: {
        cardCode: 'VI' | 'MC' | 'AX' | 'JC' | string;
        cardNumber: string;
        cardHolderName: string;
        expiration: string;
        seriesCode?: string;
      };
      cash?: { cashPaymentInd: boolean };
      agentDeposit?: { agentDepositId: string };
    };
    amount: { currencyCode: string; amount: number };
  }>;
}): Promise<CreateBookingResult> {
  const { transactionId, orders, paxList, contactInfoList, paymentList } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_TXN, 400);
  }

  if (!orders || orders.length === 0) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_ORDERS, 400);
  }

  if (!paxList || paxList.length === 0) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_PAX, 400);
  }

  // Build OrderCreate request
  // transactionId from FE (must match OfferPrice response)
  // pointOfSale NOT included ("Agency provider is not found" error if set)
  const orderCreateRequest: OrderCreateRequest = {
    transactionId,
    orders,
    paxList,
    contactInfoList: contactInfoList || [],
    paymentList: paymentList || [], // Empty array = Hold
  };

  if (import.meta.env.DEV) {
    console.log('[Booking] OrderCreate Request:', JSON.stringify(orderCreateRequest, null, 2));
  }

  // Call middleware backend
  const orderCreateResponse = await orderCreate<{
    ResultMessage?: { Code: string; Message?: string };
    Order?: { OrderID: string; Owner: string; BookingRefID?: string };
  }>(orderCreateRequest);

  // Error handling
  const resultCode = orderCreateResponse.ResultMessage?.Code;
  const isSuccess = resultCode === '00000' || resultCode === '0' || resultCode === 'SUCCESS';

  if (!isSuccess || !orderCreateResponse.Order) {
    throw new ApiError(
      orderCreateResponse.ResultMessage?.Message || ERROR_MESSAGES.BOOKING_CREATE_FAILED,
      400
    );
  }

  return {
    success: true,
    orderId: orderCreateResponse.Order.OrderID,
    owner: orderCreateResponse.Order.Owner,
    pnr: orderCreateResponse.Order.BookingRefID || orderCreateResponse.Order.OrderID,
  };
}

// ============================================================
// 6. getBookingDetail (from api/booking/[id]/route.ts)
// ============================================================

export async function getBookingDetail(orderId: string): Promise<BookingDetail> {
  // Validation
  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // Build OrderRetrieve request
  // generateTransactionId() for fresh retrieval
  const transactionId = generateTransactionId();
  const orderRetrieveRequest: OrderRetrieveRequest = {
    transactionId,
    orderId,
    // owner not included in OrderRetrieve API
  };

  if (import.meta.env.DEV) {
    console.log('[Booking] OrderRetrieve Request:', JSON.stringify(orderRetrieveRequest, null, 2));
  }

  // Call middleware backend
  const orderRetrieveResponse = await orderRetrieve<OrderRetrieveResponse>(orderRetrieveRequest);

  // Error handling
  const resultCode = orderRetrieveResponse.ResultMessage?.Code;
  const isSuccess = isSuccessCode(resultCode);

  if (!isSuccess) {
    throw new ApiError(
      orderRetrieveResponse.ResultMessage?.Message || ERROR_MESSAGES.BOOKING_RETRIEVE_FAILED,
      400
    );
  }

  // Transform to BookingDetail format
  const bookingDetail = transformOrderRetrieveResponse(orderRetrieveResponse);

  return bookingDetail;
}

// ============================================================
// 7. cancelBooking (from api/cancel/route.ts)
// ============================================================

export async function cancelBooking(params: {
  transactionId: string;
  orderId: string;
  pnr?: string;
  cancelType?: 'CANCEL' | 'VOID' | 'REFUND';
}): Promise<CancelResult> {
  const { transactionId, orderId, pnr, cancelType = 'CANCEL' } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_TXN, 400);
  }

  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // Build request
  // OrderCancel API requires orderId only (no refundQuoteId)
  const cancelRequest: OrderCancelRequest = {
    transactionId,
    orderId,
  };

  if (import.meta.env.DEV) {
    console.log('[Cancel] Request:', JSON.stringify(cancelRequest, null, 2));
    console.log('[Cancel] Cancel Type:', cancelType);
  }

  // Call middleware backend
  const cancelResponse = await orderCancel<{
    ResultMessage: { Code: string; Message?: string };
    TransactionID: string;
  }>(cancelRequest);

  // Check result
  const resultCode = cancelResponse.ResultMessage?.Code;
  const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    const errorMessage = cancelResponse.ResultMessage?.Message || ERROR_MESSAGES.CANCEL_FAILED;
    if (import.meta.env.DEV) {
      console.error('[Cancel] Failed:', errorMessage);
    }
    throw new ApiError(errorMessage, 400);
  }

  // Build success response based on cancelType
  const statusMap = {
    CANCEL: { status: 'CANCELLED' as const, label: 'CancellationComplete', message: 'Booking Cancellation.' },
    VOID: { status: 'VOIDED' as const, label: 'VOIDComplete', message: 'Ticketing Cancellation(VOID).' },
    REFUND: { status: 'REFUNDED' as const, label: 'RefundComplete', message: 'Refund Normal-liketo Process.' },
  };

  const statusInfo = statusMap[cancelType] || statusMap.CANCEL;

  return {
    success: true,
    orderId,
    pnr,
    status: statusInfo.status,
    statusLabel: statusInfo.label,
    actionDate: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    message: statusInfo.message,
  };
}

// ============================================================
// 8. getRefundQuote (from api/refund-quote/route.ts)
// ============================================================

export async function getRefundQuote(params: {
  transactionId: string;
  orderId: string;
}): Promise<RefundQuoteResult> {
  const { transactionId, orderId } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_TXN, 400);
  }

  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // Build request
  // cancelOrderRefId is STRING type (not object!)
  const reshopRequest: OrderReshopRequest = {
    transactionId,
    orderId,
    actionContext: '8', // Voluntary
    updateOrder: {
      cancelOrderRefId: orderId, // STRING directly!
    },
  };

  if (import.meta.env.DEV) {
    console.log('[RefundQuote] Request:', JSON.stringify(reshopRequest, null, 2));
  }

  // Call middleware backend
  const reshopResponse = await orderReshop<OrderReshopRefundResponse>(reshopRequest);

  // Check result
  const resultCode = reshopResponse.ResultMessage?.Code;
  const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    const errorMessage = reshopResponse.ResultMessage?.Message || ERROR_MESSAGES.REFUND_QUOTE_FAILED;
    if (import.meta.env.DEV) {
      console.error('[RefundQuote] Failed:', errorMessage);
    }

    // Check for non-refundable fare
    if (errorMessage.includes('NON_REFUNDABLE') || errorMessage.includes('Refund')) {
      throw new ApiError(ERROR_MESSAGES.REFUND_NON_REFUNDABLE, 400);
    }

    throw new ApiError(errorMessage, 400);
  }

  // Extract refund quote from response
  const allOffers = reshopResponse.ReshopOffers || [];

  if (allOffers.length === 0) {
    throw new ApiError(ERROR_MESSAGES.REFUND_NOT_FOUND, 400);
  }

  // Calculate refund amount
  let originalFare = 0;
  let penalty = 0;
  let refundAmount = 0;
  let currency = allOffers[0]?.TotalPrice?.TotalAmount?.CurCode || 'KRW';
  const breakdown: RefundBreakdownItem[] = [];
  const responseId = allOffers[0]?.ResponseID || allOffers[0]?.OfferID || '';

  // Traverse all ReshopOffers
  allOffers.forEach((reshopOffer, offerIndex) => {
    const deleteItems = reshopOffer.DeleteOrderItem || [];

    // Check if DeleteOrderItem has detailed amount info
    const hasDetailedAmounts = deleteItems.some(item =>
      item.OriginalOrderItem?.Total?.Amount !== undefined ||
      item.ReshopDue?.Total?.Amount !== undefined
    );

    if (deleteItems.length > 0 && hasDetailedAmounts) {
      // Case 1: Detailed breakdown in DeleteOrderItem (QR, etc.)
      deleteItems.forEach(item => {
        const itemOriginal = item.OriginalOrderItem?.Total?.Amount || 0;
        const itemPenalty = item.PenaltyAmount?.Total?.Amount || 0;
        const itemRefund = item.ReshopDue?.Total?.Amount || 0;
        const itemCurrency = item.ReshopDue?.Total?.CurCode || currency;

        originalFare += itemOriginal;
        penalty += itemPenalty;
        refundAmount += itemRefund;
        currency = itemCurrency;

        breakdown.push({
          orderItemId: item.OrderItemID,
          originalAmount: itemOriginal,
          penaltyAmount: itemPenalty,
          refundAmount: itemRefund,
          currency: itemCurrency,
        });
      });
    } else if (offerIndex === 0) {
      // Case 2: No detailed amounts in DeleteOrderItem (LH, SQ, etc.)
      refundAmount = reshopOffer.TotalPrice?.TotalAmount?.Amount || 0;
      currency = reshopOffer.TotalPrice?.TotalAmount?.CurCode || currency;
      originalFare = refundAmount;
      penalty = 0;
      if (import.meta.env.DEV) {
        console.log('[RefundQuote] Using TotalPrice fallback (LH/SQ pattern):', refundAmount, currency);
      }
    }
  });

  if (import.meta.env.DEV) {
    console.log('[RefundQuote] Processed', allOffers.length, 'offers. Total refundAmount:', refundAmount);
  }

  const refundQuote: RefundQuote = {
    originalFare,
    penalty,
    refundAmount: Math.max(refundAmount, 0),
    currency,
    responseId,
    breakdown: breakdown.length > 0 ? breakdown : undefined,
  };

  return {
    success: true,
    refundQuote,
    transactionId: reshopResponse.TransactionID,
  };
}
