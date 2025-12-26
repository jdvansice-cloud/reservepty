# ReservePTY — Platform Specifications Document

**Version:** 1.0  
**Date:** December 24, 2025  
**Status:** In Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Platform Architecture](#4-platform-architecture)
5. [User Workflows](#5-user-workflows)
6. [Feature Specifications](#6-feature-specifications)
7. [Database Schema](#7-database-schema)
8. [API Endpoints](#8-api-endpoints)
9. [Security & Compliance](#9-security--compliance)
10. [Deployment & Infrastructure](#10-deployment--infrastructure)

---

## 1. Executive Summary

ReservePTY is a self-service, multi-tenant SaaS platform designed for managing luxury assets including private planes, helicopters, residences/spaces, and boats. The platform enables organizations (families, companies, or groups) to coordinate bookings, manage members with tiered access, and maintain a unified calendar across all asset types.

### Key Value Propositions

- **Unified Management:** Single platform for all luxury asset types
- **Modular Pricing:** Pay only for the sections you need
- **Family/Organization Focus:** Built for shared asset coordination
- **Priority-Based Booking:** Tier system ensures fair access with priority rules
- **Aviation Intelligence:** Auto-calculated flight times and turnaround enforcement

---

## 2. Product Overview

### 2.1 Target Users

| User Type | Description |
|-----------|-------------|
| **Family Offices** | High-net-worth families with multiple shared assets |
| **Private Companies** | Corporations with executive travel and property assets |
| **Fractional Ownership Groups** | Groups sharing aircraft, yachts, or vacation properties |
| **Charter Management** | Companies managing fleets for members |

### 2.2 Asset Sections (Modules)

| Section | Asset Types | Key Features |
|---------|-------------|--------------|
| **Aviation — Planes** | Jets, turboprops, propeller aircraft | Flight routing, ETA calculation, turnaround buffers |
| **Aviation — Helicopters** | Helicopters | Helipad directory, flight-hour logging |
| **Residences / Spaces** | Homes, villas, apartments, meeting rooms | Check-in/out times, cleaning buffers, guest counts |
| **Boats** | Yachts, boats, watercraft | Port directory, captain requirements, engine hours |

### 2.3 Pricing Model

- **Billing Cycles:** Monthly or Yearly (with discount)
- **Section Pricing:** Each section has independent pricing
- **Seat Tiers:** 5, 10, 25, 50, or 100 users per organization
- **Trial Period:** 14-day free trial for self-service signups
- **Complimentary:** Platform admins can grant free access

---

## 3. User Roles & Permissions

### 3.1 Platform-Level Roles (ReservePTY Staff)

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full platform access, manage other admins, system settings |
| **Admin** | Manage organizations, users, complimentary access, view all data |
| **Support** | Read-only access to help troubleshoot customer issues |

### 3.2 Organization-Level Roles (Customer Users)

| Role | Permissions |
|------|-------------|
| **Owner** | Full organization control, billing, invite members, manage assets |
| **Admin** | Manage assets, members, approve bookings, configure tiers |
| **Manager** | Approve bookings, view reports, limited member management |
| **Member** | Create bookings (subject to tier rules), view shared assets |
| **Viewer** | Read-only access to calendar and asset information |

### 3.3 Tier-Based Access (Booking Priority)

Organizations define member tiers for booking priority:

| Example Tier | Priority | Typical Rules |
|--------------|----------|---------------|
| **Tier 1 (Principals)** | Highest | Unlimited bookings, no approval needed, can override |
| **Tier 2 (Family)** | High | 10 days/month per asset, 3-day lead time |
| **Tier 3 (Extended)** | Medium | 5 days/month, 7-day lead time, approval required |
| **Tier 4 (Staff)** | Low | 2 days/month, 14-day lead time, blackout dates apply |

---

## 4. Platform Architecture

### 4.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Recommend|
| **Styling** | Tailwind CSS + Recommend|
| **State Management** | Recommend |
| **Backend/Database** | Supabase (PostgreSQL, Auth, Storage, Realtime) or Recommend|
| **Payments** | Maybe Tilopay but TBD |
| **Hosting** | Google run (Frontend), Supabase Cloud (Backend) |
| **Repository** | GitHub |

### 4.2 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ReservePTY Platform                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Org A     │  │   Org B     │  │   Org C     │   ...   │
│  │  (Family)   │  │ (Company)   │  │  (Group)    │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ • Users     │  │ • Users     │  │ • Users     │         │
│  │ • Assets    │  │ • Assets    │  │ • Assets    │         │
│  │ • Bookings  │  │ • Bookings  │  │ • Bookings  │         │
│  │ • Tiers     │  │ • Tiers     │  │ • Tiers     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                  Shared Infrastructure                       │
│  • Authentication  • Storage  • Directories  • Billing      │
└─────────────────────────────────────────────────────────────┘
```

All data is isolated by `organization_id` at the database level using Row Level Security (RLS).

---

## 5. User Workflows

### 5.1 Platform Admin Workflow (Separate - Admin Portal) (review and make Recommendations)

```
┌──────────────────────────────────────────────────────────────────┐
│                    PLATFORM ADMIN WORKFLOW                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Admin Login    │
                    │ /admin/login    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Admin Dashboard │
                    │    /admin       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Organizations │  │     Users       │  │  Complimentary  │
│    List       │  │     List        │  │   Memberships   │
└───────┬───────┘  └─────────────────┘  └────────┬────────┘
        │                                         │
        ▼                                         ▼
┌───────────────┐                       ┌─────────────────┐
│    Create     │                       │     Grant       │
│ Organization  │                       │  Free Access    │
│  + Owner      │                       │                 │
└───────────────┘                       └─────────────────┘
```

### 5.2 Customer Self-Service Signup Workflow (Customer portal) (review and make Recommendations)

```
┌──────────────────────────────────────────────────────────────────┐
│                  CUSTOMER SIGNUP WORKFLOW                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Landing Page   │
                    │       /         │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Sign Up      │
                    │    /signup      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Email Verify    │
                    │  (Supabase)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Onboarding     │
                    │  /onboarding    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Company Info │  │ Select Sections │  │  Select Seats   │
│  RUC + DV     │  │  & Upload Logo  │  │   & Pay         │
└───────────────┘  └─────────────────┘  └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Dashboard     │
                    │  /dashboard     │
                    └─────────────────┘
```

### 5.3 Asset Booking Workflow (Customer portal) (review and make Recommendations)

```
┌──────────────────────────────────────────────────────────────────┐
│                    BOOKING WORKFLOW                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Select Asset    │
                    │ from Calendar   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Check User Tier │
                    │    & Rules      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐           ┌────────────────┐
     │ Rules Passed   │           │ Rules Failed   │
     └───────┬────────┘           └───────┬────────┘
             │                            │
             ▼                            ▼
     ┌────────────────┐           ┌────────────────┐
     │ Check Asset    │           │ Show Error     │
     │ Availability   │           │ (Limit/Lead)   │
     └───────┬────────┘           └────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────┐
│Available │  │ Conflict │
└────┬─────┘  └────┬─────┘
     │             │
     ▼             ▼
┌──────────┐  ┌──────────────┐
│ Create   │  │ Priority     │
│ Booking  │  │ Check        │
└────┬─────┘  └──────┬───────┘
     │               │
     │        ┌──────┴──────┐
     │        │             │
     │        ▼             ▼
     │   ┌─────────┐  ┌─────────┐
     │   │ Higher  │  │ Lower   │
     │   │ Wins    │  │ Waitlist│
     │   └────┬────┘  └─────────┘
     │        │
     └────────┼────────┐
              │        │
              ▼        ▼
       ┌────────────────────┐
       │ Approval Required? │
       └─────────┬──────────┘
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
    ┌──────────┐  ┌──────────┐
    │   Yes    │  │    No    │
    │ Pending  │  │ Approved │
    └──────────┘  └──────────┘
```

### 5.4 Aviation Booking Workflow (Planes/Helicopters) (Customer portal) (review and make Recommendations)

```
┌──────────────────────────────────────────────────────────────────┐
│                  AVIATION BOOKING WORKFLOW                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Select Aircraft │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Verify Current  │
                    │    Location     │
                    └────────┬────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────┐                    ┌─────────────────┐
│ At Departure    │                    │ Not at Departure│
│   Airport       │                    │ (Repositioning) │
└────────┬────────┘                    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Select Departure│
│ & Arrival       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│        AUTO-CALCULATE               │
│  • Distance (Haversine formula)     │
│  • Flight Time (cruise speed)       │
│  • ETA                              │
│  • Turnaround End Time              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Confirm Booking │
│ Update Aircraft │
│    Location     │
└─────────────────┘
```

### 5.5 Residence/Spaces Booking Workflow (Recommend)

```

### 5.6 Boats Booking Workflow (Recommend)

---

## 6. Feature Specifications

### 6.1 Dashboard Features

| Feature | Description | Status |
|---------|-------------|--------|
| KPI Cards | Total assets, bookings, members overview |
| Section Stats | Breakdown by planes/helis/residences/boats |
| Recent Bookings | List of upcoming and recent reservations | 
| Quick Actions | Shortcuts to common tasks | 

### 6.2 Asset Management

| Feature | Description | Status |
|---------|-------------|--------|
| Asset CRUD | Create, read, update, delete assets | 
| Section-Specific Forms | Tailored fields per asset type | 
| Photo Gallery | Multiple photos with primary selection | 
| Asset Permissions | Share with specific users/tiers | 

### 6.3 Calendar & Bookings

| Feature | Description | Status |
|---------|-------------|--------|
| Unified Calendar | All assets in one view | 
| Month/Week/Day Views | Multiple calendar perspectives |
| Booking Creation | Section-specific booking flows | 
| Conflict Detection | Automatic overlap checking | 
| Approval Workflow | Pending/approved/rejected states | 

### 6.4 Member & Tier Management

| Feature | Description | Status |
|---------|-------------|--------|
| Member Invitations | Email-based invite flow | 
| Role Assignment | Owner/Admin/Manager/Member/Viewer | 
| Tier Configuration | Create and configure member tiers | 
| Tier Rules | Booking limits, lead times, blackouts | 

### 6.5 Platform Admin Features

| Feature | Description | Status |
|---------|-------------|--------|
| Admin Dashboard | Platform-wide KPIs | 
| Organization Management | View/create/suspend orgs | 
| User Management | View all platform users | 
| Complimentary Access | Grant free memberships | 
| Activity Logs | Audit trail of admin actions | 
| Platform Settings | Global configuration | 

---

## 7. Database Schema (Review and make recommendations)

### 7.1 Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  organizations   │     │      users       │
├──────────────────┤     │   (auth.users)   │
│ id               │     ├──────────────────┤
│ legal_name       │     │ id               │
│ commercial_name  │     │ email            │
│ ruc              │     │ user_metadata    │
│ dv               │     └────────┬─────────┘
│ billing_email    │              │
│ logo_url         │              │
└────────┬─────────┘              │
         │                        │
         │    ┌───────────────────┘
         │    │
         ▼    ▼
┌──────────────────────┐
│ organization_members │
├──────────────────────┤
│ organization_id (FK) │
│ user_id (FK)         │
│ role                 │
│ tier_id (FK)         │
└──────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  subscriptions   │────▶│   entitlements   │
├──────────────────┤     ├──────────────────┤
│ organization_id  │     │ subscription_id  │
│ status           │     │ section          │
│ billing_cycle    │     │ is_active        │
│ seat_limit       │     └──────────────────┘
│ current_period   │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│     assets       │     │   reservations   │
├──────────────────┤     ├──────────────────┤
│ organization_id  │     │ asset_id (FK)    │
│ section          │     │ user_id (FK)     │
│ name             │     │ start_datetime   │
│ details (JSONB)  │     │ end_datetime     │
│ primary_photo    │     │ status           │
└──────────────────┘     │ metadata (JSONB) │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│     tiers        │     │   tier_rules     │
├──────────────────┤     ├──────────────────┤
│ organization_id  │     │ tier_id (FK)     │
│ name             │     │ max_days_month   │
│ priority         │     │ max_consecutive  │
│ color            │     │ min_lead_time    │
└──────────────────┘     │ requires_approval│
                         └──────────────────┘
```

### 7.2 Directory Tables

```
┌──────────────────┐     ┌──────────────────┐
│    airports      │     │      ports       │
├──────────────────┤     ├──────────────────┤
│ code (ICAO)      │     │ code             │
│ name             │     │ name             │
│ city             │     │ city             │
│ country          │     │ country          │
│ latitude         │     │ latitude         │
│ longitude        │     │ longitude        │
│ type (airport/   │     └──────────────────┘
│       helipad)   │
└──────────────────┘
```

---

## 8. API Endpoints (Review and make recommendations)

### 8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create new account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Sign out |
| POST | `/auth/reset-password` | Request password reset |
| POST | `/auth/update-password` | Set new password |

### 8.2 Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List user's organizations |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get organization details |
| PATCH | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete organization |

### 8.3 Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List organization assets |
| POST | `/api/assets` | Create asset |
| GET | `/api/assets/:id` | Get asset details |
| PATCH | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Soft delete asset |

### 8.4 Reservations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reservations` | List reservations (filtered) |
| POST | `/api/reservations` | Create reservation |
| GET | `/api/reservations/:id` | Get reservation details |
| PATCH | `/api/reservations/:id` | Update reservation |
| POST | `/api/reservations/:id/approve` | Approve reservation |
| POST | `/api/reservations/:id/reject` | Reject reservation |
| DELETE | `/api/reservations/:id` | Cancel reservation |

### 8.5 Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar` | Get unified calendar data |
| GET | `/api/calendar/availability` | Check asset availability |

---

## 9. Security & Compliance (Review and make recommendations)

### 9.1 Authentication & Authorization

- **Authentication:** Supabase Auth (email/password, magic links)
- **Session Management:** JWT tokens with secure refresh
- **Row Level Security:** All tables protected by organization_id policies
- **Role-Based Access:** Enforced at API and UI levels

### 9.2 Data Protection

- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Data Isolation:** Multi-tenant with strict organization boundaries
- **Audit Logging:** All admin actions logged with timestamps
- **Backup:** Automatic daily backups (Supabase)

### 9.3 Compliance Considerations

- **Panama Data Laws:** User data stored in compliance with local regulations
- **Payment Security:** PCI-DSS compliance through Tilopay
- **GDPR Preparedness:** Data export and deletion capabilities

---

## 10. Deployment & Infrastructure (Review and make changes using localhost for testing and Google run for deployment)

### 10.1 Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Production** | reservepty.vercel.app | Live customer-facing |
| **Staging** | staging.reservepty.vercel.app | Pre-production testing |
| **Development** | localhost:3000 | Local development |

### 10.2 CI/CD Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  GitHub  │────▶│  Vercel  │────▶│  Build   │────▶│  Deploy  │
│   Push   │     │  Trigger │     │  & Test  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 10.3 Monitoring & Observability (Review and make recommendations)

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Frontend performance |
| Supabase Dashboard | Database metrics, API usage |
| Error Tracking | Application errors (planned) |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Organization** | A paying customer entity (family, company, group) |
| **Section** | A module/asset category (planes, helicopters, residences, boats) |
| **Tier** | A member priority level within an organization |
| **Entitlement** | Permission to access a specific section |
| **Turnaround** | Buffer time between bookings for preparation |
| **RUC** | Registro Único de Contribuyente (Panama tax ID) |
| **DV** | Dígito Verificador (Panama tax ID check digit) |

---

Primary Background color #0a1628
Primary Higlights color #c8b273 Buttons
Recommend all others

---

Images for organization logo and assets should be uploadable

---

*Document generated: December 24, 2025*
