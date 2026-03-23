// @template FilterPanel
// @version 4.0.0 (synced from template)
// @description Template for flight/FilterPanel.tsx

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';

export interface FilterOptions {
  stops: number[];
  airlines: string[];
  priceRange: [number, number];
  departureTime: string[];
  baggage: boolean;
}

export interface FilterPanelProps {
  airlines: Array<{ code: string; name: string; minPrice?: number }>;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
}

export default function FilterPanel({ airlines, onFilterChange }: FilterPanelProps) {
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [baggageOnly, setBaggageOnly] = useState(false);
  const [showAllAirlines, setShowAllAirlines] = useState(false);

  const timeSlots = [
    { value: 'dawn', label: 'Dawn (00-06)' },
    { value: 'morning', label: 'Morning (06-12)' },
    { value: 'afternoon', label: 'Afternoon (12-18)' },
    { value: 'evening', label: 'Evening (18-24)' },
  ];

  const stopOptions = [
    { value: 0, label: 'Non-stop' },
    { value: 1, label: 'Stopover 1 time(s)' },
    { value: 2, label: 'Stopover 2 time(s) or more' },
  ];

  const handleStopChange = (stop: number) => {
    const newStops = selectedStops.includes(stop)
      ? selectedStops.filter((s) => s !== stop)
      : [...selectedStops, stop];
    setSelectedStops(newStops);
    onFilterChange({ stops: newStops });
  };

  const handleAirlineChange = (airlineCode: string) => {
    const newAirlines = selectedAirlines.includes(airlineCode)
      ? selectedAirlines.filter((a) => a !== airlineCode)
      : [...selectedAirlines, airlineCode];
    setSelectedAirlines(newAirlines);
    onFilterChange({ airlines: newAirlines });
  };

  const handleTimeChange = (time: string) => {
    const newTimes = selectedTimes.includes(time)
      ? selectedTimes.filter((t) => t !== time)
      : [...selectedTimes, time];
    setSelectedTimes(newTimes);
    onFilterChange({ departureTime: newTimes });
  };

  const handleBaggageChange = (checked: boolean) => {
    setBaggageOnly(checked);
    onFilterChange({ baggage: checked });
  };

  const handleReset = () => {
    setSelectedStops([]);
    setSelectedAirlines([]);
    setSelectedTimes([]);
    setBaggageOnly(false);
    onFilterChange({
      stops: [],
      airlines: [],
      departureTime: [],
      baggage: false,
    });
  };

  const hasActiveFilters =
    selectedStops.length > 0 ||
    selectedAirlines.length > 0 ||
    selectedTimes.length > 0 ||
    baggageOnly;

  const displayedAirlines = showAllAirlines ? airlines : airlines.slice(0, 5);

  return (
    <Card padding="none" className="sticky top-20">
      {/* Filter header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filter</h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {/* Stops filter */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Stopover</h4>
          <div className="space-y-2">
            {stopOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStops.includes(option.value)}
                  onChange={() => handleStopChange(option.value)}
                  className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Airlines filter */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Airline</h4>
          <div className="space-y-2">
            {displayedAirlines.map((airline) => (
              <label
                key={airline.code}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAirlines.includes(airline.code)}
                    onChange={() => handleAirlineChange(airline.code)}
                    className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{airline.name}</span>
                </div>
                {/* Minimum price display - important for carrier filter */}
                {airline.minPrice !== undefined && (
                  <span className={cn(
                    'text-xs font-medium',
                    selectedAirlines.includes(airline.code) ? 'text-primary' : 'text-blue-600'
                  )}>
                    {airline.minPrice.toLocaleString()} KRW~
                  </span>
                )}
              </label>
            ))}
          </div>
          {airlines.length > 5 && (
            <button
              onClick={() => setShowAllAirlines(!showAllAirlines)}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {showAllAirlines
                ? 'Collapse'
                : `Show more (${airlines.length - 5} items)`}
            </button>
          )}
        </div>

        {/* Departure time filter */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Departure Time</h4>
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <label key={slot.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTimes.includes(slot.value)}
                  onChange={() => handleTimeChange(slot.value)}
                  className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{slot.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Free baggage filter */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Free Baggage</h4>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={baggageOnly}
              onChange={(e) => handleBaggageChange(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Baggage included</span>
          </label>
        </div>
      </div>
    </Card>
  );
}
