/**
 * PolarHub NDC Service Layer - Post-Booking Functions
 * @description Ticketing, reshop, pax split, journey change workflows
 */

import {
  orderRetrieve,
  orderReshop,
  orderQuote,
  orderChange,
  generateTransactionId,
  isSuccessCode,
  type OrderReshopRequest,
  type OrderQuoteRequest,
  type OrderChangeRequest,
} from '@/lib/api/middleware-client';
import { ApiError } from '@/lib/api/pax-change-service';
// Re-export for convenience
export { changePax, ApiError } from '@/lib/api/pax-change-service';
export type { ChangePaxParams, PaxInfoFromOrder } from '@/lib/api/pax-change-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';
import {
  type TicketingQuote,
  type PaymentRequest,
  type PaymentResult,
  type OrderReshopResponse as PaymentOrderReshopResponse,
  getCarrierGroup,
  formatFareDifferenceLabel,
} from '@/types/payment';
import {
  supportsPaxSplit,
  type PaxSplitResult,
  type MiddlewarePaxSplitRequest,
} from '@/types/pax-split';
import {
  type JourneyChangeMode,
  type OriginDest,
  type DeleteItem,
  type ReshopOffer,
  type ReshopFlight,
  type SelectedOffer as JourneySelectedOffer,
  type AffectItem,
  requiresOrderQuote as requiresJourneyOrderQuote,
  requiresTwoStepOrderChange as requiresJourneyTwoStepOrderChange,
  isSuccessCode as isJourneySuccessCode,
} from '@/types/journey-change';

// ============================================================
// Exported Result Types
// ============================================================

export interface OrderQuoteResult {
  success: true;
  quote: TicketingQuote;
  transactionId: string;
}

export interface TicketingResult extends PaymentResult {}

export interface ReshopTicketingResult {
  success: true;
  quote: TicketingQuote;
  transactionId: string;
}

// ============================================================
// Middleware response types (internal)
// ============================================================

interface MiddlewareOrderQuoteResponse {
  transactionId: string;
  response: {
    ResultMessage: {
      Code: string;
      Message?: string;
    };
    ReshopOffers?: Array<{
      ResponseID?: string;
      OfferID?: string;
      Owner?: string;
      TotalPrice?: {
        TotalAmount?: { Amount: number; CurCode: string };
      };
      AddOfferItem?: Array<{
        OfferItemID: string;
        PaxRefID?: string[];
        Service?: Array<{
          SelectedSeat?: { Column?: string; Row?: string };
        }>;
      }>;
    }>;
    RepricedOffer?: {
      ResponseID: string;
      OfferID: string;
      Owner: string;
      TotalPrice?: {
        TotalAmount?: { Amount: number; CurCode: string };
      };
      RepricedOfferItem?: Array<{
        OfferItemID: string;
        PaxRefID?: string[];
      }>;
    };
    OrderQuote?: {
      ResponseID?: string;
      QuotedOrder?: {
        OrderID: string;
        OwnerCode?: string;
        TotalPrice?: {
          SimpleCurrencyPrice?: { Code: string; value: number };
        };
      };
      OfferPrice?: {
        Offer?: {
          OfferID: string;
          OwnerCode?: string;
          TotalPrice?: {
            SimpleCurrencyPrice?: { Code: string; value: number };
          };
          OfferItem?: Array<{
            OfferItemID: string;
            PaxRefID?: string[];
          }>;
        };
      };
    };
  };
}

interface MiddlewareOrderChangeResponse {
  transactionId: string;
  response: {
    ResultMessage: {
      Code: string;
      Message?: string;
    };
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

interface MiddlewarePayment {
  type: 'Card' | 'Cash' | 'AGT' | 'Voucher' | 'Ag';
  amount: number;
  curCode: string;
  cardCode?: string;
  cardNumber?: string;
  cardHolderName?: string;
  expiration?: string;
  seriesCode?: string;
  agentDepositId?: string;
  voucherId?: string;
  orderItemId?: string[];
  offerItemId?: string[];
  paxRefId?: string[];
}

/** OrderRetrieve response for pax-split (minimal fields) */
interface OrderRetrieveForSplit {
  ResultMessage?: { Code: string; Message?: string };
  Order?: {
    OrderID: string;
    Owner?: string;
    OrderItem?: Array<{ Owner?: string }>;
  };
  DataLists?: {
    PaxList?: Array<{
      PaxID: string;
      Ptc: 'ADT' | 'CHD' | 'INF';
      ContactInfoRefID?: string | string[];
      PaxRefID?: string;
      Individual?: {
        IndividualID?: string;
        Surname: string;
        GivenName: string[];
        MiddleName?: string[];
        Birthdate?: string;
        Gender?: string;
        NameTitle?: string;
      };
      IdentityDoc?: Array<{
        IdentityDocumentNumber?: string;
        IdentityDocumentType?: string;
        IssuingCountryCode?: string;
        CitizenshipCountryCode?: string;
        ExpiryDate?: string;
        Gender?: string;
        GivenName?: string[];
        MiddleName?: string[];
        Surname?: string;
      }>;
      LoyaltyProgramAccount?: Array<{
        AccountNumber?: string;
        LoyaltyProgramProviderName?: string;
      }>;
    }>;
    ContactInfoList?: Array<{
      ContactInfoID: string;
      EmailAddress?: string[];
      Phone?: Array<{
        CountryDialingCode?: string;
        PhoneNumber?: string | number;
      }>;
    }>;
  };
}

interface MiddlewarePaxSplitResponse {
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
        Type?: string;
      }>;
    };
  };
}

// ============================================================
// Middleware base URL for direct fetch calls (journey change)
// ============================================================

const MIDDLEWARE_BASE_URL = import.meta.env.VITE_MIDDLEWARE_URL || '';

// ============================================================
// 9. getOrderQuote (from api/order-quote/route.ts)
// ============================================================

