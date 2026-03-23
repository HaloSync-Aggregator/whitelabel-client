/**
 * PolarHub NDC Service Layer - Ancillary Purchase Functions
 * @description Seat purchase and service purchase workflows (quote, confirm, process)
 */

import {
  offerPrice,
  orderRetrieve,
  orderQuote,
  orderChange,
  isSuccessCode,
  type OfferPriceRequest,
  type OrderQuoteRequest,
  type OrderChangeRequest,
} from '@/lib/api/middleware-client';
import {
  getQuoteApiType,
  getAirlineConfig,
  requiresTwoStepOrderChange as requiresSeatTwoStepOrderChange,
  requiresPolling,
  getSeatPurchaseGroup,
  requiresSeatQuote,
  requiresSeatOfferPrice,
  type SeatSelection,
  type SeatQuoteResponse,
  type SeatPurchaseResponse,
  type SeatConfirmResponse,
  type SeatPurchaseStatus,
} from '@/types/seat-purchase';
import {
  getServicePurchaseGroup,
  requiresSecondOrderChange,
  requiresAddStep,
  requiresTwoStepPayment,
  type ServiceQuoteRequest,
  type ServiceQuoteResponse,
  type ServiceAddRequest,
  type ServiceAddResponse,
  type ServiceConfirmRequest,
  type ServiceConfirmResponse,
  type ServicePurchaseStatus,
} from '@/types/service-purchase';
import { type SelectedService } from '@/types/service';
import { ApiError } from '@/lib/api/pax-change-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';

// ============================================================
// Seat Purchase Types
// ============================================================

export interface SeatPurchaseQuoteParams {
  transactionId: string;
  orderId: string;
  owner: string;
  isPaid?: boolean;
  seatAvailabilityData?: {
    responseId: string;
    offerId: string;
    owner: string;
  };
  selectedSeats: SeatSelection[];
  bookingPaxList?: Array<{ paxId: string; ptc: string }>;
}

export interface SeatPurchaseQuoteResult extends SeatQuoteResponse {
  quoteData?: {
    responseId?: string;
    offerId?: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: { column: string; row: string };
    }>;
  };
}

// ============================================================
// 13. getSeatPurchaseQuote (from api/booking/[id]/seat-purchase/quote/route.ts)
// ============================================================

