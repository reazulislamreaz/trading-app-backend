import { z } from 'zod';

const masterProfileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(2000).optional(),
  specialties: z.array(z.string()).max(10).optional(),
  yearsOfExperience: z.coerce.number().min(0).max(50).optional(),
});

export const master_validations = {
  masterProfileSchema,
};
