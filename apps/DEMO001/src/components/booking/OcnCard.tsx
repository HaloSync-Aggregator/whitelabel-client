// @template OcnCard
// @version 4.0.0 (synced from template)
// @description Template for booking/OcnCard.tsx

/**
 * OcnCard Component
 *
 * OCN (Order Change Notice) history Display - AF/KL Airline Dedicated
 */

import React from 'react';
import { OcnItem } from '@/types/booking';

interface OcnCardProps {
  ocnList: OcnItem[];
  showOcnAgreeButton: boolean;
  onAgree?: () => void;
}

export default function OcnCard({
  ocnList,
  showOcnAgreeButton,
  onAgree,
}: OcnCardProps) {
  if (!ocnList || ocnList.length === 0) {
    return null;
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const map: Record<string, string> = {
      CANCEL: 'Cancellation',
      MODIFY: 'Change',
      SCHEDULE_CHANGE: 'Schedule Change',
    };
    return map[actionType] || actionType;
  };

  const getActionTypeBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'CANCEL':
        return 'bg-red-100 text-red-800';
      case 'MODIFY':
        return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULE_CHANGE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Change notification (OCN)
        </h3>
        {showOcnAgreeButton && onAgree && (
          <button
            onClick={onAgree}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Change Agree
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted">Type</th>
              <th className="text-left py-2 px-3 font-medium text-muted">Context</th>
              <th className="text-left py-2 px-3 font-medium text-muted">Description</th>
              <th className="text-left py-2 px-3 font-medium text-muted">Received Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {ocnList.map((ocn, idx) => (
              <tr key={idx} className="border-b border-border last:border-0">
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeBadgeColor(ocn.actionType)}`}>
                    {getActionTypeLabel(ocn.actionType)}
                  </span>
                </td>
                <td className="py-3 px-3 text-foreground">{ocn.context}</td>
                <td className="py-3 px-3 text-foreground">{ocn.description || '-'}</td>
                <td className="py-3 px-3 text-muted">{formatDateTime(ocn.receivedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
