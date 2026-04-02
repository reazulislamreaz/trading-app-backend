# 🚀 VPS Deployment Guide

Complete guide for deploying your Node.js + Express + TypeScript backend to a VPS using Docker and GitHub Actions CI/CD.

---

## 📋 Prerequisites

- A VPS (Ubuntu 20.04+ recommended) with SSH access
- Domain name pointing to your VPS (optional but recommended)
- GitHub account
- Docker installed locally (for testing)

---

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GitHub    │────▶│     VPS      │────▶│   Docker    │
│   (Code)    │     │  (Ubuntu)    │     │  Containers │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    ├─► App (Port 5000)
       │                    │                    ├─► MongoDB (Port 27017)
       │                    │                    └─► Nginx (Port 80/443)
       │                    │
       └─── CI/CD ──────────┘
           (Auto Deploy)
```

---

## 📦 Step 1: Prepare Your VPS

### 1.1 Connect to your VPS

```bash
ssh username@your_vps_ip
```

### 1.2 Run the setup script

From your local machine:

```bash
# Copy the setup script to your VPS
scp scripts/vps-setup.sh username@your_vps_ip:/tmp/

# SSH into VPS
ssh username@your_vps_ip

# Run the setup script
sudo bash /tmp/vps-setup.sh
```

**OR** run commands manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add user to docker group (avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🔧 Step 2: Configure GitHub Repository

### 2.1 Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit with CI/CD setup"
```

### 2.2 Create GitHub Repository

```bash
# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

### 2.3 Configure GitHub Secrets

Go to: `https://github.com/yourusername/your-repo/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VPS_HOST` | Your VPS IP or domain | `192.168.1.100` or `example.com` |
| `VPS_USERNAME` | SSH username | `root` or `ubuntu` |
| `VPS_PORT` | SSH port | `22` |
| `VPS_SSH_KEY` | Private SSH key | See below |

### 2.4 Generate SSH Key for GitHub Actions

```bash
# Generate dedicated SSH key for CI/CD
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_vps

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions_vps.pub username@your_vps_ip

# Copy private key to GitHub Secrets
cat ~/.ssh/github_actions_vps | xclip -sel clip
# Paste this as VPS_SSH_KEY secret
```

---

## ⚙️ Step 3: Configure Environment

### 3.1 On Your VPS

```bash
cd /opt/myapp

# Create .env file
sudo nano .env
```

Paste your production configuration (from `.env.production` template):

```env
# Application
NODE_ENV=production
PORT=5000

# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YourSecurePassword123!
MONGO_USERNAME=appuser
MONGO_PASSWORD=YourAppPassword456!
MONGO_DATABASE=myapp

# JWT (Generate with: openssl rand -hex 32)
ACCESS_TOKEN=your_64_char_access_token_here
REFRESH_TOKEN=your_64_char_refresh_token_here
RESET_SECRET=your_64_char_reset_secret_here
VERIFIED_TOKEN=your_64_char_verified_token_here

# Frontend
FRONT_END_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Email
APP_USER_EMAIL=your_email@gmail.com
APP_PASSWORD=your_gmail_app_password

# Security
BCRYPT_SALT_ROUNDS=12
```

### 3.2 Set Secure Permissions

```bash
sudo chmod 600 /opt/myapp/.env
sudo chown root:root /opt/myapp/.env
```

---

## 🚀 Step 4: Deploy

### Option A: Automatic Deployment (Recommended)

Push to main branch:

```bash
git add .
git commit -m "Production deployment"
git push origin main
```

GitHub Actions will:
1. Run tests
2. Build Docker image
3. Deploy to your VPS via SSH

### Option B: Manual Deployment

On your VPS:

```bash
cd /opt/myapp

# Build and start containers
sudo docker-compose up -d --build

# View logs
sudo docker-compose logs -f
```

---

## 🔍 Step 5: Verify Deployment

### Check Container Status

```bash
docker-compose ps
```

Expected output:
```
NAME            STATUS                   PORTS
myapp_api       Up (healthy)             0.0.0.0:5000->5000/tcp
myapp_mongo     Up (healthy)             127.0.0.1:27017->27017/tcp
```

### Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Test from External

```bash
curl http://your_vps_ip:5000/health
```

---

## 🔒 Step 6: Secure Your Deployment (Optional but Recommended)

### 6.1 Setup Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block direct access to MongoDB
sudo ufw deny 27017

# Check status
sudo ufw status
```

### 6.2 Setup Nginx Reverse Proxy (for HTTPS)

Create Nginx configuration:

```bash
sudo mkdir -p /opt/myapp/nginx/conf.d
sudo nano /opt/myapp/nginx/conf.d/default.conf
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Update `docker-compose.yml` to uncomment Nginx service.

### 6.3 Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 📊 Step 7: Monitoring & Maintenance

### View Logs

```bash
# All logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# MongoDB logs only
docker-compose logs -f mongo
```

### Backup Database

```bash
# Run backup script
sudo bash /opt/myapp/backup.sh

# Backups stored in
ls -la /opt/myapp/backups/
```

### Restore Database

```bash
# Stop app
docker-compose down

# Restore from backup
docker run --rm \
  -v /opt/myapp/backups/20240101_120000:/backup \
  --network myapp_network \
  mongo:7 mongorestore \
  --username=appuser \
  --password=YourAppPassword456! \
  --authenticationDatabase=admin \
  /backup

# Restart app
docker-compose up -d
```

### Update Application

```bash
# Automatic (via CI/CD)
git push origin main

# Manual
cd /opt/myapp
sudo bash deploy.sh
```

### Cleanup Old Images

```bash
# Remove unused images
docker image prune -f

# Remove all unused data
docker system prune -f
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Restart containers
docker-compose restart
```

### Database Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongo

# Test MongoDB connection
docker exec -it myapp_mongo mongosh \
  -u appuser \
  -p YourAppPassword \
  --authenticationDatabase admin \
  myapp
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

### High Memory Usage

```bash
# Check memory
free -h

# Limit Docker memory in docker-compose.yml
# Add to app service:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

---

## 📈 Performance Optimization

### 1. Enable Docker Build Cache

```yaml
# In .github/workflows/deploy.yml
- name: Build Docker image
  run: |
    docker build --cache-from myapp:latest -t myapp:${{ github.sha }} .
```

### 2. Use Docker Buildx for Faster Builds

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    cache-from: type=registry,ref=youruser/myapp:buildcache
    cache-to: type=registry,ref=youruser/myapp:buildcache,mode=max
```

### 3. Optimize MongoDB

```javascript
// Add indexes for frequently queried fields
db.accounts.createIndex({ email: 1 }, { unique: true })
db.accounts.createIndex({ accountStatus: 1 })
```

---

## 🎯 Deployment Checklist

- [ ] VPS setup script executed successfully
- [ ] Docker and Docker Compose installed
- [ ] GitHub repository created
- [ ] GitHub Secrets configured
- [ ] `.env` file created with secure values
- [ ] JWT secrets generated (min 32 chars)
- [ ] MongoDB credentials changed from defaults
- [ ] Firewall configured (UFW)
- [ ] Health endpoint responding
- [ ] Logs accessible
- [ ] Backup script tested
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Domain pointing to VPS
- [ ] First deployment successful

---

## 📞 Support & Resources

- **Docker Docs**: https://docs.docker.com/
- **GitHub Actions**: https://docs.github.com/en/actions
- **MongoDB Docker**: https://hub.docker.com/_/mongo
- **Let's Encrypt**: https://letsencrypt.org/

---

## 🎉 You're Done!

Your application is now:
- ✅ Containerized with Docker
- ✅ Auto-deploying via GitHub Actions
- ✅ Running on production-ready infrastructure
- ✅ Secured with proper environment management
- ✅ Backed up with automated scripts

**Next Steps:**
1. Monitor your application
2. Set up alerts (optional)
3. Configure a proper domain with HTTPS
4. Scale horizontally if needed

---

**Quick Commands Reference:**

```bash
# Deploy
git push origin main

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Backup
bash /opt/myapp/backup.sh

# Check status
docker-compose ps
```
