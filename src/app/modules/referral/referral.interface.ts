import { Types } from "mongoose";

export type TReferral = {
  referrerId: Types.ObjectId;
  inviteeId: Types.ObjectId;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  rewardAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
};
