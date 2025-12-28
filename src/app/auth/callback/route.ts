import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/onboarding';
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

    if (data.user) {
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
    }

    // Email verified successfully
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle OAuth callback (Google, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
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