export async function getOrderQuote(params: {
  transactionId: string;
  orderId: string;
  orderItemRefIds?: string[];
  originalAmount?: number;
  currency?: string;
}): Promise<OrderQuoteResult> {
  const { transactionId, orderId, orderItemRefIds, originalAmount, currency = 'KRW' } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.BOOKING_REQUIRED_TXN, 400);
  }

  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // Build OrderQuote request (repricedOrderId mode)
  // orderId must be at top-level!
  const quoteRequest: OrderQuoteRequest = {
    transactionId,
    orderId,
    repricedOrderId: {
      orderId,
      orderItemRefId: orderItemRefIds,
    },
  };

  if (import.meta.env.DEV) {
    console.log('[OrderQuote] Request:', JSON.stringify(quoteRequest, null, 2));
  }

  // Call middleware backend
  const quoteResponse = await orderQuote<MiddlewareOrderQuoteResponse>(quoteRequest);

  if (import.meta.env.DEV) {
    console.log('[OrderQuote] Raw Response:', JSON.stringify(quoteResponse, null, 2).slice(0, 1000));
  }

  // Check result
  // CRITICAL: response wrapper -> ResultMessage
  const resultMessage = quoteResponse.response?.ResultMessage;
  const resultCode = resultMessage?.Code;
  const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    const errorMessage = resultMessage?.Message || ERROR_MESSAGES.ORDER_QUOTE_FAILED;
    if (import.meta.env.DEV) {
      console.error('[OrderQuote] Failed:', errorMessage, 'Code:', resultCode);
    }
    throw new ApiError(errorMessage, 400);
  }

  // Extract quote data from response
  // CRITICAL: RepricedOffer or ReshopOffers or OrderQuote structure
  const repricedOffer = quoteResponse.response?.RepricedOffer;
  const reshopOffer = quoteResponse.response?.ReshopOffers?.[0];
  const orderQuoteData = quoteResponse.response?.OrderQuote;

  let responseId = '';
  let offerId = orderId;
  let owner = '';
  let newFare = 0;
  let fareCurrency = currency;
  let offerItems: Array<{
    offerItemId: string;
    paxRefId: string[];
    seatSelection?: { column: string; row: string };
  }> | undefined;

  if (repricedOffer) {
    // RepricedOffer Mode (AY, SQ, etc.)
    responseId = repricedOffer.ResponseID || '';
    offerId = repricedOffer.OfferID || orderId;
    owner = repricedOffer.Owner || '';
    newFare = repricedOffer.TotalPrice?.TotalAmount?.Amount || 0;
    fareCurrency = repricedOffer.TotalPrice?.TotalAmount?.CurCode || currency;
    offerItems = repricedOffer.RepricedOfferItem?.map(item => ({
      offerItemId: item.OfferItemID,
      paxRefId: item.PaxRefID || [],
    }));
  } else if (reshopOffer) {
    // ReshopOffers Mode (AY Seat selection included)
    responseId = reshopOffer.ResponseID || '';
    offerId = reshopOffer.OfferID || orderId;
    owner = reshopOffer.Owner || '';
    newFare = reshopOffer.TotalPrice?.TotalAmount?.Amount || 0;
    fareCurrency = reshopOffer.TotalPrice?.TotalAmount?.CurCode || currency;
    offerItems = reshopOffer.AddOfferItem?.map(item => {
      const seatService = item.Service?.find(service => service.SelectedSeat);
      const selectedSeat = seatService?.SelectedSeat;
      const seatSelection =
        selectedSeat?.Column && selectedSeat?.Row
          ? { column: selectedSeat.Column, row: selectedSeat.Row }
          : undefined;

      return {
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID || [],
        seatSelection,
      };
    });
  } else if (orderQuoteData) {
    // OrderQuote/QuotedOrder Mode (Other carriers)
    const quotedOrder = orderQuoteData.QuotedOrder;
    const offerPriceData = orderQuoteData.OfferPrice?.Offer;

    responseId = orderQuoteData.ResponseID || '';
    offerId = quotedOrder?.OrderID || offerPriceData?.OfferID || orderId;
    owner = quotedOrder?.OwnerCode || offerPriceData?.OwnerCode || '';
    newFare =
      quotedOrder?.TotalPrice?.SimpleCurrencyPrice?.value ||
      offerPriceData?.TotalPrice?.SimpleCurrencyPrice?.value ||
      0;
    fareCurrency =
      quotedOrder?.TotalPrice?.SimpleCurrencyPrice?.Code ||
      offerPriceData?.TotalPrice?.SimpleCurrencyPrice?.Code ||
      currency;
    offerItems = offerPriceData?.OfferItem?.map(item => ({
      offerItemId: item.OfferItemID,
      paxRefId: item.PaxRefID || [],
    }));
  }

  // Calculate difference
  const original = originalAmount || newFare;
  const difference = newFare - original;

  // Build TicketingQuote response
  const quote: TicketingQuote = {
    responseId,
    offerId,
    owner,
    fareDifference: {
      originalFare: original,
      newFare,
      difference,
      currency: fareCurrency,
      differenceLabel: formatFareDifferenceLabel(difference, fareCurrency),
    },
    offerItems,
  };

  if (import.meta.env.DEV) {
    console.log('[OrderQuote] Success:', quote);
  }

  return {
    success: true,
    quote,
    transactionId,
  };
}

// ============================================================
// 10. processTicketing (from api/order-change-ticketing/route.ts)
// ============================================================

interface ProcessTicketingParams extends Omit<PaymentRequest, 'paymentMethod' | 'amount'> {
  paymentMethod?: PaymentRequest['paymentMethod'];
  amount?: PaymentRequest['amount'];
  acceptOnly?: boolean;
  /** AF/KL Pattern A Step 2 - OrderItemIDs from seat-purchase/confirm Step 1 */
  seatOrderItemIds?: string[];
}

