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
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(profile);
  } catch (error) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
