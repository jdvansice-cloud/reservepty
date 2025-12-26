// API Services Index
// Re-export all API services for easy imports

// Organizations API
export {
  getUserOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationMembers,
  updateMember,
  removeMember,
  getOrganizationInvitations,
  createInvitation,
  cancelInvitation,
  acceptInvitation,
  getSubscription,
  hasSection,
  getActiveSections,
} from './organizations';

// Assets API
export * from './assets';

// Reservations API
export * from './reservations';

// Tiers API
export * from './tiers';

// Admin API (with renamed conflicting exports)
export {
  checkPlatformAdmin,
  getPlatformAdmins,
  getAllOrganizations,
  getOrganizationDetails,
  createOrganizationWithOwner,
  updateOrganization as adminUpdateOrganization,
  suspendOrganization,
  reactivateOrganization,
  deleteOrganization as adminDeleteOrganization,
  getAllUsers,
  getUserDetails,
  getComplimentaryAccess,
  grantComplimentaryAccess,
  revokeComplimentaryAccess,
  getAuditLogs,
  logAdminAction,
  updateSubscription,
  updateEntitlements,
  getPlatformStats,
} from './admin';

// Re-export types
export type { OrganizationWithDetails, MemberWithProfile, InvitationWithInviter } from './organizations';
export type { AssetWithPhotos, PlaneDetails, HelicopterDetails, ResidenceDetails, BoatDetails, AssetDetails } from './assets';
export type { ReservationWithDetails, CalendarEvent, AvailabilityResult } from './reservations';
export type { TierWithRules, TierRuleInput } from './tiers';
export type { 
  PlatformAdminWithProfile, 
  UserWithOrganizations, 
  ComplimentaryAccessWithDetails,
  PlatformStats 
} from './admin';
