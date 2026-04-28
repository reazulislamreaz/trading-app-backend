import { Referral_Model } from "./referral.schema";
import { Account_Model } from "../auth/auth.schema";
import { WalletTransaction_Model } from "../wallet_transaction/wallet_transaction.schema";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";
import { Types } from "mongoose";
import crypto from "crypto";
import { system_config_services } from "../system_config/system_config.service";

/**
 * Generate a unique referral code
 */
const generateReferralCode = async (): Promise<string> => {
  let isUnique = false;
  let code = "";
  while (!isUnique) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 character hex string
    const existing = await Account_Model.findOne({ referralCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

const get_referral_stats_from_db = async (userId: string) => {
  let account = await Account_Model.findById(userId);
  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  // If account doesn't have a referral code, generate one on the fly
  if (!account.referralCode) {
    const newCode = await generateReferralCode();
    account = await Account_Model.findByIdAndUpdate(
      userId,
      { referralCode: newCode },
      { new: true },
    );
  }

  const totalReferrals = await Referral_Model.countDocuments({
    referrerId: userId,
  });
  const activeReferrals = await Referral_Model.countDocuments({
    referrerId: userId,
    status: "COMPLETED",
  });

  const referrals = await Referral_Model.find({ referrerId: userId });
  const totalRewards = referrals.reduce(
    (sum, ref) => sum + (ref.rewardAmount || 0),
    0,
  );

  // In production, base URL should come from config
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const referralLink = `${baseUrl}/login?ref=${account!.referralCode}`;

  return {
    referralCode: account!.referralCode,
    totalReferrals,
    activeReferrals,
    totalRewards,
    walletBalance: account!.walletBalance,
    referralLink,
  };
};

const get_referral_history_from_db = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const referrals = await Referral_Model.find({ referrerId: userId })
    .populate("inviteeId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Referral_Model.countDocuments({ referrerId: userId });

  const data = referrals.map((ref) => ({
    _id: ref._id,
    inviteeName: (ref.inviteeId as any)?.name || "Unknown User",
    status: ref.status,
    rewardAmount: ref.rewardAmount,
    createdAt: ref.createdAt,
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Mark a referral as completed when the invitee subscribes
 */
const complete_referral_in_db = async (inviteeId: string) => {
  const referral = await Referral_Model.findOne({
    inviteeId,
    status: "PENDING",
  });

  if (referral) {
    // Get reward amount from system config (in dollars)
    const config = await system_config_services.get_config();
    const REWARD_AMOUNT = config.referralRewardAmount;

    console.log(`[Referral] Completing referral for invitee: ${inviteeId}`);
    console.log(`[Referral] Reward Amount: $${REWARD_AMOUNT}`);

    const referrerAccount = await Account_Model.findById(referral.referrerId);
    console.log(`[Referral] Referrer Wallet Balance Before: $${referrerAccount?.walletBalance || 0}`);

    await Referral_Model.findByIdAndUpdate(referral._id, {
      status: "COMPLETED",
      rewardAmount: REWARD_AMOUNT,
    });

    // Update referrer's wallet balance
    const updatedAccount = await Account_Model.findByIdAndUpdate(
      referral.referrerId,
      { $inc: { walletBalance: REWARD_AMOUNT } },
      { new: true }
    );
    
    console.log(`[Referral] Referrer Wallet Balance After: $${updatedAccount?.walletBalance || 0}`);

    // Create wallet transaction
    await WalletTransaction_Model.create({
      userId: referral.referrerId,
      amount: REWARD_AMOUNT,
      type: "REWARD",
      status: "COMPLETED",
      referenceId: referral._id,
      description: "Referral reward",
    });

    return true;
  }

  return false;
};

export const referral_services = {
  get_referral_stats_from_db,
  get_referral_history_from_db,
  complete_referral_in_db,
  generateReferralCode,
};

