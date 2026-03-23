/**
 * @template pax-change-service
 * @description Passenger info change service - carrier-specific OrderChange logic
 * @version 4.1.0
 */

/**
 * @version 2.0.0 (extracted from route.ts for Vite migration)
 * @description OrderChange Service - Passenger information Change
 *
 * ============================================================
 * ⚠️ CRITICAL: camelCase Structure! Sender/Query No wrapper!
 * ============================================================
 *
 * ⭐ Per carrier ChangeOrderChoice / UpdatePax Configuration
 * | Carrier | Task Mode | UpdatePax Structure |
 * |--------|----------|----------------|
 * | AF, KL | MODIFY only | currentPaxRefId only |
 * | AY | ADD/DELETE only | Add: newPaxRefId, Delete: currentPaxRefId |
 * | HA, TK, KE | All | Add: newPaxRefId, Delete: currentPaxRefId, Change: Both |
 *
 * ⚠️ v3.12.6: AY Contact ADD follows NDC Spec section 4.2
 * ⚠️ v3.12.7: ContactInfoID Newly Createnot notand Existing ID Re-Use!
 * - Mobile ADD → 1th ID (index 0)
 * - Email ADD → 2th ID (index 1)
 * - Both → 1th ID (index 0)
 * - full Individual Block Required (birthdate, gender, nameTitle, etc.)
 * - ContactInfoRefID OrderViewRS's Existing List to as-is Use
 * ============================================================
 */

import { orderChange } from '@/lib/api/middleware-client';
import {
  type AnyPaxChangeRequest,
  type PaxChangeResponse,
  type PaxActionType,
  type PaxChangeMode,
  type PaxChangeType,
  getCarrierPaxChangeFeatures,
  validatePaxChangeData,
} from '@/types/pax-change';
import { ERROR_MESSAGES } from '@/lib/error-messages';

// ============================================================
// Error Handling
// ============================================================

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ============================================================
// Types
// ============================================================

// ⚠️ v3.13.0: Contact Detail Information (per ContactInfoRefID)
interface ContactDetailFromOrder {
  contactInfoId: string;
  phones: { phoneNumber: string; countryDialingCode?: string }[];
  emails: { emailAddress: string }[];
}

// ⚠️ NDC Spec: Passenger information retrieved from OrderViewRS
export interface PaxInfoFromOrder {
  property: string;
  givenName: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE';
  title?: string;
  ptc: 'ADT' | 'CHD' | 'INF';
  email?: string;
  mobile?: string;
  // ⚠️ NDC Spec section 4.2: Contact when ADD OrderViewRS's Existing ContactInfoRefID List Required!
  contactInfoRefIds?: string[];
  // ⚠️ v3.13.0: Contact Detail Information (multiple items's Contact/Email Support)
  // Use to select specific ContactInfoID during pax-change
  contactDetails?: ContactDetailFromOrder[];
  apisInfo?: {
    passportNumber: string;
    nationality: string;
    expiryDate: string;
  };
  ffn?: {
    programCode: string;
    memberNumber: string;
  };
  docaInfo?: {
    street?: string;
    cityName?: string;
    postalCode?: string;
    countryCode?: string;
  };
}

interface OrderChangeResponse {
  ResultMessage?: {
    Code: string;
    Message?: string;
  };
  TransactionID?: string;
  Order?: {
    OrderID: string;
  };
}

interface UpdatePaxItem {
  currentPaxRefId?: string;
  newPaxRefId?: string;
}

// ⚠️ CRITICAL: NDC Spec + OpenAPI Spec combined!
// - middleName: NDC from Spec Empty array required (All Carrier)
// - individualId: AF, KL, from AY Required (paxId and Same Value)
interface IndividualInfo {
  individualId?: string; // NDC Spec: AF, KL, from AY Required (paxId Value Use)
  nameTitle?: string;
  givenName: string[]; // Required!
  middleName?: string[]; // NDC Spec: Empty array required!
  surname: string; // Required! (MW field name: surname, not property)
  birthdate?: string;
  gender?: string; // MALE or FEMALE (Uppercase!)
}

// ⚠️ NDC Spec: in IdentityDoc Add Field Required
interface IdentityDocItem {
  identityDocType?: string;
  identityDocId?: string;
  expiryDate?: string;
  issuingCountryCode?: string;
  citizenshipCountryCode?: string;
  residenceCountryCode?: string; // NDC Spec: from AY Use
  gender?: string; // NDC Spec: AF, from KL Use
  givenName?: string[]; // NDC Spec: AF, KL, from KE Use
  middleName?: string[]; // NDC Spec: Empty array required
  surname?: string; // NDC Spec: AF, KL, from KE Use (MW field name: surname)
  visa?: unknown[]; // NDC Spec: Empty array required
}

