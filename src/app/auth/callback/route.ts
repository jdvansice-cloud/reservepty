import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createServerSupabaseClient();
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
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