export async function processTicketing(params: ProcessTicketingParams): Promise<TicketingResult> {
  const {
    transactionId,
    orderId,
    owner,
    paymentMethod,
    card,
    agentDeposit,
    voucher,
    quoteData,
    amount,
    skipChangeOrderChoice,
    acceptOnly,
  } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_TXN, 400);
  }

  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  if (!owner) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_CARRIER, 400);
  }

  // acceptOnly=true: paymentMethod/amount not required
  if (!acceptOnly && !skipChangeOrderChoice && !paymentMethod) {
    throw new ApiError(ERROR_MESSAGES.PAYMENT_REQUIRED_METHOD, 400);
  }

  // Step 2 (Payment) call: paymentMethod/amount required
  if (skipChangeOrderChoice && (!paymentMethod || !amount)) {
    throw new ApiError(ERROR_MESSAGES.PAYMENT_REQUIRED_INFO, 400);
  }

  // Build paymentList based on payment method
  // CRITICAL: flattened structure, type starts with Uppercase
  // acceptOnly=true: no paymentList (Step 1)
  const paymentList: MiddlewarePayment[] = [];

  if (!acceptOnly && amount) {
    if (paymentMethod === 'card' && card) {
      paymentList.push({
        type: 'Card',
        amount: amount.amount,
        curCode: amount.currencyCode,
        cardCode: card.cardCode,
        cardNumber: card.cardNumber,
        cardHolderName: card.cardHolderName,
        expiration: card.expiration,
        seriesCode: card.seriesCode,
        orderItemId: [],
        offerItemId: [],
        paxRefId: [],
      });
    } else if (paymentMethod === 'cash') {
      paymentList.push({
        type: 'Cash',
        amount: amount.amount,
        curCode: amount.currencyCode,
        orderItemId: [],
        offerItemId: [],
        paxRefId: [],
      });
    } else if (paymentMethod === 'agt') {
      // TR Carrier uses 'Ag' type
      const agtType = owner === 'TR' ? 'Ag' : 'AGT';
      paymentList.push({
        type: agtType as 'AGT' | 'Ag',
        amount: amount.amount,
        curCode: amount.currencyCode,
        agentDepositId: agentDeposit?.agentDepositId,
        orderItemId: [],
        offerItemId: [],
        paxRefId: [],
      });
    } else if ((paymentMethod === 'voucher' || paymentMethod === 'voucher_cash') && voucher) {
      paymentList.push({
        type: 'Voucher',
        amount: amount.amount,
        curCode: amount.currencyCode,
        voucherId: voucher.voucherId,
        orderItemId: [],
        offerItemId: [],
        paxRefId: [],
      });
    }
  }

  if (skipChangeOrderChoice && paymentList.length === 0) {
    throw new ApiError(ERROR_MESSAGES.PAYMENT_INVALID, 400);
  }

  // Build changeOrderChoice based on carrier group
  const group = getCarrierGroup(owner);
  const offerRefId: string[] = quoteData?.offerId ? [quoteData.offerId] : [orderId];

  // Build OrderChange request
  // v1.5.0: AY Two-Step branching
  // - acceptOnly + seatSelection: AcceptSelectedQuotedOfferList
  // - acceptOnly + no seatSelection: AcceptRepricedOrder
  // - skipChangeOrderChoice: OrderID + PaymentList only
  let changeRequest: Record<string, unknown>;

  if (acceptOnly) {
    // Step 1: acceptRepricedOrder or acceptSelectedQuotedOfferList
    const hasSeatSelection = quoteData?.offerItems?.some(item => item.seatSelection);

    if (hasSeatSelection) {
      // Seat included: AcceptSelectedQuotedOfferList
      if (import.meta.env.DEV) {
        console.log('[OrderChange Ticketing] AY Step 1: AcceptSelectedQuotedOfferList (with seatSelection)');
      }
      changeRequest = {
        transactionId,
        orderId,
        changeOrderChoice: {
          acceptSelectedQuotedOfferList: {
            selectedPricedOffer: [{
              offerId: quoteData?.offerId || orderId,
              owner,
              responseId: quoteData?.responseId || transactionId,
              offerItems: quoteData?.offerItems?.map(item => ({
                offerItemId: item.offerItemId,
                paxRefId: item.paxRefId,
                seatSelection: item.seatSelection,
              })) || [],
            }],
          },
        },
      };
    } else {
      // Flight only: AcceptRepricedOrder (OfferRefID)
      if (import.meta.env.DEV) {
        console.log('[OrderChange Ticketing] AY Step 1: AcceptRepricedOrder (flight only)');
      }
      changeRequest = {
        transactionId,
        orderId,
        changeOrderChoice: {
          acceptRepricedOrder: {
            offerRefId,
          },
        },
      };
    }
  } else if (skipChangeOrderChoice) {
    // v3.26: AF/KL Pattern A Step 2 vs AY/SQ Step 2 branching
    const isPatternAStep2 = ['AF', 'KL'].includes(owner) && params.seatOrderItemIds?.length;

    if (isPatternAStep2) {
      // AF/KL Pattern A Step 2: acceptRepricedOrder + Cash paymentList (with orderItemId) + paxList + contactInfoList
      // MW requires Cash type for AF/KL Step 2 (card fields like cardCode, cardNumber are rejected!)
      if (import.meta.env.DEV) {
        console.log('[OrderChange Ticketing] AF/KL Pattern A Step 2: acceptRepricedOrder + Cash paymentList with orderItemIds');
      }
      const step2Amount = paymentList[0]?.amount || amount?.amount || 0;
      const step2CurCode = paymentList[0]?.curCode || amount?.currencyCode || 'KRW';
      changeRequest = {
        transactionId,
        orderId,
        changeOrderChoice: {
          acceptRepricedOrder: {
            offerRefId: [orderId],
          },
        },
        paymentList: [{
          type: 'Cash',
          amount: step2Amount,
          curCode: step2CurCode,
          orderItemId: params.seatOrderItemIds || [],
          offerItemId: [],
          paxRefId: [],
        }],
        paxList: [],
        contactInfoList: [],
      };
    } else {
      // AY/SQ Step 2: OrderID + PaymentList only (no changeOrderChoice)
      if (import.meta.env.DEV) {
        console.log('[OrderChange Ticketing] AY/SQ Step 2: OrderID + PaymentList only');
      }
      changeRequest = {
        transactionId,
        orderId,
        paymentList,
      };
    }
  } else {
    // General Ticketing: changeOrderChoice + paymentList
    changeRequest = {
      transactionId,
      orderId,
      changeOrderChoice: {
        acceptRepricedOrder: {
          offerRefId,
        },
      },
      paymentList,
    };
  }

  if (import.meta.env.DEV) {
    console.log('[OrderChange Ticketing] Request:', JSON.stringify(changeRequest, null, 2));
    console.log('[OrderChange Ticketing] Carrier Group:', group);
    console.log('[OrderChange Ticketing] acceptOnly:', acceptOnly);
    console.log('[OrderChange Ticketing] skipChangeOrderChoice:', skipChangeOrderChoice);
  }

  // Call middleware backend
  const changeResponse = await orderChange<MiddlewareOrderChangeResponse>(changeRequest as unknown as OrderChangeRequest);

  if (import.meta.env.DEV) {
    console.log('[OrderChange Ticketing] Response:', JSON.stringify(changeResponse, null, 2).slice(0, 1000));
  }

  // Check result
  // CRITICAL: response wrapper!
  const resultMessage = changeResponse.response?.ResultMessage;
  const resultCode = resultMessage?.Code;
  const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    const errorMessage = resultMessage?.Message || ERROR_MESSAGES.PAYMENT_FAILED;
    if (import.meta.env.DEV) {
      console.error('[OrderChange Ticketing] Failed:', errorMessage, 'Code:', resultCode);
    }
    throw new ApiError(errorMessage, 400);
  }

  // Extract ticket numbers from response
  // CRITICAL: response wrapper -> TicketDocInfo
  // acceptOnly=true: no ticket issued (Step 1)
  const ticketNumbers = changeResponse.response?.TicketDocInfo
    ?.filter(doc => doc.Type === 'TICKET' || doc.Type === 'T')
    ?.map(doc => doc.TicketDocNbr)
    ?.filter((num): num is string => !!num) || [];

  // Build success response
  let ticketMessage: string;
  const status: 'TICKETED' | 'ERROR' = 'TICKETED';

  if (acceptOnly) {
    ticketMessage = 'Repriced order accepted. Processing payment...';
  } else if (ticketNumbers.length > 0) {
    ticketMessage = 'Ticketing Complete. Ticket Number: ' + ticketNumbers.join(', ');
  } else {
    ticketMessage = 'Ticketing Complete.';
  }

  return {
    success: true,
    orderId: changeResponse.response?.Order?.OrderID || orderId,
    status,
    ticketNumbers: ticketNumbers.length > 0 ? ticketNumbers : undefined,
    message: ticketMessage,
  };
}

