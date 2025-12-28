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
    if (!organizationId) return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    const { data: subscription } = await supabase.from('subscriptions').select('*').eq('organization_id', organizationId).single();
    const { data: entitlements } = await supabase.from('entitlements').select('*').eq('subscription_id', subscription?.id || '');
    return NextResponse.json({ subscription, entitlements: entitlements || [] });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
