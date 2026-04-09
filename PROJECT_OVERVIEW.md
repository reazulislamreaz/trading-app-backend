# Trading Signal Platform — Comprehensive Project Documentation

> **Version:** 2.0.0  
> **Last Updated:** April 2026  
> **Platform Type:** SaaS (Software as a Service)  
> **Tech Stack:** Node.js · Express 5 · TypeScript · MongoDB · Stripe  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [User Workflows](#5-user-workflows)
6. [System Architecture](#6-system-architecture)
7. [Database Design](#7-database-design)
8. [API Endpoints Summary](#8-api-endpoints-summary)
9. [Subscription & Billing](#9-subscription--billing)
10. [Security & Compliance](#10-security--compliance)
11. [External Integrations](#11-external-integrations)
12. [Automated System Jobs](#12-automated-system-jobs)
13. [Deployment & Infrastructure](#13-deployment--infrastructure)
14. [Scalability & Performance](#14-scalability--performance)
15. [Development & Maintenance](#15-development--maintenance)

---

## 1. Executive Summary

The **Trading Signal Platform** is a production-ready, multi-tenant SaaS application that connects **trading signal providers (Master Traders)** with **subscribers (Users)** who want access to professional trading insights. The platform handles the entire business lifecycle — from user registration and subscription management to signal distribution, copy trading, and performance analytics — all secured with enterprise-grade authentication and payment processing.

### Key Value Propositions

| For Users | For Master Traders | For Platform Owners |
|-----------|-------------------|---------------------|
| Access verified trading signals from approved experts | Monetize trading expertise through subscriptions | Recurring revenue via subscription billing |
| Copy trades automatically into personal journal | Build reputation and follower base | Centralized admin control & analytics |
| Track performance with leaderboards and stats | Featured placement and visibility | Stripe-powered automated billing |
| Transparent performance metrics | Analytics on signal engagement | Scalable, Docker-based infrastructure |

---

## 2. Platform Overview

### What the Platform Does

The platform serves as a **centralized marketplace for trading signals**, where:

1. **Master Traders** publish trading signals (entry points, targets, stop losses, analysis)
2. **Subscribers** pay for access to these signals based on their subscription tier
3. **Users** can copy signals, track trade outcomes, and compare performance
4. **Admins** manage the platform, approve Master Traders, and monitor business health

### How It Works (Simplified)

```
Master Trader creates signal → Platform validates & publishes → Subscribers receive signal → Users can copy/track trades → Performance is ranked on leaderboards
```

### Platform Characteristics

- **Multi-tenant:** Single instance serving all users with data isolation by role and subscription
- **Subscription-gated:** Access to signals and features is controlled by active subscription tiers
- **Production-ready:** Includes CI/CD, Docker deployment, health checks, and automated backups
- **Secure:** JWT authentication, 2FA, rate limiting, input sanitization, and token rotation

---

## 3. User Roles & Permissions

The platform operates with three distinct roles, each with specific capabilities:

### 3.1 User (Subscriber)

The default role for anyone who registers on the platform.

| Capability | Description |
|------------|-------------|
| Browse signals (limited) | View public signals with tier-based limitations |
| Subscribe to plans | Choose from Free, Basic, or Pro subscription tiers |
| Follow Master Traders | Subscribe to specific traders for their content |
| Copy trades | Log and track trades based on signals |
| Access leaderboards | View top performers and rankings |
| Manage profile | Update name and profile image |
| Enable 2FA | Secure account with two-factor authentication |

### 3.2 Master Trader

Approved trading professionals who publish signals.

| Capability | Description |
|------------|-------------|
| All User capabilities | Inherits all subscriber permissions |
| Create & manage signals | Full CRUD on trading signals with scheduling |
| Signal engagement tracking | View likes, bookmarks, shares, and copier stats |
| Master Trader profile | Manage public profile with reputation metrics |
| Performance analytics | Access detailed stats on signal performance |
| Copy trade management | View who copied their signals and outcomes |

> **Note:** Master Traders are **approved by Admin** — they cannot self-promote to this role.

### 3.3 Admin

Platform administrators with full oversight capabilities.

| Capability | Description |
|------------|-------------|
| All User & Master capabilities | Full platform access |
| Approve Master Traders | Review and approve trader applications |
| Manage users | View, search, suspend, or modify user roles |
| Platform analytics | Dashboard with revenue, user, and engagement metrics |
| Broadcast notifications | Send announcements to all users |
| Toggle featured content | Highlight specific Master Traders or signals |
| View payment logs | Monitor all subscription transactions |

---

## 4. Core Features

### 4.1 Authentication & Account Management

A complete, production-grade authentication system.

| Feature | Details |
|---------|---------|
| **Registration** | Email-based with OTP verification |
| **Login** | Email + password with optional 2FA code |
| **Session Management** | JWT access tokens (15 min) + refresh tokens (7 days) |
| **Token Rotation** | Automatic refresh token rotation on each use |
| **Token Blacklisting** | Immediate revocation on logout |
| **2FA (TOTP)** | Authenticator app integration with QR code, 10 backup codes |
| **Password Reset** | OTP-based email flow with rate limiting |
| **Account Lockout** | 5 failed attempts triggers 30-minute lockout |
| **Account Status** | ACTIVE, INACTIVE, SUSPENDED, DELETED, UNVERIFIED |

### 4.2 Trading Signals

The core content of the platform — actionable trading intelligence.

| Feature | Details |
|---------|---------|
| **Signal Creation** | Masters create signals with entry price, targets, stop loss, direction (LONG/SHORT), timeframe |
| **Scheduled Publishing** | Signals can be drafted and scheduled for future publication |
| **Engagement Tracking** | Likes, bookmarks, shares — full counter system |
| **Featured Signals** | Admin-curated highlights for top visibility |
| **Signal Limits** | Enforced per subscription tier (e.g., Free = 3/month, Basic = 50/month, Pro = unlimited) |
| **Media Support** | Images/charts attached via file upload system |
| **Public Browse** | Non-subscribers see limited signal preview |

### 4.3 Subscription Management

Stripe-powered subscription billing with flexible plan management.

| Feature | Details |
|---------|---------|
| **6 Default Plans** | Free, Basic Monthly ($29), Basic Yearly ($290), Pro Monthly ($79), Pro Yearly ($790), Master Trader Monthly ($49) |
| **Stripe Checkout** | Hosted checkout pages for secure payment |
| **7-Day Trial** | First-time subscribers get a free trial period |
| **Self-Service Portal** | Users manage subscriptions via Stripe billing portal |
| **Upgrade/Downgrade** | Prorated immediate upgrades, cycle-end downgrades |
| **Cancellation** | Cancel or resume subscriptions at any time |
| **Usage Tracking** | Real-time signal usage monitoring per tier |
| **Expiry Alerts** | Automated emails 7, 3, and 1 days before expiry |
| **Payment History** | Complete transaction log for each user |

### 4.4 Follow System

Social graph connecting Users to Master Traders.

| Feature | Details |
|---------|---------|
| **Follow/Unfollow** | Toggle relationship with any Master Trader |
| **Following List** | See which Masters a user follows |
| **Followers List** | Masters see their subscriber count |
| **Follower Analytics** | Growth metrics for Master Traders |

### 4.5 Copy Trading & Trade Journal

Track the outcome of trades executed from signals.

| Feature | Details |
|---------|---------|
| **Copy Signal** | User logs intent to follow a signal |
| **Log Trade Result** | Record entry/exit price, PnL, outcome |
| **Trade History** | Complete journal with summary statistics |
| **Copier Stats** | Masters see how many users copied each signal |
| **Performance Comparison** | Compare copy trade results against original signal |

### 4.6 Leaderboards & Rankings

Composite scoring system to surface top performers.

| Feature | Details |
|---------|---------|
| **Composite Score** | 40% win rate + 30% PnL + 20% followers + 10% activity |
| **Top Traders** | Rank by individual metrics (win rate, avg PnL, signals, followers) |
| **Top Contributors** | Engagement-based ranking with timeframe filters |
| **User Rank** | Individual ranking retrieval |
| **Trader Comparison** | Side-by-side comparison of two Master Traders |

### 4.7 Engagement & Points System

Gamification layer to encourage platform activity.

| Feature | Details |
|---------|---------|
| **7 Activity Types** | Signal creation, likes, bookmarks, shares, follows, trade copies, comments |
| **Point Values** | Each activity type has an assigned point value |
| **Contribution Stats** | Per-user aggregation and ranking |
| **Timeframe Filters** | Daily, weekly, monthly, all-time rankings |

### 4.8 Notifications

In-app notification system with 12 notification types.

| Feature | Details |
|---------|---------|
| **Create & List** | Full CRUD on user notifications |
| **Mark Read** | Individual or bulk mark-as-read |
| **Unread Count** | Badge counter for UI display |
| **Broadcast** | Admin sends platform-wide announcements |

### 4.9 File Upload

Centralized file management with cloud storage.

| Feature | Details |
|---------|---------|
| **Single Upload** | One file at a time, returns CDN URL |
| **Batch Upload** | Up to 10 files simultaneously |
| **Storage Backends** | AWS S3 (primary) with local fallback |
| **File Types** | Images (jpg, jpeg, png, webp), Documents (pdf, csv) |
| **Size Limit** | 20MB per file |
| **Rate Limiting** | 20 uploads per hour per user |

### 4.10 Admin Dashboard

Centralized platform management and analytics.

| Feature | Details |
|---------|---------|
| **Analytics Dashboard** | Total users, revenue, active subscriptions, signal counts |
| **User Management** | List, search, suspend, change roles |
| **Master Approval** | Review and approve Master Trader applications |
| **Broadcast System** | Send announcements to all users |
| **Payment Logs** | View all Stripe transactions |
| **Featured Content** | Toggle featured signals and Master Traders |

---

## 5. User Workflows

### 5.1 New User Onboarding

```
1. User visits platform → Registers with email, name, password
2. Receives verification email with OTP code
3. Verifies email → Account becomes ACTIVE
4. Logs in → Receives access & refresh tokens
5. (Optional) Enables 2FA via authenticator app
6. Browses subscription plans → Chooses a plan
7. Completes Stripe checkout → 7-day trial begins
8. Starts following Master Traders and viewing signals
```

### 5.2 Master Trader Signal Publishing

```
1. Master Trader logs in → Creates signal
   - Defines: direction (LONG/SHORT), entry price, targets, stop loss
   - Adds: analysis notes, charts/images
   - Sets: publish immediately OR schedule for later
2. Signal is published → Visible to subscribers
3. Engagement is tracked → Likes, bookmarks, shares, copies
4. Master views analytics → Performance dashboard
```

### 5.3 User Consuming Signals

```
1. User browses signals → Filtered by followed Masters + subscription tier
2. Views signal details → Entry, targets, analysis, charts
3. (Optional) Copies signal → Logs intent to trade
4. Executes trade on their own platform
5. Logs trade result → Entry/exit price, PnL, outcome
6. Trade appears in journal → Performance tracking
7. Contributes to leaderboard ranking
```

### 5.4 Subscription Lifecycle

```
1. User selects plan → Redirected to Stripe Checkout
2. Completes payment → `checkout.session.completed` webhook fires
3. Subscription created → `invoice.paid` confirms payment
4. User accesses features → Subscription guard enforces tier limits
5. (Optional) Upgrades → Prorated charge, immediate access
6. (Optional) Cancels → Access continues until billing period ends
7. Subscription expires → `customer.subscription.deleted` fires
8. Access reverts to Free tier limits
```

### 5.5 Admin Approval Workflow

```
1. User applies to be Master Trader → Submits request
2. Admin reviews application → Checks profile, history, activity
3. Admin approves → Role changes to MASTER
4. User gains signal creation permissions
5. Admin can toggle featured status → Increased visibility
```

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│              (Web App / Mobile App / Admin Panel)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Reverse Proxy (Nginx)                     │
│              SSL Termination · Rate Limiting                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Server (Node.js)                │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │ Signals  │  │ Subscrip-│  │  Admin   │    │
│  │ Module   │  │  Module  │  │  tion    │  │  Module  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Follow  │  │  Copy    │  │ Leader-  │  │Notifica- │    │
│  │  Module  │  │  Trades  │  │  board   │  │  tions   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                          │   │
│  │  Auth · Rate Limiter · Validation · Error Handler     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Cron Job Scheduler                        │   │
│  │  Signal Publish · Usage Reset · Expiry Alerts         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ MongoDB  │ │  Stripe  │ │  AWS S3  │
       │  (Data)  │ │(Payments)│ │ (Files)  │
       └──────────┘ └──────────┘ └──────────┘
```

### 6.2 Application Startup Flow

```
1. Server boots → Validates DB_URL environment variable
2. Connects to MongoDB → Exponential backoff retry (3 attempts)
3. Runs auto-seeds → Admin user, subscription plans, Stripe sync, demo users
4. Registers cron jobs → Signal publish, usage reset, expiry alerts
5. Builds Express middleware pipeline → Security, parsing, routing
6. Mounts webhook handler → Before express.json() for Stripe signature
7. Mounts API routes → All 13 module routers under /api/v1
8. Starts HTTP server → 30s request timeout
9. Registers graceful shutdown → SIGTERM/SIGINT with 10s forced timeout
```

### 6.3 Request Processing Pipeline

Every incoming HTTP request flows through:

```
Request → Helmet (security headers)
        → CORS (origin validation)
        → Morgan (request logging)
        → Rate Limiter (throttling)
        → Webhook Router (Stripe, raw body)
        → express.json() (body parsing)
        → cookie-parser (cookie reading)
        → Route Handler (module-specific)
          → Zod Validation (input check)
          → Auth Middleware (JWT verify + role check)
          → Subscription Guard (tier enforcement, if applicable)
          → Controller (HTTP handling)
          → Service (business logic)
          → Mongoose (database operation)
        → Response Formatter (standardized output)
        → Global Error Handler (catches and formats errors)
```

### 6.4 Module Structure Pattern

Each feature module follows a consistent structure:

```
module-name/
├── module-name.interface.ts      # TypeScript type definitions
├── module-name.schema.ts         # Mongoose database schema
├── module-name.validation.ts     # Zod validation schemas
├── module-name.route.ts          # Express route definitions
├── module-name.controller.ts     # HTTP request handlers
├── module-name.service.ts        # Business logic layer
├── module-name.swagger.ts        # OpenAPI documentation
└── index.ts                      # Module exports (optional)
```

### 6.5 Design Patterns

| Pattern | Usage |
|---------|-------|
| **Controller-Service** | Separation of HTTP handling from business logic |
| **Middleware Chain** | Composable request processing pipeline |
| **Singleton** | Database connection, logger, config |
| **Factory** | JWT token generation, email sending |
| **Strategy** | File upload (S3 primary, local fallback) |
| **Observer** | MongoDB connection event listeners |
| **Idempotent Seeding** | Safe repeated execution without duplicates |
| **Standardized Response** | Consistent `{ success, message, data, meta }` format |

---

## 7. Database Design

### 7.1 Database Overview

The platform uses **MongoDB** with **Mongoose ODM** for data persistence. The database consists of **11 core collections** with well-defined relationships enforced at the application layer.

### 7.2 Data Models

| Model | Collection | Purpose | Key Fields |
|-------|-----------|---------|------------|
| **Account** | `accounts` | Unified user table | email, password, role, accountStatus, twoFactorEnabled, subscriptionStatus |
| **Token Blacklist** | `token_blacklist` | JWT revocation | token, expiresAt (TTL index) |
| **Subscription Plan** | `subscriptionPlans` | Plan definitions | name, price, interval, signalLimit, stripeProductId, stripePriceId |
| **Subscription** | `subscriptions` | Active subscriptions | userId, status, currentPeriodEnd, stripeSubscriptionId |
| **Payment** | `payments` | Transaction records | userId, amount, currency, stripePaymentIntentId, status |
| **Signal** | `signals` | Trading signals | masterId, direction, entryPrice, targets, stopLoss, status, likesCount, bookmarksCount, sharesCount |
| **Master** | `masters` | Trader profiles | userId, bio, tradingStyle, winRate, avgPnL, followersCount, isFeatured |
| **Follow** | `follows` | User-Master relationships | followerId, masterId (unique compound index) |
| **Notification** | `notifications` | In-app notifications | userId, type, title, message, isRead, createdAt |
| **Copied Trade** | `copied_trades` | Trade journal entries | userId, signalId, entryPrice, exitPrice, pnl, status |
| **Contribution** | `contributions` | Engagement tracking | userId, activityType, points, createdAt |

### 7.3 Key Relationships

```
Account (1) ────< Subscription (N)        (One user has many subscriptions over time)
Account (1) ────< Payment (N)             (One user has many payment records)
Account (1) ────< Signal (N)              (One Master creates many signals)
Account (1) ────< Master (1)              (One account can be one Master profile)
Account (1) ────< Follow (N)              (One user follows many Masters)
Master (1) ────< Follow (N)               (One Master has many followers)
Signal (1) ────< Copied Trade (N)         (One signal is copied by many users)
Account (1) ────< Notification (N)        (One user has many notifications)
Account (1) ────< Contribution (N)        (One user has many contribution records)
```

### 7.4 Indexing Strategy

| Index Type | Fields | Purpose |
|------------|--------|---------|
| **Unique** | `email` | Prevent duplicate accounts |
| **Unique Compound** | `followerId + masterId` | Prevent duplicate follows |
| **TTL** | `token_blacklist.expiresAt` | Auto-expire blacklisted tokens |
| **Standard** | `role`, `accountStatus`, `masterId`, `userId` | Query optimization |
| **Text** | `name`, `analysis` (on signals) | Search functionality |

---

## 8. API Endpoints Summary

The platform exposes **60+ RESTful API endpoints** organized into 13 modules, all under `/api/v1`.

### 8.1 Endpoint Overview

| Module | Base Path | Endpoints | Key Operations |
|--------|-----------|-----------|----------------|
| **Authentication** | `/auth` | 14 | Register, login, logout, password reset, email verify, 2FA setup/enable/disable, backup codes, token refresh |
| **User Management** | `/user` | 4 | Update profile, list all users (admin), get single user (admin), suspend user (admin) |
| **File Upload** | `/upload` | 2 | Single file upload, batch file upload (up to 10) |
| **Subscriptions** | `/subscription` | 10 | Get plans, create checkout, cancel, resume, upgrade, billing portal, payment history, usage stats |
| **Signals** | `/signals` | 11 | List signals (public), get single, create, update, delete (master), like, bookmark, share, toggle featured (admin) |
| **Master Traders** | `/masters` | 7 | List masters, get single, create profile (master), update profile, get my stats, approve (admin), toggle featured (admin) |
| **Follow System** | `/follow` | 5 | Follow, unfollow, toggle, get following, get followers, check status |
| **Notifications** | `/notifications` | 5 | List notifications, mark read, mark all read, delete, unread count |
| **Copy Trading** | `/copied-trades` | 8 | Copy signal, log trade result, trade history with summary, get detail, delete, get copiers (master), get master stats, cancel |
| **Contributions** | `/contributions` | 3 | Top contributors (with timeframes), my contributions, user stats |
| **Leaderboard** | `/leaderboard` | 2 | Composite leaderboard, get user rank |
| **Top Traders** | `/top-traders` | 3 | Rank by metric, trader detail, compare two traders |
| **Admin** | `/admin` | 4 | Platform analytics, broadcast, change role, payment logs |

### 8.2 Webhook Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhooks/stripe` | POST | Handle Stripe events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted, payment_intent.succeeded, charge.refunded |

### 8.3 System Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Server status check |
| `/health` | GET | Health check (database + server status) |
| `/docs` | GET | Interactive Swagger/OpenAPI documentation |

### 8.4 Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## 9. Subscription & Billing

### 9.1 Subscription Plans

The platform ships with 6 pre-configured plans:

| Plan | Price | Billing Cycle | Signal Limit | Media Access | Stripe Synced |
|------|-------|--------------|--------------|--------------|---------------|
| **Free** | $0 | Monthly | 3 signals/month | No | No |
| **Basic Monthly** | $29 | Monthly | 50 signals/month | Yes | Yes |
| **Basic Yearly** | $290 | Yearly | 50 signals/month | Yes | Yes |
| **Pro Monthly** | $79 | Monthly | Unlimited | Yes | Yes |
| **Pro Yearly** | $790 | Yearly | Unlimited | Yes | Yes |
| **Master Trader Monthly** | $49 | Monthly | Unlimited | Yes | Yes |

### 9.2 Billing Flow

```
1. User selects plan → Platform creates Stripe Checkout Session
2. User redirected to Stripe hosted checkout → Enters payment details
3. Stripe processes payment → Sends webhook to platform
4. Platform handles webhook → Creates Subscription record, logs Payment
5. User receives access → Subscription guard allows feature usage
6. Next billing cycle → Stripe auto-charges, sends invoice.paid webhook
7. User cancels → Subscription stays active until period end
8. Subscription deleted → Access reverts to Free tier
```

### 9.3 Trial Period

- **First-time subscribers** receive a **7-day free trial**
- No payment method required to start trial (configured per Stripe plan)
- Trial automatically converts to paid subscription at period end
- If payment fails, subscription is suspended

### 9.4 Upgrade & Downgrade

| Action | Timing | Billing |
|--------|--------|---------|
| **Upgrade** | Immediate | Prorated charge for remaining period |
| **Downgrade** | End of current billing cycle | No refund, new rate applies next cycle |

### 9.5 Subscription Enforcement

The `subscription_guard` middleware enforces:

- **Active subscription check** — Blocks access if subscription is expired/cancelled
- **Tier level check** — Ensures user's plan grants access to requested feature
- **Signal limit enforcement** — Counts and blocks usage beyond tier limit
- **Automatic usage reset** — Cron job resets counters on billing cycle change

---

## 10. Security & Compliance

### 10.1 Authentication Security

| Mechanism | Implementation |
|-----------|----------------|
| **Password Hashing** | Bcrypt with 12 salt rounds (configurable) |
| **JWT Tokens** | Access tokens (15 min) + Refresh tokens (7 days) |
| **Token Blacklisting** | Immediate revocation on logout, with TTL auto-cleanup |
| **Token Rotation** | New refresh token issued on each refresh, old one invalidated |
| **2FA (TOTP)** | SHA1-based, 6-digit codes, 30-second period, 10 backup codes |
| **Account Lockout** | 5 failed login attempts → 30-minute lockout |
| **Account Status Checks** | Every authenticated request verifies account is ACTIVE and VERIFIED |

### 10.2 API Security

| Mechanism | Implementation |
|-----------|----------------|
| **Rate Limiting** | API: 100 req/15min, Auth: 50 req/15min, Password reset: 10/hr, Checkout: 5/hr, Uploads: 20/hr |
| **Helmet.js** | Security headers (X-Frame-Options, X-Content-Type-Options, etc.) |
| **CORS** | Configurable allowed origins, credentials enabled |
| **Input Validation** | Zod schemas at middleware layer (before controllers) |
| **MongoDB Injection Prevention** | Sanitized query building, no raw user input in queries |
| **Field Whitelisting** | Profile updates restricted to `name` and `userProfileUrl` only |

### 10.3 Data Protection

| Mechanism | Implementation |
|-----------|----------------|
| **Environment Variables** | All secrets stored in `.env`, never in code |
| **HTTPS Ready** | Trust proxy enabled for reverse proxy deployments |
| **Cookie Security** | HTTP-only, secure refresh token cookies |
| **Error Sanitization** | Production errors never leak stack traces or internal details |
| **Request Logging** | Morgan + Winston for audit trails |

---

## 11. External Integrations

### 11.1 Stripe (Payments & Billing)

| Capability | Details |
|------------|---------|
| **Customer Management** | Auto-create Stripe customers on first subscription |
| **Product/Price Sync** | Plans auto-sync to Stripe Products & Prices on seed |
| **Checkout Sessions** | Hosted checkout pages with 7-day trial support |
| **Billing Portal** | Self-service portal for payment method updates, cancellations |
| **Webhook Handling** | Idempotent event processing (in-memory cache, 24h TTL) |
| **Event Types** | 7 events handled: checkout completion, invoice paid/failed, subscription updated/deleted, payment succeeded, charge refunded |
| **Graceful Degradation** | Platform functions without Stripe keys (sync skipped) |

### 11.2 AWS S3 (File Storage)

| Capability | Details |
|------------|---------|
| **Primary Storage** | All uploaded files stored in S3 buckets |
| **Automatic Fallback** | Local storage used if S3 is unavailable or misconfigured |
| **Bucket Validation** | Rejects placeholder values and region names |
| **CDN Ready** | Returns full S3 URLs for direct client access |

### 11.3 Gmail SMTP (Email Service)

| Capability | Details |
|------------|---------|
| **Email Types** | Account verification, password reset, subscription expiry alerts |
| **Connection Pooling** | Max 5 connections, 100 messages each |
| **HTML Templates** | Responsive, branded email templates |
| **Fire-and-Forget** | Non-blocking by default, blocking mode available |
| **Template Support** | Customizable HTML email layouts |

### 11.4 Cloudinary (Alternative Storage)

| Capability | Details |
|------------|---------|
| **Backup Option** | Alternative to S3 for image storage |
| **Image Optimization** | Auto-resize, format conversion |

---

## 12. Automated System Jobs

The platform runs three scheduled cron jobs for maintenance and automation:

### 12.1 Signal Publish Scheduler

| Property | Value |
|----------|-------|
| **Schedule** | Every minute |
| **Purpose** | Checks for drafted signals whose `scheduledAt` time has passed |
| **Action** | Updates signal status from `DRAFT` to `PUBLISHED` |
| **Impact** | Enables Masters to prepare content in advance |

### 12.2 Signal Usage Reset

| Property | Value |
|----------|-------|
| **Schedule** | Every hour |
| **Purpose** | Resets `signalsUsed` counter when billing period expires |
| **Action** | Checks subscription billing cycles, resets counters for new periods |
| **Impact** | Ensures users get fresh signal allowances each billing cycle |

### 12.3 Subscription Expiry Notifications

| Property | Value |
|----------|-------|
| **Schedule** | Daily at 9:00 AM UTC |
| **Purpose** | Emails users whose subscriptions expire in 7, 3, or 1 days |
| **Action** | Queries subscriptions by `currentPeriodEnd`, sends templated emails |
| **Impact** | Reduces churn by reminding users to renew before losing access |

---

## 13. Deployment & Infrastructure

### 13.1 Deployment Options

| Method | Description |
|--------|-------------|
| **Docker Compose** | Multi-container: MongoDB 7 + App (Node 20) + optional Nginx |
| **VPS with CI/CD** | GitHub Actions auto-deploy on push to main branch |
| **Manual** | `npm run build && npm start` on any Node.js server |

### 13.2 Docker Architecture

```
┌─────────────────────────────────────────────┐
│                Docker Network                │
│                                              │
│  ┌──────────────┐  ┌───────────────────┐    │
│  │   MongoDB 7  │  │   App Container   │    │
│  │   (Port      │  │   (Node 20,       │    │
│  │    27017)    │◄─┤    Port 5000)     │    │
│  └──────────────┘  └───────────────────┘    │
│                                              │
│  ┌───────────────────┐ (optional)            │
│  │     Nginx         │                       │
│  │   (Port 80/443)   │◄── Reverse proxy      │
│  └───────────────────┘                       │
└─────────────────────────────────────────────┘
```

### 13.3 Docker Build Process

**Multi-stage build** for optimized production images:

| Stage | Purpose |
|-------|---------|
| **Builder** | Install all dependencies (`npm ci`), compile TypeScript (`tsc`) |
| **Production** | Install production-only dependencies, copy compiled `dist/`, run as non-root user |

### 13.4 CI/CD Pipeline

GitHub Actions workflow:

```
1. Code pushed to main branch
2. GitHub Actions triggers
3. Build Docker image
4. Deploy to VPS via SSH
5. Restart containers
6. Health check verification
```

### 13.5 Environment Configuration

Required environment variables (25+ total):

| Category | Variables |
|----------|-----------|
| **Server** | `PORT`, `NODE_ENV`, `BACKEND_IP` |
| **Database** | `DB_URL` |
| **JWT** | `ACCESS_TOKEN`, `REFRESH_TOKEN`, `ACCESS_EXPIRES`, `REFRESH_EXPIRES` |
| **Auth** | `RESET_SECRET`, `RESET_EXPIRES`, `VERIFIED_TOKEN` |
| **CORS** | `FRONT_END_URL`, `ALLOWED_ORIGINS` |
| **Email** | `APP_USER_EMAIL`, `APP_PASSWORD` |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Storage** | `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` |
| **Admin** | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| **Seeding** | `AUTO_SEED` |

---

## 14. Scalability & Performance

### 14.1 Current Architecture Capabilities

| Aspect | Implementation |
|--------|----------------|
| **Connection Pooling** | MongoDB connection pool with configurable size |
| **Rate Limiting** | Per-IP throttling prevents abuse |
| **File Upload Limits** | 20MB per file, 10 files per batch, 20 uploads/hour |
| **Request Timeout** | 30-second server-level timeout |
| **Graceful Shutdown** | SIGTERM/SIGINT handling with 10s forced termination |
| **Caching Ready** | Architecture supports Redis/Memcached integration |
| **Horizontal Scaling** | Stateless design — multiple instances behind load balancer |

### 14.2 Database Optimization

| Technique | Details |
|-----------|---------|
| **Indexing** | Unique, compound, TTL, and standard indexes on query-heavy fields |
| **Pagination** | All list endpoints support `page`/`limit` parameters |
| **Projection** | Selective field retrieval to reduce payload |
| **Aggregation** | Composite leaderboard scoring via MongoDB aggregation pipeline |

### 12.3 Future Scaling Opportunities

| Area | Recommendation |
|------|----------------|
| **Caching** | Add Redis for session storage, API response caching, leaderboard caching |
| **CDN** | Use CloudFront/Cloudflare for static assets and file uploads |
| **Message Queue** | Introduce RabbitMQ/Kafka for async email sending, webhook processing |
| **Database Sharding** | MongoDB horizontal partitioning for signal/copy_trade collections at scale |
| **Microservices** | Split authentication, subscription, and signal modules into separate services |
| **WebSockets** | Real-time signal notifications, live leaderboard updates |

---

## 15. Development & Maintenance

### 15.1 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Production server |
| `npm run seed` | Seed database (admin, plans, demo users) |
| `npm run seed:production` | Seed database in production mode |
| `npm run db:reset` | Reset and re-seed database |
| `npm test` | Run test suite (Jest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking without compilation |

### 15.2 Code Quality Standards

| Standard | Tool |
|----------|------|
| **Type Safety** | TypeScript strict mode |
| **Linting** | ESLint with TypeScript parser |
| **Formatting** | Prettier |
| **Testing** | Jest with ts-jest, 50% coverage threshold |
| **Validation** | Zod schemas for all API inputs |

### 15.3 Testing Strategy

| Aspect | Details |
|--------|---------|
| **Framework** | Jest + Supertest |
| **Test Database** | Separate MongoDB database for tests |
| **Coverage Thresholds** | 50% minimum across statements, branches, functions, lines |
| **Test Structure** | Per-module test files following `*.test.ts` naming |

### 15.4 Project Dependencies

**Production (23 packages):**

| Category | Packages |
|----------|----------|
| **Framework** | express, cors, helmet, morgan, cookie-parser |
| **Database** | mongoose |
| **Validation** | zod, express-zod-validator |
| **Auth** | jsonwebtoken, bcrypt, otpauth |
| **File Upload** | multer, aws-sdk, cloudinary |
| **Email** | nodemailer |
| **Payments** | stripe |
| **Utilities** | dotenv, winston, ts-node-dev |

**Development (15 packages):**

| Category | Packages |
|----------|----------|
| **TypeScript** | typescript, @types/*, ts-jest |
| **Testing** | jest, supertest, @types/jest |
| **Linting** | eslint, @typescript-eslint/* |
| **Formatting** | prettier |

### 15.5 Documentation Resources

| Document | Purpose |
|----------|---------|
| `readme.md` | Main project overview, quick start, feature list |
| `API_DOCUMENTATION.md` | Complete endpoint reference with request/response examples |
| `DEPLOYMENT.md` | VPS deployment walkthrough |
| `QUICK_DEPLOY.md` | 5-minute quick start deployment guide |
| `STRIPE_INTEGRATION_GUIDE.md` | Full Stripe setup and configuration guide |
| `WEBHOOK_TESTING_GUIDE.md` | Stripe webhook testing with ngrok |
| `schema.dbml` | Visual database schema in DBML format |
| `/docs` (Swagger) | Interactive API documentation with try-it-out functionality |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Master Trader** | An approved trading professional who publishes signals |
| **Signal** | A trading recommendation with entry, targets, and stop loss |
| **Copy Trade** | A user's logged trade based on a Master's signal |
| **Subscription Tier** | A plan level determining feature access (Free, Basic, Pro) |
| **Token Rotation** | Issuing new refresh tokens on each refresh for security |
| **Idempotent** | An operation that produces the same result when called multiple times |
| **Webhook** | A callback URL triggered by external events (e.g., Stripe payments) |
| **TTL Index** | MongoDB Time-To-Live index that auto-deletes documents after expiry |
| **Cron Job** | A scheduled task that runs at fixed intervals |
| **SaaS** | Software as a Service — subscription-based software delivery |

---

## Appendix B: API Quick Reference

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Any | Register new account |
| POST | `/api/v1/auth/login` | No | Any | Authenticate user |
| POST | `/api/v1/auth/logout` | Yes | USER, ADMIN | Logout and revoke tokens |
| POST | `/api/v1/auth/2fa/setup` | Yes | USER, ADMIN | Initiate 2FA setup |
| GET | `/api/v1/auth/me` | Yes | USER, ADMIN | Get current user profile |
| PATCH | `/api/v1/user/update-profile` | Yes | USER, ADMIN | Update profile |
| GET | `/api/v1/user` | Yes | ADMIN | List all users |
| POST | `/api/v1/upload/file` | Yes | USER, ADMIN | Upload single file |
| GET | `/api/v1/subscription/plans` | Yes | USER, ADMIN | Get subscription plans |
| POST | `/api/v1/subscription/checkout` | Yes | USER, ADMIN | Create checkout session |
| GET | `/api/v1/signals` | Partial | Any | List signals (public + gated) |
| POST | `/api/v1/signals` | Yes | MASTER | Create new signal |
| POST | `/api/v1/signals/:id/like` | Yes | USER, ADMIN | Like a signal |
| GET | `/api/v1/masters` | No | Any | List Master Traders |
| POST | `/api/v1/masters/approve/:id` | Yes | ADMIN | Approve Master Trader |
| POST | `/api/v1/follow/:masterId` | Yes | USER, ADMIN | Follow a Master |
| GET | `/api/v1/notifications` | Yes | USER, ADMIN | Get notifications |
| POST | `/api/v1/copied-trades` | Yes | USER, ADMIN | Copy a signal |
| GET | `/api/v1/leaderboard` | No | Any | View leaderboard |
| GET | `/api/v1/admin/analytics` | Yes | ADMIN | Platform analytics |
| POST | `/api/v1/admin/broadcast` | Yes | ADMIN | Send announcement |
| GET | `/health` | No | Any | Health check |
| GET | `/docs` | No | Any | Swagger documentation |

---

## Appendix C: Environment Checklist

Before deploying to production, ensure all of the following are configured:

- [ ] `DB_URL` — MongoDB connection string (Atlas or self-hosted)
- [ ] `ACCESS_TOKEN`, `REFRESH_TOKEN`, `RESET_SECRET`, `VERIFIED_TOKEN` — 64-char random secrets
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe API credentials
- [ ] `APP_USER_EMAIL`, `APP_PASSWORD` — Gmail SMTP credentials (App Password)
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION` — S3 storage credentials
- [ ] `FRONT_END_URL`, `ALLOWED_ORIGINS` — CORS configuration for frontend domain
- [ ] `ADMIN_EMAIL`, `ADMIN_PASSWORD` — Initial admin account credentials
- [ ] `NODE_ENV=production` — Set for production error handling
- [ ] `BACKEND_IP` — Server IP or hostname for CORS
- [ ] `AUTO_SEED=true` — Enable automatic seeding on startup

---

*This document was prepared for client review and provides a comprehensive overview of the Trading Signal Platform's architecture, features, workflows, and operational details. For technical implementation details, refer to the API documentation, Swagger UI, and inline code comments.*
