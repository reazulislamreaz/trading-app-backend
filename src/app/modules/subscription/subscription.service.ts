import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Account_Model } from '../auth/auth.schema';
import { Subscription_Model } from './subscription.schema';
import { Payment_Model } from './payment.schema';
import { SubscriptionPlan_Model } from './subscription.plans';
import { stripeService } from './stripe.service';
import { configs } from '../../configs';

export const subscription_services = {
  // Get all active subscription plans
  async get_all_plans() {
    const plans = await SubscriptionPlan_Model.find({ isActive: true }).sort({ price: 1 });
    return plans;
  },

  // Create checkout session
  async create_checkout_session(accountId: string, planId: string, returnUrl?: string) {
    // Get account details
    const account = await Account_Model.findById(accountId);
    if (!account) {
      throw new AppError('Account not found', httpStatus.NOT_FOUND);
    }

    // Get plan details
    const plan = await SubscriptionPlan_Model.findOne({ planId });
    if (!plan || !plan.isActive) {
      throw new AppError('Plan not found or inactive', httpStatus.NOT_FOUND);
    }

    // Check if user already has a subscription
    let subscription = await Subscription_Model.findOne({ accountId });
    let stripeCustomerId = subscription?.stripeCustomerId || account.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        account.email,
        account.name,
        accountId
      );
      stripeCustomerId = customer.id;

      // Update account with Stripe customer ID
      await Account_Model.findByIdAndUpdate(accountId, {
        stripeCustomerId,
      });
    }

    // Check if subscription already active
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
      throw new AppError('You already have an active subscription', httpStatus.BAD_REQUEST);
    }

    // Create checkout session URLs
    const successUrl = `${returnUrl || configs.stripe.frontend_url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${returnUrl || configs.stripe.frontend_url}/subscription/cancel`;

    // Create checkout session (with 7-day trial for first-time subscribers)
    const hasTrial = !subscription || subscription.status === 'canceled';
    let session;

    // Ensure stripeCustomerId is defined before passing to functions
    const customerId = stripeCustomerId!;

    // Validate that plan has Stripe price ID
    if (!plan.stripePriceId) {
      throw new AppError('Stripe price ID not configured for this plan', httpStatus.INTERNAL_SERVER_ERROR);
    }

    if (hasTrial && plan.price > 0) {
      // Offer 7-day trial for new subscribers
      session = await stripeService.createCheckoutSessionWithTrial(
        customerId,
        plan.stripePriceId,
        successUrl,
        cancelUrl,
        7, // 7 days trial
        { accountId, planId }
      );
    } else {
      // Regular checkout
      session = await stripeService.createCheckoutSession(
        customerId,
        plan.stripePriceId,
        successUrl,
        cancelUrl,
        { accountId, planId }
      );
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      trialDays: hasTrial ? 7 : 0,
    };
  },

  // Get current user's subscription
  async get_current_subscription(accountId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      // Check account for subscription tier
      const account = await Account_Model.findById(accountId);
      return {
        subscription: null,
        plan: null,
        hasAccess: false,
        daysRemaining: 0,
        tier: account?.subscriptionTier || 'free',
      };
    }

    const plan = await SubscriptionPlan_Model.findOne({ planId: subscription.planId });
    
    // Get account to check tier
    const account = await Account_Model.findById(accountId);

    return {
      subscription,
      plan,
      hasAccess: subscription.status === 'active' || subscription.status === 'trialing',
      daysRemaining: subscription.currentPeriodEnd
        ? Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0,
      tier: account?.subscriptionTier || subscription.planId.split('_')[0],
    };
  },

  // Cancel subscription
  async cancel_subscription(accountId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    if (subscription.status === 'canceled') {
      throw new AppError('Subscription is already canceled', httpStatus.BAD_REQUEST);
    }

    // Cancel at period end via Stripe
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    // Update local record
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      cancelAtPeriodEnd: true,
    });

    return {
      message: 'Subscription will be canceled at the end of current billing period',
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  },

  // Resume canceled subscription
  async resume_subscription(accountId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new AppError('Subscription is not scheduled for cancellation', httpStatus.BAD_REQUEST);
    }

    // Resume via Stripe
    await stripeService.resumeSubscription(subscription.stripeSubscriptionId);

    // Update local record
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      cancelAtPeriodEnd: false,
    });

    return {
      message: 'Subscription has been resumed',
      nextBillingDate: subscription.currentPeriodEnd,
    };
  },

  // Upgrade subscription to higher tier
  async upgrade_subscription(accountId: string, newPlanId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    if (subscription.status !== 'active') {
      throw new AppError('Subscription is not active', httpStatus.BAD_REQUEST);
    }

    const newPlan = await SubscriptionPlan_Model.findOne({ planId: newPlanId });
    if (!newPlan || !newPlan.isActive) {
      throw new AppError('Plan not found or inactive', httpStatus.NOT_FOUND);
    }

    // Check if actually upgrading
    const tierLevels = { free: 0, basic: 1, pro: 2, master: 3 };
    const currentTier = tierLevels[subscription.planId.split('_')[0] as keyof typeof tierLevels];
    const newTier = tierLevels[newPlan.tier];

    if (newTier <= currentTier) {
      throw new AppError('New plan must be higher than current plan', httpStatus.BAD_REQUEST);
    }

    // Validate that new plan has Stripe price ID
    if (!newPlan.stripePriceId) {
      throw new AppError('Stripe price ID not configured for this plan', httpStatus.INTERNAL_SERVER_ERROR);
    }

    // Update subscription plan via Stripe (prorated)
    await stripeService.updateSubscriptionPlan(
      subscription.stripeSubscriptionId,
      newPlan.stripePriceId
    );

    // Update local record
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      planId: newPlanId,
    });

    // Update account tier
    await Account_Model.findByIdAndUpdate(accountId, {
      subscriptionTier: newPlan.tier,
    });

    return {
      message: 'Subscription upgraded successfully',
      newPlan: newPlan.name,
      prorated: true,
    };
  },

  // Downgrade subscription to lower tier
  async downgrade_subscription(accountId: string, newPlanId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    if (subscription.status !== 'active') {
      throw new AppError('Subscription is not active', httpStatus.BAD_REQUEST);
    }

    const newPlan = await SubscriptionPlan_Model.findOne({ planId: newPlanId });
    if (!newPlan || !newPlan.isActive) {
      throw new AppError('Plan not found or inactive', httpStatus.NOT_FOUND);
    }

    // Check if actually downgrading
    const tierLevels = { free: 0, basic: 1, pro: 2, master: 3 };
    const currentTier = tierLevels[subscription.planId.split('_')[0] as keyof typeof tierLevels];
    const newTier = tierLevels[newPlan.tier];

    if (newTier >= currentTier) {
      throw new AppError('New plan must be lower than current plan', httpStatus.BAD_REQUEST);
    }

    // Schedule downgrade for next billing cycle
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      planId: newPlanId,
      cancelAtPeriodEnd: true, // Will cancel current and create new subscription
    });

    return {
      message: 'Subscription will be downgraded at the end of current billing period',
      newPlan: newPlan.name,
      effectiveDate: subscription.currentPeriodEnd,
    };
  },

  // Create billing portal session
  async create_billing_portal(accountId: string, returnUrl?: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    const portalSession = await stripeService.createPortalSession(
      subscription.stripeCustomerId,
      returnUrl || `${configs.stripe.frontend_url}/subscription`
    );

    return { portalUrl: portalSession.url };
  },

  // Get payment history
  async get_payment_history(accountId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const payments = await Payment_Model.find({ accountId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment_Model.countDocuments({ accountId });

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get subscription usage
  async get_subscription_usage(accountId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    const plan = await SubscriptionPlan_Model.findOne({ planId: subscription.planId });

    return {
      signalsUsed: subscription.signalsUsed,
      signalLimit: plan?.signalLimit || -1,
      signalsRemaining: plan?.signalLimit === -1 ? -1 : plan!.signalLimit - subscription.signalsUsed,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canViewMoreSignals: plan?.signalLimit === -1 || subscription.signalsUsed < plan!.signalLimit,
    };
  },

  // Increment signal usage
  async increment_signal_usage(accountId: string) {
    const subscription = await Subscription_Model.findOne({ accountId });
    
    if (!subscription) {
      throw new AppError('Subscription not found', httpStatus.NOT_FOUND);
    }

    const plan = await SubscriptionPlan_Model.findOne({ planId: subscription.planId });

    // Check if limit reached
    if (plan && plan.signalLimit !== -1 && subscription.signalsUsed >= plan.signalLimit) {
      throw new AppError('Signal limit reached. Upgrade your plan or wait for next billing cycle', httpStatus.FORBIDDEN);
    }

    // Increment usage
    await Subscription_Model.findByIdAndUpdate(subscription._id, {
      $inc: { signalsUsed: 1 },
    });

    return { signalsUsed: subscription.signalsUsed + 1 };
  },
};
