// @template SeatMap
// @version 4.0.0 (synced from template)
// @description Template for seat/SeatMap.tsx


import React from 'react';
import { CabinInfo, Seat, SeatRow, SelectedSeat, SeatType } from '@/types/seat';

// ============================================================
// Props
// ============================================================

interface SeatMapProps {
  cabin: CabinInfo;
  selectedSeats: SelectedSeat[];
  currentPaxId: string;
  segmentId: string;
  onSeatSelect: (seat: Seat, rowNumber: number) => void;
}

// ============================================================
// Component
// ============================================================

export default function SeatMap({
  cabin,
  selectedSeats,
  currentPaxId,
  segmentId,
  onSeatSelect,
}: SeatMapProps) {
  // Seat Current Passengers에게 Select되었는 Confirm
  const isSelectedByCurrentPax = (seatNumber: string): boolean => {
    return selectedSeats.some(
      (s) =>
        s.seatNumber === seatNumber &&
        s.segmentId === segmentId &&
        s.paxId === currentPaxId
    );
  };

  // Seat Different Passengers에게 Select되었는 Confirm
  const isSelectedByOtherPax = (seatNumber: string): boolean => {
    return selectedSeats.some(
      (s) =>
        s.seatNumber === seatNumber &&
        s.segmentId === segmentId &&
        s.paxId !== currentPaxId
    );
  };

  // Seat Click Available Whether
  const canSelectSeat = (seat: Seat): boolean => {
    if (seat.availability !== 'available') return false;
    if (isSelectedByOtherPax(seat.seatNumber)) return false;
    return true;
  };

  return (
    <div className="seat-map">
      {/* cabin Header */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium text-muted bg-surface px-3 py-1 rounded">
          {cabin.cabinTypeLabel}
        </span>
      </div>

      {/* column Header */}
      <div className="flex justify-center mb-2">
        <div className="flex items-center gap-1">
          <div className="w-8" /> {/* 행Number space */}
          {cabin.columns.map((col, idx) => (
            <React.Fragment key={col.designation}>
              <div className="w-10 text-center text-sm font-medium text-muted">
                {col.designation}
              </div>
              {/* aisle Display */}
              {col.position === 'L' &&
                cabin.columns[idx + 1]?.position === 'C' && (
                  <div className="w-6" />
                )}
              {col.position === 'C' &&
                cabin.columns[idx + 1]?.position === 'R' && (
                  <div className="w-6" />
                )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Seat row */}
      <div className="space-y-1">
        {cabin.rows.map((row) => (
          <SeatRowComponent
            key={row.rowNumber}
            row={row}
            columns={cabin.columns}
            isSelectedByCurrentPax={isSelectedByCurrentPax}
            isSelectedByOtherPax={isSelectedByOtherPax}
            canSelectSeat={canSelectSeat}
            onSeatSelect={onSeatSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SeatRow Component
// ============================================================

interface SeatRowProps {
  row: SeatRow;
  columns: { designation: string; position: string }[];
  isSelectedByCurrentPax: (seatNumber: string) => boolean;
  isSelectedByOtherPax: (seatNumber: string) => boolean;
  canSelectSeat: (seat: Seat) => boolean;
  onSeatSelect: (seat: Seat, rowNumber: number) => void;
}

function SeatRowComponent({
  row,
  columns,
  isSelectedByCurrentPax,
  isSelectedByOtherPax,
  canSelectSeat,
  onSeatSelect,
}: SeatRowProps) {
  // column Criteriato Seat Mapping
  const seatMap = new Map(row.seats.map((s) => [s.column, s]));

  return (
    <div className="flex justify-center items-center gap-1">
      {/* row Number */}
      <div className="w-8 text-right text-sm font-medium text-muted pr-2">
        {row.rowNumber}
      </div>

      {/* Seats */}
      {columns.map((col, idx) => {
        const seat = seatMap.get(col.designation);

        return (
          <React.Fragment key={col.designation}>
            {seat ? (
              <SeatButton
                seat={seat}
                rowNumber={row.rowNumber}
                isSelectedByMe={isSelectedByCurrentPax(seat.seatNumber)}
                isSelectedByOther={isSelectedByOtherPax(seat.seatNumber)}
                canSelect={canSelectSeat(seat)}
                onClick={() => onSeatSelect(seat, row.rowNumber)}
              />
            ) : (
              <div className="w-10 h-10" /> // empty space
            )}

            {/* aisle Display */}
            {col.position === 'L' && columns[idx + 1]?.position === 'C' && (
              <div className="w-6 flex items-center justify-center">
                <div className="w-px h-8 bg-border" />
              </div>
            )}
            {col.position === 'C' && columns[idx + 1]?.position === 'R' && (
              <div className="w-6 flex items-center justify-center">
                <div className="w-px h-8 bg-border" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================
// SeatButton Component
// ============================================================

interface SeatButtonProps {
  seat: Seat;
  rowNumber: number;
  isSelectedByMe: boolean;
  isSelectedByOther: boolean;
  canSelect: boolean;
  onClick: () => void;
}

function SeatButton({
  seat,
  rowNumber: _rowNumber,
  isSelectedByMe,
  isSelectedByOther,
  canSelect,
  onClick,
}: SeatButtonProps) {
  // Seat absent Case
  if (seat.availability === 'noSeat') {
    return <div className="w-10 h-10" />;
  }

  // Style Determine
  const getStyles = () => {
    // in Select Seat
    if (isSelectedByMe) {
      return 'bg-primary text-white border-primary';
    }

    // Different Passengers Select Seat
    if (isSelectedByOther) {
      return 'bg-primary/30 text-primary border-primary/30 cursor-not-allowed';
    }

    // occupied/restricted Seat
    if (seat.availability === 'occupied' || seat.availability === 'restricted') {
      return 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed';
    }

    // per Type Style
    const typeStyles: Record<SeatType, string> = {
      standard: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
      preferred: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100',
      extraLegroom: 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100',
      exitRow: 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100',
    };

    return typeStyles[seat.seatType];
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canSelect}
      className={`
        w-10 h-10 rounded border text-xs font-medium
        flex items-center justify-center
        transition-colors
        ${getStyles()}
        ${canSelect ? 'cursor-pointer' : ''}
      `}
      title={`${seat.seatNumber} - ${seat.seatTypeLabel}${seat.price > 0 ? ` (${seat.price.toLocaleString()} ${seat.currency})` : ' (free)'}`}
    >
      {seat.column}
    </button>
  );
}
