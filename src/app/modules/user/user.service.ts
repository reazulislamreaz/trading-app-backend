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

  // Build filter object
  const filter: Record<string, unknown> = {
    isDeleted: false, // Exclude soft-deleted users
    role: UserRole.USER,
  };

  // Search by name or email
  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const searchTerm = query.search.trim();
    filter.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // Filter by status
  if (query.status && typeof query.status === 'string' && query.status.trim()) {
    filter.accountStatus = query.status.trim().toUpperCase();
  }

  const users = await Account_Model.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  const total = await Account_Model.countDocuments(filter);

  // Transform users to match frontend expectations
  const transformedUsers = users.map(user => {
    const userObj = user.toObject();
    return {
      ...userObj,
      status: userObj.accountStatus, // Map accountStatus to status for frontend
      has2FA: userObj.twoFactorEnabled, // Map twoFactorEnabled to has2FA
      isEmailVerified: userObj.isVerified, // Map isVerified to isEmailVerified
      avatar: userObj.userProfileUrl, // Map userProfileUrl to avatar
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit), // Use totalPages to match frontend PaginatedResponse
    },
    data: transformedUsers,
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

const update_user_status = async (id: string, status: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", httpStatus.BAD_REQUEST);
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const upperStatus = status.toUpperCase();
  
  if (!validStatuses.includes(upperStatus)) {
    throw new AppError("Invalid status. Must be 'ACTIVE', 'INACTIVE', or 'SUSPENDED'", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findByIdAndUpdate(
    id,
    { accountStatus: upperStatus },
    { new: true },
  ).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!result) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  // Transform to match frontend expectations
  const userObj = result.toObject();
  return {
    ...userObj,
    status: userObj.accountStatus,
    has2FA: userObj.twoFactorEnabled,
    isEmailVerified: userObj.isVerified,
    avatar: userObj.userProfileUrl,
  };
};

const soft_delete_user = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user ID", httpStatus.BAD_REQUEST);
  }

  const result = await Account_Model.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  ).select('-password -twoFactorSecret -twoFactorBackupCodes -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpire -lockedUntil');

  if (!result) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return {
    success: true,
    message: "User deleted successfully",
  };
};

export const user_services = {
  update_profile_into_db,
  get_all_users_from_db,
  get_single_user_from_db,
  update_user_status,
  soft_delete_user,
};
