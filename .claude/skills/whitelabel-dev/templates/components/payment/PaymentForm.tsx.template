// @template PaymentForm
// @version 4.0.0 (synced from template)
// @description Template for payment/PaymentForm.tsx


/**
 * @component PaymentForm
 * @description Payment Information Input Form
 *
 * Per Airline Payment method:
 * - Card: All Airlines (TR excluded)
 * - Cash: All Airlines (TR excluded)
 * - AGT: TR dedicated
 * - Voucher: AF/KL
 */

import React, { useState, useEffect } from 'react';
import {
  type PaymentMethodType,
  type CardPayment,
  getAvailablePaymentMethods,
} from '@/types/payment';

interface PaymentFormProps {
  carrierCode: string;
  amount: {
    amount: number;
    currency: string;
  };
  onSubmit: (data: PaymentFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface PaymentFormData {
  paymentMethod: PaymentMethodType;
  card?: CardPayment;
  agentDeposit?: {
    agentDepositId?: string;
  };
  voucher?: {
    voucherId: string;
    voucherAmount: number;
  };
}

const CARD_BRANDS = [
  { code: 'VI', name: 'Visa' },
  { code: 'MC', name: 'MasterCard' },
  { code: 'AX', name: 'American Express' },
  { code: 'JC', name: 'JCB' },
];

export function PaymentForm({
  carrierCode,
  amount,
  onSubmit,
  isLoading = false,
}: PaymentFormProps) {
  const availableMethods = getAvailablePaymentMethods(carrierCode);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(availableMethods[0]);
  const [error, setError] = useState<string | null>(null);

  // Card form state
  const [cardCode, setCardCode] = useState('VI');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expiration, setExpiration] = useState('');
  const [seriesCode, setSeriesCode] = useState('');

  // AGT form state
  const [agentDepositId, setAgentDepositId] = useState('');

  // Voucher form state
  const [voucherId, setVoucherId] = useState('');
  const [voucherAmount, setVoucherAmount] = useState(0);

  // Reset form when method changes
  useEffect(() => {
    setError(null);
  }, [selectedMethod]);

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiration = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const formData: PaymentFormData = {
        paymentMethod: selectedMethod,
      };

      if (selectedMethod === 'card') {
        // Validate card fields
        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
          throw new Error('Please enter a valid card number.');
        }
        if (!cardHolderName.trim()) {
          throw new Error('Please enter the cardholder name.');
        }
        const cleanExpiration = expiration.replace('/', '');
        if (cleanExpiration.length !== 4) {
          throw new Error('Please enter expiration in MM/YY format.');
        }

        formData.card = {
          cardCode,
          cardNumber: cleanCardNumber,
          cardHolderName: cardHolderName.toUpperCase(),
          expiration: cleanExpiration,
          seriesCode: seriesCode || undefined,
        };
      } else if (selectedMethod === 'agt') {
        formData.agentDeposit = {
          agentDepositId: agentDepositId || undefined,
        };
      } else if (selectedMethod === 'voucher' || selectedMethod === 'voucher_cash') {
        if (!voucherId.trim()) {
          throw new Error('Please enter the Voucher ID.');
        }
        if (voucherAmount <= 0) {
          throw new Error('Please enter the voucher amount.');
        }
        if (selectedMethod === 'voucher' && voucherAmount < amount.amount) {
          throw new Error('Voucher amount is less than payment amount. Please select "Voucher+Cash".');
        }

        formData.voucher = {
          voucherId: voucherId.trim(),
          voucherAmount,
        };
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing payment.');
    }
  };

  const getMethodLabel = (method: PaymentMethodType) => {
    switch (method) {
      case 'card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'agt': return 'Agent Deposit';
      case 'voucher': return 'Voucher';
      case 'voucher_cash': return 'Voucher+Cash';
      default: return method;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-muted">Payment amount</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(amount.amount, amount.currency)}
          </span>
        </div>
      </div>

      {/* Payment Method Tabs */}
      {availableMethods.length > 1 && (
        <div className="flex border-b border-border">
          {availableMethods.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedMethod(method)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                selectedMethod === method
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {getMethodLabel(method)}
            </button>
          ))}
        </div>
      )}

      {/* Card Form */}
      {selectedMethod === 'card' && (
        <div className="space-y-4">
          {/* Card Brand */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Card Type
            </label>
            <div className="flex gap-2">
              {CARD_BRANDS.map((brand) => (
                <button
                  key={brand.code}
                  type="button"
                  onClick={() => setCardCode(brand.code)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    cardCode === brand.code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:border-primary/50'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-foreground mb-2">
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              value={formatCardNumber(cardNumber)}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0000 0000 0000 0000"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={19}
              required
            />
          </div>

          {/* Card Holder Name */}
          <div>
            <label htmlFor="cardHolderName" className="block text-sm font-medium text-foreground mb-2">
              Cardholder Name (English)
            </label>
            <input
              type="text"
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
              placeholder="HONG GILDONG"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
              required
            />
          </div>

          {/* Expiration & CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiration" className="block text-sm font-medium text-foreground mb-2">
                Expiration
              </label>
              <input
                type="text"
                id="expiration"
                value={formatExpiration(expiration)}
                onChange={(e) => setExpiration(e.target.value.replace(/\D/g, ''))}
                placeholder="MM/YY"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label htmlFor="seriesCode" className="block text-sm font-medium text-foreground mb-2">
                CVV/CVC
              </label>
              <input
                type="password"
                id="seriesCode"
                value={seriesCode}
                onChange={(e) => setSeriesCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="***"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                maxLength={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cash Form */}
      {selectedMethod === 'cash' && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted">
            You selected Cash payment. Ticketing will proceed after payment is confirmed.
          </p>
        </div>
      )}

      {/* AGT Form */}
      {selectedMethod === 'agt' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="agentDepositId" className="block text-sm font-medium text-foreground mb-2">
              Agent Deposit ID (Optional)
            </label>
            <input
              type="text"
              id="agentDepositId"
              value={agentDepositId}
              onChange={(e) => setAgentDepositId(e.target.value)}
              placeholder="Leave blank to use default deposit"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <p className="text-sm text-muted">
            * Agent Deposit payment is only available for Scoot (TR) airline.
          </p>
        </div>
      )}

      {/* Voucher Form */}
      {(selectedMethod === 'voucher' || selectedMethod === 'voucher_cash') && (
        <div className="space-y-4">
          <div>
            <label htmlFor="voucherId" className="block text-sm font-medium text-foreground mb-2">
              Voucher ID
            </label>
            <input
              type="text"
              id="voucherId"
              value={voucherId}
              onChange={(e) => setVoucherId(e.target.value)}
              placeholder="Enter Voucher ID"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          <div>
            <label htmlFor="voucherAmount" className="block text-sm font-medium text-foreground mb-2">
              Voucher Amount ({amount.currency})
            </label>
            <input
              type="number"
              id="voucherAmount"
              value={voucherAmount || ''}
              onChange={(e) => setVoucherAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              min={0}
              max={selectedMethod === 'voucher' ? undefined : amount.amount}
              required
            />
          </div>

          {selectedMethod === 'voucher_cash' && voucherAmount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Voucher: {formatPrice(voucherAmount, amount.currency)} + Cash: {formatPrice(Math.max(0, amount.amount - voucherAmount), amount.currency)}
              </p>
            </div>
          )}

          <p className="text-sm text-muted">
            * Only Air France/KLM issued vouchers are accepted.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
            Payment Processing...
          </>
        ) : (
          <>
            Pay Now
            <span className="ml-1">({formatPrice(amount.amount, amount.currency)})</span>
          </>
        )}
      </button>
    </form>
  );
}

export default PaymentForm;
