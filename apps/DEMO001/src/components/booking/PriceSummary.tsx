// @template PriceSummary
// @version 4.0.0 (synced from template)
// @description Template for booking/PriceSummary.tsx

/**
 * @file PriceSummary.tsx
 * @description Fare Summary Component - per Passengers Price details and Total Payment amount Display
 * @version 2.0.0
 *
 * ============================================================
 * Key/Main Feature
 * ============================================================
 * - per Passengers Price details (Base Fare, Tax, Subtotal)
 * - Total Payment amount
 * - Added Service Amount (Seat, Ancillary service)
 * ============================================================
 *
 * two types Mode Support:
 * 1. PriceInfo based (Booking Detail Page)
 * 2. PaymentInfo[] based (Booking Input Page)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { PriceInfo, PaymentInfo } from '@/types/booking';

// ============================================================
// Props
// ============================================================

interface PriceSummaryBaseProps {
  /** Added Service Fee (Seat, Ancillary service) */
  extraCharges?: Array<{
    label: string;
    amount: number;
    count?: number;
  }>;
  /** Added class */
  className?: string;
}

interface PriceSummaryPriceInfoProps extends PriceSummaryBaseProps {
  /** PriceInfo Object (Booking Detail Page) */
  price: PriceInfo;
  paymentInfo?: never;
  totalBaseFare?: never;
  totalTaxes?: never;
  grandTotal?: never;
  currency?: never;
}

interface PriceSummaryPaymentInfoProps extends PriceSummaryBaseProps {
  /** PaymentInfo Array (Booking Input Page) */
  paymentInfo: PaymentInfo[];
  /** Total Base Fare */
  totalBaseFare: number;
  /** Total Tax */
  totalTaxes: number;
  /** Total Payment amount */
  grandTotal: number;
  /** Currency code */
  currency?: string;
  price?: never;
}

export type PriceSummaryProps = PriceSummaryPriceInfoProps | PriceSummaryPaymentInfoProps;

// ============================================================
// Helpers
// ============================================================

const formatPrice = (amount: number, currency: string = 'KRW'): string => {
  return `${amount.toLocaleString('ko-KR')} ${currency}`;
};

// ============================================================
// Component
// ============================================================

export default function PriceSummary(props: PriceSummaryProps) {
  const { extraCharges, className } = props;

  // Mode 1: PriceInfo based
  if ('price' in props && props.price) {
    const { price } = props;

    return (
      <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fare Information</h3>

        {/* Passenger Breakdown */}
        <div className="space-y-3 mb-4">
          {price.passengerBreakdown.map((breakdown, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {breakdown.ptcLabel} x {breakdown.count}
              </span>
              <span className="text-gray-900">
                {formatPrice(breakdown.subtotal * breakdown.count, price.currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Extra Charges */}
        {extraCharges && extraCharges.length > 0 && (
          <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
            {extraCharges.map((charge, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {charge.label}
                  {charge.count && charge.count > 1 && ` (${charge.count} items)`}
                </span>
                <span className="text-gray-900">{formatPrice(charge.amount, price.currency)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Fare Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Base fare</span>
            <span className="text-gray-900">
              {formatPrice(price.baseFare, price.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Tax and Fuel Surcharge</span>
            <span className="text-gray-900">
              {formatPrice(price.taxes, price.currency)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total Amount</span>
          <span className="text-xl font-bold text-primary">
            {price.formattedTotal}
          </span>
        </div>
      </div>
    );
  }

  // Mode 2: PaymentInfo[] based
  const { paymentInfo, totalBaseFare, totalTaxes, grandTotal, currency = 'KRW' } = props as PriceSummaryPaymentInfoProps;

  if (!paymentInfo || paymentInfo.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-6', className)}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Price details
      </h2>

      {/* per Passengers Fee */}
      <div className="space-y-3 mb-4">
        {paymentInfo.map((payment, index) => (
          <div
            key={payment.paxId}
            className={cn(
              'pb-3',
              index < paymentInfo.length - 1 && 'border-b border-gray-100'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">
                {payment.ptcLabel}
              </span>
              <span className="text-sm text-gray-500">
                {payment.paxId}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Base Fare</span>
                <span>{formatPrice(payment.baseFare, currency)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Taxes/Fees</span>
                <span>{formatPrice(payment.taxes, currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
                <span>Subtotal</span>
                <span>{formatPrice(payment.totalFare, currency)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Added Service Fee */}
      {extraCharges && extraCharges.length > 0 && (
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
          {extraCharges.map((charge, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-500">
                {charge.label}
                {charge.count && charge.count > 1 && ` (${charge.count} items)`}
              </span>
              <span className="text-gray-900">{formatPrice(charge.amount, currency)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total Summary */}
      <div className="border-t-2 border-gray-300 pt-4 space-y-2">
        <div className="flex justify-between text-base text-gray-500">
          <span>Total Base Fare</span>
          <span>{formatPrice(totalBaseFare, currency)}</span>
        </div>
        <div className="flex justify-between text-base text-gray-500">
          <span>Total Taxes/Fees</span>
          <span>{formatPrice(totalTaxes, currency)}</span>
        </div>
        {extraCharges && extraCharges.length > 0 && (
          <div className="flex justify-between text-base text-gray-500">
            <span>Added Service</span>
            <span>
              {formatPrice(
                extraCharges.reduce((sum, c) => sum + c.amount, 0),
                currency
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold text-primary pt-2 border-t border-gray-300">
          <span>Total Payment amount</span>
          <span>{formatPrice(grandTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export { PriceSummary };
