'use client';

import { createClient } from '@/lib/supabase/client';
import type { Asset, AssetPhoto, AssetSection, Json } from '@/types/database';

const supabase = createClient();

// ============================================================================
// TYPES
// ============================================================================

export interface AssetWithPhotos extends Asset {
  photos?: AssetPhoto[];
  booking_count?: number;
}

export interface PlaneDetails {
  manufacturer?: string;
  model?: string;
  year?: number;
  tail_number?: string;
  cruise_speed_knots?: number;
  range_nm?: number;
  passenger_capacity?: number;
  home_airport?: string;
  turnaround_minutes?: number;
  current_location?: string;
}

export interface HelicopterDetails {
  manufacturer?: string;
  model?: string;
  year?: number;
  registration?: string;
  passenger_capacity?: number;
  home_helipad?: string;
  turnaround_minutes?: number;
  current_location?: string;
}

export interface ResidenceDetails {
  address?: string;
  city?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  max_guests?: number;
  check_in_time?: string;
  check_out_time?: string;
  cleaning_buffer_hours?: number;
  amenities?: string[];
}

export interface BoatDetails {
  manufacturer?: string;
  model?: string;
  year?: number;
  length_feet?: number;
  beam_feet?: number;
  draft_feet?: number;
  cabins?: number;
  passenger_capacity?: number;
  crew_capacity?: number;
  home_port?: string;
  current_location?: string;
}

export type AssetDetails = PlaneDetails | HelicopterDetails | ResidenceDetails | BoatDetails;

// ============================================================================
// ASSET CRUD
// ============================================================================

/**
 * Get all assets for an organization
 */
export async function getAssets(
  organizationId: string,
  options?: {
    section?: AssetSection;
    includePhotos?: boolean;
    includeBookingCount?: boolean;
    onlyActive?: boolean;
  }
): Promise<AssetWithPhotos[]> {
  let query = supabase
    .from('assets')
    .select(options?.includePhotos ? '*, photos:asset_photos(*)' : '*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.section) {
    query = query.eq('section', options.section);
  }

  if (options?.onlyActive !== false) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // Cast to proper type
  const assets = (data || []) as unknown as AssetWithPhotos[];

  // Get booking counts if requested
  if (options?.includeBookingCount && assets.length > 0) {
    const assetIds = assets.map(a => a.id);
    const { data: bookings } = await supabase
      .from('reservations')
      .select('asset_id')
      .in('asset_id', assetIds)
      .in('status', ['pending', 'approved']);

    const countMap = new Map<string, number>();
    bookings?.forEach(b => {
      countMap.set(b.asset_id, (countMap.get(b.asset_id) || 0) + 1);
    });

    return assets.map(asset => ({
      ...asset,
      booking_count: countMap.get(asset.id) || 0,
    }));
  }

  return assets;
}

/**
 * Get a single asset by ID
 */
export async function getAsset(id: string): Promise<AssetWithPhotos | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*, photos:asset_photos(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as unknown as AssetWithPhotos;
}

/**
 * Create a new asset
 */
export async function createAsset(input: {
  organizationId: string;
  section: AssetSection;
  name: string;
  description?: string;
  details?: AssetDetails;
  primaryPhotoUrl?: string;
}): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      organization_id: input.organizationId,
      section: input.section,
      name: input.name,
      description: input.description,
      details: input.details as Json || {},
      primary_photo_url: input.primaryPhotoUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an asset
 */
export async function updateAsset(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    details: AssetDetails;
    primary_photo_url: string;
    is_active: boolean;
  }>
): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .update({
      ...updates,
      details: updates.details as Json,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Soft delete an asset
 */
export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Permanently delete an asset (use with caution)
 */
export async function hardDeleteAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// ASSET PHOTOS
// ============================================================================

/**
 * Get photos for an asset
 */
export async function getAssetPhotos(assetId: string): Promise<AssetPhoto[]> {
  const { data, error } = await supabase
    .from('asset_photos')
    .select('*')
    .eq('asset_id', assetId)
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Add a photo to an asset
 */
export async function addAssetPhoto(input: {
  assetId: string;
  url: string;
  caption?: string;
  order?: number;
}): Promise<AssetPhoto> {
  // Get current max order
  const { data: existing } = await supabase
    .from('asset_photos')
    .select('order')
    .eq('asset_id', input.assetId)
    .order('order', { ascending: false })
    .limit(1);

  const nextOrder = input.order ?? ((existing?.[0]?.order ?? -1) + 1);

  const { data, error } = await supabase
    .from('asset_photos')
    .insert({
      asset_id: input.assetId,
      url: input.url,
      caption: input.caption,
      order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a photo from an asset
 */
export async function removeAssetPhoto(photoId: string): Promise<void> {
  const { error } = await supabase
    .from('asset_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

/**
 * Reorder asset photos
 */
export async function reorderAssetPhotos(assetId: string, photoIds: string[]): Promise<void> {
  const updates = photoIds.map((id, index) => ({
    id,
    order: index,
  }));

  for (const update of updates) {
    await supabase
      .from('asset_photos')
      .update({ order: update.order })
      .eq('id', update.id)
      .eq('asset_id', assetId);
  }
}

/**
 * Set primary photo for an asset
 */
export async function setPrimaryPhoto(assetId: string, photoUrl: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .update({ primary_photo_url: photoUrl })
    .eq('id', assetId);

  if (error) throw error;
}

// ============================================================================
// ASSET STATISTICS
// ============================================================================

/**
 * Get asset count by section
 */
export async function getAssetCountBySection(organizationId: string): Promise<Record<AssetSection, number>> {
  const { data, error } = await supabase
    .from('assets')
    .select('section')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw error;

  const counts: Record<AssetSection, number> = {
    planes: 0,
    helicopters: 0,
    residences: 0,
    boats: 0,
  };

  data?.forEach(asset => {
    counts[asset.section]++;
  });

  return counts;
}

/**
 * Get total asset count
 */
export async function getTotalAssetCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw error;
  return count || 0;
}

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

/**
 * Upload asset photo to Supabase Storage
 */
export async function uploadAssetPhoto(
  organizationId: string,
  assetId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${organizationId}/${assetId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('asset-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('asset-photos')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete asset photo from Supabase Storage
 */
export async function deleteAssetPhotoFromStorage(url: string): Promise<void> {
  // Extract path from URL
  const urlParts = url.split('/asset-photos/');
  if (urlParts.length < 2) return;

  const path = urlParts[1];

  const { error } = await supabase.storage
    .from('asset-photos')
    .remove([path]);

  if (error) throw error;
}

/**
 * Upload organization logo
 */
export async function uploadOrganizationLogo(
  organizationId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${organizationId}/logo.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('organization-logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('organization-logos')
    .getPublicUrl(fileName);

  return publicUrl;
}
