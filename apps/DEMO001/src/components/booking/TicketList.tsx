// @template TicketList
// @version 4.0.0 (synced from template)
// @description Template for booking/TicketList.tsx

/**
 * TicketList Component
 *
 * Ticketing Ticket List Display
 */

import React from 'react';
import { TicketInfo } from '@/types/booking';

interface TicketListProps {
  tickets: TicketInfo[];
}

export default function TicketList({ tickets }: TicketListProps) {
  if (!tickets || tickets.length === 0) {
    return null;
  }

  const getTicketTypeIcon = (type: string) => {
    if (type === 'TICKET') {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    }
    // EMD-A or EMD-S
    return (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Ticket info</h3>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.ticketNumber}
            className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
          >
            <div className="flex items-center gap-4">
              {/* Ticket Type Icon */}
              <div className="flex-shrink-0">
                {getTicketTypeIcon(ticket.type)}
              </div>

              {/* Ticket Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted px-2 py-0.5 bg-gray-100 rounded">
                    {ticket.typeLabel}
                  </span>
                  <span className="font-mono text-lg font-bold text-foreground">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span>Passengers: {ticket.passengerName}</span>
                  {ticket.issuedDate && (
                    <span>Ticketing: {formatDate(ticket.issuedDate)}</span>
                  )}
                </div>
                {/* EMD Service Name */}
                {ticket.serviceName && (
                  <div className="mt-1 text-sm text-primary">
                    Service: {ticket.serviceName}
                  </div>
                )}
              </div>
            </div>

            {/* Total Fare (for tickets) */}
            {ticket.type === 'TICKET' && ticket.totalFare && (
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {ticket.totalFare.toLocaleString()}
                </div>
                <div className="text-xs text-muted">
                  {ticket.currency || 'KRW'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
