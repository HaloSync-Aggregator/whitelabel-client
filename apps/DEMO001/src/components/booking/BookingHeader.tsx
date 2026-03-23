// @template BookingHeader
// @version 4.0.0 (synced from template)
// @description Template for booking/BookingHeader.tsx

/**
 * BookingHeader Component
 *
 * Booking Detail Page Header: PNR, Airline, Status, Deadline Display
 */

import React from 'react';
import { BookingStatus } from '@/types/booking';
import { getStatusColor } from '@/lib/status-codes';

interface BookingHeaderProps {
  pnr: string;
  orderId: string;
  carrierCode: string;
  carrierName: string;
  status: BookingStatus;
  statusLabel: string;
  isTicketed: boolean;
  paymentTimeLimit?: string;
  ticketingTimeLimit?: string;
  createdAt?: string;
}

export default function BookingHeader({
  pnr,
  orderId,
  carrierCode,
  carrierName,
  status,
  statusLabel,
  isTicketed,
  paymentTimeLimit,
  ticketingTimeLimit,
  createdAt,
}: BookingHeaderProps) {
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const isExpiringSoon = (dateString?: string) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    const now = new Date();
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 24;
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-start justify-between">
        {/* Left: PNR & Carrier */}
        <div className="flex items-center gap-4">
          {/* Airline Logo */}
          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-lg">
            <span className="text-2xl font-bold text-gray-600">{carrierCode}</span>
          </div>

          {/* PNR & Carrier Name */}
          <div>
            <div className="text-sm text-muted mb-1">{carrierName}</div>
            <div className="text-3xl font-bold text-foreground tracking-wider">
              {pnr}
            </div>
            <div className="text-sm text-muted mt-1">Booking Reference (PNR)</div>
            {orderId && (
              <div className="text-xs text-muted mt-2">
                Order ID: <span className="font-mono">{orderId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status Badge */}
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {statusLabel}
          </span>

          {/* Time Limits */}
          <div className="mt-3 space-y-1">
            {createdAt && (
              <div className="text-sm text-muted">
                BookingDate/Time: {formatDateTime(createdAt)}
              </div>
            )}
            {!isTicketed && paymentTimeLimit && (
              <div className={`text-sm ${isExpiringSoon(paymentTimeLimit) ? 'text-error font-medium' : 'text-muted'}`}>
                Payment Deadline: {formatDateTime(paymentTimeLimit)}
                {isExpiringSoon(paymentTimeLimit) && (
                  <span className="ml-1 text-error">(!)</span>
                )}
              </div>
            )}
            {ticketingTimeLimit && (
              <div className={`text-sm ${isExpiringSoon(ticketingTimeLimit) ? 'text-error font-medium' : 'text-muted'}`}>
                Ticketing Deadline: {formatDateTime(ticketingTimeLimit)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
