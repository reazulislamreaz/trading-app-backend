# Stripe Subscription Integration Guide

## Overview

This project includes a complete Stripe subscription integration with automatic plan synchronization. The system handles:

- Automatic creation of Stripe Products and Prices
- Subscription lifecycle management (create, upgrade, downgrade, cancel)
- Webhook handling for payment events
- Trial period support (7 days)
- Prorated plan changes

## Architecture

### Subscription Plan Schema

```typescript
{
  planId: string;           // Unique identifier (e.g., 'basic_monthly')
  name: string;             // Display name
  description: string;      // Plan description
  price: number;            // Price in cents (e.g., 2900 = $29.00)
  currency: string;         // Currency code (default: 'usd')
  interval: 'month' | 'year'; // Billing interval
  stripeProductId?: string; // Stripe Product ID (auto-populated)
  stripePriceId?: string;   // Stripe Price ID (auto-populated)
  features: string[];       // List of features
  signalLimit: number;      // -1 for unlimited
  mediaAccess: boolean;     // Access to media features
  prioritySupport: boolean; // Access to priority support
  isActive: boolean;        // Plan availability
  tier: 'free' | 'basic' | 'pro' | 'master'; // Plan tier
  syncedToStripe: boolean;  // Stripe sync status
}
```

### Default Subscription Plans

The system includes 6 pre-configured plans:

1. **Free Plan** - $0/month (3 signals/month)
2. **Basic Monthly** - $29/month (50 signals/month)
3. **Basic Yearly** - $290/year (save 2 months)
4. **Pro Monthly** - $79/month (unlimited signals)
5. **Pro Yearly** - $790/year (save 2 months)
6. **Master Trader Monthly** - $49/month (signal providers)

## Setup

### 1. Configure Stripe Keys

Add your Stripe credentials to `.env`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_FRONTEND_URL=http://localhost:3000
```

**Get your keys from:**
- API Keys: https://dashboard.stripe.com/apikeys
- Webhook Secret: https://dashboard.stripe.com/webhooks

### 2. Automatic Stripe Synchronization

When you start the server, subscription plans are automatically synced with Stripe:

```bash
npm run dev
# or
npm start
```

**What happens:**
1. Database connects
2. Default plans are inserted into MongoDB
3. For each paid plan (price > 0):
   - Creates Stripe Product
   - Creates Stripe Price with recurring billing
   - Stores `stripeProductId` and `stripePriceId` in database
4. Free plan is skipped (no Stripe integration needed)

**Idempotent:** Safe to run multiple times - already synced plans are skipped.

### 3. Manual Stripe Sync

If you need to manually trigger Stripe sync:

```bash
# Run standalone seed script
npm run seed

# Or programmatically in your code
import { syncPlansWithStripe } from './app/utils/seed';
await syncPlansWithStripe();
```

## Stripe Service Methods

The `stripeService` provides these key methods:

### Product & Price Management

```typescript
// Create Stripe Product
await stripeService.createProduct(
  'Product Name',
  'Product description',
  { metadataKey: 'metadataValue' }
);

// Create Stripe Price
await stripeService.createPrice(
  'prod_stripe_id',      // Product ID
  2900,                  // Amount in cents
  'usd',                 // Currency
  'month'                // Interval: 'month' | 'year' | 'one_time' | 'week'
);

// Sync plan with Stripe (creates product + price)
await stripeService.syncPlanWithStripe({
  planId: 'basic_monthly',
  name: 'Basic Plan (Monthly)',
  description: 'Perfect for beginner traders',
  price: 2900,
  currency: 'usd',
  interval: 'month'
});
```

### Customer Management

```typescript
// Create Stripe Customer
await stripeService.createCustomer(
  'user@example.com',
  'User Name',
  'account_id'
);

// Get Stripe Customer
await stripeService.getCustomer('cus_stripe_id');
```

### Subscription Management

```typescript
// Create Checkout Session
await stripeService.createCheckoutSession(
  'cus_stripe_id',
  'price_stripe_id',
  'https://yoursite.com/success',
  'https://yoursite.com/cancel',
  { accountId: '123', planId: 'basic_monthly' }
);

// Create Checkout Session with Trial
await stripeService.createCheckoutSessionWithTrial(
  'cus_stripe_id',
  'price_stripe_id',
  'https://yoursite.com/success',
  'https://yoursite.com/cancel',
  7, // Trial period days
  { accountId: '123', planId: 'basic_monthly' }
);

// Cancel Subscription (at period end)
await stripeService.cancelSubscription('sub_stripe_id');

// Resume Canceled Subscription
await stripeService.resumeSubscription('sub_stripe_id');

// Update Subscription Plan (prorated)
await stripeService.updateSubscriptionPlan(
  'sub_stripe_id',
  'new_price_stripe_id'
);
```

### Payment Management

```typescript
// Create One-Time Payment
await stripeService.createPaymentIntent(
  5000, // Amount in cents
  'usd',
  'cus_stripe_id',
  'Master Trader signal package',
  { accountId: '123' }
);

// Refund Payment
await stripeService.refundPayment('pi_stripe_id', 5000); // Amount optional (full refund)

// Get Invoice
await stripeService.getInvoice('in_stripe_id');

// List Customer Invoices
await stripeService.listCustomerInvoices('cus_stripe_id', 10);
```

## Subscription Service Methods

The `subscription_services` provides business logic:

```typescript
// Get all active subscription plans
const plans = await subscription_services.get_all_plans();

