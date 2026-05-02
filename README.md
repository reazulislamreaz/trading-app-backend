# Trading Signal Platform & Dashboard 🚀

![Dashboard Login](https://i.postimg.cc/CKD0QCRb/Screenshot-from-2026-05-02-10-45-34.png)

### Institutional-Grade Trading Signal & Copy-Trading Infrastructure

The **Trading Signal Platform** is a full-stack, production-ready SaaS ecosystem designed to connect professional traders with a global community of investors. Built on a modular **Express 5 + TypeScript** foundation, it provides a centralized dashboard for real-time signal distribution, automated trade journaling, and robust financial ledger management.

[Live Dashboard](http://206.162.244.11:7778/) • [API Specification](http://206.162.244.11:7777) • [Interactive Swagger](http://206.162.244.11:7778/docs)

---

## 🎯 Core Purpose

This platform solves the most critical scaling challenges for trading communities and signal providers:

*   **Trader Management**: Centralized control for onboarding and vetting Master Traders.
*   **Real-Time Distribution**: Low-latency signal delivery across the entire user base.
*   **Performance Transparency**: Automated tracking of win-rates and PnL to build institutional trust.
*   **Monetization & Ledger**: Integrated Stripe billing with a secure internal wallet for referrals and withdrawals.

---

## ✨ Features at a Glance

### 🔐 Security & Identity
*   **Enterprise Auth**: JWT rotation, TOTP-based 2FA, and account verification flows.
*   **Granular RBAC**: Strict access control for Admins, Master Traders, and Subscribers.

### 📊 Signal Engine
*   **Lifecycle Management**: Create, schedule, draft, and close signals with automated result tracking.
*   **Engagement Analytics**: Real-time tracking of Likes, Bookmarks, and Shares.

### 📈 Performance Ecosystem
*   **Master Analytics**: Detailed PnL growth charts, win-rates, and asset distribution.
*   **Leaderboards**: Composite scoring algorithms (Activity + Accuracy + Profitability).
*   **Copy Journal**: Automated user trade journaling based on followed signals.

### 💰 Fintech Suite
*   **Stripe Integration**: Automated checkout, prorated billing, and 7-day trials.
*   **Wallet & Ledger**: Secure internal balance tracking for referral bonuses and withdrawals.

---

## 🏗️ Technical Architecture

The backend follows a **Modular Monolith** pattern, ensuring each core domain (Auth, Signal, Billing) is encapsulated yet interoperable.

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Auth & 2FA     │     │  Signal Engine   │     │  Billing & Pay  │
│ (JWT + TOTP)    │     │ (Schedule/Draft) │     │ (Stripe Webhook)│
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────┬───────────┴───────────┬────────────┘
                     ▼                       ▼
            ┌─────────────────────────────────────────┐
            │         Modular API Gateway (V1)        │
            │ (Rate Limiting · Validation · Security) │
            └────────────────────┬────────────────────┘
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            ┌─────────────────┐     ┌──────────────────┐
            │  Mongoose ODM   │     │  Cloud Services  │
            │ (MongoDB 7.0)   │     │ (S3/Stripe/SMTP) │
            └─────────────────┘     └──────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js (v20+), Express.js (v5.1.0), TypeScript |
| **Frontend** | Next.js, React.js, Tailwind CSS |
| **Database** | MongoDB + Mongoose ODM |
| **Security** | JWT, OTPAuth, Bcrypt, Helmet, Rate-Limit |
| **Storage** | AWS S3 & Cloudinary |
| **DevOps** | Docker, PM2, GitHub Actions |

---

## 🚦 API at a Glance

The platform exposes a RESTful API under `/api/v1`.

### 🔑 Authentication
*   `POST /auth/register` - Create account with email verification.
*   `POST /auth/login` - Authenticate & receive tokens.
*   `POST /auth/2fa/setup` - **[Private]** Initialize TOTP setup.

### 💳 Subscriptions
*   `GET /subscription/plans` - Browse available tiers.
*   `POST /subscription/checkout` - **[Private]** Start Stripe payment flow.

### 📊 Signals & Performance
*   `GET /signals` - List all active trading signals.
*   `POST /signals` - **[Master]** Publish new trading insights.
*   `GET /leaderboard` - View top performers by composite score.

> **Full Specification**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed schemas and role-based permissions.

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js v20+ & MongoDB
*   Stripe API Keys (for billing)
*   AWS S3 or Cloudinary (for media)

### Installation
1.  **Clone & Install**
    ```bash
    git clone <your-repo-url>
    cd trading-app-backend
    npm install
    ```
2.  **Environment Setup**
    ```bash
    cp .env.example .env # Update with your keys
    ```
3.  **Bootstrap & Run**
    ```bash
    npm run seed # Seeds admin, plans, and demo data
    npm run dev  # Starts HMR development server
    ```

---

**Developed with ❤️ by [Reazul Islam Reaz](https://github.com/reazulislamreaz)**
