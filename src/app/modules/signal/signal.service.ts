import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Signal_Model } from './signal.schema';
import { Master_Model } from '../master/master.schema';
import { Account_Model } from '../auth/auth.schema';
import { Types } from 'mongoose';

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
}

interface TCloseSignal {
  resultPnl?: number | null;
  closeNotes?: string;
}

interface TSignalFilters {
  assetType?: string;
  signalType?: string;
  status?: string;
  isPremium?: boolean;
  authorId?: string;
}

/**
 * Create a new signal (Master only)
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

  // Check if master is approved
  const master = await Master_Model.findOne({ accountId });
  if (!master || !master.isApproved) {
    throw new AppError('Your Master profile has not been approved yet', httpStatus.FORBIDDEN);
  }

  const signal = await Signal_Model.create({
    ...data,
    authorId: new Types.ObjectId(accountId),
    stopLoss: data.stopLoss ?? null,
    takeProfit1: data.takeProfit1 ?? null,
    takeProfit2: data.takeProfit2 ?? null,
    takeProfit3: data.takeProfit3 ?? null,
  });

  // Update master stats
  await Master_Model.findOneAndUpdate(
    { accountId },
    { $inc: { totalSignals: 1 } }
  );

  return signal;
};

/**
 * Update a signal (Master only, own signals)
 */
const update_signal = async (accountId: string, signalId: string, data: Partial<TCreateSignal>) => {
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

  if (signal.status !== 'active') {
    throw new AppError('Cannot update closed or expired signals', httpStatus.BAD_REQUEST);
  }

  const updated = await Signal_Model.findByIdAndUpdate(
    signalId,
    { $set: data },
    { new: true }
  );

  return updated;
};

/**
 * Close a signal
 */
const close_signal = async (accountId: string, signalId: string, data: TCloseSignal) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId);
  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  if (signal.authorId.toString() !== accountId) {
    throw new AppError('You can only close your own signals', httpStatus.FORBIDDEN);
  }

  const master = await Master_Model.findOne({ accountId });

  const updates: Record<string, unknown> = {
    status: 'closed',
    closedAt: new Date(),
    ...data,
  };

  const updated = await Signal_Model.findByIdAndUpdate(signalId, updates, { new: true });

  // Update master win/loss stats
  if (master && data.resultPnl !== null && data.resultPnl !== undefined) {
    const incField = data.resultPnl >= 0 ? 'winningSignals' : 'losingSignals';
    await Master_Model.findOneAndUpdate(
      { accountId },
      {
        $inc: {
          [incField]: 1,
        },
      }
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
  }

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

  await Signal_Model.findByIdAndUpdate(signalId, { status: 'canceled' });

  // Decrement master total signals
  await Master_Model.findOneAndUpdate(
    { accountId },
    { $inc: { totalSignals: -1 } }
  );

  return { message: 'Signal deleted' };
};

/**
 * Get signals with filters and pagination
 */
const get_signals = async (
  page: number = 1,
  limit: number = 20,
  filters: TSignalFilters = {}
) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  if (filters.assetType) query.assetType = filters.assetType;
  if (filters.signalType) query.signalType = filters.signalType;
  if (filters.status) query.status = filters.status;
  if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;
  if (filters.authorId) query.authorId = new Types.ObjectId(filters.authorId);

  // Default: only show active signals unless specifically filtered
  if (!filters.status) {
    query.status = 'active';
  }

  const signals = await Signal_Model.find(query)
    .populate('authorId', 'name userProfileUrl')
    .sort({ isFeatured: -1, createdAt: -1 })
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
 * Get single signal by ID
 */
const get_signal_by_id = async (signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findById(signalId)
    .populate('authorId', 'name userProfileUrl');

  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  return signal;
};

/**
 * Get master's own signals
 */
const get_my_signals = async (
  accountId: string,
  page: number = 1,
  limit: number = 20,
  status?: string
) => {
  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { authorId: new Types.ObjectId(accountId) };

  if (status) {
    query.status = status;
  }

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
 * Increment view count (called when a user views a signal)
 */
const increment_view = async (signalId: string) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  await Signal_Model.findByIdAndUpdate(signalId, { $inc: { viewCount: 1 } });
};

/**
 * Admin feature a signal
 */
const toggle_featured_signal = async (signalId: string, isFeatured: boolean) => {
  if (!Types.ObjectId.isValid(signalId)) {
    throw new AppError('Invalid signal ID', httpStatus.BAD_REQUEST);
  }

  const signal = await Signal_Model.findByIdAndUpdate(
    signalId,
    { isFeatured },
    { new: true }
  ).populate('authorId', 'name email');

  if (!signal) {
    throw new AppError('Signal not found', httpStatus.NOT_FOUND);
  }

  return signal;
};

export const signal_services = {
  create_signal,
  update_signal,
  close_signal,
  delete_signal,
  get_signals,
  get_signal_by_id,
  get_my_signals,
  increment_view,
  toggle_featured_signal,
};
