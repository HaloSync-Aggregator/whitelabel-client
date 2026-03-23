// @template SeatSelector
// @version 4.0.0 (synced from template)
// @description Template for seat/SeatSelector.tsx


import React, { useState, useMemo, useCallback } from 'react';
import SeatMap from './SeatMap';
import SeatLegend from './SeatLegend';
import {
  SeatAvailabilityData,
  Seat,
  SelectedSeat,
  needsRequote,
  needsConfirmation,
} from '@/types/seat';

// ============================================================
// Props
// ============================================================

export interface Passenger {
  paxId: string;
  name: string;
  type: 'ADT' | 'CHD' | 'INF';
  typeLabel: string;
}

interface SeatSelectorProps {
  seatData: SeatAvailabilityData;
  passengers: Passenger[];
  onConfirm: (selectedSeats: SelectedSeat[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// ============================================================
// Component
// ============================================================

export default function SeatSelector({
  seatData,
  passengers,
  onConfirm,
  onClose,
  isLoading = false,
}: SeatSelectorProps) {
  // Current Select Segment
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  // Current Select Passengers
  const [activePaxIndex, setActivePaxIndex] = useState(0);
  // Select Seat List
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);

  const activeSegment = seatData.segments[activeSegmentIndex];
  const activePax = passengers[activePaxIndex];
  const carrierCode = activeSegment?.carrierCode || seatData.owner;

  // ============================================================
  // Seat Selection Process
  // ============================================================

  const handleSeatSelect = useCallback(
    (seat: Seat, _rowNumber: number) => {
      if (!activePax || !activeSegment) return;

      const existingSeatIndex = selectedSeats.findIndex(
        (s) => s.paxId === activePax.paxId && s.segmentId === activeSegment.segmentId
      );

      // Same Seat again Click → Deselect
      if (existingSeatIndex >= 0 && selectedSeats[existingSeatIndex].seatNumber === seat.seatNumber) {
        setSelectedSeats((prev) => prev.filter((_, i) => i !== existingSeatIndex));
        return;
      }

      const newSeat: SelectedSeat = {
        paxId: activePax.paxId,
        passengerName: activePax.name,
        passengerType: activePax.type,
        segmentId: activeSegment.segmentId,
        segmentNo: activeSegment.segmentNo,
        flightNumber: activeSegment.flightNumber,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        seatTypeLabel: seat.seatTypeLabel,
        price: seat.price,
        currency: seat.currency,
        offerItemId: seat.offerItemRefId || '',
      };

      if (existingSeatIndex >= 0) {
        // Existing Seat Replace
        setSelectedSeats((prev) => {
          const updated = [...prev];
          updated[existingSeatIndex] = newSeat;
          return updated;
        });
      } else {
        // new Seat Added
        setSelectedSeats((prev) => [...prev, newSeat]);
      }

      // Next Passengersto Auto navigate (Same Segment infrom)
      const nextPaxIndex = activePaxIndex + 1;
      if (nextPaxIndex < passengers.length) {
        setActivePaxIndex(nextPaxIndex);
      }
    },
    [activePax, activeSegment, selectedSeats, activePaxIndex, passengers.length]
  );

  // ============================================================
  // Price Calculate
  // ============================================================

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

  const currency = selectedSeats[0]?.currency || 'KRW';

  // ============================================================
  // Select Complete Whether
  // ============================================================

  const isAllSelected = useMemo(() => {
    // All Passenger x All in Segment About Seat Selection되었는 Confirm
    for (const pax of passengers) {
      for (const segment of seatData.segments) {
        const hasSeat = selectedSeats.some(
          (s) => s.paxId === pax.paxId && s.segmentId === segment.segmentId
        );
        if (!hasSeat) return false;
      }
    }
    return true;
  }, [passengers, seatData.segments, selectedSeats]);

  // ============================================================
  // Confirm Process
  // ============================================================

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      alert('Seat Select.');
      return;
    }

    // per Airline Re-Calculate Whether needed Guide
    const requoteInfo = needsRequote(carrierCode);
    if (requoteInfo.needed) {
      console.log(`[SeatSelector] ${carrierCode} requires ${requoteInfo.api} for price verification`);
    }

    // Purchase Confirmed Whether needed Guide
    if (needsConfirmation(carrierCode)) {
      console.log(`[SeatSelector] ${carrierCode} requires confirmation after OrderChange`);
    }

    onConfirm(selectedSeats);
  };