// ============================================================
// 11. getReshopTicketing (from api/order-reshop-ticketing/route.ts)
// ============================================================

export async function getReshopTicketing(params: {
  transactionId: string;
  orderId: string;
  originalAmount?: number;
  currency?: string;
}): Promise<ReshopTicketingResult> {
  const { transactionId, orderId, originalAmount, currency = 'KRW' } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_TXN, 400);
  }

  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // Build OrderReshop request (actionContext: "8" for Voluntary)
  // CRITICAL: updateOrder must include repricedOrderRefId!
  // Group A Post-ticketing: orderId as repricedOrderRefId
  const reshopRequest: OrderReshopRequest = {
    transactionId,
    orderId,
    actionContext: '8', // Voluntary change
    updateOrder: {
      repricedOrderRefId: orderId, // Required! Empty object causes 400 error
    },
  };

  if (import.meta.env.DEV) {
    console.log('[OrderReshop Ticketing] Request:', JSON.stringify(reshopRequest, null, 2));
  }

  // Call middleware backend
  const reshopResponse = await orderReshop<PaymentOrderReshopResponse>(reshopRequest);

  // Check result
  const resultCode = reshopResponse.ResultMessage?.Code;
  const isSuccess = resultCode === 'OK' || resultCode === '00000' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    const errorMessage = reshopResponse.ResultMessage?.Message || ERROR_MESSAGES.FARE_RECALC_FAILED;
    if (import.meta.env.DEV) {
      console.error('[OrderReshop Ticketing] Failed:', errorMessage);
    }
    throw new ApiError(errorMessage, 400);
  }

  // Extract quote data from response
  const reshopOffer = reshopResponse.Response?.ReshopOffer;
  const offer = reshopOffer?.Offer;

  const responseId = reshopOffer?.ResponseID || '';
  const offerId = offer?.OfferID || orderId;
  const owner = offer?.OwnerCode || '';
  const newFare = offer?.TotalPrice?.SimpleCurrencyPrice?.value || 0;
  const fareCurrency = offer?.TotalPrice?.SimpleCurrencyPrice?.Code || currency;

  // Calculate difference
  const original = originalAmount || newFare;
  const difference = newFare - original;

  // Get offer items
  const offerItems = offer?.OfferItem?.map(item => ({
    offerItemId: item.OfferItemID,
    paxRefId: item.PaxRefID || [],
  }));

  // Build TicketingQuote response
  const quote: TicketingQuote = {
    responseId,
    offerId,
    owner,
    fareDifference: {
      originalFare: original,
      newFare,
      difference,
      currency: fareCurrency,
      differenceLabel: formatFareDifferenceLabel(difference, fareCurrency),
    },
    offerItems,
  };

  if (import.meta.env.DEV) {
    console.log('[OrderReshop Ticketing] Success:', quote);
  }

  return {
    success: true,
    quote,
    transactionId,
  };
}

// ============================================================
// 12. splitPax (from api/booking/[id]/pax-split/route.ts)
// ============================================================

