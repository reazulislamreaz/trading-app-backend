import cron from 'node-cron';
import { Account_Model } from '../modules/auth/auth.schema';
import { Subscription_Model } from '../modules/subscription/subscription.schema';
import sendMail from './mail_sender';
import logger from '../configs/logger';

/**
 * Days before expiry to send notification
 */
const EXPIRY_CHECK_DAYS = [7, 3, 1];

/**
 * Send expiry notification email to user
 */
const sendExpiryNotification = async (
  email: string,
  name: string,
  daysRemaining: number,
  tier: string
) => {
  const subject =
    daysRemaining === 1
      ? `⚠️ Your ${tier} subscription expires tomorrow`
      : `Your ${tier} subscription expires in ${daysRemaining} days`;

  const htmlBody = `
    <p>Your <strong>${tier}</strong> subscription is expiring in <strong>${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</strong>.</p>
    <p style="margin-top: 16px;">
      ${daysRemaining === 1
        ? "Don't lose access to your trading features. Renew now to continue uninterrupted access."
        : "Renew your subscription before it expires to keep access to all your trading features."
      }
    </p>
    <p style="margin-top: 16px;">
      <a href="${process.env.FRONTEND_URL || 'https://yourapp.com'}/subscription/renew"
         style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Renew Subscription
      </a>
    </p>
    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      If you have any questions, our support team is here to help.
    </p>
  `;

  await sendMail(
    {
      to: email,
      subject,
      textBody: `Your ${tier} subscription expires in ${daysRemaining} days. Renew now to continue uninterrupted access.`,
      htmlBody,
      name,
    },
    true // blocking to ensure delivery
  );
};

/**
 * Find subscriptions expiring soon and send notifications.
 * Tracks notification sent status to avoid duplicate emails.
 */
const checkExpiringSubscriptions = async () => {
  const now = new Date();
  let notificationCount = 0;
  let errorCount = 0;

  for (const days of EXPIRY_CHECK_DAYS) {
    // Calculate the date window: subscriptions expiring in exactly `days` days
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find active subscriptions expiring within this day
    const expiringSubscriptions = await Subscription_Model.find({
      status: { $in: ['active', 'trialing'] },
      cancelAtPeriodEnd: false, // Don't notify if already canceled
      currentPeriodEnd: { $gte: startOfDay, $lte: endOfDay },
    });

    for (const sub of expiringSubscriptions) {
      try {
        // Check if notification already sent for this period
        const notificationKey = `expiryNotified_${days}_${sub.currentPeriodEnd?.getTime()}`;
        if ((sub as any)[notificationKey]) {
          continue; // Already notified
        }

        // Get account details
        const account = await Account_Model.findById(sub.accountId);
        if (!account || !account.email) {
          continue;
        }

        const tier = sub.planId.split('_')[0] || account.subscriptionTier || 'subscription';

        await sendExpiryNotification(account.email, account.name, days, tier);

        // Mark as notified
        await Subscription_Model.findByIdAndUpdate(sub._id, {
          $set: { [notificationKey]: true },
        });

        notificationCount++;
        logger.info(
          `📧 Sent expiry notification to ${account.email} (${days} days remaining, subscription: ${sub._id})`
        );
      } catch (error: any) {
        errorCount++;
        logger.error(
          `❌ Failed to send expiry notification for subscription ${sub._id}: ${error.message}`
        );
      }
    }
  }

  if (notificationCount > 0 || errorCount > 0) {
    logger.info(
      `🔄 Expiry notification check complete: ${notificationCount} sent, ${errorCount} errors`
    );
  }
};

/**
 * Schedule: runs daily at 9:00 AM UTC
 * Users get notified 7, 3, and 1 days before subscription expires
 */
export const scheduleExpiryNotifications = () => {
  cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Running subscription expiry notification check...');
    await checkExpiringSubscriptions();
  });

  logger.info('📅 Expiry notifications scheduled (daily at 9:00 AM UTC)');
};
