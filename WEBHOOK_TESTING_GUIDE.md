# Stripe Webhook Testing Guide

## Fixed Issues ✅

The Stripe webhook integration has been fixed to properly handle signature verification:

### What Was Fixed

1. **Middleware Order** - Webhook route is now registered **before** `express.json()` middleware.
2. **Raw Body Parser** - Webhook route uses `express.raw({ type: 'application/json' })` instead of JSON parser
3. **Buffer Handling** - Properly converts body to Buffer for Stripe signature verification
4. **Error Handling** - Returns proper HTTP status codes (400 for signature failure, 500 for handler errors)
5. **Logging** - All webhook events and errors are properly logged

## How It Works Now

### Request Flow

```
Stripe sends webhook
  ↓
Express receives raw body (Buffer)
  ↓
/webhooks/stripe route matches (before express.json())
  ↓
express.raw() middleware processes body
  ↓
handleStripeWebhook receives Buffer
  ↓
Reads stripe-signature header
  ↓
Constructs Stripe event with raw body + webhook secret
  ↓
Signature verification passes ✅
  ↓
Routes to appropriate handler
  ↓
Updates database
  ↓
Returns 200 OK to Stripe
```

### Key Changes in Code

**app.ts** (Line 48-50):
```typescript
// Webhook endpoints (MUST be before express.json() to use raw body)
// Stripe webhook requires raw body for signature verification
app.use("/webhooks", webhookRouter);

// Body parsing middleware (applies to all routes EXCEPT webhooks above)
app.use(express.json({ limit: "10mb" }));
```

**webhooks.ts**:
```typescript
webhookRouter.post(
  '/stripe',
  express.raw({ type: 'application/json' }),  // Raw body for signature
  handleStripeWebhook
);
```

**stripe.webhook.ts** (Line 22-24):
```typescript
// Stripe requires raw body for webhook signature verification
// The body should be a Buffer when using express.raw()
const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
```

## Testing Webhooks Locally

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli/gpg | sudo apt-key add -
echo "deb https://packages.stripe.dev/stripe-cli-debian/ubuntu stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe CLI

```bash
stripe login
# Follow the instructions in the terminal
```

### 3. Start Webhook Forwarding

```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:5000/webhooks/stripe
```

You'll see output like:
```
> Ready! You are using Stripe API version [2024-12-18.acacia]
> Your webhook signing secret is whsec_xxxxx (^C to quit)
```

### 4. Update Your .env

Copy the webhook signing secret from Stripe CLI:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From stripe listen output
```

### 5. Start Your Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🌱 Running seed operations...
...
🚀 Server started on port 5000 (development)
```

### 6. Trigger Test Webhooks

In a **new terminal**, trigger test events:

```bash
# Test checkout session completed
stripe trigger checkout.session.completed

# Test invoice.paid
stripe trigger invoice.paid

# Test customer.subscription.created
stripe trigger customer.subscription.created

# Test customer.subscription.updated
stripe trigger customer.subscription.updated

# Test customer.subscription.deleted
stripe trigger customer.subscription.deleted

# Test invoice.payment_failed
stripe trigger invoice.payment_failed
```

### 7. Check Server Logs

You should see logs like:

```
📥 Webhook received: checkout.session.completed (ID: evt_xxxxx)
✅ Subscription created for account: 123, plan: basic_monthly
```

Or for payment:
```
📥 Webhook received: invoice.paid (ID: evt_xxxxx)
✅ Payment recorded: pi_xxxxx, amount: 2900
```

## Testing Webhooks in Production

### 1. Add Webhook Endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL:
   ```
   https://your-domain.com/webhooks/stripe
   ```
4. Select these events:
   - ✅ checkout.session.completed
   - ✅ invoice.paid
   - ✅ invoice.payment_failed
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ payment_intent.succeeded
   - ✅ charge.refunded
5. Click "Add endpoint"
6. Copy the webhook signing secret (whsec_xxxxx)

