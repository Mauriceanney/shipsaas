#!/usr/bin/env bash
# =============================================================================
# Database Backup Script
# =============================================================================
# Creates timestamped PostgreSQL database backups for all environments.
#
# Usage:
#   Local development:  ./scripts/backup.sh
#   Production server:  ./scripts/backup.sh production
#   Preprod server:     ./scripts/backup.sh preprod
#
# Backups are stored at:
#   - Local: ./backups/
#   - Production: /opt/saas/data/backups/
#   - Preprod: /opt/preprod/data/backups/
# =============================================================================
set -euo pipefail

# Configuration
ENVIRONMENT="${1:-local}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# =============================================================================
# Environment-specific configuration
# =============================================================================
case "$ENVIRONMENT" in
  local)
    # Load local environment
    if [ -f .env ]; then
      export $(grep -v '^#' .env | xargs)
    fi
    
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
    POSTGRES_DB="${POSTGRES_DB:-saas}"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"
    BACKUP_DIR="./backups"
    CONTAINER_NAME="${PROJECT_NAME:-saas}-postgres"
    ;;
    
  production)
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
    POSTGRES_DB="${POSTGRES_DB:-saas}"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"
    BACKUP_DIR="/opt/saas/data/backups/manual"
    CONTAINER_NAME="saas_postgres"
    ;;
    
  preprod)
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
    POSTGRES_DB="${POSTGRES_DB:-saas}"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"
    BACKUP_DIR="/opt/preprod/data/backups/manual"
    CONTAINER_NAME="preprod_postgres"
    ;;
    
  *)
    print_error "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 [local|production|preprod]"
    exit 1
    ;;
esac

# =============================================================================
# Create backup directory
# =============================================================================
mkdir -p "$BACKUP_DIR"

# =============================================================================
# Backup filename
# =============================================================================
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

print_header "Database Backup"
echo "Environment: $ENVIRONMENT"
echo "Database: $POSTGRES_DB"
echo "Timestamp: $TIMESTAMP"
echo "Backup file: $BACKUP_FILE"
echo ""

# =============================================================================
# Check if running in Docker
# =============================================================================
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}"; then
  print_success "Found running container: $CONTAINER_NAME"
  USE_DOCKER=true
else
  print_warning "Container $CONTAINER_NAME not found, using direct connection"
  USE_DOCKER=false
fi

# =============================================================================
# Create backup
# =============================================================================
print_header "Creating Backup"

if [ "$USE_DOCKER" = true ]; then
  # Backup via Docker container
  if [ "$ENVIRONMENT" = "local" ]; then
    # Local development - simple docker exec
    docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
  else
    # Production/Preprod - use Docker service
    SERVICE_CONTAINER=$(docker ps -q -f "name=${CONTAINER_NAME}" | head -1)
    if [ -n "$SERVICE_CONTAINER" ]; then
      docker exec "$SERVICE_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
    else
      print_error "No running container found for service $CONTAINER_NAME"
      exit 1
    fi
  fi
else
  # Direct connection (requires pg_dump installed locally)
  if ! command -v pg_dump &> /dev/null; then
    print_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
  fi
  
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
fi

# =============================================================================
# Verify backup
# =============================================================================
if [ -f "$BACKUP_FILE" ]; then
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  print_success "Backup created successfully!"
  echo ""
  echo "Backup details:"
  echo "  File: $BACKUP_FILE"
  echo "  Size: $BACKUP_SIZE"
  echo ""
  
  # Test if the backup is valid gzip
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    print_success "Backup file is valid"
  else
    print_error "Backup file appears to be corrupted"
    exit 1
  fi
else
  print_error "Backup failed"
  exit 1
fi

# =============================================================================
# Cleanup old backups (keep last 30 manual backups)
# =============================================================================
print_header "Cleanup Old Backups"

MANUAL_BACKUPS=$(find "$BACKUP_DIR" -name "${POSTGRES_DB}_*.sql.gz" -type f | wc -l)
if [ "$MANUAL_BACKUPS" -gt 30 ]; then
  print_warning "Found $MANUAL_BACKUPS backups, cleaning up old ones (keeping last 30)..."
  find "$BACKUP_DIR" -name "${POSTGRES_DB}_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | tail -n +31 | cut -d' ' -f2- | xargs rm -f
  print_success "Cleanup complete"
else
  print_success "Found $MANUAL_BACKUPS backups (no cleanup needed)"
fi

# =============================================================================
# Summary
# =============================================================================
print_header "Backup Complete"
echo "To restore this backup, run:"
echo "  ./scripts/restore.sh $BACKUP_FILE"
echo ""