export async function getSeatPurchaseQuote(
  orderId: string,
  params: SeatPurchaseQuoteParams
): Promise<SeatPurchaseQuoteResult> {
  const { transactionId, owner, seatAvailabilityData, selectedSeats } = params;
  const isPaid = params.isPaid ?? selectedSeats.some(s => s.price > 0);
  const quoteApiType = getQuoteApiType(owner, isPaid);

  if (import.meta.env.DEV) {
    console.log('[SeatQuote] Request:', {
      orderId, owner, quoteApiType, isPaid,
      seatCount: selectedSeats.length,
      hasSeatAvailabilityData: !!seatAvailabilityData,
    });
  }

  // ============================================================
  // Pattern B, C: OrderQuote (AY, SQ, TR, TK paid)
  // ============================================================
  if (quoteApiType === 'ORDER_QUOTE') {
    if (import.meta.env.DEV) {
      console.log('[SeatQuote] Pattern B/C: Calling OrderQuote');
    }

    if (!seatAvailabilityData) {
      throw new ApiError(ERROR_MESSAGES.SEAT_REQUIRED_SELECTION, 400);
    }

    const quoteRequest: OrderQuoteRequest = {
      transactionId,
      orderId,
      selectedOffer: [{
        responseId: seatAvailabilityData.responseId,
        offerId: seatAvailabilityData.offerId,
        owner: seatAvailabilityData.owner,
        offerItems: selectedSeats.map(seat => ({
          offerItemId: seat.offerItemId,
          paxRefId: [seat.paxId],
          seatSelection: { column: seat.column, row: seat.row },
        })),
      }],
    };

    const quoteResponse = await orderQuote<{
      transactionId: string;
      response: {
        ResultMessage?: { Code: string; Message?: string };
        ResponseID?: string;
        QuotedOffer?: {
          OfferID: string;
          Owner?: string;
          OfferItems?: Array<{ OfferItemID: string; PaxRefID?: string[] }>;
        };
        ReshopOffers?: Array<{
          OfferID: string;
          Owner?: string;
          ResponseID?: string;
          AddOfferItem?: Array<{
            OfferItemID: string;
            PaxRefID?: string[];
            Service?: Array<{
              SelectedSeat?: { Column?: string; Row?: string };
            }>;
          }>;
        }>;
      };
    }>(quoteRequest);

    const resultCode = quoteResponse.response?.ResultMessage?.Code;

    if (import.meta.env.DEV) {
      console.log('[SeatQuote] OrderQuote response:', {
        resultCode,
        isSuccess: isSuccessCode(resultCode),
        hasQuotedOffer: !!quoteResponse.response?.QuotedOffer,
        hasReshopOffers: !!quoteResponse.response?.ReshopOffers?.length,
      });
    }

    if (!isSuccessCode(resultCode)) {
      throw new ApiError(
        quoteResponse.response?.ResultMessage?.Message || ERROR_MESSAGES.SEAT_QUOTE_FAILED,
        400
      );
    }

    const res = quoteResponse.response;
    const seatSelectionByPax = new Map(
      selectedSeats.map(seat => [
        seat.paxId,
        { column: seat.column, row: seat.row },
      ])
    );

    const offerItems = (res.ReshopOffers?.[0]?.AddOfferItem?.map(item => {
      const seatService = item.Service?.find(service => service.SelectedSeat);
      const selectedSeat = seatService?.SelectedSeat;
      const paxId = item.PaxRefID?.[0];
      const fallbackSeat = paxId ? seatSelectionByPax.get(paxId) : undefined;
      const seatSel =
        selectedSeat?.Column && selectedSeat?.Row
          ? { column: selectedSeat.Column, row: selectedSeat.Row }
          : fallbackSeat;

      return {
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID || [],
        seatSelection: seatSel,
      };
    }) || res.QuotedOffer?.OfferItems?.map(item => {
      const paxId = item.PaxRefID?.[0];
      const seatSel = paxId ? seatSelectionByPax.get(paxId) : undefined;
      return {
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID || [],
        seatSelection: seatSel,
      };
    }) || selectedSeats.map(seat => ({
      offerItemId: seat.offerItemId,
      paxRefId: [seat.paxId],
      seatSelection: { column: seat.column, row: seat.row },
    })));

    const result: SeatPurchaseQuoteResult = {
      success: true,
      responseId: res.ReshopOffers?.[0]?.ResponseID || res.ResponseID || seatAvailabilityData.responseId,
      offerId: res.ReshopOffers?.[0]?.OfferID || res.QuotedOffer?.OfferID || seatAvailabilityData.offerId,
      totalPrice: selectedSeats.reduce((sum, s) => sum + s.price, 0),
      currency: selectedSeats[0]?.currency || 'KRW',
      offerItems,
      quoteData: {
        responseId: res.ReshopOffers?.[0]?.ResponseID || res.ResponseID || seatAvailabilityData.responseId,
        offerId: res.ReshopOffers?.[0]?.OfferID || res.QuotedOffer?.OfferID || seatAvailabilityData.offerId,
        offerItems,
      },
    };

    if (import.meta.env.DEV) {
      console.log('[SeatQuote] OrderQuote result:', result);
    }

    return result;
  }

  // ============================================================
  // Pattern A: OfferPrice (AF, KL)
  // ============================================================
  if (quoteApiType === 'OFFER_PRICE') {
    if (import.meta.env.DEV) {
      console.log('[SeatQuote] Pattern A: Calling OfferPrice');
    }

    if (!seatAvailabilityData) {
      throw new ApiError(ERROR_MESSAGES.SEAT_REQUIRED_SELECTION, 400);
    }

    // Use bookingPaxList (ALL booking pax) if available, fallback to selected seat pax
    const uniquePaxIds = [...new Set(selectedSeats.map(s => s.paxId))];
    const paxListForRequest = params.bookingPaxList && params.bookingPaxList.length > 0
      ? params.bookingPaxList.map(p => ({ paxId: p.paxId, ptc: p.ptc as 'ADT' | 'CHD' | 'INF' }))
      : uniquePaxIds.map(paxId => ({ paxId, ptc: 'ADT' as const }));

    const priceRequest: OfferPriceRequest = {
      transactionId,
      offers: [{
        responseId: seatAvailabilityData.responseId,
        offerId: seatAvailabilityData.offerId,
        owner: seatAvailabilityData.owner,
        offerItems: selectedSeats.map(seat => ({
          offerItemId: seat.offerItemId,
          paxRefId: [seat.paxId],
          seatSelection: { column: seat.column, row: seat.row },
        })),
      }],
      paxList: paxListForRequest,
      criteria: {
        existingOrderCriteria: {
          orderId,
          paxRefId: paxListForRequest.map(p => p.paxId),
        },
      },
    };

    const response = await offerPrice<{
      ResultMessage?: { Code: string; Message?: string };
      ResponseID?: string;
      PricedOffer?: {
        OfferID: string;
        Owner?: string;
        TotalPrice?: {
          TotalAmount?: { Amount: number; CurCode: string };
        };
        OfferItem?: Array<{
          OfferItemID: string;
          PaxRefID?: string[];
          FareDetail?: Array<{
            BaseAmount?: { Amount: number; CurCode: string };
            PaxRefID?: string[];
          }>;
        }>;
      };
    }>(priceRequest);

    const priceResultCode = response.ResultMessage?.Code;

    if (import.meta.env.DEV) {
      console.log('[SeatQuote] OfferPrice response:', {
        resultCode: priceResultCode,
        isSuccess: isSuccessCode(priceResultCode),
        hasPricedOffer: !!response.PricedOffer,
        offerItemCount: response.PricedOffer?.OfferItem?.length,
      });
    }

    if (!isSuccessCode(priceResultCode)) {
      throw new ApiError(
        response.ResultMessage?.Message || ERROR_MESSAGES.SEAT_QUOTE_FAILED,
        400
      );
    }

    // v3.25.0: Extract OfferItemID from OfferPrice RS (NOT SeatAvailability!)
    const pricedOfferItems = response.PricedOffer?.OfferItem || [];
    const offerItems = pricedOfferItems.length > 0
      ? pricedOfferItems.map((item, idx) => {
          const paxRefId = (item.PaxRefID?.length ? item.PaxRefID : null)
            ?? (item.FareDetail?.[0]?.PaxRefID?.length ? item.FareDetail[0].PaxRefID : null)
            ?? [selectedSeats[idx]?.paxId].filter(Boolean);
          return { offerItemId: item.OfferItemID, paxRefId };
        })
      : selectedSeats.map(seat => ({
          offerItemId: seat.offerItemId,
          paxRefId: [seat.paxId],
        }));

    // v3.25.0: Use OfferPrice RS TotalAmount (not FE selectedSeats price!)
    const offerPriceTotal = response.PricedOffer?.TotalPrice?.TotalAmount;
    const totalPrice = offerPriceTotal?.Amount
      ?? selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const currency = offerPriceTotal?.CurCode
      || selectedSeats[0]?.currency || 'KRW';

    const result: SeatPurchaseQuoteResult = {
      success: true,
      responseId: response.ResponseID || seatAvailabilityData.responseId,
      offerId: response.PricedOffer?.OfferID || seatAvailabilityData.offerId,
      totalPrice,
      currency,
      offerItems,
      quoteData: {
        responseId: response.ResponseID || seatAvailabilityData.responseId,
        offerId: response.PricedOffer?.OfferID || seatAvailabilityData.offerId,
        offerItems,
      },
    };

    if (import.meta.env.DEV) {
      console.log('[SeatQuote] OfferPrice result:', result);
    }

    return result;
  }

  // ============================================================
  // Pattern D, E: Quote not required (HA, TK Free)
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[SeatQuote] Pattern D/E: No quote needed, returning SeatAvailability data');
  }

  return {
    success: true,
    responseId: seatAvailabilityData?.responseId,
    offerId: seatAvailabilityData?.offerId,
    totalPrice: selectedSeats.reduce((sum, s) => sum + s.price, 0),
    currency: selectedSeats[0]?.currency || 'KRW',
    quoteData: {
      responseId: seatAvailabilityData?.responseId,
      offerId: seatAvailabilityData?.offerId,
    },
  };
}

// ============================================================
// 14. confirmSeatPurchase (from api/booking/[id]/seat-purchase/confirm/route.ts)
// ============================================================

export interface SeatConfirmParams {
  transactionId: string;
  orderId: string;
  owner: string;
  purchaseType: 'paid' | 'free';
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: { column: string; row: string };
    }>;
  };
  selectedSeats: SeatSelection[];
  step?: 1 | 2;
  orderItemIds?: string[];
  paymentMethod?: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
  card?: {
    cardCode: string;
    cardNumber: string;
    cardHolderName: string;
    expiration: string;
    seriesCode?: string;
  };
  agentDeposit?: { agentDepositId?: string };
  voucher?: { voucherId: string; voucherAmount: number };
  amount?: { currencyCode: string; amount: number };
}

export interface SeatConfirmResult extends SeatConfirmResponse {
  requiresPayment?: boolean;
  paymentAmount?: number;
  currency?: string;
  nextStep?: number;
  orderItemIds?: string[];
  quoteData?: {
    responseId: string;
    offerId: string;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
}

/**
 * Helper: Payment Type Mapping (seat-purchase)
 */
function mapSeatPaymentType(method: string, owner?: string): 'Card' | 'Cash' | 'AGT' | 'Voucher' | 'Ag' {
  if (owner === 'TR' && (method === 'agt' || method === 'cash')) {
    return 'Ag';
  }
  switch (method) {
    case 'card': return 'Card';
    case 'cash': return 'Cash';
    case 'agt': return 'AGT';
    case 'voucher':
    case 'voucher_cash': return 'Voucher';
    default: return 'Card';
  }
}

/**
 * Helper: Pattern D (HA) Polling for CONFIRMED Status
 */
const POLLING_INTERVAL_MS = 2000;
const POLLING_MAX_ATTEMPTS = 15;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollForConfirmedStatus(
  transactionId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 1; attempt <= POLLING_MAX_ATTEMPTS; attempt++) {
    if (import.meta.env.DEV) {
      console.log(`[SeatConfirm] Polling attempt ${attempt}/${POLLING_MAX_ATTEMPTS}`);
    }

    try {
      const retrieveResponse = await orderRetrieve<{
        ResultMessage?: { Code: string; Message?: string };
        Order?: {
          OrderID?: string;
          OrderItem?: Array<{
            Status?: { StatusCode?: string };
          }>;
        };
      }>({ transactionId, orderId });

      const resultCode = retrieveResponse.ResultMessage?.Code;
      if (!isSuccessCode(resultCode)) {
        await delay(POLLING_INTERVAL_MS);
        continue;
      }

      const seatStatus = retrieveResponse.Order?.OrderItem?.[0]?.Status?.StatusCode;
      if (import.meta.env.DEV) {
        console.log('[SeatConfirm] Polling: Seat status:', seatStatus);
      }

      if (seatStatus === 'CONFIRMED' || seatStatus === 'HK' || seatStatus === 'HD') {
        return { success: true };
      }

      if (seatStatus === 'XX' || seatStatus === 'UC') {
        return { success: false, error: ERROR_MESSAGES.SEAT_CONFIRM_FAILED };
      }

      await delay(POLLING_INTERVAL_MS);
    } catch {
      await delay(POLLING_INTERVAL_MS);
    }
  }

