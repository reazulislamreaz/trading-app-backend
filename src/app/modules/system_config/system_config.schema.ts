import { Schema, model } from "mongoose";
import { ISystemConfig } from "./system_config.interface";

const systemConfigSchema = new Schema<ISystemConfig>(
  {
    referralRewardAmount: {
      type: Number,
      required: true,
      default: 5, // Default $5.00
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const SystemConfig_Model = model<ISystemConfig>(
  "system_config",
  systemConfigSchema,
);
