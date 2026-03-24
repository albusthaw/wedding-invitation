#!/bin/bash
#
# E-Invite - Wedding Invitation System
# Reinstall Script — fresh reinstall on a system that already has E-Invite
#
# Handles all conflicts: existing database/user, running PM2 processes,
# Nginx configs, stale node_modules, etc.
#
# Usage: chmod +x reinstall.sh && sudo ./reinstall.sh
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

APP_DIR="/opt/einvite"

print_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════╗"
    echo "║        E-Invite Reinstallation           ║"
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
        print_error "Please run as root (sudo ./reinstall.sh)"
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

# Stop existing services
stop_services() {
    print_step "Stopping existing services..."

    # Stop PM2 process if running
    if command -v pm2 &> /dev/null; then
        pm2 stop einvite > /dev/null 2>&1 || true
        pm2 delete einvite > /dev/null 2>&1 || true
        print_success "PM2 process stopped"
    fi
}

# Clean old application
clean_old_app() {
    print_step "Cleaning old application..."

    # Remove old app directory contents but keep uploads
    if [ -d "$APP_DIR" ]; then
        # Backup uploads if they exist
        if [ -d "$APP_DIR/public/uploads" ]; then
            BACKUP_DIR=$(mktemp -d)
            cp -a "$APP_DIR/public/uploads" "$BACKUP_DIR/" 2>/dev/null || true
            print_success "Uploads backed up to $BACKUP_DIR"
        fi

        # Remove old app
        rm -rf "$APP_DIR"
        print_success "Old application removed"
    else
        print_warn "No existing installation at $APP_DIR"
    fi
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
    print_step "Checking Node.js..."
    if command -v node &> /dev/null; then
        NODE_VER=$(node -v)
        print_success "Node.js available: $NODE_VER"
    else
        curl -fsSL https://deb.nodesource.com/setup_lts.x 2>/dev/null | bash - > /dev/null 2>&1
        apt-get install -yqq nodejs > /dev/null 2>&1
        print_success "Node.js installed: $(node -v)"
    fi
    npm install -g npm@latest > /dev/null 2>&1 || true
}

# Ensure MySQL is installed and running
ensure_mysql() {
    print_step "Checking MySQL..."
    if command -v mysql &> /dev/null; then
        print_success "MySQL available"
        # Ensure it's running
        systemctl start mysql > /dev/null 2>&1 || true
    else
        apt-get install -yqq mysql-server > /dev/null 2>&1
        systemctl start mysql
        systemctl enable mysql > /dev/null 2>&1
        print_success "MySQL installed and started"
    fi
}

# Reset database — drop and recreate to avoid all conflicts
reset_database() {
    print_step "Resetting database..."

    # Generate new random password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)

    # Drop existing database and user completely, then recreate
    # This avoids: user already exists, password mismatch, stale tables
    mysql -e "DROP DATABASE IF EXISTS einvite;" 2>/dev/null || true
    mysql -e "DROP USER IF EXISTS 'einvite'@'localhost';" 2>/dev/null || true
    mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

    # Create fresh
    mysql -e "CREATE DATABASE einvite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER 'einvite'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
    mysql -e "GRANT ALL PRIVILEGES ON einvite.* TO 'einvite'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"

    print_success "Database 'einvite' recreated"

    echo "$DB_PASSWORD" > /tmp/.einvite_db_password
}

# Ensure Nginx is installed
ensure_nginx() {
    print_step "Checking Nginx..."
    if command -v nginx &> /dev/null; then
        print_success "Nginx available"
    else
        apt-get install -yqq nginx > /dev/null 2>&1
        systemctl start nginx
        systemctl enable nginx > /dev/null 2>&1
        print_success "Nginx installed and started"
    fi
}

# Ensure PM2 is installed
ensure_pm2() {
    print_step "Checking PM2..."
    if command -v pm2 &> /dev/null; then
        print_success "PM2 available"
    else
        npm install -g pm2 > /dev/null 2>&1
        print_success "PM2 installed"
    fi
}

