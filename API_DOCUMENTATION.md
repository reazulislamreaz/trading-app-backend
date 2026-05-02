# API Documentation 📚

**Base URL**: `http://206.162.244.11:7777/api/v1`  
**Swagger Docs**: [http://206.162.244.11:7778/docs](http://206.162.244.11:7778/docs)

---

## 🔐 Authentication & Security

All private endpoints require a Bearer Token in the `Authorization` header:  
`Authorization: Bearer <your_access_token>`

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and receive tokens (2FA supported) | Public |
| POST | `/auth/logout` | Logout and blacklist tokens | Private |
| POST | `/auth/refresh-token` | Get new access token using refresh cookie | Public |
| GET | `/auth/me` | Get current user profile | Private |
| POST | `/auth/verify-email` | Verify account with OTP | Public |
| POST | `/auth/forgot-password` | Request password reset OTP | Public |
| POST | `/auth/reset-password` | Reset password using OTP | Public |

### Two-Factor Authentication (2FA)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/2fa/setup` | Initiate 2FA setup (returns QR code) | Private |
| POST | `/auth/2fa/enable` | Enable 2FA after verification | Private |
| POST | `/auth/2fa/disable` | Disable 2FA with current code | Private |

---

## 💳 Subscriptions & Payments

### Plans & Checkout

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/subscription/plans` | List all available subscription plans | Public |
| POST | `/subscription/checkout` | Create Stripe checkout session | Private |
| GET | `/subscription/current` | Get current subscription details | Private |
| POST | `/subscription/status` | Cancel or Resume subscription | Private |
| POST | `/subscription/change-plan` | Upgrade or Downgrade plan | Private |
| POST | `/subscription/billing-portal` | Get Stripe billing portal URL | Private |

---

## 📊 Trading Signals

### Public & Private Signals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/signals` | List all signals (paginated, filters available) | Public |
| GET | `/signals/:id` | Get single signal details | Public |
| POST | `/signals` | Create a new signal (Master only) | Private |
| PATCH | `/signals/:id` | Update or Close a signal | Private |
| DELETE | `/signals/:id` | Cancel/Delete a signal | Private |
| POST | `/signals/:id/like` | Like a signal | Private |
| POST | `/signals/:id/share` | Track signal share | Private |

---

## 🏆 Master Traders

### Profiles & Stats

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/masters` | List all Master Traders | Public |
| GET | `/masters/:id` | Get Master profile by ID | Public |
| PATCH | `/masters/profile` | Create/Update your Master profile | Private |
| GET | `/masters/stats` | Get your performance stats | Private |
| GET | `/masters/analytics` | Get detailed performance analytics | Private |

---

## 💰 Financials & Wallet

### Transactions & Withdrawals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/transactions` | Get wallet transaction history | Private |
| GET | `/referrals` | Get referral stats and history | Private |
| POST | `/withdrawals` | Request a withdrawal | Private |
| GET | `/withdrawals` | Get withdrawal request history | Private |

---

## 👤 User & Profile

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PATCH | `/user/profile` | Update personal profile info | Private |
| POST | `/upload/image` | Upload image to Cloudinary/S3 | Private |
| GET | `/notifications` | Get user notifications | Private |

---

## 🛠 Admin Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/admin/users` | List all users | Admin |
| PATCH | `/admin/users/:id/status` | Change user status (Active/Blocked) | Admin |
| PATCH | `/admin/settings` | Update system configuration | Admin |
| GET | `/admin/audit-logs` | View system audit logs | Admin |

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "statusCode": 200,
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 100 } // Optional pagination
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorMessages": [
    { "path": "email", "message": "Invalid email format" }
  ],
  "stack": "..." // Only in development mode
}
```

---

## 🚦 Common Status Codes
- `200 OK`: Request successful.
- `201 Created`: Resource created successfully.
- `400 Bad Request`: Validation error or invalid input.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions (role mismatch).
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Something went wrong on the server.

---
*For detailed request bodies and field descriptions, please refer to the [Swagger Documentation](http://206.162.244.11:7778/docs).*
