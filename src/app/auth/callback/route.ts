import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/onboarding';
  const inviteToken = searchParams.get('invite'); // Handle invite token
  const error_description = searchParams.get('error_description');

  // Handle error from Supabase
  if (error_description) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`);
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  // Helper function to accept invitation
  const acceptInvitation = async (userId: string, userEmail: string, accessToken: string) => {
    if (!inviteToken) return;

    try {
      // Use service role client for invitation acceptance
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY not set');
        return;
      }

      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          cookies: {
            get(name: string) { return cookieStore.get(name)?.value; },
            set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
            remove(name: string, options: CookieOptions) { cookieStore.delete({ name, ...options }); },
          },
        }
      );

      // Get invitation
      const { data: invitation, error: invError } = await adminSupabase
        .from('invitations')
        .select('*, organizations(*)')
        .eq('token', inviteToken)
        .single();

      if (invError || !invitation) {
        console.error('Invitation not found:', invError);
        return;
      }

      // Check if email matches
      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error('Email mismatch for invitation');
        return;
      }

      // Check if already accepted
      if (invitation.accepted_at) {
        console.log('Invitation already accepted');
        return;
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        console.log('Invitation expired');
        return;
      }

      // Add user to organization
      const { error: memberError } = await adminSupabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          role: invitation.role,
          tier_id: invitation.tier_id,
        });

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') {
          console.log('User already a member');
        } else {
          console.error('Error adding member:', memberError);
          return;
        }
      }

      // Mark invitation as accepted
      await adminSupabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      console.log('Invitation accepted successfully');
    } catch (err) {
      console.error('Error accepting invitation:', err);
    }
  };

  // Handle email verification (confirmation link clicked)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite',
    });

    if (error) {
      console.error('Email verification error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user && data.session) {
      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          first_name: data.user.user_metadata?.first_name || null,
          last_name: data.user.user_metadata?.last_name || null,
        });
      }

      // Accept invitation if present
      if (inviteToken && data.user.email) {
        await acceptInvitation(data.user.id, data.user.email, data.session.access_token);
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }

    // Email verified successfully
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user && data.session) {
      // Check if profile exists, create if not (for OAuth users)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingProfile) {
        // Create profile for new OAuth user
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          first_name: data.user.user_metadata?.full_name?.split(' ')[0] || 
                      data.user.user_metadata?.name?.split(' ')[0] || null,
          last_name: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                     data.user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
          avatar_url: data.user.user_metadata?.avatar_url || 
                      data.user.user_metadata?.picture || null,
        });
      }

      // Accept invitation if present
      if (inviteToken && data.user.email) {
        await acceptInvitation(data.user.id, data.user.email, data.session.access_token);
        return NextResponse.redirect(`${origin}/dashboard`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  // No code or token, redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
