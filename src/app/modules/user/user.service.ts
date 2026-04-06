import { Request } from "express";
import { Account_Model } from "../auth/auth.schema";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";
import { UserRole } from "../../types/role";
import { Types } from "mongoose";

const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

/**
 * Whitelist-only fields that users can update on their own profile.
 * Prevents privilege escalation (role, isVerified, subscriptionTier, etc.)
 */
const ALLOWED_PROFILE_FIELDS = ['name', 'userProfileUrl'];

const update_profile_into_db = async (req: Request) => {
  const email = req?.user?.email;

  if (!email) {
    throw new AppError("User email not found", httpStatus.UNAUTHORIZED);
  }

  // Build update object from whitelisted fields only
  const updateData: Record<string, unknown> = {};
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError("No valid fields to update", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findOneAndUpdate(
    { email },
    updateData,
    { new: true },
  );

  return result;
};

const get_all_users_from_db = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || DEFAULT_PAGE;
  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_PAGINATION_LIMIT);

  const skip = (page - 1) * limit;

  const users = await Account_Model.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  const total = await Account_Model.countDocuments();

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};

const get_single_user_from_db = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findById(id).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!result) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return result;
};

const suspend_user_from_db = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findByIdAndUpdate(
    id,
    { accountStatus: "SUSPENDED" },
    { new: true },
  ).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!result) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return result;
};

const activate_user_from_db = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findByIdAndUpdate(
    id,
    { accountStatus: "ACTIVE" },
    { new: true },
  ).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!result) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return result;
};

export const user_services = {
  update_profile_into_db,
  get_all_users_from_db,
  get_single_user_from_db,
  suspend_user_from_db,
  activate_user_from_db,
};
