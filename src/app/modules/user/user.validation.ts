import { z } from "zod";

const update_user = z.object({
    name: z.string().optional(),
    profileImageUrl: z.string().url("Must be a valid URL").optional(),
})

export const user_validations = {
    update_user
}