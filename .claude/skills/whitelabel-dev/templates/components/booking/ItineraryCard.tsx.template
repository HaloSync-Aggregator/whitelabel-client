// @template ItineraryCard
// @version 4.0.0 (synced from template)
// @description Template for booking/ItineraryCard.tsx

/**
 * ItineraryCard Component
 *
 * Itinerary info Card: Outbound/Return Segment Display
 */

import React from 'react';
import { ItineraryInfo } from '@/types/booking';
import { getStatusColor } from '@/lib/status-codes';

interface ItineraryCardProps {
  itineraries: ItineraryInfo[];
}

export default function ItineraryCard({ itineraries }: ItineraryCardProps) {
  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Itinerary info</h3>
        <p className="text-muted">Itinerary info is not available.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Itinerary info</h3>

      <div className="space-y-6">
        {itineraries.map((itinerary) => (
          <div key={itinerary.journeyId}>
            {/* Journey Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                itinerary.direction === 'outbound'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {itinerary.directionLabel}
              </span>
            </div>

            {/* Segments */}
            <div className="space-y-4">
              {itinerary.segments.map((segment, idx) => (
                <div
                  key={segment.segmentId}
                  className="relative pl-4 border-l-2 border-primary/30"
                >
                  {/* Segment Number Badge */}
                  <div className="absolute -left-2.5 top-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {segment.segmentNo}
                  </div>

                  {/* Flight Info */}
                  <div className="ml-4">
                    {/* Flight Number & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {segment.flightNumber}
                        </span>
                        {segment.aircraft && (
                          <span className="text-xs text-muted">
                            ({segment.aircraft})
                          </span>
                        )}
                        {segment.isCodeShare && segment.operatingCarrier && (
                          <span className="text-xs text-orange-600">
                            Operation: {segment.operatingCarrier}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(segment.status)}`}>
                        {segment.statusLabel}
                      </span>
                    </div>

                    {/* Departure & Arrival */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      {/* Departure */}
                      <div>
                        <div className="text-2xl font-bold text-foreground">
                          {segment.departure.time}
                        </div>
                        <div className="text-sm text-muted">
                          {segment.departure.date}
                        </div>
                        <div className="font-medium text-foreground">
                          {segment.departure.airport}
                          {segment.departure.terminal && (
                            <span className="text-muted ml-1">
                              T{segment.departure.terminal}
                            </span>
                          )}
                        </div>
                        {segment.departure.airportName && (
                          <div className="text-xs text-muted">
                            {segment.departure.airportName}
                          </div>
                        )}
                      </div>

                      {/* Duration & Arrow */}
                      <div className="text-center px-4">
                        {segment.duration && (
                          <div className="text-xs text-muted mb-1">
                            {segment.duration}
                          </div>
                        )}
                        <div className="flex items-center">
                          <div className="h-px w-8 bg-border"></div>
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="h-px w-8 bg-border"></div>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {segment.arrival.time}
                        </div>
                        <div className="text-sm text-muted">
                          {segment.arrival.date}
                        </div>
                        <div className="font-medium text-foreground">
                          {segment.arrival.airport}
                          {segment.arrival.terminal && (
                            <span className="text-muted ml-1">
                              T{segment.arrival.terminal}
                            </span>
                          )}
                        </div>
                        {segment.arrival.airportName && (
                          <div className="text-xs text-muted">
                            {segment.arrival.airportName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cabin, Class & Baggage */}
                    <div className="flex items-center flex-wrap gap-3 mt-2 text-xs">
                      {segment.cabinClass && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {segment.cabinClass}
                        </span>
                      )}
                      {segment.bookingClass && (
                        <span className="text-muted">
                          class: <span className="font-medium text-foreground">{segment.bookingClass}</span>
                        </span>
                      )}
                      {segment.priceClass && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {segment.priceClass}
                        </span>
                      )}
                      {segment.baggage && (
                        <span className="flex items-center gap-1 text-muted">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {segment.baggage}
                        </span>
                      )}
                      {segment.hiddenStops && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                          Stopover: {segment.hiddenStops}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stopover indicator */}
                  {idx < itinerary.segments.length - 1 && (
                    <div className="ml-4 mt-3 py-2 px-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      Stopover - {segment.arrival.airport}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
