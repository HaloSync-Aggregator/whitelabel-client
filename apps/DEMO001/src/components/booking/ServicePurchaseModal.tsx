// @template ServicePurchaseModal
// @version 4.0.0 (synced from template)
// @description Template for booking/ServicePurchaseModal.tsx

/**
 * ServicePurchaseModal Component
 *
 * ============================================================
 * Post-Booking Ancillary service Purchase Modal
 * ============================================================
 *
 * Flow:
 * 1. loading: ServiceList API Call
 * 2. select: ServiceSelector to Component Service Select
 * 3. quote: Carrier-specific branching (OrderQuote/OfferPrice)
 * 4. confirm: 1 OrderChange (Add service)
 * 5. payment: Status Confirm → Payment when Required PaymentPopup
 * 6. result: Complete/Failure Display
 *
 * ⚠️ CRITICAL: API duplicate call prevention (React Strict Mode handling)
 * - Use AbortController to cancel previous requests (always start new request)
 * - fetchingRef for actual UI status management (do not use as effect gate!)
 * - Strict Mode cleanup → re-mount synchronous, ref gate not possible due to async finally
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ServiceSelector, { type Passenger } from '@/components/service/ServiceSelector';
import { PaymentPopup, type PaymentFormData } from '@/components/payment';
import {
  type ServiceListData,
  type SelectedService,
} from '@/types/service';
import {
  type ServicePurchaseStep,
  type ServiceAddResponse,
  type ServicePurchaseResult,
  getServicePurchaseGroup,
  canAddServiceInHoldStatus,
} from '@/types/service-purchase';
import { type PaymentResult } from '@/types/payment';
import { getServiceList, processServicePurchase, confirmServicePurchase } from '@/lib/api/polarhub-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';

// ============================================================
// Props
// ============================================================

interface ServicePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  owner: string;
  transactionId: string;
  isTicketed: boolean;
  passengers: Passenger[];
  onSuccess: () => void;
}

// ============================================================
// Component
// ============================================================

export default function ServicePurchaseModal({
  isOpen,
  onClose,
  orderId,
  owner,
  transactionId,
  isTicketed,
  passengers,
  onSuccess,
}: ServicePurchaseModalProps) {
  // State
  const [step, setStep] = useState<ServicePurchaseStep>('loading');
  const [serviceData, setServiceData] = useState<ServiceListData | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [addResponse, setAddResponse] = useState<ServiceAddResponse | null>(null);
  const [result, setResult] = useState<ServicePurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  // ⭐ Refs - AbortController for duplicate call prevention
  // ⚠️ Do not use fetchingRef as effect gate! (Strict Mode timing issue)
  const abortControllerRef = useRef<AbortController | null>(null);
  const purchasingRef = useRef(false);

  const group = getServicePurchaseGroup(owner);

  // ============================================================
  // Fetch ServiceList on mount
  // ⚠️ CRITICAL: Use AbortController for duplicate call prevention (ref gate prohibited!)
  // ============================================================
  useEffect(() => {
    // Execute only when modal is open and in loading state
    if (!isOpen || step !== 'loading') {
      return;
    }

    // Check carriers that don't support service addition before ticketing
    if (!isTicketed && !canAddServiceInHoldStatus(owner)) {
      setError(ERROR_MESSAGES.SERVICE_TICKETING_ONLY);
      setStep('result');
      return;
    }

    // ⭐ Cancel previous request then create new AbortController
    // (abort when Strict Mode cleanup executes)
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchServiceList = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('[ServicePurchaseModal] Fetching ServiceList...');
        const data = await getServiceList({
          transactionId,
          order: {
            orderId,
            owner,
          },
          paxList: passengers.map(p => ({
            paxId: p.paxId,
            ptc: p.type,
          })),
          currencyCode: 'KRW',
        });

        // ⭐ Early return if aborted (prevent state change)
        if (abortController.signal.aborted) {
          console.log('[ServicePurchaseModal] Request was aborted, skipping state update');
          return;
        }

        setServiceData(data.serviceData);
        setStep('select');
      } catch (err) {
        // Prevent state change on abort error
        if (abortController.signal.aborted) {
          return;
        }
        console.error('[ServicePurchaseModal] ServiceList error:', err);
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVICE_RETRIEVE_FAILED);
        setStep('result');
      } finally {
        // Prevent state change if aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchServiceList();

    // Cleanup: Cancel previous request (important for Strict Mode!)
    return () => {
      abortController.abort();
    };
  }, [isOpen, step, isTicketed, owner, transactionId, orderId, passengers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // ⭐ Cancel any in-progress requests
      abortControllerRef.current?.abort();
      purchasingRef.current = false;

      setStep('loading');
      setServiceData(null);
      setSelectedServices([]);
      setAddResponse(null);
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // ============================================================
  // Handle service selection
  // ============================================================
  const handleServiceConfirm = useCallback(async (services: SelectedService[]) => {
    // ⭐ Skip if purchase already in progress (prevent button double-click)
    if (purchasingRef.current) {
      console.log('[ServicePurchaseModal] Skip duplicate purchase call');
      return;
    }
    purchasingRef.current = true;

    setSelectedServices(services);
    setStep('quote');
    setIsLoading(true);
    setError(null);

    try {
      const purchaseRequestBody = {
        transactionId,
        orderId,
        owner,
        isTicketed,
        serviceListData: serviceData?._apiData ? {
          responseId: serviceData._apiData.responseId,
          offerId: serviceData._apiData.offerId,
          owner: serviceData._apiData.owner,
        } : undefined,
        selectedServices: services,
      };

      console.log('[ServicePurchaseModal] Purchase services:', purchaseRequestBody);

      const purchaseData = await processServicePurchase(orderId, purchaseRequestBody);

      setAddResponse(purchaseData as ServiceAddResponse);
      setStep('confirm');

      if (purchaseData.requiresPayment) {
        setStep('payment');
        setShowPaymentPopup(true);
      } else {
        setResult({
          success: true,
          orderId: purchaseData.orderId,
          message: 'Service added successfully.',
        });
        setStep('result');
      }
    } catch (err) {
      console.error('[ServicePurchaseModal] Purchase error:', err);
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.SERVICE_ADD_FAILED);
      setStep('result');
    } finally {
      setIsLoading(false);
      purchasingRef.current = false;
    }
  }, [transactionId, orderId, owner, isTicketed, serviceData]);

  // ============================================================
  // Handle service purchase payment (Custom Payment Handler)
  // ⭐ Call /service-purchase/confirm instead of /demo/order-change-ticketing (Post-ticketing)
  // ============================================================
  const handleServicePayment = useCallback(async (formData: PaymentFormData): Promise<PaymentResult> => {
    // ⭐ Calculate payment amount: addResponse.paymentAmount takes priority, otherwise total from selectedServices
    const totalFromServices = selectedServices.reduce((sum, svc) => sum + (svc.price || 0), 0);
    const paymentAmount = addResponse?.paymentAmount || totalFromServices;
    const currency = addResponse?.currency || selectedServices[0]?.currency || 'KRW';

    console.log('[ServicePurchaseModal] Custom payment handler:', {
      paymentAmount,
      currency,
      fromAddResponse: addResponse?.paymentAmount,
      fromServices: totalFromServices,
    });

    if (paymentAmount <= 0) {
      throw new Error(ERROR_MESSAGES.PAYMENT_REQUIRED_AMOUNT);
    }

    const quoteData = addResponse?.quoteData?.responseId && addResponse?.quoteData?.offerId
      ? {
          responseId: addResponse.quoteData.responseId,
          offerId: addResponse.quoteData.offerId,
          offerItems: addResponse.quoteData.offerItems,
        }
      : undefined;

    const data = await confirmServicePurchase(orderId, {
      transactionId,
      orderId,
      owner,
      // Quote Data (Service purchase)
      quoteData,
      // ⭐ Group C (AF/KL): orderItemRefIds from Add response (used in acceptRepricedOrder)
      orderItemRefIds: addResponse?.orderChangeData?.orderItemRefIds,
      // Payment information
      paymentMethod: formData.paymentMethod,
      card: formData.card,
      agentDeposit: formData.agentDeposit,
      amount: {
        currencyCode: currency,
        amount: paymentAmount,
      },
    });

    return {
      success: true,
      orderId: data.orderId || orderId,
      status: 'TICKETED',
      message: data.message || 'Service purchase completed.',
      ticketNumbers: (data as unknown as { emdNumbers?: string[] }).emdNumbers,
    };
  }, [transactionId, orderId, owner, addResponse, selectedServices]);

  // ============================================================
  // Handle payment success
  // ============================================================
  const handlePaymentSuccess = useCallback((paymentResult: PaymentResult) => {
    setShowPaymentPopup(false);
    if (paymentResult.success) {
      setResult({
        success: true,
        orderId: paymentResult.orderId,
        message: 'Service purchase completed.',
        emdNumbers: paymentResult.ticketNumbers,
      });
      setStep('result');
    } else {
      setError(paymentResult.message || ERROR_MESSAGES.PAYMENT_FAILED);
      setStep('result');
    }
  }, []);

  // ============================================================
  // Handle close
  // ============================================================
  const handleClose = useCallback(() => {
    if (isLoading || step === 'quote' || step === 'confirm') {
      return;
    }
    if (step === 'select') {
      const confirmed = window.confirm('Cancel service selection?');
      if (!confirmed) return;
    }
    onClose();
  }, [isLoading, step, onClose]);

  // ============================================================
  // Handle result close
  // ============================================================
  const handleResultClose = useCallback(() => {
    if (result?.success) {
      onSuccess();
    }
    onClose();
  }, [result, onSuccess, onClose]);

  // ============================================================
  // Render
  // ============================================================

  if (!isOpen) return null;

  if (step === 'select' && serviceData) {
    return (
      <ServiceSelector
        serviceData={serviceData}
        passengers={passengers}
        onConfirm={handleServiceConfirm}
        onClose={handleClose}
        isLoading={isLoading}
      />
    );
  }

  if (showPaymentPopup && addResponse?.requiresPayment) {
    const totalPrice = selectedServices.reduce((sum, svc) => sum + svc.price, 0);
    const currency = addResponse.currency || selectedServices[0]?.currency || 'KRW';

    // ⭐ v3.25.0: Service purchase skips FareDifferencePopup
    // No existingQuote → PaymentPopup goes directly to payment form
    // paymentAmount already set to OfferPrice RS total (correct service price)
    const paymentAmount = addResponse.paymentAmount || totalPrice;

    return (
      <PaymentPopup
        isOpen={true}
        onClose={() => {
          setShowPaymentPopup(false);
          setError('Payment cancelled.');
          setStep('result');
        }}
        orderInfo={{
          transactionId,
          orderId,
          pnr: orderId,
          carrierCode: owner,
          originalAmount: paymentAmount,
          currency,
          orderItemRefIds: addResponse.orderChangeData?.orderItemRefIds,
        }}
        onSuccess={handlePaymentSuccess}
        skipInternalQuote={true}
        onPaymentSubmit={handleServicePayment}
      />
    );
  }

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
              {step === 'loading' && 'Retrieving service list...'}
              {step === 'quote' && 'Checking service price...'}
              {step === 'confirm' && 'Adding service...'}
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
                <h3 className="text-xl font-bold text-foreground mb-2">Service Added Successfully</h3>
                <p className="text-muted mb-4">{result.message}</p>
                {result.emdNumbers && result.emdNumbers.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 text-left mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">EMD Number</p>
                    {result.emdNumbers.map((emd, index) => (
                      <p key={index} className="text-sm text-muted font-mono">{emd}</p>
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
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {error === ERROR_MESSAGES.SERVICE_TICKETING_ONLY ? ERROR_MESSAGES.SERVICE_TICKETING_ONLY : ERROR_MESSAGES.SERVICE_ADD_FAILED}
                </h3>
                <p className="text-muted">{error || ERROR_MESSAGES.GENERIC_ERROR}</p>
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
            <p>Step: {step}</p>
            <p>Group: {group}</p>
            <p>Owner: {owner}</p>
            <p>Ticketed: {isTicketed ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
