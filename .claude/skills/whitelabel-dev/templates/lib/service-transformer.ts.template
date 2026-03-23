/**
 * ServiceList Response transformer
 *
 * ============================================================
 * Data flow
 * ============================================================
 *
 * ServiceListRS
 * ├── ALaCarteOffer
 * │   ├── OfferID, Owner, ResponseID
 * │   └── ALaCarteOfferItem[] → Service Price/Detail Information
 * │       ├── OfferItemID
 * │       ├── UnitPriceDetail → Price
 * │       ├── Service → Service Detail
 * │       │   ├── ServiceID, ServiceCode
 * │       │   ├── Name, Desc
 * │       │   └── BookingInstructions
 * │       └── Eligibility → Eligibility
 * │           ├── PaxRefID[]
 * │           └── PaxSegmentRefID[]
 * └── DataLists
 *     ├── PaxList → Passenger information
 *     └── PaxSegmentList → Segment information
 *
 * ============================================================
 */

import {
  ServiceListData,
  ServiceItem,
  BookingInstructions,
  getServiceCategory,
  getServiceNameKr,
  extractWeightOrCount,
  CATEGORY_LABELS,
} from '@/types/service';

// ============================================================
// API Response Types
// ============================================================

interface ServiceListResponse {
  ResultMessage?: {
    Code: string;
    Message?: string;
  };
  TransactionID: string;
  ResponseID?: string;
  ALaCarteOffer?: {
    OfferID: string;
    Owner: string;
    ValidatingCarrier?: string;
    ResponseID?: string;
    ALaCarteOfferItem?: Array<{
      OfferItemID: string;
      UnitPriceDetail?: {
        TotalAmount?: {
          Amount: number;
          CurCode: string;
        };
        BaseAmount?: {
          Amount: number;
          CurCode: string;
        };
        TaxTotal?: {
          Amount: number;
          CurCode: string;
        };
      };
      Service?: {
        ServiceID: string;
        ServiceCode?: string;
        Name?: string;
        Desc?: Array<{
          Text?: string;
          DescriptionType?: string;
        }>;
        BookingInstructions?: {
          Text?: string[];
          SsrCode?: string[];
          OsiText?: string[];
        };
        Status?: string;
      };
      Eligibility?: {
        PaxRefID?: string[];
        PaxSegmentRefID?: string[];
      };
    }>;
  };
  // Order Based when retrieval
  AlaCarteOffer?: {
    OfferID: string;
    Owner: string;
    ValidatingCarrier?: string;
    ResponseID?: string;
    AlaCarteOfferItem?: Array<any>;
  };
  DataLists?: {
    PaxList?: Array<{
      PaxID: string;
      PTC: string;
      Individual?: {
        GivenName?: string[];
        Surname?: string;
      };
    }>;
    PaxSegmentList?: Array<{
      PaxSegmentID: string;
      Departure: {
        AirportCode: string;
        Date: string;
        Time: string;
      };
      Arrival: {
        AirportCode: string;
        Date: string;
        Time: string;
      };
      MarketingCarrier: {
        AirlineID: string;
        FlightNumber: string;
      };
    }>;
  };
}

// ============================================================
// Main Transform Function
// ============================================================

