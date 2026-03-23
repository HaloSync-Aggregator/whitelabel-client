// @template SsrInfo
// @version 4.0.0 (synced from template)
// @description Template for booking/SsrInfo.tsx

/**
 * SsrInfo Component
 *
 * SSR (Special Service Request) List and Status Display
 * v3.9: OrderItem -> Pax -> Segment hierarchy Display
 */

import React, { useState } from 'react';
import { SsrItem, ServiceOrderItemGroup } from '@/types/booking';
import { formatPrice } from '@/lib/utils';

interface SsrInfoProps {
  ssrList?: SsrItem[];
  serviceGroups?: ServiceOrderItemGroup[];
  hasPendingSsr: boolean;
  onPurchaseConfirm?: () => void;
}

// Status Badge Color
function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'HK': return 'bg-green-100 text-green-800';
    case 'HD': return 'bg-yellow-100 text-yellow-800';
    case 'HI': return 'bg-blue-100 text-blue-800';
    case 'HN': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Service type icon
function ServiceTypeIcon({ type }: { type?: string }) {
  switch (type) {
    case 'SEAT':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18v3h3v-3h10v3h3v-6H4zm15-8h3v3h-3zM2 10h3v3H2zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z" />
        </svg>
      );
    case 'BAGGAGE':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'MEAL':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export default function SsrInfo({
  ssrList,
  serviceGroups,
  hasPendingSsr,
  onPurchaseConfirm,
}: SsrInfoProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // serviceGroups if exists use hierarchy structure, otherwise use flat ssrList
  const hasGroupedData = serviceGroups && serviceGroups.length > 0;
  const hasFlatData = ssrList && ssrList.length > 0;

  if (!hasGroupedData && !hasFlatData) {
    return null;
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Ancillary service (SSR)
        </h3>
        {hasPendingSsr && onPurchaseConfirm && (
          <button
            onClick={onPurchaseConfirm}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Purchase Confirmed
          </button>
        )}
      </div>

      {/* v3.9: Hierarchy Structure Display (OrderItem -> Pax -> Segment) */}
      {hasGroupedData && (
        <div className="space-y-4">
          {serviceGroups.map((group, groupIdx) => {
            const groupId = group.orderItemId || `group-${groupIdx}`;
            const isExpanded = expandedGroups.has(groupId) || serviceGroups.length === 1;

            return (
              <div
                key={groupId}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* OrderItem Header */}
                <div
                  className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(groupId)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-foreground">
                      Service #{groupIdx + 1}
                    </span>
                    {group.statusCode && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(group.statusCode)}`}>
                        {group.statusLabel}
                      </span>
                    )}
                  </div>
                  {group.totalPrice && group.totalPrice.amount > 0 && (
                    <span className="text-sm font-semibold text-primary">
                      {formatPrice(group.totalPrice.amount, group.totalPrice.currency)}
                    </span>
                  )}
                </div>

                {/* per Passengers section Information */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {group.passengers.map((pax, paxIdx) => (
                      <div key={pax.paxId || `pax-${paxIdx}`} className="space-y-3">
                        {/* Passenger information */}
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-foreground">{pax.paxName}</span>
                          <span className="text-muted">({pax.ptcLabel})</span>
                        </div>

                        {/* per Segment Service */}
                        {pax.segments.map((seg, segIdx) => (
                          <div
                            key={seg.segmentId || `seg-${segIdx}`}
                            className="ml-6 border-l-2 border-border pl-4 space-y-2"
                          >
                            {/* Segment Label */}
                            <div className="flex items-center gap-2 text-xs text-muted">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                              <span>{seg.segmentLabel}</span>
                              {seg.flightNumber && (
                                <span className="text-muted-foreground">({seg.flightNumber})</span>
                              )}
                            </div>

                            {/* Service list */}
                            <div className="space-y-2">
                              {seg.services.map((service, serviceIdx) => (
                                <div
                                  key={service.serviceId || `service-${serviceIdx}`}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-muted">
                                      <ServiceTypeIcon type={service.serviceType} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">
                                          {service.serviceName}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(service.status)}`}>
                                          {service.statusLabel}
                                        </span>
                                      </div>
                                      {service.description && (
                                        <p className="text-xs text-muted mt-1">{service.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  {service.price && service.price.amount > 0 && (
                                    <span className="text-sm text-foreground">
                                      {formatPrice(service.price.amount, service.price.currency)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Existing flat Structure (serviceGroups absent fallback) */}
      {!hasGroupedData && hasFlatData && (
        <div className="space-y-3">
          {ssrList.map((ssr, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-medium text-foreground">
                    {ssr.ssrName}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(ssr.status)}`}>
                    {ssr.statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>Passengers: {ssr.paxName}</span>
                  {ssr.segment && <span>Segment: {ssr.segment}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Message */}
      {hasPendingSsr && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Service confirmation pending. Please proceed with Purchase Confirmed.</span>
          </div>
        </div>
      )}
    </div>
  );
}