  // ============================================================
  // Current Segment/Passengers's Select Seat
  // ============================================================

  const currentSelectedSeats = useMemo(() => {
    return selectedSeats.filter((s) => s.segmentId === activeSegment?.segmentId);
  }, [selectedSeats, activeSegment?.segmentId]);

  // ============================================================
  // Render
  // ============================================================

  if (!activeSegment) {
    return (
      <div className="p-4 text-center text-muted">
        Seat Failed to load information .
      </div>
    );
  }

  return (
    <div className="seat-selector fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Seat Selection</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Segment Tab */}
        {seatData.segments.length > 1 && (
          <div className="flex border-b border-border">
            {seatData.segments.map((segment, idx) => (
              <button
                key={segment.segmentId}
                onClick={() => {
                  setActiveSegmentIndex(idx);
                  setActivePaxIndex(0);
                }}
                className={`
                  flex-1 py-3 px-4 text-sm font-medium transition-colors
                  ${activeSegmentIndex === idx
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted hover:text-foreground'
                  }
                `}
              >
                <div>{segment.departureAirport} → {segment.arrivalAirport}</div>
                <div className="text-xs mt-0.5">{segment.flightNumber}</div>
              </button>
            ))}
          </div>
        )}

        {/* Passenger Select */}
        <div className="p-4 border-b border-border">
          <div className="text-sm text-muted mb-2">Passenger Select</div>
          <div className="flex gap-2 flex-wrap">
            {passengers.map((pax, idx) => {
              const hasSeatForSegment = selectedSeats.some(
                (s) => s.paxId === pax.paxId && s.segmentId === activeSegment.segmentId
              );
              const selectedSeat = selectedSeats.find(
                (s) => s.paxId === pax.paxId && s.segmentId === activeSegment.segmentId
              );

              return (
                <button
                  key={pax.paxId}
                  onClick={() => setActivePaxIndex(idx)}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${activePaxIndex === idx
                      ? 'bg-primary text-white'
                      : hasSeatForSegment
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-surface text-foreground border border-border'
                    }
                  `}
                >
                  <div className="font-medium">{pax.name}</div>
                  <div className="text-xs opacity-80">
                    {selectedSeat ? selectedSeat.seatNumber : pax.typeLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seat map */}
        <div className="flex-1 overflow-auto p-4">
          {activeSegment.cabins.map((cabin, cabinIdx) => (
            <div key={cabinIdx} className="mb-6">
              <SeatMap
                cabin={cabin}
                selectedSeats={currentSelectedSeats}
                currentPaxId={activePax.paxId}
                segmentId={activeSegment.segmentId}
                onSeatSelect={handleSeatSelect}
              />
            </div>
          ))}
        </div>

        {/* legend */}
        <div className="p-4 border-t border-border bg-surface">
          <SeatLegend legend={seatData.legend} />
        </div>

        {/* Select Seat Summary */}
        {selectedSeats.length > 0 && (
          <div className="p-4 border-t border-border bg-surface">
            <div className="text-sm font-medium mb-2">Select Seat</div>
            <div className="space-y-1 max-h-32 overflow-auto">
              {selectedSeats.map((seat, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted">
                    {seat.passengerName} · {seat.flightNumber}
                  </span>
                  <span className="font-medium">
                    {seat.seatNumber}
                    {seat.price > 0 && (
                      <span className="text-primary ml-2">
                        +{seat.price.toLocaleString()} {seat.currency}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Button */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-muted">Total Seat Fee</span>
              <div className="text-xl font-bold text-primary">
                {totalPrice.toLocaleString()} {currency}
              </div>
            </div>
            <div className="text-sm text-muted">
              {selectedSeats.length} / {passengers.length * seatData.segments.length} Seat
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancellation
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || selectedSeats.length === 0}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                ${selectedSeats.length > 0
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? 'Processing...' : isAllSelected ? 'Select Complete' : 'Select Seatto Progress'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
