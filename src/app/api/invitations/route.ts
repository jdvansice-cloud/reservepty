import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create invitation
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Create supabase client with user's token for permission checks
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { email, role, tierId, organizationId } = body;
    
    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Email and organization are required' }, { status: 400 });
    }
    
    // Check if user has permission to invite (must be owner, admin, or manager)
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (memberError || !membership) {
      console.error('Membership check error:', memberError);
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }
    
    const canInvite = ['owner', 'admin', 'manager'].includes(membership.role);
    if (!canInvite) {
      return NextResponse.json({ error: 'Insufficient permissions to invite members' }, { status: 403 });
    }
    
    // Check if email is already a member
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (existingProfile) {
      const { data: alreadyMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingProfile.id)
        .single();
      
      if (alreadyMember) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 });
      }
    }
    
    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }
    
    // Create the invitation record in our database
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role: role || 'member',
        tier_id: tierId || null,
        invited_by: user.id,
      })
      .select('id, token, email, role, expires_at')
      .single();
    
    if (inviteError) {
      console.error('Invitation creation error:', inviteError);
      return NextResponse.json({ error: 'Failed to create invitation: ' + inviteError.message }, { status: 500 });
    }
    
    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('commercial_name, legal_name')
      .eq('id', organizationId)
      .single();
    
    const orgName = org?.commercial_name || org?.legal_name || 'ReservePTY';
    
    // Build invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reservepty.vercel.app';
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    
    // Try to use Supabase Admin API to send invite email
    if (supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // Use Supabase's built-in invite
        const { error: inviteEmailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: inviteUrl,
          data: {
            invited_to_org: organizationId,
            invited_role: role || 'member',
            invited_tier: tierId || null,
            org_name: orgName,
          }
        });
        
        if (inviteEmailError) {
          console.warn('Supabase invite email failed:', inviteEmailError.message);
          // Don't fail - invitation record was created, user can still use the link
        }
      } catch (emailError) {
        console.warn('Email service error:', emailError);
      }
    } else {
      console.log('📧 SUPABASE_SERVICE_ROLE_KEY not configured - invitation created but email not sent');
      console.log(`   Invite URL: ${inviteUrl}`);
    }
    
    // Return success with invitation details
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        inviteUrl,
      },
    });
    
  } catch (error) {
    console.error('Invitation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get pending invitations for an organization
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        tier_id,
        created_at,
        expires_at,
        invited_by,
        profiles:invited_by (first_name, last_name)
      `)
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }
    
    return NextResponse.json({ invitations });
    
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
