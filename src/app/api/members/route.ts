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
    const userId = searchParams.get('userId');
    
    if (userId === 'current') {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data: membership } = await supabase.from('organization_members').select('role').eq('organization_id', organizationId).eq('user_id', user.id).single();
      return NextResponse.json(membership || { role: 'member' });
    }
    
    if (!organizationId) return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    const { data: members, error } = await supabase.from('organization_members').select('*, profile:profiles(*), tier:tiers(*)').eq('organization_id', organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ members: members || [] });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