# Ensure build tools
ensure_tools() {
    print_step "Checking build tools..."
    apt-get install -yqq git curl wget unzip build-essential > /dev/null 2>&1
    print_success "Tools ready"
}

# Deploy fresh application
deploy_application() {
    print_step "Deploying fresh application..."

    # SCRIPT_DIR is resolved early in main() before clean_old_app deletes anything

    # Auto-detect source: check script dir first, then existing install
    SOURCE_DIR="$SCRIPT_DIR"
    if [ ! -f "$SOURCE_DIR/package.json" ]; then
        # Script was run from outside the source directory
        # Check if there's an existing install we can use as source
        if [ -f "$APP_DIR/package.json" ]; then
            SOURCE_DIR="$APP_DIR"
            print_warn "Using existing install at $APP_DIR as source"
        else
            print_error "Cannot find application source files."
            print_error "Either run this script from the e-invite directory, or ensure $APP_DIR exists."
            exit 1
        fi
    fi

    # Copy fresh source to app directory
    mkdir -p "$APP_DIR"

    REAL_SOURCE_DIR="$(readlink -f "$SOURCE_DIR")"
    REAL_APP_DIR="$(readlink -f "$APP_DIR" 2>/dev/null || echo "$APP_DIR")"

    if [ "$REAL_SOURCE_DIR" = "$REAL_APP_DIR" ]; then
        print_success "Already running from $APP_DIR, skipping copy"
    else
        if command -v rsync &> /dev/null; then
            rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' "$SOURCE_DIR/" "$APP_DIR/"
        else
            cp -a "$SOURCE_DIR"/. "$APP_DIR/"
        fi
        print_success "Application copied to $APP_DIR"
    fi

    cd "$APP_DIR"

    # Read DB password
    DB_PASSWORD=$(cat /tmp/.einvite_db_password 2>/dev/null || echo "password")

    # Generate new secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    # Create fresh .env file
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

    # Clean install dependencies
    print_step "Installing Node.js dependencies..."
    rm -rf node_modules package-lock.json > /dev/null 2>&1
    npm install --production=false > /dev/null 2>&1

    # Generate Prisma client
    print_step "Generating Prisma client..."
    npx prisma generate > /dev/null 2>&1

    # Push database schema (fresh DB, no conflicts)
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

    # Restore uploads if backed up
    if [ -n "${BACKUP_DIR:-}" ] && [ -d "$BACKUP_DIR/uploads" ]; then
        cp -a "$BACKUP_DIR/uploads/." "$APP_DIR/public/uploads/" 2>/dev/null || true
        rm -rf "$BACKUP_DIR"
        print_success "Uploads restored"
    fi

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

    cd "$APP_DIR"

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
    mkdir -p "$APP_DIR/public/uploads/photos"
    mkdir -p "$APP_DIR/public/uploads/music"
    chmod -R 755 "$APP_DIR/public/uploads"
    print_success "Upload directories created"
}

# Print summary
print_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║          E-Invite Reinstallation Complete!              ║"
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
    echo "║  NOTE: Previous uploads were preserved if they existed.  ║"
    echo "║  Database was recreated fresh (admin password: admin123) ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Main execution
main() {
    print_banner
    check_root
    detect_os

    # Resolve script directory NOW before clean_old_app deletes it
    # If the script runs from /opt/einvite and we delete that dir, pwd fails later
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Phase 1: Tear down running services
    stop_services

    # Phase 2: Clean old installation
    clean_old_app

    # Phase 3: Ensure prerequisites
    update_system
    ensure_tools
    install_nodejs
    ensure_mysql
    ensure_nginx
    ensure_pm2

    # Phase 4: Fresh database (drop + recreate = no conflicts)
    reset_database

    # Phase 5: Deploy fresh app
    deploy_application
    create_directories

    # Phase 6: Configure services
    configure_nginx
    setup_pm2
    setup_firewall

    print_summary
}

main "$@"
