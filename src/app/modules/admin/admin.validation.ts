import { z } from 'zod';

const update_subscription_plan = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  durationInDays: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const admin_validations = {
  update_subscription_plan,
};
