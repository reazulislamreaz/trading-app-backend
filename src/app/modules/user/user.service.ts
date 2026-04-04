import { Request } from "express";
import { Account_Model } from "../auth/auth.schema";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";

const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const update_profile_into_db = async (req: Request) => {
  const email = req?.user?.email;
  
  if (!email) {
    throw new AppError("User email not found", httpStatus.UNAUTHORIZED);
  }

  const result = await Account_Model.findOneAndUpdate(
    { email },
    req?.body,
    {
      new: true,
    },
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
    .select('-password');
    
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
  const result = await Account_Model.findById(id).select('-password');
  return result;
};

const suspend_user_from_db = async (id: string) => {
  const result = await Account_Model.findByIdAndUpdate(
    id,
    { accountStatus: "SUSPENDED" },
    { new: true },
  ).select('-password');

  return result;
};

export const user_services = {
  update_profile_into_db,
  get_all_users_from_db,
  get_single_user_from_db,
  suspend_user_from_db,
};
