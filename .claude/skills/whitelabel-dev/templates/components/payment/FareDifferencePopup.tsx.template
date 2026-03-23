// @template FareDifferencePopup
// @version 4.0.0 (synced from template)
// @description Template for payment/FareDifferencePopup.tsx


/**
 * @component FareDifferencePopup
 * @description Fare Difference Display Popup (Group A/B Post-ticketing)
 *
 * Fare recalculation Result display and Payment Progress Confirm receive.
 * - Difference positive: Additional payment Required
 * - Difference negative: Refund expected
 * - Difference 0: Same Fare
 */

import { type FareDifference } from '@/types/payment';

interface FareDifferencePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fareDifference: FareDifference | null;
  isLoading?: boolean;
}

export function FareDifferencePopup({
  isOpen,
  onClose,
  onConfirm,
  fareDifference,
  isLoading = false,
}: FareDifferencePopupProps) {
  if (!isOpen) return null;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDifferenceColor = () => {
    if (!fareDifference) return 'text-gray-900';
    if (fareDifference.difference > 0) return 'text-red-600';
    if (fareDifference.difference < 0) return 'text-green-600';
    return 'text-gray-900';
  };

  const getDifferenceText = () => {
    if (!fareDifference) return '';
    if (fareDifference.difference > 0) return 'Additional payment';
    if (fareDifference.difference < 0) return 'Refund expected';
    return 'Same';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Fare Confirm</h2>
            <p className="text-sm text-muted">Please confirm fare before payment</p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && !fareDifference && (
          <div className="py-8 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-3" viewBox="0 0 24 24">
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
            <p className="text-muted">Recalculating fare...</p>
          </div>
        )}

        {/* Fare Difference Display */}
        {fareDifference && (
          <div className="mb-6">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {/* Original fare */}
              <div className="flex justify-between items-center">
                <span className="text-muted">Original fare</span>
                <span className="font-medium text-foreground">
                  {formatPrice(fareDifference.originalFare, fareDifference.currency)}
                </span>
              </div>

              {/* New Fare */}
              <div className="flex justify-between items-center">
                <span className="text-muted">Recalculated Fare</span>
                <span className="font-medium text-foreground">
                  {formatPrice(fareDifference.newFare, fareDifference.currency)}
                </span>
              </div>

              {/* Difference */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">{getDifferenceText()}</span>
                  <span className={`text-xl font-bold ${getDifferenceColor()}`}>
                    {fareDifference.difference !== 0 && (
                      <span>{fareDifference.difference > 0 ? '+' : ''}</span>
                    )}
                    {formatPrice(Math.abs(fareDifference.difference), fareDifference.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Message (when Difference exists) */}
            {fareDifference.difference !== 0 && (
              <div className={`mt-4 p-3 rounded-lg ${
                fareDifference.difference > 0
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm ${
                  fareDifference.difference > 0 ? 'text-amber-700' : 'text-green-700'
                }`}>
                  {fareDifference.difference > 0
                    ? 'A fare difference has occurred. The additional amount will be charged.'
                    : 'A refund will be processed for the fare difference.'}
                </p>
              </div>
            )}

            <p className="mt-4 text-sm text-muted">
              * Fare may vary depending on airline policy.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-w-0 px-4 py-2.5 border border-border rounded-lg text-foreground font-medium hover:bg-muted/50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !fareDifference}
            className="flex-1 min-w-0 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FareDifferencePopup;
