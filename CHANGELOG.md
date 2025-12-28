# Changelog - ReservePTY v0.44.9

## [0.44.9] - 2025-12-28

### Added
- **SMTP Email Configuration** - Organizations can configure their own SMTP server
  - New "Email Configuration" tab in Settings page (Admin/Owner only)
  - SMTP host, port, username, password, from email, and from name fields
  - TLS/SSL toggle for secure connections
  - Enable/disable SMTP toggle
  - Test connection button to verify settings
  
- **Email Utility Library** (`src/lib/email.ts`)
  - `testSmtpConnection()` - Verify SMTP credentials
  - `sendEmail()` - Send emails via configured SMTP
  - `generateInvitationEmailHtml()` - Bilingual HTML email template
  - `generateInvitationEmailText()` - Plain text fallback template
  
- **SMTP Settings API** (`src/app/api/settings/smtp/route.ts`)
  - GET - Retrieve organization SMTP settings (without password)
  - POST - Save/update SMTP settings with optional connection test
  
- **Updated Invitation System** (`src/app/api/invitations/route.ts`)
  - Automatically sends email if SMTP is configured and enabled
  - Falls back to manual link sharing if SMTP not available
  - Returns `emailSent` flag to indicate delivery status
  - Returns `inviteUrl` for manual sharing

### Changed
- Settings page now includes 4 tabs: Organization, Members, Tiers, Email Configuration
- Invitation creation response includes delivery status information
- Members tab shows result with email sent confirmation or manual link

### Database Changes
New columns added to `organizations` table:
- `smtp_host` (text) - SMTP server hostname
- `smtp_port` (integer, default: 587) - SMTP port
- `smtp_user` (text) - SMTP username
- `smtp_password` (text) - SMTP password
- `smtp_from_email` (text) - Sender email address
- `smtp_from_name` (text) - Sender display name
- `smtp_secure` (boolean, default: true) - Use TLS/SSL
- `smtp_enabled` (boolean, default: false) - Enable SMTP sending

### Dependencies
Added:
- `nodemailer` ^6.9.8
- `@types/nodemailer` ^6.4.14 (dev)

---

## Previous Versions

### [0.44.8] - 2025-12-28
- Member invitation system with Supabase tokens
- Invitation acceptance page
- Role and tier assignment

### [0.44.7] - 2025-12-28
- Email confirmation for signup
- Supabase Auth integration for invitations

### [0.44.6] - 2025-12-28
- Browser language detection
- Pre-auth pages respect device language

### [0.44.5] - 2025-12-28
- Translation fixes for asset cards, members, details
- UI cleanup (removed language toggle, quick actions)

### [0.44.4] - 2025-12-28
- Mobile responsive improvements for iPhone
- Bottom navigation centering
- Dashboard card optimization

### [0.44.3] - 2025-12-28
- Trial mode implementation
- Subscription upgrade flow
- Pricing calculator

### [0.43.0] - 2025-12-28
- iOS-like responsive layout
- Desktop sidebar / Mobile bottom navigation
- Safe area support

---

*For complete version history, see VERSION.md*
