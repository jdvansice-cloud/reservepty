// Invitation Email Template - Bilingual (English & Spanish)
// This generates HTML email content for member invitations

export interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  inviterEmail?: string;
  role: string;
  inviteUrl: string;
  expiresAt?: string;
}

const roleLabels: Record<string, { es: string; en: string }> = {
  owner: { es: 'Propietario', en: 'Owner' },
  admin: { es: 'Administrador', en: 'Administrator' },
  manager: { es: 'Gerente', en: 'Manager' },
  member: { es: 'Miembro', en: 'Member' },
  viewer: { es: 'Observador', en: 'Viewer' },
};

export function generateInvitationEmailHTML(props: InvitationEmailProps): string {
  const { organizationName, inviterName, role, inviteUrl, expiresAt } = props;
  
  const roleLabel = roleLabels[role] || { es: role, en: role };
  const expiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const formattedDateEs = expiryDate.toLocaleDateString('es-ES', { dateStyle: 'long' });
  const formattedDateEn = expiryDate.toLocaleDateString('en-US', { dateStyle: 'long' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ReservePTY / Invitación a ReservePTY</title>
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
                You've been invited! 🎉
              </h1>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: white;">${inviterName}</strong> has invited you to join 
                <strong style="color: #c8b273;">${organizationName}</strong> on ReservePTY as a 
                <strong style="color: white;">${roleLabel.en}</strong>.
              </p>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                ReservePTY is a premium platform for managing luxury assets including private planes, helicopters, residences, and boats.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; text-align: center;">
                This invitation expires on ${formattedDateEn}
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
                ¡Has sido invitado! 🎉
              </h1>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong style="color: white;">${inviterName}</strong> te ha invitado a unirte a 
                <strong style="color: #c8b273;">${organizationName}</strong> en ReservePTY como 
                <strong style="color: white;">${roleLabel.es}</strong>.
              </p>
              <p style="color: #9ca3af; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                ReservePTY es una plataforma premium para gestionar activos de lujo incluyendo aviones privados, helicópteros, residencias y embarcaciones.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Aceptar Invitación
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; text-align: center;">
                Esta invitación expira el ${formattedDateEs}
              </p>
            </td>
          </tr>

          <!-- Link fallback -->
          <tr>
            <td style="padding: 20px 40px; background-color: #0d1424; border-top: 1px solid #1f2937;">
              <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 10px 0 0; text-align: center;">
                <a href="${inviteUrl}" style="color: #c8b273; font-size: 12px; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #0a1628;">
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} ReservePTY. All rights reserved. / Todos los derechos reservados.
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 10px 0 0;">
                You received this email because you were invited to join an organization on ReservePTY.<br>
                Recibiste este correo porque fuiste invitado a unirte a una organización en ReservePTY.
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

// Generate plain text version for email clients that don't support HTML
export function generateInvitationEmailText(props: InvitationEmailProps): string {
  const { organizationName, inviterName, role, inviteUrl, expiresAt } = props;
  
  const roleLabel = roleLabels[role] || { es: role, en: role };
  const expiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const formattedDateEs = expiryDate.toLocaleDateString('es-ES', { dateStyle: 'long' });
  const formattedDateEn = expiryDate.toLocaleDateString('en-US', { dateStyle: 'long' });

  return `
═══════════════════════════════════════════
RESERVEPTY - INVITATION / INVITACIÓN
═══════════════════════════════════════════

ENGLISH
───────────────────────────────────────────

You've been invited! 🎉

${inviterName} has invited you to join ${organizationName} on ReservePTY as a ${roleLabel.en}.

ReservePTY is a premium platform for managing luxury assets including private planes, helicopters, residences, and boats.

Click here to accept your invitation:
${inviteUrl}

This invitation expires on ${formattedDateEn}


═══════════════════════════════════════════

ESPAÑOL
───────────────────────────────────────────

¡Has sido invitado! 🎉

${inviterName} te ha invitado a unirte a ${organizationName} en ReservePTY como ${roleLabel.es}.

ReservePTY es una plataforma premium para gestionar activos de lujo incluyendo aviones privados, helicópteros, residencias y embarcaciones.

Haz clic aquí para aceptar tu invitación:
${inviteUrl}

Esta invitación expira el ${formattedDateEs}


═══════════════════════════════════════════
© ${new Date().getFullYear()} ReservePTY. All rights reserved. / Todos los derechos reservados.
  `.trim();
}

// Subject line generator
export function generateInvitationSubject(organizationName: string): string {
  return `You're invited to join ${organizationName} on ReservePTY / Te invitan a ${organizationName} en ReservePTY`;
}
