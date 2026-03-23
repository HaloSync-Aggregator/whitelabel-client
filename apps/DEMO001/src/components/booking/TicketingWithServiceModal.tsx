// @template TicketingWithServiceModal
// @version 4.0.0 (synced from template)
// @description Template for booking/TicketingWithServiceModal.tsx

/**
 * TicketingWithServiceModal Component
 *
 * ============================================================
 * Before ticketing Service/Seat Add Option Modal
 * ============================================================
 *
 * Flow:
 * 1. idle: Select whether to add service/seat (support/unsupport branching)
 * 2. service-select: ServiceList API call -> Select service
 * 3. service-adding: Add service (skipPayment=true)
 * 4. seat-select: SeatAvailability API call -> Select seat
 * 5. seat-adding: Add seat (step 1)
 * 6. payment: PaymentPopup display (baseFare + serviceFee + seatFee)
 * 7. ticketing: Ticketing process
 * 8. success: Complete
 * 9. error: Error
 *
 * CRITICAL: 2-Step split strategy
 * - Step 1: Add service/seat (skipPayment=true, no payment)
 * - Step 2: Ticketing (integrated payment)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ServiceSelector, { type Passenger } from '@/components/service/ServiceSelector';
import { SeatSelector } from '@/components/seat';
import { PaymentPopup } from '@/components/payment';
import { type ServiceListData, type SelectedService } from '@/types/service';
import { type SeatAvailabilityData, type SelectedSeat } from '@/types/seat';
import {
  type TicketingWithServiceStep,
  type SelectedServiceItem,
  type SelectedSeatItem,
  type TicketingAmount,
  type TicketingWithServiceModalProps,
  calculateTicketingAmount,
  canAddServiceBeforeTicketing,
  canAddSeatBeforeTicketing,
} from '@/types/ticketing-with-service';
import {
  type PaymentResult,
  type TicketingQuote,
  formatFareDifferenceLabel,
} from '@/types/payment';
import { getQuoteApiType } from '@/types/seat-purchase';
import { formatPrice } from '@/lib/utils';
import {
  getServiceList,
  getSeatAvailability,
  processServicePurchase,
  getSeatPurchaseQuote,
  confirmSeatPurchase,
} from '@/lib/api/polarhub-service';

// ============================================================
// Component
// ============================================================

export default function TicketingWithServiceModal({
  isOpen,
  onClose,
  orderId,
  owner,
  transactionId,
  passengers,
  baseFare,
  currency,
  orderItemRefIds,
  onSuccess,
}: TicketingWithServiceModalProps) {
  // State
  const [step, setStep] = useState<TicketingWithServiceStep>('idle');
  const [serviceData, setServiceData] = useState<ServiceListData | null>(null);
  const [seatData, setSeatData] = useState<SeatAvailabilityData | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeatItem[]>([]);
  const [amount, setAmount] = useState<TicketingAmount>(() =>
    calculateTicketingAmount(baseFare, 0, currency, 0)
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    responseId: string;
    offerId: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
      seatSelection?: { column: string; row: string }; // v1.2.0: Seat information required!
    }>;
  } | null>(null);
  const [seatOrderItemIds, setSeatOrderItemIds] = useState<string[]>([]);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);

  // Service/Seat Add availability
  const canAddService = canAddServiceBeforeTicketing(owner);
  const canAddSeat = canAddSeatBeforeTicketing(owner);

  // Passenger Type Conversion
  const serviceSelectorPassengers: Passenger[] = passengers.map((p) => ({
    paxId: p.paxId,
    name: p.name,
    type: p.type as 'ADT' | 'CHD' | 'INF',
    typeLabel: p.typeLabel,
  }));

  // ============================================================
  // Reset state when modal closes
  // ============================================================
  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      processingRef.current = false;

      setStep('idle');
      setServiceData(null);
      setSeatData(null);
      setSelectedServices([]);
      setSelectedSeats([]);
      setAmount(calculateTicketingAmount(baseFare, 0, currency, 0));
      setError(null);
      setIsLoading(false);
      setShowPaymentPopup(false);
      setQuoteData(null);
    }
  }, [isOpen, baseFare, currency]);

  // ============================================================
  // Fetch ServiceList
  // ============================================================
  const fetchServiceList = useCallback(async () => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[TicketingWithServiceModal] Fetching ServiceList...');
      const data = await getServiceList({
        transactionId,
        order: { orderId, owner },
        paxList: passengers.map((p) => ({ paxId: p.paxId, ptc: p.type as 'ADT' | 'CHD' | 'INF' })),
        currencyCode: currency,
      });

      if (abortController.signal.aborted) return;

      setServiceData(data.serviceData);
      setStep('service-select');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (abortController.signal.aborted) return;
      console.error('[TicketingWithServiceModal] ServiceList error:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve service list.');
      setStep('error');
    } finally {
      if (!abortController.signal.aborted) setIsLoading(false);
    }
  }, [transactionId, orderId, owner, passengers, currency]);

  // ============================================================
  // Fetch SeatAvailability
  // ============================================================
  const fetchSeatAvailability = useCallback(async () => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[TicketingWithServiceModal] Fetching SeatAvailability...');
      const data = await getSeatAvailability({
        transactionId,
        // Post-Booking: Exclude owner from order! (PolarHub restriction)
        order: { orderId },
        // Pass owner separately outside of order
        owner,
        // paxList required!
        paxList: passengers.map((p) => ({ paxId: p.paxId, ptc: p.type as 'ADT' | 'CHD' | 'INF' })),
      });

      if (abortController.signal.aborted) return;

      setSeatData(data.seatData);
      setStep('seat-select');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (abortController.signal.aborted) return;
      console.error('[TicketingWithServiceModal] SeatAvailability error:', err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve seat information.');
      setStep('error');
    } finally {
      if (!abortController.signal.aborted) setIsLoading(false);
    }
  }, [transactionId, orderId, owner, passengers]);

  // ============================================================
  // Button Handlers
  // ============================================================
  const handleAddServiceClick = useCallback(() => {
    setStep('service-select');
    fetchServiceList();
  }, [fetchServiceList]);

  const handleAddSeatClick = useCallback(() => {
    setStep('seat-select');
    fetchSeatAvailability();
  }, [fetchSeatAvailability]);

  const handleSkipToPayment = useCallback(() => {
    setStep('payment');
    setShowPaymentPopup(true);
  }, []);

  const handleProceedTicketing = useCallback(() => {
    setStep('payment');
    setShowPaymentPopup(true);
  }, []);

  // ============================================================
  // Handle service selection confirm
  // ============================================================
  const handleServiceConfirm = useCallback(
    async (services: SelectedService[]) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const serviceItems: SelectedServiceItem[] = services.map((svc) => ({
        serviceId: svc.serviceId,
        offerItemId: svc.offerItemId,
        paxId: svc.paxId,
        segmentId: svc.segmentId,
        quantity: svc.quantity,
        price: svc.price,
        currency: svc.currency,
        weightValue: svc.weightValue,
        bookingInstructions: svc.bookingInstructions,
      }));

      setSelectedServices(serviceItems);
      setStep('service-adding');
      setIsLoading(true);
      setError(null);

      try {
        const purchaseData = await processServicePurchase(orderId, {
          transactionId,
          orderId,
          owner,
          isTicketed: false,
          skipPayment: true,
          serviceListData: serviceData?._apiData
            ? { responseId: serviceData._apiData.responseId, offerId: serviceData._apiData.offerId, owner: serviceData._apiData.owner }
            : undefined,
          selectedServices: services,
        });

        const totalAmount = purchaseData.paymentAmount || baseFare;
        const updatedAmount: TicketingAmount = {
          baseFare,
          serviceFee: totalAmount - baseFare,
          seatFee: 0,
          total: totalAmount,
          currency: purchaseData.currency || currency,
        };
        setAmount(updatedAmount);

        if (purchaseData.quoteData?.responseId && purchaseData.quoteData?.offerId) {
          setQuoteData(purchaseData.quoteData as { responseId: string; offerId: string; offerItems?: { offerItemId: string; paxRefId: string[]; seatSelection?: { column: string; row: string } }[] });
        }

        setStep('service-added');
        setTimeout(() => {
          if (canAddSeat) {
            setStep('idle');
          } else {
            setStep('payment');
            setShowPaymentPopup(true);
          }
        }, 500);
      } catch (err) {
        console.error('[TicketingWithServiceModal] Service add error:', err);
        setError(err instanceof Error ? err.message : 'Failed to add service.');
        setStep('error');
      } finally {
        setIsLoading(false);
        processingRef.current = false;
      }
    },
    [transactionId, orderId, owner, baseFare, currency, serviceData, canAddSeat]
  );

  // ============================================================
  // Handle seat selection confirm
  // ============================================================
  const handleSeatConfirm = useCallback(
    async (seats: SelectedSeat[]) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const seatItems: SelectedSeatItem[] = seats.map((seat) => {
        const match = seat.seatNumber.match(/^(\d+)([A-Z]+)$/i);
        const row = match ? match[1] : seat.seatNumber.replace(/[A-Z]/gi, '');
        const column = match ? match[2] : seat.seatNumber.replace(/\d/g, '');
        return {
          offerItemId: seat.offerItemId,
          paxId: seat.paxId,
          segmentId: seat.segmentId,
          column,
          row,
          price: seat.price,
          currency: seat.currency,
        };
      });

      setSelectedSeats(seatItems);
      setStep('seat-adding');
      setIsLoading(true);
      setError(null);

      try {
        const seatTotal = seatItems.reduce((sum, s) => sum + s.price, 0);
        const isPaid = seatTotal > 0;

        // v1.1.0: Call Quote first for carriers that require it!
        // Pattern A (AF/KL): OfferPrice, Pattern B (AY/SQ): OrderQuote, Pattern C (TR/TK): OrderQuote
        // v3.26: AF/KL were missing - must call OfferPrice to get new OfferItemIDs
        const needsQuoteFirst = getQuoteApiType(owner, isPaid) !== 'NONE';
        let seatQuoteData = seatData?._apiData ? {
          responseId: seatData._apiData.responseId,
          offerId: seatData._apiData.offerId,
          offerItems: seatItems.map(s => ({ offerItemId: s.offerItemId, paxRefId: [s.paxId] })),
        } : undefined;

        if (needsQuoteFirst) {
          console.log('[TicketingWithServiceModal] Calling seat-purchase/quote first (owner:', owner, ')');
          const quoteResult = await getSeatPurchaseQuote(orderId, {
            transactionId,
            orderId,
            owner,
            isPaid,
            seatAvailabilityData: seatData?._apiData ? {
              responseId: seatData._apiData.responseId,
              offerId: seatData._apiData.offerId,
              owner: seatData._apiData.owner || owner,
            } : undefined,
            selectedSeats: seatItems.map(s => ({
              offerItemId: s.offerItemId,
              paxId: s.paxId,
              segmentKey: s.segmentId,
              column: s.column,
              row: s.row,
              seatNumber: s.row + s.column,
              price: s.price,
              currency: s.currency || currency,
            })),
          });

          console.log('[TicketingWithServiceModal] seat-purchase/quote success:', quoteResult);

          // Pass quoteData from quote response to confirm
          if (quoteResult.quoteData) {
            seatQuoteData = {
              responseId: quoteResult.quoteData.responseId || '',
              offerId: quoteResult.quoteData.offerId || '',
              offerItems: quoteResult.quoteData.offerItems || seatItems.map(s => ({ offerItemId: s.offerItemId, paxRefId: [s.paxId] })),
            };
          }
        }

        console.log('[TicketingWithServiceModal] Calling seat-purchase/confirm step 1...');
        const confirmData = await confirmSeatPurchase(orderId, {
          transactionId,
          orderId,
          owner,
          purchaseType: isPaid ? 'paid' : 'free',
          step: 1,
          quoteData: seatQuoteData,
          selectedSeats: seatItems.map(s => ({
            offerItemId: s.offerItemId,
            paxId: s.paxId,
            segmentKey: s.segmentId,
            column: s.column,
            row: s.row,
            seatNumber: s.row + s.column,
            price: s.price,
            currency: s.currency || currency,
          })),
        });

        // SQ/AY (Pattern B): Save quoteData -> Reuse in PaymentPopup
        // CRITICAL (v1.2.0): seatSelection is NOT in offerItems from Quote response!
        // Must build seatSelection from selectedSeats (seatItems)!
        const finalQuoteData = {
          responseId: seatQuoteData?.responseId || confirmData.quoteData?.responseId || '',
          offerId: seatQuoteData?.offerId || confirmData.quoteData?.offerId || orderId,
          // Include seatSelection! (Build from original selectedSeats, not Quote Response)
          offerItems: seatItems.map(s => ({
            offerItemId: s.offerItemId,
            paxRefId: [s.paxId],
            seatSelection: { column: s.column, row: s.row },
          })),
        };
        console.log('[TicketingWithServiceModal] Saving quoteData with seatSelection:', finalQuoteData);
        setQuoteData(finalQuoteData);

        // v3.26: Save orderItemIds from Step 1 response (AF/KL Pattern A needs these for Step 2 PaymentList)
        if (confirmData.orderItemIds?.length) {
          console.log('[TicketingWithServiceModal] Saving seatOrderItemIds:', confirmData.orderItemIds);
          setSeatOrderItemIds(confirmData.orderItemIds);
        }

        const newSeatFee = seatTotal;
        const updatedAmount: TicketingAmount = {
          baseFare: amount.baseFare,
          serviceFee: amount.serviceFee,
          seatFee: newSeatFee,
          total: amount.baseFare + amount.serviceFee + newSeatFee,
          currency,
        };
        setAmount(updatedAmount);

        setStep('seat-added');
        setTimeout(() => {
          setStep('payment');
          setShowPaymentPopup(true);
        }, 500);
      } catch (err) {
        console.error('[TicketingWithServiceModal] Seat add error:', err);
        setError(err instanceof Error ? err.message : 'Failed to add seat.');
        setStep('error');
      } finally {
        setIsLoading(false);
        processingRef.current = false;
      }
    },
    [transactionId, orderId, owner, currency, seatData, amount]
  );

  // ============================================================
  // Payment handlers
  // ============================================================
  const handlePaymentSuccess = useCallback(
    (result: PaymentResult) => {
      setShowPaymentPopup(false);
      if (result.success) {
        setStep('success');
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        setError(result.message || 'Payment failed.');
        setStep('error');
      }
    },
    [onSuccess, onClose]
  );

  const handlePaymentClose = useCallback(() => {
    setShowPaymentPopup(false);
    setError('Payment was cancelled.');
    setStep('error');
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading || step === 'service-adding' || step === 'seat-adding' || step === 'ticketing') return;
    if (step === 'service-select' || step === 'seat-select') {
      const confirmed = window.confirm('Are you sure you want to cancel the selection?');
      if (!confirmed) return;
    }
    onClose();
  }, [isLoading, step, onClose]);

  const handleRetry = useCallback(() => {
    setError(null);
    setStep('idle');
  }, []);

  // ============================================================
  // Render
  // ============================================================
  if (!isOpen) return null;

  // ServiceSelector Mode
  if (step === 'service-select' && serviceData) {
    return (
      <ServiceSelector
        serviceData={serviceData}
        passengers={serviceSelectorPassengers}
        onConfirm={handleServiceConfirm}
        onClose={handleClose}
        isLoading={isLoading}
      />
    );
  }

  // SeatSelector Mode
  if (step === 'seat-select' && seatData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
          <SeatSelector
            seatData={seatData}
            passengers={serviceSelectorPassengers}
            onConfirm={handleSeatConfirm}
            onClose={handleClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  // PaymentPopup Mode
  if (showPaymentPopup) {
    const totalAddedFee = amount.serviceFee + amount.seatFee;
    const existingQuote: TicketingQuote | undefined = quoteData?.responseId
      ? {
          responseId: quoteData.responseId,
          offerId: quoteData.offerId || orderId,
          owner,
          fareDifference: {
            originalFare: baseFare,
            newFare: amount.total,
            difference: totalAddedFee,
            currency: amount.currency,
            differenceLabel: formatFareDifferenceLabel(totalAddedFee, amount.currency),
          },
          offerItems: quoteData.offerItems,
        }
      : undefined;

    return (
      <PaymentPopup
        isOpen={true}
        onClose={handlePaymentClose}
        orderInfo={{
          transactionId,
          orderId,
          pnr: orderId,
          carrierCode: owner,
          originalAmount: amount.total,
          currency: amount.currency,
          orderItemRefIds,
          // v3.26: AF/KL Pattern A Step 2 needs OrderItemIDs from seat-purchase/confirm Step 1
          seatOrderItemIds: seatOrderItemIds.length > 0 ? seatOrderItemIds : undefined,
        }}
        onSuccess={handlePaymentSuccess}
        existingQuote={existingQuote}
        skipInternalQuote={!!existingQuote}
        skipChangeOrderChoice={selectedServices.length > 0 || selectedSeats.length > 0}
      />
    );
  }

  // Default Modal UI
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={step === 'success' || step === 'error' ? handleClose : undefined} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* idle state */}
        {step === 'idle' && (
          <div className="text-center">
            {canAddService || canAddSeat ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {selectedServices.length > 0 ? 'Add Seat?' : 'Add Additional Options?'}
                </h3>
                <p className="text-muted mb-6">
                  {selectedServices.length > 0
                    ? 'Service added. Proceed to payment after seat selection.'
                    : 'You can add ancillary services and seats before ticketing.'}
                </p>

                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted">Base fare</span>
                    <span className="text-foreground">{formatPrice(amount.baseFare, amount.currency)}</span>
                  </div>
                  {amount.serviceFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted">Ancillary service</span>
                      <span className="text-foreground">{formatPrice(amount.serviceFee, amount.currency)}</span>
                    </div>
                  )}
                  {amount.seatFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted">Seat</span>
                      <span className="text-foreground">{formatPrice(amount.seatFee, amount.currency)}</span>
                    </div>
                  )}
                  {(amount.serviceFee > 0 || amount.seatFee > 0) && (
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">Total payment amount</span>
                        <span className="font-bold text-primary">{formatPrice(amount.total, amount.currency)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {canAddService && selectedServices.length === 0 && (
                    <button type="button" onClick={handleAddServiceClick} className="w-full px-4 py-2.5 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      Add service
                    </button>
                  )}
                  {canAddSeat && selectedSeats.length === 0 && (
                    <button type="button" onClick={handleAddSeatClick} className="w-full px-4 py-2.5 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      Seat selection
                    </button>
                  )}
                  <button type="button" onClick={handleSkipToPayment} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                    {selectedServices.length > 0 || selectedSeats.length > 0 ? 'Pay Now' : 'Skip and Proceed to Ticketing'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Additional Options Not Available</h3>
                <p className="text-muted mb-6">This carrier only supports adding ancillary services/seats after ticketing.<br />You can add them from booking details after ticketing is complete.</p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted">Payment Amount</span>
                    <span className="font-bold text-lg text-foreground">{formatPrice(baseFare, currency)}</span>
                  </div>
                </div>
                <button type="button" onClick={handleProceedTicketing} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Proceed to Ticketing</button>
              </>
            )}
          </div>
        )}

        {/* Loading states */}
        {step === 'service-select' && !serviceData && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <p className="text-lg font-medium text-foreground">Loading service list...</p>
            <p className="text-sm text-muted mt-2">Please wait a moment.</p>
          </div>
        )}
        {step === 'seat-select' && !seatData && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <p className="text-lg font-medium text-foreground">Loading seat information...</p>
            <p className="text-sm text-muted mt-2">Please wait a moment.</p>
          </div>
        )}
        {step === 'service-adding' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <p className="text-lg font-medium text-foreground">Adding service...</p>
          </div>
        )}
        {step === 'seat-adding' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <p className="text-lg font-medium text-foreground">Adding seat...</p>
          </div>
        )}
        {step === 'service-added' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-lg font-medium text-foreground">Service Added Successfully</p>
          </div>
        )}
        {step === 'seat-added' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-lg font-medium text-foreground">Seat Added Successfully</p>
            <p className="text-sm text-muted mt-2">Navigating to payment...</p>
          </div>
        )}
        {step === 'ticketing' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <p className="text-lg font-medium text-foreground">Processing ticketing...</p>
          </div>
        )}

        {/* success state */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Ticketing Complete</h3>
            <p className="text-muted mb-4">
              {selectedServices.length > 0 && selectedSeats.length > 0
                ? 'Ticketing completed with your selected services and seats.'
                : selectedServices.length > 0
                ? 'Ticketing completed with your selected services.'
                : selectedSeats.length > 0
                ? 'Ticketing completed with your selected seats.'
                : 'Ticketing completed successfully.'}
            </p>
            {(amount.serviceFee > 0 || amount.seatFee > 0) && (
              <div className="bg-muted/30 rounded-lg p-4 text-left mb-4">
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted">Base fare</span><span className="text-foreground">{formatPrice(amount.baseFare, amount.currency)}</span></div>
                {amount.serviceFee > 0 && <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted">Ancillary service</span><span className="text-foreground">{formatPrice(amount.serviceFee, amount.currency)}</span></div>}
                {amount.seatFee > 0 && <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted">Seat</span><span className="text-foreground">{formatPrice(amount.seatFee, amount.currency)}</span></div>}
                <div className="border-t border-border pt-2 mt-2"><div className="flex justify-between items-center"><span className="font-medium text-foreground">Total payment amount</span><span className="font-bold text-lg text-primary">{formatPrice(amount.total, amount.currency)}</span></div></div>
              </div>
            )}
            <button type="button" onClick={handleClose} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Confirm</button>
          </div>
        )}

        {/* error state */}
        {step === 'error' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Error Occurred</h3>
            <p className="text-muted mb-4">{error || 'An error occurred.'}</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={handleClose} className="px-6 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted/50">Close</button>
              <button type="button" onClick={handleRetry} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Retry</button>
            </div>
          </div>
        )}

        {/* Dev Info */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <p>Step: {step} | Owner: {owner}</p>
            <p>CanAddService: {canAddService ? 'Yes' : 'No'} | CanAddSeat: {canAddSeat ? 'Yes' : 'No'}</p>
            <p>Services: {selectedServices.length} | Seats: {selectedSeats.length}</p>
            <p>Amount: {amount.baseFare} + {amount.serviceFee} + {amount.seatFee} = {amount.total}</p>
          </div>
        )}
      </div>
    </div>
  );
}
