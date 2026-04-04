# API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:5000/api/v1`  
**Swagger UI:** `http://localhost:5000/docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [File Upload](#file-upload)
4. [System Endpoints](#system-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Environment Setup](#environment-setup)

---

## Authentication

All authentication endpoints are prefixed with `/api/v1/auth`.

### 1. Register User

**POST** `/api/v1/auth/register`

Create a new user account. Sends verification email with OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "number": "+1234567890"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully. Verification email sent.",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### 2. Login

**POST** `/api/v1/auth/login`

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "twoFactorCode": "123456"
}
```

> **Note:** `twoFactorCode` is required if 2FA is enabled for the account.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "role": "USER",
    "requiresTwoFactor": false
  }
}
```

**Cookies Set:**
- `refreshToken` (HTTP-only, 7 days)

**Rate Limit:** 5 requests per 15 minutes

---

### 3. Get Current User Profile

**GET** `/api/v1/auth/me`

Retrieve the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "64b2e1b9d1234f0012ab5678",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "isVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Required Role:** ADMIN, USER

---

### 4. Logout

**POST** `/api/v1/auth/logout`

Logout user and blacklist tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Cookies Cleared:**
- `refreshToken`

**Required Role:** ADMIN, USER

---

### 5. Refresh Access Token

**POST** `/api/v1/auth/refresh-token`

Get new access token using refresh token.

**Request Body (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

> **Note:** Refresh token is typically sent via HTTP-only cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 6. Change Password

**POST** `/api/v1/auth/change-password`

Change the authenticated user's password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Required Role:** ADMIN, USER

---

### 7. Forgot Password

**POST** `/api/v1/auth/forgot-password`

Request password reset OTP via email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": null
}
```

> **Security Note:** Always returns success to prevent email enumeration.

**Rate Limit:** 3 requests per hour

---

### 8. Reset Password

**POST** `/api/v1/auth/reset-password`

Reset password using OTP from email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "verificationCode": "123456",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

**Rate Limit:** 3 requests per hour

---

### 9. Verify Email

**POST** `/api/v1/auth/verify-email`

Verify account email using OTP.

**Request Body:**
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": null
}
```

---

### 10. Resend Verification Email

**POST** `/api/v1/auth/resend-verification`

Request a new verification code.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": null
}
```

---

### 11. Use Backup Code (2FA)

**POST** `/api/v1/auth/use-backup-code`

Login with 2FA backup code when authenticator is unavailable.

**Request Body:**
```json
{
  "email": "user@example.com",
  "backupCode": "aB3dE7gH"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful with backup code",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "role": "USER"
  }
}
```

---

### 12. Setup 2FA

**POST** `/api/v1/auth/2fa/setup`

Initiate 2FA setup. Returns QR code URL and backup codes.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA setup initiated. Please verify the code to enable.",
  "data": {
    "secret": "TOTP_SECRET_KEY",
    "qrCodeUrl": "otpauth://totp/...",
    "backupCodes": ["aB3dE7gH", "xY9kLm2P", "qR5tUv8W"]
  }
}
```

> **Important:** Save backup codes immediately. They are shown only once.

**Required Role:** ADMIN, USER

---

### 13. Enable 2FA

**POST** `/api/v1/auth/2fa/enable`

Enable 2FA after setup by verifying TOTP code.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "twoFactorCode": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": null
}
```

**Required Role:** ADMIN, USER

---

### 14. Disable 2FA

**POST** `/api/v1/auth/2fa/disable`

Disable 2FA by providing current TOTP code.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "twoFactorCode": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA disabled successfully",
  "data": null
}
```

**Required Role:** ADMIN, USER

---

## User Management

All user management endpoints are prefixed with `/api/v1/user`.

### 1. Update Profile

**PATCH** `/api/v1/user/update-profile`

Updates the authenticated user's profile information. To update the profile image, first upload the image via the Upload module (`POST /api/v1/upload/file`), then pass the returned URL as `profileImageUrl` in this endpoint.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (JSON):**
```json
{
  "name": "John Doe",
  "profileImageUrl": "https://your-bucket.s3.your-region.amazonaws.com/uploads/profile_abc123.jpg"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile update successful.",
  "data": {
    "_id": "64b2e1b9d1234f0012ab5678",
    "name": "John Doe",
    "profileImageUrl": "https://your-bucket.s3.your-region.amazonaws.com/uploads/profile_abc123.jpg",
    "role": "USER",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Required Role:** ADMIN, USER

---

### 2. Get All Users

**GET** `/api/v1/user`

Retrieve all users with pagination and filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (search by name/email)
- `role` (filter by role: ADMIN or USER)
- `status` (filter by account status)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "64b2e1b9d1234f0012ab5678",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER",
      "accountStatus": "ACTIVE",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Required Role:** ADMIN only

---

### 3. Get Single User

**GET** `/api/v1/user/:id`

Retrieve a specific user by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: User ObjectId

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "id": "64b2e1b9d1234f0012ab5678",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "accountStatus": "ACTIVE",
    "isVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Required Role:** ADMIN only

---

### 4. Suspend User

**PATCH** `/api/v1/user/suspend/:id`

Suspend a user account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
- `id`: User ObjectId

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "id": "64b2e1b9d1234f0012ab5678",
    "email": "user@example.com",
    "accountStatus": "SUSPENDED"
  }
}
```

**Required Role:** ADMIN only

---

## File Upload

The upload module is the **central file upload service** for the entire application. All file uploads must go through these endpoints. Other modules (like User Profile) only store the URL returned by the upload module — they do NOT handle file uploads directly.

### Architecture

```
Frontend → POST /api/v1/upload/file → Upload Module → S3 → Returns URL
Frontend → PATCH /api/v1/user/update-profile (with profileImageUrl=URL) → User Module → Saves URL
```

### Supported File Types
- Images: `jpg`, `jpeg`, `png`, `webp`
- Documents: `pdf`, `csv`
- Max file size: **20MB**

### 1. Upload Single File

**POST** `/api/v1/upload/file`

Upload a single file to S3 storage.

**Request Body (multipart/form-data):**
```
Form Data:
  - file: File (required)
