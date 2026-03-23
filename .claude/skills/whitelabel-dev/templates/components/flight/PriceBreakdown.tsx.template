// @template PriceBreakdown
// @version 4.0.0 (synced from template)
// @description Template for flight/PriceBreakdown.tsx

/**
 * @file PriceBreakdown.tsx
 * @description OfferPrice result display modal (fare detail)
 *
 * Features:
 * - Total payment amount display
 * - Per-passenger fare breakdown (with tax details)
 * - Fare rules (baggage, seat selection, etc.)
 * - Change/cancellation fee information
 * - Payment deadline countdown
 */

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils';

export interface TaxDetail {
  code: string;
  name: string;
  amount: number;
}

export interface PassengerBreakdown {
  type: string;
  typeCode: string;
  count: number;
  baseFare: number;
  tax: number;
  subtotal: number;
  currency: string;
  taxDetails?: TaxDetail[];
}

export interface FareRule {
  journeyRef: string;
  priceClassName: string;
  priceClassCode: string;
  rules: {
    checkedBaggage?: string;
    cabinBaggage?: string;
    changeFee?: string;
    cancellationFee?: string;
    seatSelection?: string;
    [key: string]: string | undefined;
  };
}

export interface PenaltyInfo {
  canChange: boolean;
  canRefund: boolean;
  changeFee?: {
    beforeDeparture: { min: number; max: number; currency: string } | null;
    afterDeparture: { min: number; max: number; currency: string } | null;
  } | null;
  cancelFee?: {
    beforeDeparture: { min: number; max: number; currency: string } | null;
    afterDeparture: { min: number; max: number; currency: string } | null;
  } | null;
}

export interface BaggageAllowance {
  journeyRef: string;
  formatted: string;
}

export interface PriceBreakdownData {
  totalAmount: number;
  baseFare: number;
  totalTax: number;
  currency: string;
  formattedTotal: string;
  offerTimeLimit?: string;
  paymentTimeLimit?: string;
  passengerBreakdown: PassengerBreakdown[];
  fareRules: FareRule[];
  penaltyInfo: PenaltyInfo | null;
  baggageAllowance: BaggageAllowance[];
  _orderData: {
    transactionId: string;
    responseId: string;
    offerId: string;
    owner: string;
    paxList?: Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>;
    offerItems?: Array<{ offerItemId: string; paxRefId: string[] }>;
  };
}

export interface PriceBreakdownProps {
  data: PriceBreakdownData;
  open?: boolean;
  onClose: () => void;
  onProceed: () => void;
  loading?: boolean;
}

