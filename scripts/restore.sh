#!/usr/bin/env bash
# =============================================================================
# Database Restore Script
# =============================================================================
# Restores PostgreSQL database from a backup file.
#
# Usage:
#   Local:       ./scripts/restore.sh ./backups/saas_20240101_120000.sql.gz
#   Production:  ./scripts/restore.sh /opt/saas/data/backups/saas_20240101_120000.sql.gz production
#   Preprod:     ./scripts/restore.sh /opt/preprod/data/backups/saas_20240101_120000.sql.gz preprod
#
# WARNING: This will DROP the existing database and restore from backup.
#          All current data will be lost!
# =============================================================================
set -euo pipefail

# Configuration
BACKUP_FILE="${1:?Backup file required. Usage: $0 <backup_file> [environment]}"
ENVIRONMENT="${2:-local}"

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
# Validate backup file
# =============================================================================
if [ ! -f "$BACKUP_FILE" ]; then
  print_error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
  print_error "Backup file is not a valid gzip file"
  exit 1
fi

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
    CONTAINER_NAME="${PROJECT_NAME:-saas}-postgres"
    ;;
    
  production)
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
    POSTGRES_DB="${POSTGRES_DB:-saas}"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"
    CONTAINER_NAME="saas_postgres"
    ;;
    
  preprod)
    POSTGRES_USER="${POSTGRES_USER:-postgres}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set}"
    POSTGRES_DB="${POSTGRES_DB:-saas}"
    POSTGRES_HOST="localhost"
    POSTGRES_PORT="5432"
    CONTAINER_NAME="preprod_postgres"
    ;;
    
  *)
    print_error "Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 <backup_file> [local|production|preprod]"
    exit 1
    ;;
esac

# =============================================================================
# Confirmation
# =============================================================================
print_header "Database Restore"
echo "Environment: $ENVIRONMENT"
echo "Database: $POSTGRES_DB"
echo "Backup file: $BACKUP_FILE"
echo ""

print_warning "WARNING: This will DROP the existing database and restore from backup!"
print_warning "All current data in database '$POSTGRES_DB' will be LOST!"
echo ""

read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  print_error "Restore cancelled"
  exit 1
fi

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
# Create temporary restore database
# =============================================================================
print_header "Preparing for Restore"

TEMP_DB="${POSTGRES_DB}_restore_temp"

if [ "$USE_DOCKER" = true ]; then
  if [ "$ENVIRONMENT" = "local" ]; then
    SERVICE_CONTAINER="$CONTAINER_NAME"
  else
    SERVICE_CONTAINER=$(docker ps -q -f "name=${CONTAINER_NAME}" | head -1)
  fi
  
  if [ -z "$SERVICE_CONTAINER" ]; then
    print_error "No running container found"
    exit 1
  fi
  
  # Terminate existing connections
  print_warning "Terminating existing connections to $POSTGRES_DB..."
  docker exec "$SERVICE_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$POSTGRES_DB'
      AND pid <> pg_backend_pid();
  " 2>/dev/null || true
  
  # Drop and recreate database
  print_warning "Dropping database $POSTGRES_DB..."
  docker exec "$SERVICE_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>/dev/null || true
  
  print_success "Creating fresh database $POSTGRES_DB..."
  docker exec "$SERVICE_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"
else
  # Direct connection
  if ! command -v psql &> /dev/null; then
    print_error "psql not found. Please install PostgreSQL client tools."
    exit 1
  fi
  
  # Terminate existing connections
  print_warning "Terminating existing connections to $POSTGRES_DB..."
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$POSTGRES_DB'
      AND pid <> pg_backend_pid();
  " 2>/dev/null || true
  
  # Drop and recreate database
  print_warning "Dropping database $POSTGRES_DB..."
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" 2>/dev/null || true
  
  print_success "Creating fresh database $POSTGRES_DB..."
  PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB;"
fi

# =============================================================================
# Restore backup
# =============================================================================
print_header "Restoring Backup"

if [ "$USE_DOCKER" = true ]; then
  # Restore via Docker
  gunzip -c "$BACKUP_FILE" | docker exec -i "$SERVICE_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
else
  # Direct restore
  gunzip -c "$BACKUP_FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"
fi

# =============================================================================
# Verify restore
# =============================================================================
print_header "Verifying Restore"

if [ "$USE_DOCKER" = true ]; then
  TABLE_COUNT=$(docker exec "$SERVICE_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
else
  TABLE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
fi

if [ "$TABLE_COUNT" -gt 0 ]; then
  print_success "Restore successful! Found $TABLE_COUNT tables in database."
else
  print_error "Restore may have failed. No tables found in database."
  exit 1
fi

# =============================================================================
# Summary
# =============================================================================
print_header "Restore Complete"
echo "Database '$POSTGRES_DB' has been restored from:"
echo "  $BACKUP_FILE"
echo ""
print_warning "Remember to restart your application if it's currently running."
echo ""
