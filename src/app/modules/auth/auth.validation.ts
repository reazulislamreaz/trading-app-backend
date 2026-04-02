import { z } from "zod";

// Simplified registration validation schema
const register_validation = z.object({
    name: z.string({ message: "Name is required" }).min(2, "Name must be at least 2 characters"),
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    password: z.string({ message: "Password is required" }).min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({ message: "Confirm password is required" }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const login_validation = z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    password: z.string({ message: "Password is required" }),
    twoFactorCode: z.string().regex(/^\d{6}$/, "Two-factor code must be 6 digits").optional(),
});

const changePassword = z.object({
    oldPassword: z.string({ message: "Old password is required" }),
    newPassword: z.string({ message: "New password is required" }).min(6, "Password must be at least 6 characters"),
});

const forgotPassword = z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
});

const resetPassword = z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    verificationCode: z.string({ message: "Verification code is required" }).regex(/^\d{6}$/, "Verification code must be 6 digits"),
    newPassword: z.string({ message: "New password is required" }).min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({ message: "Confirm password is required" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const verifyEmail = z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email format"),
    verificationCode: z.string({ message: "Verification code is required" }).regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

const verifyTwoFactor = z.object({
    twoFactorCode: z.string({ message: "Two-factor code is required" }).regex(/^\d{6}$/, "Two-factor code must be 6 digits"),
});

const enableTwoFactor = z.object({
    password: z.string({ message: "Password is required" }),
});

const disableTwoFactor = z.object({
    twoFactorCode: z.string({ message: "Two-factor code is required" }).regex(/^\d{6}$/, "Two-factor code must be 6 digits"),
});

const useBackupCode = z.object({
    backupCode: z.string({ message: "Backup code is required" }).min(1, "Backup code is required"),
});

export const authValidations = {
    register_validation,
    login_validation,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    verifyTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    useBackupCode,
};
