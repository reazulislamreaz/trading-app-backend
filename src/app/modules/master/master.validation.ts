import { z } from 'zod';

const masterProfileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(2000).optional(),
  specialties: z.array(z.string()).max(10).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
});

const approveMasterSchema = z.object({
  isApproved: z.boolean(),
});

export const master_validations = {
  masterProfileSchema,
  approveMasterSchema,
};
