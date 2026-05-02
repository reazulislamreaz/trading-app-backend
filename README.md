# Trading App Backend 🚀

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-5.1.0-blue.svg)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7.2-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A production-ready, high-performance trading signal and copy-trading platform backend. Built with a modular architecture using **Express 5**, **TypeScript**, and **MongoDB**, this system is designed for scalability, security, and seamless integration with financial services like **Stripe**.

---

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Scripts & Commands](#scripts--commands)
- [Deployment](#deployment)
- [Folder Structure](#folder-structure)
- [Challenges & Engineering Solutions](#challenges--engineering-solutions)
- [Future Improvements](#future-improvements)

---

## 🌟 Project Overview
This backend serves as the core engine for a modern trading community platform. It allows **Master Traders** to share signals and analytics, while **Users** can follow them, subscribe to premium plans, and track their performance. The system handles complex workflows like automated subscription management, real-time signal publishing, and a robust financial ledger for referrals and withdrawals.

---

## ✨ Key Features
- **🔐 Advanced Authentication**: JWT-based auth with Refresh Token rotation, 2FA (TOTP), and account verification.
- **💳 Stripe Integration**: Fully automated subscription lifecycle (Checkout, Upgrades, Downgrades, Pro-rata billing, and Webhooks).
- **📊 Signal Platform**: Comprehensive signal management (Instant/Scheduled), performance tracking, and win-rate analytics.
- **🏆 Gamification**: Leaderboards, top traders ranking, and contribution-based engagement tracking.
- **💰 Financial Suite**: Internal wallet system, referral bonuses, and secure withdrawal workflows.
- **🛡️ Security First**: Rate limiting, Helmet.js protection, data validation (Zod), and strict role-based access control (RBAC).
- **🚀 DevOps Ready**: Dockerized setup, CI/CD workflows, and automated VPS deployment scripts.

---

## 🛠 Tech Stack
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js (v5.1.0)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod
- **Security**: 
  - JWT (Access/Refresh Tokens)
  - OTPAuth (2FA)
  - Bcrypt (Hashing)
  - Express Rate Limit
- **Payments**: Stripe Node SDK
- **File Storage**: AWS S3 & Cloudinary
- **Communication**: Nodemailer (SMTP/Gmail)
- **Logging**: Winston & Morgan
- **Testing**: Jest & Supertest

---

## 🏗 System Architecture
The project follows a **Modular Monolith** pattern. Each feature (e.g., Auth, Subscription, Signal) is encapsulated within its own directory containing its routes, controllers, services, schemas, and validations. This ensures:
- **Separation of Concerns**: Logic is decoupled, making it easier to maintain and test.
- **Scalability**: Modules can be migrated to microservices if needed in the future.
- **Readability**: Clear folder structure makes onboarding fast for new developers.

---

## 👥 User Roles & Permissions
- **USER**: The default role. Can browse public signals, follow masters, and subscribe to plans.
- **MASTER**: Verified traders. Can create signals, manage their profile, and earn from their performance.
- **ADMIN**: Full system access. Manages users, plans, system configuration, and audits transactions.

---

## 📦 Core Modules
1. **Auth Module**: Handles registration, login, 2FA setup, and password management.
2. **Subscription Module**: Manages Stripe products, checkout sessions, and plan tiers.
3. **Signal Module**: The core trading logic for publishing and tracking signals.
4. **Master Module**: Handles trader profiles, win-rate calculations, and analytics.
5. **Financial Modules**: Referral tracking, Wallet transactions, and Withdrawal management.
6. **System Config**: Global settings (e.g., maintenance mode, feature flags).

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v20 or higher)
- MongoDB (Local or Atlas)
- Redis (Optional, for caching if implemented)

### Steps
1. **Clone the Repository**
   ```bash
   git clone https://github.com/reazulislamreaz/trading-app-backend.git
   cd trading-app-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in the required variables (DB_URL, JWT_SECRET, STRIPE_KEY, etc.)
   ```

4. **Seed the Database**
   ```bash
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_URL` | MongoDB connection string | - |
| `ACCESS_TOKEN` | JWT Access Token Secret (min 32 chars) | - |
| `REFRESH_TOKEN` | JWT Refresh Token Secret | - |
| `STRIPE_SECRET_KEY` | Stripe Private Key | - |
| `CLOUD_NAME` | Cloudinary name | - |

*Refer to `.env.example` for the complete list of required variables.*

---

## 📜 Scripts & Commands
- `npm run dev`: Start development server with hot-reload.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run start`: Run the production build.
- `npm run lint`: Check for code style issues.
- `npm run format`: Format code using Prettier.
- `npm run test`: Run the test suite with coverage.
- `npm run seed`: Populate database with default plans and an admin user.

---

## 🚢 Deployment

### Docker Deployment
The project includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.
```bash
docker-compose up -d --build
```

### VPS Setup
A `vps-setup.sh` script is provided in the `scripts/` directory to automate environment preparation, Node.js installation, and PM2 setup on Ubuntu servers.

---

## 📂 Folder Structure
```text
src/
├── app/
│   ├── configs/      # Global configurations
│   ├── middlewares/  # Express middlewares (auth, error, upload)
│   ├── modules/      # Feature-based modules (Auth, User, Signal, etc.)
│   ├── types/        # Global TypeScript types
│   └── utils/        # Shared utility functions
├── __tests__/        # Integration tests
├── routes.ts         # Root router
├── app.ts            # Express application setup
└── server.ts         # Server entry point
```

---

## 🧠 Challenges & Engineering Solutions
- **Subscription Synchronization**: Keeping Stripe and MongoDB in sync was solved by using a robust Webhook handler (`stripe.webhook.ts`) that listens for `invoice.paid`, `customer.subscription.updated`, and `customer.subscription.deleted` events.
- **Security & 2FA**: Implementing 2FA with backup codes required a careful design of the auth flow to ensure users aren't locked out and tokens are handled securely during the setup phase.
- **Scalable Signal Publishing**: Signals can be scheduled for future publication. This was implemented using `node-cron` and a scheduler service that polls for pending signals.

---

## 🚀 Future Improvements
- [ ] **Real-time Notifications**: Integrate Socket.io for instant signal alerts.
- [ ] **Exchange Integration**: Automated trade execution via Binance/MetaTrader API.
- [ ] **AI Insights**: Use machine learning to rank signals based on historical accuracy.
- [ ] **Mobile App**: Develop a Flutter or React Native client.

---

## 📄 License
This project is licensed under the **ISC License**.

---
**Developed with ❤️ by [Reazul Islam Reaz](https://github.com/reazulislamreaz)**
