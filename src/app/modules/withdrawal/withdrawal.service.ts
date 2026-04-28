import { Withdrawal_Model } from "./withdrawal.schema";
import { Account_Model } from "../auth/auth.schema";
import { WalletTransaction_Model } from "../wallet_transaction/wallet_transaction.schema";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { TWithdrawalRequest, TWithdrawalStatus } from "./withdrawal.interface";

const create_withdrawal_request_in_db = async (userId: string, payload: Partial<TWithdrawalRequest>) => {
  const account = await Account_Model.findById(userId);
  if (!account) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  const { amount } = payload;
  if (!amount || amount <= 0) {
    throw new AppError("Invalid withdrawal amount", httpStatus.BAD_REQUEST);
  }

  if (account.walletBalance < amount) {
    throw new AppError("Insufficient wallet balance", httpStatus.BAD_REQUEST);
  }

  // Check for existing pending request
  const existingPendingRequest = await Withdrawal_Model.findOne({
    userId,
    status: "PENDING",
  });

  if (existingPendingRequest) {
    throw new AppError(
      "You already have a pending withdrawal request. Please wait until it is processed.",
      httpStatus.BAD_REQUEST
    );
  }

  // Minimum withdrawal threshold (e.g., $10 or $1)
  const MIN_WITHDRAWAL = 1; // $1.00
  if (amount < MIN_WITHDRAWAL) {
    throw new AppError(`Minimum withdrawal amount is $${MIN_WITHDRAWAL}`, httpStatus.BAD_REQUEST);
  }

  const result = await Withdrawal_Model.create({
    userId,
    ...payload,
    status: "PENDING",
  });

  return result;
};

const get_my_withdrawals_from_db = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await Withdrawal_Model.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdrawal_Model.countDocuments({ userId });

  return {
    data: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const get_all_withdrawals_from_db = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (query.status) {
    filters.status = query.status;
  }

  const result = await Withdrawal_Model.find(filters)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdrawal_Model.countDocuments(filters);

  return {
    data: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const update_withdrawal_status_in_db = async (id: string, payload: { status: TWithdrawalStatus; adminNote?: string }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawalRequest = await Withdrawal_Model.findById(id).session(session);
    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpStatus.NOT_FOUND);
    }

    if (withdrawalRequest.status === "COMPLETED" || withdrawalRequest.status === "REJECTED") {
      throw new AppError(`Request already ${withdrawalRequest.status.toLowerCase()}`, httpStatus.BAD_REQUEST);
    }

    // Logic: 
    // If status is being changed to APPROVED, we deduct the balance.
    // If it was already APPROVED and changing to COMPLETED, we just update status.
    // If it's being REJECTED, and it was APPROVED, we should refund? 
    // Usually, it's better to deduct on REQUEST or APPROVAL.
    
    // According to instructions: 
    // On approval -> deduct the amount from wallet
    
    if (payload.status === "APPROVED" && withdrawalRequest.status === "PENDING") {
      const account = await Account_Model.findById(withdrawalRequest.userId).session(session);
      if (!account) {
        throw new AppError("Account not found", httpStatus.NOT_FOUND);
      }

      if (account.walletBalance < withdrawalRequest.amount) {
        throw new AppError("Insufficient balance to approve this request", httpStatus.BAD_REQUEST);
      }

      // Deduct balance
      await Account_Model.findByIdAndUpdate(
        withdrawalRequest.userId,
        { $inc: { walletBalance: -withdrawalRequest.amount } },
        { session }
      );

      // Create wallet transaction
      await WalletTransaction_Model.create([{
        userId: withdrawalRequest.userId,
        amount: withdrawalRequest.amount,
        type: "WITHDRAWAL",
        status: "COMPLETED",
        referenceId: withdrawalRequest._id,
        description: "Wallet withdrawal",
      }], { session });
    }

    // If status is being changed to REJECTED from APPROVED (rare but possible), we should refund.
    // But let's keep it simple as per instructions.
    
    const result = await Withdrawal_Model.findByIdAndUpdate(
      id,
      { status: payload.status, adminNote: payload.adminNote },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const withdrawal_services = {
  create_withdrawal_request_in_db,
  get_my_withdrawals_from_db,
  get_all_withdrawals_from_db,
  update_withdrawal_status_in_db,
};
