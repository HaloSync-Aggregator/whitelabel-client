// @template ItinerarySelector
// @version 4.0.0 (synced from template)
// @description Template for booking/journey-change/ItinerarySelector.tsx

// Template v1.2.0 - Journey Change ItinerarySelector

/**
 * ItinerarySelector Component
 *
 * PaxJourney-based journey selection for Journey Change.
 * Each card represents one PaxJourney (may contain multiple segments for connecting flights).
 * Selection is by paxJourneyId.
 *
 * v3.24: Changed from segment-based to PaxJourney-based selection.
 * v3.25: Added per-journey search criteria inputs (origin/destination/date).
 */

import { type CurrentItinerary } from '@/types/journey-change';

/** Per-journey search criteria */
export interface JourneyCriteria {
  origin: string;
  destination: string;
  departureDate: string;
}

interface ItinerarySelectorProps {
  itineraries: CurrentItinerary[];
  /** Selected PaxJourney IDs */
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  /** Per-journey search criteria (keyed by paxJourneyId) */
  criteriaMap: Record<string, JourneyCriteria>;
  onCriteriaChange: (criteriaMap: Record<string, JourneyCriteria>) => void;
}

function formatFlightTime(duration?: string): string {
  if (!duration) return '';
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (match) {
    return `${match[1]}h ${match[2] || '0'}m`;
  }
  return duration;
}

export default function ItinerarySelector({
  itineraries,
  selectedIds,
  onSelectionChange,
  criteriaMap,
  onCriteriaChange,
}: ItinerarySelectorProps) {
  const handleToggle = (paxJourneyId: string) => {
    if (selectedIds.includes(paxJourneyId)) {
      // Deselect: remove from selection and criteria
      onSelectionChange(selectedIds.filter(id => id !== paxJourneyId));
      const next = { ...criteriaMap };
      delete next[paxJourneyId];
      onCriteriaChange(next);
    } else {
      // Select: add to selection and initialize criteria from current journey
      onSelectionChange([...selectedIds, paxJourneyId]);
      const journey = itineraries.find(i => i.paxJourneyId === paxJourneyId);
      if (journey) {
        onCriteriaChange({
          ...criteriaMap,
          [paxJourneyId]: {
            origin: journey.origin,
            destination: journey.destination,
            departureDate: journey.departureDate,
          },
        });
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === itineraries.length) {
      onSelectionChange([]);
      onCriteriaChange({});
    } else {
      const allIds = itineraries.map(i => i.paxJourneyId);
      onSelectionChange(allIds);
      const allCriteria: Record<string, JourneyCriteria> = {};
      for (const itin of itineraries) {
        allCriteria[itin.paxJourneyId] = {
          origin: itin.origin,
          destination: itin.destination,
          departureDate: itin.departureDate,
        };
      }
      onCriteriaChange(allCriteria);
    }
  };

  const handleCriteriaFieldChange = (
    paxJourneyId: string,
    field: keyof JourneyCriteria,
    value: string,
  ) => {
    onCriteriaChange({
      ...criteriaMap,
      [paxJourneyId]: {
        ...criteriaMap[paxJourneyId],
        [field]: value,
      },
    });
  };

  if (itineraries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No journeys available for change.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Select Journey to Change</h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {selectedIds.length === itineraries.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-3">
        {itineraries.map((itinerary) => {
          const isSelected = selectedIds.includes(itinerary.paxJourneyId);
          const isValid = itinerary.status === 'CONFIRMED'
            || (itinerary.status?.startsWith('HK') ?? false);
          const hasMultipleSegments = itinerary.segments.length > 1;
          const criteria = criteriaMap[itinerary.paxJourneyId];

          return (
            <div
              key={itinerary.paxJourneyId}
              className={`
                border rounded-lg transition-all
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                ${!isValid ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Journey Card (clickable) */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => isValid && handleToggle(itinerary.paxJourneyId)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => isValid && handleToggle(itinerary.paxJourneyId)}
                      disabled={!isValid}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>

                  {/* Journey Info */}
                  <div className="flex-1">
                    {/* Journey header: Origin → Destination */}
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <div className="text-center">
                        <div className="font-semibold text-lg">{itinerary.origin}</div>
                        <div className="text-gray-500">{itinerary.departureTime}</div>
                      </div>

                      <div className="flex-1 flex items-center">
                        <div className="flex-1 border-t border-gray-300 border-dashed"></div>
                        <div className="mx-2 text-xs text-gray-400">
                          {hasMultipleSegments
                            ? `${itinerary.segments.length} stops`
                            : 'Non-stop'}
                          {itinerary.flightTime && (
                            <span className="ml-1">({formatFlightTime(itinerary.flightTime)})</span>
                          )}
                        </div>
                        <div className="flex-1 border-t border-gray-300 border-dashed"></div>
                      </div>

                      <div className="text-center">
                        <div className="font-semibold text-lg">{itinerary.destination}</div>
                        <div className="text-gray-500">{itinerary.arrivalTime}</div>
                      </div>
                    </div>

                    {/* Segments detail */}
                    <div className="space-y-1">
                      {itinerary.segments.map((seg, idx) => (
                        <div key={seg.segmentId} className="flex items-center gap-2 text-xs text-gray-600">
                          {hasMultipleSegments && (
                            <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                          )}
                          <span className="font-medium">{seg.carrierCode} {seg.flightNumber}</span>
                          <span>{seg.origin} → {seg.destination}</span>
                          <span className="text-gray-400">
                            {seg.departureTime} - {seg.arrivalTime}
                          </span>
                          <span className={`
                            px-1.5 py-0.5 rounded-full text-[10px]
                            ${isValid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                          `}>
                            {seg.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {itinerary.departureDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Criteria Inputs (shown when selected) */}
              {isSelected && criteria && (
                <div
                  className="px-4 pb-4 pt-2 border-t border-blue-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs font-medium text-blue-700 mb-2">Search Criteria</div>
                  <div className="grid grid-cols-5 gap-2">
                    {/* Origin */}
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-500 mb-0.5">Origin</label>
                      <input
                        type="text"
                        value={criteria.origin}
                        onChange={(e) => handleCriteriaFieldChange(
                          itinerary.paxJourneyId, 'origin', e.target.value.toUpperCase()
                        )}
                        maxLength={3}
                        placeholder="ICN"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                      />
                    </div>

                    {/* Destination */}
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-500 mb-0.5">Destination</label>
                      <input
                        type="text"
                        value={criteria.destination}
                        onChange={(e) => handleCriteriaFieldChange(
                          itinerary.paxJourneyId, 'destination', e.target.value.toUpperCase()
                        )}
                        maxLength={3}
                        placeholder="CDG"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                      />
                    </div>

                    {/* Departure Date */}
                    <div className="col-span-1">
                      <label className="block text-[10px] text-gray-500 mb-0.5">Date</label>
                      <input
                        type="date"
                        value={criteria.departureDate}
                        onChange={(e) => handleCriteriaFieldChange(
                          itinerary.paxJourneyId, 'departureDate', e.target.value
                        )}
                        className="w-full px-1 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
