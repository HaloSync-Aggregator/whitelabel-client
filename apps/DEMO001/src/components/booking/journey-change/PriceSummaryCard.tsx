// @template PriceSummaryCard
// @version 4.0.0 (synced from template)
// @description Template for booking/journey-change/PriceSummaryCard.tsx

// Template v1.2.0 - Journey Change PriceSummaryCard

/**
 * PriceSummaryCard Component
 *
 * Compare original and new journey/itinerary with price difference information
 * Supports carrier-specific payment options (AF/KL: includes Voucher)
 */

import { type CurrentItinerary, type ReshopOffer } from '@/types/journey-change';

interface PriceSummaryCardProps {
  originalItineraries: CurrentItinerary[];
  newOffer: ReshopOffer;
  quotedPrice: { amount: number; curCode: string } | null;
  priceDifference: { amount: number; curCode: string } | null;
  carrierCode: string;
  onConfirm: () => void;
}

export default function PriceSummaryCard({
  originalItineraries,
  newOffer,
  quotedPrice,
  priceDifference,
  carrierCode,
  onConfirm,
}: PriceSummaryCardProps) {

  return (
    <div className="space-y-6">
      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-500 mb-3">Original Journey</h4>
          {originalItineraries.map((itinerary) => (
            <div key={itinerary.paxJourneyId} className="mb-2 last:mb-0">
              <div className="font-medium">
                {itinerary.carrierCode} {itinerary.flightNumber}
              </div>
              <div className="text-sm text-gray-600">
                {itinerary.origin} → {itinerary.destination}
              </div>
              <div className="text-xs text-gray-500">
                {itinerary.departureDate} {itinerary.departureTime}
              </div>
            </div>
          ))}
        </div>

        {/* New */}
        <div className="border rounded-lg p-4 border-blue-300 bg-blue-50">
          <h4 className="font-medium text-blue-600 mb-3">New Journey</h4>
          {newOffer.flights && newOffer.flights.length > 0 ? (
            newOffer.flights.map((flight, idx) => (
              <div key={flight.segmentKey || idx} className="mb-2 last:mb-0">
                <div className="font-medium">
                  {flight.carrierCode} {flight.flightNumber}
                </div>
                <div className="text-sm text-gray-600">
                  {flight.origin} → {flight.destination}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.departureTime}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{newOffer.owner}</span> Flight
            </div>
          )}
        </div>
      </div>

      {/* Price Summary */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4">Fare Information</h4>

        {quotedPrice && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">New Total Fare</span>
            <span className="font-semibold">
              {quotedPrice.amount.toLocaleString()} {quotedPrice.curCode}
            </span>
          </div>
        )}

        {priceDifference && (
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="font-medium">
              {priceDifference.amount >= 0 ? 'Additional Payment' : 'Refund Amount'}
            </span>
            <span className={`text-xl font-bold ${priceDifference.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceDifference.amount >= 0 ? '+' : ''}
              {Math.abs(priceDifference.amount).toLocaleString()} {priceDifference.curCode}
            </span>
          </div>
        )}
      </div>

      {/* Carrier notice for Voucher support */}
      {(carrierCode === 'AF' || carrierCode === 'KL') && (
        <div className="text-xs text-gray-500 bg-gray-50 border rounded p-2">
          AF/KL supports payment by Card, Cash, or Voucher.
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={onConfirm}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {priceDifference && priceDifference.amount > 0
          ? `Pay ${priceDifference.amount.toLocaleString()} ${priceDifference.curCode} and Confirm Change`
          : 'Confirm Journey Change'
        }
      </button>

      {/* Notice */}
      <p className="text-xs text-gray-500 text-center">
        Changes cannot be cancelled after confirmation.
        Additional fees may apply depending on carrier policy.
      </p>
    </div>
  );
}
