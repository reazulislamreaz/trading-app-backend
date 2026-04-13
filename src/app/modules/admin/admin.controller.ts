import catchAsync from '../../utils/catch_async';
import manageResponse from '../../utils/manage_response';
import httpStatus from 'http-status';
import { Account_Model } from '../auth/auth.schema';
import { Subscription_Model } from '../subscription/subscription.schema';
import { Payment_Model } from '../subscription/payment.schema';
import { Signal_Model } from '../signal/signal.schema';
import { Master_Model } from '../master/master.schema';
import { Follow_Model } from '../follow/follow.schema';
import { Notification_Model } from '../notification/notification.schema';
import { notification_services } from '../notification/notification.service';

// Platform analytics (Admin only)
const get_platform_analytics = catchAsync(async (req, res) => {
  const totalUsers = await Account_Model.countDocuments({ role: 'USER' });
  const totalMasters = await Account_Model.countDocuments({ role: 'MASTER' });
  const activeSubscriptions = await Subscription_Model.countDocuments({ status: 'active' });
  const totalSignals = await Signal_Model.countDocuments();
  const activeSignals = await Signal_Model.countDocuments({ status: 'active' });
  const totalFollows = await Follow_Model.countDocuments();

  // Revenue stats
  const totalRevenue = await Payment_Model.aggregate([
    { $match: { status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  // Recent subscriptions
  const recentSubscriptions = await Subscription_Model.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('accountId', 'name email');

  // Subscription distribution
  const subscriptionByTier = await Subscription_Model.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$planId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Platform analytics retrieved',
    data: {
      users: { total: totalUsers },
      masters: {
        total: totalMasters,
      },
      subscriptions: {
        active: activeSubscriptions,
        byTier: subscriptionByTier,
      },
      signals: {
        total: totalSignals,
        active: activeSignals,
      },
      follows: { total: totalFollows },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        transactionCount: totalRevenue[0]?.count || 0,
      },
      recentSubscriptions,
    },
  });
});

// Broadcast announcement
const broadcast_announcement = catchAsync(async (req, res) => {
  const { title, message, link, targetRole } = req.body;

  const result = await notification_services.broadcast_announcement(
    title,
    message,
    link,
    targetRole
  );

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Announcement sent to ${result.sentCount} users`,
    data: result,
  });
});

// Manage user role (Admin can promote/demote)
const change_user_role = catchAsync(async (req, res) => {
  const { userId, newRole } = req.body;

  const account = await Account_Model.findByIdAndUpdate(
    userId,
    { role: newRole},
    { new: true }
  ).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!account) {
    manageResponse(res, {
      success: false,
      statusCode: httpStatus.NOT_FOUND,
      message: 'User not found',
      data: null,
    });
    return;
  }

  // Auto-create Master Profile when promoting to MASTER role
  if (newRole === 'MASTER') {
    const existingMasterProfile = await Master_Model.findOne({ accountId: userId });
    
    if (!existingMasterProfile) {
      await Master_Model.create({
        accountId: userId,
        bio: '',
        specialties: [],
        yearsOfExperience: 0,
        isApproved: true,
        approvedAt: new Date(),
        totalSignals: 0,
        winningSignals: 0,
        losingSignals: 0,
        winRate: 0,
        avgPnl: 0,
        followerCount: 0,
        isFeatured: false,
      });
    }
  }

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `User role changed to ${newRole}`,
    data: account,
  });
});

// Get payment logs (Admin view all payments)
const get_all_payments = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (req.query.status) {
    query.status = req.query.status;
  }

  const payments = await Payment_Model.find(query)
    .populate('accountId', 'name email')
    .populate('subscriptionId', 'planId status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment_Model.countDocuments(query);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment logs retrieved',
    data: payments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const admin_controllers = {
  get_platform_analytics,
  broadcast_announcement,
  change_user_role,
  get_all_payments,
};
