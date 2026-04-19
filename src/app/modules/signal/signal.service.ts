import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Signal_Model, SignalStatus } from './signal.schema';
import { Master_Model } from '../master/master.schema';
import { Account_Model } from '../auth/auth.schema';
import { Types } from 'mongoose';
import { contribution_services } from '../contribution/contribution.service';
import { notification_services } from '../notification/notification.service';
import { follow_services } from '../follow/follow.service';
import logger from '../../configs/logger';

interface TCreateSignal {
  title: string;
  description?: string;
  assetType: 'forex' | 'crypto' | 'stocks' | 'indices' | 'commodities';
  symbol: string;
  signalType: 'long' | 'short';
  timeframe: string;
  entryPrice: number;
  entryNotes?: string;
  stopLoss?: number | null;
  takeProfit1?: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
  isPremium?: boolean;
  tags?: string[];
  externalChartUrl?: string;
  publishType?: 'instant' | 'scheduled';
  scheduledAt?: string;
}

interface TCloseSignal {
  resultPnl?: number | null;
  closeNotes?: string;
}

interface TSignalFilters {
  search?: string;
  assetType?: string;
  signalType?: string;
  status?: string;
  isPremium?: boolean;
  authorId?: string;
}

/**
 * Create a new signal (Master only)
 * Supports instant publish (default) and scheduled publish
 */
const create_signal = async (accountId: string, data: TCreateSignal) => {
  // Verify user is a Master
  const account = await Account_Model.findById(accountId);
  if (!account) {
    throw new AppError('Account not found', httpStatus.NOT_FOUND);
  }

  if (account.role !== 'MASTER') {
    throw new AppError('Only Master Traders can create signals', httpStatus.FORBIDDEN);
  }

  // Determine publish type and status
  const publishType = data.publishType || 'instant';
  let status: SignalStatus = 'active';
  let scheduledAt: Date | null = null;
  let publishedAt: Date | null = null;

  if (publishType === 'scheduled') {
    if (!data.scheduledAt) {
      throw new AppError('scheduledAt is required when publishType is scheduled', httpStatus.BAD_REQUEST);
    }

    scheduledAt = new Date(data.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new AppError('Invalid scheduledAt date format', httpStatus.BAD_REQUEST);
    }

    status = 'scheduled';
  } else {
    // Instant publish - set publishedAt to now
    publishedAt = new Date();
  }

  const signal = await Signal_Model.create({
    ...data,
    authorId: new Types.ObjectId(accountId),
    status,
    publishType,
    scheduledAt,
    publishedAt,
    stopLoss: data.stopLoss ?? null,
    takeProfit1: data.takeProfit1 ?? null,
    takeProfit2: data.takeProfit2 ?? null,
    takeProfit3: data.takeProfit3 ?? null,
  });

  // Update master stats only for instantly published signals
  if (publishType === 'instant') {
    await Master_Model.findOneAndUpdate(
      { accountId },
      { $inc: { totalSignals: 1 } }
    );

    // Track contribution for signal creation
    contribution_services.track_contribution(accountId, 'create_signal', signal._id.toString());

    // Notify followers about the new signal
    await notifyFollowersOfNewSignal(signal._id.toString(), accountId);
  }

  return signal;
};

/**
 * Notify all followers of a Master Trader about a new signal.
 * Used for both instant and scheduled signal publishing.
 */
const notifyFollowersOfNewSignal = async (signalId: string, masterAccountId: string) => {
  try {
    const followers = await follow_services.get_followers(masterAccountId, 1, 10000);

    if (!followers.data || followers.data.length === 0) {
      return { notifiedCount: 0 };
    }

    // Populate signal details for notification content
    const signal = await Signal_Model.findById(signalId);
    if (!signal) return { notifiedCount: 0 };

    const master = await Account_Model.findById(masterAccountId).select('name');
    const masterName = master?.name || 'Master Trader';

    const notifications = followers.data.map((follow: any) => ({
      accountId: follow.followerId._id.toString(),
      type: 'new_signal' as const,
      title: `New signal from ${masterName}`,
      message: signal.title,
      link: `/signals/${signalId}`,
      data: {
        signalId,
        symbol: signal.symbol,
        signalType: signal.signalType,
      },
    }));

    const result = await notification_services.create_many_notifications(notifications);
    logger.info(
      `📢 Notified ${result.createdCount}/${notifications.length} followers about new signal ${signalId}`
    );
    return result;
  } catch (error: any) {
    logger.error(`❌ Failed to notify followers for signal ${signalId}: ${error.message}`);
    return { notifiedCount: 0 };
  }
};

