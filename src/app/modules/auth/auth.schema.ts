import { model, Schema } from "mongoose";
import { TAccount } from "./auth.interface";


const authSchema = new Schema<TAccount>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    isDeleted: { type: Boolean, default: false },
    accountStatus: { type: String, default: "ACTIVE" },
    role: { type: String, default: "USER" },
    isVerified: { type: Boolean, default: false },

    // Email verification
    verificationCode: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },

    // Password reset
    resetPasswordCode: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    // Two-factor authentication
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },

    // Security
    lastPasswordChange: { type: Date, default: Date.now },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, select: false }
}, {
    versionKey: false,
    timestamps: true
});

// Define all indexes explicitly (best practice: avoid inline index definitions)
// Unique index on email
authSchema.index({ email: 1 }, { unique: true });

// Single field indexes
authSchema.index({ accountStatus: 1 });
authSchema.index({ role: 1 });
authSchema.index({ twoFactorEnabled: 1 });

// Compound indexes for common queries
authSchema.index({ email: 1, isDeleted: 1 });
authSchema.index({ email: 1, accountStatus: 1 });
authSchema.index({ email: 1, twoFactorEnabled: 1 });

// TTL indexes for auto-cleanup of expired codes (expireAfterSeconds: 0 means expire at the exact time)
authSchema.index({ verificationCodeExpires: 1 }, { expireAfterSeconds: 0, background: true });
authSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0, background: true });

export const Account_Model = model("account", authSchema);
