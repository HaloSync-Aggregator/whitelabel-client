// @template FareRules
// @version 4.0.0 (synced from template)
// @description Template for booking/FareRules.tsx

/**
 * FareRules Component
 *
 * Fare rules (Change/Cancellation fee) Information Display
 * v3.8: pre/post-departure fee separation Display (PriceBreakdown and Same Structure)
 */

import React from 'react';
import { PenaltyInfo, FeeAmount } from '@/types/booking';
import { formatPrice } from '@/lib/utils';

interface FareRulesProps {
  penaltyInfo?: PenaltyInfo;
}

/**
 * Fee Range Formatting
 * min === max: Fixed Amount Display
 * min !== max: Range Display (Minimum ~ Maximum)
 */
function formatFeeRange(fee: FeeAmount | null): string {
  if (!fee) return 'No information';
  if (fee.min === 0 && fee.max === 0) return 'Free';
  if (fee.min === fee.max) {
    return formatPrice(fee.min, fee.currency);
  }
  return `${formatPrice(fee.min, fee.currency)} ~ ${formatPrice(fee.max, fee.currency)}`;
}

export default function FareRules({ penaltyInfo }: FareRulesProps) {
  if (!penaltyInfo) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Fare rules
      </h4>

      {/* Available/Not possible Badge Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Change</span>
          {penaltyInfo.canChange ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Not possible
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Refund</span>
          {penaltyInfo.canRefund ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Available
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Not possible
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {/* Change fee */}
        {penaltyInfo.changeFee && (
          <div>
            <div className="font-medium text-foreground mb-1">Change fee</div>
            <div className="space-y-1 pl-4">
              {penaltyInfo.changeFee.beforeDeparture && (
                <div className="flex justify-between text-muted">
                  <span>Before departure</span>
                  <span className="text-foreground">
                    {formatFeeRange(penaltyInfo.changeFee.beforeDeparture)}
                  </span>
                </div>
              )}
              {penaltyInfo.changeFee.afterDeparture && (
                <div className="flex justify-between text-muted">
                  <span>After departure</span>
                  <span className="text-foreground">
                    {formatFeeRange(penaltyInfo.changeFee.afterDeparture)}
                  </span>
                </div>
              )}
              {!penaltyInfo.changeFee.beforeDeparture && !penaltyInfo.changeFee.afterDeparture && (
                <div className="text-muted">
                  {penaltyInfo.canChange ? 'Free' : 'Change not possible'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel/Refund Fee */}
        {penaltyInfo.cancelFee && (
          <div>
            <div className="font-medium text-foreground mb-1">Cancellation fee</div>
            <div className="space-y-1 pl-4">
              {penaltyInfo.cancelFee.beforeDeparture && (
                <div className="flex justify-between text-muted">
                  <span>Before departure</span>
                  <span className="text-foreground">
                    {formatFeeRange(penaltyInfo.cancelFee.beforeDeparture)}
                  </span>
                </div>
              )}
              {penaltyInfo.cancelFee.afterDeparture && (
                <div className="flex justify-between text-muted">
                  <span>After departure</span>
                  <span className="text-foreground">
                    {formatFeeRange(penaltyInfo.cancelFee.afterDeparture)}
                  </span>
                </div>
              )}
              {!penaltyInfo.cancelFee.beforeDeparture && !penaltyInfo.cancelFee.afterDeparture && (
                <div className="text-muted">
                  {penaltyInfo.canRefund ? 'Free' : 'Non-refundable'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* changeFee, cancelFee Both absent Case Default Display */}
        {!penaltyInfo.changeFee && !penaltyInfo.cancelFee && (
          <div className="text-muted">
            Fee information not provided.
          </div>
        )}
      </div>
    </div>
  );
}