```

**Response (200 OK):**
```json
{
  "success": true,
  "url": "https://your-bucket.s3.your-region.amazonaws.com/uploads/abc123-def456.jpg"
}
```

**Error Responses:**
- `400 Bad Request` — No file provided or invalid file type
- `500 Internal Server Error` — Upload failed

---

### 2. Upload Multiple Files

**POST** `/api/v1/upload/files`

Upload multiple files (up to 10) to S3 storage.

**Request Body (multipart/form-data):**
```
Form Data:
  - files: File[] (required, max 10 files)
```

**Response (200 OK):**
```json
{
  "success": true,
  "urls": [
    "https://your-bucket.s3.your-region.amazonaws.com/uploads/file_1.jpg",
    "https://your-bucket.s3.your-region.amazonaws.com/uploads/file_2.jpg"
  ]
}
```

**Error Responses:**
- `400 Bad Request` — No files provided or invalid file type
- `500 Internal Server Error` — Upload failed

---

## System Endpoints

### 1. Server Status

**GET** `/`

Check server status.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 2. Health Check

**GET** `/health`

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 3. Swagger Documentation

**GET** `/docs`

Access interactive Swagger UI documentation.

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Authentication Errors

| Error | Status | Description |
|-------|--------|-------------|
| `Authorization header missing or malformed` | 401 | No Bearer token provided |
| `Invalid or expired token` | 401 | Token verification failed |
| `You are not authorized to access this resource` | 401 | Insufficient role permissions |
| `Account not found` | 404 | User account doesn't exist |
| `This account is suspended` | 401 | Account is suspended |
| `This account is inactive` | 401 | Account is inactive |
| `This account is deleted` | 401 | Account is deleted |
| `This account is not verified` | 401 | Email not verified |

---

## Rate Limiting

### Global Rate Limit
- **100 requests per 15 minutes** per IP address

### Authentication Endpoints
- **5 requests per 15 minutes** (login, register)

### Password Reset Endpoints
- **3 requests per hour** (forgot-password, reset-password)

### Rate Limit Response (429 Too Many Requests)
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server
PORT=5000
NODE_ENV=development
BACKEND_IP=localhost

# Database
DB_URL=mongodb://localhost:27017/your_db_name

# JWT Secrets (minimum 32 characters)
ACCESS_TOKEN=your_access_token_secret_min_32_chars
REFRESH_TOKEN=your_refresh_token_secret_min_32_chars
ACCESS_EXPIRES=15m
REFRESH_EXPIRES=7d

# Password Reset
RESET_SECRET=your_reset_secret_min_32_chars
RESET_EXPIRES=1h

# Email Verification
VERIFIED_TOKEN=your_verified_secret_min_32_chars

# Frontend URL
FRONT_END_URL=http://localhost:3000

# Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Email (for sending verification/password reset)
APP_USER_EMAIL=your_email@gmail.com
APP_PASSWORD=your_app_password

# Cloud Storage (optional - for file uploads)
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret

# AWS S3 (optional - alternative to Cloudinary)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name

# Seed Admin Account (optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPass123!
```

### Setup Commands

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values

# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
```

---

## Authentication Flow

### 1. Registration Flow

```
1. POST /api/v1/auth/register
   → Sends verification email

2. POST /api/v1/auth/verify-email
   → Verifies account with OTP

3. POST /api/v1/auth/login
   → Receive access & refresh tokens
```

### 2. Login Flow

```
1. POST /api/v1/auth/login
   → Receive tokens (requires 2FA code if enabled)

2. Use access token in Authorization header
   Authorization: Bearer <token>

3. When token expires, use refresh token
   POST /api/v1/auth/refresh-token
```

### 3. 2FA Setup Flow

```
1. POST /api/v1/auth/2fa/setup
   → Receive QR code URL and backup codes

2. Scan QR code with authenticator app

3. POST /api/v1/auth/2fa/enable
   → Verify first TOTP code to enable

4. Save backup codes securely
```

---

## Frontend Integration Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // For refresh token cookie
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post(
          '/api/v1/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.data.accessToken);
        return api(error.config);
      } catch (err) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Usage examples
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

export const userAPI = {
  updateProfile: (data: FormData) => 
    api.patch('/user/update-profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAllUsers: (params?: any) => api.get('/user', { params }),
};
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { authAPI } from './api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getProfile()
      .then(({ data }) => setUser(data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials: any) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data);
  };

  const logout = async () => {
    await authAPI.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

---

## Support

- **Swagger UI:** `http://localhost:5000/docs`
- **GitHub Repository:** [modular-backend-boilerplate](https://github.com/reazulislamreaz/modular-backend-boilerplate)
- **Issues:** [GitHub Issues](https://github.com/reazulislamreaz/modular-backend-boilerplate/issues)
