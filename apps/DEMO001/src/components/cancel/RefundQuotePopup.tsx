// @template RefundQuotePopup
// @version 4.0.0 (synced from template)
// @description Template for cancel/RefundQuotePopup.tsx

/**
 * @component RefundQuotePopup
 * @description Refund quote/estimate popup (after ticketing: VOID/REFUND)
 *
 * NOTE: refundQuoteId is NOT passed to OrderCancel (not in API spec).
 * Actual refund is processed via OrderCancel(orderId) only.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RefundQuote {
  originalFare: number;
  penalty: number;
  refundAmount: number;
  currency: string;
  responseId: string;
  breakdown?: Array<{
    orderItemId: string;
    originalAmount: number;
    penaltyAmount: number;
    refundAmount: number;
    currency: string;
  }>;
}

interface RefundQuotePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  refundQuote: RefundQuote | null;
  orderInfo: {
    orderId: string;
    pnr: string;
    carrierCode: string;
    isVoidAvailable: boolean;
  };
  isLoading?: boolean;
}

export function RefundQuotePopup({
  isOpen,
  onClose,
  onConfirm,
  refundQuote,
  orderInfo,
  isLoading: externalLoading = false,
}: RefundQuotePopupProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!refundQuote) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during the refund process.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const isLoading = externalLoading || isProcessing;
  const title = orderInfo.isVoidAvailable ? 'Ticket Cancellation (VOID)' : 'Request Refund';
  const confirmLabel = orderInfo.isVoidAvailable ? 'Process VOID' : 'Process Refund';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">PNR: {orderInfo.pnr}</p>
          </div>
        </div>

        {/* VOID warning message */}
        {orderInfo.isVoidAvailable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              VOID is only available on the day of ticketing. After today, a standard refund process will apply.
            </p>
          </div>
        )}

        {/* Loading state (fetching quote) */}
        {externalLoading && !refundQuote && (
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
            <p className="text-gray-600">Retrieving refund estimate...</p>
          </div>
        )}

        {/* Refund quote details */}
        {refundQuote && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {/* Original fare */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Original fare paid</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(refundQuote.originalFare, refundQuote.currency)}
                </span>
              </div>

              {/* Cancellation penalty */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cancellation fee</span>
                <span className="font-medium text-red-600">
                  - {formatPrice(refundQuote.penalty, refundQuote.currency)}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-3">
                {/* Expected refund amount */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-medium">Estimated Refund Amount</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(refundQuote.refundAmount, refundQuote.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail breakdown */}
            {refundQuote.breakdown && refundQuote.breakdown.length > 1 && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  View detailed breakdown
                </summary>
                <div className="mt-2 space-y-2">
                  {refundQuote.breakdown.map((item, index) => (
                    <div key={item.orderItemId} className="text-sm bg-gray-50 rounded p-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Item {index + 1}</span>
                        <span className="text-gray-900">
                          {formatPrice(item.refundAmount, item.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <p className="mt-4 text-sm text-gray-500">
              * Refund processing time may vary depending on payment method.
            </p>
          </div>
        )}

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
            disabled={isLoading || !refundQuote}
            className={cn(
              'flex-1 min-w-0 px-4 py-2.5 bg-primary text-white rounded-lg font-medium',
              'hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2',
              'transition-colors'
            )}
          >
            {isProcessing ? (
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
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RefundQuotePopup;