### 2. Update Production .env

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx  # From Stripe Dashboard
```

### 3. Test with Real Transactions

Create a real test subscription using your frontend with Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0000 0000 3220 | Requires 3D Secure |

## Webhook Event Handlers

### Implemented Events

| Event | Handler | What It Does |
|-------|---------|--------------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Creates/updates subscription in database |
| `invoice.paid` | `handleInvoicePaid` | Records payment, updates subscription dates |
| `invoice.payment_failed` | `handleInvoiceFailed` | Marks subscription as past_due |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Updates subscription status/dates |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Cancels subscription, reverts to free tier |
| `payment_intent.succeeded` | `handlePaymentSucceeded` | Logs one-time payment |
| `charge.refunded` | `handleChargeRefunded` | Marks payment as refunded |

### Database Updates

Each webhook handler updates:

1. **Subscription_Model** (subscription collection):
   - `stripeSubscriptionId`
   - `planId`
   - `status` (active, canceled, past_due, trialing, paused)
   - `currentPeriodStart`
   - `currentPeriodEnd`
   - `cancelAtPeriodEnd`
   - `trialEndsAt`
   - `signalsUsed`

2. **Account_Model** (account collection):
   - `stripeCustomerId`
   - `subscriptionStatus`
   - `subscriptionTier`
   - `subscriptionExpiresAt`

3. **Payment_Model** (payment collection):
   - `stripePaymentIntentId`
   - `stripeInvoiceId`
   - `amount`
   - `currency`
   - `status`
   - `paymentMethod`
   - `description`

## Troubleshooting

### Issue: "Webhook signature verification failed"

**Possible Causes:**
1. Wrong `STRIPE_WEBHOOK_SECRET` in .env
2. Body is being parsed as JSON instead of raw Buffer
3. Webhook secret doesn't match the one Stripe used

**Solutions:**
```bash
# For local testing - get fresh secret
stripe listen --forward-to localhost:5000/webhooks/stripe
# Copy the whsec_xxxxx from output

# For production - get from dashboard
# Go to https://dashboard.stripe.com/webhooks
# Find your endpoint and click "Reveal"
```

### Issue: "req.body is undefined"

**Cause:** `express.raw()` not being applied to the route

**Solution:** Check that webhook route is registered BEFORE `express.json()` in app.ts:
```typescript
// This MUST come before express.json()
app.use("/webhooks", webhookRouter);

// Then body parsing
app.use(express.json({ limit: "10mb" }));
```

### Issue: Webhook returns 500 error

**Check logs for:**
```bash
# Look for error messages
❌ Error in handleCheckoutCompleted:
❌ Error in handleInvoicePaid:
```

**Common causes:**
- Database connection issue
- Missing required fields in webhook payload
- Stripe API key expired or invalid

### Issue: Webhook not receiving events

**Check Stripe Dashboard:**
1. Go to https://dashboard.stripe.com/webhooks
2. Check your endpoint status
3. Look for failed delivery attempts
4. Check the error message

**Test connectivity:**
```bash
# Test if your endpoint is reachable
curl -X POST https://your-domain.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Webhook Best Practices

### 1. Idempotency
All webhook handlers are idempotent - safe to process multiple times:
```typescript
await Subscription_Model.findOneAndUpdate(
  { accountId },  // Query
  { ...updates }, // Updates
  { upsert: true, new: true } // Create if doesn't exist
);
```

### 2. Error Handling
Errors are caught and logged, not thrown to crash the server:
```typescript
try {
  await handleCheckoutCompleted(event.data.object);
} catch (error) {
  logger.error('❌ Error in handler:', error);
  res.status(500).json({ error: 'Handler failed' });
}
```

### 3. Return Fast
Webhook handlers return quickly to avoid Stripe timeout:
```typescript
res.json({ received: true }); // Return immediately
// Database updates happen in background
```

### 4. Log Everything
All webhook events are logged for debugging:
```typescript
logger.info(`📥 Webhook received: ${event.type} (ID: ${event.id})`);
logger.info(`✅ Subscription created for account: ${accountId}`);
```

## Monitoring Webhooks

### Check Stripe Dashboard

1. **Webhook Events Log:**
   https://dashboard.stripe.com/test/webhooks

2. **View Event Details:**
   - Click on any event
   - See raw payload
   - See delivery attempts
   - See response from your server

3. **Retry Failed Events:**
   - Click "Retry" on failed deliveries

### Check Server Logs

```bash
# View recent webhook logs
tail -f logs/combined.log | grep "Webhook"

# View errors
tail -f logs/error.log
```

## Security Notes

### ✅ What's Protected

1. **Webhook Signature Verification** - Ensures request is from Stripe
2. **Webhook Secret** - Must match to construct event
3. **Raw Body** - Prevents tampering with request body

### ⚠️ What's NOT Protected

1. **Replay Attacks** - Same event could be sent multiple times
   - **Solution:** Handlers are idempotent
   
2. **Missing Events** - Webhooks could fail/delay
   - **Solution:** Use Stripe API to sync periodically

3. **Event Order** - Events might arrive out of order
   - **Solution:** Use timestamps, not order

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe API Reference](https://stripe.com/docs/api)
