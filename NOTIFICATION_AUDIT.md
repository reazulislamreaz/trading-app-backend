# Notification System — Complete Breakdown

> **Audit Scope:** All notification creation points, triggers, sources, and workflows  
> **Notification Types Defined:** 11 (see schema)  
> **Actual Notification Triggers in Code:** 4 (in-app) + 1 (email) + 6 (defined but NOT implemented)  

---

## 1. Notification Types Schema

The platform defines **11 notification types** in `notification.schema.ts`:

| # | Type | Purpose | ✅ Implemented? |
|---|------|---------|----------------|
| 1 | `new_signal` | Alert followers when a Master publishes a signal | ✅ Yes |
| 2 | `subscription_active` | Notify user when subscription is activated | ❌ No |
| 3 | `subscription_expiring` | Warn user before subscription expires | ❌ No (email only) |
| 4 | `subscription_canceled` | Notify user when subscription is canceled | ❌ No |
| 5 | `payment_succeeded` | Confirm payment received | ❌ No |
| 6 | `payment_failed` | Alert user about failed payment | ❌ No |
| 7 | `master_approved` | Notify user their Master application was approved | ❌ No |
| 8 | `master_rejected` | Notify user their Master application was rejected | ❌ No |
| 9 | `system_announcement` | Admin broadcast to all users | ✅ Yes |
| 10 | `signal_copied` | Notify Master when someone copies their signal | ✅ Yes |
| 11 | `trade_result_logged` | Notify Master when a copier logs a trade result | ✅ Yes |

**Gap:** 6 out of 11 notification types are defined in the schema but **never created** anywhere in the codebase.

---

## 2. All Notification Creation Points

### 2.1 Signal Publish — `new_signal`

| | |
|---|---|
| **File** | `src/app/modules/signal/signal.service.ts` → `publish_scheduled_signals()` (~line 370-400) |
| **Trigger** | Cron job runs every minute, publishes scheduled signals whose `scheduledAt` time has passed |
| **Source** | System (automated) |
| **Recipient** | All followers of the Master Trader who created the signal |
| **Workflow** | 1. Cron detects scheduled signals past their time → 2. Updates signal status to `active` → 3. Increments Master's `totalSignals` → 4. Fetches all followers (up to 10,000) → 5. Creates one notification per follower via `insertMany` |
| **Notification Content** | `title`: "New signal from {MasterName}"<br>`message`: Signal title<br>`link`: `/signals/{signalId}`<br>`data`: `{ signalId, symbol, signalType }` |
| **Scale** | N notifications per signal (where N = follower count, capped at 10,000) |
| **Error Handling** | Wrapped in try/catch — notification failure does NOT block signal publishing. Error logged via `console.error`. |

**⚠️ Gap:** Notifications are only created for **scheduled signals** (cron-published). When a Master creates a signal with **instant publish**, **no notifications are sent to followers**. This is a significant UX gap — followers miss real-time signals.

---

### 2.2 Signal Copied — `signal_copied`

| | |
|---|---|
| **File** | `src/app/modules/copied_trade/copied_trade.service.ts` → `copy_signal()` (~line 70-85) |
| **Trigger** | User clicks "Copy Signal" on a Master's signal |
| **Source** | User action (subscriber) |
| **Recipient** | The Master Trader who created the signal |
| **Workflow** | 1. User copies signal → 2. `Copied_Trade_Model` record created → 3. Signal `copierCount` incremented → 4. Single notification sent to Master |
| **Notification Content** | `title`: "Signal Copied"<br>`message`: "A trader copied your signal: {signalTitle}"<br>`link`: `/signals/{signalId}`<br>`data`: `{ signalId, copiedTradeId }` |
| **Scale** | 1 notification per copy action |
| **Error Handling** | Wrapped in try/catch — notification failure does NOT block the copy operation. Error logged via `console.error`. |

---

### 2.3 Trade Result Logged — `trade_result_logged`

| | |
|---|---|
| **File** | `src/app/modules/copied_trade/copied_trade.service.ts` → `log_trade()` (~line 132-150) |
| **Trigger** | User logs the outcome of a copied trade (win/loss/breakeven) |
| **Source** | User action (subscriber) |
| **Recipient** | The Master Trader whose signal was copied |
| **Workflow** | 1. User logs trade result → 2. `Copied_Trade_Model` updated from `pending` to `completed` → 3. Notification sent to Master with outcome emoji (🟢 win, 🔴 loss, 🟡 breakeven) |
| **Notification Content** | `title`: "Trade Result {emoji}"<br>`message`: "A copier logged a {win/loss/breakeven} on your signal: {signalId}"<br>`link`: `/signals/{signalId}`<br>`data`: `{ signalId, outcome, resultPnl }` |
| **Scale** | 1 notification per logged trade |
| **Error Handling** | Wrapped in try/catch — notification failure does NOT block the trade logging. Error logged via `console.error`. |

---

### 2.4 System Announcement — `system_announcement`

