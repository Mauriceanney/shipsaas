#!/bin/bash
# =============================================================================
# CI/CD Deployment Script
# =============================================================================
# Reusable script for deploy, rollback, and scale operations.
# Called by GitHub Actions workflow to reduce duplication.
#
# Usage:
#   ci-deploy.sh deploy <stack_name> <compose_file> <docker_image> <image_tag>
#   ci-deploy.sh rollback <stack_name> <compose_file> <docker_image>
#   ci-deploy.sh scale <stack_name> <replicas>
#
# Environment Variables (for deploy):
#   DOCKERHUB_USERNAME - Docker Hub username
#   DOCKERHUB_TOKEN    - Docker Hub access token
# =============================================================================

set -e

ACTION="${1:-}"
STACK_NAME="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Deploy Action
# =============================================================================
deploy() {
  local COMPOSE_FILE="${1:-}"
  local DOCKER_IMAGE="${2:-}"
  local IMAGE_TAG="${3:-}"

  if [ -z "$COMPOSE_FILE" ] || [ -z "$DOCKER_IMAGE" ] || [ -z "$IMAGE_TAG" ]; then
    log_error "Usage: ci-deploy.sh deploy <stack_name> <compose_file> <docker_image> <image_tag>"
    exit 1
  fi

  log_info "Starting deployment: ${STACK_NAME} with tag ${IMAGE_TAG}"

  # Login to Docker Hub
  if [ -n "$DOCKERHUB_TOKEN" ] && [ -n "$DOCKERHUB_USERNAME" ]; then
    echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
  fi

  # Save current tag for rollback
  if [ -f .current_image_tag ]; then
    cp .current_image_tag .previous_image_tag
    log_info "Previous tag saved: $(cat .previous_image_tag)"
  fi
  echo "$IMAGE_TAG" > .current_image_tag

  # Pull new image
  log_info "Pulling image: ${DOCKER_IMAGE}:${IMAGE_TAG}"
  docker pull "${DOCKER_IMAGE}:${IMAGE_TAG}"

  # Deploy stack
  log_info "Deploying stack: ${STACK_NAME}"
  export DOCKER_IMAGE
  export IMAGE_TAG
  docker stack deploy -c docker-compose.yml -c "${COMPOSE_FILE}" "${STACK_NAME}" --with-registry-auth

  # Wait for services to start
  log_info "Waiting for services to start..."
  sleep 20

  # Run migrations
  log_info "Running database migrations..."
  CONTAINER=$(docker ps -q -f "name=${STACK_NAME}_app" | head -1)
  if [ -n "$CONTAINER" ]; then
    docker exec "$CONTAINER" npx prisma migrate deploy || log_warn "Migration failed or not needed"
  else
    log_warn "No app container found for migrations"
  fi

  # Health check with retries
  log_info "Running health checks..."
  for i in 1 2 3 4 5; do
    sleep 5
    if curl -sf http://localhost:3000/api/health > /dev/null; then
      log_info "Health check passed!"
      break
    fi
    if [ "$i" -eq 5 ]; then
      log_error "Health check failed after 5 attempts"
      exit 1
    fi
    log_warn "Health check attempt $i failed, retrying..."
  done

  # Cleanup old images
  docker image prune -f

  log_info "Deployment complete!"
}

# =============================================================================
# Rollback Action
# =============================================================================
rollback() {
  local COMPOSE_FILE="${1:-}"
  local DOCKER_IMAGE="${2:-}"

  if [ -z "$COMPOSE_FILE" ] || [ -z "$DOCKER_IMAGE" ]; then
    log_error "Usage: ci-deploy.sh rollback <stack_name> <compose_file> <docker_image>"
    exit 1
  fi

  if [ ! -f .previous_image_tag ]; then
    log_error "No previous image tag found. Cannot rollback."
    exit 1
  fi

  PREVIOUS_TAG=$(cat .previous_image_tag)
  log_info "Rolling back ${STACK_NAME} to: ${PREVIOUS_TAG}"

  # Deploy with previous tag
  export DOCKER_IMAGE
  export IMAGE_TAG="$PREVIOUS_TAG"
  docker stack deploy -c docker-compose.yml -c "${COMPOSE_FILE}" "${STACK_NAME}" --with-registry-auth

  # Wait and verify
  log_info "Waiting for rollback to complete..."
  sleep 15

  if curl -sf http://localhost:3000/api/health > /dev/null; then
    log_info "Rollback successful! Health check passed."
  else
    log_error "Rollback completed but health check failed"
    exit 1
  fi
}

# =============================================================================
# Scale Action
# =============================================================================
scale() {
  local REPLICAS="${1:-}"

  if [ -z "$REPLICAS" ]; then
    log_error "Usage: ci-deploy.sh scale <stack_name> <replicas>"
    exit 1
  fi

  # Validate replicas
  if ! [[ "$REPLICAS" =~ ^[0-9]+$ ]]; then
    log_error "Invalid replicas value: $REPLICAS"
    exit 1
  fi

  if [ "$REPLICAS" -lt 1 ] || [ "$REPLICAS" -gt 20 ]; then
    log_error "Replicas must be between 1 and 20"
    exit 1
  fi

  log_info "Scaling ${STACK_NAME}_app to ${REPLICAS} replicas"
  docker service scale "${STACK_NAME}_app=${REPLICAS}"

  sleep 10

  log_info "Current service status:"
  docker service ls --filter "name=${STACK_NAME}_app"
}

# =============================================================================
# Main
# =============================================================================
case "$ACTION" in
  deploy)
    deploy "$3" "$4" "$5"
    ;;
  rollback)
    rollback "$3" "$4"
    ;;
  scale)
    scale "$3"
    ;;
  *)
    log_error "Unknown action: $ACTION"
    echo "Usage: ci-deploy.sh <deploy|rollback|scale> <stack_name> [args...]"
    exit 1
    ;;
esac
