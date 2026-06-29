# Authentication & Access Control Design
**Prepared For:** Nikhil Ranjan  
**Purpose:** Secure multi-tenant access model with platform-level oversight  
**Date:** June 2026  
**Status:** Documented — Build at later stage

---

## Overview

This document captures the design for:
1. **Enhanced Authentication** — Email-based identity verification so only legitimate users can access the system
2. **Tenant-Level Role Hierarchy** — An Owner account per organization that delegates rights to team members
3. **Platform Owner Control** — Nikhil's (developer/vendor) centralized visibility over all accounts, like how Cisco manages Webex

---

## The Mental Model

```
PLATFORM LEVEL (Nikhil — the vendor)
└── Can see all tenants, license counts, account health
    Can manage accounts without touching their data

    TENANT LEVEL (e.g., "Ranjit's Electronics")
    └── Owner (one per organization — top authority)
        ├── Admin (full app access, manages users below)
        ├── Manager (inventory + transactions, no financials)
        ├── Reporter (read-only reports and dashboards)
        └── Reader (view-only inventory, no reports)
```

---

## Part 1: Enhanced Authentication

### 1.1 Current State

- Register with email + password → immediate access
- No email verification → anyone can create an account with a fake email
- No password reset mechanism
- JWT tokens with 24h expiry (no revocation)

### 1.2 Proposed: Email OTP Verification

**On Registration:**
1. User submits name, email, password
2. System creates account in `PENDING` state
3. System sends a 6-digit OTP to the registered email (valid 10 minutes)
4. User enters OTP on a `/verify-email` screen
5. Account moves to `ACTIVE` — user can now log in

**On Login:**
1. User submits email + password
2. Credentials verified against DB
3. Optionally: send OTP to email for 2FA (configurable — enable/disable per tenant)
4. On success: issue JWT + refresh token pair

**Password Reset Flow:**
1. User clicks "Forgot Password" on login screen
2. Enters registered email
3. System sends a reset link (with a signed token, valid 30 minutes)
4. User clicks link → sets new password
5. All existing sessions invalidated

### 1.3 Token Strategy

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token (JWT) | 15 minutes | API calls |
| Refresh Token (opaque, stored in DB) | 7 days | Get new access token |
| Email OTP | 10 minutes | Account activation |
| Password Reset Token | 30 minutes | One-time password reset |

> **Why short-lived access tokens?** If a token is stolen, it expires fast. The refresh token is stored server-side, so it can be revoked instantly (logout, suspicious activity, admin action).

### 1.4 New Database Fields / Tables

**Add to `User` model:**
```
emailVerified       Boolean   @default(false)
status              String    @default("PENDING") // PENDING | ACTIVE | SUSPENDED
refreshToken        String?   // hashed, for revocation
passwordResetToken  String?
passwordResetExpiry DateTime?
lastLoginAt         DateTime?
lastLoginIp         String?
```

**New table: `OtpVerification`**
```
id          String    @id @default(uuid())
userId      String
otpHash     String    // bcrypt hash of OTP — never store plain
purpose     String    // EMAIL_VERIFY | PASSWORD_RESET | TWO_FA
expiresAt   DateTime
usedAt      DateTime? // null = not yet used
createdAt   DateTime  @default(now())
```

### 1.5 Email Service

Use **Nodemailer** with one of:
- **Gmail SMTP** (free, good for low volume)
- **SendGrid** (free tier: 100 emails/day — recommended for production)
- **AWS SES** (cheapest at scale: ~₹0.07 per 1,000 emails)

Email templates needed:
- Welcome + OTP verification
- Password reset
- Account suspended notification
- New login from new device (optional)

---

## Part 2: Tenant-Level Role Hierarchy

### 2.1 Roles Defined

