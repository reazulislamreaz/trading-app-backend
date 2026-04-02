#!/bin/bash

# =================================================================
# VPS Setup Script for Modular Backend Boilerplate
# Run this script on your VPS as root or with sudo
# =================================================================

set -e

echo "🚀 Starting VPS setup..."

# Configuration
APP_NAME="myapp"
APP_DIR="/opt/$APP_NAME"
MONGO_ROOT_USERNAME="admin"
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
MONGO_APP_USERNAME="appuser"
MONGO_APP_PASSWORD=$(openssl rand -base64 32)
MONGO_DATABASE="myapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system packages
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System packages updated"

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    apt install -y docker-compose-plugin
    print_success "Docker Compose installed"
else
    print_success "Docker Compose already installed"
fi

# Create app directory
print_info "Creating app directory..."
mkdir -p $APP_DIR
print_success "App directory created: $APP_DIR"

# Generate secure JWT secrets if not provided
print_info "Generating secure JWT secrets..."
ACCESS_TOKEN=$(openssl rand -hex 32)
REFRESH_TOKEN=$(openssl rand -hex 32)
RESET_SECRET=$(openssl rand -hex 32)
VERIFIED_TOKEN=$(openssl rand -hex 32)
print_success "JWT secrets generated"

# Create .env file for production
print_info "Creating production environment file..."
cat > $APP_DIR/.env << EOF
# =================================================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# Generated: $(date)
# =================================================================

# Application
NODE_ENV=production
PORT=5000

# MongoDB Configuration
MONGO_ROOT_USERNAME=$MONGO_ROOT_USERNAME
MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD
MONGO_USERNAME=$MONGO_APP_USERNAME
MONGO_PASSWORD=$MONGO_APP_PASSWORD
MONGO_DATABASE=$MONGO_DATABASE

# JWT Configuration (DO NOT SHARE THESE!)
ACCESS_TOKEN=$ACCESS_TOKEN
REFRESH_TOKEN=$REFRESH_TOKEN
RESET_SECRET=$RESET_SECRET
VERIFIED_TOKEN=$VERIFIED_TOKEN
ACCESS_EXPIRES=15m
REFRESH_EXPIRES=7d
RESET_EXPIRES=10m

# Frontend URL (update with your actual frontend URL)
FRONT_END_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Security
BCRYPT_SALT_ROUNDS=12

# Email Configuration (update with your actual credentials)
APP_USER_EMAIL=your_email@gmail.com
APP_PASSWORD=your_app_specific_password

# Cloudinary (optional - update if using)
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

# AWS S3 (optional - update if using)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
EOF
print_success "Environment file created: $APP_DIR/.env"

# Set proper permissions
chmod 600 $APP_DIR/.env
print_success "Environment file permissions secured"

# Create a backup script
print_info "Creating backup script..."
cat > $APP_DIR/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
# MongoDB Backup Script

BACKUP_DIR="/opt/myapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_USERNAME="${MONGO_USERNAME:-appuser}"
MONGO_PASSWORD="${MONGO_PASSWORD:-app_password_change_me}"
MONGO_DATABASE="${MONGO_DATABASE:-myapp}"

mkdir -p $BACKUP_DIR

docker exec myapp_mongo mongodump \
    --username=$MONGO_USERNAME \
    --password=$MONGO_PASSWORD \
    --authenticationDatabase=admin \
    --db=$MONGO_DATABASE \
    --out=/backup/$DATE

docker cp myapp_mongo:/backup/$DATE $BACKUP_DIR/

# Keep only last 7 backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
BACKUP_SCRIPT

chmod +x $APP_DIR/backup.sh
print_success "Backup script created"

# Create a deploy script for manual deployments
print_info "Creating deploy script..."
cat > $APP_DIR/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# Manual Deploy Script

set -e

echo "🚀 Deploying application..."

cd /opt/myapp

# Pull latest changes
git pull origin main

# Stop containers
docker-compose down

# Remove old image
docker rmi myapp:latest || true

# Build new image
docker build -t myapp:latest .

# Start containers
docker-compose up -d

# Clean up old images
docker image prune -f

echo "✅ Deployment completed!"
docker-compose logs -f
DEPLOY_SCRIPT

chmod +x $APP_DIR/deploy.sh
print_success "Deploy script created"

# Create systemd service for auto-restart (optional)
print_info "Creating systemd service..."
cat > /etc/systemd/system/$APP_NAME.service << SYSTEMD_SERVICE
[Unit]
Description=Docker Compose application service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SYSTEMD_SERVICE

systemctl daemon-reload
systemctl enable $APP_NAME
print_success "Systemd service created"

# Setup UFW firewall (if available)
if command -v ufw &> /dev/null; then
    print_info "Configuring firewall..."
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw --force enable
    print_success "Firewall configured"
fi

# Setup log rotation
print_info "Setting up log rotation..."
cat > /etc/logrotate.d/$APP_NAME << LOGROTATE
/opt/myapp/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        docker-compose -f /opt/myapp/docker-compose.yml kill -s HUP app
    endscript
}
LOGROTATE
print_success "Log rotation configured"

# Print setup summary
echo ""
echo "=============================================="
echo "          VPS SETUP COMPLETED! 🎉"
echo "=============================================="
echo ""
echo "📁 Application Directory: $APP_DIR"
echo ""
echo "🔐 IMPORTANT - Save these credentials securely:"
echo "   MongoDB Root Username: $MONGO_ROOT_USERNAME"
echo "   MongoDB Root Password: $MONGO_ROOT_PASSWORD"
echo "   MongoDB App Username:  $MONGO_APP_USERNAME"
echo "   MongoDB App Password:  $MONGO_APP_PASSWORD"
echo ""
echo "🔑 JWT Secrets (saved in .env):"
echo "   ACCESS_TOKEN:  $ACCESS_TOKEN"
echo "   REFRESH_TOKEN: $REFRESH_TOKEN"
echo ""
echo "📝 Next Steps:"
echo "   1. Update $APP_DIR/.env with your actual credentials"
echo "   2. Clone your repository: cd $APP_DIR && git clone <your-repo-url> ."
echo "   3. Deploy: docker-compose up -d"
echo "   4. Check logs: docker-compose logs -f"
echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Restart: docker-compose restart"
echo "   - Stop: docker-compose down"
echo "   - Backup: $APP_DIR/backup.sh"
echo "   - Manual deploy: $APP_DIR/deploy.sh"
echo ""
echo "=============================================="
