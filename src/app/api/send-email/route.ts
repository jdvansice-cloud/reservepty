import { NextRequest, NextResponse } from 'next/server';
import { 
  generateInvitationEmailHTML, 
  generateInvitationEmailText,
  generateInvitationSubject,
  InvitationEmailProps 
} from '@/components/email/invitation-email';

// Email sending API
// Supports: Resend, SendGrid, or development mode (logging)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let html: string;
    let text: string;
    let subject: string;

    // Generate email content based on type
    switch (type) {
      case 'invitation':
        const invitationData: InvitationEmailProps = {
          organizationName: data.organizationName,
          inviterName: data.inviterName,
          inviterEmail: data.inviterEmail,
          role: data.role,
          inviteUrl: data.inviteUrl,
          expiresAt: data.expiresAt,
        };
        html = generateInvitationEmailHTML(invitationData);
        text = generateInvitationEmailText(invitationData);
        subject = generateInvitationSubject(data.organizationName);
        break;
      
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 });
    }

    // Check for email service configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@reservepty.com';

    // Try Resend first
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject,
            html,
            text,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return NextResponse.json({ 
            success: true, 
            provider: 'resend',
            messageId: result.id 
          });
        } else {
          const error = await response.json();
          console.error('Resend error:', error);
          throw new Error('Resend failed');
        }
      } catch (error) {
        console.error('Resend send error:', error);
      }
    }

    // Try SendGrid
    if (sendgridApiKey) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: fromEmail },
            subject,
            content: [
              { type: 'text/plain', value: text },
              { type: 'text/html', value: html },
            ],
          }),
        });

        if (response.ok || response.status === 202) {
          return NextResponse.json({ 
            success: true, 
            provider: 'sendgrid' 
          });
        } else {
          const error = await response.text();
          console.error('SendGrid error:', error);
          throw new Error('SendGrid failed');
        }
      } catch (error) {
        console.error('SendGrid send error:', error);
      }
    }

    // Development mode - log email content
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📧 EMAIL WOULD BE SENT (No email service configured)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Type: ${type}`);
    console.log('───────────────────────────────────────────────────────────────');
    console.log('Plain Text Preview:');
    console.log(text.substring(0, 500) + '...');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n');

    // In development, return success but note it was logged only
    return NextResponse.json({ 
      success: true, 
      provider: 'development',
      message: 'Email logged to console (no email service configured)',
      note: 'Add RESEND_API_KEY or SENDGRID_API_KEY to enable email sending'
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