/**
 * Update a signal (Master only, own signals)
 * If body contains `status: 'closed'` with `resultPnl`, triggers close logic
 * (updates master win/loss stats, tracks contribution).
 */
const update_signal = async (
  accountId: string,
  signalId: string,
  data: Partial<TCreateSignal> & TCloseSignal & { status?: SignalStatus | 'won' | 'lost' }
) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  if (signal.authorId.toString() !== accountId) {
    throw new AppError('You can only update your own signals', httpStatus.FORBIDDEN);
  }

  // Normalize status for 'won' or 'lost' virtual statuses
  let finalStatus = data.status;
  let finalResultPnl = data.resultPnl;

  if (finalStatus === ('won' as any)) {
    finalStatus = 'closed';
    if (finalResultPnl === undefined || finalResultPnl === null) finalResultPnl = 1;
  } else if (finalStatus === ('lost' as any)) {
    finalStatus = 'closed';
    if (finalResultPnl === undefined || finalResultPnl === null) finalResultPnl = -1;
  }

  // Detect close action: status set to 'closed' with resultPnl provided
  const isClosing = finalStatus === 'closed' && (finalResultPnl !== undefined && finalResultPnl !== null);

  if (isClosing) {
    const master = await Master_Model.findOne({ accountId });

    const updates: Record<string, unknown> = {
      status: 'closed',
      closedAt: new Date(),
      resultPnl: finalResultPnl,
      closeNotes: data.closeNotes || '',
    };

    const updated = await Signal_Model.findByIdAndUpdate(signalId, updates, { new: true });

    // Update master win/loss stats
    if (master && finalResultPnl !== null && finalResultPnl !== undefined) {
      const incField = finalResultPnl >= 0 ? 'winningSignals' : 'losingSignals';
      await Master_Model.findOneAndUpdate(
        { accountId },
        { $inc: { [incField]: 1 } }
      );

      // Recalculate win rate
      const updatedMaster = await Master_Model.findOne({ accountId });
      if (updatedMaster) {
        const total = updatedMaster.winningSignals + updatedMaster.losingSignals;
        const winRate = total > 0 ? (updatedMaster.winningSignals / total) * 100 : 0;
        await Master_Model.findOneAndUpdate(
          { accountId },
          { winRate: Math.round(winRate * 100) / 100 }
        );
      }

      // Track contribution for closing signal
      const activityType = finalResultPnl >= 0 ? 'close_signal_profit' : 'close_signal_loss';
      contribution_services.track_contribution(accountId, activityType, signalId);
    }

    return updated;
  }

  // Regular update (not closing)
  if (signal.status !== 'active' && signal.status !== 'scheduled') {
    throw new AppError('Cannot update closed, expired or canceled signals', httpStatus.BAD_REQUEST);
  }

  const updated = await Signal_Model.findByIdAndUpdate(
    signalId,
    { $set: { ...data, status: finalStatus, resultPnl: finalResultPnl } },
    { new: true }
  );

  return updated;
};

/**
 * Delete a signal (soft delete — set to expired)
 */
const delete_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  if (signal.authorId.toString() !== accountId) {
    throw new AppError('You can only delete your own signals', httpStatus.FORBIDDEN);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { status: 'expired' });

  return { message: 'Signal deleted successfully' };
};

/**
 * Shared filtering logic for signal queries
 */
