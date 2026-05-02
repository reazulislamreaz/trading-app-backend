# API Specification Reference 📚

**Base URL**: `http://206.162.244.11:7777/api/v1`  
**Swagger Docs**: [http://206.162.244.11:7778/docs](http://206.162.244.11:7778/docs)

This document provides a detailed technical reference for the Trading Signal Platform API. All requests must be made over HTTPS in production.

---

## 🔐 Global Security & Authentication

### Authorization Header
Most endpoints require a valid JSON Web Token (JWT).
```http
Authorization: Bearer <access_token>
```

### Access Tiers (Roles)
- **PUBLIC**: No authentication required.
- **USER**: Standard authenticated user.
- **MASTER**: Verified trader with signal publishing rights.
- **ADMIN**: Platform administrator with full oversight.

---

## 1. Authentication (Auth) 🔑

### Register Account
`POST /auth/register` | **Role**: PUBLIC
- **Description**: Creates a new account. An OTP verification email is sent asynchronously.
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "referralCode": "OPTIONAL_CODE"
  }
  ```

### Login
`POST /auth/login` | **Role**: PUBLIC
- **Description**: Returns `accessToken` and `refreshToken` cookie. Supports TOTP-based 2FA.
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!",
    "twoFactorCode": "123456" // Required only if 2FA is enabled
  }
  ```

### Setup 2FA
`POST /auth/2fa/setup` | **Role**: USER/MASTER/ADMIN
- **Description**: Initiates TOTP setup. Returns QR code URL and backup codes.
- **Body**: `{ "password": "CurrentPassword" }`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "qrCodeUrl": "otpauth://totp/TradingApp...",
      "backupCodes": ["A1B2-C3D4", "..."]
    }
  }
  ```

---

## 2. Subscriptions & Billing (Stripe) 💳

### Create Checkout Session
`POST /subscription/checkout` | **Role**: USER/MASTER/ADMIN
- **Description**: Generates a Stripe Checkout URL for the chosen plan. Includes 7-day trial for new users.
- **Body**:
  ```json
  {
    "planId": "pro_monthly",
    "returnUrl": "https://frontend.com/billing"
  }
  ```

### Current Status
`GET /subscription/current` | **Role**: USER/MASTER/ADMIN
- **Description**: Retrieves current plan details, expiry date, and remaining signal limits.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "tier": "pro",
      "hasAccess": true,
      "daysRemaining": 25,
      "usage": { "used": 10, "limit": -1 }
    }
  }
  ```

---

## 3. Trading Signals 📈

### List Signals
`GET /signals` | **Role**: PUBLIC (Gated)
- **Query Params**: `page`, `limit`, `assetType`, `status`, `authorId`, `search`.
- **Note**: Public users see limited data; subscribers see full entry/exit targets.

### Create Signal
`POST /signals` | **Role**: MASTER
- **Body**:
  ```json
  {
    "title": "EUR/USD Bullish Breakout",
    "symbol": "EURUSD",
    "assetType": "forex",
    "signalType": "long",
    "entryPrice": 1.0850,
    "stopLoss": 1.0820,
    "takeProfit1": 1.0900,
    "publishType": "scheduled",
    "scheduledAt": "2026-05-10T10:00:00Z"
  }
  ```

---

## 4. Master Traders 🏆

### List Master Traders
`GET /masters` | **Role**: PUBLIC
- **Query Params**: `isFeatured`, `search`.
- **Response**: Array of master profiles with win-rates and follower counts.

### Master Analytics
`GET /masters/analytics` | **Role**: MASTER
- **Description**: Detailed performance metrics including PnL growth charts and asset distribution.

---

## 5. Financials & Wallet 💰

### Request Withdrawal
`POST /withdrawals` | **Role**: MASTER
- **Description**: Submit a request to withdraw earned funds.
- **Body**: `{ "amount": 500, "method": "USDT", "address": "0x..." }`

### Transaction History
`GET /transactions` | **Role**: USER/MASTER/ADMIN
- **Description**: List all wallet movements (referrals, bonuses, withdrawals).

---

## 🛠 Admin Controls 🛡️

### Platform Analytics
`GET /admin/analytics` | **Role**: ADMIN
- **Data**: Total Revenue, Active Subs, User Growth, Signal Accuracy.

### Approve Master
`POST /admin/masters/approve/:id` | **Role**: ADMIN
- **Description**: Elevate a USER to MASTER role after vetting.

---

## 📋 Standardized Response Schemas

### Success Template
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": { "total": 100, "page": 1, "limit": 10 }
}
```

### Error Template
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Failed",
  "errorMessages": [
    { "path": "email", "message": "Email already exists" }
  ]
}
```

---
*For interactive testing and real-time schema discovery, visit our [Swagger UI](http://206.162.244.11:7778/docs).*