  return { success: false, error: ERROR_MESSAGES.SEAT_CONFIRM_TIMEOUT };
}

export async function confirmSeatPurchase(
  orderId: string,
  params: SeatConfirmParams
): Promise<SeatConfirmResult> {
  const { transactionId, owner, purchaseType, quoteData, selectedSeats } = params;
  const isPaid = purchaseType === 'paid';
  const config = getAirlineConfig(owner, isPaid);
  const step = params.step || 1;

  if (import.meta.env.DEV) {
    console.log('[SeatConfirm] Request:', {
      orderId, owner, pattern: config.pattern, step, purchaseType,
      hasQuoteData: !!quoteData, hasPayment: !!params.paymentMethod,
      seatCount: selectedSeats.length,
    });
  }

  const isStep2PaymentOnly = step === 2 && requiresSeatTwoStepOrderChange(owner, isPaid);

  let changeRequest: Record<string, unknown>;

  if (isStep2PaymentOnly) {
    // ============================================================
    // Step 2: Payment (Pattern A: AF/KL, Pattern B: AY/SQ)
    // ============================================================
    if (!params.paymentMethod || !params.amount) {
      throw new ApiError(ERROR_MESSAGES.PAYMENT_REQUIRED_INFO, 400);
    }

    const isPatternA = config.pattern === 'A';
    if (import.meta.env.DEV) {
      console.log(`[SeatConfirm] Step 2: ${isPatternA ? 'Pattern A (acceptRepricedOrder + payment)' : 'Pattern B (payment only)'}`);
    }

    changeRequest = {
      transactionId,
      orderId,
      ...(isPatternA
        ? { changeOrderChoice: { acceptRepricedOrder: { offerRefId: [orderId] } } }
        : { changeOrderChoice: {} }),
      paymentList: [{
        type: mapSeatPaymentType(params.paymentMethod, owner),
        amount: params.amount.amount,
        curCode: params.amount.currencyCode,
        orderItemId: params.orderItemIds || [],
        offerItemId: [],
        paxRefId: [],
        ...(params.card && {
          cardCode: params.card.cardCode,
          cardNumber: params.card.cardNumber,
          cardHolderName: params.card.cardHolderName,
          expiration: params.card.expiration,
          seriesCode: params.card.seriesCode,
        }),
        ...(params.agentDeposit?.agentDepositId && {
          agentDepositId: params.agentDeposit.agentDepositId,
        }),
        ...(params.voucher?.voucherId && {
          voucherId: params.voucher.voucherId,
        }),
      }],
      paxList: [],
      contactInfoList: [],
    };
  } else {
    // ============================================================
    // Step 1 or 1Step pattern: changeOrderChoice
    // ============================================================
    const quoteOfferItems = quoteData?.offerItems || [];
    const offerItemsWithSeatSelection = quoteOfferItems.length > 0
      ? quoteOfferItems.map(qi => {
          if (qi.seatSelection?.column && qi.seatSelection?.row) {
            return {
              offerItemId: qi.offerItemId,
              paxRefId: qi.paxRefId,
              seatSelection: { column: qi.seatSelection.column, row: qi.seatSelection.row },
            };
          }
          const originalSeat = selectedSeats.find(s => qi.paxRefId.includes(s.paxId));
          return {
            offerItemId: qi.offerItemId,
            paxRefId: qi.paxRefId,
            seatSelection: originalSeat
              ? { column: originalSeat.column, row: originalSeat.row }
              : undefined,
          };
        })
      : selectedSeats.map(seat => ({
          offerItemId: seat.offerItemId,
          paxRefId: [seat.paxId],
          seatSelection: { column: seat.column, row: seat.row },
        }));

    // v3.25.0: Pattern A (AF/KL) does NOT include seatSelection in OrderChange OfferItems
    const isPatternA = config.pattern === 'A';
    const finalOfferItems = isPatternA
      ? offerItemsWithSeatSelection.map(({ seatSelection: _removed, ...rest }) => rest)
      : offerItemsWithSeatSelection;

    changeRequest = {
      transactionId,
      orderId,
      changeOrderChoice: {
        acceptSelectedQuotedOfferList: {
          selectedPricedOffer: [{
            offerId: quoteData?.offerId || selectedSeats[0]?.offerItemId || orderId,
            owner,
            responseId: quoteData?.responseId,
            offerItems: finalOfferItems,
          }],
        },
      },
      paxList: [],
      contactInfoList: [],
      paymentList: [],
    };

    // Payment info for 1Step pattern (Pattern C, etc.)
    const shouldAddPayment = isPaid && params.paymentMethod && params.amount && config.orderChangeSteps === 1;

    if (shouldAddPayment && params.paymentMethod && params.amount) {
      if (import.meta.env.DEV) {
        console.log('[SeatConfirm] Adding payment info (1-step pattern):', {
          method: params.paymentMethod, amount: params.amount.amount,
          currency: params.amount.currencyCode, pattern: config.pattern,
        });
      }

      (changeRequest as Record<string, unknown>).paymentList = [{
        type: mapSeatPaymentType(params.paymentMethod, owner),
        amount: params.amount.amount,
        curCode: params.amount.currencyCode,
        orderItemId: [],
        offerItemId: quoteOfferItems.length > 0
          ? quoteOfferItems.map(qi => qi.offerItemId)
          : selectedSeats.map(s => s.offerItemId),
        paxRefId: [...new Set(selectedSeats.map(s => s.paxId))],
        ...(params.card && {
          cardCode: params.card.cardCode,
          cardNumber: params.card.cardNumber,
          cardHolderName: params.card.cardHolderName,
          expiration: params.card.expiration,
          seriesCode: params.card.seriesCode,
        }),
        ...(params.agentDeposit?.agentDepositId && {
          agentDepositId: params.agentDeposit.agentDepositId,
        }),
        ...(params.voucher?.voucherId && {
          voucherId: params.voucher.voucherId,
        }),
      }];
    }
  }

  // ============================================================
  // OrderChange Call
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[SeatConfirm] Calling OrderChange:', {
      pattern: config.pattern, step,
      hasPayment: !!(changeRequest as Record<string, unknown>).paymentList,
      hasChangeOrderChoice: !!(changeRequest as Record<string, unknown>).changeOrderChoice,
    });
  }

  const changeResponse = await orderChange<{
    transactionId: string;
    response: {
      ResultMessage?: { Code: string; Message?: string };
      Order?: {
        OrderID: string;
        TotalPrice?: { TotalAmount?: { Amount: number; CurCode: string } };
        OrderItem?: Array<{
          OrderItemID?: string;
          Status?: { StatusCode?: string };
        }>;
      };
    };
  }>(changeRequest as unknown as OrderChangeRequest);

  const res = changeResponse.response;
  const resultCode = res?.ResultMessage?.Code;

  if (import.meta.env.DEV) {
    console.log('[SeatConfirm] OrderChange response:', {
      resultCode, isSuccess: isSuccessCode(resultCode), hasOrder: !!res?.Order,
    });
  }

  if (!isSuccessCode(resultCode)) {
    throw new ApiError(
      res?.ResultMessage?.Message || ERROR_MESSAGES.SEAT_CONFIRM_FAILED,
      400
    );
  }

  // Pattern D (HA): Polling
  if (requiresPolling(owner) && step === 1) {
    if (import.meta.env.DEV) {
      console.log('[SeatConfirm] Pattern D: Starting polling for CONFIRMED status');
    }
    const pollingResult = await pollForConfirmedStatus(transactionId, orderId);
    if (!pollingResult.success) {
      throw new ApiError(pollingResult.error || ERROR_MESSAGES.SEAT_CONFIRM_TIMEOUT, 400);
    }
  }

  // 2Step pattern: Step 1 complete, return info for Step 2
  if (requiresSeatTwoStepOrderChange(owner, isPaid) && step === 1 && isPaid) {
    const statusCode = res?.Order?.OrderItem?.[0]?.Status?.StatusCode;
    const seatStatus: SeatPurchaseStatus = (statusCode as SeatPurchaseStatus) || 'HN';

    const mwTotal = res?.Order?.TotalPrice?.TotalAmount;
    const orderItemIdsFromResponse = (res?.Order?.OrderItem || [])
      .map(item => item.OrderItemID)
      .filter((id): id is string => !!id);

    if (import.meta.env.DEV) {
      console.log('[SeatConfirm] Pattern A/B/D step 1 complete:', {
        pattern: config.pattern, statusCode, requiresStep2: true,
        mwTotalAmount: mwTotal?.Amount, mwTotalCurrency: mwTotal?.CurCode,
        orderItemIds: orderItemIdsFromResponse,
      });
    }

    return {
      success: true,
      orderId: res?.Order?.OrderID || orderId,
      message: 'Seat hold complete. Payment in progress.',
      seatStatus,
      requiresPayment: true,
      paymentAmount: mwTotal?.Amount || selectedSeats.reduce((sum, s) => sum + s.price, 0),
      currency: mwTotal?.CurCode || selectedSeats[0]?.currency || 'KRW',
      nextStep: 2,
      orderItemIds: orderItemIdsFromResponse.length > 0 ? orderItemIdsFromResponse : undefined,
      quoteData: quoteData ? {
        responseId: quoteData.responseId || '',
        offerId: quoteData.offerId || orderId,
        offerItems: selectedSeats.map(s => ({
          offerItemId: s.offerItemId,
          paxRefId: [s.paxId],
        })),
      } : undefined,
    };
  }

  // Final success (1Step complete or Step 2 complete)
  return {
    success: true,
    orderId: res?.Order?.OrderID || orderId,
    message: isPaid ? 'Seat purchase completed.' : 'Seat has been changed.',
    seatStatus: 'HK',
  };
}

