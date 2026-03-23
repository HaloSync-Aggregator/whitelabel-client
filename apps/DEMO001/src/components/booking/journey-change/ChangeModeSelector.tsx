// @template ChangeModeSelector
// @version 4.0.0 (synced from template)
// @description Template for booking/journey-change/ChangeModeSelector.tsx

// Template v1.1.0 - Journey Change ChangeModeSelector

/**
 * ChangeModeSelector Component
 *
 * Journey change Mode Select (change/add/delete)
 * Per carrier Support Mode filtering Applied
 *
 * v3.24: Journey add/delete restricted to HA, TK only.
 * Other carriers only support 'change' mode.
 */

import { type JourneyChangeMode, getJourneyChangeConfig } from '@/types/journey-change';

interface ChangeModeSelectorProps {
  mode: JourneyChangeMode;
  onChange: (mode: JourneyChangeMode) => void;
  carrierCode: string;
  tripType?: 'RT' | 'OW' | 'MC';
}

const MODE_OPTIONS: {
  value: JourneyChangeMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'change',
    label: 'Journey Change',
    description: 'Change the selected journey to a different flight.',
    icon: '🔄',
  },
  {
    value: 'add',
    label: 'Add Journey',
    description: 'Add a new journey to the booking.',
    icon: '➕',
  },
  {
    value: 'delete',
    label: 'Delete Journey',
    description: 'Remove the selected journey from the booking.',
    icon: '🗑️',
  },
];

/**
 * Filter supported modes per carrier
 * - Journey add/delete: Only HA, TK support (supportsAddDelete)
 * - AF/KL: Round-trip only for change mode
 * - Other carriers: change mode only
 */
function getSupportedModes(carrierCode: string, tripType?: 'RT' | 'OW' | 'MC') {
  const config = getJourneyChangeConfig(carrierCode);

  if (!config) {
    return MODE_OPTIONS.filter(opt => opt.value === 'change');
  }

  // AF/KL: round-trip only, restrict to change mode when not round-trip
  if (!config.supportsOneWay && tripType !== 'RT') {
    return MODE_OPTIONS.filter(opt => opt.value === 'change');
  }

  // Only HA/TK support add/delete
  if (!config.supportsAddDelete) {
    return MODE_OPTIONS.filter(opt => opt.value === 'change');
  }

  return MODE_OPTIONS;
}

export default function ChangeModeSelector({
  mode,
  onChange,
  carrierCode,
  tripType,
}: ChangeModeSelectorProps) {
  const supportedModes = getSupportedModes(carrierCode, tripType);

  // If only 'change' mode is available, auto-select and don't render selector
  if (supportedModes.length === 1 && supportedModes[0].value === 'change') {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900">Change Type</h3>

      <div className="grid grid-cols-3 gap-3">
        {supportedModes.map((option) => {
          const isSelected = mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                p-4 rounded-lg border text-left transition-all
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="text-2xl mb-2">{option.icon}</div>
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          );
        })}
      </div>

      {/* Disabled modes notice */}
      {supportedModes.length < MODE_OPTIONS.length && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          {carrierCode} carrier only supports journey change. Add/Delete is not available for this carrier.
        </p>
      )}
    </div>
  );
}
