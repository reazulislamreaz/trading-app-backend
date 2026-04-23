import { WalletTransaction_Model } from "./wallet_transaction.schema";

const get_my_transactions_from_db = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const result = await WalletTransaction_Model.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await WalletTransaction_Model.countDocuments({ userId });

  return {
    data: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const wallet_transaction_services = {
  get_my_transactions_from_db,
};
