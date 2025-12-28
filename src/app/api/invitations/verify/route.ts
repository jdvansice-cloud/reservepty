import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, email, role, organization_id, expires_at, accepted_at')
      .eq('token', token)
      .single();

    if (error || !invitation) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    if (invitation.accepted_at) return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
    if (new Date(invitation.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });

    const { data: org } = await supabase.from('organizations').select('commercial_name, legal_name').eq('id', invitation.organization_id).single();
    
    return NextResponse.json({ invitation, orgName: org?.commercial_name || org?.legal_name || 'Organization' });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
