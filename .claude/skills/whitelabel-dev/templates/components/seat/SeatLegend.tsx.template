// @template SeatLegend
// @version 4.0.0 (synced from template)
// @description Template for seat/SeatLegend.tsx


import React from 'react';
import { SeatLegend as SeatLegendType, SeatType } from '@/types/seat';

// ============================================================
// Props
// ============================================================

interface SeatLegendProps {
  legend: SeatLegendType[];
  className?: string;
}

// ============================================================
// Color Mapping
// ============================================================

const TYPE_COLORS: Record<SeatType | 'occupied' | 'restricted' | 'selected', string> = {
  standard: 'bg-green-200 border-green-400',
  preferred: 'bg-blue-200 border-blue-400',
  extraLegroom: 'bg-purple-200 border-purple-400',
  exitRow: 'bg-orange-200 border-orange-400',
  occupied: 'bg-gray-300 border-gray-400',
  restricted: 'bg-gray-200 border-gray-300',
  selected: 'bg-primary border-primary',
};

// ============================================================
// Component
// ============================================================

export default function SeatLegend({ legend, className = '' }: SeatLegendProps) {
  if (!legend || legend.length === 0) {
    return null;
  }

  return (
    <div className={`seat-legend ${className}`}>
      <div className="flex flex-wrap gap-4 justify-center">
        {legend.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className={`
                w-6 h-6 rounded border-2
                ${TYPE_COLORS[item.type] || 'bg-gray-100 border-gray-300'}
              `}
            />
            <span className="text-sm text-muted">{item.label}</span>
          </div>
        ))}
        {/* Select legend Always Display */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 bg-primary border-primary" />
          <span className="text-sm text-muted">Select</span>
        </div>
      </div>
    </div>
  );
}
