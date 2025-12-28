# ReservePTY v0.44.9 - Installation & Upgrade Guide

## Version Information
- **Version:** 0.44.9
- **Release Date:** December 28, 2025
- **Type:** Feature Update

## What's New in v0.44.9

### SMTP Email Configuration
Organizations can now configure their own SMTP server to automatically send invitation emails. When SMTP is not configured, the system falls back to manual link sharing.

### Features Added
1. **SMTP Settings Tab** - New tab in Settings for email configuration
2. **Email Utility Library** - Nodemailer-based email sending
3. **SMTP Test Connection** - Verify configuration before saving
4. **Bilingual Email Templates** - English/Spanish invitation emails
5. **Manual Link Fallback** - Share invitation links when SMTP unavailable

---

## Installation Steps

### 1. Install New Dependency

Add nodemailer to your project:

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

Or update package.json:
```json
{
  "dependencies": {
    "nodemailer": "^6.9.8"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14"
  }
}
```

### 2. Run Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy contents from migrations/add_smtp_settings.sql
-- or run the file directly
```

This adds the following columns to the `organizations` table:
- `smtp_host` - SMTP server hostname
- `smtp_port` - Server port (default: 587)
- `smtp_user` - Authentication username
- `smtp_password` - Authentication password
- `smtp_from_email` - Sender email address
- `smtp_from_name` - Sender display name
- `smtp_secure` - TLS/SSL toggle
- `smtp_enabled` - Enable/disable SMTP

### 3. Copy Updated Files

Copy the following files to your project:

```
src/
├── lib/
│   └── email.ts                    # Email utility library
├── app/
│   ├── api/
│   │   ├── invitations/
│   │   │   └── route.ts            # Updated invitation API
│   │   └── settings/
│   │       └── smtp/
│   │           └── route.ts        # SMTP settings API
│   └── (portal)/
│       └── settings/
│           └── page.tsx            # Updated settings page
```

### 4. Environment Variables (Optional)

Add to your `.env.local` for custom site URL:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## SMTP Configuration Guide

### Gmail SMTP Setup
1. Enable 2-Factor Authentication in Google Account
2. Generate an App Password: Google Account → Security → App Passwords
3. Configure in ReservePTY:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - User: your Gmail address
   - Password: 16-character app password
   - Secure: ✓ Enabled

### Microsoft 365 / Outlook SMTP
- Host: `smtp.office365.com`
- Port: `587`
- User: your email address
- Password: your password (or app password)
- Secure: ✓ Enabled

### SendGrid SMTP
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Password: your SendGrid API key
- Secure: ✓ Enabled

### Amazon SES SMTP
- Host: `email-smtp.{region}.amazonaws.com`
- Port: `587`
- User: SMTP username from SES
- Password: SMTP password from SES
- Secure: ✓ Enabled

---

## File Structure

```
reservepty-v0.44.9/
├── migrations/
│   └── add_smtp_settings.sql       # Database migration
├── src/
│   ├── lib/
│   │   └── email.ts                # Email utilities
│   ├── app/
│   │   ├── api/
│   │   │   ├── invitations/
│   │   │   │   └── route.ts
│   │   │   └── settings/
│   │   │       └── smtp/
│   │   │           └── route.ts
│   │   └── (portal)/
│   │       └── settings/
│   │           └── page.tsx
├── INSTALLATION.md                 # This file
└── CHANGELOG.md                    # Version changelog
```

---

## Testing

### Test SMTP Connection
1. Go to Settings → Email Configuration
2. Enter your SMTP credentials
3. Click "Test Connection"
4. Verify "Connection successful!" message

### Test Invitation Flow
1. Go to Settings → Members
2. Enter an email address
3. Click "Send Invite"
4. If SMTP is configured: Email is sent automatically
5. If SMTP is not configured: Copy the link manually

---

## Troubleshooting

### SMTP Connection Failures

**"Connection timeout"**
- Check firewall/network allows outbound SMTP
- Verify host and port are correct

**"Authentication failed"**
- Double-check username and password
- For Gmail: Ensure you're using an App Password, not your regular password

**"TLS/SSL error"**
- Try toggling the "Use TLS/SSL" option
- Port 465 typically uses SSL, port 587 uses STARTTLS

### Invitation Emails Not Sending
1. Verify SMTP is enabled in settings
2. Check email is not in spam folder
3. Verify sender email is properly configured
4. Check server logs for detailed error messages

---

## Security Notes

- SMTP passwords are stored in the database
- In production, consider encrypting sensitive credentials
- Use app-specific passwords when available
- Restrict SMTP settings to Owner/Admin roles only

---

## Support

For issues or questions, contact the development team.

---

*Generated: December 28, 2025*