const apply_filters = (query: any, filters: TSignalFilters) => {
  // Search by symbol or title
  if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    query.$or = [
      { symbol: { $regex: searchTerm, $options: 'i' } },
      { title: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (filters.assetType) query.assetType = filters.assetType;
  if (filters.signalType) query.signalType = filters.signalType;
  
  // Handle status filtering (support virtual statuses won/lost)
  if (filters.status) {
    if (filters.status === "all") {
      // No status filter applied
    } else if (filters.status === 'won') {
      query.status = 'closed';
      query.resultPnl = { $gte: 0 };
    } else if (filters.status === 'lost') {
      query.status = 'closed';
      query.resultPnl = { $lt: 0 };
    } else {
      query.status = filters.status;
    }
  }

  if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;
  if (filters.authorId) query.authorId = new Types.ObjectId(filters.authorId);
};

const get_signals = async (
  page: number = 1,
  limit: number = 20,
  filters: TSignalFilters = {}
) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  apply_filters(query, filters);

  // Default for general list: only show active signals if no status specified
  if (!filters.status) {
    query.status = 'active';
  }

  const signals = await Signal_Model.find(query)
    .populate('authorId', 'name userProfileUrl')
    .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Signal_Model.countDocuments(query);

  return {
    data: signals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const get_signal_by_id = async (signalId: string, includeUnpublished = false) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const query: any = { _id: new Types.ObjectId(signalId) };
  if (!includeUnpublished) {
    query.status = 'active';
  }

  const signal = await Signal_Model.findOne(query).populate('authorId', 'name userProfileUrl');
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  return signal;
};

const get_my_signals = async (
  accountId: string,
  page: number = 1,
  limit: number = 20,
  filters: TSignalFilters = {}
) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { authorId: new Types.ObjectId(accountId) };

  apply_filters(query, filters);

  const signals = await Signal_Model.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Signal_Model.countDocuments(query);

  return {
    data: signals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Increment view count
 */
const increment_view = async (signalId: string, viewerId?: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { viewCount: 1 } });

  if (viewerId) {
    contribution_services.track_contribution(viewerId, 'view_signal', signalId);
  }
};

/**
 * Like a signal
 */
const like_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { likeCount: 1 } });
  contribution_services.track_contribution(accountId, 'like_signal', signalId);

  return { message: 'Signal liked successfully' };
};

/**
 * Unlike a signal
 */
const unlike_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { likeCount: -1 } });
  return { message: 'Signal unliked successfully' };
};

/**
 * Bookmark a signal
 */
const bookmark_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { bookmarkCount: 1 } });
  contribution_services.track_contribution(accountId, 'bookmark_signal', signalId);

  return { message: 'Signal bookmarked successfully' };
};

/**
 * Remove bookmark
 */
const unbookmark_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { bookmarkCount: -1 } });
  return { message: 'Bookmark removed successfully' };
};

/**
 * Share a signal
 */
const share_signal = async (accountId: string, signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  contribution_services.track_contribution(accountId, 'share_signal', signalId);
  return { message: 'Signal shared successfully' };
};

const publish_scheduled_signals = async () => {
  const now = new Date();
  
  const signals = await Signal_Model.find({
    status: 'scheduled',
    publishType: 'scheduled',
    scheduledAt: { $lte: now },
  });

  if (signals.length === 0) {
    return { total: 0, published: 0, notified: 0, errors: 0 };
  }

  let published = 0;
  let notified = 0;
  let errors = 0;

  for (const signal of signals) {
    try {
      await Signal_Model.findByIdAndUpdate(signal._id, {
        status: 'active',
        publishedAt: now,
      });

      await Master_Model.findOneAndUpdate(
        { accountId: signal.authorId },
        { $inc: { totalSignals: 1 } }
      );

      await contribution_services.track_contribution(
        signal.authorId.toString(),
        'create_signal',
        signal._id.toString()
      );

      await notifyFollowersOfNewSignal(signal._id.toString(), signal.authorId.toString());
      
      published++;
      notified++;
    } catch (error: any) {
      logger.error(`Failed to publish scheduled signal ${signal._id}: ${error.message}`);
      errors++;
    }
  }

  return { total: signals.length, published, notified, errors };
};

const toggle_featured_signal = async (signalId: string, isFeatured: boolean) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findByIdAndUpdate(
    signalId,
    { isFeatured },
    { new: true }
  );

  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  return signal;
};

export const signal_services = {
  create_signal,
  update_signal,
  delete_signal,
  get_signals,
  get_signal_by_id,
  get_my_signals,
  publish_scheduled_signals,
  toggle_featured_signal,
  increment_view,
  like_signal,
  unlike_signal,
  bookmark_signal,
  unbookmark_signal,
  share_signal,
};
