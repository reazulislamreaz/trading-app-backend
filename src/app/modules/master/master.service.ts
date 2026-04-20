import mongoose from "mongoose";
import { Types } from 'mongoose';
import httpStatus from 'http-status';
import { AppError } from '../../utils/app_error';
import { Master_Model } from './master.schema';
import { Signal_Model } from '../signal/signal.schema';
import { Follow_Model } from '../follow/follow.schema';
import { Account_Model } from '../auth/auth.schema';
import { Copied_Trade_Model } from '../copied_trade/copied_trade.schema';
import { Notification_Model } from '../notification/notification.schema';
import { Contribution_Model } from '../contribution/contribution.schema';
import { TMasterProfile } from './master.interface';

/**
 * Create or update master profile for the authenticated user
 */
const create_or_update_master_profile = async (
  accountId: string,
  profileData: TMasterProfile
) => {
  const account = await Account_Model.findById(accountId);
  if (!account) {
    throw new AppError('Account not found', httpStatus.NOT_FOUND);
  }

  // Ensure account has MASTER role
  if (account.role !== 'MASTER') {
    throw new AppError('Only MASTER role users can create master profiles', httpStatus.FORBIDDEN);
  }

  const master = await Master_Model.findOneAndUpdate(
    { accountId },
    { ...profileData, accountId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return master;
};

/**
 * Get master profile by account ID
 */
const get_master_profile = async (accountId: string) => {
  const master = await Master_Model.findOne({ accountId })
    .populate('accountId', 'name email userProfileUrl accountStatus');

  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  return master;
};

/**
 * Get all masters (with filtering for admin dashboard)
 */
const get_all_masters = async (
  page: number = 1,
  limit: number = 10,
  filters: { isFeatured?: boolean; search?: string } = {}
) => {
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.isFeatured !== undefined) {
    query.isFeatured = filters.isFeatured;
  }

  // Search by name or email (through populated accountId)
  if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    
    // First, find account IDs that match the search
    const matchingAccounts = await Account_Model.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');
    
    const accountIds = matchingAccounts.map(acc => acc._id);
    
    // If no matching accounts, return empty result
    if (accountIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
    
    // Filter masters by matching account IDs
    query.accountId = { $in: accountIds };
  }

  const masters = await Master_Model.find(query)
    .populate('accountId', 'name email userProfileUrl accountStatus')
    .sort({ followerCount: -1, displayOrder: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Master_Model.countDocuments(query);

  return {
    data: masters,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get master profile by ID
 */
const get_master_by_id = async (masterId: string) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  const master = await Master_Model.findById(masterId)
    .populate('accountId', 'name email userProfileUrl');

  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  return master;
};

/**
 * Admin features/unfeatures a master
 */
const toggle_featured = async (masterId: string, isFeatured: boolean) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  const master = await Master_Model.findByIdAndUpdate(
    masterId,
    { isFeatured },
    { new: true }
  ).populate('accountId', 'name email');

  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  return master;
};

/**
 * Get master statistics
 */
const get_master_stats = async (accountId: string) => {
  const master = await Master_Model.findOne({ accountId: new Types.ObjectId(accountId) });

  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  const authorId = new Types.ObjectId(accountId);

  // Fetch real data from Signal_Model to ensure accuracy
  const totalSignals = await Signal_Model.countDocuments({ authorId });
  
  const activeSignals = await Signal_Model.countDocuments({ 
    authorId,
    status: { $in: ['active', 'published'] }
  });

  const completedSignals = await Signal_Model.countDocuments({ 
    authorId,
    status: { $in: ['closed', 'completed', 'won', 'lost'] }
  });

  const winningSignals = await Signal_Model.countDocuments({
    authorId,
    status: { $in: ['closed', 'completed', 'won', 'lost'] },
    resultPnl: { $gt: 0 }
  });

  const losingSignals = await Signal_Model.countDocuments({
    authorId,
    status: { $in: ['closed', 'completed', 'won', 'lost'] },
    resultPnl: { $lt: 0 }
  });

  // Calculate win rate
  const totalClosed = winningSignals + losingSignals;
  const winRate = totalClosed > 0 ? (winningSignals / totalClosed) * 100 : 0;

  // Aggregate for engagement and profit
  const aggregationResult = await Signal_Model.aggregate([
    { 
      $match: { authorId } 
    },
    { 
      $group: { 
        _id: null, 
        avgProfit: { 
          $avg: { 
            $cond: [
              { $in: ['$status', ['closed', 'completed', 'won', 'lost']] },
              '$resultPnl',
              null
            ] 
          } 
        },
        totalLikes: { $sum: '$likeCount' },
        totalBookmarks: { $sum: '$bookmarkCount' }
      } 
    }
  ]);

  const stats = aggregationResult.length > 0 ? aggregationResult[0] : {
    avgProfit: 0,
    totalLikes: 0,
    totalBookmarks: 0
  };

  // Accurate follower count from Follow_Model
  const totalFollowers = await Follow_Model.countDocuments({ masterId: authorId });

  // Update master record with fresh stats to keep it synchronized
  await Master_Model.findOneAndUpdate(
    { accountId: authorId },
    { 
      totalSignals, 
      winningSignals, 
      losingSignals, 
      winRate: Math.round(winRate * 100) / 100,
      avgPnl: Math.round((stats.avgProfit || 0) * 100) / 100,
      followerCount: totalFollowers
    }
  );

  return {
    totalSignals,
    activeSignals,
    completedSignals,
    winningSignals,
    losingSignals,
    winRate: Math.round(winRate * 100) / 100,
    avgProfit: Math.round((stats.avgProfit || 0) * 100) / 100,
    totalFollowers,
    followerCount: totalFollowers,
    totalLikes: stats.totalLikes || 0,
    totalBookmarks: stats.totalBookmarks || 0,
  };
};

/**
 * Get detailed master analytics for dashboard
 */
const get_master_analytics = async (accountId: string) => {
  const authorId = new Types.ObjectId(accountId);
  const master = await Master_Model.findOne({ accountId: authorId });

  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  // 1. Basic Stats (Reuse existing logic)
  const basicStats = await get_master_stats(accountId);

  // 2. Performance over time (Monthly)
  const monthlyPerformance = await Signal_Model.aggregate([
    { $match: { authorId, status: { $in: ['closed', 'completed', 'won', 'lost'] } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalPnL: { $sum: '$resultPnl' },
        signalCount: { $sum: 1 },
        wins: { $sum: { $cond: [{ $gt: ['$resultPnl', 0] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // 3. Asset Distribution
  const assetDistribution = await Signal_Model.aggregate([
    { $match: { authorId } },
    {
      $group: {
        _id: '$assetType',
        count: { $sum: 1 },
      },
    },
    { $project: { assetType: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);

  // 4. Top Symbols
  const topSymbols = await Signal_Model.aggregate([
    { $match: { authorId } },
    {
      $group: {
        _id: '$symbol',
        count: { $sum: 1 },
      },
    },
    { $project: { symbol: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // 5. Follower Growth (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const followerGrowth = await Follow_Model.aggregate([
    { 
      $match: { 
        masterId: authorId,
        createdAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  // 6. Recent Signal Results
  const recentSignals = await Signal_Model.find({ authorId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('symbol assetType signalType resultPnl status createdAt');

  return {
    overview: basicStats,
    performance: {
      monthly: monthlyPerformance.map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        pnl: Math.round(m.totalPnL * 100) / 100,
        signals: m.signalCount,
        winRate: Math.round((m.wins / m.signalCount) * 10000) / 100,
      })),
      assetDistribution,
      topSymbols,
    },
    followerGrowth,
    recentSignals,
  };
};

/**
 * Admin deletes a master trader and all associated data
 * Cascades to signals, follows, copied trades, and more
 */
const delete_master = async (masterId: string) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const master = await Master_Model.findById(masterId).session(session);
    if (!master) {
      throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
    }

    const accountId = master.accountId;

    // 1. Delete all signals authored by this master
    await Signal_Model.deleteMany({ authorId: accountId }).session(session);

    // 2. Delete all follows related to this master (both ways)
    await Follow_Model.deleteMany({ 
      $or: [
        { masterId: accountId }, 
        { followerId: accountId }
      ] 
    }).session(session);

    // 3. Delete copied trades records linked to this master
    await Copied_Trade_Model.deleteMany({ masterId: accountId }).session(session);

    // 4. Delete notifications for this account
    await Notification_Model.deleteMany({ accountId }).session(session);

    // 5. Delete contribution/points history
    await Contribution_Model.deleteMany({ accountId }).session(session);

    // 6. Delete master profile
    await Master_Model.findByIdAndDelete(masterId).session(session);

    // 7. Hard delete the account itself
    await Account_Model.findByIdAndDelete(accountId).session(session);

    await session.commitTransaction();
    session.endSession();

    return { 
      success: true, 
      message: 'Master and all associated data (signals, follows, etc.) have been permanently deleted' 
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const master_services = {
  create_or_update_master_profile,
  get_master_profile,
  get_all_masters,
  get_master_by_id,
  toggle_featured,
  get_master_stats,
  get_master_analytics,
  delete_master,
};
