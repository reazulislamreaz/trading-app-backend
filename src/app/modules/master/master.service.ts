import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Master_Model } from './master.schema';
import { Account_Model } from '../auth/auth.schema';
import { TMasterProfile } from './master.interface';
import { Types } from 'mongoose';

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
  filters: { isFeatured?: boolean } = {}
) => {
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.isFeatured !== undefined) {
    query.isFeatured = filters.isFeatured;
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
  const master = await Master_Model.findOne({ accountId });
  if (!master) {
    throw new AppError('Master profile not found', httpStatus.NOT_FOUND);
  }

  return {
    totalSignals: master.totalSignals,
    winningSignals: master.winningSignals,
    losingSignals: master.losingSignals,
    winRate: master.winRate,
    avgPnl: master.avgPnl,
    followerCount: master.followerCount,
  };
};

export const master_services = {
  create_or_update_master_profile,
  get_master_profile,
  get_all_masters,
  get_master_by_id,
  toggle_featured,
  get_master_stats,
};
