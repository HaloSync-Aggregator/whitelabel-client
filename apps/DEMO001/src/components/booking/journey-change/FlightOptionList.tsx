// @template FlightOptionList
// @version 4.0.0 (synced from template)
// @description Template for booking/journey-change/FlightOptionList.tsx

// Template v1.1.0 - Journey Change FlightOptionList

/**
 * FlightOptionList Component
 *
 * Change Available Flight List Display Component
 */

import { type ReshopOffer } from '@/types/journey-change';

interface FlightOptionListProps {
  offers: ReshopOffer[];
  selectedOffer: ReshopOffer | null;
  onSelect: (offer: ReshopOffer) => void;
}

export default function FlightOptionList({
  offers,
  selectedOffer,
  onSelect,
}: FlightOptionListProps) {
  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">✈️</div>
        <p className="text-gray-600">No available flights for change.</p>
        <p className="text-sm text-gray-500 mt-2">
          Please select a different date or route.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Available Flights ({offers.length})
        </h3>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const isSelected = selectedOffer?.offerId === offer.offerId;
          const price = offer.totalPrice?.totalAmount;
          const priceDiff = offer.priceDifference;

          return (
            <div
              key={offer.offerId}
              onClick={() => onSelect(offer)}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              <div className="flex items-center justify-between">
                {/* Flight Info */}
                <div className="flex-1">
                  {offer.flights && offer.flights.length > 0 ? (
                    <div className="space-y-2">
                      {offer.flights.map((flight, idx) => (
                        <div key={flight.segmentKey || idx} className="flex items-center gap-4">
                          {/* Carrier & Flight */}
                          <div className="w-20">
                            <span className="font-semibold">
                              {flight.carrierCode} {flight.flightNumber}
                            </span>
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-center">
                              <div className="font-semibold">{flight.origin}</div>
                              <div className="text-xs text-gray-500">{flight.departureTime}</div>
                            </div>

                            <div className="flex-1 flex items-center">
                              <div className="flex-1 border-t border-gray-300"></div>
                              <div className="mx-2 text-xs text-gray-400">
                                {flight.duration}
                              </div>
                              <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            <div className="text-center">
                              <div className="font-semibold">{flight.destination}</div>
                              <div className="text-xs text-gray-500">{flight.arrivalTime}</div>
                            </div>
                          </div>

                          {/* Stops */}
                          <div className="w-16 text-center">
                            <span className={`
                              text-xs px-2 py-1 rounded-full
                              ${flight.stops === 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                              }
                            `}>
                              {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <span className="font-medium">{offer.owner}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        Offer ID: {offer.offerId.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right ml-4">
                  {price && (
                    <div className="font-semibold text-lg">
                      {price.amount.toLocaleString()} {price.curCode}
                    </div>
                  )}
                  {priceDiff && (
                    <div className={`text-sm ${priceDiff.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {priceDiff.amount >= 0 ? '+' : ''}{priceDiff.amount.toLocaleString()} {priceDiff.curCode}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-blue-200 text-center">
                  <span className="text-blue-600 text-sm font-medium">
                    Selected - Proceed to next step
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