// Create checkout session
const checkout = await subscription_services.create_checkout_session(
  'account_id',
  'basic_monthly',
  'https://yoursite.com/return'
);
// Returns: { checkoutUrl, sessionId, trialDays }

// Get current subscription
const subscription = await subscription_services.get_current_subscription(
  'account_id'
);

// Cancel subscription
await subscription_services.cancel_subscription('account_id');

// Resume canceled subscription
await subscription_services.resume_subscription('account_id');

// Upgrade subscription (prorated)
await subscription_services.upgrade_subscription(
  'account_id',
  'pro_monthly'
);

// Downgrade subscription (at next billing cycle)
await subscription_services.downgrade_subscription(
  'account_id',
  'basic_monthly'
);

// Create billing portal session
const portal = await subscription_services.create_billing_portal(
  'account_id',
  'https://yoursite.com/subscription'
);

// Get payment history
const payments = await subscription_services.get_payment_history(
  'account_id',
  1,  // page
  10  // limit
);

// Get subscription usage
const usage = await subscription_services.get_subscription_usage('account_id');

// Increment signal usage
await subscription_services.increment_signal_usage('account_id');
```

## Webhook Events

The system handles these Stripe webhook events:

| Event | Description |
|-------|-------------|
| `checkout.session.completed` | New subscription created |
| `invoice.paid` | Payment successful |
| `invoice.payment_failed` | Payment failed |
| `customer.subscription.updated` | Subscription modified |
| `customer.subscription.deleted` | Subscription canceled |
| `payment_intent.succeeded` | One-time payment successful |
| `charge.refunded` | Payment refunded |

### Webhook Setup

1. **Local Development:**
   Use Stripe CLI for webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:5000/webhooks/stripe
   ```

2. **Production:**
   Add webhook endpoint in Stripe Dashboard:
   ```
   https://your-domain.com/webhooks/stripe
   ```
   
   Select these events:
   - checkout.session.completed
   - invoice.paid
   - invoice.payment_failed
   - customer.subscription.updated
   - customer.subscription.deleted
   - payment_intent.succeeded
   - charge.refunded

## Subscription Flow

### 1. User Subscribes to a Plan

```
User selects plan
  ↓
Frontend calls: POST /api/v1/subscription/checkout
  ↓
Backend creates Stripe customer (if not exists)
  ↓
Backend creates Stripe Checkout Session
  ↓
User redirected to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe sends webhook: checkout.session.completed
  ↓
Backend creates/updates subscription record
Backend updates account with subscription tier
  ↓
User redirected to success page
```

### 2. Subscription Renewal

```
Stripe automatically charges customer
  ↓
Stripe sends webhook: invoice.paid
  ↓
Backend records payment in Payment_Model
Backend updates subscription period dates
Backend updates account subscription status
```

### 3. User Upgrades Plan

```
User selects higher tier plan
  ↓
Frontend calls: POST /api/v1/subscription/upgrade
  ↓
Backend calls Stripe: updateSubscriptionPlan
  ↓
Stripe calculates prorated amount
  ↓
Backend updates local subscription record
  ↓
User charged/credited for difference
```

### 4. User Cancels Subscription

```
User clicks cancel
  ↓
Frontend calls: POST /api/v1/subscription/cancel
  ↓
Backend calls Stripe: cancel_at_period_end = true
  ↓
Backend updates local subscription record
  ↓
Subscription remains active until period end
  ↓
Stripe sends webhook: customer.subscription.deleted
  ↓
Backend downgrades account to free tier
```

## Error Handling

### Common Issues & Solutions

**1. "Stripe price ID not configured for this plan"**
- **Cause:** Plan doesn't have `stripePriceId`
- **Solution:** Run seed script to sync with Stripe: `npm run seed`

**2. "Webhook signature verification failed"**
- **Cause:** Incorrect `STRIPE_WEBHOOK_SECRET`
- **Solution:** Get correct secret from Stripe Dashboard > Webhooks

**3. "Plan not found or inactive"**
- **Cause:** Plan doesn't exist or `isActive = false`
- **Solution:** Check database for plan with correct `planId`

**4. "You already have an active subscription"**
- **Cause:** User has active/trialing subscription
- **Solution:** Cancel existing subscription first or upgrade/downgrade

## Testing

### Test Cards

Use these Stripe test cards for development:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0000 0000 3220 | Requires 3D Secure |

### Test Scenarios

```bash
# 1. Create new subscription
curl -X POST http://localhost:5000/api/v1/subscription/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "basic_monthly"}'

# 2. Get subscription details
curl http://localhost:5000/api/v1/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Cancel subscription
curl -X POST http://localhost:5000/api/v1/subscription/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Upgrade subscription
curl -X POST http://localhost:5000/api/v1/subscription/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": "pro_monthly"}'

# 5. Get payment history
curl http://localhost:5000/api/v1/subscription/payments?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Production Checklist

- [ ] Update Stripe keys to production keys (sk_live_, pk_live_)
- [ ] Configure production webhook URL in Stripe Dashboard
- [ ] Test all subscription flows in Stripe test mode
- [ ] Set up email notifications for payment events
- [ ] Monitor webhook failures in Stripe Dashboard
- [ ] Configure Stripe tax settings (if applicable)
- [ ] Set up Stripe billing portal customization
- [ ] Add subscription analytics tracking

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