// ============================================================
// 15. processSeatPurchase (from api/booking/[id]/seat-purchase/route.ts)
// Orchestrator: calls getSeatPurchaseQuote/confirmSeatPurchase DIRECTLY
// ============================================================

export interface ProcessSeatPurchaseParams {
  transactionId: string;
  orderId: string;
  owner: string;
  purchaseType: 'paid' | 'free';
  seatAvailabilityData?: {
    responseId: string;
    offerId: string;
    owner: string;
  };
  selectedSeats: SeatSelection[];
  payment?: {
    method: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
    card?: {
      cardCode: string;
      cardNumber: string;
      cardHolderName: string;
      expiration: string;
      seriesCode?: string;
    };
    agentDeposit?: { agentDepositId?: string };
    voucher?: { voucherId: string; voucherAmount: number };
  };
}

export async function processSeatPurchase(
  orderId: string,
  params: ProcessSeatPurchaseParams
): Promise<SeatPurchaseResponse> {
  const { transactionId, owner, selectedSeats, purchaseType } = params;
  const isPaid = purchaseType === 'paid';
  const group = getSeatPurchaseGroup(owner);

  if (import.meta.env.DEV) {
    console.log('[SeatPurchase] Request:', {
      orderId, owner, group, purchaseType, seatCount: selectedSeats.length,
    });
  }

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.SEAT_REQUIRED_TXN, 400);
  }

  if (!selectedSeats || selectedSeats.length === 0) {
    throw new ApiError(ERROR_MESSAGES.SEAT_REQUIRED_SELECTION, 400);
  }

  if (group === 'UNSUPPORTED') {
    throw new ApiError(ERROR_MESSAGES.SEAT_NOT_SUPPORTED(owner), 400);
  }

  if (group === 'FREE_ONLY' && isPaid) {
    throw new ApiError(ERROR_MESSAGES.SEAT_FREE_ONLY(owner), 400);
  }

  // Step 1: Quote Retrieval
  let quoteData: SeatPurchaseQuoteResult['quoteData'];

  if (requiresSeatQuote(owner) || requiresSeatOfferPrice(owner)) {
    if (import.meta.env.DEV) {
      console.log('[SeatPurchase] Calling quote for Group', group);
    }

    const quoteResponse = await getSeatPurchaseQuote(orderId, {
      transactionId,
      orderId,
      owner,
      seatAvailabilityData: params.seatAvailabilityData,
      selectedSeats,
    });

    if (!quoteResponse.success) {
      throw new ApiError(quoteResponse.error || ERROR_MESSAGES.SEAT_QUOTE_FAILED, 400);
    }

    quoteData = quoteResponse.quoteData;
    if (import.meta.env.DEV) {
      console.log('[SeatPurchase] Quote data received:', quoteData);
    }
  }

  // Step 2: Free seat processing
  if (!isPaid) {
    if (import.meta.env.DEV) {
      console.log('[SeatPurchase] Processing free seat');
    }

    const confirmResult = await confirmSeatPurchase(orderId, {
      transactionId,
      orderId,
      owner,
      purchaseType: 'free',
      quoteData: quoteData ? {
        responseId: quoteData.responseId || '',
        offerId: quoteData.offerId || '',
        offerItems: quoteData.offerItems,
      } : undefined,
      selectedSeats,
    });

    return {
      success: confirmResult.success,
      orderId: confirmResult.orderId,
      requiresPayment: false,
      seatStatus: confirmResult.seatStatus,
    };
  }

  // Step 3: Paid seat - return PaymentPopup data if no payment info
  if (!params.payment) {
    const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const currency = selectedSeats[0]?.currency || 'KRW';

    if (import.meta.env.DEV) {
      console.log('[SeatPurchase] Returning PaymentPopup data:', { totalPrice, currency });
    }

    return {
      success: true,
      orderId,
      requiresPayment: true,
      paymentAmount: quoteData ? undefined : totalPrice,
      currency,
      orderChangeData: { transactionId, orderId },
      quoteData: quoteData || {
        responseId: params.seatAvailabilityData?.responseId,
        offerId: params.seatAvailabilityData?.offerId,
      },
    };
  }

  // Step 4: Payment exists - call confirm
  if (import.meta.env.DEV) {
    console.log('[SeatPurchase] Processing paid seat with payment');
  }

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const confirmResult = await confirmSeatPurchase(orderId, {
    transactionId,
    orderId,
    owner,
    purchaseType: 'paid',
    quoteData: quoteData ? {
      responseId: quoteData.responseId || '',
      offerId: quoteData.offerId || '',
      offerItems: quoteData.offerItems,
    } : undefined,
    selectedSeats,
    paymentMethod: params.payment.method,
    card: params.payment.card,
    agentDeposit: params.payment.agentDeposit,
    voucher: params.payment.voucher,
    amount: {
      currencyCode: selectedSeats[0]?.currency || 'KRW',
      amount: totalPrice,
    },
  });

  return {
    success: confirmResult.success,
    orderId: confirmResult.orderId,
    requiresPayment: confirmResult.requiresPayment || false,
    seatStatus: confirmResult.seatStatus,
    paymentAmount: confirmResult.paymentAmount,
    currency: confirmResult.currency,
  };
}

