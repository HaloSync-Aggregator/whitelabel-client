
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { VALIDATION_PATTERNS } from '@/types/pax-change';

interface ContactChangeFormProps {
  currentEmail?: string;
  currentPhone?: string;
  onSubmit: (data: {
    email?: string;
    phone?: { countryCode?: string; number: string };
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const COUNTRY_CODES = [
  { code: '82', label: 'South Korea (+82)' },
  { code: '1', label: 'United States/Canada (+1)' },
  { code: '81', label: 'Japan (+81)' },
  { code: '86', label: 'China (+86)' },
  { code: '65', label: 'Singapore (+65)' },
  { code: '44', label: 'UK (+44)' },
  { code: '49', label: 'Germany (+49)' },
  { code: '33', label: 'France (+33)' },
];

export default function ContactChangeForm({
  currentEmail = '',
  currentPhone = '',
  onSubmit,
  onCancel,
  isSubmitting,
}: ContactChangeFormProps) {
  // Parse existing phone number into country code and number
  const parsePhone = (phone: string): { countryCode: string; number: string } => {
    if (!phone) return { countryCode: '82', number: '' };
    const match = phone.match(/^\+?(\d{1,3})-?(.*)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }
    return { countryCode: '82', number: phone };
  };

  const parsedPhone = parsePhone(currentPhone);

  const [email, setEmail] = useState(currentEmail);
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsedPhone.number);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow numbers, +, - only
    const cleaned = value.replace(/[^\d+\-\s]/g, '');
    setPhoneNumber(cleaned);
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (email && !VALIDATION_PATTERNS.EMAIL.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (phoneNumber && !VALIDATION_PATTERNS.PHONE.test(phoneNumber)) {
      newErrors.phone = 'Phone number can only contain numbers, +, and -.';
    }

    if (!email && !phoneNumber) {
      newErrors.general = 'Please enter at least one of email or phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      email: email || undefined,
      phone: phoneNumber ? { countryCode, number: phoneNumber } : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {errors.general}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="example@email.com"
          className={cn(
            'w-full px-3 py-2 border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
            errors.email ? 'border-red-500' : 'border-border'
          )}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Phone number */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Phone number
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-40 px-3 py-2 border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="010-1234-5678"
            className={cn(
              'flex-1 px-3 py-2 border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
              errors.phone ? 'border-red-500' : 'border-border'
            )}
            disabled={isSubmitting}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* Preview */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <p className="text-sm text-muted">Contact after change</p>
        {email && <p className="text-sm text-foreground">Email: {email}</p>}
        {phoneNumber && (
          <p className="text-sm text-foreground">Phone: +{countryCode}-{phoneNumber}</p>
        )}
        {!email && !phoneNumber && (
          <p className="text-sm text-muted italic">Please enter contact information</p>
        )}
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
          {isSubmitting ? 'Changing...' : 'Change Contact'}
        </button>
      </div>
    </form>
  );
}