export async function splitPax(params: {
  orderId: string;
  splitPaxId: string;
}): Promise<PaxSplitResult> {
  const { orderId, splitPaxId } = params;

  // Validation
  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  if (!splitPaxId) {
    throw new ApiError(ERROR_MESSAGES.PAX_SPLIT_REQUIRED, 400);
  }

  // Step 1: OrderRetrieve to get current booking information
  const transactionId = generateTransactionId();

  if (import.meta.env.DEV) {
    console.log('[Pax Split] OrderRetrieve Request:', { transactionId, orderId });
  }

  const retrieveResponse = await orderRetrieve<OrderRetrieveForSplit>({
    transactionId,
    orderId,
  });

  const retrieveCode = retrieveResponse.ResultMessage?.Code;
  const isRetrieveSuccess = isSuccessCode(retrieveCode);

  if (!isRetrieveSuccess || !retrieveResponse.Order) {
    throw new ApiError(
      retrieveResponse.ResultMessage?.Message || ERROR_MESSAGES.BOOKING_RETRIEVE_FAILED,
      400
    );
  }

  const order = retrieveResponse.Order;
  const dataLists = retrieveResponse.DataLists;
  const paxList = dataLists?.PaxList || [];
  const contactInfoList = dataLists?.ContactInfoList || [];

  // Carrier code extraction
  const owner = order.Owner || order.OrderItem?.[0]?.Owner || '';

  // Carrier support check
  if (!supportsPaxSplit(owner)) {
    throw new ApiError(ERROR_MESSAGES.PAX_SPLIT_NOT_SUPPORTED(owner), 400);
  }

  // Find split target passenger
  const splitPax = paxList.find(p => p.PaxID === splitPaxId);
  if (!splitPax) {
    throw new ApiError(ERROR_MESSAGES.PAX_SPLIT_NOT_FOUND, 400);
  }

  // INF cannot be split alone
  if (splitPax.Ptc === 'INF') {
    throw new ApiError(ERROR_MESSAGES.PAX_SPLIT_INFANT_ONLY, 400);
  }

  // ADT/CHD count check (at least 1 must remain)
  const adultChildCount = paxList.filter(p => p.Ptc !== 'INF').length;
  if (adultChildCount < 2) {
    throw new ApiError(ERROR_MESSAGES.PAX_SPLIT_MIN_PAX, 400);
  }

  // Find accompanying infant (when ADT split)
  // INF's PaxRefID points to the ADT being split
  const accompanyingInfant = paxList.find(
    p => p.Ptc === 'INF' && p.PaxRefID === splitPaxId
  );

  // Step 2: Build OrderChange Split Request
  // CRITICAL: camelCase! No Sender/Query wrapper!

  // PaxList conversion (camelCase format!)
  // CRITICAL: paxRefId must be completely excluded from paxList! (including INF)
  if (import.meta.env.DEV) {
    console.log("[Pax Split DEBUG] Original paxList:", JSON.stringify(paxList.map(p => ({ PaxID: p.PaxID, Ptc: p.Ptc, PaxRefID: p.PaxRefID })), null, 2));
  }

  interface MiddlewarePaxInfo {
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

  const middlewarePaxList: MiddlewarePaxInfo[] = paxList.map(pax => {
    const contactRefIds = Array.isArray(pax.ContactInfoRefID)
      ? pax.ContactInfoRefID
      : pax.ContactInfoRefID ? [pax.ContactInfoRefID] : [];

    const paxInfo: MiddlewarePaxInfo = {
      paxId: pax.PaxID,
      ptc: pax.Ptc,
      individual: {
        individualId: pax.Individual?.IndividualID || pax.PaxID,
        birthdate: pax.Individual?.Birthdate,
        gender: pax.Individual?.Gender,
        nameTitle: pax.Individual?.NameTitle,
        givenName: pax.Individual?.GivenName || [],
        middleName: pax.Individual?.MiddleName || [],
        surname: pax.Individual?.Surname || '',
      },
      contactInfoRefId: contactRefIds,
      identityDoc: pax.IdentityDoc?.map(doc => ({
        identityDocumentNumber: doc.IdentityDocumentNumber,
        identityDocumentType: doc.IdentityDocumentType,
        issuingCountryCode: doc.IssuingCountryCode,
        citizenshipCountryCode: doc.CitizenshipCountryCode,
        expiryDate: doc.ExpiryDate,
        gender: doc.Gender,
        givenName: doc.GivenName,
        middleName: doc.MiddleName,
        surname: doc.Surname,
      })),
      loyaltyProgramAccount: pax.LoyaltyProgramAccount || [],
    };
    // CRITICAL v1.2.2: paxRefId completely excluded from paxList! (including INF)

    return paxInfo;
  });

  // ContactInfoList conversion (camelCase!)
  // CRITICAL: phoneNumber must be string! number causes error!
  interface MiddlewareContactInfo {
    contactInfoId: string;
    emailAddress?: string[];
    phone?: Array<{
      countryDialingCode?: string;
      phoneNumber?: string;
    }>;
  }

  const middlewareContactInfoList: MiddlewareContactInfo[] = contactInfoList.map(ci => ({
    contactInfoId: ci.ContactInfoID,
    emailAddress: ci.EmailAddress,
    phone: ci.Phone?.map(p => ({
      countryDialingCode: p.CountryDialingCode,
      // phoneNumber converted to string (API spec requirement)
      phoneNumber: String(p.PhoneNumber ?? ''),
    })),
  }));

  // CRITICAL: camelCase structure! reasonCode at top-level!
  const middlewareRequest: MiddlewarePaxSplitRequest = {
    transactionId,
    orderId,
    // CRITICAL: "DIV" = Passenger Split operation (Top-level!)
    reasonCode: 'DIV',
    changeOrderChoice: {
      // CRITICAL v1.2.3: Selected passenger only! (Accompanying INF auto-processed)
      updatePax: [{ newPaxRefId: splitPaxId }],
    },
    paxList: middlewarePaxList,
    contactInfoList: middlewareContactInfoList,
    paymentList: [],
  };

  if (import.meta.env.DEV) {
    console.log("[Pax Split DEBUG] middlewarePaxList:", JSON.stringify(middlewarePaxList.map(p => ({ paxId: p.paxId, ptc: p.ptc })), null, 2));
    console.log("[Pax Split] OrderChange Split Request:", JSON.stringify(middlewareRequest, null, 2));
  }

  // Step 3: Call middleware backend
  const splitResponse = await orderChange<MiddlewarePaxSplitResponse>(middlewareRequest);

  if (import.meta.env.DEV) {
    console.log('[Pax Split] OrderChange Split Response:', JSON.stringify(splitResponse, null, 2));
  }

  // Response processing
  const resultCode = splitResponse.response?.ResultMessage?.Code;
  const isSuccess = resultCode === '00000' || resultCode === '0' || resultCode === 'SUCCESS';

  if (!isSuccess) {
    throw new ApiError(
      splitResponse.response?.ResultMessage?.Message || ERROR_MESSAGES.PAX_SPLIT_FAILED,
      400
    );
  }

  // Extract new PNR info
  // From BookingReference, Type: "ASSOCIATED_BOOKING" = child PNR
  const newBookingRef = splitResponse.response?.Order?.BookingReference?.find(
    ref => ref.Type === 'ASSOCIATED_BOOKING'
  );

  return {
    success: true,
    newOrderId: splitResponse.response?.Order?.OrderID,
    newPnr: newBookingRef?.Id,
    parentOrderId: orderId,
    message: accompanyingInfant
      ? 'Passenger Split Complete. (Accompanying Infant Include)'
      : 'Passenger Split Complete.',
  };
}

// ============================================================
// 20. processJourneyChange (from api/booking/[id]/journey-change/route.ts)
// ============================================================

type AnyObject = Record<string, unknown>;

export interface JourneyChangeResult {
  success: true;
  reshopOffers: ReshopOffer[];
  transactionId: string;
}

/**
 * Helper: Transform ReshopOffers from middleware response
 */
function transformReshopOffers(data: AnyObject): ReshopOffer[] {
  const reshopOffers = (data.ReshopOffers || data.reshopOffers || []) as AnyObject[];

  return reshopOffers.map((offer) => ({
    responseId: (offer.ResponseID || offer.responseId || '') as string,
    offerId: (offer.OfferID || offer.offerId || '') as string,
    owner: (offer.Owner || offer.owner || '') as string,
    totalPrice: {
      totalAmount: {
        amount: ((offer.TotalPrice as AnyObject)?.TotalAmount as AnyObject)?.Amount as number
          || ((offer.totalPrice as AnyObject)?.totalAmount as AnyObject)?.amount as number || 0,
        curCode: ((offer.TotalPrice as AnyObject)?.TotalAmount as AnyObject)?.CurCode as string
          || ((offer.totalPrice as AnyObject)?.totalAmount as AnyObject)?.curCode as string || 'KRW',
      },
    },
    priceDifference: (offer.PriceDifference || offer.priceDifference)
      ? {
          amount: ((offer.PriceDifference as AnyObject)?.Amount as number)
            || ((offer.priceDifference as AnyObject)?.amount as number) || 0,
          curCode: ((offer.PriceDifference as AnyObject)?.CurCode as string)
            || ((offer.priceDifference as AnyObject)?.curCode as string) || 'KRW',
        }
      : undefined,
    offerItems: transformJourneyOfferItems(
      (offer.OfferItem || offer.offerItems || offer.AddOfferItem || []) as AnyObject[]
    ),
    flights: transformJourneyFlights(offer, data),
  }));
}

function transformJourneyOfferItems(items: AnyObject[]): { offerItemId: string; paxRefId: string[] }[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    offerItemId: (item.OfferItemID || item.offerItemId || '') as string,
    paxRefId: (item.PaxRefID || item.paxRefId || []) as string[],
  }));
}