// ============================================================
// 16. getServicePurchaseQuote (from api/booking/[id]/service-purchase/quote/route.ts)
// ============================================================

export interface ServicePurchaseQuoteResult extends ServiceQuoteResponse {}

export async function getServicePurchaseQuote(
  orderId: string,
  params: ServiceQuoteRequest
): Promise<ServicePurchaseQuoteResult> {
  // Validation
  if (!params.transactionId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_TXN, 400);
  }
  if (!params.selectedServices || params.selectedServices.length === 0) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_SELECTION, 400);
  }

  const owner = params.owner;
  const group = getServicePurchaseGroup(owner);

  if (import.meta.env.DEV) {
    console.log('[ServiceQuote] Request:', {
      orderId, owner, group, serviceCount: params.selectedServices.length,
    });
  }

  // ============================================================
  // Group B/D: OrderQuote
  // ============================================================
  if (group === 'B' || group === 'D') {
    const serviceListData = params.serviceListData;
    if (!serviceListData?.responseId) {
      throw new ApiError(ERROR_MESSAGES.SERVICE_QUOTE_REQUIRED, 400);
    }

    const quoteRequest: OrderQuoteRequest = {
      transactionId: params.transactionId,
      orderId,
      selectedOffer: [{
        responseId: serviceListData.responseId,
        offerId: serviceListData.offerId || orderId,
        owner: serviceListData.owner || owner,
        offerItems: params.selectedServices.map(svc => ({
          offerItemId: svc.offerItemId,
          paxRefId: [svc.paxId],
          ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
        })),
      }],
    };

    interface ServiceMWOrderQuoteResponse {
      transactionId: string;
      response: {
        ResultMessage: { Code: string; Message?: string };
        ReshopOffers?: Array<{
          ResponseID: string;
          OfferID: string;
          Owner: string;
          TotalPrice?: { TotalAmount?: { Amount: number; CurCode: string } };
          AddOfferItem?: Array<{ OfferItemID: string; PaxRefID?: string[] }>;
        }>;
      };
    }

    const quoteResponse = await orderQuote<ServiceMWOrderQuoteResponse>(quoteRequest);

    if (import.meta.env.DEV) {
      console.log('[ServiceQuote] Raw Response:', JSON.stringify(quoteResponse, null, 2).slice(0, 1000));
    }

    const resultCode = quoteResponse.response?.ResultMessage?.Code;
    if (!isSuccessCode(resultCode)) {
      throw new ApiError(
        quoteResponse.response?.ResultMessage?.Message || ERROR_MESSAGES.SERVICE_QUOTE_FAILED,
        400
      );
    }

    const reshopOffer = quoteResponse.response?.ReshopOffers?.[0];
    if (!reshopOffer) {
      throw new ApiError(ERROR_MESSAGES.SERVICE_QUOTE_FAILED, 400);
    }

    return {
      success: true,
      responseId: reshopOffer.ResponseID,
      offerId: reshopOffer.OfferID,
      totalPrice: reshopOffer.TotalPrice?.TotalAmount?.Amount,
      currency: reshopOffer.TotalPrice?.TotalAmount?.CurCode || 'KRW',
      offerItems: reshopOffer.AddOfferItem?.map(item => ({
        offerItemId: item.OfferItemID,
        paxRefId: item.PaxRefID || [],
      })),
    };
  }

  // ============================================================
  // Group A/C: OfferPrice
  // ============================================================
  const serviceListData = params.serviceListData;
  if (!serviceListData?.responseId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_QUOTE_REQUIRED, 400);
  }

  const uniqueServicePaxIds = Array.from(new Set(params.selectedServices.map(s => s.paxId)));
  const paxListForRequest = params.bookingPaxList && params.bookingPaxList.length > 0
    ? params.bookingPaxList.map(p => ({ paxId: p.paxId, ptc: p.ptc as 'ADT' | 'CHD' | 'INF' }))
    : uniqueServicePaxIds.map(paxId => ({ paxId, ptc: 'ADT' as const }));

  const priceRequest: OfferPriceRequest = {
    transactionId: params.transactionId,
    offers: [{
      responseId: serviceListData.responseId,
      offerId: serviceListData.offerId || orderId,
      owner: serviceListData.owner || owner,
      offerItems: params.selectedServices.map(svc => ({
        offerItemId: svc.offerItemId,
        paxRefId: [svc.paxId],
        bookingInstructions: svc.bookingInstructions,
      })),
    }],
    paxList: paxListForRequest,
    criteria: {
      existingOrderCriteria: {
        orderId,
        paxRefId: paxListForRequest.map(p => p.paxId),
      },
    },
  };

  interface ServiceMWOfferPriceResponse {
    ResultMessage: { Code: string; Message?: string };
    TransactionID: string;
    PricedOffer?: {
      ResponseID: string;
      OfferID: string;
      Owner: string;
      TotalPrice?: {
        TotalAmount?: { Amount: number; CurCode: string };
        SimpleCurrencyPrice?: { Code: string; value: number };
      };
      OfferItem?: Array<{
        OfferItemID: string;
        PaxRefID?: string[];
        FareDetail?: Array<{ PaxRefID?: string[] }>;
      }>;
      PricedOfferItem?: Array<{
        OfferItemID: string;
        PaxRefID?: string[];
      }>;
    };
  }

  const priceResponse = await offerPrice<ServiceMWOfferPriceResponse>(priceRequest);

  const resultCode = priceResponse.ResultMessage?.Code;
  if (!isSuccessCode(resultCode)) {
    throw new ApiError(
      priceResponse.ResultMessage?.Message || ERROR_MESSAGES.SERVICE_QUOTE_FAILED,
      400
    );
  }

  const pricedOffer = priceResponse.PricedOffer;
  const offerItemSource = pricedOffer?.OfferItem || pricedOffer?.PricedOfferItem || [];
  const offerItems = offerItemSource.length > 0
    ? offerItemSource.map((item, idx) => {
        const paxRefId = (item.PaxRefID?.length ? item.PaxRefID : null)
          ?? ((item as { FareDetail?: Array<{ PaxRefID?: string[] }> }).FareDetail?.[0]?.PaxRefID?.length
            ? (item as { FareDetail?: Array<{ PaxRefID?: string[] }> }).FareDetail![0].PaxRefID!
            : null)
          ?? [params.selectedServices[idx]?.paxId].filter(Boolean);
        return { offerItemId: item.OfferItemID, paxRefId };
      })
    : undefined;

  const totalAmount = pricedOffer?.TotalPrice?.TotalAmount;
  const simpleCurrency = pricedOffer?.TotalPrice?.SimpleCurrencyPrice;

  return {
    success: true,
    responseId: pricedOffer?.ResponseID,
    offerId: pricedOffer?.OfferID,
    totalPrice: totalAmount?.Amount ?? simpleCurrency?.value,
    currency: totalAmount?.CurCode || simpleCurrency?.Code || 'KRW',
    offerItems,
  };
}

