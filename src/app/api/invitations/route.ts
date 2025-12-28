import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateInvitationEmailHtml, generateInvitationEmailText } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Role labels for email
const roleLabels: Record<string, { en: string; es: string }> = {
  owner: { en: 'Owner', es: 'Propietario' },
  admin: { en: 'Admin', es: 'Administrador' },
  manager: { en: 'Manager', es: 'Gerente' },
  member: { en: 'Member', es: 'Miembro' },
  viewer: { en: 'Viewer', es: 'Observador' },
};

// Create invitation
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Create supabase client with user's token
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
    
    // Get organization details including SMTP settings
    const { data: org } = await supabase
      .from('organizations')
      .select('commercial_name, legal_name, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email, smtp_from_name, smtp_secure, smtp_enabled')
      .eq('id', organizationId)
      .single();
    
    const orgName = org?.commercial_name || org?.legal_name || 'ReservePTY';
    
    // Build invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reservepty.vercel.app';
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;
    
    // Try to send email if SMTP is configured
    let emailSent = false;
    let emailError: string | null = null;
    
    if (org?.smtp_enabled && org?.smtp_host && org?.smtp_user && org?.smtp_password) {
      try {
        const roleLabel = roleLabels[role || 'member']?.en || role || 'Member';
        
        const result = await sendEmail(
          {
            host: org.smtp_host,
            port: org.smtp_port || 587,
            user: org.smtp_user,
            password: org.smtp_password,
            fromEmail: org.smtp_from_email || org.smtp_user,
            fromName: org.smtp_from_name || orgName,
            secure: org.smtp_secure ?? true,
          },
          {
            to: email.toLowerCase(),
            subject: `You're invited to join ${orgName} / Te invitan a ${orgName} - ReservePTY`,
            html: generateInvitationEmailHtml({
              orgName,
              inviteUrl,
              role: roleLabel,
            }),
            text: generateInvitationEmailText({
              orgName,
              inviteUrl,
              role: roleLabel,
            }),
          }
        );
        
        emailSent = result.success;
        if (!result.success) {
          emailError = result.error || 'Failed to send email';
          console.warn('SMTP send failed:', emailError);
        }
      } catch (err) {
        console.error('Email sending error:', err);
        emailError = err instanceof Error ? err.message : 'Email sending failed';
      }
    }
    
    // Return success with invitation details and URL
    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailSent ? null : emailError,
      smtpConfigured: !!(org?.smtp_enabled && org?.smtp_host),
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        inviteUrl,
        orgName,
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
    
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }
    
    // Check membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }
    
    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('id, token, email, role, tier_id, created_at, expires_at')
      .eq('organization_id', organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }
    
    // Add invite URLs to each invitation
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://reservepty.vercel.app';
    const invitationsWithUrls = invitations?.map(inv => ({
      ...inv,
      inviteUrl: `${baseUrl}/invite/${inv.token}`
    })) || [];
    
    return NextResponse.json({ invitations: invitationsWithUrls });
    
  } catch (error) {
    console.error('GET invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete/cancel an invitation
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
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
    
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');
    
    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 });
    }
    
    // Get the invitation to verify organization
    const { data: invitation } = await supabase
      .from('invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .single();
    
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    
    // Check if user has permission
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);
    
    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
