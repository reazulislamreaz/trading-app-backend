# 🚀 Quick Deploy Guide

## Deploy to VPS in 5 Minutes

### Step 1: Setup VPS (One-time)

```bash
# Copy setup script to VPS
scp scripts/vps-setup.sh user@your-vps-ip:/tmp/

# Run on VPS
ssh user@your-vps-ip
sudo bash /tmp/vps-setup.sh
```

**Save the credentials shown!**

---

### Step 2: Configure GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Add these 4 secrets:

| Name | Value |
|------|-------|
| `VPS_HOST` | Your VPS IP (e.g., `192.168.1.100`) |
| `VPS_USERNAME` | SSH user (e.g., `root`) |
| `VPS_PORT` | SSH port (usually `22`) |
| `VPS_SSH_KEY` | SSH private key (see below) |

**Generate SSH key:**
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_vps
ssh-copy-id -i ~/.ssh/github_actions_vps.pub user@your-vps-ip
cat ~/.ssh/github_actions_vps  # Copy this to VPS_SSH_KEY secret
```

---

### Step 3: Configure Environment on VPS

```bash
# SSH to VPS
ssh user@your-vps-ip

# Go to app directory
cd /opt/myapp

# Edit .env
sudo nano .env
```

**Minimum required values:**
```env
NODE_ENV=production

# Generate with: openssl rand -hex 32
ACCESS_TOKEN=paste_64_char_string_here
REFRESH_TOKEN=paste_64_char_string_here
RESET_SECRET=paste_64_char_string_here
VERIFIED_TOKEN=paste_64_char_string_here

# Your email
APP_USER_EMAIL=your_email@gmail.com
APP_PASSWORD=your_gmail_app_password

FRONT_END_URL=http://your-vps-ip:3000
ALLOWED_ORIGINS=http://your-vps-ip:3000
```

---

### Step 4: Deploy

```bash
# Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main
```

GitHub Actions will automatically deploy to your VPS!

**Watch deployment:** Go to `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

---

### Step 5: Verify

```bash
# Test from your local machine
curl http://your-vps-ip:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 123.456
}
```

---

## 📦 What's Included

| Component | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD pipeline |
| **MongoDB** | Database (containerized) |
| **Winston** | Logging |
| **Health Checks** | Auto-monitoring |

---

## 🔧 Useful Commands

### On VPS:

```bash
# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart
docker-compose restart

# Stop
docker-compose down

# Backup database
sudo bash /opt/myapp/backup.sh

# Manual deploy
sudo bash /opt/myapp/deploy.sh
```

### Local:

```bash
# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

---

## 🐛 Troubleshooting

**Deployment failed?**
```bash
# Check GitHub Actions logs
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

**App not responding?**
```bash
# SSH to VPS
ssh user@your-vps-ip

# Check containers
docker-compose ps

# View logs
docker-compose logs app
```

**Database connection error?**
```bash
# Check MongoDB is running
docker-compose ps mongo

# Restart
docker-compose restart mongo
```

---

## 📁 Files Created

```
.github/workflows/deploy.yml    # CI/CD pipeline
Dockerfile                       # App container
docker-compose.yml               # Multi-container setup
scripts/vps-setup.sh            # VPS initialization
.env.production                  # Production template
DEPLOYMENT.md                    # Full documentation
```

---

## ✅ Checklist

- [ ] VPS setup script run
- [ ] GitHub Secrets configured
- [ ] `.env` file created on VPS
- [ ] First push to `main` branch
- [ ] Health endpoint responding
- [ ] Logs accessible

---

**🎉 Done! Your app is now auto-deploying to production!**

Every push to `main` will automatically deploy.
