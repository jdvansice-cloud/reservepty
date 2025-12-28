import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!membership) return NextResponse.json({ stats: { totalAssets: 0, upcomingBookings: 0, pendingApprovals: 0, members: 0 }, recentBookings: [] });
    const orgId = membership.organization_id;
    const [assetsRes, bookingsRes, pendingRes, membersRes] = await Promise.all([
      supabase.from('assets').select('id', { count: 'exact' }).eq('organization_id', orgId).eq('is_active', true),
      supabase.from('reservations').select('id', { count: 'exact' }).eq('organization_id', orgId).gte('start_datetime', new Date().toISOString()).eq('status', 'approved'),
      supabase.from('reservations').select('id', { count: 'exact' }).eq('organization_id', orgId).eq('status', 'pending'),
      supabase.from('organization_members').select('id', { count: 'exact' }).eq('organization_id', orgId),
    ]);
    const { data: recentBookings } = await supabase.from('reservations').select('*, asset:assets(name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5);
    return NextResponse.json({ stats: { totalAssets: assetsRes.count || 0, upcomingBookings: bookingsRes.count || 0, pendingApprovals: pendingRes.count || 0, members: membersRes.count || 0 }, recentBookings: recentBookings || [] });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
