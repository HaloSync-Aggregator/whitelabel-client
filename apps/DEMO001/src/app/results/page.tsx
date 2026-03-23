/**
 * @template results-page
 * @version 4.1.0
 * @description Search results page template (Full support for PARTIAL/FULL mode)
 *
 * ============================================================
 * Required checklist (must not be omitted!)
 * ============================================================
 * [x] Flight Type import: from FlightCard export Type Use
 * [x] PriceBreakdown import: Fare Detail Modal Component
 * [x] transactionId, paxList Save: Search API from response Save (OfferPrice in Call Required)
 * [x] handleSelect: OfferPrice API Call -> PriceBreakdown Modal Display
 * [x] handleProceedToBooking: in sessionStorage Data after Save /booking navigate
 * [x] PARTIAL Mode: Outbound/Return Tab UI + 2items offer OfferPrice Call
 * ============================================================
 *
 * PARTIAL Mode Support (v3.0):
 *
 * What is PARTIAL Mode?
 * - Round-trip search where airline returns outbound/return as separate offers
 * - e.g.: TR(Scoot), SQ(Singapore Airlines) Partial Segment
 * - legs[0].direction === 'outbound' | 'inbound' for classification
 *
 * PARTIAL Mode UI:
 * 1. Outbound/Return Tab Display
 * 2. Select flight from each tab
 * 3. When both selected, call OfferPrice with 2 offers
 * 4. PriceBreakdown Modal Display
 *
 * PARTIAL Mode OfferPrice Request:
 * - offers array contains 2 items (Outbound + Return)
 * - paxList is union of both offers' paxRefIds
 *
 * NOTE: FULL offers are also selectable from PARTIAL Mode UI.
 * - matchResult === 'FULL' offer triggers immediate OfferPrice call
 *
 * Field Reference:
 * - offer.outbound.departure -> offer.departure
 * - offer.offerId -> offer.id
 * - offer.owner -> offer.airline.code
 * - offer.totalPrice -> offer.price
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import FlightCard, { Flight } from '@/components/flight/FlightCard';
import FilterPanel, { FilterOptions } from '@/components/flight/FilterPanel';
import PriceBreakdown, { PriceBreakdownData } from '@/components/flight/PriceBreakdown';
import { Button } from '@/components/ui';
import { searchFlights, getOfferPrice, ApiError } from '@/lib/api/polarhub-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';

// Sort options
type SortOption = 'recommended' | 'price' | 'duration' | 'departure' | 'arrival';

// OriginDest type for PARTIAL mode
interface OriginDest {
  OriginDestID: string;
  PaxJourneyRefID: string[];
}

function SearchContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search state
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // OfferPrice state
  const [transactionId, setTransactionId] = useState<string>('');
  const [paxList, setPaxList] = useState<Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownData | null>(null);
  const [offerPriceLoading, setOfferPriceLoading] = useState(false);

  // ============================================================
  // PARTIAL Mode State (Required!)
  // ============================================================
  const [originDestList, setOriginDestList] = useState<OriginDest[]>([]);
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [activeJourney, setActiveJourney] = useState<'outbound' | 'inbound'>('outbound');
  const [outboundFlight, setOutboundFlight] = useState<Flight | null>(null);
  const [inboundFlight, setInboundFlight] = useState<Flight | null>(null);
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [inboundFlights, setInboundFlights] = useState<Flight[]>([]);

  // Extract search params
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'roundtrip';
  const cabinClass = searchParams.get('cabinClass') || 'Y';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');
  const infants = parseInt(searchParams.get('infants') || '0');

  // Fetch flights on mount
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build passengers list in service function format
        const passengerList: { type: 'ADT' | 'CHD' | 'INF'; count: number }[] = [];
        if (adults > 0) passengerList.push({ type: 'ADT', count: adults });
        if (children > 0) passengerList.push({ type: 'CHD', count: children });
        if (infants > 0) passengerList.push({ type: 'INF', count: infants });

        const data = await searchFlights({
          origin,
          destination,
          departureDate,
          returnDate: tripType === 'roundtrip' ? returnDate : undefined,
          tripType: tripType as 'oneway' | 'roundtrip',
          cabinClass,
          passengers: passengerList,
        });

        if (data.success) {
          const flightData = data.flights || [];
          setFlights(flightData);
          setFilteredFlights(flightData);
          setTransactionId(data.transactionId || '');
          setPaxList((data.paxList || []) as Array<{ paxId: string; ptc: 'ADT' | 'CHD' | 'INF' }>);
          setOriginDestList(data.originDestList || []);

          // ============================================================
          // PARTIAL Mode Detection (v3.0 Core!)
          // ============================================================
          const odList = data.originDestList || [];
          const isRoundTrip = odList.length > 1 && tripType === 'roundtrip';

          // matchResult check - if at least one 'PARTIAL' offer exists -> PARTIAL Mode
          const hasPartialOffers = flightData.some(
            (f: Flight) => f._raw?.matchResult === 'PARTIAL'
          );

          console.log('[PARTIAL Mode Detection]', {
            isRoundTrip,
            odListLength: odList.length,
            hasPartialOffers,
          });

          const partialMode = hasPartialOffers && isRoundTrip;
          setIsPartialMode(partialMode);

          if (partialMode) {
            // Classify by legs[0].direction
            const outbound = flightData.filter(
              (f: Flight) => f.legs?.[0]?.direction === 'outbound'
            );
            const inbound = flightData.filter(
              (f: Flight) => f.legs?.[0]?.direction === 'inbound'
            );

            console.log('[PARTIAL Mode] Outbound flights:', outbound.length);
            console.log('[PARTIAL Mode] Inbound flights:', inbound.length);

            setOutboundFlights(outbound);
            setInboundFlights(inbound);
          }
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : ERROR_MESSAGES.SEARCH_FAILED);
      } finally {
        setLoading(false);
      }
    };

    if (origin && destination && departureDate) {
      fetchFlights();
    } else {
      setError(ERROR_MESSAGES.SEARCH_REQUIRED);
      setLoading(false);
    }
  }, [origin, destination, departureDate, returnDate, tripType, cabinClass, adults, children, infants]);

  // Common Filter Function
  const applyFilters = useCallback((flightList: Flight[]): Flight[] => {
    let result = [...flightList];

    // Filter by stops
    if (filters.stops && filters.stops.length > 0) {
      result = result.filter((flight) => filters.stops!.includes(flight.stops));
    }

    // Filter by airlines
    if (filters.airlines && filters.airlines.length > 0) {
      result = result.filter((flight) => filters.airlines!.includes(flight.airline.code));
    }

    // Filter by departure time
    if (filters.departureTime && filters.departureTime.length > 0) {
      result = result.filter((flight) => {
        const hour = parseInt(flight.departure.time.split(':')[0]);
        const timeSlot = getTimeSlot(hour);
        return filters.departureTime!.includes(timeSlot);
      });
    }

    // Filter by baggage
    if (filters.baggage) {
      result = result.filter((flight) => flight.baggage && flight.baggage !== 'Information None');
    }

    return result;
  }, [filters]);

  // PARTIAL Mode Filter Lists
  const filteredOutboundFlights = applyFilters(outboundFlights);
  // Return: filter by same carrier as outbound when outbound is selected (UX improvement)
  const filteredInboundFlights = applyFilters(
    outboundFlight
      ? inboundFlights.filter((f) => f.airline.code === outboundFlight.airline.code)
      : inboundFlights
  );

  // PARTIAL Mode Bottom Bar State Debug
  useEffect(() => {
    if (isPartialMode) {
      console.log('[PARTIAL Bottom Bar State]', {
        isPartialMode,
        outboundFlight: outboundFlight ? `${outboundFlight.flightNumber} (${outboundFlight.id})` : null,
        inboundFlight: inboundFlight ? `${inboundFlight.flightNumber} (${inboundFlight.id})` : null,
        shouldShowBar: isPartialMode && (outboundFlight || inboundFlight),
      });
    }
  }, [isPartialMode, outboundFlight, inboundFlight]);

  // Apply filters (FULL Mode)
  useEffect(() => {
    const nextFlights = applyFilters(flights);
    let sorted = [...nextFlights];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'duration':
        sorted.sort((a, b) => {
          const aDuration = parseDuration(a.duration);
          const bDuration = parseDuration(b.duration);
          return aDuration - bDuration;
        });
        break;
      case 'departure':
        sorted.sort((a, b) => a.departure.time.localeCompare(b.departure.time));
        break;
      case 'arrival':
        sorted.sort((a, b) => a.arrival.time.localeCompare(b.arrival.time));
        break;
      case 'recommended':
      default:
        sorted.sort((a, b) => {
          const aScore = a.price / 100000 + a.stops * 2 + parseDuration(a.duration) / 60;
          const bScore = b.price / 100000 + b.stops * 2 + parseDuration(b.duration) / 60;
          return aScore - bScore;
        });
        break;
    }

    setFilteredFlights(sorted);
  }, [applyFilters, flights, sortBy]);

  // ============================================================
  // FULL Mode: FlightCard select -> OfferPrice API Call
  // ============================================================
  const handleSelectFlight = async (flight: Flight) => {
    if (!flight._raw) {
      alert('Invalid flight information.');
      return;
    }

    setSelectedFlight(flight);
    setOfferPriceLoading(true);
    setPriceBreakdown(null);

    try {
      // Filter paxList by this offer's paxRefId
      const offerPaxRefIds = new Set(
        (flight._raw?.offerItems || []).flatMap((item) => item.paxRefId)
      );
      const filteredPaxList = paxList.filter((pax) => offerPaxRefIds.has(pax.paxId));

      const data = await getOfferPrice({
        transactionId: transactionId || flight._raw.responseId,
        offers: [
          {
            responseId: flight._raw.responseId,
            offerId: flight._raw.offerId,
            owner: flight._raw.owner,
            offerItems: flight._raw.offerItems || [],
          },
        ],
        paxList: filteredPaxList,
      });

      if (data.success && data.priceBreakdown) {
        setPriceBreakdown(data.priceBreakdown);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : err instanceof Error ? err.message : ERROR_MESSAGES.OFFER_PRICE_FAILED);
      setSelectedFlight(null);
    } finally {
      setOfferPriceLoading(false);
    }
  };

  // ============================================================
  // PARTIAL Mode: Outbound/Return Select Handlers
  // ============================================================
  const handleSelectOutbound = (flight: Flight) => {
    console.log('[PARTIAL Selection] Outbound selected:', {
      id: flight.id,
      flightNumber: flight.flightNumber,
      matchResult: flight._raw?.matchResult,
    });
    setOutboundFlight(flight);
    // Auto-navigate to inbound tab
    setActiveJourney('inbound');
  };

  const handleSelectInbound = (flight: Flight) => {
    console.log('[PARTIAL Selection] Inbound selected:', {
      id: flight.id,
      flightNumber: flight.flightNumber,
      matchResult: flight._raw?.matchResult,
    });
    setInboundFlight(flight);
  };

  // ============================================================
  // PARTIAL Mode: OfferPrice Call (two offers combined)
  // ============================================================
  const handlePartialOfferPrice = async () => {
    if (!outboundFlight || !inboundFlight) {
      alert('Please select both outbound and return flights.');
      return;
    }

    setOfferPriceLoading(true);
    setPriceBreakdown(null);

    try {
      // Compose two offers (PARTIAL Mode Core!)
      const offers = [
        {
          responseId: outboundFlight._raw!.responseId,
          offerId: outboundFlight._raw!.offerId,
          owner: outboundFlight._raw!.owner,
          offerItems: outboundFlight._raw!.offerItems || [],
        },
        {
          responseId: inboundFlight._raw!.responseId,
          offerId: inboundFlight._raw!.offerId,
          owner: inboundFlight._raw!.owner,
          offerItems: inboundFlight._raw!.offerItems || [],
        },
      ];

      // Merge paxList (union of both offers' paxRefIds)
      const allPaxRefIds = new Set([
        ...(outboundFlight._raw!.offerItems || []).flatMap((i) => i.paxRefId),
        ...(inboundFlight._raw!.offerItems || []).flatMap((i) => i.paxRefId),
      ]);
      const mergedPaxList = paxList.filter((p) => allPaxRefIds.has(p.paxId));

      console.log('[PARTIAL OfferPrice] offers:', offers);
      console.log('[PARTIAL OfferPrice] mergedPaxList:', mergedPaxList);

      const data = await getOfferPrice({
        transactionId,
        offers,
        paxList: mergedPaxList,
      });

      if (data.success && data.priceBreakdown) {
        setPriceBreakdown(data.priceBreakdown);
        setSelectedFlight(outboundFlight);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : err instanceof Error ? err.message : ERROR_MESSAGES.OFFER_PRICE_FAILED);
    } finally {
      setOfferPriceLoading(false);
    }
  };

  // ============================================================
  // Proceed to booking - navigate to /booking
  // ============================================================
  const handleProceedToBooking = () => {
    if (!priceBreakdown) return;

    // Check if FULL offer was selected (also possible from PARTIAL Mode UI)
    const isFullOffer = selectedFlight?._raw?.matchResult === 'FULL';

    // PARTIAL Mode check (only when not a FULL offer)
    if (isPartialMode && !isFullOffer && (!outboundFlight || !inboundFlight)) {
      alert('Please select both outbound and return flights.');
      return;
    }

    // FULL Mode check
    if (!isPartialMode && !selectedFlight) {
      return;
    }

    // In PARTIAL Mode UI, if a FULL offer was selected, process as FULL mode
    const actualPartialMode = isPartialMode && !isFullOffer;

    const bookingData = {
      transactionId: priceBreakdown._orderData.transactionId,
      responseId: priceBreakdown._orderData.responseId,
      offerId: priceBreakdown._orderData.offerId,
      owner: priceBreakdown._orderData.owner,
      offerItems: priceBreakdown._orderData.offerItems,
      // PARTIAL Mode: save both flight details
      flight: actualPartialMode ? outboundFlight : selectedFlight,
      outboundFlight: actualPartialMode ? outboundFlight : undefined,
      inboundFlight: actualPartialMode ? inboundFlight : undefined,
      isPartialMode: actualPartialMode,
      priceBreakdown: priceBreakdown,
      paxList: priceBreakdown._orderData.paxList,
    };
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));

    navigate('/booking');
  };

  // Handle close price breakdown
  const handleClosePriceBreakdown = () => {
    setSelectedFlight(null);
    setPriceBreakdown(null);
  };

  // Extract airlines for filter
  const airlines = Array.from(
    new Map(flights.map((f) => [f.airline.code, f.airline])).values()
  ).map((airline) => ({
    code: airline.code,
    name: airline.name,
    minPrice: Math.min(...flights.filter((f) => f.airline.code === airline.code).map((f) => f.price)),
  }));

  // Suppress unused variable warning for originDestList
  void originDestList;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Search Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-900">
                {origin} &rarr; {destination}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{departureDate}</span>
              {tripType === 'roundtrip' && returnDate && (
                <>
                  <span className="text-gray-400">~</span>
                  <span className="text-gray-600">{returnDate}</span>
                </>
              )}
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                Adult {adults} {children > 0 && `, Child ${children}`}
                {infants > 0 && `, Infant ${infants}`}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {!loading && (
                <span className="text-sm text-gray-500">
                  Total {filteredFlights.length} flights
                </span>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>
                Modify Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add pb-24 when PARTIAL mode bottom bar is visible to prevent content overlap */}
      <main className={`flex-1 max-w-7xl mx-auto px-4 py-8 w-full ${isPartialMode && (outboundFlight || inboundFlight) ? 'pb-24' : ''}`}>
        {error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left: Filter Panel */}
            <aside className="w-80 flex-shrink-0 hidden lg:block">
              <FilterPanel airlines={airlines} onFilterChange={setFilters} />
            </aside>

            {/* Center: Flight List */}
            <section className="flex-1">
              {/* ============================================================ */}
              {/* PARTIAL Mode: Journey Selector Tabs (Outbound/Return) */}
              {/* ============================================================ */}
              {isPartialMode && (
                <div className="mb-4">
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveJourney('outbound')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        activeJourney === 'outbound'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Outbound {outboundFlight && <span className="text-green-500 ml-1">&#10003;</span>}
                    </button>
                    <button
                      onClick={() => setActiveJourney('inbound')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        activeJourney === 'inbound'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Return {inboundFlight && <span className="text-green-500 ml-1">&#10003;</span>}
                    </button>
                  </div>

                  {/* Selected Flight Summary Cards */}
                  {(outboundFlight || inboundFlight) && (
                    <div className="mt-4 space-y-2">
                      {outboundFlight && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="text-xs text-gray-500">Outbound</span>
                            <div className="font-medium text-gray-900">
                              {outboundFlight.airline.name} {outboundFlight.flightNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              {outboundFlight.departure.airport} {outboundFlight.departure.time} &rarr;{' '}
                              {outboundFlight.arrival.airport} {outboundFlight.arrival.time}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {outboundFlight.price.toLocaleString()} {outboundFlight.currency}
                            </div>
                            <button
                              onClick={() => {
                                setOutboundFlight(null);
                                setActiveJourney('outbound');
                              }}
                              className="text-xs text-gray-500 hover:text-red-500"
                            >
                              Cancel Selection
                            </button>
                          </div>
                        </div>
                      )}
                      {inboundFlight && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="text-xs text-gray-500">Return</span>
                            <div className="font-medium text-gray-900">
                              {inboundFlight.airline.name} {inboundFlight.flightNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              {inboundFlight.departure.airport} {inboundFlight.departure.time} &rarr;{' '}
                              {inboundFlight.arrival.airport} {inboundFlight.arrival.time}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {inboundFlight.price.toLocaleString()} {inboundFlight.currency}
                            </div>
                            <button
                              onClick={() => setInboundFlight(null)}
                              className="text-xs text-gray-500 hover:text-red-500"
                            >
                              Cancel Selection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sort Options */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Sort:</span>
                  {[
                    { value: 'recommended', label: 'Recommended' },
                    { value: 'price', label: 'Lowest Price' },
                    { value: 'duration', label: 'Shortest' },
                    { value: 'departure', label: 'Departure' },
                    { value: 'arrival', label: 'Arrival' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        sortBy === option.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flight Cards */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-48 bg-white rounded-lg animate-pulse border border-gray-200"></div>
                  ))}
                </div>
              ) : isPartialMode ? (
                /* ============================================================ */
                /* PARTIAL Mode: Per-journey flight list */
                /* ============================================================ */
                <div className="space-y-4">
                  {(activeJourney === 'outbound' ? filteredOutboundFlights : filteredInboundFlights).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No {activeJourney === 'outbound' ? 'outbound' : 'return'} flights found.
                      </p>
                    </div>
                  ) : (
                    (activeJourney === 'outbound' ? filteredOutboundFlights : filteredInboundFlights).map((flight, idx) => (
                      <FlightCard
                        key={`${flight.id}-${idx}`}
                        flight={flight}
                        onSelect={(f) => {
                          // FULL offer -> immediately call OfferPrice (even from PARTIAL Mode UI)
                          if (f._raw?.matchResult === 'FULL') {
                            handleSelectFlight(f);
                          } else if (activeJourney === 'outbound') {
                            handleSelectOutbound(f);
                          } else {
                            handleSelectInbound(f);
                          }
                        }}
                        loading={offerPriceLoading && selectedFlight?.id === flight.id}
                      />
                    ))
                  )}
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Search Results</h3>
                  <p className="text-gray-500">No flights match your search criteria.</p>
                </div>
              ) : (
                /* FULL Mode: standard flight list */
                <div className="space-y-4">
                  {filteredFlights.map((flight, idx) => (
                    <FlightCard
                      key={`${flight.id}-${idx}`}
                      flight={flight}
                      onSelect={handleSelectFlight}
                      loading={offerPriceLoading && selectedFlight?.id === flight.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />

      {/* ============================================================ */}
      {/* PARTIAL Mode: Bottom Fixed Bar (confirm selection button) */}
      {/* z-[100] ensures it appears above other elements; minHeight ensures minimum height */}
      {/* ============================================================ */}
      {isPartialMode && (outboundFlight || inboundFlight) && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-2xl z-[100]"
          style={{ minHeight: '80px' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Estimated Total</div>
              <div className="text-2xl font-bold text-primary">
                {((outboundFlight?.price || 0) + (inboundFlight?.price || 0)).toLocaleString()}{' '}
                {outboundFlight?.currency || inboundFlight?.currency || 'KRW'}
              </div>
              <div className="text-xs text-gray-500">
                {outboundFlight && !inboundFlight && 'Select Return Flight'}
                {!outboundFlight && inboundFlight && 'Select Outbound Flight'}
                {outboundFlight && inboundFlight && 'Outbound + Return Selected'}
              </div>
            </div>
            <button
              onClick={handlePartialOfferPrice}
              disabled={!outboundFlight || !inboundFlight || offerPriceLoading}
              className="px-8 py-3 bg-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-lg"
            >
              {offerPriceLoading ? 'Loading...' : 'Confirm Selection'}
            </button>
          </div>
        </div>
      )}

      {/* OfferPrice Loading Overlay */}
      {offerPriceLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-900 font-medium">Loading fare information...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* PriceBreakdown Modal */}
      {priceBreakdown && (
        <PriceBreakdown
          data={priceBreakdown}
          open={!!selectedFlight || (isPartialMode && !!outboundFlight && !!inboundFlight)}
          onClose={handleClosePriceBreakdown}
          onProceed={handleProceedToBooking}
        />
      )}
    </div>
  );
}

// Helper functions
function getTimeSlot(hour: number): string {
  if (hour < 6) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)h/);
  const hours = match ? parseInt(match[1]) : 0;
  const matchMin = duration.match(/(\d+)m/);
  const minutes = matchMin ? parseInt(matchMin[1]) : 0;
  return hours * 60 + minutes;
}

export default SearchContent;
