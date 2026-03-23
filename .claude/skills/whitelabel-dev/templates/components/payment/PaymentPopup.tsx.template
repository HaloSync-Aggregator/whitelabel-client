// @template PaymentPopup
// @version 4.0.0 (synced from template)
// @description Template for payment/PaymentPopup.tsx

/**
 * @component PaymentPopup
 * @version 1.3.0
 * @description Payment Popup (Main Flow)
 *
 * Flow:
 * 1. (Group A/B) Quote retrieval -> Loading display
 * 2. (Group A/B) FareDifference display -> Confirm
 * 3. PaymentForm display -> Input
 * 4. OrderChange call -> Processing
 * 5. Result display -> Complete
 *
 * v1.3.0: Two-Step Ticketing Branch
 * - AY: Always Two-Step (regardless of service presence)
 * - SQ: Two-Step only when services are included
 * - Step 1: acceptRepricedOrder only (no paymentList)
 * - Step 2: paymentList only (no changeOrderChoice)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FareDifferencePopup } from './FareDifferencePopup';
import { PaymentForm, type PaymentFormData } from './PaymentForm';
import {
  type TicketingQuote,
  type PaymentResult,
  type FareDifference,
  getCarrierGroup,
  requiresFareQuote,
  requiresTwoStepTicketing,
  requiresConditionalTwoStep,
} from '@/types/payment';
import { getOrderQuote, getReshopTicketing, processTicketing } from '@/lib/api/polarhub-service';

type PopupStep = 'quote' | 'fare' | 'form' | 'processing' | 'result';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderInfo: {
    transactionId: string;
    orderId: string;
    pnr: string;
    carrierCode: string;
    originalAmount: number;
    currency: string;
    /** Required for Group B OrderQuote */
    orderItemRefIds?: string[];
    /** v3.26: OrderItemIDs from seat-purchase/confirm Step 1 (AF/KL Pattern A Step 2) */
    seatOrderItemIds?: string[];
  };
  onSuccess: (result: PaymentResult) => void;
  /**
   * Existing Quote Data (pre-retrieved from service purchase flow, etc.)
   * If data exists, skip internal Quote API call
   */
  existingQuote?: TicketingQuote;
  /**
   * Skip Internal Quote API Call (when already quoted externally, e.g., service purchase)
   * When true, navigate directly to Payment Form regardless of existingQuote presence
   */
  skipInternalQuote?: boolean;
  /**
   * SQ post-service ticketing: Exclude changeOrderChoice and send only paymentList
   * Irrelevant for AY - always proceeds with Two-Step
   */
  skipChangeOrderChoice?: boolean;
  /**
   * Custom Payment Handler (for non-default payment API cases like service purchase)
   * When provided, calls this handler instead of default order-change-ticketing
   */
  onPaymentSubmit?: (formData: PaymentFormData) => Promise<PaymentResult>;
}

