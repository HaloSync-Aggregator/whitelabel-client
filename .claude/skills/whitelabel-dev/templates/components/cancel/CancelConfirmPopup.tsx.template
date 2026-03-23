// @template CancelConfirmPopup
// @version 4.0.0 (synced from template)
// @description Template for cancel/CancelConfirmPopup.tsx

/**
 * @component CancelConfirmPopup
 * @description Booking cancellation confirmation popup (before ticketing)
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CancelConfirmPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  orderInfo: {
    orderId: string;
    pnr: string;
    carrierCode: string;
    passengerCount: number;
    carrierName?: string;
  };
}

export function CancelConfirmPopup({
  isOpen,
  onClose,
  onConfirm,
  orderInfo,
}: CancelConfirmPopupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during cancellation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to cancel this booking?
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Booking Reference (PNR)</span>
              <span className="font-medium text-gray-900">{orderInfo.pnr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Airline</span>
              <span className="font-medium text-gray-900">
                {orderInfo.carrierName || orderInfo.carrierCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passengers</span>
              <span className="font-medium text-gray-900">
                {orderInfo.passengerCount} pax
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-red-600">
            This action cannot be undone after cancellation.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700',
              'font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors'
            )}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 min-w-0 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium',
              'hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2',
              'transition-colors'
            )}
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
              'Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelConfirmPopup;