| | |
|---|---|
| **File** | `src/app/modules/notification/notification.service.ts` → `broadcast_announcement()` (~line 160-183) |
| **Trigger** | Admin sends a broadcast announcement via `POST /api/v1/admin/broadcast` |
| **Source** | Admin action |
| **Recipient** | All users, or filtered by role (`targetRole` parameter) |
| **Workflow** | 1. Admin provides title, message, optional link, optional target role → 2. Queries all matching accounts → 3. Creates one notification per account via `insertMany` |
| **Notification Content** | `title`: Admin-defined<br>`message`: Admin-defined<br>`link`: Admin-defined (optional)<br>`data`: `{}` (empty) |
| **Scale** | N notifications per broadcast (where N = total users or filtered count) |
| **Error Handling** | No try/catch around `insertMany` — if it fails, the entire broadcast fails and returns an error to the admin. |

---

### 2.5 Subscription Expiry Email (NOT In-App Notification)

| | |
|---|---|
| **File** | `src/app/utils/subscription_notifications.ts` → `checkExpiringSubscriptions()` |
| **Trigger** | Cron job runs daily at 9:00 AM UTC |
| **Source** | System (automated) |
| **Recipient** | Users whose subscriptions expire in 7, 3, or 1 days |
| **Workflow** | 1. Cron runs → 2. Queries subscriptions expiring within each day window → 3. Checks if already notified (via flag on subscription document) → 4. Sends HTML email via Gmail SMTP (blocking mode) → 5. Marks subscription as notified |
| **Notification Content** | `subject`: "Your {tier} subscription expires in {N} days"<br>`body`: HTML email with renewal CTA button |
| **Scale** | N emails per day (where N = subscriptions expiring in 7/3/1 days) |
| **Error Handling** | Per-subscription try/catch — one failure doesn't block others. Errors logged via Winston logger. |

**⚠️ Gap:** This sends an **email** only — it does **NOT** create an in-app notification of type `subscription_expiring`. Users who don't check email will miss this.

---

## 3. Notification Consumer Endpoints

These endpoints allow users to interact with their notifications:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/notifications` | Yes | Get paginated notifications with filters (`isRead`, `type`) |
| `PATCH` | `/api/v1/notifications/:id/read` | Yes | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/:id` | Yes | Update notification (currently only `isRead`) |
| `PATCH` | `/api/v1/notifications/mark-all-read` | Yes | Mark all notifications as read |
| `DELETE` | `/api/v1/notifications/:id` | Yes | Delete a notification |
| `GET` | `/api/v1/notifications/unread-count` | Yes | Get unread notification count |

---

## 4. Complete Notification Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION TRIGGERS                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌───────────┐       ┌───────────┐       ┌───────────┐
  │  CRON JOB │       │  USER     │       │  ADMIN    │
  │ (every min)       │  ACTION   │       │  ACTION   │
  └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
  publish_scheduled     copy_signal         broadcast_
  _signals()            log_trade()         announcement()
        │                   │                   │
        ▼                   ▼                   ▼
  new_signal (N)       signal_copied (1)    system_announcement (N)
  → Followers          → Master Trader      → All users / by role
                       trade_result_logged (1)
                       → Master Trader

  ┌─────────────────────────────────────────────────────────┐
  │                    EMAIL (SEPARATE)                      │
  │                                                          │
  │  Cron (daily 9AM) → checkExpiringSubscriptions()        │
  │    → subscription_expiring email (Gmail SMTP)            │
  │    → 7, 3, 1 days before expiry                          │
  │    → NO in-app notification created                      │
  └─────────────────────────────────────────────────────────┘
