# ReservePTY Development History

**Document Version:** 1.0
**Last Updated:** January 2025
**Current Platform Version:** v0.47.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [Version History](#version-history)
4. [Feature Development Timeline](#feature-development-timeline)
5. [Database Schema](#database-schema)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Key Features Implemented](#key-features-implemented)
8. [Design System](#design-system)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Decisions](#development-decisions)

---

## Project Overview

**ReservePTY** is a self-service, multi-tenant SaaS platform designed for managing luxury assets including:
- Private planes
- Helicopters
- Residences/Spaces
- Boats/Watercraft

The platform enables organizations (families, companies, or groups) to coordinate bookings, manage members with tiered access, and maintain a unified calendar across all asset types.

### Target Market
- Family offices
- High-net-worth individuals
- Corporate fleet management
- Fractional ownership scenarios

### Key Value Proposition
- Tier-based booking system with priority overrides
- Sophisticated approval workflows
- Aviation-specific features (flight distance calculation, turnaround time enforcement)
- Luxury branding with premium user experience

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Typography** | Didot LT Pro |
| **Animations** | Framer Motion |
| **Hosting** | Vercel (Frontend) |
| **Repository** | GitHub |
| **Payments** | Tilopay (planned) |
| **Email Services** | Resend / SendGrid (configurable) |

---

## Version History

### v0.47.0 (Current)
- Complete marketing landing page
- Mobile-responsive layouts
- Full bilingual support (English/Spanish)

### v0.46.9
- Mobile text overflow fixes
- Invitation token localStorage fix for email verification flow

### v0.40.x
- Language context implementation
- Upgrade page with pricing calculator
- Bilingual error messages and warnings

### v0.30.x - v0.39.x
- SMTP configuration for custom email servers
- Settings page with hierarchical tabs
- Unified Aviation Locations page
- Simplified Marinas/Ports pages for watercraft
- Invitation system with email templates

### v0.3.3
- Platform Admin Portal
- Create Organization functionality
- RLS (Row Level Security) fixes

### v0.3.1
- Netlify static export mode
- generateStaticParams implementation
- Next.js upgrade for compatibility

### v0.3.0 - Asset Management
- Assets Listing (`/dashboard/assets`)
  - Grid view with photo thumbnails
  - Search by name/description
  - Filter by section (planes, helicopters, residences, boats)
  - Section badges with color coding
  - Quick actions menu (view, edit, delete)
- Add New Asset (`/dashboard/assets/new`)
  - 3-step wizard with progress indicator
  - Section-specific form fields

---

## Feature Development Timeline

### Phase 1: Core Infrastructure
- Multi-tenant architecture with Row Level Security (RLS)
- Organization-based data isolation
- Authentication system with Supabase Auth
- Base UI components with luxury styling

### Phase 2: Asset Management
- CRUD operations for all asset types
- Section-specific fields:
  - **Planes**: Tail number, model, range, cruise speed, base airport
  - **Helicopters**: Similar to planes with helipad support
  - **Residences**: Address, capacity, amenities
  - **Boats**: Hull type, marina location, capacity

### Phase 3: Tier System & Booking Rules
- Member tiers with priority levels
- Booking rules engine:
  - Advance booking limits
  - Maximum booking duration
  - Blackout dates
  - Priority override system

### Phase 4: Platform Admin
- Super admin dashboard
- Organization management (view/create/suspend)
- User management across platform
- Complimentary membership grants
- Activity logs and audit trail
- Platform settings configuration

### Phase 5: Marketing & Onboarding
- Landing page with features showcase
- Pricing page with:
  - Per-section pricing
  - Monthly/Yearly toggle (15% discount for annual)
  - Seat tiers (5, 10, 25, 50, 100 users) with volume discounts
  - Real-time price calculator
- Free trial implementation (no demo mode)
- Terms, Privacy, and Contact pages

### Phase 6: Internationalization
- Full English/Spanish support
- Language toggle in navigation
- Bilingual email templates
- Localized date formats
- RTL-ready architecture

### Phase 7: Documentation & Testing
- Comprehensive HTML user manual
- Print-ready PDF export
- Step-by-step testing documentation
- Database verification tests

---

## Database Schema

### Core Tables (17 total)

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant entities (legal_name, commercial_name, ruc, billing_email, logo_url) |
| `organization_members` | User-organization relationships with roles |
| `assets` | All asset types with section discriminator |
| `bookings` | Reservation records |
| `tiers` | Member priority levels per organization |
| `booking_rules` | Configurable booking constraints |
| `invitations` | Pending member invitations |
| `platform_admins` | Super admin users |
| `platform_activity_logs` | Admin action audit trail |
| `platform_settings` | Global configuration |
| `complimentary_memberships` | Free access grants |

### Key Relationships
- Organizations have many members, assets, tiers, and booking rules
- Members belong to organizations with specific roles and tiers
- Bookings reference assets and members
- Invitations link to organizations and granting members

### Row Level Security (RLS)
All data is isolated by `organization_id` at the database level using RLS policies:
- Members can only see their organization's data
- Admins (owner, admin, manager roles) have elevated permissions
- Platform admins have cross-organization access

---

## User Roles & Permissions

### Organization Roles
| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, organization settings |
| **Admin** | Member management, asset management, booking rules |
| **Manager** | Approve bookings, view reports |
| **Member** | Book assets within tier limits |

### Platform Roles
| Role | Permissions |
|------|-------------|
| **Platform Admin** | Cross-organization access, complimentary grants, platform settings |

---

## Key Features Implemented

### Booking System
- Calendar-based asset selection
- Tier-based access control
- Approval workflow for restricted bookings
- Conflict detection and resolution
- Turnaround time enforcement for aviation assets

### Aviation Features
- Flight distance calculation (great-circle)
- Estimated flight time based on cruise speed
- Airport/helipad location management with coordinates
- Automated turnaround time between bookings

### Email System
- Modular email service supporting:
  - Resend (RESEND_API_KEY)
  - SendGrid (SENDGRID_API_KEY)
  - Development mode (console logging)
- Email templates:
  - Invitation emails (bilingual)
  - Booking confirmations
  - Approval requests

### Upgrade/Subscription Flow
- Section selection (toggle individual asset categories)
- Billing cycle selection (Monthly/Yearly with 15% discount)
- Seat tier selection with volume discounts
- Real-time price calculation
- Trial period support

---

## Design System

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| **Primary (Navy)** | `#0a1628` | Dark luxury backgrounds |
| **Accent (Gold)** | `#c8b273` | Champagne gold highlights |
| **Neutral (Stone)** | `#1c1917` / `#fafaf9` | Text and backgrounds |

### Design Philosophy
- **Deep Navy**: Professional, trustworthy, premium feel
- **Champagne Gold**: Luxury, exclusivity, elegance
- **Warm Stone**: Organic warmth, readability

### Typography
- **Font**: Didot LT Pro
- **Headings**: Font-display class
- **Body**: Clean, readable sizing

### Components
- Consistent border-radius (rounded-2xl for cards)
- Subtle shadows for depth
- Smooth transitions (150ms ease)
- Touch-optimized controls for mobile

---

## Deployment & Infrastructure

### Environments
| Environment | URL | Purpose |
|-------------|-----|---------|
| **Production** | reservepty.vercel.app | Live customer-facing |
| **Staging** | staging.reservepty.vercel.app | Pre-production testing |
| **Development** | localhost:3000 | Local development |

### CI/CD Pipeline
1. Code pushed to GitHub
2. Vercel automatic deployment triggered
3. Build process runs
4. Deployment to appropriate environment

### Monitoring
- Vercel Analytics for frontend performance
- Supabase Dashboard for database metrics and API usage
- Error Tracking (planned)

### Deployment Workflow
- Complete project ZIP files delivered per version
- User uploads entire project to GitHub
- Vercel auto-deploys from repository
- TypeScript checking with `npx tsc --noEmit` before deployment

---

## Development Decisions

### PWA Removed
The platform intentionally avoids PWA implementation:
- Fully online-dependent (no offline mode)
- Avoids service worker complexity
- Focus on responsive web instead

### Mobile-First Approach
- Bottom navigation for thumb accessibility
- Swipe gestures for quick actions
- Skeleton screens for perceived performance
- Optimistic UI updates for instant feedback
- Touch-optimized controls

### Static Export Mode
- Better compatibility with various hosting platforms
- More stable deployments on Vercel/Netlify
- generateStaticParams for dynamic routes

### No Demo Mode
- Free trial period instead of demo
- Real functionality access during trial
- Cleaner conversion funnel

### TypeScript Patterns
- Proper type casting for Supabase join queries
- Pattern: `data as unknown as Type[]`
- Array indexing for joined data: `tier?.[0]`

---

## Chat Development Sessions

### Session 1: Document Analysis and Development Optimization
- Analyzed existing specifications
- Created comprehensive development plan
- Established mobile-first, performance-focused approach
- Removed PWA requirements for simplicity

### Session 2: Luxury Asset Platform v1.0.0 Development
- Major feature implementation (v0.12 through v0.46.9)
- SMTP configuration
- Invitation system
- Settings reorganization
- Upgrade page with pricing
- Aviation features (locations, flight calculations)
- Full bilingual support

### Session 3: HTML User Manual
- Comprehensive bilingual documentation
- Fixed sidebar navigation
- Print-ready PDF export styles
- Visual mockups and screenshots

### Session 4: Landing Page Development
- Marketing website completion
- Pricing integration
- Mobile-responsive layouts
- Trial signup flow

### Session 5: Testing & Verification
- Comprehensive testing document
- Step-by-step database verification
- Function registration tests
- Schema coverage validation

---

## Future Roadmap

### v0.4.0 - Calendar Enhancement
- Visual scheduling interfaces
- Drag-and-drop booking
- Multi-asset calendar views

### Planned Features
- Enhanced booking rules engine
- Advanced approval workflows
- Asset utilization analytics
- Mobile app consideration
- Additional payment provider integrations

---

## Repository Structure

```
reservepty/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (admin)/           # Admin portal routes
│   │   ├── (admin-auth)/      # Admin authentication
│   │   ├── (auth)/            # User authentication
│   │   ├── (onboarding)/      # Onboarding flow
│   │   ├── (portal)/          # Main dashboard
│   │   ├── api/               # API routes
│   │   └── ...                # Public pages
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── calendar/          # Booking calendar components
│   │   ├── email/             # Email templates
│   │   └── auth/              # Auth components
│   ├── contexts/              # React contexts (Language, etc.)
│   ├── lib/
│   │   ├── api/               # API utilities
│   │   ├── supabase/          # Supabase client config
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript definitions
├── supabase/
│   └── migrations/            # Database migrations
├── public/                    # Static assets
└── ...                        # Config files
```

---

*This document was generated from the Claude AI project chat history for ReservePTY development reference.*
