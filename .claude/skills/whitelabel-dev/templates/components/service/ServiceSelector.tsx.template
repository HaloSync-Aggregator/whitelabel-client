// @template ServiceSelector
// @version 4.0.0 (synced from template)
// @description Template for service/ServiceSelector.tsx


import React, { useState, useMemo, useCallback } from 'react';
import ServiceCard from './ServiceCard';
import {
  ServiceListData,
  ServiceItem,
  SelectedService,
} from '@/types/service';

// ============================================================
// Props
// ============================================================

export interface Passenger {
  paxId: string;
  name: string;
  type: 'ADT' | 'CHD' | 'INF';
  typeLabel: string;
}

interface ServiceSelectorProps {
  serviceData: ServiceListData;
  passengers: Passenger[];
  onConfirm: (selectedServices: SelectedService[]) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// ============================================================
// Component
// ============================================================

export default function ServiceSelector({
  serviceData,
  passengers,
  onConfirm,
  onClose,
  isLoading = false,
}: ServiceSelectorProps) {
  // Current Select Passengers
  const [activePaxIndex, setActivePaxIndex] = useState(0);

  // Selected service: Map<`${paxId}-${offerItemId}`, { service, quantity, weightValue? }>
  // ⭐ serviceId instead offerItemId Use (Same Service라 also to per Segment Different offerItemId)
  // ⭐ weightValue: Weight-based service (XBAG, etc.) InputValue (kg)
  const [selectedMap, setSelectedMap] = useState<Map<string, { service: ServiceItem; quantity: number; weightValue?: number }>>(
    new Map()
  );

  // ⭐ Weight inputValue Is Save (Select before)
  const [, setWeightInputMap] = useState<Map<string, number>>(new Map());

  const activePax = passengers[activePaxIndex];

  // ============================================================
  // All/Total Service list (Tab without in 한번 Display)
  // ============================================================

  const allServices = useMemo(() => {
    return serviceData.allServices || [];
  }, [serviceData.allServices]);

  // ============================================================
  // Service Select/quantity Change Handler
  // ============================================================

  // ⭐ in handleSelect weightValue Parameter Added (Weight-based service)
  const handleSelect = useCallback((service: ServiceItem, weightValue?: number) => {
    if (!activePax) return;

    // ⭐ offerItemId to key Use (to per Segment Different Service Distinction)
    const key = `${activePax.paxId}-${service.offerItemId}`;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        // Already if Select release
        next.delete(key);
      } else {
        // Newly Select
        // Weight input Service: to Parameter Pass weightValue Use (React Batching Issue Prevention)
        // General service: undefined
        const finalWeightValue = service.requiresWeightInput ? weightValue : undefined;
        next.set(key, { service, quantity: 1, weightValue: finalWeightValue });
      }
      return next;
    });
  }, [activePax]);

  const handleQuantityChange = useCallback((service: ServiceItem, quantity: number) => {
    if (!activePax) return;

    const key = `${activePax.paxId}-${service.offerItemId}`;
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) {
        next.delete(key);
        // Weight inputValue also Delete
        setWeightInputMap((wm) => {
          const newWm = new Map(wm);
          newWm.delete(key);
          return newWm;
        });
      } else {
        const existing = prev.get(key);
        next.set(key, { service, quantity, weightValue: existing?.weightValue });
      }
      return next;
    });
  }, [activePax]);

  // ⭐ Weight Change Handler
  const handleWeightChange = useCallback((service: ServiceItem, weight: number) => {
    if (!activePax) return;

    const key = `${activePax.paxId}-${service.offerItemId}`;
    // Weight inputValue Is Save
    setWeightInputMap((prev) => {
      const next = new Map(prev);
      next.set(key, weight);
      return next;
    });
  }, [activePax]);

  // ============================================================
  // Current Passengers's Selected service Confirm
  // ============================================================

  const isServiceSelected = useCallback((paxId: string, offerItemId: string) => {
    const key = `${paxId}-${offerItemId}`;
    return selectedMap.has(key);
  }, [selectedMap]);

  const getSelectionQuantity = useCallback((paxId: string, offerItemId: string) => {
    const key = `${paxId}-${offerItemId}`;
    return selectedMap.get(key)?.quantity || 0;
  }, [selectedMap]);

  // ⭐ Select WeightValue Retrieval
  const getSelectionWeight = useCallback((paxId: string, offerItemId: string) => {
    const key = `${paxId}-${offerItemId}`;
    return selectedMap.get(key)?.weightValue;
  }, [selectedMap]);

  // ============================================================
  // Total Price Calculate
  // ============================================================

  const { totalPrice, currency, totalCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    let cur = 'KRW';

    selectedMap.forEach(({ service, quantity, weightValue }) => {
      // ⭐ Weight-based service: price * weightValue, General service: price * quantity
      if (service.requiresWeightInput && weightValue) {
        total += service.price * weightValue;
      } else {
        total += service.price * quantity;
      }
      count += quantity;
      cur = service.currency;
    });

    return { totalPrice: total, currency: cur, totalCount: count };
  }, [selectedMap]);

  // ============================================================
  // Confirm Process
  // ============================================================

  const handleConfirm = () => {
    if (selectedMap.size === 0) {
      alert('Service Select.');
      return;
    }

    // SelectedService to Array Conversion
    const selectedServices: SelectedService[] = [];

    selectedMap.forEach(({ service, quantity, weightValue }, key) => {
      const [paxId] = key.split('-');
      const pax = passengers.find((p) => p.paxId === paxId);

      // ⭐ debug log
      console.log('[ServiceSelector] Processing service:', {
        key,
        serviceCode: service.serviceCode,
        requiresWeightInput: service.requiresWeightInput,
        weightValue,
        hasBookingInstructions: !!service.bookingInstructions,
        method: service.bookingInstructions?.method,
      });

      if (pax) {
        // ⭐ Weight input Service's Case BookingInstructions Composition
        let bookingInstructions: SelectedService['bookingInstructions'];

        if (service.requiresWeightInput && weightValue && service.bookingInstructions) {
          // Method from Pattern %WVAL% WeightValueto using replacement Text Create
          // e.g.: "TTL\\s?%WVAL%KG" → "TTL10KG"
          const method = service.bookingInstructions.method || '';
          const textValue = method
            .replace('\\s?', '')
            .replace('%WVAL%', weightValue.toString());

          // ⭐ Middleware spec: ositext (lowercase t), ssrCode Exclude
          bookingInstructions = {
            text: [textValue], // e.g.: ["TTL10KG"]
            ositext: [method], // Method Original (e.g.: ["TTL\\s?%WVAL%KG"])
          };

          // ⭐ debug log
          console.log('[ServiceSelector] Built BookingInstructions:', bookingInstructions);
        }

        // ⭐ Weight-based service: price * weightValue, General service: price * quantity
        const calculatedPrice = service.requiresWeightInput && weightValue
          ? service.price * weightValue
          : service.price * quantity;

        selectedServices.push({
          serviceId: service.serviceId,
          offerItemId: service.offerItemId,
          serviceCode: service.serviceCode,
          serviceName: service.serviceName,
          category: service.category,
          paxId: pax.paxId,
          passengerName: pax.name,
          segmentId: service.eligibleSegments[0] || '',
          segmentLabel: service.eligibleSegments.join(', '),
          quantity,
          price: calculatedPrice,
          currency: service.currency,
          weightValue,
          bookingInstructions,
        });
      }
    });

    onConfirm(selectedServices);
  };

  // ============================================================
  // Render
  // ============================================================

  if (allServices.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background w-full max-w-md p-6 rounded-lg shadow-xl text-center">
          <p className="text-muted">Use Available Ancillary service is not available.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="service-selector fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Ancillary Service Selection</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface rounded"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Passenger Select */}
        <div className="p-4 border-b border-border bg-surface">
          <div className="text-sm text-muted mb-2">Passenger Select</div>
          <div className="flex gap-2 flex-wrap">
            {passengers.map((pax, idx) => {
              // Passengers Select Service
              const paxServiceCount = Array.from(selectedMap.keys())
                .filter((key) => key.startsWith(`${pax.paxId}-`)).length;

              return (
                <button
                  key={pax.paxId}
                  onClick={() => setActivePaxIndex(idx)}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${activePaxIndex === idx
                      ? 'bg-primary text-white'
                      : paxServiceCount > 0
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-background text-foreground border border-border'
                    }
                  `}
                >
                  <div className="font-medium">{pax.name}</div>
                  <div className="text-xs opacity-80">
                    {paxServiceCount > 0 ? `${paxServiceCount}items Select` : pax.typeLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service list (All/Total in 한번 Display) */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-muted mb-3">
            Total {allServices.length}items Service
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allServices.map((service) => {
              const isSelected = isServiceSelected(activePax.paxId, service.offerItemId);
              const quantity = getSelectionQuantity(activePax.paxId, service.offerItemId);
              const weightValue = getSelectionWeight(activePax.paxId, service.offerItemId);

              return (
                <ServiceCard
                  key={service.offerItemId}
                  service={service}
                  isSelected={isSelected}
                  quantity={quantity}
                  weightValue={weightValue}
                  onSelect={handleSelect}
                  onQuantityChange={handleQuantityChange}
                  onWeightChange={handleWeightChange}
                />
              );
            })}
          </div>
        </div>

        {/* Selected service Summary */}
        {selectedMap.size > 0 && (
          <div className="p-4 border-t border-border bg-surface">
            <div className="text-sm font-medium mb-2">Selected service</div>
            <div className="space-y-1 max-h-24 overflow-auto">
              {Array.from(selectedMap.entries()).map(([key, { service, quantity, weightValue }]) => {
                const [paxId] = key.split('-');
                const pax = passengers.find((p) => p.paxId === paxId);
                // ⭐ Weight-based service: price * weightValue, General service: price * quantity
                const displayPrice = service.requiresWeightInput && weightValue
                  ? service.price * weightValue
                  : service.price * quantity;

                return (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted">
                      {pax?.name} - {service.serviceNameKr || service.serviceName}
                      {/* Weight-based: xKG, General: xquantity */}
                      {service.requiresWeightInput && weightValue
                        ? <span className="ml-1">x{weightValue}KG</span>
                        : quantity > 1 && <span className="ml-1">x{quantity}</span>
                      }
                    </span>
                    <span className="font-medium text-primary">
                      {displayPrice.toLocaleString()} {service.currency}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Button */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm text-muted">Total Service Fee</span>
              <div className="text-xl font-bold text-primary">
                {totalPrice.toLocaleString()} {currency}
              </div>
            </div>
            <div className="text-sm text-muted">
              {totalCount}items Service Select
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancellation
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || selectedMap.size === 0}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                ${selectedMap.size > 0
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? 'Processing...' : 'Select Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
