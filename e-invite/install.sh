#!/bin/bash
#
# E-Invite - Wedding Invitation System
# Installation Script for Fresh VPS (Ubuntu/Debian)
#
# Usage: chmod +x install.sh && sudo ./install.sh
#

set -e

# Prevent any interactive prompts from apt and other tools
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════╗"
    echo "║         E-Invite Installation            ║"
    echo "║    Wedding Invitation System v1.0        ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run as root (sudo ./install.sh)"
        exit 1
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "Cannot detect OS. This script supports Ubuntu/Debian."
        exit 1
    fi
    print_success "Detected OS: $OS $OS_VERSION"
}

# Update system
update_system() {
    print_step "Updating system packages..."
    apt-get update -yqq > /dev/null 2>&1
    apt-get upgrade -yqq > /dev/null 2>&1
    print_success "System updated"
}

# Install Node.js LTS
install_nodejs() {
    print_step "Installing Node.js LTS..."
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v)
        print_warn "Node.js already installed: $NODE_VER"
    else
        curl -fsSL https://deb.nodesource.com/setup_lts.x 2>/dev/null | bash - > /dev/null 2>&1
        apt-get install -yqq nodejs > /dev/null 2>&1
        print_success "Node.js installed: $(node -v)"
    fi

    # Install npm latest
    npm install -g npm@latest > /dev/null 2>&1 || true
    print_success "npm version: $(npm -v)"
}

# Install MySQL
install_mysql() {
    print_step "Installing MySQL Server..."
    if command -v mysql &> /dev/null; then
        print_warn "MySQL already installed"
    else
        apt-get install -yqq mysql-server > /dev/null 2>&1
        systemctl start mysql
        systemctl enable mysql > /dev/null 2>&1
        print_success "MySQL installed and started"
    fi
}

# Setup MySQL database
setup_database() {
    print_step "Setting up MySQL database..."

    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)

    mysql -e "CREATE DATABASE IF NOT EXISTS einvite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    mysql -e "CREATE USER IF NOT EXISTS 'einvite'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';" 2>/dev/null || true
    mysql -e "GRANT ALL PRIVILEGES ON einvite.* TO 'einvite'@'localhost';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

    print_success "Database 'einvite' ready"

    echo "$DB_PASSWORD" > /tmp/.einvite_db_password
}

# Install Nginx
install_nginx() {
    print_step "Installing Nginx..."
    if command -v nginx &> /dev/null; then
        print_warn "Nginx already installed"
    else
        apt-get install -yqq nginx > /dev/null 2>&1
        systemctl start nginx
        systemctl enable nginx > /dev/null 2>&1
        print_success "Nginx installed and started"
    fi
}

# Install PM2
install_pm2() {
    print_step "Installing PM2 process manager..."
    if command -v pm2 &> /dev/null; then
        print_warn "PM2 already installed"
    else
        npm install -g pm2 > /dev/null 2>&1
        print_success "PM2 installed"
    fi
}

# Install additional tools
install_tools() {
    print_step "Installing additional tools..."
    apt-get install -yqq git curl wget unzip build-essential > /dev/null 2>&1
    print_success "Tools installed"
}

# Setup application
setup_application() {
    print_step "Setting up E-Invite application..."

    APP_DIR="/opt/einvite"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [ ! -f "$SCRIPT_DIR/package.json" ]; then
        print_error "package.json not found. Run this script from the e-invite directory."
        exit 1
    fi

    # Resolve both paths to handle symlinks and trailing slashes
    REAL_SCRIPT_DIR="$(readlink -f "$SCRIPT_DIR")"
    REAL_APP_DIR="$(readlink -f "$APP_DIR" 2>/dev/null || echo "$APP_DIR")"

    if [ "$REAL_SCRIPT_DIR" = "$REAL_APP_DIR" ]; then
        print_success "Already running from $APP_DIR, skipping copy"
    else
        mkdir -p "$APP_DIR"
        # Use rsync if available for cleaner copy, fallback to cp
        if command -v rsync &> /dev/null; then
            rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' "$SCRIPT_DIR/" "$APP_DIR/"
        else
            cp -a "$SCRIPT_DIR"/. "$APP_DIR/"
        fi
        print_success "Application copied to $APP_DIR"
    fi

    cd "$APP_DIR"

    # Read DB password
    DB_PASSWORD=$(cat /tmp/.einvite_db_password 2>/dev/null || echo "password")

    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    # Create .env file
    cat > .env << EOF
# Database
DATABASE_URL="mysql://einvite:${DB_PASSWORD}@localhost:3306/einvite"

# NextAuth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="https://invite.minthantthaw.me"

# Gemini AI (configure via Settings page)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.1-flash-lite-preview"

# App
NODE_ENV=production
PORT=3000
EOF

    print_success ".env file created"

    # Install dependencies
    print_step "Installing Node.js dependencies..."
    npm install --production=false > /dev/null 2>&1

    # Generate Prisma client
    print_step "Generating Prisma client..."
    npx prisma generate > /dev/null 2>&1

    # Push database schema
    print_step "Pushing database schema..."
    npx prisma db push > /dev/null 2>&1

    # Seed database
    print_step "Seeding database..."
    if npx tsx prisma/seed.ts 2>&1; then
        print_success "Database seeded (admin@einvite.com / admin123)"
    else
        print_error "Seed failed! Run manually: cd $APP_DIR && npx tsx prisma/seed.ts"
    fi

    # Build application
    print_step "Building Next.js application..."
    npm run build > /dev/null 2>&1

    print_success "Application built successfully"

    # Cleanup temp file
    rm -f /tmp/.einvite_db_password
}