// ============================================================
// 17. addServicePurchase (from api/booking/[id]/service-purchase/add/route.ts)
// ============================================================

export async function addServicePurchase(
  orderId: string,
  params: ServiceAddRequest
): Promise<ServiceAddResponse> {
  // Validation
  if (!params.transactionId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_TXN, 400);
  }
  if (!params.selectedServices || params.selectedServices.length === 0) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_SELECTION, 400);
  }

  const owner = params.owner;
  const group = getServicePurchaseGroup(owner);

  if (import.meta.env.DEV) {
    console.log('[ServiceAdd] Request:', {
      orderId, owner, group,
      hasQuoteData: !!params.quoteData,
      serviceCount: params.selectedServices.length,
    });
  }

  // Build OrderChange Request
  const changeRequest: OrderChangeRequest = {
    transactionId: params.transactionId,
    orderId,
    changeOrderChoice: {},
  };

  // Quote Data exists (Group B/D)
  if (params.quoteData?.responseId) {
    changeRequest.changeOrderChoice.acceptSelectedQuotedOfferList = {
      selectedPricedOffer: [{
        offerId: params.quoteData.offerId || orderId,
        owner,
        responseId: params.quoteData.responseId,
        offerItems: params.quoteData.offerItems || params.selectedServices.map(svc => ({
          offerItemId: svc.offerItemId,
          paxRefId: [svc.paxId],
          ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
        })),
      }],
    };
  } else {
    // Direct add (Group A/C)
    changeRequest.changeOrderChoice.acceptSelectedQuotedOfferList = {
      selectedPricedOffer: [{
        offerId: orderId,
        owner,
        offerItems: params.selectedServices.map(svc => ({
          offerItemId: svc.offerItemId,
          paxRefId: [svc.paxId],
          ...(svc.bookingInstructions && { bookingInstructions: svc.bookingInstructions }),
        })),
      }],
    };
  }

  if (import.meta.env.DEV) {
    console.log('[ServiceAdd] OrderChange Request:', JSON.stringify(changeRequest, null, 2));
  }

  // Call OrderChange API
  interface ServiceAddMWResponse {
    transactionId: string;
    response: {
      ResultMessage: { Code: string; Message?: string };
      Order?: {
        OrderID: string;
        OwnerCode?: string;
        StatusCode?: string;
        TotalPrice?: { TotalAmount?: { Amount: number; CurCode: string } };
        OrderItem?: Array<{
          OrderItemID: string;
          StatusCode?: string;
          Service?: Array<{ ServiceID?: string; StatusCode?: string }>;
          PriceDetail?: {
            TotalAmount?: { SimpleCurrencyPrice?: { Code: string; value: number } };
          };
        }>;
      };
    };
  }

  const changeResponse = await orderChange<ServiceAddMWResponse>(changeRequest);

  const resultCode = changeResponse.response?.ResultMessage?.Code;
  if (!isSuccessCode(resultCode)) {
    throw new ApiError(
      changeResponse.response?.ResultMessage?.Message || ERROR_MESSAGES.SERVICE_ADD_FAILED,
      400
    );
  }

  // Extract service status and payment info
  const order = changeResponse.response?.Order;
  const orderItems = order?.OrderItem || [];
  const totalPrice = order?.TotalPrice?.TotalAmount;
  const paymentAmount = totalPrice?.Amount || 0;
  const currency = totalPrice?.CurCode || 'KRW';

  let serviceStatus: ServicePurchaseStatus | undefined;
  const orderItemRefIds: string[] = [];

  for (const item of orderItems) {
    orderItemRefIds.push(item.OrderItemID);
    const services = item.Service || [];
    for (const service of services) {
      if (service.StatusCode) {
        serviceStatus = service.StatusCode as ServicePurchaseStatus;
      }
    }
  }

  const requiresPayment = requiresSecondOrderChange(owner, serviceStatus);

  const response: ServiceAddResponse = {
    success: true,
    orderId: order?.OrderID || orderId,
    serviceStatus,
    requiresPayment,
    paymentAmount,
    currency,
    orderChangeData: requiresPayment ? {
      transactionId: changeResponse.transactionId || params.transactionId,
      orderId: order?.OrderID || orderId,
      orderItemRefIds,
    } : undefined,
  };

  if (import.meta.env.DEV) {
    console.log('[ServiceAdd] Success:', response);
  }

  return response;
}

// ============================================================
// 18. confirmServicePurchase (from api/booking/[id]/service-purchase/confirm/route.ts)
// ============================================================

