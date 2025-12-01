#!/bin/bash

# Fascinito POS System - Docker-Based Build Script
# This script automates building and deploying using Docker

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

check_docker() {
    print_header "Checking Docker Installation"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Install Docker from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        echo "Install Docker Compose from https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose found: $(docker-compose --version)"

    echo ""
}

build_with_docker() {
    print_header "Building with Docker Compose"

    cd "$PROJECT_ROOT"

    print_info "Building backend Docker image..."
    docker-compose build backend
    print_success "Backend Docker image built successfully"

    print_info "Building frontend Docker image..."
    docker-compose build frontend
    print_success "Frontend Docker image built successfully"

    echo ""
}

build_backend_only() {
    print_header "Building Backend Only (Docker)"

    cd "$PROJECT_ROOT"

    print_info "Building backend Docker image..."
    docker-compose build backend
    print_success "Backend Docker image built successfully"

    echo ""
}

build_frontend_only() {
    print_header "Building Frontend Only (Docker)"

    cd "$PROJECT_ROOT"

    print_info "Building frontend Docker image..."
    docker-compose build frontend
    print_success "Frontend Docker image built successfully"

    echo ""
}

start_services() {
    print_header "Starting All Services"

    cd "$PROJECT_ROOT"

    print_info "Starting containers..."
    docker-compose up -d

    # Wait for services to start
    sleep 5

    print_success "All services started!"
    echo ""

    show_access_info
}

stop_services() {
    print_header "Stopping All Services"

    cd "$PROJECT_ROOT"

    print_info "Stopping containers..."
    docker-compose down

    print_success "All services stopped!"
    echo ""
}

show_access_info() {
    print_header "Service Access Information"
    echo ""
    echo -e "${GREEN}Frontend:${NC}"
    echo "  URL: http://localhost:3000"
    echo "  Status: $(check_service 3000 && echo 'Running ✓' || echo 'Starting...')"
    echo ""
    echo -e "${GREEN}Backend API:${NC}"
    echo "  URL: http://localhost:8080/api"
    echo "  Health Check: http://localhost:8080/api/actuator/health"
    echo "  Status: $(check_service 8080 && echo 'Running ✓' || echo 'Starting...')"
    echo ""
    echo -e "${GREEN}Database (MySQL):${NC}"
    echo "  Host: localhost"
    echo "  Port: 3307"
    echo "  User: root"
    echo "  Password: password"
    echo "  Database: pos_db"
    echo ""
    echo -e "${GREEN}Database Admin (Adminer):${NC}"
    echo "  URL: http://localhost:8081"
    echo ""
}

check_service() {
    local port=$1
    timeout 2 bash -c "</dev/tcp/localhost/$port" 2>/dev/null || return 1
}

view_logs() {
    cd "$PROJECT_ROOT"

    if [ "$1" == "backend" ]; then
        print_header "Backend Logs"
        docker-compose logs -f backend
    elif [ "$1" == "frontend" ]; then
        print_header "Frontend Logs"
        docker-compose logs -f frontend
    elif [ "$1" == "mysql" ]; then
        print_header "MySQL Logs"
        docker-compose logs -f mysql
    else
        print_header "All Service Logs"
        docker-compose logs -f
    fi
}

show_status() {
    print_header "Service Status"
    echo ""
    docker-compose ps
    echo ""
}

build_and_run() {
    print_header "Build and Run Complete Workflow"

    echo ""
    print_info "Step 1: Building Docker images..."
    build_with_docker

    echo ""
    print_info "Step 2: Starting services..."
    start_services
}

show_help() {
    cat << 'EOF'

Fascinito POS System - Docker Build Script

USAGE: ./build.sh [COMMAND]

COMMANDS:
  build              Build both frontend and backend images (default)
  backend            Build only backend image
  frontend           Build only frontend image
  start              Start all services (MySQL, Backend, Frontend, Adminer)
  stop               Stop all services
  status             Show status of all services
  logs               View logs from all services
  logs backend       View backend logs
  logs frontend      View frontend logs
  logs mysql         View MySQL logs
  rebuild            Full workflow: build images and start services
  check              Check Docker and Docker Compose installation
  help               Show this help message

EXAMPLES:
  # Build and run everything
  ./build.sh rebuild

  # Build only backend
  ./build.sh backend

  # Start services after building
  ./build.sh start

  # View real-time logs
  ./build.sh logs backend

  # Check Docker installation
  ./build.sh check

ACCESSING THE SERVICES:
  Frontend:     http://localhost:3000
  Backend API:  http://localhost:8080/api
  Database:     localhost:3307
  Adminer DB:   http://localhost:8081

DATABASE CREDENTIALS:
  User:     root
  Password: password
  Database: pos_db
  Port:     3307 (external) / 3306 (internal)

STOPPING SERVICES:
  Press Ctrl+C (if running in foreground)
  Or run: ./build.sh stop

TROUBLESHOOTING:
  # Check logs for errors
  ./build.sh logs

  # Restart all services
  ./build.sh stop && ./build.sh start

  # Remove all containers and volumes (WARNING: deletes data)
  docker-compose down -v

  # Rebuild images from scratch
  docker-compose build --no-cache

ENVIRONMENT VARIABLES:
  Frontend:  VITE_API_URL=http://localhost:8080/api
  Backend:   DB_HOST=mysql, DB_PORT=3306, JWT_SECRET=...

For more information, see BUILD.md and docker-compose.yml

EOF
}

# Main execution
main() {
    echo ""

    case "${1:-build}" in
        build)
            check_docker
            build_with_docker
            echo ""
            print_success "Build complete!"
            echo ""
            print_info "Next steps:"
            echo "  1. Start services: ./build.sh start"
            echo "  2. Or use: docker-compose up"
            echo "  3. Access: http://localhost:3000"
            echo ""
            ;;

        backend)
            check_docker
            build_backend_only
            print_success "Backend build complete!"
            echo ""
            ;;

        frontend)
            check_docker
            build_frontend_only
            print_success "Frontend build complete!"
            echo ""
            ;;

        start)
            check_docker
            start_services
            ;;

        stop)
            check_docker
            stop_services
            ;;

        status)
            check_docker
            show_status
            ;;

        logs)
            check_docker
            view_logs "$2"
            ;;

        rebuild)
            check_docker
            build_and_run
            ;;

        check)
            check_docker
            print_success "All Docker requirements satisfied!"
            echo ""
            ;;

        help)
            show_help
            ;;

        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
