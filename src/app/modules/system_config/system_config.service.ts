import { SystemConfig_Model } from "./system_config.schema";

const get_config = async () => {
  let config = await SystemConfig_Model.findOne();
  if (!config) {
    config = await SystemConfig_Model.create({
      referralRewardAmount: 5, // Default $5
    });
  }
  return config;
};

const update_referral_reward = async (amount: number, adminId: string) => {
  let config = await SystemConfig_Model.findOne();
  if (!config) {
    config = await SystemConfig_Model.create({
      referralRewardAmount: amount,
      updatedBy: adminId,
    });
  } else {
    config.referralRewardAmount = amount;
    config.updatedBy = adminId;
    await config.save();
  }
  return config;
};

export const system_config_services = {
  get_config,
  update_referral_reward,
};
