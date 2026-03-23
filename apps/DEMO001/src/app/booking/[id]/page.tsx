/**
 * @template booking-detail-page
 * @version 4.1.0
 * @description Booking Detail Page (Vite + React Router)
 *
 * URL: /booking/:id?owner=SQ
 * Features: booking retrieval, PNR detail display, all post-booking modals
 *
 * Navigation: react-router-dom useParams, useSearchParams, useNavigate
 * Service: polarhub-service (getBookingDetail, cancelBooking)
 * No 'use client' directive (Vite SPA)
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import BookingHeader from '@/components/booking/BookingHeader';
import ItineraryCard from '@/components/booking/ItineraryCard';
import PassengerList from '@/components/booking/PassengerList';
import PriceSummary from '@/components/booking/PriceSummary';
import ActionButtons from '@/components/booking/ActionButtons';
import OcnCard from '@/components/booking/OcnCard';
import SsrInfo from '@/components/booking/SsrInfo';
import TicketList from '@/components/booking/TicketList';
import FareRules from '@/components/booking/FareRules';
import PassengerEditModal from '@/components/booking/PassengerEditModal';
import PassengerSplitModal from '@/components/booking/PassengerSplitModal';
import ServicePurchaseModal from '@/components/booking/ServicePurchaseModal';
import TicketingWithServiceModal from '@/components/booking/TicketingWithServiceModal';
import PostTicketingSeatPopup from '@/components/booking/PostTicketingSeatPopup';
import JourneyChangeModal from '@/components/booking/journey-change/JourneyChangeModal';
import { PaymentPopup } from '@/components/payment';
import { type PaymentResult } from '@/types/payment';
import { supportsPaxSplit, canSplit } from '@/types/pax-split';
import { canAddServiceBeforeTicketing, canAddSeatBeforeTicketing } from '@/types/ticketing-with-service';
import { supportsHeldBookingSeat } from '@/types/seat-purchase';
import { supportsJourneyChange, type CurrentItinerary } from '@/types/journey-change';
import { type BookingDetail } from '@/types/booking';
import { getBookingDetail, cancelBooking, ApiError } from '@/lib/api/polarhub-service';
import { ERROR_MESSAGES } from '@/lib/error-messages';

export default function BookingDetailPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showServicePurchaseModal, setShowServicePurchaseModal] = useState(false);
  const [showTicketingWithServiceModal, setShowTicketingWithServiceModal] = useState(false);
  const [showSeatPurchasePopup, setShowSeatPurchasePopup] = useState(false);
  const [showJourneyChangeModal, setShowJourneyChangeModal] = useState(false);

  // owner param from URL (passed via cancel/VoidRefund navigation)
  const owner = searchParams.get('owner');

  // ============================================================
  // Data fetching
  // ============================================================

  const fetchBooking = async () => {
    if (!orderId) {
      setError(ERROR_MESSAGES.BOOKING_NUMBER_MISSING);
      setLoading(false);
      return;
    }

    try {
      const data = await getBookingDetail(orderId);
      setBooking(data);
    } catch (err) {
      console.error('Booking retrieval error:', err);
      const message =
        err instanceof ApiError ? err.message : ERROR_MESSAGES.BOOKING_RETRIEVE_FAILED;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, owner]);

  const refreshBooking = async () => {
    try {
      if (!orderId) return;
      const data = await getBookingDetail(orderId);
      setBooking(data);
    } catch (err) {
      console.error('Booking refresh error:', err);
    }
  };

  // ============================================================
  // Action handlers
  // ============================================================

  const handlePayment = () => {
    if (!booking) return;
    if (booking.isTicketed) {
      alert('This booking has already been ticketed.');
      return;
    }

    const canAddServiceOrSeat =
      canAddServiceBeforeTicketing(booking.carrierCode) ||
      canAddSeatBeforeTicketing(booking.carrierCode);

    if (canAddServiceOrSeat) {
      setShowTicketingWithServiceModal(true);
    } else {
      setShowPaymentPopup(true);
    }
  };

  const handleTicketingWithServiceSuccess = () => {
    setShowTicketingWithServiceModal(false);
    window.location.reload();
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setShowPaymentPopup(false);
    if (result.success) {
      window.location.reload();
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    try {
      await cancelBooking({
        transactionId: booking._orderData.transactionId,
        orderId: booking.orderId,
      });
      alert('Booking has been cancelled.');
      window.location.reload();
    } catch (err) {
      console.error('Booking cancellation error:', err);
      const message = err instanceof ApiError ? err.message : ERROR_MESSAGES.CANCEL_FAILED;
      alert(message);
    }
  };

  const handleVoidRefund = () => {
    if (!booking) return;
    navigate(`/booking/${orderId}/cancel?owner=${booking.carrierCode}`);
  };

  const handleChangeJourney = () => {
    setShowJourneyChangeModal(true);
  };

  const handleJourneyChangeSuccess = () => {
    setShowJourneyChangeModal(false);
    window.location.reload();
  };

  const handleChangeInfo = () => {
    setIsEditModalOpen(true);
  };

  const handleSplitSuccess = (result: { newOrderId?: string; newPnr?: string }) => {
    const pnrMsg = result.newPnr ? `\nNew Booking Reference: ${result.newPnr}` : '';
    alert(`Passenger split complete.${pnrMsg}`);
    window.location.reload();
  };

  const handlePurchaseService = () => {
    if (!booking) return;
    setShowServicePurchaseModal(true);
  };

  const handleServicePurchaseSuccess = () => {
    setShowServicePurchaseModal(false);
    refreshBooking();
  };

  const handleSeatPurchase = () => {
    if (!booking) return;
    setShowSeatPurchasePopup(true);
  };

  const handleSeatPurchaseSuccess = () => {
    setShowSeatPurchasePopup(false);
    refreshBooking();
  };

  const handleOcnAgree = () => {
    console.log('OCN agreed');
  };

  // ============================================================
  // Derived state / computed values
  // ============================================================

  const canShowSplitButton = booking
    ? supportsPaxSplit(booking.carrierCode) &&
      canSplit(booking.passengers.filter((p) => p.ptc !== 'INF').length).canSplit
    : false;

  // Held Booking / post-ticketing seat purchase
  const canPurchasePostTicketingSeat = booking
    ? (booking.isTicketed || (booking.carrierCode === 'TR' && booking.isPaid)) &&
      supportsHeldBookingSeat(booking.carrierCode)
    : false;

  // ============================================================
  // Helper: extract segments for TicketingWithServiceModal
  // ============================================================

  const extractSegments = () => {
    if (!booking) return [];
    return booking.itineraries.flatMap((itinerary) =>
      itinerary.segments.map((segment) => ({
        segmentId:
          segment.segmentId || `${segment.departure.airport}-${segment.arrival.airport}`,
        departure: segment.departure.airport,
        arrival: segment.arrival.airport,
        flightNumber: `${segment.carrierCode}${segment.flightNumber}`,
        departureDate: segment.departure.date,
      }))
    );
  };

  // ============================================================
  // Helper: extract CurrentItinerary[] for JourneyChangeModal
  // ============================================================

  const extractItineraries = (): CurrentItinerary[] => {
    if (!booking) return [];
    const paxJourneys = booking._orderData.paxJourneys || [];
    if (paxJourneys.length === 0) return [];

    // Build segment lookup from booking itineraries
    const segmentMap = new Map<
      string,
      {
        carrierCode: string;
        flightNumber: string;
        origin: string;
        destination: string;
        departureDate: string;
        departureTime: string;
        arrivalDate: string;
        arrivalTime: string;
        status: string;
      }
    >();

    for (const itin of booking.itineraries) {
      for (const seg of itin.segments) {
        segmentMap.set(seg.segmentId, {
          carrierCode: seg.carrierCode,
          flightNumber: seg.flightNumber,
          origin: seg.departure.airport,
          destination: seg.arrival.airport,
          departureDate: seg.departure.date,
          departureTime: seg.departure.time,
          arrivalDate: seg.arrival.date,
          arrivalTime: seg.arrival.time,
          status: seg.status,
        });
      }
    }

    return paxJourneys.map((pj) => {
      const segments = pj.paxSegmentRefIds
        .map((segId) => {
          const seg = segmentMap.get(segId);
          if (!seg) return null;
          return {
            segmentId: segId,
            carrierCode: seg.carrierCode,
            flightNumber: seg.flightNumber,
            origin: seg.origin,
            destination: seg.destination,
            departureDate: seg.departureDate,
            departureTime: seg.departureTime,
            arrivalDate: seg.arrivalDate,
            arrivalTime: seg.arrivalTime,
            status: seg.status,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];

      return {
        paxJourneyId: pj.paxJourneyId,
        orderItemId: pj.orderItemId,
        origin: pj.onPoint || firstSeg?.origin || '',
        destination: pj.offPoint || lastSeg?.destination || '',
        departureDate: firstSeg?.departureDate || '',
        departureTime: firstSeg?.departureTime || '',
        arrivalTime: lastSeg?.arrivalTime || '',
        flightTime: pj.flightTime,
        carrierCode: firstSeg?.carrierCode || booking.carrierCode,
        flightNumber: firstSeg?.flightNumber || '',
        status: firstSeg?.status || 'HK',
        segments,
        serviceIds: pj.serviceIds,
      };
    });
  };

  const detectTripType = (): 'RT' | 'OW' | 'MC' => {
    if (!booking) return 'OW';
    const dirs = booking.itineraries.map((i) => i.direction);
    if (dirs.includes('outbound') && dirs.includes('inbound')) return 'RT';
    if (booking.itineraries.length > 2) return 'MC';
    return 'OW';
  };

  // ============================================================
  // Loading state
  // ============================================================

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Loading booking information...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ============================================================
  // Error state
  // ============================================================

  if (error || !booking) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="text-5xl mb-4 text-red-500">!</div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Booking information not found.
            </h2>
            <p className="text-muted mb-6">
              {error || ERROR_MESSAGES.BOOKING_NOT_AVAILABLE}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ============================================================
  // Main render
  // ============================================================

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Booking Header: PNR, orderId, status, deadlines, createdAt */}
        <BookingHeader
          pnr={booking.pnr}
          orderId={booking.orderId}
          carrierCode={booking.carrierCode}
          carrierName={booking.carrierName}
          status={booking.status}
          statusLabel={booking.statusLabel}
          isTicketed={booking.isTicketed}
          paymentTimeLimit={booking.paymentTimeLimit}
          ticketingTimeLimit={booking.ticketingTimeLimit}
          createdAt={booking.createdAt}
        />

        {/* OCN Card (AF/KL only) */}
        {booking.ocnList && booking.ocnList.length > 0 && (
          <div className="mt-6">
            <OcnCard
              ocnList={booking.ocnList}
              showOcnAgreeButton={booking.showOcnAgreeButton ?? false}
              onAgree={handleOcnAgree}
            />
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left column: Itinerary, Passengers, SSR, Seat, Tickets */}
          <div className="lg:col-span-2 space-y-6">
            <ItineraryCard itineraries={booking.itineraries} />

            <PassengerList
              passengers={booking.passengers}
              isTicketed={booking.isTicketed}
            />

            {/* Passenger Split button */}
            {canShowSplitButton && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSplitModal(true)}
                  className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Passenger Split
                </button>
              </div>
            )}

            {/* SSR / Service groups */}
            {((booking.serviceGroups && booking.serviceGroups.length > 0) ||
              (booking.ssrList && booking.ssrList.length > 0)) && (
              <SsrInfo
                ssrList={booking.ssrList}
                serviceGroups={booking.serviceGroups}
                hasPendingSsr={booking.hasPendingSsr ?? false}
                onPurchaseConfirm={handlePurchaseService}
              />
            )}

            {/* Held/Post-ticketing seat purchase section */}
            {canPurchasePostTicketingSeat && (
              <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Seat Selection</h3>
                    <p className="text-sm text-muted mt-1">
                      Select and change your seat if desired.
                    </p>
                  </div>
                  <button
                    onClick={handleSeatPurchase}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Select Seat
                  </button>
                </div>
              </div>
            )}

            {/* Ticket list (after ticketing) */}
            {booking.tickets && booking.tickets.length > 0 && (
              <TicketList tickets={booking.tickets} />
            )}
          </div>

          {/* Right column: Price summary, Fare rules, Action buttons */}
          <div className="space-y-6">
            <PriceSummary
              price={booking.price}
              extraCharges={booking.serviceCharges?.map((sc) => ({
                label: `${sc.label} (${sc.paxName})`,
                amount: sc.amount,
                count: sc.count,
              }))}
            />

            <FareRules penaltyInfo={booking.penaltyInfo} />

            <ActionButtons
              isTicketed={booking.isTicketed}
              isPaid={booking.isPaid}
              actions={booking.actions}
              orderId={booking.orderId}
              owner={booking.carrierCode}
              hasPendingSsr={booking.hasPendingSsr}
              onPayment={handlePayment}
              onCancel={handleCancel}
              onVoidRefund={handleVoidRefund}
              onChangeJourney={handleChangeJourney}
              onChangeInfo={handleChangeInfo}
              onPurchaseService={handlePurchaseService}
            />
          </div>
        </div>
      </main>
      <Footer />

      {/* ============================================================
          Modals
          ============================================================ */}

      {/* Passenger Edit Modal */}
      {booking.allowedPaxChanges && (
        <PassengerEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          orderId={booking.orderId}
          carrierCode={booking.carrierCode}
          passengers={booking.passengers}
          allowedChanges={booking.allowedPaxChanges}
          departureDate={booking.itineraries[0]?.segments[0]?.departure.date}
          onSuccess={refreshBooking}
          // CRITICAL: reuse transactionId from OrderRetrieve response - do not generate new!
          transactionId={booking._orderData.transactionId}
        />
      )}

      {/* Payment Popup (simple ticketing without service/seat) */}
      {showPaymentPopup && (
        <PaymentPopup
          isOpen={showPaymentPopup}
          onClose={() => setShowPaymentPopup(false)}
          orderInfo={{
            transactionId: booking._orderData.transactionId,
            orderId: booking.orderId,
            pnr: booking.pnr,
            carrierCode: booking.carrierCode,
            originalAmount: booking.price.totalAmount,
            currency: booking.price.currency,
            orderItemRefIds: booking._orderData.orderItemIds,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Passenger Split Modal */}
      {showSplitModal && (
        <PassengerSplitModal
          isOpen={showSplitModal}
          onClose={() => setShowSplitModal(false)}
          orderId={booking.orderId}
          pnr={booking.pnr}
          carrierCode={booking.carrierCode}
          passengers={booking.passengers}
          onSuccess={handleSplitSuccess}
        />
      )}

      {/* Service Purchase Modal (post-ticketing ancillary service add) */}
      {showServicePurchaseModal && (
        <ServicePurchaseModal
          isOpen={showServicePurchaseModal}
          onClose={() => setShowServicePurchaseModal(false)}
          orderId={booking.orderId}
          owner={booking.carrierCode}
          transactionId={booking._orderData.transactionId}
          isTicketed={booking.isTicketed}
          passengers={booking.passengers.map((p) => ({
            paxId: p.paxId,
            name: p.fullName,
            type: p.ptc,
            typeLabel: p.ptcLabel,
          }))}
          onSuccess={handleServicePurchaseSuccess}
        />
      )}

      {/* Ticketing With Service Modal (pre-ticketing: service + seat + ticketing combined) */}
      {showTicketingWithServiceModal && (
        <TicketingWithServiceModal
          isOpen={showTicketingWithServiceModal}
          onClose={() => setShowTicketingWithServiceModal(false)}
          orderId={booking.orderId}
          owner={booking.carrierCode}
          transactionId={booking._orderData.transactionId}
          passengers={booking.passengers.map((p) => ({
            paxId: p.paxId,
            name: p.fullName,
            type: p.ptc,
            typeLabel: p.ptcLabel,
          }))}
          segments={extractSegments()}
          baseFare={booking.price.totalAmount}
          currency={booking.price.currency}
          orderItemRefIds={booking._orderData.orderItemIds}
          onSuccess={handleTicketingWithServiceSuccess}
        />
      )}

      {/* Journey Change Modal */}
      {showJourneyChangeModal && supportsJourneyChange(booking.carrierCode) && (
        <JourneyChangeModal
          isOpen={showJourneyChangeModal}
          onClose={() => setShowJourneyChangeModal(false)}
          orderId={booking.orderId}
          owner={booking.carrierCode}
          transactionId={booking._orderData.transactionId}
          isTicketed={booking.isTicketed}
          itineraries={extractItineraries()}
          tripType={detectTripType()}
          onSuccess={handleJourneyChangeSuccess}
        />
      )}

      {/* Held Booking / Post-Ticketing Seat Purchase Popup */}
      {showSeatPurchasePopup && (
        <PostTicketingSeatPopup
          isOpen={showSeatPurchasePopup}
          onClose={() => setShowSeatPurchasePopup(false)}
          orderId={booking.orderId}
          owner={booking.carrierCode}
          transactionId={booking._orderData.transactionId}
          passengers={booking.passengers.map((p) => ({
            paxId: p.paxId,
            name: p.fullName,
            type: p.ptc,
            typeLabel: p.ptcLabel,
          }))}
          onSuccess={handleSeatPurchaseSuccess}
        />
      )}
    </>
  );
}
