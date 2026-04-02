import { Types } from "mongoose";

export type TUser = {
  name?: string;
  photo?: string;
  accountId?: Types.ObjectId;
};
