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
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (!organizationId) return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    let query = supabase.from('reservations').select('*, asset:assets(name, section), profile:profiles(first_name, last_name)').eq('organization_id', organizationId);
    if (status) query = query.eq('status', status);
    if (start) query = query.gte('start_datetime', start);
    if (end) query = query.lte('start_datetime', end);
    const { data: reservations, error } = await query.order('start_datetime', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reservations: reservations || [] });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { data: reservation, error } = await supabase.from('reservations').insert({ ...body, user_id: user.id }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reservation });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