function transformJourneyFlights(offer: AnyObject, data: AnyObject): ReshopFlight[] {
  const dataLists = (data.DataLists || data.dataLists || {}) as AnyObject;
  const paxSegmentList = (dataLists.PaxSegmentList || dataLists.paxSegmentList || []) as AnyObject[];
  const paxJourneyList = (dataLists.PaxJourneyList || dataLists.paxJourneyList || []) as AnyObject[];

  const offerItems = (offer.AddOfferItem || offer.OfferItem || offer.offerItems || []) as AnyObject[];
  const journeyRefs: string[] = [];

  for (const item of offerItems) {
    const refs = (item.PaxJourneyRefID || item.paxJourneyRefId || []) as string[];
    if (Array.isArray(refs)) {
      journeyRefs.push(...refs);
    }
    const services = (item.Service || []) as AnyObject[];
    for (const svc of services) {
      const svcRef = (svc.PaxJourneyRefID || svc.paxJourneyRefId || '') as string;
      if (typeof svcRef === 'string' && svcRef.includes(' ')) {
        journeyRefs.push(...svcRef.split(' '));
      }
    }
  }

  const uniqueJourneyRefs = [...new Set(journeyRefs)];
  const segmentRefs: string[] = [];

  for (const journeyId of uniqueJourneyRefs) {
    const journey = paxJourneyList.find((j) =>
      ((j.PaxJourneyID || j.paxJourneyId) as string) === journeyId
    );
    if (journey) {
      const segRefs = (journey.PaxSegmentRefID || journey.paxSegmentRefId || []) as string[];
      segmentRefs.push(...segRefs);
    }
  }

  // Fallback: direct PaxSegmentRefID from offer items
  if (segmentRefs.length === 0) {
    for (const item of offerItems) {
      const refs = (item.PaxSegmentRefID || item.paxSegmentRefId || []) as string[];
      if (Array.isArray(refs)) segmentRefs.push(...refs);
    }
  }

  return paxSegmentList
    .filter((seg) =>
      segmentRefs.includes(String(seg.PaxSegmentID || seg.paxSegmentId || ''))
    )
    .map((seg) => {
      const departure = (seg.Departure || seg.departure || seg.Dep || seg.dep || {}) as AnyObject;
      const arrival = (seg.Arrival || seg.arrival || {}) as AnyObject;
      const marketingCarrier = (seg.MarketingCarrier || seg.marketingCarrier
        || seg.MarketingCarrierInfo || seg.marketingCarrierInfo || {}) as AnyObject;
      const flightDuration = (seg.FlightDuration || seg.flightDuration || seg.Duration || seg.duration || '') as string;

      const origin = (departure.AirportCode || departure.IATALocationCode || departure.iataLocationCode || '') as string;
      const destination = (arrival.AirportCode || arrival.IATALocationCode || arrival.iataLocationCode || '') as string;

      const depTime = (departure.Time || '') as string;
      const arrTime = (arrival.Time || '') as string;
      const depDateTime = (departure.AircraftScheduledDateTime || departure.aircraftScheduledDateTime) as string | undefined;
      const arrDateTime = (arrival.AircraftScheduledDateTime || arrival.aircraftScheduledDateTime) as string | undefined;

      const carrierCode = (marketingCarrier.AirlineID || marketingCarrier.airlineId
        || marketingCarrier.CarrierDesigCode || marketingCarrier.carrierDesigCode || '') as string;
      const flightNumber = (marketingCarrier.FlightNumber || marketingCarrier.flightNumber
        || marketingCarrier.MarketingCarrierFlightNumberText || marketingCarrier.marketingCarrierFlightNumberText || '') as string;

      return {
        segmentKey: String(seg.PaxSegmentID || seg.paxSegmentId || ''),
        carrierCode: String(carrierCode),
        flightNumber: String(flightNumber),
        origin: String(origin),
        destination: String(destination),
        departureTime: depTime ? depTime.substring(0, 5) : formatJourneyTime(depDateTime),
        arrivalTime: arrTime ? arrTime.substring(0, 5) : formatJourneyTime(arrDateTime),
        duration: formatJourneyDuration(flightDuration),
        cabin: 'Y',
        stops: 0,
      };
    });
}

function formatJourneyTime(dateTime?: string): string {
  if (!dateTime) return '';
  try {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateTime;
  }
}

function formatJourneyDuration(duration?: string): string {
  if (!duration) return '';
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (match) {
    const hours = match[1];
    const minutes = match[2] || '0';
    return `${hours}h ${minutes}m`;
  }
  return duration;
}

