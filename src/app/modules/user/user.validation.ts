import { z } from "zod";

const update_user = z.object({
    name: z.string().optional(),
    userProfileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    referralCode: z.string()
        .min(3, "Referral code must be at least 3 characters")
        .max(20, "Referral code cannot exceed 20 characters")
        .regex(/^[A-Z0-9_]+$/, "Referral code can only contain uppercase letters, numbers, and underscores")
        .optional(),
})

export const user_validations = {
    update_user
}