export function PaymentPopup({
  isOpen,
  onClose,
  orderInfo,
  onSuccess,
  existingQuote,
  skipInternalQuote = false,
  skipChangeOrderChoice = false,
  onPaymentSubmit,
}: PaymentPopupProps) {
  const [step, setStep] = useState<PopupStep>('quote');
  const [quote, setQuote] = useState<TicketingQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const carrierGroup = getCarrierGroup(orderInfo.carrierCode);
  const needsQuote = requiresFareQuote(orderInfo.carrierCode);

  // v1.3.0: Two-Step Branch
  // - AY: Always Two-Step (regardless of service presence)
  // - SQ: Two-Step only when services included (!skipChangeOrderChoice)
  const alwaysTwoStep = requiresTwoStepTicketing(orderInfo.carrierCode);
  const conditionalTwoStep = requiresConditionalTwoStep(orderInfo.carrierCode) && !skipChangeOrderChoice;
  const needsTwoStepTicketing = alwaysTwoStep || conditionalTwoStep;

  // AbortController for duplicate call prevention (React Strict Mode handling)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch quote on mount for Group A/B
  // Skip Quote API call if skipInternalQuote or existingQuote exists
  useEffect(() => {
    if (!isOpen || step !== 'quote') {
      return;
    }

    // skipInternalQuote: Already quoted externally (service purchase, etc.)
    if (skipInternalQuote) {
      console.log('[PaymentPopup] skipInternalQuote=true, going directly to form');
      if (existingQuote) {
        setQuote(existingQuote);
        setStep('fare');
      } else {
        setStep('form');
      }
      return;
    }

    // If existingQuote exists, navigate directly to fare confirmation
    if (existingQuote) {
      console.log('[PaymentPopup] Using existing quote, skipping API call');
      setQuote(existingQuote);
      setStep('fare');
      return;
    }

    // Quote not required (Group C)
    if (!needsQuote) {
      setStep('form');
      return;
    }

    // Cancel previous request before new request (React Strict Mode handling)
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const doFetchQuote = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[PaymentPopup] Fetching quote, carrierGroup:', carrierGroup);

        const data = carrierGroup === 'A'
          ? await getReshopTicketing({
              transactionId: orderInfo.transactionId,
              orderId: orderInfo.orderId,
              originalAmount: orderInfo.originalAmount,
              currency: orderInfo.currency,
            })
          : await getOrderQuote({
              transactionId: orderInfo.transactionId,
              orderId: orderInfo.orderId,
              orderItemRefIds: orderInfo.orderItemRefIds,
              originalAmount: orderInfo.originalAmount,
              currency: orderInfo.currency,
            });

        // Prevent state change if aborted
        if (abortController.signal.aborted) return;

        setQuote(data.quote);
        setStep('fare');
      } catch (err) {
        if (abortController.signal.aborted) return;

        setError(err instanceof Error ? err.message : 'Failed to retrieve fare quote.');
        setStep('form');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    doFetchQuote();

    return () => {
      abortController.abort();
    };
  }, [isOpen, step, skipInternalQuote, existingQuote, needsQuote, carrierGroup, orderInfo]);

  // Reset state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setStep('quote');
      setQuote(null);
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  // Handle fare confirmation
  const handleFareConfirm = () => {
    setStep('form');
  };

  // Handle payment submission
  const handlePaymentSubmit = useCallback(async (formData: PaymentFormData) => {
    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      let data: PaymentResult;

      // Use custom payment handler if exists (service purchase, etc.)
      if (onPaymentSubmit) {
        console.log('[PaymentPopup] Using custom payment handler');
        data = await onPaymentSubmit(formData);
      } else {
        const paymentAmount = quote?.fareDifference.newFare || orderInfo.originalAmount;

        // v1.2.0: AY Always Two-Step Ticketing (regardless of service presence)
        if (needsTwoStepTicketing && quote) {
          if (!skipChangeOrderChoice) {
            console.log('[PaymentPopup] Two-Step Ticketing: Starting Step 1 (acceptRepricedOrder only)');

            // Step 1: Send acceptRepricedOrder only (no paymentList)
            await processTicketing({
              transactionId: orderInfo.transactionId,
              orderId: orderInfo.orderId,
              owner: orderInfo.carrierCode,
              quoteData: {
                responseId: quote.responseId,
                offerId: quote.offerId,
                offerItems: quote.offerItems,
              },
              // acceptOnly: Send acceptRepricedOrder only without paymentList
              acceptOnly: true,
            });

            console.log('[PaymentPopup] Two-Step Ticketing: Step 1 completed, starting Step 2 (paymentList only)');
          } else {
            console.log('[PaymentPopup] Two-Step Ticketing: Skipping Step 1 (changeOrderChoice already applied)');
          }

          // Step 2: Send paymentList only (no changeOrderChoice)
          data = await processTicketing({
            transactionId: orderInfo.transactionId,
            orderId: orderInfo.orderId,
            owner: orderInfo.carrierCode,
            paymentMethod: formData.paymentMethod,
            card: formData.card,
            agentDeposit: formData.agentDeposit,
            voucher: formData.voucher,
            amount: {
              currencyCode: orderInfo.currency,
              amount: paymentAmount,
            },
            // Step 2: Send paymentList only
            skipChangeOrderChoice: true,
            // v3.26: AF/KL Pattern A Step 2 needs OrderItemIDs from seat-purchase/confirm Step 1
            seatOrderItemIds: orderInfo.seatOrderItemIds,
          });

          console.log('[PaymentPopup] Two-Step Ticketing: Both steps completed successfully');

        } else {
          // General Flow (non-AY carriers)
          data = await processTicketing({
            transactionId: orderInfo.transactionId,
            orderId: orderInfo.orderId,
            owner: orderInfo.carrierCode,
            paymentMethod: formData.paymentMethod,
            card: formData.card,
            agentDeposit: formData.agentDeposit,
            voucher: formData.voucher,
            quoteData: quote ? {
              responseId: quote.responseId,
              offerId: quote.offerId,
              offerItems: quote.offerItems,
            } : undefined,
            amount: {
              currencyCode: orderInfo.currency,
              amount: paymentAmount,
            },
            // SQ post-service ticketing: Send paymentList only
            skipChangeOrderChoice,
            // v3.26: AF/KL Pattern A Step 2 needs OrderItemIDs from seat-purchase/confirm Step 1
            seatOrderItemIds: orderInfo.seatOrderItemIds,
          });
        }
      }

      setResult(data);
      setStep('result');
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  }, [quote, orderInfo, needsTwoStepTicketing, skipChangeOrderChoice, onPaymentSubmit, onSuccess]);

  // Handle close with confirmation
  const handleClose = () => {
    if (step === 'processing') {
      return; // Prevent closing during processing
    }
    if (step === 'form' || step === 'fare') {
      const confirmed = window.confirm('Are you sure you want to cancel payment?');
      if (!confirmed) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  // Show FareDifferencePopup for fare confirmation step
  if (step === 'fare' || (step === 'quote' && isLoading)) {
    return (
      <FareDifferencePopup
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleFareConfirm}
        fareDifference={(quote?.fareDifference as FareDifference) || null}
        isLoading={isLoading}
      />
    );
  }

  // Main popup
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={step !== 'processing' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {step === 'result' ? 'Payment Complete' : 'Pay Now'}
            </h2>
            <p className="text-sm text-muted">PNR: {orderInfo.pnr}</p>
          </div>
          {step !== 'processing' && step !== 'result' && (
            <button
              type="button"
              onClick={handleClose}
              className="text-muted hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && step === 'form' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Payment Form */}
          {step === 'form' && (
            <PaymentForm
              carrierCode={orderInfo.carrierCode}
              amount={{
                amount: quote?.fareDifference.newFare || orderInfo.originalAmount,
                currency: orderInfo.currency,
              }}
              onSubmit={handlePaymentSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center">
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
                {needsTwoStepTicketing ? 'Processing payment... (2-Step)' : 'Processing payment...'}
              </p>
              <p className="text-sm text-muted mt-2">Please wait a moment.</p>
            </div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <div className="py-8 text-center">
              {result.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Ticketing Complete</h3>
                  <p className="text-muted mb-4">{result.message}</p>
                  {result.ticketNumbers && result.ticketNumbers.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4 text-left">
                      <p className="text-sm font-medium text-foreground mb-2">Ticket Number</p>
                      {result.ticketNumbers.map((ticket, index) => (
                        <p key={index} className="text-sm text-muted font-mono">{ticket}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Payment Failed</h3>
                  <p className="text-muted">{result.message}</p>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentPopup;
