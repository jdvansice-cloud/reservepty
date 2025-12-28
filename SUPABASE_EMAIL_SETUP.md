# Supabase Email Templates Setup Guide

This guide explains how to configure Supabase to use custom bilingual email templates for ReservePTY.

## Overview

ReservePTY uses two types of emails:
1. **Confirmation Email** - Sent when a user signs up (handled by Supabase)
2. **Invitation Email** - Sent when inviting members (handled by our API)

## Setting Up Supabase Email Templates

### Step 1: Access Email Templates

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your ReservePTY project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure "Confirm signup" Template

1. Click on **"Confirm signup"**
2. Set the **Subject** to:
   ```
   Confirm your email / Confirma tu correo - ReservePTY
   ```
3. Copy the HTML below and paste it into the **Body** field:

```html
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
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                Email: <strong style="color: white;">{{ .Email }}</strong>
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
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
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                Correo: <strong style="color: white;">{{ .Email }}</strong>
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c8b273; border-radius: 8px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; color: #0a1628; text-decoration: none; font-weight: 600; font-size: 16px;">
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
                <a href="{{ .ConfirmationURL }}" style="color: #c8b273; font-size: 11px; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #0a1628;">
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                © 2025 ReservePTY. All rights reserved. / Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

4. Click **Save**

### Step 3: Enable Email Confirmation

1. Go to **Authentication** → **Settings** → **Email**
2. Make sure **"Enable email confirmations"** is turned ON
3. Set **"Confirm email"** to **Required**

### Step 4: Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL: `https://reservepty.vercel.app`
3. Add Redirect URLs:
   - `https://reservepty.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Available Template Variables

Supabase provides these variables for email templates:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | The full confirmation link |
| `{{ .Email }}` | User's email address |
| `{{ .SiteURL }}` | Your configured site URL |
| `{{ .Token }}` | Raw token value |
| `{{ .TokenHash }}` | Hashed token value |

## Other Email Templates

You may also want to customize these templates with the same bilingual style:

- **Magic Link** - For passwordless login
- **Change Email Address** - When users change their email  
- **Reset Password** - For password recovery
- **Invite user** - For organization invitations (if using Supabase invites)

## Testing

1. Try signing up with a new email
2. Check that the email arrives with proper formatting
3. Verify both English and Spanish sections render correctly
4. Test the confirmation button/link
5. Ensure you're redirected to `/onboarding` after confirming

## Troubleshooting

**Email not arriving?**
- Check spam/junk folder
- Verify SMTP settings in Supabase (if using custom SMTP)
- Check Supabase logs for errors

**Template not rendering?**
- Make sure HTML is properly escaped
- Check for missing closing tags
- Test in email preview tools

**Link not working?**
- Verify Site URL configuration
- Check redirect URLs are properly set
- Ensure callback route is deployed
