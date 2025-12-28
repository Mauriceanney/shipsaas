#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="${PROJECT_NAME:-saas}"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"

print_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
}

cmd_up() {
    print_header "Starting Development Services"
    check_docker
    docker compose ${COMPOSE_FILES} up -d
    print_success "Services started!"
    echo ""
    echo "  PostgreSQL:  localhost:5432"
    echo "  Redis:       localhost:6379"
    echo "  Mailhog:     http://localhost:8025"
    echo "  MinIO:       http://localhost:9001"
}

cmd_down() {
    print_header "Stopping Services"
    check_docker
    docker compose ${COMPOSE_FILES} down
    print_success "Services stopped!"
}

cmd_restart() {
    print_header "Restarting Services"
    check_docker
    docker compose ${COMPOSE_FILES} restart
    print_success "Services restarted!"
}

cmd_status() {
    print_header "Service Status"
    check_docker
    docker compose ${COMPOSE_FILES} ps
}

cmd_reset() {
    print_header "Resetting Database"
    check_docker
    print_warning "This will delete all data. Continue? (y/N)"
    read -r response
    [[ ! "$response" =~ ^[Yy]$ ]] && exit 0
    docker compose ${COMPOSE_FILES} down -v
    docker compose ${COMPOSE_FILES} up -d
    sleep 5
    pnpm prisma db push
    print_success "Database reset!"
}

cmd_seed() {
    print_header "Seeding Base Data"
    pnpm prisma db seed
    print_success "Base data seeded!"
}

cmd_demo() {
    print_header "Seeding Demo Data"
    pnpm db:seed:demo
    print_success "Demo data seeded!"
    echo "  Demo: demo@example.com / demo123"
    echo "  Admin: admin@example.com / admin123"
}

cmd_logs() {
    docker compose ${COMPOSE_FILES} logs -f ${1:-}
}

cmd_clean() {
    print_header "Cleaning Up"
    check_docker
    print_warning "Remove all containers and volumes? (y/N)"
    read -r response
    [[ ! "$response" =~ ^[Yy]$ ]] && exit 0
    docker compose ${COMPOSE_FILES} down -v --rmi local --remove-orphans
    rm -rf node_modules .next
    print_success "Cleanup complete!"
}

cmd_help() {
    echo "Usage: ./scripts/dev.sh <command>"
    echo ""
    echo "Commands:"
    echo "  up        Start all development services"
    echo "  down      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Show service status"
    echo "  reset     Reset database (deletes all data)"
    echo "  seed      Seed base data"
    echo "  demo      Seed demo data"
    echo "  logs      Follow service logs (optionally specify service)"
    echo "  clean     Remove all containers, volumes, and dependencies"
    echo "  help      Show this help message"
}

case "${1:-help}" in
    up)      cmd_up ;;
    down)    cmd_down ;;
    restart) cmd_restart ;;
    status)  cmd_status ;;
    reset)   cmd_reset ;;
    seed)    cmd_seed ;;
    demo)    cmd_demo ;;
    logs)    cmd_logs "$2" ;;
    clean)   cmd_clean ;;
    help)    cmd_help ;;
    *)       print_error "Unknown command: $1"; cmd_help; exit 1 ;;
esac
