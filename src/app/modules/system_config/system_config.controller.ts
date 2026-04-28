import { Request, Response } from "express";
import catch_async from "../../utils/catch_async";
import { system_config_services } from "./system_config.service";
import httpStatus from "http-status";

const get_config = catch_async(async (req: Request, res: Response) => {
  const result = await system_config_services.get_config();

  res.status(httpStatus.OK).json({
    success: true,
    message: "System configuration fetched successfully",
    data: result,
  });
});

const update_referral_reward = catch_async(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const adminId = (req.user as any)?.userId;

  const result = await system_config_services.update_referral_reward(amount, adminId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Referral reward amount updated successfully",
    data: result,
  });
});

export const system_config_controllers = {
  get_config,
  update_referral_reward,
};
