/**
 * Status Code and utility Function
 */

import { ActionState, CarrierFeatures } from '@/types/booking';

// Booking Status Label
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    HD: 'BookingPending',
    CONFIRMED: 'BookingComplete',
    TICKETED: 'TicketingComplete',
    CANCELLED: 'Cancellation',
  };
  return map[status] || status;
}

// Booking Status Color
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    HD: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    TICKETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

// Segment Status Label
export function getSegmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    HK: 'Confirmed',
    HD: 'Pending Confirmation',
    HI: 'Issued',
    HN: 'ResponsePending',
    TK: 'Ticket Complete',
    XX: 'Cancellation',
  };
  return map[status] || status;
}

// Passenger Type Label
export function getPtcLabel(ptc: string): string {
  const map: Record<string, string> = {
    ADT: 'Adult',
    CHD: 'Child',
    INF: 'Infant',
  };
  return map[ptc] || ptc;
}

// Airline Name
export function getCarrierName(code: string): string {
  const map: Record<string, string> = {
    SQ: 'Singapore Airlines',
    AF: 'Air France',
    KL: 'KLM Royal Dutch Airlines',
    QR: 'Qatar Airways',
    KE: 'Korean Air',
    OZ: 'Asiana Airlines',
    TG: 'Thai Airways',
    NH: 'All Nippon Airways',
    JL: 'Japan Airlines',
    CX: 'Cathay Pacific',
    EK: 'Emirates',
    LH: 'Lufthansa',
    BA: 'British Airways',
    AA: 'American Airlines',
    UA: 'United Airlines',
    DL: 'Delta Air Lines',
  };
  return map[code] || code;
}

// Cabin class label
export function getCabinLabel(cabinCode: string): string {
  const map: Record<string, string> = {
    Y: 'Economy class',
    W: 'Premium economy',
    C: 'Business class',
    F: 'First',
    M: 'Economy class',
    J: 'Business class',
  };
  return map[cabinCode] || cabinCode;
}

// Carrier feature support Mapping
const carrierFeaturesMap: Record<string, CarrierFeatures> = {
  AF: { infoChange: false, paxSplit: false, journeyChange: true, voidRefund: true },
  KL: { infoChange: false, paxSplit: false, journeyChange: true, voidRefund: true },
  SQ: { infoChange: true, paxSplit: true, journeyChange: true, voidRefund: true },
  QR: { infoChange: true, paxSplit: true, journeyChange: true, voidRefund: true },
  KE: { infoChange: true, paxSplit: false, journeyChange: true, voidRefund: true },
  OZ: { infoChange: true, paxSplit: false, journeyChange: true, voidRefund: true },
};

export function getCarrierFeatures(carrierCode: string): CarrierFeatures {
  return carrierFeaturesMap[carrierCode] || {
    infoChange: true,
    paxSplit: true,
    journeyChange: true,
    voidRefund: true,
  };
}

// Action buttons Status Calculate
export function getActionState(
  carrierCode: string,
  isTicketed: boolean,
  orderStatus: string
): ActionState {
  const features = getCarrierFeatures(carrierCode);
  const isCancelled = orderStatus === 'CANCELLED';

  return {
    canPay: !isTicketed && !isCancelled,
    canCancel: !isTicketed && !isCancelled,
    canVoidRefund: isTicketed && features.voidRefund,
    canChangeJourney: features.journeyChange && !isCancelled,
    canChangeInfo: features.infoChange && !isCancelled,
    canPurchaseService: false,
  };
}

// Date Formatting
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Time Formatting
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  // If in HH:MM format, return as-is
  if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return timeString;
  }
}

// Price Formatting
export function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

// Duration formatting (min → hours minutes)
export function formatDuration(minutes: number): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}Time`;
  return `${hours}Time ${mins}min`;
}
