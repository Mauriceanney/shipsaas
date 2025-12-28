#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${PROJECT_NAME:-saas}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/$PROJECT_NAME}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

print_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

check_config() {
    if [ -z "$DEPLOY_HOST" ]; then
        print_error "DEPLOY_HOST is not set"
        echo "Set it with: export DEPLOY_HOST=your-server.com"
        exit 1
    fi
}

remote_exec() { ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "$@"; }
remote_copy() { scp "$1" "${DEPLOY_USER}@${DEPLOY_HOST}:$2"; }

cmd_setup() {
    print_header "Setting Up Server"
    check_config

    print_warning "This will install Docker and set up the project on ${DEPLOY_HOST}"
    echo "Continue? (y/N)"
    read -r response
    [[ ! "$response" =~ ^[Yy]$ ]] && exit 0

    remote_exec "
        if ! command -v docker &> /dev/null; then
            echo 'Installing Docker...'
            curl -fsSL https://get.docker.com | sh
            sudo usermod -aG docker \$USER
        fi
        sudo mkdir -p ${DEPLOY_PATH}
        sudo chown ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}
        mkdir -p ${DEPLOY_PATH}/backups
    "
    remote_copy "docker-compose.yml" "${DEPLOY_PATH}/"
    remote_copy "docker-compose.prod.yml" "${DEPLOY_PATH}/"
    print_success "Server setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Create .env file on server at ${DEPLOY_PATH}/.env"
    echo "2. Run: ./scripts/deploy.sh deploy"
}

cmd_deploy() {
    print_header "Deploying"
    check_config

    IMAGE_TAG="${IMAGE_TAG:-latest}"

    echo "Copying compose files..."
    remote_copy "docker-compose.yml" "${DEPLOY_PATH}/"
    remote_copy "docker-compose.prod.yml" "${DEPLOY_PATH}/"

    echo "Deploying with IMAGE_TAG=${IMAGE_TAG}..."
    remote_exec "
        cd ${DEPLOY_PATH}
        export IMAGE_TAG=${IMAGE_TAG}

        # Pull latest image
        docker compose ${COMPOSE_FILES} pull app

        # Save current image for rollback
        CURRENT=\$(docker compose ${COMPOSE_FILES} images app -q 2>/dev/null || true)
        [ ! -z \"\$CURRENT\" ] && docker tag \$CURRENT ${PROJECT_NAME}-app:rollback 2>/dev/null || true

        # Deploy
        docker compose ${COMPOSE_FILES} up -d

        # Run migrations
        docker compose ${COMPOSE_FILES} exec -T app npx prisma migrate deploy

        # Health check
        echo 'Running health check...'
        sleep 10
        docker compose ${COMPOSE_FILES} exec -T app curl -f http://localhost:3000/api/health

        # Cleanup old images
        docker image prune -f
    "
    print_success "Deployment complete!"
}

cmd_rollback() {
    print_header "Rolling Back"
    check_config

    remote_exec "
        cd ${DEPLOY_PATH}
        if docker image inspect ${PROJECT_NAME}-app:rollback &> /dev/null; then
            docker tag ${PROJECT_NAME}-app:rollback ghcr.io/\${GITHUB_REPOSITORY}:latest
            docker compose ${COMPOSE_FILES} up -d
            echo 'Rollback complete!'
        else
            echo 'No rollback image found!'
            exit 1
        fi
    "
    print_success "Rollback complete!"
}

cmd_logs() {
    check_config
    SERVICE="${1:-app}"
    LINES="${2:-100}"
    remote_exec "cd ${DEPLOY_PATH} && docker compose ${COMPOSE_FILES} logs --tail=${LINES} -f ${SERVICE}"
}

cmd_backup() {
    print_header "Creating Backup"
    check_config

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    remote_exec "
        cd ${DEPLOY_PATH}
        docker compose ${COMPOSE_FILES} exec -T postgres pg_dump -U \${POSTGRES_USER:-postgres} \${POSTGRES_DB:-saas} | gzip > backups/backup_${TIMESTAMP}.sql.gz
    "
    print_success "Backup created: backup_${TIMESTAMP}.sql.gz"
}

cmd_restore() {
    print_header "Restoring Backup"
    check_config

    if [ -z "$2" ]; then
        print_error "Please specify backup file"
        echo "Usage: ./scripts/deploy.sh restore <backup_file.sql.gz>"
        exit 1
    fi

    BACKUP_FILE="$2"
    remote_exec "
        cd ${DEPLOY_PATH}
        if [ -f backups/${BACKUP_FILE} ]; then
            gunzip -c backups/${BACKUP_FILE} | docker compose ${COMPOSE_FILES} exec -T postgres psql -U \${POSTGRES_USER:-postgres} \${POSTGRES_DB:-saas}
            echo 'Restore complete!'
        else
            echo 'Backup file not found!'
            exit 1
        fi
    "
    print_success "Restore complete!"
}

cmd_ssh() {
    check_config
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}"
}

cmd_help() {
    echo "Usage: ./scripts/deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  setup     Set up server (install Docker, create directories)"
    echo "  deploy    Deploy latest version"
    echo "  rollback  Rollback to previous version"
    echo "  logs      View logs (optionally: logs <service> <lines>)"
    echo "  backup    Create database backup"
    echo "  restore   Restore database backup"
    echo "  ssh       SSH into server"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DEPLOY_HOST   Server hostname (required)"
    echo "  DEPLOY_USER   SSH user (default: deploy)"
    echo "  DEPLOY_PATH   Install path (default: /opt/\$PROJECT_NAME)"
    echo "  IMAGE_TAG     Docker image tag (default: latest)"
}

case "${1:-help}" in
    setup)    cmd_setup ;;
    deploy)   cmd_deploy ;;
    rollback) cmd_rollback ;;
    logs)     cmd_logs "$2" "$3" ;;
    backup)   cmd_backup ;;
    restore)  cmd_restore "$@" ;;
    ssh)      cmd_ssh ;;
    help)     cmd_help ;;
    *)        print_error "Unknown command: $1"; cmd_help; exit 1 ;;
esac
