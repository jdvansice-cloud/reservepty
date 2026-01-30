'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAuth } from '@/components/auth/auth-provider';
import { bookingKeys } from './useBookings';
import { assetKeys } from './useAssets';

// ============================================================================
// TYPES
// ============================================================================

type PostgresEventType = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeConfig<T extends Record<string, unknown>> {
  /** Table name to subscribe to */
  table: string;
  /** Database schema (defaults to 'public') */
  schema?: string;
  /** Filter string (e.g., 'organization_id=eq.xxx') */
  filter?: string;
  /** Callback when a row is inserted */
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Callback when a row is updated */
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Callback when a row is deleted */
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  /** Query keys to invalidate on any change */
  invalidateKeys?: readonly unknown[][];
  /** Whether the subscription is enabled */
  enabled?: boolean;
}

// ============================================================================
// GENERIC REALTIME HOOK
// ============================================================================

/**
 * Generic hook for subscribing to Supabase Realtime changes on a table
 */
export function useRealtime<T extends Record<string, unknown>>(
  config: RealtimeConfig<T>
) {
  const queryClient = useQueryClient();
  const supabase = getClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const {
    table,
    schema = 'public',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    invalidateKeys,
    enabled = true,
  } = config;

  const handleChange = useCallback(
    (
      eventType: PostgresEventType,
      payload: RealtimePostgresChangesPayload<T>
    ) => {
      switch (eventType) {
        case 'INSERT':
          onInsert?.(payload);
          break;
        case 'UPDATE':
          onUpdate?.(payload);
          break;
        case 'DELETE':
          onDelete?.(payload);
          break;
      }

      // Invalidate related queries
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [...key] });
        });
      }
    },
    [onInsert, onUpdate, onDelete, invalidateKeys, queryClient]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channelName = filter
      ? `${table}-${filter.replace(/[^a-zA-Z0-9]/g, '-')}`
      : `${table}-changes`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema,
          table,
          filter,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          handleChange(
            payload.eventType as PostgresEventType,
            payload
          );
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`, filter || '');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, filter, enabled, handleChange, supabase]);

  // Return unsubscribe function
  return useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [supabase]);
}

// ============================================================================
// SPECIALIZED REALTIME HOOKS
// ============================================================================

/**
 * Hook for real-time calendar updates (reservations)
 * Automatically invalidates calendar queries when reservations change
 */
export function useCalendarRealtime() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  useRealtime({
    table: 'reservations',
    filter: organization?.id ? `organization_id=eq.${organization.id}` : undefined,
    enabled: !!organization?.id,
    invalidateKeys: [
      [...bookingKeys.all, 'calendar'] as unknown[],
      [...bookingKeys.lists()] as unknown[],
      [...bookingKeys.pendingCount(organization?.id || '')] as unknown[],
    ],
    onInsert: (payload) => {
      console.log('[Calendar] New reservation:', payload.new);
      // Could show a toast notification here
    },
    onUpdate: (payload) => {
      console.log('[Calendar] Reservation updated:', payload.new);
      // Invalidate specific booking detail
      if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
        queryClient.invalidateQueries({
          queryKey: bookingKeys.detail(payload.new.id as string),
        });
      }
    },
    onDelete: (payload) => {
      console.log('[Calendar] Reservation deleted:', payload.old);
    },
  });
}

/**
 * Hook for real-time asset updates
 * Automatically invalidates asset queries when assets change
 */
export function useAssetRealtime() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  useRealtime({
    table: 'assets',
    filter: organization?.id ? `organization_id=eq.${organization.id}` : undefined,
    enabled: !!organization?.id,
    invalidateKeys: [
      [...assetKeys.lists()] as unknown[],
      [...assetKeys.counts(organization?.id || '')] as unknown[],
    ],
    onInsert: (payload) => {
      console.log('[Assets] New asset:', payload.new);
    },
    onUpdate: (payload) => {
      console.log('[Assets] Asset updated:', payload.new);
      if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
        queryClient.invalidateQueries({
          queryKey: assetKeys.detail(payload.new.id as string),
        });
      }
    },
    onDelete: (payload) => {
      console.log('[Assets] Asset deleted:', payload.old);
    },
  });
}

/**
 * Hook for real-time organization member updates
 */
export function useMemberRealtime() {
  const { organization } = useAuth();

  useRealtime({
    table: 'organization_members',
    filter: organization?.id ? `organization_id=eq.${organization.id}` : undefined,
    enabled: !!organization?.id,
    invalidateKeys: [['members', organization?.id]],
    onInsert: (payload) => {
      console.log('[Members] New member:', payload.new);
    },
    onUpdate: (payload) => {
      console.log('[Members] Member updated:', payload.new);
    },
    onDelete: (payload) => {
      console.log('[Members] Member removed:', payload.old);
    },
  });
}

/**
 * Combined hook for subscribing to all relevant real-time updates
 * Use this in your main layout or page component
 */
export function useAppRealtime() {
  useCalendarRealtime();
  useAssetRealtime();
  useMemberRealtime();
}

// ============================================================================
// PRESENCE HOOK
// ============================================================================

interface PresenceState {
  id: string;
  name: string;
  avatar?: string;
  lastSeen: string;
}

/**
 * Hook for tracking user presence (who's online)
 */
export function usePresence(channelName: string, userInfo: Omit<PresenceState, 'lastSeen'>) {
  const supabase = getClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userInfo.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[Presence] Sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: unknown[] }) => {
        console.log('[Presence] Join:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: unknown[] }) => {
        console.log('[Presence] Leave:', key, leftPresences);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            ...userInfo,
            lastSeen: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName, userInfo, supabase]);

  // Return function to update presence
  return useCallback(
    async (update: Partial<PresenceState>) => {
      if (channelRef.current) {
        await channelRef.current.track({
          ...userInfo,
          ...update,
          lastSeen: new Date().toISOString(),
        });
      }
    },
    [userInfo]
  );
}
