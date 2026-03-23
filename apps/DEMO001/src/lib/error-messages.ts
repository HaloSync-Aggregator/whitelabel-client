export const ERROR_MESSAGES = {
  // Search
  SEARCH_REQUIRED: 'Required search conditions are missing.',
  SEARCH_FAILED: 'An error occurred while searching for flights. Please try again.',

  // Offer Price
  OFFER_PRICE_REQUIRED_OFFERS: 'Offer selection is required.',
  OFFER_PRICE_REQUIRED_PAX: 'Passenger list is required.',
  OFFER_PRICE_FAILED: 'An error occurred while retrieving fares. Please try again.',

  // Booking
  BOOKING_REQUIRED_TXN: 'Transaction ID is required.',
  BOOKING_REQUIRED_ORDERS: 'Order information is required.',
  BOOKING_REQUIRED_PAX: 'Passenger information is required.',
  BOOKING_CREATE_FAILED: 'An error occurred while creating the booking. Please try again.',
  BOOKING_RETRIEVE_FAILED: 'Failed to load booking information. Please try again.',
  BOOKING_NOT_AVAILABLE: 'Booking information is not available. Please search again.',
  BOOKING_NUMBER_MISSING: 'Booking number is not available.',

  // Cancel / Refund
  CANCEL_FAILED: 'An error occurred during the cancellation process. Please try again.',
  REFUND_QUOTE_FAILED: 'An error occurred while retrieving the refund estimate. Please try again.',
  REFUND_NON_REFUNDABLE: 'This fare is non-refundable.',
  REFUND_NOT_FOUND: 'No refund information was found.',
  REFUND_PROCESS_FAILED: 'An error occurred during the refund process. Please try again.',

  // Payment
  PAYMENT_REQUIRED_METHOD: 'Payment method is required.',
  PAYMENT_REQUIRED_INFO: 'Payment information (method and amount) is required.',
  PAYMENT_REQUIRED_AMOUNT: 'Payment amount is required.',
  PAYMENT_INVALID: 'Invalid payment information.',
  PAYMENT_FAILED: 'An error occurred while processing the payment. Please try again.',
  PAYMENT_RECALC_FAILED: 'An error occurred while recalculating the fare. Please try again.',
  PAYMENT_STEP1_FAILED: 'Payment processing failed at step 1. Please try again.',
  PAYMENT_STEP2_FAILED: 'Payment processing failed at step 2. Please try again.',

  // Seat
  SEAT_REQUIRED_TXN: 'Transaction ID is required.',
  SEAT_REQUIRED_SELECTION: 'Please select a seat.',
  SEAT_NOT_SUPPORTED: (carrier: string) => `${carrier} does not support seat purchase.`,
  SEAT_FREE_ONLY: (carrier: string) => `${carrier} only supports free seat selection.`,
  SEAT_RETRIEVE_FAILED: 'Failed to retrieve seat information. Please try again.',
  SEAT_PURCHASE_FAILED: 'An error occurred during seat purchase. Please try again.',
  SEAT_QUOTE_FAILED: 'Failed to retrieve seat quote. Please try again.',
  SEAT_CONFIRM_FAILED: 'Seat confirmation failed. Please try again.',
  SEAT_CONFIRM_TIMEOUT: 'Seat confirmation timed out. Please try again.',
  SEAT_NOT_AVAILABLE: 'Seat information is not available. This flight may not support seat selection.',

  // Service
  SERVICE_REQUIRED_TXN: 'Transaction ID is required.',
  SERVICE_REQUIRED_SELECTION: 'Please select a service.',
  SERVICE_TICKETING_ONLY: 'Services can only be added after ticketing.',
  SERVICE_NOT_SUPPORTED: (carrier: string) => `${carrier} does not support ancillary services.`,
  SERVICE_RETRIEVE_FAILED: 'Failed to retrieve service list. Please try again.',
  SERVICE_ADD_FAILED: 'Failed to add the service. Please try again.',
  SERVICE_PURCHASE_FAILED: 'An error occurred during service purchase. Please try again.',
  SERVICE_QUOTE_FAILED: 'Failed to retrieve service quote. Please try again.',
  SERVICE_QUOTE_REQUIRED: 'Service list data is required. Please load the service list first.',
  SERVICE_NOT_AVAILABLE: 'No ancillary services are available for this flight.',

  // Passenger Change
  PAX_REQUIRED_ID: 'Passenger ID is required.',
  PAX_REQUIRED_TXN: 'Transaction ID is required.',
  PAX_REQUIRED_TYPE: 'Change type is required.',
  PAX_REQUIRED_ACTION: 'Action type is required (ADD/DELETE/MODIFY).',
  PAX_CHANGE_FAILED: 'Failed to update passenger information. Please try again.',
  PAX_MODIFY_NOT_SUPPORTED: 'This carrier only supports Add/Delete. Modify is not supported.',
  PAX_ADD_DELETE_NOT_SUPPORTED: 'This carrier only supports Modify. Add/Delete is not supported.',

  // Passenger Split
  PAX_SPLIT_REQUIRED: 'Please select passengers to split.',
  PAX_SPLIT_NOT_SUPPORTED: (carrier: string) => `${carrier} does not support passenger split.`,
  PAX_SPLIT_NOT_FOUND: 'Selected passengers were not found.',
  PAX_SPLIT_INFANT_ONLY: 'Infants cannot be split on their own.',
  PAX_SPLIT_MIN_PAX: 'At least 2 passengers are required for a split.',
  PAX_SPLIT_FAILED: 'Failed to split passengers. Please try again.',

  // Journey Change
  JOURNEY_REQUIRED_TXN: 'Transaction ID is required.',
  JOURNEY_REQUIRED_MODE: 'Change mode is required.',
  JOURNEY_REQUIRED_ORIGIN_DEST: 'Journey change information is required.',
  JOURNEY_REQUIRED_DELETE: 'Delete journey information is required.',
  JOURNEY_REQUIRED_OFFER: 'Selected offer is required.',
  JOURNEY_RETRIEVE_FAILED: 'An error occurred while retrieving flights. Please try again.',
  JOURNEY_QUOTE_FAILED: 'An error occurred while retrieving fares. Please try again.',
  JOURNEY_CHANGE_FAILED: 'An error occurred during the journey change. Please try again.',
  JOURNEY_SELECT_REQUIRED: 'Please select a journey to change.',

  // Order Change Ticketing
  TICKETING_REQUIRED_TXN: 'Transaction ID is required.',
  TICKETING_REQUIRED_ORDER: 'Order ID is required.',
  TICKETING_REQUIRED_CARRIER: 'Carrier code is required.',
  TICKETING_FAILED: 'An error occurred during ticketing. Please try again.',

  // Fare Recalculation
  FARE_RECALC_FAILED: 'An error occurred while recalculating the fare. Please try again.',

  // Order Quote
  ORDER_QUOTE_FAILED: 'Failed to retrieve the order quote. Please try again.',

  // Payment Form Validation
  PAYMENT_FORM_CARD_NUMBER: 'Please enter a valid card number.',
  PAYMENT_FORM_CARD_NAME: 'Please enter the cardholder name.',
  PAYMENT_FORM_EXPIRY: 'Please enter the expiry date in MM/YY format.',
  PAYMENT_FORM_VOUCHER_ID: 'Please enter the voucher ID.',
  PAYMENT_FORM_VOUCHER_AMOUNT: 'Please enter the voucher amount.',
  PAYMENT_FORM_VOUCHER_EXCEED: 'Voucher amount exceeds the payment total. Please select "Voucher + Cash" payment.',

  // Generic
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  CARRIER_INFO_REQUIRED: 'Carrier information is required. Please go back to the booking detail page.',
} as const;
