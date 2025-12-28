// Email Confirmation Template - Bilingual (English & Spanish)
// This generates HTML email content for signup confirmations
// NOTE: This template is designed to be copied to Supabase Email Templates

export interface ConfirmationEmailProps {
  confirmationUrl: string;
  userEmail?: string;
}

export function generateConfirmationEmailHTML(props: ConfirmationEmailProps): string {
  const { confirmationUrl, userEmail } = props;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email / Confirma tu correo - ReservePTY</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a1628;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #0a1628 0%, #1a2744 100%);">
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #0a1628; font-size: 24px; font-weight: bold;">R</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="color: white; font-size: 24px; font-weight: 600;">Reserve</span><span style="color: #c8b273; font-size: 24px; font-weight: 600;">PTY</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- English Section -->
          <tr>
            <td style="padding: 30px 40px; border-bottom: 1px solid #1f2937;">
              <h1 style="color: white; font-size: 24px; margin: 0 0 20px; font-weight: 600;">
                Confirm your email address ✉️
              </h1>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thanks for signing up for ReservePTY! Please confirm your email address to activate your account and start managing your luxury assets.
              </p>
              ${userEmail ? `<p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">Email: <strong style="color: white;">${userEmail}</strong></p>` : ''}
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Confirm Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; text-align: center;">
                This link expires in 24 hours
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <span style="color: #4b5563; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">ESPAÑOL / SPANISH</span>
            </td>
          </tr>

          <!-- Spanish Section -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h1 style="color: white; font-size: 24px; margin: 0 0 20px; font-weight: 600;">
                Confirma tu correo electrónico ✉️
              </h1>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ¡Gracias por registrarte en ReservePTY! Por favor confirma tu correo electrónico para activar tu cuenta y comenzar a gestionar tus activos de lujo.
              </p>
              ${userEmail ? `<p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">Correo: <strong style="color: white;">${userEmail}</strong></p>` : ''}
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Confirmar Correo
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; text-align: center;">
                Este enlace expira en 24 horas
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0d1424; border-top: 1px solid #1f2937;">
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                If you didn't create an account, you can safely ignore this email.<br>
                Si no creaste una cuenta, puedes ignorar este correo.
              </p>
              <p style="margin: 15px 0 0; text-align: center;">
                <span style="color: #6b7280; font-size: 11px;">
                  If the button doesn't work, copy and paste this link:<br>
                  Si el botón no funciona, copia y pega este enlace:
                </span>
              </p>
              <p style="margin: 8px 0 0; text-align: center;">
                <a href="${confirmationUrl}" style="color: #c8b273; font-size: 11px; word-break: break-all;">${confirmationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #0a1628;">
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ReservePTY. All rights reserved. / Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Plain text version
export function generateConfirmationEmailText(props: ConfirmationEmailProps): string {
  const { confirmationUrl, userEmail } = props;

  return `
═══════════════════════════════════════════
RESERVEPTY - EMAIL CONFIRMATION
CONFIRMACIÓN DE CORREO
═══════════════════════════════════════════

ENGLISH
───────────────────────────────────────────

Confirm your email address ✉️

Thanks for signing up for ReservePTY! Please confirm your email address to activate your account and start managing your luxury assets.

${userEmail ? `Email: ${userEmail}` : ''}

Click here to confirm your email:
${confirmationUrl}

This link expires in 24 hours.

═══════════════════════════════════════════

ESPAÑOL
───────────────────────────────────────────

Confirma tu correo electrónico ✉️

¡Gracias por registrarte en ReservePTY! Por favor confirma tu correo electrónico para activar tu cuenta y comenzar a gestionar tus activos de lujo.

${userEmail ? `Correo: ${userEmail}` : ''}

Haz clic aquí para confirmar tu correo:
${confirmationUrl}

Este enlace expira en 24 horas.

═══════════════════════════════════════════

If you didn't create an account, you can safely ignore this email.
Si no creaste una cuenta, puedes ignorar este correo.

© ${new Date().getFullYear()} ReservePTY
  `.trim();
}

// Subject line
export function generateConfirmationSubject(): string {
  return 'Confirm your email / Confirma tu correo - ReservePTY';
}
