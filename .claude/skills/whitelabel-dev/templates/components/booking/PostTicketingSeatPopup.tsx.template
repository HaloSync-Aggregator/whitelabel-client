// @template PostTicketingSeatPopup
// @version 4.0.0 (synced from template)
// @description Template for booking/PostTicketingSeatPopup.tsx

/**
 * PostTicketingSeatPopup Component (Held Booking)
 *
 * @pattern ServicePurchaseModal.tsx
 * @version 2.0.0
 *
 * ============================================================
 * Held Booking Seat purchase Popup
 * ============================================================
 *
 * | Pattern | Carrier | Flow |
 * |---------|---------|------|
 * | A | AF, KL | SeatAvail -> OfferPrice -> OC(w/o FOP) -> Payment -> OC(w/ FOP) |
 * | B | AY, SQ | SeatAvail -> OrderQuote -> OC(w/o FOP) -> Payment -> OC(w/ FOP) |
 * | C | TR, TK(Paid) | SeatAvail -> OrderQuote -> Payment -> OC(w/ FOP) |
 * | D | HA | SeatAvail -> OC(w/o FOP) -> Polling -> Payment -> OC(w/ FOP) |
 * | E | TK(Free) | SeatAvail -> OC |
 *
 * CRITICAL: API duplicate call prevention (React Strict Mode handling)
 * - Use AbortController to cancel previous requests
 * - Use purchasingRef to prevent double-clicks
 *
 * 2-Step pattern (A, B, D): Distinguish step 1/2 via parameter
 * - step 1: OC(w/o FOP) - Seat hold
 * - step 2: OC(w/ FOP) - Payment Confirmed
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import SeatSelector, { type Passenger } from '@/components/seat/SeatSelector';
import { PaymentPopup, type PaymentFormData } from '@/components/payment';
import { type SeatAvailabilityData, type SelectedSeat } from '@/types/seat';
import {
  type SeatPurchaseStep,
  type SeatPurchaseResponse,
  type SeatPurchaseResult,
  type SeatSelection,
  getAirlineConfig,
  getQuoteApiType,
  requiresTwoStepOrderChange,
  supportsHeldBookingSeat,
} from '@/types/seat-purchase';
import { type PaymentResult } from '@/types/payment';
import {
  getSeatAvailability,
  getSeatPurchaseQuote,
  confirmSeatPurchase,
  type SeatConfirmParams,
} from '@/lib/api/polarhub-service';

// ============================================================
// Props
// ============================================================

interface PostTicketingSeatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  owner: string;
  transactionId: string;
  passengers: Passenger[];
  onSuccess: () => void;
}

// ============================================================
// Component
// ============================================================

export default function PostTicketingSeatPopup({
  isOpen,
  onClose,
  orderId,
  owner,
  transactionId,
  passengers,
  onSuccess,
}: PostTicketingSeatPopupProps) {
  // State
  const [step, setStep] = useState<SeatPurchaseStep>('loading');
  const [seatData, setSeatData] = useState<SeatAvailabilityData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [purchaseResponse, setPurchaseResponse] = useState<SeatPurchaseResponse | null>(null);
  const [result, setResult] = useState<SeatPurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  // v3.25.0: Store orderItemIds from 1st OC response for Step 2 PaymentList
  const [orderItemIds, setOrderItemIds] = useState<string[]>([]);

  // Refs - AbortController
  const abortControllerRef = useRef<AbortController | null>(null);
  const purchasingRef = useRef(false);

  // Pattern based Configuration
  const isPaidRef = useRef(true); // Initial value: Paid
  const config = getAirlineConfig(owner, isPaidRef.current);
  const quoteApiType = getQuoteApiType(owner, isPaidRef.current);
  const isSupported = supportsHeldBookingSeat(owner);

  // ============================================================
  // Fetch SeatAvailability on mount
  // ============================================================
  useEffect(() => {
    if (!isOpen || step !== 'loading') return;

    // Check if carrier is not supported
    if (!isSupported) {
      setError('Seat selection is not available for this carrier.');
      setStep('result');
      return;
    }

    // Cancel previous request
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchSeatAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[PostTicketingSeatPopup] Fetching SeatAvailability...', {
          owner,
          pattern: config.pattern,
          quoteApiType,
        });

        const data = await getSeatAvailability({
          transactionId,
          // Post-Booking: Use order field (exclude owner!)
          order: { orderId },
          // Pass owner separately outside of order (PolarHub restriction)
          owner,
          paxList: passengers.map(p => ({ paxId: p.paxId, ptc: p.type })),
        });

        if (abortController.signal.aborted) return;

        setSeatData(data.seatData);
        setStep('select');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (abortController.signal.aborted) return;

        console.error('[PostTicketingSeatPopup] SeatAvailability error:', err);
        setError(err instanceof Error ? err.message : 'Failed to retrieve seat information.');
        setStep('result');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchSeatAvailability();

    return () => { abortController.abort(); };
  }, [isOpen, step, transactionId, orderId, owner, passengers, isSupported, config.pattern, quoteApiType]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      purchasingRef.current = false;
      isPaidRef.current = true;
      setStep('loading');
      setSeatData(null);
      setSelectedSeats([]);
      setPurchaseResponse(null);
      setResult(null);
      setError(null);
      setIsLoading(false);
      setShowPaymentPopup(false);
      setOrderItemIds([]);
    }
  }, [isOpen]);

  // ============================================================
  // Handle seat selection
  // ============================================================
  const handleSeatConfirm = useCallback(async (seats: SelectedSeat[]) => {
    if (purchasingRef.current) {
      console.log('[PostTicketingSeatPopup] Skip duplicate purchase call');
      return;
    }
    purchasingRef.current = true;

    setSelectedSeats(seats);
    setStep('quote');
    setIsLoading(true);
    setError(null);

    try {
      // Paid/Free determination
      const totalPrice = seats.reduce((sum, s) => sum + s.price, 0);
      const isPaid = totalPrice > 0;
      const purchaseType = isPaid ? 'paid' : 'free';
      isPaidRef.current = isPaid;

      // Pattern recalculate (TK Paid/Free branch)
      const actualConfig = getAirlineConfig(owner, isPaid);

      console.log('[PostTicketingSeatPopup] Seat confirm:', {
        seatCount: seats.length,
        totalPrice,
        purchaseType,
        pattern: actualConfig.pattern,
        orderChangeSteps: actualConfig.orderChangeSteps,
      });

      // Convert seat selection information
      const seatSelections: SeatSelection[] = seats.map(seat => ({
        segmentKey: seat.segmentId,
        paxId: seat.paxId,
        column: seat.seatNumber.slice(-1), // "37K" -> "K"
        row: seat.seatNumber.slice(0, -1), // "37K" -> "37"
        seatNumber: seat.seatNumber,
        offerItemId: seat.offerItemId,
        price: seat.price,
        currency: seat.currency,
      }));

      // ============================================================
      // Step 1: Quote API Call (Pattern A, B, C)
      // ============================================================
      let quoteData: SeatPurchaseResponse['quoteData'] | undefined;
      // v3.25.0: Save OfferPrice RS total for payment amount (AF/KL)
      let quoteTotalPrice: number | undefined;
      let quoteCurrency: string | undefined;

      if (actualConfig.quoteApi !== 'NONE') {
        console.log('[PostTicketingSeatPopup] Calling Quote API:', actualConfig.quoteApi);

        const quoteResult = await getSeatPurchaseQuote(orderId, {
          transactionId,
          orderId,
          owner,
          isPaid,
          seatAvailabilityData: seatData?._apiData ? {
            responseId: seatData._apiData.responseId,
            offerId: seatData._apiData.offerId,
            owner: seatData._apiData.owner,
          } : undefined,
          selectedSeats: seatSelections,
        });

        quoteData = quoteResult.quoteData;
        // v3.25.0: OfferPrice RS total = actual payment amount for AF/KL
        quoteTotalPrice = quoteResult.totalPrice;
        quoteCurrency = quoteResult.currency;
        console.log('[PostTicketingSeatPopup] Quote success:', { quoteData, quoteTotalPrice, quoteCurrency });
      }

      // ============================================================
      // Step 2: 1st OrderChange (2-Step pattern) or prepare for payment
      // ============================================================
      if (requiresTwoStepOrderChange(owner, isPaid) && isPaid) {
        // Pattern A, B, D: 1st OrderChange (w/o FOP)
        console.log('[PostTicketingSeatPopup] Calling 1st OrderChange (w/o FOP)');

        const confirmResult = await confirmSeatPurchase(orderId, {
          transactionId,
          orderId,
          owner,
          purchaseType,
          step: 1, // 1st call
          quoteData: quoteData as SeatConfirmParams['quoteData'],
          selectedSeats: seatSelections,
        });

        // Display PaymentPopup when 2nd call required
        if (confirmResult.requiresPayment && confirmResult.nextStep === 2) {
          // v3.25.0: Save orderItemIds from 1st OC response
          if (confirmResult.orderItemIds?.length) {
            setOrderItemIds(confirmResult.orderItemIds);
          }
          setPurchaseResponse({
            success: true,
            requiresPayment: true,
            // v3.25.0: Use OfferPrice RS total for payment (not MW OC order total!)
            // AF/KL seat purchase: OfferPrice RS total = seat price to pay
            paymentAmount: quoteTotalPrice || confirmResult.paymentAmount,
            currency: quoteCurrency || confirmResult.currency,
            quoteData,
          });
          setStep('payment');
          setShowPaymentPopup(true);
        } else {
          // Unexpected case (2-Step but payment not required?)
          setResult({
            success: true,
            orderId: confirmResult.orderId || orderId,
            message: 'Seat has been changed.',
          });
          setStep('result');
        }
      } else if (isPaid) {
        // Pattern C: 1-Step + Payment -> Display PaymentPopup directly
        setPurchaseResponse({
          success: true,
          requiresPayment: true,
          paymentAmount: totalPrice,
          currency: seats[0]?.currency || 'KRW',
          quoteData,
        });
        setStep('payment');
        setShowPaymentPopup(true);
      } else {
        // Pattern E (Free): Call OrderChange directly
        console.log('[PostTicketingSeatPopup] Calling OrderChange (free seat)');

        const confirmResult = await confirmSeatPurchase(orderId, {
          transactionId,
          orderId,
          owner,
          purchaseType: 'free',
          step: 1,
          quoteData: quoteData as SeatConfirmParams['quoteData'],
          selectedSeats: seatSelections,
        });

        setResult({
          success: true,
          orderId: confirmResult.orderId || orderId,
          message: 'Seat has been changed.',
        });
        setStep('result');
      }
    } catch (err) {
      console.error('[PostTicketingSeatPopup] Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Failed to purchase seat. Please try again.');
      setStep('result');
    } finally {
      setIsLoading(false);
      purchasingRef.current = false;
    }
  }, [transactionId, orderId, owner, seatData]);

  // ============================================================
  // Handle payment (2nd OrderChange with FOP)
  // ============================================================
  const handleSeatPayment = useCallback(async (formData: PaymentFormData): Promise<PaymentResult> => {
    const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const currency = purchaseResponse?.currency || selectedSeats[0]?.currency || 'KRW';
    const paymentAmount = purchaseResponse?.paymentAmount || totalPrice;

    console.log('[PostTicketingSeatPopup] Payment (2nd OrderChange w/ FOP):', {
      paymentAmount,
      currency,
      pattern: config.pattern,
    });

    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0.');
    }

    // Convert seat selection information
    const seatSelections: SeatSelection[] = selectedSeats.map(seat => ({
      segmentKey: seat.segmentId,
      paxId: seat.paxId,
      column: seat.seatNumber.slice(-1),
      row: seat.seatNumber.slice(0, -1),
      seatNumber: seat.seatNumber,
      offerItemId: seat.offerItemId,
      price: seat.price,
      currency: seat.currency,
    }));

    // 2-Step pattern: step=2, 1-Step pattern: step=1
    const actualConfig = getAirlineConfig(owner, true);
    const confirmStep = actualConfig.orderChangeSteps === 2 ? 2 : 1;

    const data = await confirmSeatPurchase(orderId, {
      transactionId,
      orderId,
      owner,
      purchaseType: 'paid',
      step: confirmStep, // Step based on pattern
      quoteData: purchaseResponse?.quoteData as SeatConfirmParams['quoteData'],
      selectedSeats: seatSelections,
      // v3.25.0: Pass orderItemIds from 1st OC response for Step 2 PaymentList
      orderItemIds: orderItemIds.length > 0 ? orderItemIds : undefined,
      paymentMethod: formData.paymentMethod,
      card: formData.card,
      agentDeposit: formData.agentDeposit,
      voucher: formData.voucher,
      amount: {
        currencyCode: currency,
        amount: paymentAmount,
      },
    });

    return {
      success: true,
      orderId: data.orderId || orderId,
      status: 'TICKETED',
      message: data.message || 'Seat purchase completed.',
    };
  }, [transactionId, orderId, owner, purchaseResponse, selectedSeats, config.pattern, orderItemIds]);

  // Handle payment success
  const handlePaymentSuccess = useCallback((paymentResult: PaymentResult) => {
    setShowPaymentPopup(false);
    if (paymentResult.success) {
      setResult({
        success: true,
        orderId: paymentResult.orderId,
        message: 'Seat purchase completed.',
      });
      setStep('result');
    } else {
      setError(paymentResult.message || 'Payment failed.');
      setStep('result');
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (isLoading || step === 'quote' || step === 'confirm') return;
    if (step === 'select') {
      if (!window.confirm('Are you sure you want to cancel seat selection?')) return;
    }
    onClose();
  }, [isLoading, step, onClose]);

  const handleResultClose = useCallback(() => {
    if (result?.success) onSuccess();
    onClose();
  }, [result, onSuccess, onClose]);

  // ============================================================
  // Render
  // ============================================================

  if (!isOpen) return null;

  // SeatSelector Display
  if (step === 'select' && seatData) {
    return (
      <SeatSelector
        seatData={seatData}
        passengers={passengers}
        onConfirm={handleSeatConfirm}
        onClose={handleClose}
        isLoading={isLoading}
      />
    );
  }

  // PaymentPopup Display
  if (showPaymentPopup && purchaseResponse?.requiresPayment) {
    const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
    const currency = purchaseResponse.currency || 'KRW';
    const paymentAmount = purchaseResponse.paymentAmount || totalPrice;

    // v3.25.0: Seat purchase skips FareDifferencePopup
    // No existingQuote -> PaymentPopup goes directly to payment form
    // paymentAmount already set to OfferPrice RS total (correct seat price)

    return (
      <PaymentPopup
        isOpen={true}
        onClose={() => {
          setShowPaymentPopup(false);
          setError('Payment was cancelled.');
          setStep('result');
        }}
        orderInfo={{
          transactionId,
          orderId,
          pnr: orderId,
          carrierCode: owner,
          originalAmount: paymentAmount,
          currency,
        }}
        onSuccess={handlePaymentSuccess}
        skipInternalQuote={true}
        onPaymentSubmit={handleSeatPayment}
      />
    );
  }

  // Loading/Result Display
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step === 'result' ? handleResultClose : undefined}
      />

      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {(step === 'loading' || step === 'quote' || step === 'confirm') && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-lg font-medium text-foreground">
              {step === 'loading' && 'Retrieving seat information...'}
              {step === 'quote' && 'Checking seat price...'}
              {step === 'confirm' && 'Processing seat purchase...'}
            </p>
            <p className="text-sm text-muted mt-2">Please wait a moment.</p>
          </div>
        )}

        {step === 'result' && (
          <div className="py-8 text-center">
            {result?.success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Seat Purchase Complete</h3>
                <p className="text-muted mb-4">{result.message}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Seat Purchase Failed</h3>
                <p className="text-muted">{error || 'An error occurred.'}</p>
              </>
            )}

            <button
              type="button"
              onClick={handleResultClose}
              className="mt-6 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
            >
              Confirm
            </button>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <p>Step: {step} | Pattern: {config.pattern} | Owner: {owner}</p>
            <p>QuoteAPI: {quoteApiType} | Steps: {config.orderChangeSteps}</p>
          </div>
        )}
      </div>
    </div>
  );
}
