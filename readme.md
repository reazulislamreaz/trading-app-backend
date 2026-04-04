# ⚡ Modular Backend Boilerplate

**Production-Ready Express + TypeScript + MongoDB Boilerplate with CI/CD**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0+-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.0+-red.svg)](https://mongoosejs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

---

## 🚀 Overview

A **production-ready, modular backend boilerplate** built with Express, TypeScript, and MongoDB. Features complete authentication, 2FA, file uploads, Swagger documentation, and **one-click deployment to VPS** with Docker and GitHub Actions CI/CD.

Perfect for developers who want to launch production APIs quickly without sacrificing code quality or security.

---

## ✨ Key Features

### 🏗️ Architecture
- ⚙️ **Modular Structure** - Clean separation of controllers, services, routes, schemas
- 📘 **TypeScript** - Full type safety with strict mode
- 🔐 **Authentication** - JWT with access/refresh tokens, token blacklisting
- 🛡️ **2FA Support** - TOTP with backup codes
- ✅ **Validation** - Zod + Mongoose double validation
- 📝 **Swagger Docs** - Auto-generated API documentation

### 🚀 Deployment
- 🐳 **Docker Ready** - Multi-stage builds, optimized for production
- 🔄 **CI/CD Pipeline** - GitHub Actions auto-deployment
- 🖥️ **VPS Deployment** - One-command deployment to any VPS
- 📊 **Health Checks** - Built-in monitoring and auto-restart
- 📦 **Database Backups** - Automated MongoDB backup scripts

### 🔒 Security
- 🛡️ **Helmet.js** - Security headers
- 🔐 **Bcrypt** - Password hashing with salt rounds
- 🚫 **Rate Limiting** - API, auth, and password reset limiters
- 🧹 **Input Sanitization** - MongoDB injection prevention
- 🔑 **Environment Variables** - Secure secrets management

### 📦 Additional Features
- ☁️ **Cloudinary Integration** - Image/file uploads
- 🪣 **AWS S3 Support** - Alternative file storage
- 📧 **Email Service** - Nodemailer with SMTP
- 📝 **Logging** - Winston with file rotation
- ❌ **Error Handling** - Global error handler with detailed responses

---

## 📁 Project Structure

```
modular-backend-boilerplate/
├── src/
│   ├── app/
│   │   ├── configs/          # Configuration files
│   │   │   ├── database.ts   # MongoDB connection with retry
│   │   │   ├── index.ts      # Environment config
│   │   │   └── logger.ts     # Winston logger
│   │   ├── middlewares/      # Express middlewares
│   │   │   ├── auth.ts       # JWT authentication
│   │   │   ├── rate_limiter.ts
│   │   │   └── global_error_handler.ts
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication module
│   │   │   └── user/         # User module
│   │   ├── utils/            # Helper utilities
│   │   └── types/            # TypeScript types
│   ├── server.ts             # Application entry point
│   └── app.ts                # Express app setup
├── scripts/
│   └── vps-setup.sh          # VPS setup automation
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
├── Dockerfile                # Production Docker build
├── docker-compose.yml        # Multi-container setup
├── .env.example              # Environment template
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/reazulislamreaz/modular-backend-boilerplate.git
cd modular-backend-boilerplate

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials
nano .env

# Start development server
npm run dev
```

Server runs on: `http://localhost:5000`  
Swagger docs: `http://localhost:5000/docs`

---

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start with ts-node-dev (hot reload)

# Production
npm run build            # Compile TypeScript
npm start                # Start production server

# Database Seeding
npm run seed             # Seed database with initial data
npm run seed:production  # Seed database in production mode
npm run db:reset         # Reset and re-seed database

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type check
```

---

## 🌱 Database Seeding

The boilerplate includes a comprehensive seeding system that **runs automatically on every server startup**.

### What Gets Seeded

1. **Admin User** - Created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables
2. **Subscription Plans** - Default plans (Free, Basic, Pro, Master) with automatic Stripe sync
3. **Demo Users** - Test accounts for development (john@example.com, jane@example.com)

### Configuration

Add these variables to your `.env` file:

```env
# Seed Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminSecurePass123!

# Auto-seed on server startup (default: true)
AUTO_SEED=true
```

### Automatic Seeding

**Enabled by default** - seeds run automatically every time you start the server:

```bash
npm run dev    # Seeds run automatically
npm start      # Seeds run automatically
```

This is **idempotent** - safe to run multiple times, won't create duplicates.

### Stripe Integration for Subscription Plans

The seed system includes **automatic Stripe synchronization**:

1. **Server Starts** → Database connects
2. **Plans Are Seeded** → Default subscription plans created in MongoDB
3. **Stripe Sync** → Products and Prices automatically created in Stripe
4. **IDs Stored** → `stripeProductId` and `stripePriceId` saved to each plan

**How it works:**
- Free plan: No Stripe sync needed (price = $0)
- Paid plans: Automatically create Stripe Product + Price
- Existing synced plans: Skipped (no duplicate Stripe products)

**Configure Stripe:**
```env
# Add your Stripe keys to .env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

**If Stripe is not configured:**
- Seed script will skip Stripe sync gracefully
- Plans will be created without Stripe IDs
- You can add Stripe keys later and re-run seed

### Manual Seeding (Standalone)

If you need to run seeds manually (without starting the server):

```bash
# Seed database (development)
npm run seed

# Seed database (production)
npm run seed:production

# Alternative: Run seed script directly
npx ts-node scripts/seed.ts
```

### Disabling Auto-Seeding

To disable automatic seeding on server startup:

```env
# Add to your .env file
AUTO_SEED=false
```

Then run seeds manually when needed using `npm run seed`.

### Seed Features

- **Auto-run on startup**: Seeds execute automatically when server starts
- **Idempotent**: Safe to run multiple times - won't create duplicates
- **Admin User**: Creates admin account with hashed password
- **Subscription Plans**: Inserts 6 default plans with monthly/yearly billing
- **Stripe Auto-Sync**: Automatically creates Stripe Products/Prices for paid plans
- **Demo Users**: Creates 2 test users for development
- **Configurable**: Enable/disable via `AUTO_SEED` environment variable
- **Graceful Degradation**: Works without Stripe (sync skipped if not configured)

### Programmatic Seeding (in your code)

You can also import and run seeding functions within your application:

```typescript
import runAllSeeds from './app/utils/seed';

// Run all seeds programmatically
await runAllSeeds();

// Or run individual seeds
import { seedAdmin, seedSubscriptionPlans, seedDemoUsers } from './app/utils/seed';

await seedAdmin();
await seedSubscriptionPlans();
await seedDemoUsers();
```

### Customizing Seeds

To add your own seed data:

1. Edit `scripts/seed.ts` for standalone seeding
2. Edit `src/app/utils/seed.ts` for in-app seeding
3. Add your seed function to the `runAllSeeds()` function

Example:
```typescript
const seedCustomData = async () => {
  // Your custom seeding logic
};

const runAllSeeds = async () => {
  await seedAdmin();
  await seedSubscriptionPlans();
  await seedDemoUsers();
  await seedCustomData(); // Add your custom seed
};
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_URL=mongodb://localhost:27017/myapp

# JWT Secrets (generate with: openssl rand -hex 32)
ACCESS_TOKEN=your_64_char_access_token
REFRESH_TOKEN=your_64_char_refresh_token
RESET_SECRET=your_64_char_reset_secret
VERIFIED_TOKEN=your_64_char_verified_token

# Email
APP_USER_EMAIL=your_email@gmail.com
APP_PASSWORD=your_app_password

# File Upload (Optional)
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
```

---

## 🗄️ Database Setup

### Local MongoDB

```bash
# Without authentication
DB_URL=mongodb://localhost:27017/myapp

# With authentication
DB_URL=mongodb://username:password@localhost:27017/myapp?authSource=admin
```

### MongoDB Atlas

```bash
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/myapp?retryWrites=true&w=majority
```

⚠️ **Important:** URL-encode special characters in passwords:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`

---

## 🐳 Docker Deployment

### Local Development

```bash
# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production VPS Deployment

**1. Setup VPS:**
```bash
scp scripts/vps-setup.sh user@your-vps-ip:/tmp/
ssh user@your-vps-ip
sudo bash /tmp/vps-setup.sh
```

**2. Configure GitHub Secrets:**
- `VPS_HOST` - Your VPS IP
- `VPS_USERNAME` - SSH username
- `VPS_PORT` - SSH port (usually 22)
- `VPS_SSH_KEY` - SSH private key

**3. Deploy:**
```bash
git push origin main
```

GitHub Actions will automatically build and deploy to your VPS!

📖 **Full Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 API Documentation

### Generated Modules

Each module includes:
- `*.interface.ts` - TypeScript interfaces
- `*.schema.ts` - Mongoose schemas
- `*.validation.ts` - Zod validation schemas
- `*.route.ts` - Express routes
- `*.controller.ts` - Request handlers
- `*.service.ts` - Business logic
- `*.swagger.ts` - API documentation

### Create New Module

```bash
# Using the CLI generator
npx exp-cli-gen products

# Manual creation
mkdir src/app/modules/products
# Create files following the pattern
```

### Swagger Documentation

Access interactive API docs at: `http://localhost:5000/docs`

Features:
- Auto-generated from JSDoc comments
- Try-it-out functionality
- Authentication support
- Request/response examples

---

## 🔐 Authentication

### JWT Token Flow

1. User registers/logs in
2. Server issues access token (15min) + refresh token (7 days)
3. Access token for API requests
4. Refresh token for getting new access tokens
5. Token blacklisting on logout

### 2FA Support

- TOTP (Time-based One-Time Password)
- QR code generation
- Backup codes
- Emergency access

### Example: Protected Route

```typescript
import auth from './middlewares/auth';
import { UserRole } from './types/role';

router.get(
  '/profile',
  auth(UserRole.USER, UserRole.ADMIN),
  getProfileController
);
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Test Structure

```typescript
import request from 'supertest';
import app from '../app';

describe('Auth Tests', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });
    
    expect(response.status).toBe(201);
  });
});
```

---

## 📊 Production Readiness

| Feature | Status |
|---------|--------|
| TypeScript | ✅ |
| Modular Architecture | ✅ |
| Error Handling | ✅ |
| Authentication | ✅ |
| 2FA Support | ✅ |
| Rate Limiting | ✅ |
| Logging | ✅ |
| Docker | ✅ |
| CI/CD Pipeline | ✅ |
| Health Checks | ✅ |
| Database Backups | ✅ |
| Environment Security | ✅ |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express 5.0 |
| **Language** | TypeScript 5.0 |
| **Database** | MongoDB 7.0 |
| **ODM** | Mongoose 8.0 |
| **Validation** | Zod |
| **Auth** | JWT (jsonwebtoken) |
| **Password** | Bcrypt |
| **2FA** | OTPAuth |
| **File Upload** | Multer + Cloudinary |
| **Storage** | AWS S3 (optional) |
| **Email** | Nodemailer |
| **Logging** | Winston |
| **Docs** | Swagger UI |
| **Security** | Helmet, CORS, Rate Limiter |
| **Deployment** | Docker + GitHub Actions |

---

## 📖 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - 5-minute quick start
- **[MONGODB_FIX_GUIDE.md](MONGODB_FIX_GUIDE.md)** - MongoDB troubleshooting

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Reazul Islam Reaz**  
*Backend Engineer*

🔗 [GitHub Profile](https://github.com/reazulislamreaz)  
📧 Email: [Contact via GitHub](https://github.com/reazulislamreaz)

---

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- MongoDB team for the database
- TypeScript team for type safety
- All contributors and supporters

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/reazulislamreaz/modular-backend-boilerplate/issues)
- **Discussions:** [GitHub Discussions](https://github.com/reazulislamreaz/modular-backend-boilerplate/discussions)
- **Documentation:** See `/docs` folder

---

## ⭐ Show Your Support

If this boilerplate helps you build something awesome, please give it a star! It helps others discover it too.

**Happy Coding! 🚀**