# Configure Nginx
configure_nginx() {
    print_step "Configuring Nginx reverse proxy..."

    cat > /etc/nginx/sites-available/einvite << 'NGINX'
server {
    listen 80;
    server_name invite.minthantthaw.me;

    client_max_body_size 50M;

    # Use upstream proxy proto (Cloudflare) if present, otherwise use $scheme (certbot)
    set $forwarded_proto $scheme;
    if ($http_x_forwarded_proto) {
        set $forwarded_proto $http_x_forwarded_proto;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $forwarded_proto;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /opt/einvite/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/einvite /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    nginx -t > /dev/null 2>&1 && systemctl reload nginx
    print_success "Nginx configured"
}

# Setup PM2 process
setup_pm2() {
    print_step "Setting up PM2 process..."

    cd /opt/einvite

    cat > ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: 'einvite',
    script: 'npm',
    args: 'start',
    cwd: '/opt/einvite',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
PM2

    pm2 start ecosystem.config.js > /dev/null 2>&1
    pm2 save > /dev/null 2>&1
    pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

    print_success "PM2 process started"
}

# Setup firewall
setup_firewall() {
    print_step "Configuring firewall..."

    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp > /dev/null 2>&1
        ufw allow 80/tcp > /dev/null 2>&1
        ufw allow 443/tcp > /dev/null 2>&1
        echo "y" | ufw enable > /dev/null 2>&1
        print_success "Firewall configured (ports 22, 80, 443)"
    else
        print_warn "UFW not found, skipping firewall setup"
    fi
}

# Create upload directories
create_directories() {
    print_step "Creating upload directories..."
    mkdir -p /opt/einvite/public/uploads/photos
    mkdir -p /opt/einvite/public/uploads/music
    chmod -R 755 /opt/einvite/public/uploads
    print_success "Upload directories created"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║           E-Invite Installation Complete!               ║"
    echo "╠══════════════════════════════════════════════════════════╣"
    echo "║                                                          ║"
    echo "║  Domain:      invite.minthantthaw.me                     ║"
    echo "║  App URL:     https://invite.minthantthaw.me             ║"
    echo "║  Admin Login: admin@einvite.com / admin123               ║"
    echo "║                                                          ║"
    echo "║  App Dir:     /opt/einvite                               ║"
    echo "║  PM2 Status:  pm2 status                                 ║"
    echo "║  PM2 Logs:    pm2 logs einvite                           ║"
    echo "║  Restart:     pm2 restart einvite                        ║"
    echo "║                                                          ║"
    echo "║  IMPORTANT: Change admin password after first login!     ║"
    echo "║                                                          ║"
    echo "║  SSL: Use Cloudflare (recommended) or certbot:           ║"
    echo "║  apt install certbot python3-certbot-nginx               ║"
    echo "║  certbot --nginx -d invite.minthantthaw.me               ║"
    echo "║                                                          ║"
    echo "║  DNS: Point invite.minthantthaw.me A record to this IP   ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Main execution
main() {
    print_banner
    check_root
    detect_os
    update_system
    install_tools
    install_nodejs
    install_mysql
    setup_database
    install_nginx
    install_pm2
    setup_application
    create_directories
    configure_nginx
    setup_pm2
    setup_firewall
    print_summary
}

main "$@"
