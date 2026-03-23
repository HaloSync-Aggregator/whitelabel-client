// @template PassengerSplitModal
// @version 4.0.0 (synced from template)
// @description Template for booking/PassengerSplitModal.tsx

/**
 * @template PassengerSplitModal
 * @version 1.0.0
 * @description Passenger Split Modal (2Step)
 *
 * Workflow: WF_HELD_SPLIT, WF_TKT_SPLIT
 *
 * Step 1: Split Passenger Select (1personeach)
 * Step 2: Split Confirm
 *
 * Supported carriers: AY, HA, KL, SQ, TK, TR
 */

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PassengerInfo } from '@/types/booking';
import {
  getSplittablePassengers,
  canSplit,
  supportsPaxSplit,
  type SplittablePassenger,
} from '@/types/pax-split';
import { splitPax, ApiError } from '@/lib/api/polarhub-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';

interface PassengerSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  pnr: string;
  carrierCode: string;
  passengers: PassengerInfo[];
  onSuccess: (result: { newOrderId?: string; newPnr?: string }) => void;
}

type ModalStep = 'select' | 'confirm';

export default function PassengerSplitModal({
  isOpen,
  onClose,
  orderId,
  pnr,
  carrierCode,
  passengers,
  onSuccess,
}: PassengerSplitModalProps) {
  const [step, setStep] = useState<ModalStep>('select');
  const [selectedPaxId, setSelectedPaxId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Split Available Passenger List (INF Exclude)
  const splittablePassengers = useMemo<SplittablePassenger[]>(() => {
    const paxData = passengers.map(p => ({
      paxId: p.paxId,
      ptc: p.ptc,
      name: p.fullName,
      title: p.title,
      // INF's Case Accompanying Adult find (Is Logic)
      paxRefId: undefined as string | undefined,
    }));

    // INF Accompanying Adult Information Add (accompanyingInfant based)
    passengers.forEach(p => {
      if (p.ptc === 'ADT' && p.accompanyingInfant) {
        const infant = passengers.find(inf =>
          inf.ptc === 'INF' && inf.fullName === p.accompanyingInfant
        );
        if (infant) {
          const infData = paxData.find(pd => pd.paxId === infant.paxId);
          if (infData) {
            infData.paxRefId = p.paxId;
          }
        }
      }
    });

    return getSplittablePassengers(paxData);
  }, [passengers]);

  // Select Passenger information
  const selectedPax = useMemo(() =>
    splittablePassengers.find(p => p.paxId === selectedPaxId),
    [splittablePassengers, selectedPaxId]
  );

  // Split Available Whether
  const splitCheck = useMemo(() =>
    canSplit(splittablePassengers.length),
    [splittablePassengers]
  );

  // Carrier Support Whether
  const isSupported = supportsPaxSplit(carrierCode);

  // Modal Close
  const handleClose = () => {
    if (isSubmitting) return;
    setStep('select');
    setSelectedPaxId(null);
    setError(null);
    onClose();
  };

  // Next Step
  const handleNext = () => {
    if (!selectedPaxId) {
      setError(ERROR_MESSAGES.PAX_SPLIT_REQUIRED);
      return;
    }
    setError(null);
    setStep('confirm');
  };

  // Previous Step
  const handleBack = () => {
    setStep('select');
    setError(null);
  };

  // Split Execution
  const handleSplit = async () => {
    if (!selectedPaxId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await splitPax({
        orderId,
        splitPaxId: selectedPaxId,
      });

      // Success
      onSuccess({
        newOrderId: result.newOrderId,
        newPnr: result.newPnr,
      });
      handleClose();
    } catch (err) {
      console.error('Pax split error:', err);
      const message = err instanceof ApiError ? err.message : ERROR_MESSAGES.PAX_SPLIT_FAILED;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {step === 'confirm' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {step === 'select' ? 'Passenger Split' : 'Split Confirm'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* unSupported carriers */}
          {!isSupported && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">
                {ERROR_MESSAGES.PAX_SPLIT_NOT_SUPPORTED(carrierCode)}
              </p>
            </div>
          )}

          {/* Split Not possible (2person Under) */}
          {isSupported && !splitCheck.canSplit && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800">
                {splitCheck.message}
              </p>
            </div>
          )}

          {/* Step 1: Passenger Select */}
          {isSupported && splitCheck.canSplit && step === 'select' && (
            <>
              {/* Guide Message */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Passenger Split Guide</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>1personeach only Split .</li>
                  <li>Accompanying Infant exists Case Doestogether Split.</li>
                  <li>Split bookings cannot be merged again.</li>
                </ul>
              </div>

              {/* Current PNR Information */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted">Current BookingNumber</p>
                <p className="font-mono font-bold text-foreground">{pnr}</p>
              </div>

              {/* Passenger List (radio) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Split Passenger Select
                </label>
                {splittablePassengers.map((pax, index) => (
                  <label
                    key={pax.paxId}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      selectedPaxId === pax.paxId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="splitPax"
                      value={pax.paxId}
                      checked={selectedPaxId === pax.paxId}
                      onChange={(e) => setSelectedPaxId(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">{index + 1}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 bg-muted/50 rounded">
                          {pax.ptc}
                        </span>
                        {pax.title && (
                          <span className="text-xs text-muted">{pax.title}</span>
                        )}
                      </div>
                      <p className="font-medium text-foreground">{pax.name}</p>
                      {pax.infant && (
                        <p className="text-xs text-primary mt-1">
                          + Accompanying Infant: {pax.infant.name}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Next Button */}
              <div className="mt-6">
                <button
                  onClick={handleNext}
                  disabled={!selectedPaxId}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition-colors',
                    selectedPaxId
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* Step 2: Split Confirm */}
          {isSupported && splitCheck.canSplit && step === 'confirm' && selectedPax && (
            <>
              {/* Split Target Information */}
              <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Split Target</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/20 rounded">
                    {selectedPax.ptc}
                  </span>
                  {selectedPax.title && (
                    <span className="text-xs text-muted">{selectedPax.title}</span>
                  )}
                  <span className="font-medium text-foreground">{selectedPax.name}</span>
                </div>
                {selectedPax.infant && (
                  <div className="mt-2 flex items-center gap-2 text-primary">
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-primary/20 rounded">INF</span>
                    <span className="text-sm">{selectedPax.infant.name}</span>
                    <span className="text-xs">(Accompanying Infant)</span>
                  </div>
                )}
              </div>

              {/* PNR Change Guide */}
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">BookingNumber Change</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-bold text-foreground">{pnr}</span>
                  <span className="text-muted">(Parent)</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="font-mono font-bold text-primary">new PNR</span>
                  <span className="text-muted">(child - after Split Create)</span>
                </div>
              </div>

              {/* Precautions */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p className="font-medium mb-1">Precautions</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Split bookings cannot be merged again.</li>
                  <li>Existing ancillary services (Seat, Baggage) may need to be repurchased.</li>
                  <li>After split, each booking can be changed/cancelled individually.</li>
                </ul>
              </div>

              {/* Button */}
              <div className="flex gap-3 w-full overflow-hidden">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 min-w-0 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleSplit}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 min-w-0 py-3 rounded-lg font-medium transition-colors',
                    isSubmitting
                      ? 'bg-primary/70 text-white cursor-wait'
                      : 'bg-primary text-white hover:bg-primary/90'
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Process ...
                    </span>
                  ) : (
                    'Split'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
