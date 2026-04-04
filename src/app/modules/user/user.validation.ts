import { z } from "zod";

const update_user = z.object({
    name: z.string().optional(),
    userProfileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

export const user_validations = {
    update_user
}