| Role | Who | What They Can Do |
|------|-----|-----------------|
| **Owner** | The account creator / business owner | Everything. The only one who can delete the organization or transfer ownership. |
| **Admin** | Senior staff / manager | All CRUD on items, transactions, expenses. View all reports. Manage users (create Manager and below). Cannot remove Owner. |
| **Manager** | Store manager | Create/edit/delete items and transactions. No access to financial P&L or expense data. Cannot manage users. |
| **Reporter** | Accountant / silent partner | Read-only access to all reports and dashboards (P&L, expenses, sales). Cannot create or edit any data. |
| **Reader** | Junior staff / security / stock counter | View inventory list and quantities only. No financial data. No transactions. |

### 2.2 Permission Matrix

| Permission | Owner | Admin | Manager | Reporter | Reader |
|-----------|-------|-------|---------|---------|--------|
| View inventory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add/edit/delete items | ✅ | ✅ | ✅ | ❌ | ❌ |
| Record transactions | ✅ | ✅ | ✅ | ❌ | ❌ |
| View transactions | ✅ | ✅ | ✅ | ✅ | ❌ |
| Record expenses | ✅ | ✅ | ❌ | ❌ | ❌ |
| View expense reports | ✅ | ✅ | ❌ | ✅ | ❌ |
| View P&L / profit dashboard | ✅ | ✅ | ❌ | ✅ | ❌ |
| Export reports (PDF/Excel) | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manage users (create/remove) | ✅ | ✅* | ❌ | ❌ | ❌ |
| Change organization settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |

> *Admin can create Manager, Reporter, Reader. Admin cannot promote to Admin or Owner.

### 2.3 Ownership & Organization Model

Each **organization (tenant)** is created when the first user registers. That user becomes the Owner.

```
Organization (Tenant)
├── id
├── name (e.g., "Ranjit Electronics")
├── ownerId (FK → User who is the Owner)
├── planTier (free | starter | pro | enterprise)
├── status (active | suspended | cancelled)
├── createdAt
└── maxUsers (set by plan tier)

User
├── id
├── organizationId (FK → Organization)
├── role (owner | admin | manager | reporter | reader)
└── ...existing fields
```

### 2.4 Delegating Rights (Owner Workflow)

The Owner can:
1. Go to Settings → Team Members
2. Click "Invite User" → enters email + selects role
3. System sends invitation email with a join link (valid 48 hours)
4. Invitee clicks link → sets password → joins the organization with that role
5. Owner can change roles or remove members at any time

---

## Part 3: Platform Owner Control (Nikhil's View)

### 3.1 The Cisco/Webex Analogy

Just like Cisco:
- **Builds and hosts** Webex (the platform)
- **Partners** create customer accounts
- **Cisco can see** how many accounts exist, license status, usage metrics
- **Cisco cannot see** what meetings are happening inside a customer's Webex

In our system:
- **Nikhil builds and hosts** the inventory app
- **Business owners (tenants)** create their accounts and manage their teams
- **Nikhil can see** all organizations, license types, user counts, last activity
- **Nikhil cannot see** any customer's inventory, transactions, or financial data

### 3.2 Platform Admin Capabilities

| Capability | Details |
|-----------|---------|
| View all organizations | Name, creation date, owner email, user count, plan tier |
| View license status | Active / Suspended / Trial / Expired |
| View activity metrics | Last login date, total transactions recorded, storage used |
| Suspend/reactivate an account | E.g., for non-payment or abuse |
| Reset an organization owner's password | Emergency support case |
| Assign/change plan tier | Upgrade/downgrade a customer's plan |
| View user counts per org | How many seats are used vs allowed |
| Export customer list | For billing/CRM purposes |
| **Cannot do** | View inventory items, transactions, expenses, or any business data |

### 3.3 Platform Admin Dashboard (Design Mockup)

