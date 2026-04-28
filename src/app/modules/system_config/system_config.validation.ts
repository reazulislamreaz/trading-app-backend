import { z } from "zod";

const update_referral_reward = z.object({
  amount: z.number().min(0, "Amount must be at least 0"),
});

export const system_config_validations = {
  update_referral_reward,
};
