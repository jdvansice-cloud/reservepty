/**
 * Calendar Components Index
 *
 * Re-export all calendar-related components for easy imports
 */

// Main aviation booking modal (unified)
export { default as AviationBookingModal } from './AviationBookingModal';
export { PlaneBookingModal, HelicopterBookingModal } from './AviationBookingModal';
export type {
  AviationLocation,
  AviationAsset,
  FlightLeg,
  AviationBookingData,
  AviationModalConfig,
  AviationBookingModalProps,
  PlaneBookingModalProps,
  HelicopterBookingModalProps,
  PlaneBookingData,
  HelicopterBookingData,
  Airport,
  Heliport,
} from './AviationBookingModal';

// Legacy exports (for backwards compatibility)
// These will be deprecated in favor of the unified AviationBookingModal
export { default as LegacyPlaneBookingModal } from './PlaneBookingModal';
export { default as LegacyHelicopterBookingModal } from './HelicopterBookingModal';

// Editable itinerary component
export { EditableItinerary } from './EditableItinerary';
