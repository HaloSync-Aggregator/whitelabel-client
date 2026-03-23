
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FfnInfo, PaxActionType } from '@/types/booking';

interface FfnChangeFormProps {
  currentFfn?: FfnInfo;
  carrierCode: string; // Booking carrier code
  action?: PaxActionType; // from Parent Select Task
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

// AF/KL Flying Blue partner airline list
const FLYING_BLUE_PARTNERS = [
  { code: 'AF', label: 'Air France (AF)' },
  { code: 'KL', label: 'KLM (KL)' },
  { code: 'KE', label: 'Korean Air (KE)' },
  { code: 'DL', label: 'Delta Airlines (DL)' },
  { code: 'VS', label: 'Virgin Atlantic (VS)' },
];

export default function FfnChangeForm({
  currentFfn,
  carrierCode,
  action = 'MODIFY',
  onSubmit,
  onCancel,
  isSubmitting,
}: FfnChangeFormProps) {
  const [programCode, setProgramCode] = useState(currentFfn?.programCode || carrierCode);
  const [memberNumber, setMemberNumber] = useState(currentFfn?.memberNumber || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasExistingFfn = !!(currentFfn?.memberNumber);

  const handleMemberNumberChange = (value: string) => {
    // Allow numbers and letters only
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setMemberNumber(cleaned);
    if (errors.memberNumber) {
      setErrors(prev => ({ ...prev, memberNumber: '' }));
    }
  };

  const validate = (): boolean => {
    // DELETE Task Verify not required
    if (action === 'DELETE') {
      return true;
    }

    const newErrors: Record<string, string> = {};

    if (!programCode) {
      newErrors.programCode = 'Please select a mileage program.';
    }

    if (!memberNumber.trim()) {
      newErrors.memberNumber = 'Please enter your member number.';
    } else if (memberNumber.length < 4) {
      newErrors.memberNumber = 'Member number must be at least 4 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (action === 'DELETE') {
      await onSubmit({});
    } else {
      await onSubmit({
        programCode,
        memberNumber: memberNumber.trim(),
      });
    }
  };

  // DELETE Mode
  if (action === 'DELETE') {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <strong>NOTE:</strong> Existing frequent flyer information will be deleted.
        </div>

        {hasExistingFfn && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm text-muted">Frequent flyer information to be deleted</p>
            <p className="text-sm">Program: {currentFfn?.programCode}</p>
            <p className="text-sm">Member Number: {currentFfn?.memberNumber}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2 w-full overflow-hidden">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-w-0 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 min-w-0 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Mileage'}
          </button>
        </div>
      </form>
    );
  }

  // ADD / MODIFY Mode
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Guide:</strong> You can register mileage for the booking airline or a partner airline.
      </div>

      {/* Current frequent flyer info (when MODIFY) */}
      {action === 'MODIFY' && hasExistingFfn && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted mb-1">Current registered mileage</p>
          <p className="text-sm font-medium">
            {currentFfn?.programCode} - {currentFfn?.memberNumber}
          </p>
        </div>
      )}

      {/* Program Select */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Mileage Program <span className="text-red-500">*</span>
        </label>
        <select
          value={programCode}
          onChange={(e) => setProgramCode(e.target.value)}
          className={cn(
            'w-full px-3 py-2 border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
            errors.programCode ? 'border-red-500' : 'border-border'
          )}
          disabled={isSubmitting}
        >
          <option value="">Select Program</option>
          {FLYING_BLUE_PARTNERS.map((partner) => (
            <option key={partner.code} value={partner.code}>
              {partner.label}
            </option>
          ))}
        </select>
        {errors.programCode && (
          <p className="mt-1 text-sm text-red-500">{errors.programCode}</p>
        )}
      </div>

      {/* Member Number */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Member Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={memberNumber}
          onChange={(e) => handleMemberNumberChange(e.target.value)}
          placeholder="e.g.: 1234567890"
          className={cn(
            'w-full px-3 py-2 border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
            errors.memberNumber ? 'border-red-500' : 'border-border'
          )}
          disabled={isSubmitting}
          maxLength={20}
        />
        {errors.memberNumber && (
          <p className="mt-1 text-sm text-red-500">{errors.memberNumber}</p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm text-muted">{action === 'ADD' ? 'Mileage to be added' : 'Mileage after change'}</p>
        <p className="font-medium text-foreground">
          {programCode && memberNumber
            ? `${programCode} - ${memberNumber}`
            : 'Please enter information'}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2 w-full overflow-hidden">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-w-0 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 min-w-0 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : action === 'ADD' ? 'Add Mileage' : 'Update Mileage'}
        </button>
      </div>
    </form>
  );
}
