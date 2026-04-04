import { Request, Response } from 'express';
import Stripe from 'stripe';
import { configs } from '../../configs';
import { Subscription_Model } from './subscription.schema';
import { Payment_Model } from './payment.schema';
import { Account_Model } from '../auth/auth.schema';
import logger from '../../configs/logger';

// @ts-ignore - Stripe types issue with v22
const stripe = new Stripe(configs.stripe.secretKey!, {
  apiVersion: '2024-12-18.acacia',
});
const webhookSecret = configs.stripe.webhookSecret;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: any;

  try {
    // Stripe requires raw body for webhook signature verification
    // The body should be a Buffer when using express.raw()
    const body = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
    logger.info(`📥 Webhook received: ${event.type} (ID: ${event.id})`);
  } catch (err: any) {
    logger.error(`❌ Webhook signature verification failed: ${err.message}`);
    res.status(400).json({
      error: 'Webhook signature verification failed',
      message: err.message
    });
    return;
  }

  // Route to appropriate handler
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.warn(`⚠️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    logger.error(`❌ Error handling webhook event ${event.type}:`, error);
    res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message
    });
  }
};

// Handler Functions
async function handleCheckoutCompleted(session: any) {
  try {
    const accountId = session.metadata?.accountId;
    const planId = session.metadata?.planId;
    const subscriptionId = session.subscription as string;

    if (!accountId || !planId || !subscriptionId) {
      logger.error('❌ Missing metadata in checkout session:', { accountId, planId, subscriptionId });
      return;
    }

    // Retrieve full subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Create or update subscription record
    await Subscription_Model.findOneAndUpdate(
      { accountId },
      {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        planId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        cancelAtPeriodEnd: false,
        autoRenew: true,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
        signalsUsed: 0, // Reset usage for new subscription
      },
      { upsert: true, new: true }
    );

    // Update account
    await Account_Model.findByIdAndUpdate(accountId, {
      stripeCustomerId: session.customer as string,
      subscriptionStatus: stripeSubscription.status,
      subscriptionTier: planId.split('_')[0],
      subscriptionExpiresAt: new Date(stripeSubscription.current_period_end * 1000),
    });

    logger.info(`✅ Subscription created for account: ${accountId}, plan: ${planId}`);
  } catch (error) {
    logger.error('❌ Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

async function handleInvoicePaid(invoice: any) {
  try {
    const subscriptionId = invoice.subscription as string;
    const paymentIntentId = invoice.payment_intent as string;

    if (!subscriptionId) {
      logger.warn('⚠️  No subscription ID in invoice');
      return;
    }

    const subscription = await Subscription_Model.findOne({ stripeSubscriptionId: subscriptionId });
    if (!subscription) {
      logger.error('❌ Subscription not found for invoice:', subscriptionId);
      return;
    }

    // Record payment
    await Payment_Model.create({
      accountId: subscription.accountId,
      subscriptionId: subscription._id,
      stripePaymentIntentId: paymentIntentId || '',
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      paymentMethod: 'card',
      description: `Subscription renewal - ${subscription.planId}`,
      invoiceUrl: invoice.hosted_invoice_url || '',
    });

    // Update subscription
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      status: 'active',
      lastPaymentDate: new Date(),
      nextBillingDate: invoice.lines?.data[0] ? new Date(invoice.lines.data[0].period.end * 1000) : null,
    });

    // Update account
    await Account_Model.findByIdAndUpdate(subscription.accountId, {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: invoice.lines?.data[0] ? new Date(invoice.lines.data[0].period.end * 1000) : null,
    });

    logger.info(`✅ Payment recorded: ${paymentIntentId}, amount: ${invoice.amount_paid}`);
  } catch (error) {
    logger.error('❌ Error in handleInvoicePaid:', error);
    throw error;
  }
}

async function handleInvoiceFailed(invoice: any) {
  try {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return;

    const subscription = await Subscription_Model.findOne({ stripeSubscriptionId: subscriptionId });
    if (!subscription) return;

    // Update subscription
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      status: 'past_due',
    });

    // Update account
    await Account_Model.findByIdAndUpdate(subscription.accountId, {
      subscriptionStatus: 'past_due',
    });

    logger.warn(`⚠️  Payment failed for subscription: ${subscriptionId}`);
  } catch (error) {
    logger.error('❌ Error in handleInvoiceFailed:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(stripeSub: any) {
  try {
    const subscription = await Subscription_Model.findOne({
      stripeSubscriptionId: stripeSub.id,
    });

    if (!subscription) {
      logger.error('❌ Subscription not found for update:', stripeSub.id);
      return;
    }

    const updates: any = {
      status: stripeSub.status,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    };

    // If plan changed (check price ID)
    const newPriceId = stripeSub.items?.data[0]?.price.id;
    if (newPriceId && newPriceId !== subscription.planId) {
      // Map Stripe price ID to plan ID
      // You may need a more robust mapping function based on your Stripe price IDs
      updates.planId = newPriceId.replace('price_', '').replace('_monthly', '_monthly');
    }

    await Subscription_Model.findByIdAndUpdate(subscription._id, updates);

    // Update account
    await Account_Model.findByIdAndUpdate(subscription.accountId, {
      subscriptionStatus: stripeSub.status,
      subscriptionExpiresAt: new Date(stripeSub.current_period_end * 1000),
    });

    logger.info(`🔄 Subscription updated: ${stripeSub.id}, status: ${stripeSub.status}`);
  } catch (error) {
    logger.error('❌ Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(stripeSub: any) {
  try {
    const subscription = await Subscription_Model.findOne({
      stripeSubscriptionId: stripeSub.id,
    });

    if (!subscription) return;

    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      status: 'canceled',
    });

    await Account_Model.findByIdAndUpdate(subscription.accountId, {
      subscriptionStatus: 'canceled',
      subscriptionTier: 'free',
      subscriptionExpiresAt: null,
    });

    logger.info(`❌ Subscription canceled: ${stripeSub.id}`);
  } catch (error) {
    logger.error('❌ Error in handleSubscriptionDeleted:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Handle one-time payments (if any)
    logger.info(`💰 Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('❌ Error in handlePaymentSucceeded:', error);
    throw error;
  }
}

async function handleChargeRefunded(charge: any) {
  try {
    const payment = await Payment_Model.findOne({
      stripePaymentIntentId: charge.payment_intent as string,
    });

    if (!payment) return;

    await Payment_Model.findByIdAndUpdate(payment._id, {
      status: 'refunded',
      refundedAt: new Date(),
      refundedAmount: charge.amount_refunded / 100, // Convert from cents
    });

    logger.info(`💸 Payment refunded: ${charge.id}`);
  } catch (error) {
    logger.error('❌ Error in handleChargeRefunded:', error);
    throw error;
  }
}