export async function processJourneyChange(
  orderId: string,
  params: {
    transactionId: string;
    changeMode: JourneyChangeMode;
    originDestList: OriginDest[];
    deleteItems: DeleteItem[];
    cabin?: string;
  }
): Promise<JourneyChangeResult> {
  const { transactionId, changeMode, originDestList, deleteItems, cabin } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_TXN, 400);
  }
  if (!changeMode) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_MODE, 400);
  }
  if ((changeMode === 'change' || changeMode === 'add') && (!originDestList || originDestList.length === 0)) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_ORIGIN_DEST, 400);
  }
  if ((changeMode === 'change' || changeMode === 'delete') && (!deleteItems || deleteItems.length === 0)) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_DELETE, 400);
  }

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Reshop] Request:', {
      orderId, changeMode,
      originDestCount: originDestList?.length || 0,
      deleteCount: deleteItems?.length || 0,
    });
  }

  // Build OrderReshop Request
  const reshopRequest = {
    transactionId,
    orderId,
    actionContext: '8', // Voluntary
    updateOrder: {
      reshopOrder: {
        serviceOrder: {
          add: {
            originDestList: originDestList || [],
            cabin: cabin || 'Y',
          },
          delete: deleteItems || [],
        },
      },
    },
  };

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Reshop] Calling middleware:', JSON.stringify(reshopRequest, null, 2));
  }

  // Call Middleware directly (journey-change uses direct fetch, not typed client)
  const url = `${MIDDLEWARE_BASE_URL}/middleware/polarhub/order-reshop`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reshopRequest),
  });

  const data = await response.json();

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Reshop] Middleware response status:', response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || ERROR_MESSAGES.JOURNEY_RETRIEVE_FAILED,
      response.status
    );
  }

  // Transform Response
  const reshopOffers = transformReshopOffers(data as AnyObject);

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Reshop] Transformed offers:', reshopOffers.length);
  }

  return {
    success: true,
    reshopOffers,
    transactionId: (data as AnyObject).transactionId as string || transactionId,
  };
}

// ============================================================
// 21. getJourneyChangeQuote (from api/booking/[id]/journey-change/quote/route.ts)
// ============================================================

export interface JourneyChangeQuoteResult {
  success: true;
  responseId: string;
  offerId: string;
  totalPrice: number;
  currency: string;
  priceDifference?: number;
  offerItems: Array<{ offerItemId: string; paxRefId: string[] }>;
}

export async function getJourneyChangeQuote(
  orderId: string,
  params: {
    transactionId: string;
    carrierCode: string;
    selectedOffer: JourneySelectedOffer & {
      totalPrice?: { totalAmount?: { amount: number; curCode: string }; amount?: number; curCode?: string };
      priceDifference?: { amount: number; curCode: string };
    };
    affect?: AffectItem[];
    isReprice?: boolean;
  }
): Promise<JourneyChangeQuoteResult> {
  const { transactionId, carrierCode, selectedOffer, affect } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_TXN, 400);
  }
  if (!selectedOffer) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_OFFER, 400);
  }

  const useOrderQuote = requiresJourneyOrderQuote(carrierCode);

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Quote] Request:', {
      orderId, carrierCode, useOrderQuote, offerId: selectedOffer.offerId,
    });
  }

  // ============================================================
  // Pattern C: OrderQuote (SQ/AY/KE/HA)
  // ============================================================
  if (useOrderQuote) {
    if (import.meta.env.DEV) {
      console.log('[JourneyChange/Quote] Pattern C: Calling OrderQuote');
    }

    const quoteRequest = {
      transactionId,
      orderId,
      selectedOffer: [{
        responseId: selectedOffer.responseId,
        offerId: selectedOffer.offerId,
        owner: selectedOffer.owner,
        offerItems: selectedOffer.offerItems,
      }],
      affect: affect || [],
    };

    const url = `${MIDDLEWARE_BASE_URL}/middleware/polarhub/order-quote`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteRequest),
    });

    const data = await response.json() as AnyObject;

    if (import.meta.env.DEV) {
      console.log('[JourneyChange/Quote] OrderQuote response status:', response.status);
    }

    if (!response.ok) {
      throw new ApiError(
        (data.error || data.message || ERROR_MESSAGES.JOURNEY_QUOTE_FAILED) as string,
        response.status
      );
    }

    const resultCode = (data.ResultMessage as AnyObject)?.Code as string
      || (data.resultMessage as AnyObject)?.code as string;
    if (!isJourneySuccessCode(resultCode)) {
      throw new ApiError(
        ((data.ResultMessage as AnyObject)?.Message as string)
          || ((data.resultMessage as AnyObject)?.message as string)
          || ERROR_MESSAGES.JOURNEY_QUOTE_FAILED,
        400
      );
    }

    const quotedOffer = (data.QuotedOffer || data.quotedOffer || (data.response as AnyObject)?.QuotedOffer) as AnyObject | undefined;
    const responseId = (data.ResponseID || data.responseId || selectedOffer.responseId) as string;

    return {
      success: true,
      responseId,
      offerId: ((quotedOffer?.OfferID || quotedOffer?.offerId) as string) || selectedOffer.offerId,
      totalPrice: ((quotedOffer?.TotalPrice as AnyObject)?.TotalAmount as AnyObject)?.Amount as number
        || ((quotedOffer?.totalPrice as AnyObject)?.totalAmount as AnyObject)?.amount as number
        || 0,
      currency: ((quotedOffer?.TotalPrice as AnyObject)?.TotalAmount as AnyObject)?.CurCode as string
        || ((quotedOffer?.totalPrice as AnyObject)?.totalAmount as AnyObject)?.curCode as string
        || 'KRW',
      priceDifference: ((quotedOffer?.PriceDifference as AnyObject)?.Amount as number)
        || ((quotedOffer?.priceDifference as AnyObject)?.amount as number),
      offerItems: transformJourneyOfferItems(
        (quotedOffer?.OfferItems || quotedOffer?.offerItems || selectedOffer.offerItems || []) as AnyObject[]
      ),
    };
  }

  // ============================================================
  // Pattern A/B: Pass-through from OrderReshop search (TK/QR/AF/KL)
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Quote] Pattern A/B: Pass-through reshop offer prices');
  }

  const offerTotalPrice = selectedOffer.totalPrice;
  const totalPrice = offerTotalPrice?.totalAmount?.amount
    ?? offerTotalPrice?.amount
    ?? 0;
  const currency = offerTotalPrice?.totalAmount?.curCode
    ?? offerTotalPrice?.curCode
    ?? 'KRW';

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Quote] Pass-through prices:', {
      responseId: selectedOffer.responseId,
      offerId: selectedOffer.offerId,
      totalPrice, currency,
      priceDifference: selectedOffer.priceDifference,
    });
  }

  return {
    success: true,
    responseId: selectedOffer.responseId,
    offerId: selectedOffer.offerId,
    totalPrice,
    currency,
    priceDifference: selectedOffer.priceDifference?.amount,
    offerItems: transformJourneyOfferItems(
      (selectedOffer.offerItems || []) as unknown as AnyObject[]
    ),
  };
}

