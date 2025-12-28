import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const authToken = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${authToken}` } } });
    
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invError || !invitation) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) return NextResponse.json({ error: 'Already a member' }, { status: 400 });

    // Add user to organization
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      tier_id: invitation.tier_id,
    });

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

    // Mark invitation as accepted
    await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitation.id);

    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
