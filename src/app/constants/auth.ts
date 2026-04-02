/**
 * Authentication error messages
 * Standardized for consistency across the application
 */
export const AUTH_ERRORS = {
  // Account errors
  ACCOUNT_EXISTS: 'An account with this email already exists',
  ACCOUNT_NOT_FOUND: 'Account not found',
  ACCOUNT_DELETED: 'This account has been deleted',
  ACCOUNT_INACTIVE: 'This account is inactive. Please contact support',
  ACCOUNT_SUSPENDED: 'This account has been suspended',
  ACCOUNT_NOT_VERIFIED: 'Please verify your account to continue',
  
  // Credential errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_OLD_PASSWORD: 'Old password is incorrect',
  PASSWORD_MISMATCH: 'New password and confirm password do not match',
  
  // Token errors
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_REQUIRED: 'Token is required',
  TOKEN_REVOKED: 'Token has been revoked',
  
  // OTP errors
  INVALID_OTP: 'Invalid or expired verification code',
  OTP_REQUIRED: 'Verification code is required',
  OTP_RESENT: 'Verification code resent to your email',
  
  // 2FA errors
  TWO_FA_REQUIRED: 'Two-factor authentication code required',
  TWO_FA_INVALID: 'Invalid two-factor authentication code',
  TWO_FA_ALREADY_ENABLED: 'Two-factor authentication is already enabled',
  TWO_FA_NOT_ENABLED: 'Two-factor authentication is not enabled',
  TWO_FA_ENABLED_SUCCESS: 'Two-factor authentication enabled successfully',
  TWO_FA_DISABLED_SUCCESS: 'Two-factor authentication disabled successfully',
  
  // Session errors
  LOGOUT_SUCCESS: 'Logged out successfully',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  
  // Success messages
  ACCOUNT_CREATED: 'Account created successfully',
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET: 'Password reset successfully',
  ACCOUNT_VERIFIED: 'Account verified successfully',
  VERIFICATION_EMAIL_SENT: 'Verification email sent successfully',
  RESET_EMAIL_SENT: 'Password reset email sent successfully',
} as const;

/**
 * Account status constants
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MASTER: 'MASTER',
  USER: 'USER',
} as const;

/**
 * Token expiration times
 */
export const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d',
  VERIFICATION: '24h',
  PASSWORD_RESET: '10m',
  OTP: '10m',
} as const;

/**
 * OTP configuration
 */
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 8,
} as const;
