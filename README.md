# Trading Signal Dashboard - Enterprise SaaS Platform 🚀

![Dashboard Login](https://i.postimg.cc/CKD0QCRb/Screenshot-from-2026-05-02-10-45-34.png)

### The Ultimate Infrastructure for Trading Communities & Signal Providers

**Trading Signal Dashboard** is a sophisticated, full-stack SaaS ecosystem engineered to bridge the gap between professional trading experts and retail investors. Built with an institutional-grade **Express 5 + TypeScript** backend and a high-performance **Next.js** frontend, the platform provides a centralized hub for real-time signal distribution, automated performance tracking, and complex subscription management.

---

## 🔗 Live Ecosystem

*   **Platform Dashboard**: [http://206.162.244.11:7778/](http://206.162.244.11:7778/)
*   **Production API**: [http://206.162.244.11:7777](http://206.162.244.11:7777)
*   **Interactive API Docs**: [http://206.162.244.11:7778/docs](http://206.162.244.11:7778/docs)

---

## 💡 The Problem & Our Solution

**The Problem**: Signal providers often struggle with manual distribution via Telegram/Discord, lacks transparent performance metrics, and face administrative nightmares managing subscriptions and referrals.

**Our Solution**: An all-in-one automated platform that provides:
1.  **Transparency**: Verified win-rates and PnL metrics for all Master Traders.
2.  **Automation**: Webhook-driven Stripe billing and scheduled signal publishing.
3.  **Engagement**: Gamified contribution points and global leaderboards.
4.  **Financial Integrity**: Secure wallet system for referrals and payouts.

---

## 🛠️ Complete Feature Breakdown

### 🔐 1. Authentication & Security (Enterprise-Grade)
*   **JWT Ecosystem**: Dual-token system (Access/Refresh) with rotation for maximum security.
*   **Two-Factor Authentication (2FA)**: TOTP integration (Google Authenticator) with encrypted backup codes.
*   **Account Verification**: Async email verification flow with high-speed registration.
*   **Rate Limiting**: Adaptive throttling to prevent brute-force and DDoS attacks.

### 💳 2. Subscription & Billing (Stripe Native)
*   **Tiered Access**: Free, Basic, Pro, and Master plans with enforced signal limits.
*   **Automated Lifecycle**: Prorated upgrades, trial management (7 days), and auto-downgrades via Stripe Webhooks.
*   **Billing Portal**: Self-service management for payment methods and invoice history.

### 📊 3. Signal Engine (Real-Time Intelligence)
*   **Precision Entry**: Detailed signal parameters (Stop Loss, TP1, TP2, TP3, Entry Range).
*   **Scheduled Publishing**: Draft signals and schedule them for future release.
*   **Engagement Tracking**: Track Likes, Shares, and Bookmarks to measure signal sentiment.
*   **Asset Support**: Native support for Forex, Crypto, Stocks, Indices, and Commodities.

### 🏆 4. Performance & Gamification
*   **Composite Leaderboard**: Advanced scoring based on Win-Rate (40%), PnL (30%), Followers (20%), and Activity (10%).
*   **Contribution Points**: Multi-action reward system (View: 1pt, Like: 2pts, Win: 15pts).
*   **Trade Journal**: Automated logging for users who "copy" signals, including result reporting and screenshots.

### 💰 5. Financial Suite (Wallet & Referral)
*   **Referral System**: Configurable referral rewards ($10 default) managed via system configuration.
*   **Withdrawal Workflow**: Secure request system for Master Traders and Referrers to cash out earnings.
*   **Transaction Ledger**: Full audit trail of every credit/debit within the platform.

### 🛡️ 6. Admin & System Control
*   **Master Vetting**: Admin review workflow to approve/reject Master Trader applications.
*   **Featured Content**: Toggle "Featured" status for top signals or traders to drive visibility.
*   **System Config**: Live updates for referral amounts and platform-wide settings.
*   **Broadcast System**: Send global notifications to all users simultaneously.

---

## 👥 User Roles & Permissions

| Role | Permissions | Core Workflow |
| :--- | :--- | :--- |
| **Admin** | Full System Access | Reviewing masters, managing revenue, system-wide settings. |
| **Master Trader** | Create/Manage Signals | Publishing trade ideas, analyzing performance, requesting payouts. |
| **User** | Browse/Follow Signals | Subscribing to plans, following masters, journaling trades. |

---

## 🏗️ System Architecture

The project utilizes a strict **Controller-Service-Model** pattern to ensure maintainability and testability.

1.  **Route Layer**: Handles URI mapping and standardizes middleware entry.
2.  **Controller Layer**: Manages HTTP request/response and maps DTOs.
3.  **Service Layer**: **The Brain**. Contains 100% of the business logic, transaction management, and third-party integrations.
4.  **Model Layer**: Mongoose-based data schemas with optimized indexing.

---

## 💻 Tech Stack

*   **Backend**: Node.js, Express.js (v5.1), TypeScript, MongoDB/Mongoose.
*   **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI.
*   **Integrations**: Stripe (Payments), AWS S3 (Media), Cloudinary (Images), Nodemailer (Emails).
*   **Security**: JWT, Bcrypt, OTPAuth, Helmet.

---

## 🚦 API Overview (V1)

### Core Endpoints
*   `POST /auth/login` - Authenticate & receive JWT tokens.
*   `POST /subscription/checkout` - Initialize Stripe payment flow.
*   `GET /signals` - Retrieve signals based on subscription tier.
*   `POST /withdrawals` - Submit payout requests.
*   `GET /leaderboard` - Fetch ranked trader performance.

> **Full Documentation**: [Explore the API Specification Reference](./API_DOCUMENTATION.md)

---

## ⚙️ Setup & Installation

```bash
# 1. Clone & Install
git clone https://github.com/reazulislamreaz/trading-app-backend.git
cd trading-app-backend
npm install

# 2. Configure Environment
cp .env.example .env # Add your DB_URL, STRIPE_SECRET, AWS_KEYS, etc.

# 3. Bootstrap System
npm run seed # Synchronizes Stripe plans & creates Admin user

# 4. Launch
npm run dev # HMR Development Server
```

---

## 📂 Folder Structure
```text
src/
├── app/
│   ├── configs/      # Global configurations (DB, Stripe, AWS)
│   ├── middlewares/  # Auth, SubscriptionGuard, RateLimiter
│   ├── modules/      # Domain-driven features (Signal, Auth, Wallet)
│   ├── types/        # Global TS interfaces & Enums
│   └── utils/        # JWT, Email, 2FA, Seeding logic
├── server.ts         # Application Entry Point
└── routes.ts         # Root Router Gateway
```

---

## 🧠 Engineering Decisions & Challenges

*   **Challenge**: Ensuring signal privacy without leaking targets in the API.
    *   **Decision**: Implemented a "Signal Guard" in the controller level that masks `entryPrice` and `targets` based on the user's active subscription tier.
*   **Challenge**: Stripe/Database desynchronization.
    *   **Decision**: Developed an idempotent Webhook handler that utilizes an in-memory event cache to prevent duplicate processing of Stripe events.
*   **Challenge**: Scalable Leaderboard calculation.
    *   **Decision**: Utilized MongoDB Aggregation Pipelines to calculate composite scores on-the-fly, ensuring the leaderboard remains real-time without heavy database load.

---

## 🚀 Future Improvements
- [ ] **Real-time Engine**: Integrate WebSockets/Socket.io for sub-second signal alerts.
- [ ] **Exchange Bridge**: Automated trade execution via Binance/MetaTrader APIs.
- [ ] **AI Vetting**: Machine-learning layer to flag high-risk or manipulative signals.
- [ ] **Mobile Client**: Dedicated Flutter/React Native application for push notifications.

---

## 📈 Conclusion
The **Trading Signal Dashboard** is more than just a signal bot; it is a comprehensive financial ecosystem. By combining strict security protocols with automated billing and verified performance metrics, it offers the most reliable infrastructure for modern trading communities.

---
**Developed with ❤️ by [Reazul Islam Reaz](https://github.com/reazulislamreaz)**