export function transformServiceListResponse(
  response: ServiceListResponse
): ServiceListData {
  // ALaCarteOffer or AlaCarteOffer Process
  const offer = response.ALaCarteOffer || response.AlaCarteOffer;

  if (!offer) {
    throw new Error('ALaCarteOffer not found in response');
  }

  const dataLists = response.DataLists;
  const segmentList = dataLists?.PaxSegmentList || [];

  // Segment ID → Label 맵 Create (ICN-SIN)
  const segmentLabelMap = new Map<string, string>();
  segmentList.forEach((seg) => {
    segmentLabelMap.set(
      seg.PaxSegmentID,
      `${seg.Departure.AirportCode}-${seg.Arrival.AirportCode}`
    );
  });

  // OfferItem → ServiceItem Conversion (API response Field name capitalization difference Process)
  const offerItems = (offer as any).ALaCarteOfferItem || (offer as any).AlaCarteOfferItem || [];
  const allServices: ServiceItem[] = [];

  console.log('[ServiceTransformer] OfferItems count:', offerItems.length);

  offerItems.forEach((item: any, idx: number) => {
    // Service Array or Single Object Exists
    const serviceArray = Array.isArray(item.Service) ? item.Service : [item.Service];
    const service = serviceArray[0];
    if (!service) return;

    // ⭐ ServiceCode Service.Definition.in ServiceCode Position
    const definition = service.Definition || {};
    const serviceCode = definition.ServiceCode || service.ServiceCode || '';
    const category = getServiceCategory(serviceCode);

    // bug: 처 5items Service Code Output
    if (idx < 5) {
      console.log(`[ServiceTransformer] Item[${idx}] ServiceCode: "${serviceCode}", Name: "${definition.Name || service.Name}", Category: ${category}`);
    }

    // Price info
    const price = item.UnitPriceDetail?.TotalAmount?.Amount
      || item.UnitPrice?.TotalAmount?.Amount
      || item.UnitPrice?.Amount
      || 0;
    const currency = item.UnitPriceDetail?.TotalAmount?.CurCode
      || item.UnitPrice?.TotalAmount?.CurCode
      || item.UnitPrice?.CurCode
      || 'KRW';

    // Description Combination (Definition.Desc or service.Desc)
    const descArray = definition.Desc || service.Desc || [];
    const description = descArray
      .map((d: any) => d.Text || '')
      .filter(Boolean)
      .join(' ');

    // Applied Segment
    const eligibleSegments = (item.Eligibility?.PaxSegmentRefID || [])
      .map((segId: string) => segmentLabelMap.get(segId) || segId);

    // Service name Extract (Definition.Name priority)
    const serviceName = definition.Name || service.Name || serviceCode;

    // ⭐ BookingInstructions Extract (Whether weight input is needed Judgment)
    // ServiceListRS > ALaCarteOfferItem > Service > Definition > BookingInstructions
    const rawBookingInstructions = definition.BookingInstructions || service.BookingInstructions;
    let bookingInstructions: BookingInstructions | undefined;
    let requiresWeightInput = false;

    if (rawBookingInstructions) {
      bookingInstructions = {
        ssrCode: rawBookingInstructions.SsrCode || rawBookingInstructions.ssrCode || [],
        text: rawBookingInstructions.Text || rawBookingInstructions.text || [],
        method: rawBookingInstructions.Method || rawBookingInstructions.method,
        osiText: rawBookingInstructions.Ositext || rawBookingInstructions.OsiText || rawBookingInstructions.osiText || [],
      };

      // in Method %WVAL% Pattern if exists Weight input Required
      if (bookingInstructions.method && bookingInstructions.method.includes('%WVAL%')) {
        requiresWeightInput = true;
      }

      // bug logging (처 3items)
      if (idx < 3 && requiresWeightInput) {
        console.log(`[ServiceTransformer] Item[${idx}] requiresWeightInput:`, {
          serviceCode,
          method: bookingInstructions.method,
          osiText: bookingInstructions.osiText,
        });
      }
    }

    const serviceItem: ServiceItem = {
      serviceId: service.ServiceID,
      offerItemId: item.OfferItemID,
      serviceCode,
      serviceName,
      serviceNameKr: getServiceNameKr(serviceName),
      description,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      weightOrCount: extractWeightOrCount(description),
      price,
      currency,
      eligibleSegments,
      eligiblePax: item.Eligibility?.PaxRefID || [],
      status: service.Status,
      statusLabel: service.Status ? getStatusLabel(service.Status) : undefined,
      requiresWeightInput,
      bookingInstructions,
    };

    allServices.push(serviceItem);
  });

  // per Category Classify
  const services = {
    baggage: allServices.filter((s) => s.category === 'baggage'),
    cabin: allServices.filter((s) => s.category === 'cabin'),
    lounge: allServices.filter((s) => s.category === 'lounge'),
    meal: allServices.filter((s) => s.category === 'meal'),
    other: allServices.filter((s) => s.category === 'other'),
  };

  // ResponseID Process (offer Internal or Root)
  const responseId = response.ResponseID || offer.ResponseID || offer.OfferID;

  console.log('[ServiceTransformer] Processed services:', {
    baggage: services.baggage.length,
    cabin: services.cabin.length,
    lounge: services.lounge.length,
    meal: services.meal.length,
    other: services.other.length,
    total: allServices.length,
  });

  return {
    transactionId: response.TransactionID,
    responseId,
    owner: offer.Owner,
    offerId: offer.OfferID,
    services,
    allServices,
    _apiData: {
      transactionId: response.TransactionID,
      responseId,
      offerId: offer.OfferID,
      owner: offer.Owner,
      alaCarteOfferItems: offerItems.map((item: any) => ({
        offerItemId: item.OfferItemID,
        serviceId: item.Service?.ServiceID,
        price: item.UnitPriceDetail?.TotalAmount?.Amount || 0,
        currency: item.UnitPriceDetail?.TotalAmount?.CurCode || 'KRW',
        paxRefId: item.Eligibility?.PaxRefID,
        segmentRefId: item.Eligibility?.PaxSegmentRefID,
      })),
    },
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * SSR Status Label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    HN: 'Awaiting Response',
    HD: 'PurchaseConfirmable',
    HI: 'Issue Complete',
    HK: 'Confirmed',
  };
  return statusMap[status] || status;
}
