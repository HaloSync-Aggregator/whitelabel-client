// @template ActionButtons
// @version 4.0.0 (synced from template)
// @description Template for booking/ActionButtons.tsx

/**
 * ActionButtons Component
 *
 * Action buttons: Payment, Cancellation, Change etc.
 */

import React from 'react';
import { ActionState } from '@/types/booking';

interface ActionButtonsProps {
  isTicketed?: boolean;
  isPaid?: boolean;
  actions: ActionState;
  orderId: string;
  owner: string;
  hasPendingSsr?: boolean;
  onPayment?: () => void;
  onCancel?: () => void;
  onVoidRefund?: () => void;
  onChangeJourney?: () => void;
  onChangeInfo?: () => void;
  onPurchaseService?: () => void;
}

export default function ActionButtons({
  actions,
  isTicketed,
  isPaid,
  owner,
  hasPendingSsr,
  onPayment,
  onCancel,
  onVoidRefund,
  onChangeJourney,
  onChangeInfo,
  onPurchaseService,
}: ActionButtonsProps) {
  const hasAnyAction =
    actions.canPay ||
    actions.canCancel ||
    actions.canVoidRefund ||
    actions.canChangeJourney ||
    actions.canChangeInfo ||
    actions.canPurchaseService;

  if (!hasAnyAction) {
    return null;
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Booking Management</h3>

      <div className="space-y-3">
        {/* Payment Button */}
        {actions.canPay && (
          <button
            onClick={onPayment}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay now
          </button>
        )}

        {/* Cancel Button */}
        {actions.canCancel && (
          <button
            onClick={onCancel}
            className="w-full py-3 border border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Booking cancellation
          </button>
        )}

        {/* Void/Refund Button */}
        {actions.canVoidRefund && (
          <button
            onClick={onVoidRefund}
            className="w-full py-3 border border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Refund Request
          </button>
        )}

        {/* Journey Change Button */}
        {actions.canChangeJourney && (
          <button
            onClick={onChangeJourney}
            className="w-full py-3 border border-border text-foreground rounded-lg font-medium hover:bg-background transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Itinerary Change
          </button>
        )}

        {/* Info Change Button */}
        {actions.canChangeInfo && (
          <button
            onClick={onChangeInfo}
            className="w-full py-3 border border-border text-foreground rounded-lg font-medium hover:bg-background transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Information change
          </button>
        )}

        {/* Purchase Service Button - when hasPendingSsr: Confirm button */}
        {actions.canPurchaseService && hasPendingSsr && (
          <button
            onClick={onPurchaseService}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Service purchase Confirmed
          </button>
        )}

        {/* Add Service Button - when no hasPendingSsr: Add button */}
        {actions.canPurchaseService && !hasPendingSsr && (isTicketed || (owner === 'TR' && isPaid)) && (
          <button
            onClick={onPurchaseService}
            className="w-full py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ancillary service Added
          </button>
        )}
      </div>
    </div>
  );
}
