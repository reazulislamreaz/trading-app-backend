import { model, Schema } from "mongoose";
import { TUser } from "./user.interface";

const user_schema = new Schema<TUser>(
  {
    name: { type: String, required: false },
    photo: { type: String, required: false },
    accountId: { type: String, required: false, ref: "account" },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// Define indexes explicitly
user_schema.index({ accountId: 1 });

export const User_Model = model("user", user_schema);
