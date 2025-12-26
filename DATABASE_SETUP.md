# ReservePTY Database Setup Guide

This guide walks you through setting up the Supabase database for ReservePTY.

## Prerequisites

1. A Supabase project (already created at `xylwaukdoypvmfvsvyxz.supabase.co`)
2. Access to Supabase Dashboard
3. Your Supabase credentials in `.env.local`

## Step 1: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Open the file `supabase/migrations/001_initial_schema.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** to execute

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref xylwaukdoypvmfvsvyxz

# Run migrations
supabase db push
```

## Step 2: Run Seed Data

After the schema is created:

1. Open `supabase/migrations/002_seed_data.sql`
2. Copy and paste into SQL Editor
3. Click **Run**

This will populate:
- 30+ airports (Panama, Central America, Caribbean, USA)
- 25+ ports and marinas
- Helipad locations

## Step 3: Configure Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create two buckets:

### Bucket: `organization-logos`
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

### Bucket: `asset-photos`
- Public: Yes
- File size limit: 10MB
- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

### Storage Policies

For each bucket, add these policies in the **Policies** tab:

**Select Policy (Public Read):**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('organization-logos', 'asset-photos'));
```

**Insert Policy (Authenticated Upload):**
```sql
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('organization-logos', 'asset-photos')
);
```

**Update/Delete Policy (Owner only):**
```sql
CREATE POLICY "Owner can modify"
ON storage.objects FOR UPDATE
USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can delete"
ON storage.objects FOR DELETE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 4: Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure settings:
   - Enable email confirmations: **Yes** (production) / **No** (development)
   - Confirm email change: **Yes**
   - Secure password change: **Yes**

### Email Templates (Optional)

Customize email templates in **Authentication** > **Email Templates**:
- Confirmation email
- Password reset email
- Invite email

## Step 5: Create Initial Platform Admin

After creating your first user account:

1. Get the user's ID from **Authentication** > **Users**
2. Run in SQL Editor:

```sql
-- Replace 'YOUR_USER_ID' with the actual user ID
INSERT INTO platform_admins (user_id, role)
VALUES ('YOUR_USER_ID', 'super_admin');
```

## Step 6: Test the Setup

### Test RLS Policies

```sql
-- Test organization access
SELECT * FROM organizations LIMIT 5;

-- Test airport directory
SELECT * FROM airports WHERE country = 'Panama';
```

### Verify Triggers

```sql
-- Test profile creation trigger
-- (Sign up a new user and check profiles table)
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
```

## Step 7: Environment Variables

Ensure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xylwaukdoypvmfvsvyxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEV_MODE=true
```

The `NEXT_PUBLIC_DEV_MODE=true` enables:
- Bypass for onboarding payment step
- Auto-activation of all sections
- High seat limit (100)
- Dev toolbar

## Troubleshooting

### "Permission denied" errors

Check that RLS policies are correctly applied:
```sql
-- List all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Trigger not firing

Verify the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Storage upload fails

Check bucket policies and CORS settings in Storage > Configuration.

## Database Schema Overview

```
profiles              - User profiles (linked to auth.users)
organizations         - Customer organizations
organization_members  - Org membership (with roles)
subscriptions         - Billing subscriptions
entitlements          - Section access (planes, helicopters, etc.)
tiers                 - Booking priority levels
tier_rules            - Rules per tier
assets                - All asset types (planes, boats, etc.)
asset_photos          - Photo gallery per asset
reservations          - Bookings
invitations           - Pending member invites
platform_admins       - ReservePTY staff
audit_logs            - Activity tracking
airports              - Aviation directory
ports                 - Marina directory
blackout_dates        - Booking restrictions
complimentary_access  - Free access records
```

## Next Steps

After database setup:

1. Start the development server: `npm run dev`
2. Visit `/signup` to create your first account
3. Complete onboarding flow
4. Make yourself a platform admin (Step 5)
5. Access admin portal at `/admin`

---

*Last updated: December 26, 2025*
