import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { organizationName, sections } = await request.json();
    if (!organizationName || !sections?.length) return NextResponse.json({ error: 'Organization name and sections required' }, { status: 400 });

    // Create organization
    const { data: org, error: orgError } = await supabase.from('organizations').insert({ legal_name: organizationName, commercial_name: organizationName }).select().single();
    if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 });

    // Add user as owner
    await supabase.from('organization_members').insert({ organization_id: org.id, user_id: user.id, role: 'owner' });

    // Create subscription with trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    const { data: sub } = await supabase.from('subscriptions').insert({ organization_id: org.id, status: 'trial', trial_ends_at: trialEnd.toISOString(), seat_limit: 5 }).select().single();

    // Create entitlements for selected sections
    if (sub) {
      const entitlements = sections.map((section: string) => ({ subscription_id: sub.id, section, is_active: true }));
      await supabase.from('entitlements').insert(entitlements);
    }

    return NextResponse.json({ success: true, organizationId: org.id });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
