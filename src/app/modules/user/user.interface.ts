import { Types } from "mongoose";

export type TUser = {
  name?: string;
  profileImageUrl?: string;
  accountId?: Types.ObjectId;
};