export async function confirmServicePurchase(
  orderId: string,
  params: ServiceConfirmRequest & { step?: number }
): Promise<ServiceConfirmResponse> {
  // Validation
  if (!params.transactionId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_TXN, 400);
  }
  if (!params.paymentMethod) {
    throw new ApiError(ERROR_MESSAGES.PAYMENT_REQUIRED_METHOD, 400);
  }

  const owner = params.owner;
  const step = params.step || 1;
  const needsAddStep = requiresAddStep(owner);
  const isStep1SkipPayment = requiresTwoStepPayment(owner) && !needsAddStep && step === 1;

  if (!isStep1SkipPayment && (!params.amount?.amount || params.amount.amount <= 0)) {
    throw new ApiError(ERROR_MESSAGES.PAYMENT_REQUIRED_AMOUNT, 400);
  }

  if (import.meta.env.DEV) {
    console.log('[ServiceConfirm] Request:', {
      orderId, owner, paymentMethod: params.paymentMethod,
      amount: params.amount,
      mode: needsAddStep ? 'Group C (after Add)' : 'Group A/B/D (direct from Quote)',
      hasOrderItemRefIds: !!(params.orderItemRefIds?.length),
      hasQuoteData: !!(params.quoteData?.responseId),
    });
  }

  // Build OrderChange Request with Payment
  const changeRequest: OrderChangeRequest = {
    transactionId: params.transactionId,
    orderId,
    changeOrderChoice: {},
    paymentList: [],
  };

  const isStep2PaymentOnly = requiresTwoStepPayment(owner) && step === 2;

  if (isStep2PaymentOnly) {
    if (import.meta.env.DEV) {
      console.log('[ServiceConfirm] Step 2: Payment only request (AY/SQ)');
    }
  } else if (needsAddStep) {
    if (import.meta.env.DEV) {
      console.log('[ServiceConfirm] Using acceptRepricedOrder (Group C)');
    }
    changeRequest.changeOrderChoice.acceptRepricedOrder = {
      offerRefId: params.orderItemRefIds || [orderId],
    };
  } else {
    if (import.meta.env.DEV) {
      console.log('[ServiceConfirm] Using acceptSelectedQuotedOfferList (Group A/B/D)');
    }
    if (!params.quoteData?.responseId) {
      throw new ApiError(ERROR_MESSAGES.SERVICE_QUOTE_REQUIRED, 400);
    }
    changeRequest.changeOrderChoice.acceptSelectedQuotedOfferList = {
      selectedPricedOffer: [{
        offerId: params.quoteData.offerId,
        owner,
        responseId: params.quoteData.responseId,
        offerItems: params.quoteData.offerItems,
      }],
    };
  }

  // Build payment item
  const paymentTypeMap: Record<string, 'Card' | 'Cash' | 'AGT' | 'Voucher' | 'Ag'> = {
    card: 'Card',
    cash: owner === 'TR' ? 'Ag' : 'Cash',
    agt: owner === 'TR' ? 'Ag' : 'AGT',
    voucher: 'Voucher',
    voucher_cash: 'Voucher',
  };

  const shouldSkipPayment = requiresTwoStepPayment(owner) && !needsAddStep && step === 1;

  if (!shouldSkipPayment) {
    const paymentItem: NonNullable<OrderChangeRequest['paymentList']>[0] = {
      type: paymentTypeMap[params.paymentMethod] || 'Cash',
      amount: params.amount.amount,
      curCode: params.amount.currencyCode,
      orderItemId: [],
      offerItemId: [],
      paxRefId: [],
    };

    if (params.paymentMethod === 'card' && params.card) {
      paymentItem.cardCode = params.card.cardCode;
      paymentItem.cardNumber = params.card.cardNumber;
      paymentItem.cardHolderName = params.card.cardHolderName;
      paymentItem.expiration = params.card.expiration;
      if (params.card.seriesCode) {
        paymentItem.seriesCode = params.card.seriesCode;
      }
    }

    if (params.paymentMethod === 'agt' && params.agentDeposit?.agentDepositId) {
      paymentItem.agentDepositId = params.agentDeposit.agentDepositId;
    }

    if (params.paymentMethod === 'voucher' && params.voucher) {
      paymentItem.voucherId = params.voucher.voucherId;
    }

    changeRequest.paymentList!.push(paymentItem);
  }

  if (import.meta.env.DEV) {
    console.log('[ServiceConfirm] OrderChange Request:', JSON.stringify({
      ...changeRequest,
      paymentList: changeRequest.paymentList?.map(p => ({
        ...p,
        cardNumber: p.cardNumber ? '****' + p.cardNumber.slice(-4) : undefined,
      })),
    }, null, 2));
  }

  // Call OrderChange API
  interface ServiceConfirmMWResponse {
    transactionId: string;
    response: {
      ResultMessage: { Code: string; Message?: string };
      Order?: {
        OrderID: string;
        OwnerCode?: string;
        StatusCode?: string;
        TotalPrice?: { TotalAmount?: { Amount: number; CurCode: string } };
      };
      TicketDocInfo?: Array<{ TicketDocNbr?: string; Type?: string }>;
    };
  }

  const changeResponse = await orderChange<ServiceConfirmMWResponse>(changeRequest);

  if (import.meta.env.DEV) {
    console.log('[ServiceConfirm] Raw Response:', JSON.stringify(changeResponse, null, 2).slice(0, 1000));
  }

  const resultCode = changeResponse.response?.ResultMessage?.Code;
  if (!isSuccessCode(resultCode)) {
    throw new ApiError(
      changeResponse.response?.ResultMessage?.Message || ERROR_MESSAGES.PAYMENT_FAILED,
      400
    );
  }

  // Extract EMD numbers
  const ticketDocs = changeResponse.response?.TicketDocInfo || [];
  const emdNumbers = ticketDocs
    .filter(doc => doc.Type === 'EMD-A' || doc.Type === 'EMD-S')
    .map(doc => doc.TicketDocNbr)
    .filter((num): num is string => !!num);

  // 2Step Flow: Step 1 complete, return Step 2 info
  if (shouldSkipPayment) {
    const mwTotal = changeResponse.response?.Order?.TotalPrice?.TotalAmount;
    if (import.meta.env.DEV) {
      console.log('[ServiceConfirm] Step 1 complete. Requesting Step 2 (Payment).', {
        mwTotalAmount: mwTotal?.Amount, mwTotalCurrency: mwTotal?.CurCode,
      });
    }
    return {
      success: true,
      orderId: changeResponse.response?.Order?.OrderID || orderId,
      message: 'Service change complete. Payment in progress.',
      nextStep: 2,
      requiresPayment: true,
      paymentAmount: mwTotal?.Amount || params.amount?.amount || 0,
      currency: mwTotal?.CurCode || params.amount?.currencyCode || 'KRW',
      quoteData: params.quoteData,
    };
  }

  const response: ServiceConfirmResponse = {
    success: true,
    orderId: changeResponse.response?.Order?.OrderID || orderId,
    message: 'Service purchase complete.',
    emdNumbers: emdNumbers.length > 0 ? emdNumbers : undefined,
  };

  if (import.meta.env.DEV) {
    console.log('[ServiceConfirm] Success:', response);
  }

  return response;
}

// ============================================================
// 19. processServicePurchase (from api/booking/[id]/service-purchase/route.ts)
// Orchestrator: calls sub-functions DIRECTLY (not via HTTP)
// ============================================================

export interface ProcessServicePurchaseParams {
  transactionId: string;
  orderId: string;
  owner: string;
  isTicketed: boolean;
  selectedServices: SelectedService[];
  serviceListData?: {
    responseId: string;
    offerId: string;
    owner: string;
  };
  skipPayment?: boolean;
  payment?: {
    method: 'card' | 'cash' | 'agt' | 'voucher' | 'voucher_cash';
    card?: {
      cardCode: string;
      cardNumber: string;
      cardHolderName: string;
      expiration: string;
      seriesCode?: string;
    };
    agentDeposit?: { agentDepositId?: string };
    voucher?: { voucherId: string; voucherAmount: number };
  };
}

