import { Document } from "mongoose";

export interface ISystemConfig extends Document {
  referralRewardAmount: number; // in dollars
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