// ============================================================
// 22. confirmJourneyChange (from api/booking/[id]/journey-change/confirm/route.ts)
// ============================================================

export interface JourneyChangeConfirmResult {
  success: true;
  orderId: string;
  message: string;
}

export async function confirmJourneyChange(
  orderId: string,
  params: {
    transactionId: string;
    carrierCode: string;
    selectedOffer: JourneySelectedOffer;
  }
): Promise<JourneyChangeConfirmResult> {
  const { transactionId, carrierCode, selectedOffer } = params;

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_TXN, 400);
  }
  if (!selectedOffer) {
    throw new ApiError(ERROR_MESSAGES.JOURNEY_REQUIRED_OFFER, 400);
  }

  const isTwoStep = requiresJourneyTwoStepOrderChange(carrierCode);

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Request:', {
      orderId, carrierCode,
      offerId: selectedOffer.offerId, isTwoStep,
    });
  }

  // ============================================================
  // Step 1: OrderChange (acceptSelectedQuotedOfferList)
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 1: acceptSelectedQuotedOfferList');
  }

  const step1Request = {
    transactionId,
    orderId,
    changeOrderChoice: {
      acceptSelectedQuotedOfferList: {
        selectedPricedOffer: [{
          offerId: selectedOffer.offerId,
          owner: selectedOffer.owner,
          responseId: selectedOffer.responseId,
          offerItems: selectedOffer.offerItems,
        }],
      },
    },
    paymentList: [],
  };

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 1 request:', JSON.stringify(step1Request, null, 2));
  }

  const ocUrl = `${MIDDLEWARE_BASE_URL}/middleware/polarhub/order-change`;

  const step1Response = await fetch(ocUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step1Request),
  });

  const step1Data = await step1Response.json() as AnyObject;

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 1 response status:', step1Response.status);
  }

  if (!step1Response.ok) {
    throw new ApiError(
      ((step1Data.error || step1Data.message) as string) || ERROR_MESSAGES.JOURNEY_CHANGE_FAILED,
      step1Response.status
    );
  }

  // Check result code
  const step1ResultCode = ((step1Data.ResultMessage as AnyObject)?.Code as string)
    || ((step1Data.resultMessage as AnyObject)?.code as string);
  if (!isJourneySuccessCode(step1ResultCode)) {
    throw new ApiError(
      ((step1Data.ResultMessage as AnyObject)?.Message as string)
        || ((step1Data.resultMessage as AnyObject)?.message as string)
        || ERROR_MESSAGES.JOURNEY_CHANGE_FAILED,
      400
    );
  }

  // Non-2-step carriers: Return success immediately
  if (!isTwoStep) {
    if (import.meta.env.DEV) {
      console.log('[JourneyChange/Confirm] Single-step success');
    }
    return {
      success: true,
      orderId,
      message: 'Journey change complete.',
    };
  }

  // ============================================================
  // Step 2: AF/KL 2-step - acceptRepricedOrder + PaymentList
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] AF/KL: Step 1 success, proceeding to Step 2');
  }

  // v3.25: MW wraps Order inside `response` object
  const order = (step1Data.Order || step1Data.order
    || (step1Data.response as AnyObject)?.Order || (step1Data.response as AnyObject)?.order) as AnyObject | undefined;
  const totalAmount = ((order?.TotalPrice as AnyObject)?.TotalAmount
    || (order?.totalPrice as AnyObject)?.totalAmount) as AnyObject | undefined;
  const paymentAmount = (totalAmount?.Amount ?? totalAmount?.amount ?? 0) as number;
  const paymentCurCode = (totalAmount?.CurCode ?? totalAmount?.curCode ?? 'KRW') as string;

  const orderItems = (order?.OrderItem || order?.orderItem || []) as AnyObject[];
  const orderItemIds = orderItems
    .map((item) => (item.OrderItemID || item.orderItemId) as string)
    .filter(Boolean);

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 2 payment info:', {
      paymentAmount, paymentCurCode, orderItemIds,
    });
  }

  const step2Request = {
    transactionId,
    orderId,
    changeOrderChoice: {
      acceptRepricedOrder: {
        offerRefId: [orderId],
      },
    },
    paymentList: [{
      type: 'Cash',
      amount: paymentAmount,
      curCode: paymentCurCode,
      paxRefId: [],
      orderItemId: orderItemIds,
      offerItemId: [],
    }],
  };

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 2 request:', JSON.stringify(step2Request, null, 2));
  }

  const step2Response = await fetch(ocUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step2Request),
  });

  const step2Data = await step2Response.json() as AnyObject;

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] Step 2 response status:', step2Response.status);
  }

  if (!step2Response.ok) {
    throw new ApiError(
      ((step2Data.error || step2Data.message) as string) || ERROR_MESSAGES.JOURNEY_CHANGE_FAILED,
      step2Response.status
    );
  }

  const step2ResultCode = ((step2Data.ResultMessage as AnyObject)?.Code as string)
    || ((step2Data.resultMessage as AnyObject)?.code as string);
  if (!isJourneySuccessCode(step2ResultCode)) {
    throw new ApiError(
      ((step2Data.ResultMessage as AnyObject)?.Message as string)
        || ((step2Data.resultMessage as AnyObject)?.message as string)
        || ERROR_MESSAGES.JOURNEY_CHANGE_FAILED,
      400
    );
  }

  if (import.meta.env.DEV) {
    console.log('[JourneyChange/Confirm] AF/KL 2-step OrderChange completed successfully');
  }

  return {
    success: true,
    orderId,
    message: 'Journey change complete.',
  };
}