export interface ProcessServicePurchaseResult extends ServiceAddResponse {
  quoteData?: {
    responseId?: string;
    offerId?: string;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
  message?: string;
}

export async function processServicePurchase(
  orderId: string,
  params: ProcessServicePurchaseParams
): Promise<ProcessServicePurchaseResult> {
  const { transactionId, owner, selectedServices, isTicketed } = params;
  const group = getServicePurchaseGroup(owner);

  if (import.meta.env.DEV) {
    console.log('[ServicePurchase] Request:', {
      orderId, owner, group, isTicketed,
      serviceCount: selectedServices.length,
      skipPayment: params.skipPayment,
    });
  }

  // Validation
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_TXN, 400);
  }
  if (!selectedServices || selectedServices.length === 0) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_REQUIRED_SELECTION, 400);
  }

  // Group A/D: After ticketing only
  if ((group === 'A' || group === 'D') && !isTicketed) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_TICKETING_ONLY, 400);
  }

  // Step 1: Quote Retrieval (All carriers required)
  const quoteResponse = await getServicePurchaseQuote(orderId, {
    transactionId,
    orderId,
    owner,
    serviceListData: params.serviceListData,
    selectedServices: selectedServices.map(svc => ({
      serviceId: svc.serviceId,
      offerItemId: svc.offerItemId,
      paxId: svc.paxId,
      segmentId: svc.segmentId,
      quantity: svc.quantity,
      weightValue: svc.weightValue,
      bookingInstructions: svc.bookingInstructions,
    })),
  });

  if (!quoteResponse.success) {
    throw new ApiError(quoteResponse.error || ERROR_MESSAGES.SERVICE_QUOTE_FAILED, 400);
  }

  const quoteData = quoteResponse as {
    responseId?: string;
    offerId?: string;
    totalPrice?: number;
    currency?: string;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };

  // Validate quote response
  if (!quoteData?.responseId || !quoteData?.offerId) {
    throw new ApiError(ERROR_MESSAGES.SERVICE_QUOTE_REQUIRED, 400);
  }

  if (import.meta.env.DEV) {
    console.log('[ServicePurchase] Quote data received:', {
      responseId: quoteData.responseId, offerId: quoteData.offerId,
      totalPrice: quoteData.totalPrice, offerItemsCount: quoteData.offerItems?.length,
    });
  }

  // ============================================================
  // Group C (AF, KL): Add Step required
  // ============================================================
  if (requiresAddStep(owner)) {
    if (import.meta.env.DEV) {
      console.log('[ServicePurchase] Group C Flow: Quote -> Add -> Confirm');
    }

    // Step 2a: Add service (no payment)
    const addResponse = await addServicePurchase(orderId, {
      transactionId,
      orderId,
      owner,
      quoteData: {
        responseId: quoteData.responseId!,
        offerId: quoteData.offerId!,
        offerItems: quoteData.offerItems,
      },
      selectedServices: selectedServices.map(svc => ({
        serviceId: svc.serviceId,
        offerItemId: svc.offerItemId,
        paxId: svc.paxId,
        segmentId: svc.segmentId,
        quantity: svc.quantity,
        weightValue: svc.weightValue,
        bookingInstructions: svc.bookingInstructions,
      })),
    });

    if (!addResponse.success) {
      throw new ApiError(addResponse.error || ERROR_MESSAGES.SERVICE_ADD_FAILED, 400);
    }

    // Step 2b: Confirm with payment
    if (addResponse.requiresPayment && params.payment) {
      const confirmResponse = await confirmServicePurchase(orderId, {
        transactionId,
        orderId,
        owner,
        paymentMethod: params.payment.method,
        card: params.payment.card,
        agentDeposit: params.payment.agentDeposit,
        voucher: params.payment.voucher,
        amount: {
          currencyCode: quoteData?.currency || addResponse.currency || 'KRW',
          amount: quoteData?.totalPrice || addResponse.paymentAmount || 0,
        },
        orderItemRefIds: addResponse.orderChangeData?.orderItemRefIds,
      });

      return {
        ...confirmResponse,
        requiresPayment: false,
      };
    }

    // Add succeeded but payment required - return data for FE PaymentPopup
    if (addResponse.requiresPayment) {
      if (import.meta.env.DEV) {
        console.log('[ServicePurchase] Group C: Add complete, returning payment data for FE PaymentPopup');
      }
      return {
        success: true,
        orderId: addResponse.orderId || orderId,
        requiresPayment: true,
        paymentAmount: quoteData?.totalPrice || addResponse.paymentAmount,
        currency: quoteData?.currency || addResponse.currency || 'KRW',
        orderChangeData: addResponse.orderChangeData,
        quoteData: {
          responseId: quoteData.responseId,
          offerId: quoteData.offerId,
          offerItems: quoteData.offerItems,
        },
      };
    }

    // Free service
    return {
      success: true,
      orderId: addResponse.orderId || orderId,
      requiresPayment: false,
      message: 'Service added.',
    };
  }

  // ============================================================
  // Group A/B/D: Quote -> (Add if skipPayment) -> Confirm
  // ============================================================
  if (import.meta.env.DEV) {
    console.log('[ServicePurchase] Group A/B/D Flow: Quote -> (Add if skipPayment) -> Confirm');
  }

  // skipPayment mode: Add service without payment
  if (params.skipPayment) {
    if (import.meta.env.DEV) {
      console.log('[ServicePurchase] skipPayment mode: adding service without payment (SQ, AY)');
    }

    const addResponse = await addServicePurchase(orderId, {
      transactionId,
      orderId,
      owner,
      quoteData: {
        responseId: quoteData.responseId!,
        offerId: quoteData.offerId!,
        offerItems: quoteData.offerItems,
      },
      selectedServices: selectedServices.map(svc => ({
        serviceId: svc.serviceId,
        offerItemId: svc.offerItemId,
        paxId: svc.paxId,
        segmentId: svc.segmentId,
        quantity: svc.quantity,
        weightValue: svc.weightValue,
        bookingInstructions: svc.bookingInstructions,
      })),
    });

    if (!addResponse.success) {
      throw new ApiError(addResponse.error || ERROR_MESSAGES.SERVICE_ADD_FAILED, 400);
    }

    if (import.meta.env.DEV) {
      console.log('[ServicePurchase] skipPayment: service added successfully', {
        orderId: addResponse.orderId,
        paymentAmount: addResponse.paymentAmount,
        serviceStatus: addResponse.serviceStatus,
      });
    }

    return {
      success: true,
      orderId: addResponse.orderId || orderId,
      requiresPayment: false,
      paymentAmount: addResponse.paymentAmount,
      currency: addResponse.currency || quoteData?.currency || 'KRW',
      serviceStatus: addResponse.serviceStatus,
      orderChangeData: addResponse.orderChangeData,
      quoteData: {
        responseId: quoteData.responseId,
        offerId: quoteData.offerId,
        offerItems: quoteData.offerItems,
      },
    };
  }

  // No payment info: return quote data for PaymentPopup
  if (!params.payment) {
    if (import.meta.env.DEV) {
      console.log('[ServicePurchase] No payment info, returning quote data for PaymentPopup');
    }
    return {
      success: true,
      orderId,
      requiresPayment: true,
      paymentAmount: quoteData?.totalPrice,
      currency: quoteData?.currency || 'KRW',
      orderChangeData: { transactionId, orderId },
      quoteData: {
        responseId: quoteData.responseId,
        offerId: quoteData.offerId,
        offerItems: quoteData.offerItems,
      },
    };
  }

  // Confirm with payment
  const confirmResponse = await confirmServicePurchase(orderId, {
    transactionId,
    orderId,
    owner,
    quoteData: {
      responseId: quoteData.responseId!,
      offerId: quoteData.offerId!,
      offerItems: quoteData.offerItems,
    },
    selectedServices: selectedServices.map(svc => ({
      serviceId: svc.serviceId,
      offerItemId: svc.offerItemId,
      paxId: svc.paxId,
      segmentId: svc.segmentId,
      quantity: svc.quantity,
    })),
    paymentMethod: params.payment.method,
    card: params.payment.card,
    agentDeposit: params.payment.agentDeposit,
    voucher: params.payment.voucher,
    amount: {
      currencyCode: quoteData?.currency || 'KRW',
      amount: quoteData?.totalPrice || 0,
    },
  });

  return {
    ...confirmResponse,
    requiresPayment: false,
  };
}
