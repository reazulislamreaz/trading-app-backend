import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catch_async';
import { AppError } from '../utils/app_error';
import httpStatus from 'http-status';
import { Account_Model } from '../modules/auth/auth.schema';

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'master';

const tierLevels: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  master: 3,
};

/**
 * Middleware to require active subscription
 * @param requiredTier - Minimum tier level required
 * @returns Express middleware
 */
export const requireActiveSubscription = (requiredTier?: SubscriptionTier) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.user!.userId;

    const account = await Account_Model.findById(accountId);

    if (!account) {
      throw new AppError('Account not found', httpStatus.NOT_FOUND);
    }

    // Check if subscription exists
    if (!account.subscriptionStatus || account.subscriptionStatus === 'none') {
      throw new AppError('Active subscription required', httpStatus.FORBIDDEN);
    }

    // Check subscription status
    if (account.subscriptionStatus !== 'active' && account.subscriptionStatus !== 'trialing') {
      throw new AppError(
        'Subscription is not active. Please renew your subscription to continue.',
        httpStatus.FORBIDDEN
      );
    }

    // Check if subscription has expired
    if (account.subscriptionExpiresAt && account.subscriptionExpiresAt < new Date()) {
      throw new AppError(
        'Subscription has expired. Please renew to continue.',
        httpStatus.FORBIDDEN
      );
    }

    // Check tier level if required
    if (requiredTier) {
      const currentTier = (account.subscriptionTier || 'free') as SubscriptionTier;
      const currentLevel = tierLevels[currentTier];
      const requiredLevel = tierLevels[requiredTier];

      if (currentLevel < requiredLevel) {
        throw new AppError(
          `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan to access this feature`,
          httpStatus.FORBIDDEN
        );
      }
    }

    next();
  });
};

/**
 * Middleware to check signal usage limits
 * @returns Express middleware
 */
export const checkSignalLimit = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.user!.userId;

    const account = await Account_Model.findById(accountId);
    if (!account) {
      throw new AppError('Account not found', httpStatus.NOT_FOUND);
    }

    // Free tier has limited access
    if (account.subscriptionTier === 'free' || !account.subscriptionTier) {
      // You can add specific signal counting logic here
      // For now, we'll just check if subscription is active
      if (account.subscriptionStatus === 'none') {
        throw new AppError(
          'Signal limit reached. Please subscribe to continue viewing signals',
          httpStatus.FORBIDDEN
        );
      }
    }

    next();
  });
};
