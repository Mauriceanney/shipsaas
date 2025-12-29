#!/usr/bin/env bash
# =============================================================================
# Server Setup Script
# =============================================================================
# Run this script on a fresh Ubuntu droplet to prepare it for deployment.
#
# Usage (run as root on the server):
#   curl -sSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-server.sh | bash
#
# Or copy to server and run:
#   scp scripts/setup-server.sh root@your-server:/tmp/
#   ssh root@your-server "bash /tmp/setup-server.sh"
#
# What this script does:
#   1. Creates deploy user with sudo access
#   2. Configures SSH security
#   3. Installs Docker and Docker Compose
#   4. Initializes Docker Swarm
#   5. Creates data directories
#   6. Sets up firewall (UFW)
#   7. Installs fail2ban for SSH protection
# =============================================================================
set -euo pipefail

# Configuration
DEPLOY_USER="${DEPLOY_USER:-deploy}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

print_header "ShipSaaS Server Setup"
echo "Environment: ${ENVIRONMENT}"
echo "Deploy User: ${DEPLOY_USER}"
echo ""

# =============================================================================
# 1. System Update
# =============================================================================
print_header "Updating System"
apt-get update
apt-get upgrade -y
print_success "System updated"

# =============================================================================
# 2. Install Essential Packages
# =============================================================================
print_header "Installing Essential Packages"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    unattended-upgrades \
    htop \
    ncdu \
    jq \
    git
print_success "Essential packages installed"

# =============================================================================
# 3. Create Deploy User
# =============================================================================
print_header "Creating Deploy User"
if id "$DEPLOY_USER" &>/dev/null; then
    print_warning "User ${DEPLOY_USER} already exists"
else
    useradd -m -s /bin/bash "$DEPLOY_USER"
    print_success "User ${DEPLOY_USER} created"
fi

# Add to sudo group
usermod -aG sudo "$DEPLOY_USER"

# Configure passwordless sudo
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${DEPLOY_USER}
chmod 440 /etc/sudoers.d/${DEPLOY_USER}
print_success "Sudo configured for ${DEPLOY_USER}"

# Copy SSH keys from root to deploy user
if [ -f /root/.ssh/authorized_keys ]; then
    mkdir -p /home/${DEPLOY_USER}/.ssh
    cp /root/.ssh/authorized_keys /home/${DEPLOY_USER}/.ssh/
    chown -R ${DEPLOY_USER}:${DEPLOY_USER} /home/${DEPLOY_USER}/.ssh
    chmod 700 /home/${DEPLOY_USER}/.ssh
    chmod 600 /home/${DEPLOY_USER}/.ssh/authorized_keys
    print_success "SSH keys copied to ${DEPLOY_USER}"
else
    print_warning "No SSH keys found in /root/.ssh/authorized_keys"
    echo "You'll need to manually add SSH keys for ${DEPLOY_USER}"
fi

# =============================================================================
# 4. SSH Hardening
# =============================================================================
print_header "Configuring SSH Security"
cat > /etc/ssh/sshd_config.d/hardening.conf << 'EOF'
PermitRootLogin prohibit-password
PasswordAuthentication no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl restart sshd
print_success "SSH hardened"

# =============================================================================
# 5. Install Docker
# =============================================================================
print_header "Installing Docker"
if command -v docker &> /dev/null; then
    print_warning "Docker already installed"
    docker --version
else
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    print_success "Docker installed"
    docker --version
fi

# Add deploy user to docker group
usermod -aG docker "$DEPLOY_USER"
print_success "${DEPLOY_USER} added to docker group"

# Configure Docker daemon
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
EOF
systemctl restart docker
print_success "Docker daemon configured"

# =============================================================================
# 6. Initialize Docker Swarm
# =============================================================================
print_header "Initializing Docker Swarm"
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    print_warning "Swarm already initialized"
else
    PRIMARY_IP=$(hostname -I | awk '{print $1}')
    docker swarm init --advertise-addr "$PRIMARY_IP"
    print_success "Swarm initialized on ${PRIMARY_IP}"
fi

# =============================================================================
# 7. Create Data Directories
# =============================================================================
print_header "Creating Data Directories"

if [ "$ENVIRONMENT" = "preprod" ]; then
    DATA_PATH="/opt/preprod"
else
    DATA_PATH="/opt/saas"
fi

mkdir -p ${DATA_PATH}/data/{postgres,redis,uploads,backups,letsencrypt}
mkdir -p ${DATA_PATH}/scripts
chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DATA_PATH}
chmod 700 ${DATA_PATH}/data/postgres

print_success "Data directories created at ${DATA_PATH}/data/"
ls -la ${DATA_PATH}/data/

# =============================================================================
# 8. Configure Firewall
# =============================================================================
print_header "Configuring Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
# Docker Swarm ports (for multi-node clusters)
ufw allow 2377/tcp  # Cluster management
ufw allow 7946/tcp  # Node communication
ufw allow 7946/udp  # Node communication
ufw allow 4789/udp  # Overlay network
ufw --force enable
print_success "Firewall configured"
ufw status

# =============================================================================
# 9. Configure Fail2ban
# =============================================================================
print_header "Configuring Fail2ban"
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban
systemctl restart fail2ban
print_success "Fail2ban configured"

# =============================================================================
# 10. Configure Automatic Security Updates
# =============================================================================
print_header "Configuring Automatic Updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
print_success "Automatic security updates enabled"

# =============================================================================
# 11. System Tuning
# =============================================================================
print_header "Applying System Tuning"
cat > /etc/sysctl.d/99-docker.conf << 'EOF'
# Increase max connections
net.core.somaxconn = 65535
# Increase max file handles
fs.file-max = 2097152
# Network performance
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
# Memory settings
vm.swappiness = 10
vm.overcommit_memory = 1
EOF
sysctl --system > /dev/null
print_success "System tuning applied"

# =============================================================================
# Summary
# =============================================================================
print_header "Setup Complete!"

echo ""
echo "Server is ready for deployment."
echo ""
echo "Summary:"
echo "  - Deploy user: ${DEPLOY_USER}"
echo "  - Data path: ${DATA_PATH}/data/"
echo "  - Docker: $(docker --version)"
echo "  - Swarm: $(docker info --format '{{.Swarm.LocalNodeState}}')"
echo ""
echo "Data directories:"
echo "  ${DATA_PATH}/data/postgres     - PostgreSQL database"
echo "  ${DATA_PATH}/data/redis        - Redis cache"
echo "  ${DATA_PATH}/data/uploads      - User uploads"
echo "  ${DATA_PATH}/data/backups      - Database backups"
echo "  ${DATA_PATH}/data/letsencrypt  - SSL certificates"
echo ""
echo "Next steps:"
echo "  1. SSH as deploy user: ssh ${DEPLOY_USER}@$(hostname -I | awk '{print $1}')"
echo "  2. Create .env file: vim ${DATA_PATH}/.env"
echo "  3. Copy docker-compose files to ${DATA_PATH}/"
echo "  4. Deploy with: docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml saas"
echo ""
print_success "Done!"
