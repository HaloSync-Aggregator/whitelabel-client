// @template FlightCard
// @version 4.0.0 (synced from template)
// @description Template for flight/FlightCard.tsx

import { useState } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';

/**
 * FlightLeg: Single Itinerary (Segment) Information
 * FULL Mode: legs[] array contains both outbound and inbound
 * PARTIAL Mode: legs[] array contains only one itinerary
 */
export interface FlightLeg {
  direction: 'outbound' | 'inbound';
  directionLabel: string;
  journeyId: string;
  departure: {
    airport: string;
    airportName?: string;
    time: string;
    date: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    airportName?: string;
    time: string;
    date: string;
    terminal?: string;
  };
  duration: string;
  stops: number;
  stopoverAirports?: string[];
  flightNumber: string;
  cabinClass?: string;
  segments: Array<{
    segmentId: string;
    flightNumber: string;
    carrier: string;
    departure: {
      airport: string;
      airportName?: string;
      time: string;
      date: string;
      terminal?: string;
    };
    arrival: {
      airport: string;
      airportName?: string;
      time: string;
      date: string;
      terminal?: string;
    };
    duration?: string;
    cabinClass?: string;
  }>;
}

/**
 * Airline Logo Component with fallback to carrier code text
 */
function AirlineLogo({ code, name, logo }: { code: string; name: string; logo?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!logo || imgError) {
    return (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-xs font-bold text-gray-600">
        {code}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      className="w-8 h-8 object-contain mr-2"
      onError={() => setImgError(true)}
    />
  );
}

export interface Flight {
  id: string;
  airline: {
    code: string;
    name: string;
    logo?: string;
  };
  flightNumber?: string;
  departure: {
    airport: string;
    airportName?: string;
    time: string;
    date: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    airportName?: string;
    time: string;
    date: string;
    terminal?: string;
  };
  duration: string;
  stops: number;
  stopoverAirports?: string[];
  cabinClass?: string;
  baggage?: string;
  price: number;
  currency: string;
  legs?: FlightLeg[];
  _raw?: {
    responseId: string;
    offerId: string;
    owner: string;
    offerItems?: Array<{
      offerItemId: string;
      paxRefId: string[];
    }>;
    matchResult?: 'FULL' | 'PARTIAL';
    originDestId?: string;
  };
}

export interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  loading?: boolean;
}

export default function FlightCard({ flight, onSelect, loading = false }: FlightCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const formatDuration = (duration: string) => {
    if (duration.includes('PT')) {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
      if (match) {
        const hours = match[1] ? `${match[1]}h` : '';
        const minutes = match[2] ? ` ${match[2]}m` : '';
        return `${hours}${minutes}`.trim();
      }
    }
    return duration;
  };

  const getStopsText = (stops: number) => {
    if (stops === 0) return 'Non-stop';
    if (stops === 1) return '1 Stop';
    return `${stops} Stops`;
  };

  const getStopsColor = (stops: number) => {
    return stops === 0 ? 'text-blue-600' : 'text-red-500';
  };

  // Build legs array from flight data or construct single-leg from top-level fields
  const legs = flight.legs && flight.legs.length > 0
    ? flight.legs
    : [{
        direction: 'outbound' as const,
        directionLabel: 'Outbound',
        journeyId: '',
        departure: flight.departure,
        arrival: flight.arrival,
        duration: flight.duration,
        stops: flight.stops,
        stopoverAirports: flight.stopoverAirports,
        flightNumber: flight.flightNumber || '',
        cabinClass: flight.cabinClass,
        segments: [],
      }];

  const isMultiLeg = legs.length > 1;

  const renderLeg = (leg: FlightLeg, showDirection: boolean = false) => (
    <div key={leg.journeyId || leg.direction}>
      {showDirection && (
        <div className="text-xs font-medium text-blue-600 mb-2 pb-1 border-b border-gray-200">
          {leg.directionLabel} ({leg.departure.airport} &rarr; {leg.arrival.airport})
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Departure */}
        <div className="min-w-0">
          <div className={cn('font-bold text-gray-900', isMultiLeg ? 'text-lg' : 'text-2xl')}>
            {leg.departure.time}
          </div>
          <div className="text-sm text-gray-500">
            {leg.departure.airport}
            {leg.departure.terminal && (
              <span className="ml-1">T{leg.departure.terminal}</span>
            )}
          </div>
          {!isMultiLeg && leg.departure.airportName && (
            <div className="text-xs text-gray-400">{leg.departure.airportName}</div>
          )}
          <div className="text-xs text-gray-400">{leg.departure.date}</div>
        </div>

        {/* Duration and stops */}
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-500 mb-1">
            {formatDuration(leg.duration)}
          </div>
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            {leg.stops > 0 && (
              <div className="mx-2 flex gap-1">
                {leg.stopoverAirports?.map((airport, idx) => (
                  <span key={`${airport}-${idx}`} className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                    {airport}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          <div className={cn('text-sm font-medium mt-1', getStopsColor(leg.stops))}>
            {getStopsText(leg.stops)}
          </div>
        </div>

        {/* Arrival */}
        <div className="min-w-0 text-right">
          <div className={cn('font-bold text-gray-900', isMultiLeg ? 'text-lg' : 'text-2xl')}>
            {leg.arrival.time}
          </div>
          <div className="text-sm text-gray-500">
            {leg.arrival.airport}
            {leg.arrival.terminal && (
              <span className="ml-1">T{leg.arrival.terminal}</span>
            )}
          </div>
          {!isMultiLeg && leg.arrival.airportName && (
            <div className="text-xs text-gray-400">{leg.arrival.airportName}</div>
          )}
          <div className="text-xs text-gray-400">{leg.arrival.date}</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card variant="elevated" padding="none" className="hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Airline info */}
            <div className="flex items-center mb-4">
              <AirlineLogo
                code={flight.airline.code}
                name={flight.airline.name}
                logo={
                  flight.airline.logo ||
                  `https://pics.avs.io/70/70/${flight.airline.code}.png`
                }
              />
              <div>
                <div className="font-medium text-gray-900">{flight.airline.name}</div>
                {flight.flightNumber && (
                  <div className="text-xs text-gray-500">{flight.flightNumber}</div>
                )}
                {flight._raw?.matchResult && (
                  <div className={cn(
                    'text-xs',
                    flight._raw.matchResult === 'FULL' ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {flight._raw.matchResult === 'FULL' ? 'Round-trip' : 'One-way'}
                  </div>
                )}
              </div>
            </div>

            {/* Journey legs */}
            <div className={cn('space-y-4', !isMultiLeg && 'space-y-0')}>
              {legs.map((leg, _idx) => renderLeg(leg, isMultiLeg))}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {flight.cabinClass && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  {flight.cabinClass}
                </span>
              )}
              {flight.baggage && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  Baggage: {flight.baggage}
                </span>
              )}
            </div>
          </div>

          {/* Price and select button */}
          <div className="shrink-0 text-right ml-4">
            <div className="mb-4">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(flight.price, flight.currency)}
              </div>
              <div className="text-xs text-gray-500">
                {isMultiLeg ? 'Round-trip total / 1 pax' : 'Total / 1 pax'}
              </div>
            </div>
            <button
              onClick={() => onSelect(flight)}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Processing...' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
