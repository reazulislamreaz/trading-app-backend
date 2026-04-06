import { AppError } from '../../utils/app_error';
import httpStatus from 'http-status';
import { Follow_Model } from './follow.schema';
import { Account_Model } from '../auth/auth.schema';
import { Master_Model } from '../master/master.schema';
import { Types } from 'mongoose';

/**
 * Follow a master
 */
const follow_master = async (followerId: string, masterId: string) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  // Cannot follow yourself
  if (followerId === masterId) {
    throw new AppError('You cannot follow yourself', httpStatus.BAD_REQUEST);
  }

  // Verify the master exists and has MASTER role
  const masterAccount = await Account_Model.findById(masterId);
  if (!masterAccount) {
    throw new AppError('Master not found', httpStatus.NOT_FOUND);
  }

  if (masterAccount.role !== 'MASTER') {
    throw new AppError('This user is not a Master Trader', httpStatus.BAD_REQUEST);
  }

  // Check if already following
  const existing = await Follow_Model.findOne({
    followerId: new Types.ObjectId(followerId),
    masterId: new Types.ObjectId(masterId),
  });

  if (existing) {
    throw new AppError('You are already following this master', httpStatus.CONFLICT);
  }

  // Create follow relationship
  await Follow_Model.create({
    followerId: new Types.ObjectId(followerId),
    masterId: new Types.ObjectId(masterId),
    notificationsEnabled: true,
  });

  // Increment master's follower count
  await Master_Model.findOneAndUpdate(
    { accountId: new Types.ObjectId(masterId) },
    { $inc: { followerCount: 1 } }
  );

  return { message: 'Successfully following master' };
};

/**
 * Unfollow a master
 */
const unfollow_master = async (followerId: string, masterId: string) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  const deleted = await Follow_Model.findOneAndDelete({
    followerId: new Types.ObjectId(followerId),
    masterId: new Types.ObjectId(masterId),
  });

  if (!deleted) {
    throw new AppError('You are not following this master', httpStatus.NOT_FOUND);
  }

  // Decrement master's follower count
  await Master_Model.findOneAndUpdate(
    { accountId: new Types.ObjectId(masterId) },
    { $inc: { followerCount: -1 } }
  );

  return { message: 'Successfully unfollowed master' };
};

/**
 * Toggle follow status
 */
const toggle_follow = async (followerId: string, masterId: string) => {
  if (!Types.ObjectId.isValid(masterId)) {
    throw new AppError('Invalid master ID', httpStatus.BAD_REQUEST);
  }

  const existing = await Follow_Model.findOne({
    followerId: new Types.ObjectId(followerId),
    masterId: new Types.ObjectId(masterId),
  });

  if (existing) {
    await unfollow_master(followerId, masterId);
    return { action: 'unfollowed', message: 'Unfollowed master' };
  } else {
    await follow_master(followerId, masterId);
    return { action: 'followed', message: 'Followed master' };
  }
};

/**
 * Get masters that a user is following
 */
const get_following = async (
  followerId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const follows = await Follow_Model.find({
    followerId: new Types.ObjectId(followerId),
  })
    .populate('masterId', 'name email userProfileUrl')
    .skip(skip)
    .limit(limit);

  const total = await Follow_Model.countDocuments({
    followerId: new Types.ObjectId(followerId),
  });

  const masters = follows.map((f) => ({
    ...f.toObject(),
    master: f.masterId,
  }));

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
 * Get followers of a master
 */
const get_followers = async (
  masterId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const follows = await Follow_Model.find({
    masterId: new Types.ObjectId(masterId),
  })
    .populate('followerId', 'name email userProfileUrl')
    .skip(skip)
    .limit(limit);

  const total = await Follow_Model.countDocuments({
    masterId: new Types.ObjectId(masterId),
  });

  const followers = follows.map((f) => ({
    ...f.toObject(),
    follower: f.followerId,
  }));

  return {
    data: followers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Check if user is following a master
 */
const is_following = async (followerId: string, masterId: string) => {
  const follow = await Follow_Model.findOne({
    followerId: new Types.ObjectId(followerId),
    masterId: new Types.ObjectId(masterId),
  });

  return { isFollowing: !!follow };
};

export const follow_services = {
  follow_master,
  unfollow_master,
  toggle_follow,
  get_following,
  get_followers,
  is_following,
};
