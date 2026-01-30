import type { Database } from '@/types/database';

/**
 * Mock data factories for testing
 */

type Asset = Database['public']['Tables']['assets']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'];
type AssetSection = Database['public']['Enums']['asset_section'];
type ReservationStatus = Database['public']['Enums']['reservation_status'];

// ============================================================================
// ASSET MOCKS
// ============================================================================

export const createMockAsset = (overrides?: Partial<Asset>): Asset => ({
  id: `asset-${Math.random().toString(36).substring(7)}`,
  organization_id: 'test-org-id',
  section: 'planes' as AssetSection,
  name: 'Test Plane',
  description: 'A test plane for testing',
  details: {
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    year: 2023,
    cruiseSpeed: '450',
    maxRange: '7000',
    maxPassengers: '14',
    homeAirport: 'PTY',
    turnaroundMinutes: 60,
  },
  primary_photo_url: 'https://example.com/plane.jpg',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

export const createMockAssets = (count: number, section?: AssetSection): Asset[] =>
  Array.from({ length: count }, (_, i) =>
    createMockAsset({
      id: `asset-${i + 1}`,
      name: `Test Asset ${i + 1}`,
      section: section || (['planes', 'helicopters', 'residences', 'watercraft'][i % 4] as AssetSection),
    })
  );

// ============================================================================
// RESERVATION MOCKS
// ============================================================================

export const createMockReservation = (overrides?: Partial<Reservation>): Reservation => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 4);

  return {
    id: `reservation-${Math.random().toString(36).substring(7)}`,
    organization_id: 'test-org-id',
    asset_id: 'asset-1',
    user_id: 'test-user-id',
    title: 'Test Reservation',
    start_datetime: startDate.toISOString(),
    end_datetime: endDate.toISOString(),
    status: 'pending' as ReservationStatus,
    notes: 'Test notes',
    metadata: {
      tripType: 'taken',
      legs: [],
      totalDistanceNm: 0,
      totalFlightMinutes: 0,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
};

export const createMockReservations = (count: number): Reservation[] =>
  Array.from({ length: count }, (_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + i);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 4);

    return createMockReservation({
      id: `reservation-${i + 1}`,
      title: `Test Reservation ${i + 1}`,
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      status: (['pending', 'approved', 'rejected', 'canceled'][i % 4]) as ReservationStatus,
    });
  });

// ============================================================================
// DASHBOARD MOCKS
// ============================================================================

export const createMockDashboardStats = () => ({
  totalAssets: 12,
  activeBookings: 5,
  totalMembers: 23,
  monthlyBookings: 18,
  pendingApprovals: 3,
});

export const createMockSectionStats = () => [
  { section: 'planes' as AssetSection, assetCount: 3, bookingCount: 8, utilizationRate: 65 },
  { section: 'helicopters' as AssetSection, assetCount: 2, bookingCount: 3, utilizationRate: 45 },
  { section: 'residences' as AssetSection, assetCount: 5, bookingCount: 12, utilizationRate: 80 },
  { section: 'watercraft' as AssetSection, assetCount: 2, bookingCount: 4, utilizationRate: 55 },
];

export const createMockRecentBooking = (index = 0) => ({
  id: `booking-${index + 1}`,
  title: `Booking ${index + 1}`,
  assetName: `Test Asset ${index + 1}`,
  assetSection: (['planes', 'helicopters', 'residences', 'watercraft'][index % 4]) as AssetSection,
  userName: `User ${index + 1}`,
  userAvatar: null,
  startDatetime: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
  endDatetime: new Date(Date.now() + (index + 1) * 86400000 + 14400000).toISOString(),
  status: (['pending', 'approved', 'rejected', 'canceled'][index % 4]) as ReservationStatus,
  createdAt: new Date().toISOString(),
});

export const createMockRecentBookings = (count: number) =>
  Array.from({ length: count }, (_, i) => createMockRecentBooking(i));

// ============================================================================
// AIRPORT / HELIPORT MOCKS
// ============================================================================

export const createMockAirport = (index = 0) => ({
  id: `airport-${index + 1}`,
  icao_code: `ICAO${index + 1}`,
  iata_code: `IA${index + 1}`,
  name: `Airport ${index + 1}`,
  city: `City ${index + 1}`,
  country: 'Panama',
  latitude: 9.0 + index * 0.1,
  longitude: -79.0 + index * 0.1,
  type: 'airport' as const,
});

export const createMockAirports = (count: number) =>
  Array.from({ length: count }, (_, i) => createMockAirport(i));

export const createMockHeliport = (index = 0) => ({
  id: `heliport-${index + 1}`,
  icao_code: `HELI${index + 1}`,
  name: `Heliport ${index + 1}`,
  city: `City ${index + 1}`,
  country: 'Panama',
  latitude: 9.0 + index * 0.1,
  longitude: -79.0 + index * 0.1,
  type: 'heliport' as const,
});

export const createMockHeliports = (count: number) =>
  Array.from({ length: count }, (_, i) => createMockHeliport(i));
