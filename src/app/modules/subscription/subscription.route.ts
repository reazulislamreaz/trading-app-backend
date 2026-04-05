import { Router } from 'express';
import { subscription_controllers } from './subscription.controller';
import { subscription_validations } from './subscription.validation';
import auth from '../../middlewares/auth';
import RequestValidator from '../../middlewares/request_validator';
import { checkoutLimiter } from '../../middlewares/rate_limiter';

const subscriptionRouter = Router();

// Get all subscription plans (public)
subscriptionRouter.get('/plans', subscription_controllers.get_all_plans);

// All other routes require authentication
subscriptionRouter.use(auth('USER', 'ADMIN', 'MASTER'));

// Create checkout session (with strict rate limiting)
subscriptionRouter.post(
  '/checkout',
  checkoutLimiter,
  RequestValidator(subscription_validations.create_checkout),
  subscription_controllers.create_checkout_session
);

// Get current subscription
subscriptionRouter.get('/current', subscription_controllers.get_current_subscription);

// Cancel subscription
subscriptionRouter.post('/cancel', subscription_controllers.cancel_subscription);

// Resume subscription
subscriptionRouter.post('/resume', subscription_controllers.resume_subscription);

// Upgrade subscription
subscriptionRouter.post(
  '/upgrade',
  RequestValidator(subscription_validations.upgrade_subscription),
  subscription_controllers.upgrade_subscription
);

// Downgrade subscription
subscriptionRouter.post(
  '/downgrade',
  RequestValidator(subscription_validations.downgrade_subscription),
  subscription_controllers.downgrade_subscription
);

// Create billing portal session
subscriptionRouter.post(
  '/billing-portal',
  RequestValidator(subscription_validations.create_billing_portal),
  subscription_controllers.create_billing_portal
);

// Get payment history
subscriptionRouter.get(
  '/payments',
  RequestValidator(subscription_validations.get_payment_history),
  subscription_controllers.get_payment_history
);

// Get subscription usage
subscriptionRouter.get('/usage', subscription_controllers.get_subscription_usage);

export default subscriptionRouter;