const PriceBreakdown = React.forwardRef<HTMLDivElement, PriceBreakdownProps>(
  ({ data, open = true, onClose, onProceed, loading }, ref) => {
    const formatTimeLimit = (isoString: string | undefined): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatFeeRange = (
      fee: { min: number; max: number; currency: string } | null
    ): string => {
      if (!fee) return 'Not applicable';
      if (fee.min === fee.max) {
        return formatPrice(fee.min, fee.currency);
      }
      return `${formatPrice(fee.min, fee.currency)} ~ ${formatPrice(fee.max, fee.currency)}`;
    };

    const getRemainingTime = (isoString: string | undefined): string => {
      if (!isoString) return '';
      const deadline = new Date(isoString);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff < 0) return 'Expired';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 1) return `${minutes}m remaining`;
      if (hours < 24) return `${hours}h ${minutes}m remaining`;

      const days = Math.floor(hours / 24);
      return `${days} day(s) remaining`;
    };

    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Price Detail"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div ref={ref} className="space-y-6">
          {/* Payment deadline warning */}
          {data.paymentTimeLimit && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-amber-700">
                    Payment Deadline
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    {formatTimeLimit(data.paymentTimeLimit)}
                    <span className="ml-2 font-medium text-amber-600">
                      ({getRemainingTime(data.paymentTimeLimit)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total price */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 text-sm text-gray-500">Total Payment Amount</div>
            <div className="mb-2 text-3xl font-bold text-primary">
              {formatPrice(data.totalAmount, data.currency)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Base fare: {formatPrice(data.baseFare, data.currency)}</span>
              <span>+</span>
              <span>Tax &amp; fees: {formatPrice(data.totalTax, data.currency)}</span>
            </div>
          </div>

          {/* Per-passenger breakdown */}
          <div>
            <h3 className="mb-3 text-base font-semibold text-gray-900">
              Per Passenger Fare
            </h3>
            <div className="space-y-3">
              {data.passengerBreakdown.map((pax, index) => (
                <div
                  key={`${pax.typeCode}-${index}`}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {pax.type}
                      </span>
                      <Badge variant="default">
                        {pax.count} pax
                      </Badge>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {formatPrice(pax.subtotal, pax.currency)}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Base fare (per person)</span>
                      <span>{formatPrice(pax.baseFare, pax.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax &amp; fees (per person)</span>
                      <span>{formatPrice(pax.tax, pax.currency)}</span>
                    </div>
                    {pax.taxDetails && pax.taxDetails.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-primary hover:underline">
                          View Tax Detail
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {pax.taxDetails.map((tax, taxIdx) => (
                            <div
                              key={`${tax.code}-${taxIdx}`}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {tax.name} ({tax.code})
                              </span>
                              <span>
                                {formatPrice(tax.amount, pax.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fare rules */}
          {data.fareRules && data.fareRules.length > 0 && (
            <div>
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Fare Rules
              </h3>
              <div className="space-y-3">
                {data.fareRules.map((rule, index) => (
                  <div
                    key={`${rule.journeyRef}-${rule.priceClassCode}-${index}`}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-medium text-gray-900">
                        {rule.priceClassName}
                      </div>
                      {rule.priceClassCode && (
                        <Badge variant="default">
                          {rule.priceClassCode}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      {rule.rules.checkedBaggage && (
                        <div className="flex items-start gap-2">
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9.5 18H8V9h1.5v9zm3.25 0h-1.5V9h1.5v9zm.75-12h-3V3.5h3V6zM16 18h-1.5V9H16v9z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Checked baggage:</span>
                            <span className="ml-1 text-gray-900">
                              {rule.rules.checkedBaggage}
                            </span>
                          </div>
                        </div>
                      )}
                      {rule.rules.cabinBaggage && (
                        <div className="flex items-start gap-2">
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 3.5h4V6h-4V3.5zM17 19H7V8h10v11z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Cabin baggage:</span>
                            <span className="ml-1 text-gray-900">
                              {rule.rules.cabinBaggage}
                            </span>
                          </div>
                        </div>
                      )}
                      {rule.rules.seatSelection && (
                        <div className="flex items-start gap-2">
                          <svg
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M4 18v3h3v-3h10v3h3v-6H4zm15-8h3v3h-3zM2 10h3v3H2zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z" />
                          </svg>
                          <div>
                            <span className="text-gray-500">Seat selection:</span>
                            <span className="ml-1 text-gray-900">
                              {rule.rules.seatSelection}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Penalty info */}
          {data.penaltyInfo && (
            <div>
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Change &amp; Cancellation Fee
              </h3>
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Change</span>
                    {data.penaltyInfo.canChange ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="error">Not available</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Refund</span>
                    {data.penaltyInfo.canRefund ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="error">Not available</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {data.penaltyInfo.changeFee && (
                    <div>
                      <div className="mb-1 font-medium text-gray-900">
                        Change fee
                      </div>
                      <div className="space-y-1 pl-4">
                        {data.penaltyInfo.changeFee.beforeDeparture && (
                          <div className="flex justify-between text-gray-500">
                            <span>Before departure</span>
                            <span>
                              {formatFeeRange(data.penaltyInfo.changeFee.beforeDeparture)}
                            </span>
                          </div>
                        )}
                        {data.penaltyInfo.changeFee.afterDeparture && (
                          <div className="flex justify-between text-gray-500">
                            <span>After departure</span>
                            <span>
                              {formatFeeRange(data.penaltyInfo.changeFee.afterDeparture)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {data.penaltyInfo.cancelFee && (
                    <div>
                      <div className="mb-1 font-medium text-gray-900">
                        Cancellation fee
                      </div>
                      <div className="space-y-1 pl-4">
                        {data.penaltyInfo.cancelFee.beforeDeparture && (
                          <div className="flex justify-between text-gray-500">
                            <span>Before departure</span>
                            <span>
                              {formatFeeRange(data.penaltyInfo.cancelFee.beforeDeparture)}
                            </span>
                          </div>
                        )}
                        {data.penaltyInfo.cancelFee.afterDeparture && (
                          <div className="flex justify-between text-gray-500">
                            <span>After departure</span>
                            <span>
                              {formatFeeRange(data.penaltyInfo.cancelFee.afterDeparture)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Baggage allowance */}
          {data.baggageAllowance && data.baggageAllowance.length > 0 && (
            <div>
              <h3 className="mb-3 text-base font-semibold text-gray-900">
                Baggage Allowance
              </h3>
              <div className="space-y-2">
                {data.baggageAllowance.map((bag, index) => (
                  <div
                    key={`bag-${index}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"
                  >
                    <span className="text-gray-500">
                      {/^[A-Z]{3}/.test(bag.journeyRef) ? bag.journeyRef : `Segment ${index + 1}`}
                    </span>
                    <span className="font-medium text-gray-900">
                      {bag.formatted}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 w-full overflow-hidden">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 min-w-0"
            >
              Cancel
            </Button>
            <Button
              onClick={onProceed}
              disabled={loading}
              loading={loading}
              className="flex-1 min-w-0"
            >
              {loading ? 'Processing...' : 'Proceed to Booking'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

PriceBreakdown.displayName = 'PriceBreakdown';

export default PriceBreakdown;
export { PriceBreakdown };