```
╔═══════════════════════════════════════════════════════════╗
║  PLATFORM ADMIN PANEL — Inventory System                  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  OVERVIEW                                                 ║
║  Total Organizations:    47                               ║
║  Active:                 42    Suspended: 3  Trial: 2     ║
║  Total Users:           128                               ║
║  Registrations (Jun):     8   (May): 5   (Apr): 6        ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ORGANIZATIONS                           [Search] [Filter]║
║                                                           ║
║  Org Name          Owner Email         Users Plan  Status ║
║  ─────────────── ─────────────────── ───── ──── ──────── ║
║  Ranjit Electronics ranjit@gmail.com   4     Pro  Active  ║
║  Metro Traders     metro@yahoo.com     2     Free Active  ║
║  Sharma & Sons     sharma@outlook.com  7     Ent  Active  ║
║  Quick Mart        quick@gmail.com     1     Free Susp.   ║
║  ...                                                      ║
║                                                           ║
║  [View Details]  [Suspend]  [Change Plan]  [Reset Owner PW]║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 3.4 Data Isolation Guarantee

The platform admin endpoints will be designed to **explicitly exclude** all business data:

- **Allowed queries:** `SELECT id, name, createdAt, status, planTier FROM Organization`
- **Never exposed:** Items, Transactions, Expenses, or any organization-specific business records
- The platform admin role exists **outside** the tenant data model — it is a separate authentication scope entirely

### 3.5 Platform Admin Authentication

The platform admin (Nikhil) authenticates via a **separate login page** (`/platform-admin`) with:
- Separate credentials (not tied to any organization)
- No invitation flow — these credentials are hardcoded/seeded at setup
- Possibly IP-restricted (only accessible from known IPs)
- All platform admin actions are logged in an audit trail

---

## Part 4: Implementation Plan (Future)

### Phase A: Email Authentication (Do First)
1. Add email verification OTP on registration
2. Add password reset via email
3. Add refresh token rotation
4. Choose email provider (recommend SendGrid)

**Estimated effort:** 3-4 days backend, 1-2 days frontend

### Phase B: Tenant Role Hierarchy (Do Second)
1. Add `Organization` table to Prisma schema
2. Refactor `User` to belong to an Organization
3. Update role enum: `owner | admin | manager | reporter | reader`
4. Add permission middleware per route
5. Build "Team Members" UI (invite, assign roles, remove)

**Estimated effort:** 1 week backend, 3-4 days frontend

### Phase C: Platform Admin Panel (Do Third)
1. Seed a platform admin user outside the tenant model
2. Build platform admin API routes (read-only org metadata)
3. Build platform admin dashboard UI
4. Add suspend/unsuspend + plan management
5. Add audit logging for all platform admin actions

**Estimated effort:** 3-4 days backend, 1 week frontend

---

## Key Design Decisions

| Decision | Choice | Reason |
|---------|--------|--------|
| OTP length | 6 digits | Industry standard, easy to type |
| OTP expiry | 10 minutes | Secure but practical |
| Access token lifetime | 15 minutes | Limits damage if stolen |
| Refresh token storage | Server-side DB | Enables instant revocation |
| Email provider | SendGrid | Reliable free tier, good deliverability |
| Platform admin scope | Metadata only | Data isolation — tenants trust that Nikhil cannot see their business |
| Invitation model | Email invite link | Simpler than requiring Owner to set password for others |
| Multi-tenancy model | Separate `Organization` table with FK on User | Clean, industry-standard approach |

---

## What NOT to Build Yet

- SSO / OAuth (Google/Microsoft login) — complexity not needed at early stage
- Hardware 2FA (TOTP apps like Google Authenticator) — nice but not urgent
- Per-field data encryption — overkill for this scale
- GDPR/data deletion workflows — add when going international

These can be added later when the customer base grows.

---

## Summary

This design transforms the app from a single-user tool into a proper **multi-tenant SaaS platform** with:
- **Verified identities** (no fake accounts, password recovery)
- **Business-appropriate access control** (staff see only what they need)
- **Vendor oversight** (you stay in control of the platform without invading customer privacy)

Build this after the core business features (expenses, reports) are stable.
