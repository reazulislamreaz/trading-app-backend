import { z } from "zod";

const create_withdrawal_request = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDetails: z.string().min(1, "Payment details are required"),
});

const update_withdrawal_status = z.object({
  status: z.enum(["APPROVED", "COMPLETED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export const withdrawal_validations = {
  create_withdrawal_request,
  update_withdrawal_status,
};
