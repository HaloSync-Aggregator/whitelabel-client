// @template PassengerList
// @version 4.0.0 (synced from template)
// @description Template for booking/PassengerList.tsx

/**
 * PassengerList Component
 * @version 3.13.0
 *
 * Passenger List: Name, Phone(multiple items), TicketNumber Display
 * v3.13.0: to contactDetails multiple items's Phone/Email Display Support
 */

import React, { useState } from 'react';
import { PassengerInfo, ContactDetail } from '@/types/booking';

interface PassengerListProps {
  passengers: PassengerInfo[];
  isTicketed: boolean;
}

// Phone number List Component
function PhoneList({ contactDetails }: { contactDetails?: ContactDetail[] }) {
  const allPhones = contactDetails?.flatMap(cd =>
    cd.phones.map(p => ({ ...p, contactInfoId: cd.contactInfoId }))
  ) || [];

  if (allPhones.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-muted text-xs font-medium">Phone</span>
      {allPhones.map((phone, idx) => (
        <div key={`${phone.contactInfoId}-phone-${idx}`} className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-foreground text-sm">{phone.formatted || phone.phoneNumber}</span>
        </div>
      ))}
    </div>
  );
}

// Email list Component
function EmailList({ contactDetails }: { contactDetails?: ContactDetail[] }) {
  const allEmails = contactDetails?.flatMap(cd =>
    cd.emails.map(e => ({ ...e, contactInfoId: cd.contactInfoId }))
  ) || [];

  if (allEmails.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-muted text-xs font-medium">Email</span>
      {allEmails.map((email, idx) => (
        <div key={`${email.contactInfoId}-email-${idx}`} className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-foreground text-sm break-all">{email.emailAddress}</span>
        </div>
      ))}
    </div>
  );
}

export default function PassengerList({ passengers, isTicketed }: PassengerListProps) {
  const [expandedPax, setExpandedPax] = useState<Set<string>>(new Set());

  const toggleExpanded = (paxId: string) => {
    setExpandedPax(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paxId)) {
        newSet.delete(paxId);
      } else {
        newSet.add(paxId);
      }
      return newSet;
    });
  };

  if (!passengers || passengers.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Passenger information</h3>
        <p className="text-muted">Passenger information is not available.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Passenger information</h3>

      <div className="space-y-4">
        {passengers.map((passenger, idx) => {
          const hasContactDetails = passenger.contactDetails && passenger.contactDetails.length > 0;
          const totalPhones = passenger.contactDetails?.reduce((sum, cd) => sum + cd.phones.length, 0) || 0;
          const totalEmails = passenger.contactDetails?.reduce((sum, cd) => sum + cd.emails.length, 0) || 0;
          const hasMultipleContacts = totalPhones > 1 || totalEmails > 1;
          const isExpanded = expandedPax.has(passenger.paxId);

          return (
            <div
              key={passenger.paxId}
              className="p-4 bg-background rounded-lg border border-border"
            >
              {/* Header: Name & Type */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>

                  {/* Name */}
                  <div>
                    <div className="font-semibold text-foreground">
                      {passenger.title && `${passenger.title} `}
                      {passenger.fullName || `${passenger.property}/${passenger.givenName}`}
                    </div>
                    <div className="text-sm text-muted">
                      {passenger.ptcLabel}
                      {passenger.birthdate && ` | ${passenger.birthdate}`}
                      {passenger.gender && ` | ${passenger.gender === 'MALE' ? 'Male' : 'Female'}`}
                    </div>
                  </div>
                </div>

                {/* PTC Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  passenger.ptc === 'ADT'
                    ? 'bg-blue-100 text-blue-800'
                    : passenger.ptc === 'CHD'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {passenger.ptcLabel}
                </span>
              </div>

              {/* Contact Info - v3.13.0: contactDetails based Display */}
              {hasContactDetails ? (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-muted">
                      Phone Information
                      {hasMultipleContacts && (
                        <span className="ml-1 text-primary">
                          ({totalPhones}items Phone, {totalEmails}items Email)
                        </span>
                      )}
                    </div>
                    {hasMultipleContacts && (
                      <button
                        onClick={() => toggleExpanded(passenger.paxId)}
                        className="text-xs text-primary hover:underline"
                      >
                        {isExpanded ? 'Collapse' : 'All/Totalview'}
                      </button>
                    )}
                  </div>

                  {/* Default Display: first Phone only or when Expanded All/Total */}
                  {isExpanded || !hasMultipleContacts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PhoneList contactDetails={passenger.contactDetails} />
                      <EmailList contactDetails={passenger.contactDetails} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {passenger.mobile && (
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-foreground">{passenger.mobile}</span>
                          {totalPhones > 1 && <span className="text-xs text-muted">+{totalPhones - 1}</span>}
                        </div>
                      )}
                      {passenger.email && (
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-foreground truncate">{passenger.email}</span>
                          {totalEmails > 1 && <span className="text-xs text-muted">+{totalEmails - 1}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: contactDetails absent - Existing Single Phone Display */
                (passenger.mobile || passenger.email) && (
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    {passenger.mobile && (
                      <div>
                        <span className="text-muted">Phone: </span>
                        <span className="text-foreground">{passenger.mobile}</span>
                      </div>
                    )}
                    {passenger.email && (
                      <div>
                        <span className="text-muted">Email: </span>
                        <span className="text-foreground">{passenger.email}</span>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* APIS Info (Passport) */}
              {passenger.apisInfo && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs font-medium text-muted mb-2">Passport Information</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted">Passport Number: </span>
                      <span className="text-foreground font-mono">
                        {passenger.apisInfo.passportNumber.substring(0, 2)}****{passenger.apisInfo.passportNumber.slice(-2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Nationality: </span>
                      <span className="text-foreground">{passenger.apisInfo.nationality}</span>
                    </div>
                    <div>
                      <span className="text-muted">Expiry date: </span>
                      <span className="text-foreground">{passenger.apisInfo.expiryDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FFN Info (Mileage) */}
              {passenger.ffn && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-muted">Mileage:</span>
                    <span className="text-foreground font-medium">{passenger.ffn.programCode}</span>
                    <span className="text-foreground">{passenger.ffn.memberNumber}</span>
                  </div>
                </div>
              )}

              {/* Accompanying Infant */}
              {passenger.accompanyingInfant && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-muted">Accompanying Infant:</span>
                    <span className="text-foreground">{passenger.accompanyingInfant}</span>
                  </div>
                </div>
              )}

              {/* Ticket Number (if ticketed) */}
              {isTicketed && passenger.ticketNumber && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-muted">Ticket Number:</span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {passenger.ticketNumber}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