interface LoyaltyProgramItem {
  accountNumber?: string;
  // ⚠️ CRITICAL: OpenAPI Spec programCode Use! (loyaltyProgramProviderName Not!)
  programCode?: string;
}

interface PaxListItem {
  paxId: string;
  ptc: 'ADT' | 'CHD' | 'INF';
  individual?: IndividualInfo;
  contactInfoRefId?: string[];
  identityDoc?: IdentityDocItem[];
  loyaltyProgramAccount?: LoyaltyProgramItem[];
}

interface PhoneItem {
  countryDialingCode?: string;
  phoneNumber?: string;
}

interface PostalAddressItem {
  street?: string[];
  cityName?: string;
  postalCode?: string;
  countryCode?: string;
}

interface ContactInfoItem {
  contactInfoId: string;
  emailAddress?: string[];
  phone?: PhoneItem[];
  postalAddress?: PostalAddressItem[];
}

// ⚠️ CRITICAL: camelCase Request structure! Sender/Query No wrapper!
interface OrderChangeRequestBody {
  transactionId: string;
  orderId: string;
  changeOrderChoice: {
    updatePax: UpdatePaxItem[];
  };
  paxList: PaxListItem[];
  contactInfoList: ContactInfoItem[];
  paymentList?: unknown[];
}

// ============================================================
// Service Parameters and Response
// ============================================================

export interface ChangePaxParams {
  orderId: string;
  transactionId: string;
  paxId: string;
  changeType: PaxChangeType;
  action: PaxActionType;
  carrierCode?: string;
  data: Record<string, unknown>;
  paxInfo?: PaxInfoFromOrder;
}

// ============================================================
// Validation Helper
// ============================================================

function validateActionForCarrier(action: PaxActionType, mode: PaxChangeMode): string | null {
  switch (mode) {
    case 'MODIFY_ONLY':
      if (action !== 'MODIFY') {
        return ERROR_MESSAGES.PAX_ADD_DELETE_NOT_SUPPORTED;
      }
      break;
    case 'ADD_DELETE_ONLY':
      if (action === 'MODIFY') {
        return ERROR_MESSAGES.PAX_MODIFY_NOT_SUPPORTED;
      }
      break;
    // 'ALL' mode allows all operations
  }
  return null;
}

// ============================================================
// Request Builder (camelCase! No wrapper!)
// ============================================================

