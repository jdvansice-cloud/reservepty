import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get SMTP settings
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
    
    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get SMTP settings
    const { data: org, error } = await supabase
      .from('organizations')
      .select('smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_from_name, smtp_secure, smtp_enabled')
      .eq('id', organizationId)
      .single();
    
    if (error) {
      console.error('Error fetching SMTP settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
    
    // Don't return the password for security
    return NextResponse.json({
      smtp: {
        host: org?.smtp_host || '',
        port: org?.smtp_port || 587,
        user: org?.smtp_user || '',
        fromEmail: org?.smtp_from_email || '',
        fromName: org?.smtp_from_name || '',
        secure: org?.smtp_secure ?? true,
        enabled: org?.smtp_enabled || false,
        hasPassword: !!org?.smtp_user, // Indicate if password is set
      }
    });
    
  } catch (error) {
    console.error('GET SMTP settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Save SMTP settings
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { organizationId, host, port, user: smtpUser, password, fromEmail, fromName, secure, enabled, testConnection } = body;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }
    
    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // If testing connection, verify first
    if (testConnection && host && smtpUser && password) {
      const testResult = await testSmtpConnection({
        host,
        port: port || 587,
        user: smtpUser,
        password,
        fromEmail: fromEmail || smtpUser,
        fromName: fromName || 'ReservePTY',
        secure: secure ?? true,
      });
      
      if (!testResult.success) {
        return NextResponse.json({ 
          error: 'SMTP connection failed: ' + testResult.error,
          testFailed: true
        }, { status: 400 });
      }
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      smtp_host: host || null,
      smtp_port: port || 587,
      smtp_user: smtpUser || null,
      smtp_from_email: fromEmail || null,
      smtp_from_name: fromName || null,
      smtp_secure: secure ?? true,
      smtp_enabled: enabled || false,
      updated_at: new Date().toISOString(),
    };
    
    // Only update password if provided
    if (password) {
      updateData.smtp_password = password;
    }
    
    // Save settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId);
    
    if (updateError) {
      console.error('Error saving SMTP settings:', updateError);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('POST SMTP settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
