// @template ServiceCard
// @version 4.0.0 (synced from template)
// @description Template for service/ServiceCard.tsx


import React, { useState } from 'react';
import { ServiceItem, ServiceCategory } from '@/types/service';

// ============================================================
// Props
// ============================================================

interface ServiceCardProps {
  service: ServiceItem;
  isSelected: boolean;
  quantity: number;
  weightValue?: number; // ⭐ Weight inputValue (kg)
  onSelect: (service: ServiceItem, weightValue?: number) => void; // ⭐ WeightValue Parameter Added
  onQuantityChange: (service: ServiceItem, quantity: number) => void;
  onWeightChange?: (service: ServiceItem, weight: number) => void; // ⭐ Weight Change Handler
  disabled?: boolean;
}

// ============================================================
// Category icon
// ============================================================

const CategoryIcon = ({ category }: { category: ServiceCategory }) => {
  switch (category) {
    case 'baggage':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'cabin':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'lounge':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'meal':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
  }
};

// ============================================================
// Component
// ============================================================

export default function ServiceCard({
  service,
  isSelected,
  quantity,
  weightValue,
  onSelect,
  onQuantityChange,
  disabled = false,
}: ServiceCardProps) {
  // ⭐ Local Weight input Status (Input Being in progress when Use)
  const [localWeight, setLocalWeight] = useState<string>(weightValue?.toString() || '');

  const handleClick = () => {
    if (disabled) return;

    // Weight input Required Service Clickto Select/releasedoes not (Weight after input Select)
    if (service.requiresWeightInput && !isSelected) {
      return; // Weight after input "Select" Buttonto Select
    }

    if (isSelected) {
      // Deselect
      onQuantityChange(service, 0);
      setLocalWeight('');
    } else {
      // Select
      onSelect(service);
    }
  };

  const handleQuantityDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      onQuantityChange(service, quantity - 1);
    } else {
      onQuantityChange(service, 0); // Deselect
      setLocalWeight('');
    }
  };

  const handleQuantityIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuantityChange(service, quantity + 1);
  };

  // ⭐ Weight input Process
  const handleWeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    // Number only for allow (Maximum 3digit)
    if (/^\d{0,3}$/.test(value)) {
      setLocalWeight(value);
    }
  };

  // ⭐ Weight after input Select Button click
  const handleWeightSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const weight = parseInt(localWeight, 10);
    if (!weight || weight <= 0) {
      alert('Weight Input.');
      return;
    }
    if (weight > 100) {
      alert('Maximum 100kg Input Available.');
      return;
    }

    // ⭐ Service when Select WeightValue Directly Pass (React Batching Issue Prevention)
    // onWeightChange more Or more Calldoes not - from handleSelect Directly weightValue Configuration
    onSelect(service, weight);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${service.requiresWeightInput && !isSelected ? 'cursor-default' : 'cursor-pointer'}
        ${disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50'
          : isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-background hover:border-primary/50 hover:shadow-sm'
        }
      `}
    >
      {/* Select Check마크 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* ⭐ Weight input Required Badge */}
      {service.requiresWeightInput && !isSelected && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
            Weight input
          </span>
        </div>
      )}

      {/* Top: Category icon + Service name */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-surface text-muted'}`}>
          <CategoryIcon category={service.category} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {service.serviceNameKr || service.serviceName}
          </h4>
          <p className="text-sm text-muted mt-0.5">
            {service.serviceCode}
            {service.weightOrCount && (
              <span className="ml-2 text-primary font-medium">
                {service.weightOrCount}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="mt-2 text-sm text-muted line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Applied Segment */}
      {service.eligibleSegments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {service.eligibleSegments.map((segment, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 bg-surface text-xs text-muted rounded"
            >
              {segment}
            </span>
          ))}
        </div>
      )}

      {/* ⭐ Weight input UI (requiresWeightInput && !isSelected) */}
      {service.requiresWeightInput && !isSelected && (
        <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted whitespace-nowrap">Weight:</label>
            <div className="flex-1 flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={localWeight}
                onChange={handleWeightInput}
                placeholder="0"
                className="w-16 px-2 py-1.5 text-center border border-border rounded-lg focus:outline-none focus:border-primary"
              />
              <span className="text-sm text-muted">KG</span>
            </div>
            <button
              onClick={handleWeightSelect}
              disabled={!localWeight || parseInt(localWeight) <= 0}
              className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Purchase Weight Input (1~100 KG)
          </p>
        </div>
      )}

      {/* Bottom: Price + quantity 조절 (Weight input Required absent Case or Already Selectif/when) */}
      {(!service.requiresWeightInput || isSelected) && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {service.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted ml-1">
              {service.currency}
            </span>
            {/* ⭐ Select Weight Display */}
            {isSelected && weightValue && (
              <span className="ml-2 text-sm text-orange-600 font-medium">
                ({weightValue}KG)
              </span>
            )}
          </div>

          {/* quantity 조절 (Selectif/when에, Weight input Service quantity 조절 Not possible) */}
          {isSelected && !service.requiresWeightInput && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleQuantityDecrease}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-surface transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={handleQuantityIncrease}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-surface transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}

          {/* Weight input Service if Select release Button */}
          {isSelected && service.requiresWeightInput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuantityChange(service, 0);
                setLocalWeight('');
              }}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Deselect
            </button>
          )}
        </div>
      )}

      {/* Status Badge (SSR Status) */}
      {service.statusLabel && !service.requiresWeightInput && (
        <div className="absolute bottom-2 right-2">
          <span className={`
            px-2 py-0.5 text-xs rounded-full
            ${service.status === 'HK' || service.status === 'HI'
              ? 'bg-green-100 text-green-700'
              : service.status === 'HD'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {service.statusLabel}
          </span>
        </div>
      )}
    </div>
  );
}
