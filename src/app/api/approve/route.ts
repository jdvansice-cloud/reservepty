import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const action = searchParams.get('action') || 'approved';

  if (!token) {
    return NextResponse.redirect(new URL('/approve/error?reason=missing_token', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Find the approval by token
    const { data: approval, error: findError } = await supabase
      .from('rule_approvals')
      .select('*, reservation:reservations(id, title)')
      .eq('token', token)
      .single();

    if (findError || !approval) {
      return NextResponse.redirect(new URL('/approve/error?reason=invalid_token', request.url));
    }

    // Check if token expired
    if (approval.token_expires_at && new Date(approval.token_expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/approve/error?reason=expired_token', request.url));
    }

    // Check if already responded
    if (approval.status !== 'pending') {
      return NextResponse.redirect(new URL(`/approve/already?status=${approval.status}`, request.url));
    }

    // Update the approval
    const { error: updateError } = await supabase
      .from('rule_approvals')
      .update({
        status: action === 'reject' ? 'rejected' : 'approved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', approval.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.redirect(new URL('/approve/error?reason=update_failed', request.url));
    }

    // Check if all approvals for this reservation are complete
    if (action !== 'reject') {
      const { data: allApprovals } = await supabase
        .from('rule_approvals')
        .select('status')
        .eq('reservation_id', approval.reservation_id);

      const allApproved = allApprovals?.every(a => a.status === 'approved');

      if (allApproved) {
        // Update reservation to approved
        await supabase
          .from('reservations')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .eq('id', approval.reservation_id);
      }
    } else {
      // If rejected, update reservation to rejected
      await supabase
        .from('reservations')
        .update({
          status: 'rejected',
          rejected_reason: 'Rechazado por aprobador',
        })
        .eq('id', approval.reservation_id);
    }

    // Redirect to success page
    const reservationTitle = Array.isArray(approval.reservation) 
      ? approval.reservation[0]?.title 
      : approval.reservation?.title;
      
    return NextResponse.redirect(
      new URL(`/approve/success?action=${action}&title=${encodeURIComponent(reservationTitle || 'Reserva')}`, request.url)
    );
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.redirect(new URL('/approve/error?reason=unknown', request.url));
  }
}
