import { Request } from "express";
import { User_Model } from "./user.schema";
import { Account_Model } from "../auth/auth.schema";
import { AppError } from "../../utils/app_error";
import httpStatus from "http-status";

const MAX_PAGINATION_LIMIT = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const update_profile_into_db = async (req: Request) => {
  const isExistUser = await Account_Model.findOne({
    email: req?.user?.email,
  }).lean();
  const result = await User_Model.findOneAndUpdate(
    { accountId: isExistUser!._id },
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

  // Use aggregation to avoid N+1 query problem
  const pipeline = [
    {
      $lookup: {
        from: 'accounts',
        localField: 'accountId',
        foreignField: '_id',
        as: 'account',
      },
    },
    {
      $unwind: {
        path: '$account',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ] as any[];

  const users = await User_Model.aggregate(pipeline);
  const total = await User_Model.countDocuments();

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
  const result = await User_Model.findById(id).populate("accountId");
  return result;
};

const suspend_user_from_db = async (id: string) => {
  const result = await Account_Model.findByIdAndUpdate(
    id,
    { accountStatus: "SUSPENDED" },
    { new: true },
  );

  return result;
};

export const user_services = {
  update_profile_into_db,
  get_all_users_from_db,
  get_single_user_from_db,
  suspend_user_from_db,
};