function buildOrderChangeRequest(
  transactionId: string,
  orderId: string,
  changeRequest: AnyPaxChangeRequest & { action: PaxActionType },
  mode: PaxChangeMode,
  paxInfo?: PaxInfoFromOrder // ⚠️ NDC Spec: OrderViewRS Passenger information
): OrderChangeRequestBody {
  const { paxId, changeType, data, action } = changeRequest;

  // ⚠️ CRITICAL: camelCase Structure! Sender/Query No wrapper!
  const request: OrderChangeRequestBody = {
    transactionId,
    orderId,
    changeOrderChoice: {
      updatePax: [],
    },
    paxList: [],
    contactInfoList: [],
    paymentList: [],
  };

  // ============================================================
  // UpdatePax Configuration (Carrier-specific branching) - camelCase!
  // ============================================================
  const newPaxId = `${paxId}-1`;

  switch (mode) {
    case 'MODIFY_ONLY':
      // AF, KL: currentPaxRefId
      request.changeOrderChoice.updatePax = [
        { currentPaxRefId: paxId }
      ];
      break;

    case 'ADD_DELETE_ONLY':
      // AY: Add newPaxRefId, Delete currentPaxRefId
      if (action === 'ADD') {
        request.changeOrderChoice.updatePax = [
          { newPaxRefId: paxId }
        ];
      } else {
        request.changeOrderChoice.updatePax = [
          { currentPaxRefId: paxId }
        ];
      }
      break;

    case 'ALL':
      // HA, TK, KE: TaskDepending on different
      if (action === 'ADD') {
        request.changeOrderChoice.updatePax = [
          { newPaxRefId: paxId }
        ];
      } else if (action === 'DELETE') {
        request.changeOrderChoice.updatePax = [
          { currentPaxRefId: paxId }
        ];
      } else {
        // MODIFY: Both Use
        request.changeOrderChoice.updatePax = [
          { currentPaxRefId: paxId, newPaxRefId: newPaxId }
        ];
      }
      break;
  }

  // ============================================================
  // PaxList / ContactInfoList Configuration (Change per Type) - camelCase!
  // ============================================================

  switch (changeType) {
    case 'NAME': {
      const nameData = data as { property: string; givenName: string; title?: string };

      // ⚠️ NDC Spec: middleName: [] Required, individualId Per carrier Required
      // AF, KL: individualId Required ("ID1", "ID2" etc.)
      // KE, HA, TK: works even without individualId
      // AY: individualId = paxId

      // ⚠️ CRITICAL: from paxInfo birthdate, gender Import (OrderRetrieve Response Data)
      const birthdate = paxInfo?.birthdate;
      const gender = paxInfo?.gender;
      const ptc = paxInfo?.ptc || 'ADT';

      if (mode === 'ALL' && action === 'MODIFY') {
        // KE, HA, TK: CurrentPaxRefID + NewPaxRefID Pattern
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            individual: {
              surname: nameData.property,
              givenName: [nameData.givenName],
              middleName: [], // NDC Spec required!
              ...(birthdate && { birthdate }),
              ...(gender && { gender }),
            },
          },
          {
            paxId: newPaxId,
            ptc: ptc,
            individual: {
              surname: nameData.property,
              givenName: [nameData.givenName],
              middleName: [], // NDC Spec required!
              ...(nameData.title && { nameTitle: nameData.title }),
              ...(birthdate && { birthdate }),
              ...(gender && { gender }),
            },
          },
        ];
      } else {
        // ⚠️ CRITICAL: NDC from Spec middleName: [] Required!
        // AF, KL: individualId Use (ID1, ID2 format), AY: paxId Use
        const needsIndividualId = ['AF', 'KL', 'AY'].includes(changeRequest.carrierCode || '');
        const individualIdValue = ['AF', 'KL'].includes(changeRequest.carrierCode || '')
          ? paxId.replace('PAX', 'ID') // PAX1 → ID1
          : paxId; // AY: PAX1 as-is

        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            individual: {
              ...(needsIndividualId && { individualId: individualIdValue }),
              surname: nameData.property,
              givenName: [nameData.givenName],
              middleName: [], // NDC Spec required!
              ...(nameData.title && { nameTitle: nameData.title }),
              ...(birthdate && { birthdate }),
              ...(gender && { gender }),
            },
          },
        ];
      }
      break;
    }

    case 'CONTACT': {
      // ⚠️ v3.13.2: When DELETE, include delete/retain information
      const contactData = data as {
        email?: string;
        phone?: { countryCode?: string; number: string };
        // for DELETE Field
        contactInfoId?: string; // Delete Target ContactInfoID
        deletePhones?: string[]; // Delete PhoneNumber List (logging)
        deleteEmails?: string[]; // Delete Email List (logging)
        // ⚠️ v3.13.2: NDC Spec section 4.3 - to keep Item (Actual API in Request Use)
        keepPhones?: string[]; // after Delete to keep PhoneNumber List
        keepEmails?: string[]; // after Delete to keep Email List
      };

      // ⚠️ CRITICAL: from paxInfo Passenger information Import (OrderRetrieve Response Data)
      // NDC Spec section 4.2: AY Contact Info when ADD full Individual Block Required!
      const property = paxInfo?.property || '';
      const givenName = paxInfo?.givenName || '';
      const birthdate = paxInfo?.birthdate;
      const gender = paxInfo?.gender;
      const title = paxInfo?.title;
      const ptc = paxInfo?.ptc || 'ADT';
      // ⚠️ NDC Spec section 4.2: OrderViewRS's Existing ContactInfoRefID List to as-is Use!
      const existingContactInfoRefIds = paxInfo?.contactInfoRefIds || [];

      // ⚠️ NDC Spec: ContactInfoID Pattern Per to carrier different
      // AF, KL: CTC1, CTC2 etc.
      // KE: CI1, CI1-1 etc.
      // AY: CTCPAX1_1, CTCPAX1_2 etc.
      const carrierCode = changeRequest.carrierCode || 'AY';

      const emails = contactData.email ? [contactData.email] : [];
      const phones: PhoneItem[] = contactData.phone ? [{
        countryDialingCode: contactData.phone.countryCode,
        phoneNumber: contactData.phone.number,
      }] : [];

      // ✅ v3.13.7: ContactInfoID selection logic (common)
      const selectContactInfoId = (): string => {
        const contactDetails = paxInfo?.contactDetails || [];

        if (existingContactInfoRefIds.length === 0) {
          // Fallback: AF/KL CTC1 format, AY CTCPAX1_1 format, KE/HA/TK CI1 format
          if (['AF', 'KL'].includes(carrierCode)) {
            return `CTC${paxId.replace('PAX', '')}`;
          }
          if (carrierCode === 'AY') {
            return `CTC${paxId}_1`;
          }
          return `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;
        }

        const hasOnlyEmail = emails.length > 0 && phones.length === 0;
        const hasOnlyPhone = phones.length > 0 && emails.length === 0;

        // ⚠️ v3.13.0: If contactDetails exists, select specific ID
        if (contactDetails.length > 0) {
          // Email only Change Case: email exists ContactInfo find
          if (hasOnlyEmail) {
            const emailContactInfo = contactDetails.find(cd => cd.emails && cd.emails.length > 0);
            if (emailContactInfo) return emailContactInfo.contactInfoId;
          }

          // Phone only Change Case: phone exists ContactInfo find
          if (hasOnlyPhone) {
            const phoneContactInfo = contactDetails.find(cd => cd.phones && cd.phones.length > 0);
            if (phoneContactInfo) return phoneContactInfo.contactInfoId;
          }

          // Otherwise or not found: use first ID
          return existingContactInfoRefIds[0];
        }

        // ⚠️ Fallback: existing logic if contactDetails absent
        // Email only Changeand 2th ID if exists 2th ID Use
        if (hasOnlyEmail && existingContactInfoRefIds.length >= 2) {
          return existingContactInfoRefIds[1];
        }

        // Otherwise → use 1st ID
        return existingContactInfoRefIds[0];
      };

      if (mode === 'ALL' && action === 'MODIFY') {
        // KE, HA, TK: CurrentPaxRefID + NewPaxRefID Pattern
        const contactInfoId = ['AF', 'KL'].includes(carrierCode)
          ? `CTC${paxId.replace('PAX', '')}`
          : `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;
        const newContactInfoId = `${contactInfoId}-1`;

        request.contactInfoList = [
          {
            contactInfoId: contactInfoId,
            emailAddress: [],
            phone: [],
            postalAddress: [],
          },
          {
            contactInfoId: newContactInfoId,
            emailAddress: emails,
            phone: phones,
            postalAddress: [],
          },
        ];
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [],
            loyaltyProgramAccount: [],
          },
          {
            paxId: newPaxId,
            ptc: ptc,
            contactInfoRefId: [newContactInfoId],
            identityDoc: [],
            loyaltyProgramAccount: [],
          },
        ];
      } else if (mode === 'ALL' && action === 'DELETE') {
        // ⚠️ v3.13.4: KE, HA, TK DELETE - follows NDC Spec section 4.3
        // ContactInfoListin after Delete "to keep" Item Includemust be done!
        const contactInfoId = `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;
        const deleteContactInfoId = contactData.contactInfoId || existingContactInfoRefIds[0] || contactInfoId;

        // to keep Contact (from ContactAddDeleteForm Corresponding ContactInfoID Criteriato Calculate)
        const keepPhones = contactData.keepPhones || [];
        const keepEmails = contactData.keepEmails || [];

        if (import.meta.env.DEV) {
          console.log('[PaxChange Service] ALL mode DELETE - ContactInfoID:', deleteContactInfoId);
          console.log('[PaxChange Service] ALL mode DELETE - All ContactInfoRefIDs:', existingContactInfoRefIds);
          console.log('[PaxChange Service] ALL mode DELETE - Phones to delete:', contactData.deletePhones);
          console.log('[PaxChange Service] ALL mode DELETE - Emails to delete:', contactData.deleteEmails);
          console.log('[PaxChange Service] ALL mode DELETE - Phones to KEEP:', keepPhones);
          console.log('[PaxChange Service] ALL mode DELETE - Emails to KEEP:', keepEmails);
        }

        // ⚠️ v3.13.4: PhoneNumber Parsing (AY and Same Logic)
        const keepPhoneItems: PhoneItem[] = keepPhones.map(phoneStr => {
          let cleaned = phoneStr.replace(/[-\s]/g, '');
          if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
          }

          let countryCode: string | undefined;
          let phoneNumber: string;

          if (cleaned.startsWith('82') && cleaned.length >= 11) {
            countryCode = '82';
            phoneNumber = cleaned.substring(2);
          } else if (cleaned.startsWith('81') && cleaned.length >= 11) {
            countryCode = '81';
            phoneNumber = cleaned.substring(2);
          } else if (cleaned.startsWith('1') && cleaned.length >= 11) {
            countryCode = '1';
            phoneNumber = cleaned.substring(1);
          } else {
            phoneNumber = cleaned;
          }

          return {
            ...(countryCode && { countryDialingCode: countryCode }),
            phoneNumber: phoneNumber,
          };
        });

        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            // ⚠️ v3.13.4: All ContactInfoRefID Include!
            contactInfoRefId: existingContactInfoRefIds.length > 0 ? existingContactInfoRefIds : [deleteContactInfoId],
            identityDoc: [],
            loyaltyProgramAccount: [],
          },
        ];

        request.contactInfoList = [
          {
            contactInfoId: deleteContactInfoId,
            emailAddress: keepEmails,
            phone: keepPhoneItems,
            postalAddress: [],
          },
        ];
      } else if (mode === 'ALL' && action === 'ADD') {
        // ⚠️ v3.13.4: KE, HA, TK ADD
        const contactInfoId = `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;
        const contactInfoIdToUse = existingContactInfoRefIds[0] || contactInfoId;

        if (import.meta.env.DEV) {
          console.log('[PaxChange Service] ALL mode ADD - ContactInfoID:', contactInfoIdToUse);
          console.log('[PaxChange Service] ALL mode ADD - Adding emails:', emails);
          console.log('[PaxChange Service] ALL mode ADD - Adding phones:', phones);
        }

        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: existingContactInfoRefIds.length > 0 ? existingContactInfoRefIds : [contactInfoIdToUse],
            identityDoc: [],
            loyaltyProgramAccount: [],
          },
        ];

        request.contactInfoList = [
          {
            contactInfoId: contactInfoIdToUse,
            emailAddress: emails,
            phone: phones,
            postalAddress: [],
          },
        ];
      } else if (mode === 'ADD_DELETE_ONLY') {
        // ⚠️ NDC Spec section 4.2: AY Contact Info ADD/DELETE
        // when ADD full Individual Block + OrderViewRS's Existing ContactInfoRefID List Required!
        // ⚠️ CRITICAL (v3.12.7): ContactInfoID Newly Createnot notand Existing ID Re-Use!
        // - Mobile ADD → 1th ID (index 0)
        // - Email ADD → 2th ID (index 1)
        // - Both → 1th ID (index 0)

        // ✅ v3.13.0: Select ContactInfoID specifically from contactDetails
        // Find ContactInfo ID that contains the content to change (phone/email)
        const contactInfoIdToUse = selectContactInfoId();

        if (action === 'ADD') {
          // ⚠️ NDC Spec section 4.2: AY Contact when ADD full Individual Block Required!
          request.paxList = [
            {
              paxId: paxId,
              ptc: ptc,
              individual: {
                individualId: paxId, // ⚠️ AY: paxId and Same
                surname: property,
                givenName: givenName ? [givenName] : [],
                middleName: [], // NDC Spec required!
                ...(birthdate && { birthdate }),
                ...(gender && { gender }),
                ...(title && { nameTitle: title }),
              },
              // ⚠️ NDC Spec section 4.2: OrderViewRS's Existing ContactInfoRefID List to as-is Use!
              contactInfoRefId: existingContactInfoRefIds,
              identityDoc: [],
              loyaltyProgramAccount: [],
            },
          ];

          request.contactInfoList = [
            {
              contactInfoId: contactInfoIdToUse, // ✅ v3.12.7: Existing ID Re-Use!
              emailAddress: emails,
              phone: phones,
              postalAddress: [],
            },
          ];
        } else {
          // ⚠️ v3.13.3: DELETE - follows NDC Spec section 4.3
          // ContactInfoListin after Delete "to keep" Item Includemust be done!
          const deleteContactInfoId = contactData.contactInfoId || existingContactInfoRefIds[0];

          // to keep Contact (from ContactAddDeleteForm Corresponding ContactInfoID Criteriato Calculate)
          const keepPhones = contactData.keepPhones || [];
          const keepEmails = contactData.keepEmails || [];

          if (import.meta.env.DEV) {
            console.log('[PaxChange Service] DELETE - ContactInfoID:', deleteContactInfoId);
            console.log('[PaxChange Service] DELETE - All ContactInfoRefIDs:', existingContactInfoRefIds);
            console.log('[PaxChange Service] DELETE - Phones to delete:', contactData.deletePhones);
            console.log('[PaxChange Service] DELETE - Emails to delete:', contactData.deleteEmails);
            console.log('[PaxChange Service] DELETE - Phones to KEEP:', keepPhones);
            console.log('[PaxChange Service] DELETE - Emails to KEEP:', keepEmails);
          }

          request.paxList = [
            {
              paxId: paxId,
              ptc: ptc,
              individual: {
                individualId: paxId,
                surname: property,
                givenName: givenName ? [givenName] : [],
                middleName: [],
                ...(birthdate && { birthdate }),
                ...(gender && { gender }),
                ...(title && { nameTitle: title }),
              },
              // ⚠️ v3.13.3: All ContactInfoRefID Include! (Change Target only Not!)
              contactInfoRefId: existingContactInfoRefIds,
              identityDoc: [],
              loyaltyProgramAccount: [],
            },
          ];

          // ⚠️ v3.13.3: NDC Spec section 4.3 - in ContactInfoList to keep Item Include!
          // ⚠️ PhoneNumber parsing priority: "+82-1012341234" → countryCode: "82", number: "1012341234"
          const keepPhoneItems: PhoneItem[] = keepPhones.map(phoneStr => {
            let cleaned = phoneStr.replace(/[-\s]/g, '');

            if (cleaned.startsWith('+')) {
              cleaned = cleaned.substring(1);
            }

            let countryCode: string | undefined;
            let phoneNumber: string;

            if (cleaned.startsWith('82') && cleaned.length >= 11) {
              countryCode = '82';
              phoneNumber = cleaned.substring(2);
            }
            else if (cleaned.startsWith('81') && cleaned.length >= 11) {
              countryCode = '81';
              phoneNumber = cleaned.substring(2);
            }
            else if (cleaned.startsWith('1') && cleaned.length >= 11) {
              countryCode = '1';
              phoneNumber = cleaned.substring(1);
            }
            else {
              phoneNumber = cleaned;
            }

            return {
              ...(countryCode && { countryDialingCode: countryCode }),
              phoneNumber: phoneNumber,
            };
          });

          request.contactInfoList = [
            {
              contactInfoId: deleteContactInfoId,
              emailAddress: keepEmails, // to keep Email
              phone: keepPhoneItems, // to keep PhoneNumber
              postalAddress: [],
            },
          ];
        }
      } else {
        const contactInfoIdToUse = selectContactInfoId();

        request.contactInfoList = [
          {
            contactInfoId: contactInfoIdToUse,
            emailAddress: emails,
            phone: phones,
            postalAddress: [],
          },
        ];

        request.paxList = []; // ⚠️ v3.13.6: AF, KL Contact when Change PaxList empty
      }
      break;
    }

    case 'APIS': {
      const apisData = data as {
        passportNumber: string;
        nationality: string;
        expiryDate: string;
        issuingCountry?: string;
      };

      const carrierCode = changeRequest.carrierCode || 'AY';

      // ⚠️ CRITICAL: from paxInfo Passenger information Import (OrderRetrieve Response Data)
      const property = paxInfo?.property || '';
      const givenName = paxInfo?.givenName || '';
      const birthdate = paxInfo?.birthdate;
      const gender = paxInfo?.gender;
      const ptc = paxInfo?.ptc || 'ADT';

      // ⚠️ NDC Spec: in IdentityDoc Add Field Required
      // AF, KL: gender, givenName, middleName, property, visa Required
      // KE: givenName: [], middleName: [], property, visa Required
      // AY: residenceCountryCode Add
      const identityDoc: IdentityDocItem = {
        identityDocType: 'PT',
        identityDocId: apisData.passportNumber,
        expiryDate: apisData.expiryDate,
        issuingCountryCode: apisData.issuingCountry || apisData.nationality,
        citizenshipCountryCode: apisData.nationality,
        // NDC Spec required Fields - paxInfoimported from
        givenName: givenName ? [givenName] : [],
        middleName: [], // NDC Spec required!
        surname: property,
        visa: [], // NDC Spec required!
        ...(gender && { gender }),
        ...(carrierCode === 'AY' && { residenceCountryCode: apisData.nationality }),
      };

      // ⚠️ NDC Spec: AF, KL Individual Block also Doestogether Pass Required
      const needsIndividual = ['AF', 'KL'].includes(carrierCode);

      if (mode === 'ALL' && action === 'MODIFY') {
        // KE: CurrentPaxRefID + NewPaxRefID Pattern
        const contactInfoId = `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;

        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [{
              ...identityDoc,
              // CurrentPaxRefID: Existing Information
            }],
            loyaltyProgramAccount: [],
          },
          {
            paxId: newPaxId,
            ptc: ptc,
            contactInfoRefId: [`${contactInfoId}-1`],
            identityDoc: [identityDoc],
            loyaltyProgramAccount: [],
          },
        ];
      } else {
        // ⚠️ CRITICAL: Individual Block from paxInfo birthdate exists when only Include
        // birthdate without Individual Block sending 400 Error occurs
        const hasRequiredIndividualFields = birthdate && property && givenName;

        if (needsIndividual && hasRequiredIndividualFields) {
          // AF, KL: Individual Block Include (from paxInfo birthdate, property, givenName Use)
          request.paxList = [
            {
              paxId: paxId,
              ptc: ptc,
              individual: {
                individualId: paxId.replace('PAX', 'ID'),
                givenName: [givenName],
                middleName: [],
                surname: property,
                birthdate: birthdate,
                ...(gender && { gender }),
              },
              contactInfoRefId: [`CTC${paxId.replace('PAX', '')}`],
              identityDoc: [identityDoc],
              loyaltyProgramAccount: [],
            },
          ];
        } else {
          // Individual Block without IdentityDoc only Pass
          request.paxList = [
            {
              paxId: paxId,
              ptc: ptc,
              identityDoc: [identityDoc],
            },
          ];
        }
      }
      break;
    }

    case 'FFN': {
      const ffnData = data as { programCode: string; memberNumber: string };

      // ⚠️ CRITICAL: from paxInfo ptc Import
      const ptc = paxInfo?.ptc || 'ADT';

      // ⚠️ CRITICAL: OpenAPI Spec programCode Use!
      const loyaltyProgram: LoyaltyProgramItem = {
        accountNumber: ffnData.memberNumber,
        programCode: ffnData.programCode,
      };

      // ⚠️ NDC Spec: KE FFN when Add ContactInfoRefId, IdentityDoc Required
      // ContactInfoID Pattern: CI1, CI2, CI3...
      const contactInfoId = `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}`;

      if (mode === 'ALL' && action === 'MODIFY') {
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [],
            loyaltyProgramAccount: [],
          },
          {
            paxId: newPaxId,
            ptc: ptc,
            contactInfoRefId: [`${contactInfoId}-1`],
            identityDoc: [],
            loyaltyProgramAccount: [loyaltyProgram],
          },
        ];
      } else {
        // ⚠️ NDC Spec: KE FFN Add/when Delete ContactInfoRefId, IdentityDoc Required
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [],
            loyaltyProgramAccount: action === 'DELETE' ? [] : [loyaltyProgram],
          },
        ];
      }
      break;
    }

    case 'DOCA': {
      const docaData = data as {
        street: string;
        cityName: string;
        postalCode: string;
        countryCode?: string;
      };

      // ⚠️ CRITICAL: from paxInfo ptc Import
      const ptc = paxInfo?.ptc || 'ADT';

      // ⚠️ NDC Spec: KE CI2 Pattern, HA CI1 Pattern
      const carrierCode = changeRequest.carrierCode || 'KE';
      const contactInfoId = carrierCode === 'KE'
        ? `CI${paxId.replace('PAX', '').replace(/[A-Z]/g, '')}` // PAXFD012 → CI2
        : `CI1`; // HA DefaultValue
      const newContactInfoId = mode === 'ALL' && action === 'MODIFY' ? `${contactInfoId}-1` : contactInfoId;

      const postalAddress: PostalAddressItem[] = action === 'DELETE' ? [] : [{
        street: [docaData.street],
        cityName: docaData.cityName,
        postalCode: docaData.postalCode,
        countryCode: docaData.countryCode || 'KR',
      }];

      if (mode === 'ALL' && action === 'MODIFY') {
        // KE DOCA Change: CurrentPaxRefID + NewPaxRefID Pattern
        request.contactInfoList = [
          {
            contactInfoId: contactInfoId,
            emailAddress: [],
            phone: [],
            postalAddress: [], // Existing Information - empty
          },
          {
            contactInfoId: newContactInfoId,
            emailAddress: [],
            phone: [],
            postalAddress: postalAddress, // new Information
          },
        ];
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [], // NDC Spec required
            loyaltyProgramAccount: [], // NDC Spec required
          },
          {
            paxId: newPaxId,
            ptc: ptc,
            contactInfoRefId: [newContactInfoId],
            identityDoc: [], // NDC Spec required
            loyaltyProgramAccount: [], // NDC Spec required
          },
        ];
      } else {
        // HA DOCA Add/Delete: NewPaxRefID only or CurrentPaxRefID
        request.contactInfoList = [
          {
            contactInfoId: contactInfoId,
            emailAddress: [],
            phone: [],
            postalAddress: postalAddress,
          },
        ];
        request.paxList = [
          {
            paxId: paxId,
            ptc: ptc,
            contactInfoRefId: [contactInfoId],
            identityDoc: [], // NDC Spec required
            loyaltyProgramAccount: [], // NDC Spec required
          },
        ];
      }
      break;
    }
  }

  return request;
}

// ============================================================
// Main Service Function
// ============================================================

export async function changePax(params: ChangePaxParams): Promise<PaxChangeResponse> {
  const { orderId, transactionId, paxId, changeType, action, carrierCode, data, paxInfo } = params;

  // ============================================================
  // ⭐ Validation
  // ============================================================
  if (!orderId) {
    throw new ApiError(ERROR_MESSAGES.TICKETING_REQUIRED_ORDER, 400);
  }

  // ⚠️ CRITICAL: transactionId OrderRetrieve from Response receive Value Required!
  if (!transactionId) {
    throw new ApiError(ERROR_MESSAGES.PAX_REQUIRED_TXN, 400);
  }

  if (!paxId) {
    throw new ApiError(ERROR_MESSAGES.PAX_REQUIRED_ID, 400);
  }

  if (!changeType) {
    throw new ApiError(ERROR_MESSAGES.PAX_REQUIRED_TYPE, 400);
  }

  if (!action) {
    throw new ApiError(ERROR_MESSAGES.PAX_REQUIRED_ACTION, 400);
  }

  // Carrier code
  const effectiveCarrierCode = carrierCode || 'AY';
  const features = getCarrierPaxChangeFeatures(effectiveCarrierCode);

  // Task Mode Verify
  const validationError = validateActionForCarrier(action, features.mode);
  if (validationError) {
    throw new ApiError(validationError, 400);
  }

  // Data Validation
  const validation = validatePaxChangeData(changeType, data, action);
  if (!validation.valid) {
    throw new ApiError(validation.errors.join(' '), 400);
  }

  // ============================================================
  // ⭐ Build OrderChange Request (camelCase! No wrapper!)
  // ⚠️ CRITICAL: transactionId from OrderRetrieve receive Value to as-is Use!
  // ⚠️ CRITICAL: paxInfo OrderRetrieve from the response Passenger information (birthdate, gender, etc.)
  // ============================================================
  const requestBody = {
    paxId,
    changeType,
    action,
    carrierCode: effectiveCarrierCode,
    data,
  };

  const orderChangeRequest = buildOrderChangeRequest(
    transactionId,
    orderId,
    requestBody as AnyPaxChangeRequest & { action: PaxActionType },
    features.mode,
    paxInfo // ⚠️ NDC Spec: OrderViewRS Passenger information Pass!
  );

  if (import.meta.env.DEV) {
    console.log('[PaxChange Service] OrderChange Request:', JSON.stringify(orderChangeRequest, null, 2));
  }

  // ============================================================
  // ⭐ Call middleware backend
  // ============================================================
  const response = await orderChange<OrderChangeResponse>(orderChangeRequest);

  // ============================================================
  // ⭐ Handle response
  // ============================================================
  const resultCode = response.ResultMessage?.Code;
  const isSuccess = resultCode === '00000' || resultCode === '0' || resultCode === 'SUCCESS' || !resultCode;

  if (!isSuccess) {
    if (import.meta.env.DEV) {
      console.error('[PaxChange Service] Error:', response.ResultMessage);
    }
    throw new ApiError(
      response.ResultMessage?.Message || ERROR_MESSAGES.PAX_CHANGE_FAILED,
      400
    );
  }

  return {
    success: true,
    orderId,
    paxId,
    changeType,
    message: 'Passenger information Success-liketo Change.',
  };
}
