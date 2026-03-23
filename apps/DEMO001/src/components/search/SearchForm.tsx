// @template SearchForm
// @version 4.0.0 (synced from template)
// @description Template for search/SearchForm.tsx

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export interface SearchFormData {
  tripType: 'oneway' | 'roundtrip';
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  cabinClass: 'Y' | 'W' | 'C' | 'F';
}

export interface SearchFormProps {
  onSearch: (data: SearchFormData) => void;
  loading?: boolean;
  initialData?: Partial<SearchFormData>;
}

const CABIN_CLASS_OPTIONS = [
  { value: 'Y' as const, label: 'Economy' },
  { value: 'W' as const, label: 'Premium Economy' },
  { value: 'C' as const, label: 'Business' },
  { value: 'F' as const, label: 'First Class' },
];

export default function SearchForm({ onSearch, loading = false, initialData }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    tripType: initialData?.tripType ?? 'roundtrip',
    origin: initialData?.origin ?? '',
    destination: initialData?.destination ?? '',
    departureDate: initialData?.departureDate ?? '',
    returnDate: initialData?.returnDate ?? '',
    passengers: {
      adults: initialData?.passengers?.adults ?? 1,
      children: initialData?.passengers?.children ?? 0,
      infants: initialData?.passengers?.infants ?? 0,
    },
    cabinClass: initialData?.cabinClass ?? 'Y',
  });

  const [showPassengers, setShowPassengers] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleSwapAirports = () => {
    setFormData((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const updatePassengers = (type: 'adults' | 'children' | 'infants', increment: boolean) => {
    setFormData((prev) => ({
      ...prev,
      passengers: {
        ...prev.passengers,
        [type]: Math.max(
          type === 'adults' ? 1 : 0,
          prev.passengers[type] + (increment ? 1 : -1)
        ),
      },
    }));
  };

  const totalPassengers =
    formData.passengers.adults + formData.passengers.children + formData.passengers.infants;

  const passengerSummary = () => {
    const parts: string[] = [];
    if (formData.passengers.adults > 0) parts.push(`${formData.passengers.adults} Adult`);
    if (formData.passengers.children > 0) parts.push(`${formData.passengers.children} Child`);
    if (formData.passengers.infants > 0) parts.push(`${formData.passengers.infants} Infant`);
    return parts.join(', ') || '1 Adult';
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-5 md:p-6 space-y-5">
      {/* Trip Type Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['roundtrip', 'oneway'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, tripType: type }))}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              formData.tripType === type
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {type === 'roundtrip' ? 'Round Trip' : 'One Way'}
          </button>
        ))}
      </div>

      {/* Origin & Destination */}
      <div className="relative flex flex-col md:flex-row gap-3 md:gap-0 md:items-stretch">
        {/* Origin */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="material-symbols-outlined text-base align-middle mr-1">flight_takeoff</span>
            Departure
          </label>
          <input
            type="text"
            placeholder="City or Airport Code (e.g. ICN)"
            value={formData.origin}
            onChange={(e) => setFormData((prev) => ({ ...prev, origin: e.target.value.toUpperCase() }))}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl',
              'text-gray-900 placeholder-gray-400 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200'
            )}
            required
            maxLength={3}
          />
        </div>

        {/* Swap Button */}
        <div className="flex items-center justify-center md:px-2 md:pt-6">
          <button
            type="button"
            onClick={handleSwapAirports}
            className={cn(
              'w-10 h-10 rounded-full bg-gray-100 hover:bg-primary hover:text-white',
              'flex items-center justify-center',
              'transition-all duration-200 shadow-sm border border-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
            aria-label="Swap origin and destination"
            title="Swap airports"
          >
            <span className="material-symbols-outlined text-lg">swap_horiz</span>
          </button>
        </div>

        {/* Destination */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="material-symbols-outlined text-base align-middle mr-1">flight_land</span>
            Arrival
          </label>
          <input
            type="text"
            placeholder="City or Airport Code (e.g. CDG)"
            value={formData.destination}
            onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value.toUpperCase() }))}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl',
              'text-gray-900 placeholder-gray-400 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200'
            )}
            required
            maxLength={3}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="material-symbols-outlined text-base align-middle mr-1">calendar_today</span>
            Departure Date
          </label>
          <input
            type="date"
            value={formData.departureDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: e.target.value }))}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl',
              'text-gray-900 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200'
            )}
            required
          />
        </div>

        {formData.tripType === 'roundtrip' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              <span className="material-symbols-outlined text-base align-middle mr-1">event_available</span>
              Return Date
            </label>
            <input
              type="date"
              value={formData.returnDate || ''}
              min={formData.departureDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData((prev) => ({ ...prev, returnDate: e.target.value }))}
              className={cn(
                'w-full px-4 py-3 border border-gray-300 rounded-xl',
                'text-gray-900 font-medium',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'transition-colors duration-200'
              )}
              required={formData.tripType === 'roundtrip'}
            />
          </div>
        ) : (
          <div className="hidden md:block" /> // Placeholder for grid alignment
        )}
      </div>

      {/* Passengers & Cabin Class Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Passenger Counter */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="material-symbols-outlined text-base align-middle mr-1">group</span>
            Passengers
          </label>
          <button
            type="button"
            onClick={() => setShowPassengers((prev) => !prev)}
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl text-left',
              'text-gray-900 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200 flex items-center justify-between',
              showPassengers && 'ring-2 ring-primary border-transparent'
            )}
          >
            <span>{passengerSummary()}</span>
            <span className="material-symbols-outlined text-gray-400">
              {showPassengers ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Passenger Dropdown */}
          {showPassengers && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-4 space-y-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Adult</div>
                  <div className="text-xs text-gray-500">Age 12+</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updatePassengers('adults', false)}
                    disabled={formData.passengers.adults <= 1}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-900">
                    {formData.passengers.adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePassengers('adults', true)}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Child</div>
                  <div className="text-xs text-gray-500">Age 2-11</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updatePassengers('children', false)}
                    disabled={formData.passengers.children <= 0}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-900">
                    {formData.passengers.children}
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePassengers('children', true)}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Infant</div>
                  <div className="text-xs text-gray-500">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updatePassengers('infants', false)}
                    disabled={formData.passengers.infants <= 0}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-900">
                    {formData.passengers.infants}
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePassengers('infants', true)}
                    className={cn(
                      'w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center',
                      'text-gray-600 hover:bg-gray-100 transition-colors'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total: {totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}</span>
                <button
                  type="button"
                  onClick={() => setShowPassengers(false)}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cabin Class */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <span className="material-symbols-outlined text-base align-middle mr-1">airline_seat_recline_extra</span>
            Cabin Class
          </label>
          <select
            value={formData.cabinClass}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cabinClass: e.target.value as SearchFormData['cabinClass'],
              }))
            }
            className={cn(
              'w-full px-4 py-3 border border-gray-300 rounded-xl',
              'text-gray-900 font-medium bg-white',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-colors duration-200 appearance-none cursor-pointer'
            )}
          >
            {CABIN_CLASS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        className="mt-2 py-4 text-base font-semibold rounded-xl"
      >
        {!loading && (
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">search</span>
            Search Flights
          </span>
        )}
      </Button>
    </form>
  );
}
