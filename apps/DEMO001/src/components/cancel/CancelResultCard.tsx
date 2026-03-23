// @template CancelResultCard
// @version 4.0.0 (synced from template)
// @description Template for cancel/CancelResultCard.tsx

/**
 * @component CancelResultCard
 * @description Cancellation/refund result display card
 */

import { cn } from '@/lib/utils';

interface CancelResult {
  success: boolean;
  orderId: string;
  pnr?: string;
  status: 'CANCELLED' | 'VOIDED' | 'REFUNDED';
  statusLabel: string;
  actionDate: string;
  message: string;
  refundAmount?: number;
  currency?: string;
}

interface CancelResultCardProps {
  result: CancelResult;
  onClose?: () => void;
  onGoHome?: () => void;
}

export function CancelResultCard({
  result,
  onClose,
  onGoHome,
}: CancelResultCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      case 'VOIDED':
        return 'text-amber-600 bg-amber-100';
      case 'REFUNDED':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getIcon = (status: string) => {
    if (status === 'REFUNDED' || status === 'VOIDED') {
      return (
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-8 h-8 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-8 text-center">
        <div className="flex justify-center mb-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            result.success ? 'bg-green-100' : 'bg-red-100'
          )}>
            {result.success ? (
              getIcon(result.status)
            ) : (
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {result.statusLabel}
        </h2>

        <span className={cn(
          'inline-block px-3 py-1 rounded-full text-sm font-medium',
          getStatusColor(result.status)
        )}>
          {result.status}
        </span>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <p className="text-gray-600 text-center mb-6">
          {result.message}
        </p>

        <div className="space-y-3">
          {result.pnr && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Booking Reference (PNR)</span>
              <span className="font-medium text-gray-900">{result.pnr}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-sm text-gray-900">{result.orderId}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Processed At</span>
            <span className="text-gray-900">{result.actionDate}</span>
          </div>

          {result.refundAmount !== undefined && result.currency && (
            <div className="flex justify-between items-center py-3 bg-primary/10 rounded-lg px-3 -mx-3">
              <span className="text-primary font-medium">Refund Amount</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(result.refundAmount, result.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex gap-3 w-full overflow-hidden">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700',
              'font-medium hover:bg-gray-50 transition-colors'
            )}
          >
            Close
          </button>
        )}
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className={cn(
              'flex-1 min-w-0 px-4 py-2.5 bg-primary text-white rounded-lg font-medium',
              'hover:bg-primary/90 transition-colors'
            )}
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

export default CancelResultCard;
