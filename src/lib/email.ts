import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Test SMTP connection
export async function testSmtpConnection(config: SmtpConfig): Promise<EmailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Send email via SMTP
export async function sendEmail(
  config: SmtpConfig,
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Generate invitation email HTML (bilingual)
export function generateInvitationEmailHtml(params: {
  orgName: string;
  inviteUrl: string;
  role: string;
}): string {
  const { orgName, inviteUrl, role } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${orgName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0a1628 0%, #1a2b4a 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #c8b273;
      margin-bottom: 10px;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .lang-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h2 {
      color: #0a1628;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      background: #c8b273;
      color: #0a1628;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 15px 0;
    }
    .role-badge {
      display: inline-block;
      background: #0a1628;
      color: #c8b273;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #888;
      font-size: 12px;
      margin-top: 20px;
    }
    .url-fallback {
      word-break: break-all;
      font-size: 12px;
      color: #666;
      background: #eee;
      padding: 10px;
      border-radius: 4px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ReservePTY</div>
    <div>Luxury Asset Management</div>
  </div>
  
  <div class="content">
    <!-- English Section -->
    <div class="section">
      <div class="lang-label">🇺🇸 English</div>
      <h2>You're Invited!</h2>
      <p>You have been invited to join <strong>${orgName}</strong> on ReservePTY as a <span class="role-badge">${role}</span>.</p>
      <p>ReservePTY is a premium platform for managing luxury assets including private planes, helicopters, residences, and boats.</p>
      <a href="${inviteUrl}" class="button">Accept Invitation</a>
      <div class="url-fallback">
        If the button doesn't work, copy this link:<br>
        ${inviteUrl}
      </div>
      <p><small>This invitation expires in 7 days.</small></p>
    </div>
    
    <!-- Spanish Section -->
    <div class="section">
      <div class="lang-label">🇪🇸 Español</div>
      <h2>¡Estás Invitado!</h2>
      <p>Has sido invitado a unirte a <strong>${orgName}</strong> en ReservePTY como <span class="role-badge">${role}</span>.</p>
      <p>ReservePTY es una plataforma premium para gestionar activos de lujo incluyendo aviones privados, helicópteros, residencias y embarcaciones.</p>
      <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
      <div class="url-fallback">
        Si el botón no funciona, copia este enlace:<br>
        ${inviteUrl}
      </div>
      <p><small>Esta invitación expira en 7 días.</small></p>
    </div>
  </div>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} ReservePTY. All rights reserved.</p>
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>
`;
}

// Generate invitation email plain text (bilingual)
export function generateInvitationEmailText(params: {
  orgName: string;
  inviteUrl: string;
  role: string;
}): string {
  const { orgName, inviteUrl, role } = params;

  return `
RESERVEPTY - INVITATION / INVITACIÓN

=== ENGLISH ===

You're Invited!

You have been invited to join ${orgName} on ReservePTY as a ${role}.

ReservePTY is a premium platform for managing luxury assets including private planes, helicopters, residences, and boats.

Accept your invitation here:
${inviteUrl}

This invitation expires in 7 days.

=== ESPAÑOL ===

¡Estás Invitado!

Has sido invitado a unirte a ${orgName} en ReservePTY como ${role}.

ReservePTY es una plataforma premium para gestionar activos de lujo incluyendo aviones privados, helicópteros, residencias y embarcaciones.

Acepta tu invitación aquí:
${inviteUrl}

Esta invitación expira en 7 días.

---
© ${new Date().getFullYear()} ReservePTY. All rights reserved.
If you didn't expect this invitation, you can safely ignore this email.
`;
}