```

---

## 5. Notification Delivery Summary

| Trigger | Type | Delivery | Recipients | Frequency |
|---------|------|----------|------------|-----------|
| Scheduled signal published | `new_signal` | In-app DB notification | All followers of the Master | Per signal (cron every minute) |
| User copies signal | `signal_copied` | In-app DB notification | Master Trader | Per copy action |
| User logs trade result | `trade_result_logged` | In-app DB notification | Master Trader | Per trade log |
| Admin broadcast | `system_announcement` | In-app DB notification | All users (or by role) | Per admin action |
| Subscription expiring | *(none — email only)* | Email (Gmail SMTP) | Users expiring in 7/3/1 days | Daily at 9 AM UTC |

---

## 6. Gaps & Inconsistencies

### 6.1 Critical Gaps

| # | Gap | Impact | Severity |
|---|-----|--------|----------|
| **G1** | **Instant signals don't notify followers** — When a Master publishes a signal instantly (not scheduled), no `new_signal` notification is sent. The cron job only handles scheduled signals. | Followers miss real-time signals. Core feature gap. | 🔴 Critical |
| **G2** | **6 notification types defined but never used** — `subscription_active`, `subscription_expiring`, `subscription_canceled`, `payment_succeeded`, `payment_failed`, `master_approved`, `master_rejected` are in the schema but never created. | Stripe webhook and admin flows don't notify users about important account events. | 🟠 High |
| **G3** | **No in-app notification for subscription expiry** — Only email is sent. Users who don't check email lose access without warning in the app. | Poor UX, increased churn. | 🟠 High |
| **G4** | **Stripe webhook doesn't create any notifications** — `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` all update DB state but never notify the user. | Users don't know when their subscription activates, renews, fails, or is canceled. | 🟠 High |

### 6.2 Design Inconsistencies

| # | Inconsistency | Details |
|---|---------------|---------|
| **I1** | **Mixed logging approaches** — Signal service uses `console.error` for notification failures, expiry notifications use Winston `logger.error`, copied trade uses `console.error`. | Should standardize on Winston logger everywhere. |
| **I2** | **No notification deduplication for signal publishes** — If a follower follows multiple Masters who publish signals simultaneously, they get N separate `insertMany` calls. No batching or throttling. | At scale, a power user following 20 Masters could get 20+ notifications per minute. |
| **I3** | **Notification creation is synchronous in broadcast** — `broadcast_announcement` uses `insertMany` synchronously. For 100K users, this blocks the admin request for seconds. | Should use background job/queue for large broadcasts. |
| **I4** | **No notification for Master approval/rejection** — Admin can approve/reject Masters (`admin.controller.ts`), but no notification is sent to the applicant. | Users have no in-app way to know their application status. |
| **I5** | **Follower fetch capped at 10,000** — `get_followers` is called with limit 10,000. Masters with more followers silently lose notification coverage. | Hard cap with no warning or pagination. |
| **I6** | **Notification errors are silently swallowed** — All notification creation is wrapped in try/catch with only a `console.error`. No retry, no dead-letter queue, no admin alerting. | Failed notifications are permanently lost. |

---

## 7. Recommended Notification Additions

### 7.1 Must-Have (fill existing gaps)

| Notification | Trigger Location | Type | Recipients |
|-------------|-----------------|------|------------|
| **New signal (instant)** | `signal.service.ts` → `create_signal()` when `publishType === 'instant'` | `new_signal` | All followers of the Master |
| **Subscription activated** | `stripe.webhook.ts` → `handleCheckoutCompleted()` | `subscription_active` | Subscriber |
| **Subscription renewed** | `stripe.webhook.ts` → `handleInvoicePaid()` | `subscription_active` | Subscriber |
| **Payment failed** | `stripe.webhook.ts` → `handleInvoiceFailed()` | `payment_failed` | Subscriber |
| **Subscription canceled** | `stripe.webhook.ts` → `handleSubscriptionDeleted()` | `subscription_canceled` | Subscriber |
| **Master approved** | Admin endpoint (missing — needs to be added) | `master_approved` | Applicant |
| **Master rejected** | Admin endpoint (missing — needs to be added) | `master_rejected` | Applicant |
| **Subscription expiring (in-app)** | `subscription_notifications.ts` → alongside email | `subscription_expiring` | Expiring users |

### 7.2 Should-Have (UX improvements)

| Notification | Trigger | Type (new) | Recipients |
|-------------|---------|------------|------------|
| **New follower** | When someone follows a Master | `new_follower` (new type) | Master Trader |
| **Signal closed** | When Master closes a signal | `signal_closed` (new type) | All followers who copied it |
| **Payment succeeded** | `handlePaymentSucceeded()` | `payment_succeeded` (existing type) | Payer |
| **Usage limit warning** | When user reaches 80% of signal limit | `usage_limit_warning` (new type) | Subscriber |

### 7.3 Nice-to-Have (engagement)

| Notification | Trigger | Type (new) |
|-------------|---------|------------|
| **Weekly performance summary** | Cron job, weekly | `weekly_summary` (new type) |
| **Leaderboard rank change** | When user enters top 10 or drops out | `rank_change` (new type) |
| **Welcome notification** | On first login after registration | `welcome` (new type) |

---

## 8. Notification Schema Reference

```typescript
interface INotification {
  accountId: ObjectId;       // Recipient
  type: NotificationType;    // One of 11 defined types
  title: string;             // Notification title
  message: string;           // Notification body
  isRead: boolean;           // Read status (default: false)
  link: string;              // Deep link for click-through
  data: Record<string, unknown>; // Extra metadata
  createdAt: Date;           // Auto-set by Mongoose
  updatedAt: Date;           // Auto-set by Mongoose
}
```

**Indexes:**
- `{ accountId: 1, isRead: 1, createdAt: -1 }` — Filtered notification list
- `{ accountId: 1, createdAt: -1 }` — Chronological notification feed
- `{ type: 1 }` — Type-based filtering

---

## 9. Summary

| Metric | Count |
|--------|-------|
| **Notification types defined** | 11 |
| **Notification types actually created** | 5 (`new_signal`, `signal_copied`, `trade_result_logged`, `system_announcement`, + email-only `subscription_expiring`) |
| **Notification creation points in code** | 4 (in-app) + 1 (email cron) |
| **Notification consumer endpoints** | 6 |
| **Automated notification jobs** | 2 (signal publish cron, expiry email cron) |
| **Critical gaps** | 4 |
| **Design inconsistencies** | 6 |
| **Recommended additions** | 8 must-have + 4 should-have + 3 nice-to-have |

The notification system is **partially implemented** — the infrastructure (schema, service, endpoints) is solid, but the actual notification creation covers only about **45% of the defined types** and misses several critical user-facing events, most notably **instant signal publishing** and **all Stripe webhook events**.
