#!/bin/bash

# Healthcare Alert System - Docker Development Environment Manager
# This script helps manage the Docker development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        print_color $RED "Error: Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_color $YELLOW "Warning: .env file not found. Creating from template..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_color $GREEN "Created .env file from .env.example"
            print_color $YELLOW "Please update the values in .env file"
        else
            print_color $RED "Error: .env.example not found"
            exit 1
        fi
    fi
}

# Function to start services
start_services() {
    print_color $BLUE "Starting Healthcare development environment..."
    
    # Start core services first
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    print_color $YELLOW "Waiting for database to be ready..."
    sleep 5
    
    # Start application services
    docker-compose -f docker-compose.dev.yml up -d app websocket
    
    # Optionally start additional services
    if [ "$1" == "--with-tools" ]; then
        print_color $BLUE "Starting development tools..."
        docker-compose -f docker-compose.dev.yml up -d mailhog pgadmin
    fi
    
    # Start scripts container
    docker-compose -f docker-compose.dev.yml up -d scripts
    
    print_color $GREEN "✅ Development environment started!"
    print_services_info
}

# Function to stop services
stop_services() {
    print_color $BLUE "Stopping Healthcare development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_color $GREEN "✅ Development environment stopped!"
}

# Function to restart services
restart_services() {
    stop_services
    sleep 2
    start_services $1
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs -f $service
    fi
}

# Function to run scripts in container
run_script() {
    local script_path=$1
    shift
    print_color $BLUE "Running script in container: $script_path"
    docker-compose -f docker-compose.dev.yml exec scripts bun run $script_path "$@"
}

# Function to access container shell
shell() {
    local service=${1:-app}
    print_color $BLUE "Accessing $service container shell..."
    docker-compose -f docker-compose.dev.yml exec $service sh
}

# Function to run database migrations
migrate() {
    print_color $BLUE "Running database migrations..."
    docker-compose -f docker-compose.dev.yml exec app bun run db:push
    print_color $GREEN "✅ Migrations completed!"
}

# Function to seed database
seed() {
    print_color $BLUE "Seeding database with test data..."
    docker-compose -f docker-compose.dev.yml exec scripts bun run scripts/users/manage-users.ts setup-healthcare
    print_color $GREEN "✅ Database seeded!"
}

# Function to reset database
reset_db() {
    print_color $YELLOW "⚠️  This will delete all data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_color $BLUE "Resetting database..."
        docker-compose -f docker-compose.dev.yml exec app bun run db:push --force
        seed
        print_color $GREEN "✅ Database reset completed!"
    else
        print_color $YELLOW "Database reset cancelled."
    fi
}

# Function to show service information
print_services_info() {
    print_color $BLUE "\n📋 Service URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Expo Dev:      http://localhost:8081"
    echo "🔌 API Server:    http://localhost:3000"
    echo "🔄 WebSocket:     ws://localhost:3002"
    echo "🗄️  PostgreSQL:   localhost:5432"
    echo "📦 Redis:         localhost:6379"
    
    if docker ps | grep -q healthcare-mailhog; then
        echo "📧 MailHog:       http://localhost:8025"
    fi
    
    if docker ps | grep -q healthcare-pgadmin; then
        echo "🗃️  pgAdmin:      http://localhost:5050"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_color $YELLOW "\n💡 Quick Commands:"
    echo "  docker-dev.sh logs app      - View app logs"
    echo "  docker-dev.sh shell         - Access app shell"
    echo "  docker-dev.sh shell scripts - Access scripts shell"
    echo "  docker-dev.sh migrate       - Run migrations"
    echo "  docker-dev.sh seed          - Seed database"
}

# Function to show help
show_help() {
    echo "Healthcare Alert System - Docker Development Manager"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start [--with-tools]  Start development environment"
    echo "  stop                  Stop development environment"
    echo "  restart               Restart development environment"
    echo "  logs [service]        Show logs (optionally for specific service)"
    echo "  shell [service]       Access container shell (default: app)"
    echo "  migrate               Run database migrations"
    echo "  seed                  Seed database with test data"
    echo "  reset-db              Reset and reseed database"
    echo "  run-script <path>     Run a script in the scripts container"
    echo "  status                Show service status"
    echo "  help                  Show this help message"
    echo ""
    echo "Services:"
    echo "  app       - Main Expo application"
    echo "  postgres  - PostgreSQL database"
    echo "  redis     - Redis cache"
    echo "  websocket - WebSocket server"
    echo "  scripts   - Script runner container"
    echo "  mailhog   - Email testing (with --with-tools)"
    echo "  pgadmin   - Database UI (with --with-tools)"
    echo ""
    echo "Examples:"
    echo "  $0 start --with-tools"
    echo "  $0 logs app"
    echo "  $0 run-script scripts/users/manage-users.ts list"
}

# Main command handler
main() {
    check_docker
    check_env
    
    case "${1:-help}" in
        start)
            start_services $2
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services $2
            ;;
        logs)
            show_logs $2
            ;;
        shell)
            shell $2
            ;;
        migrate)
            migrate
            ;;
        seed)
            seed
            ;;
        reset-db)
            reset_db
            ;;
        run-script)
            shift
            run_script "$@"
            ;;
        status)
            docker-compose -f docker-compose.dev.yml ps
            print_services_info
            ;;
        help)
            show_help
            ;;
        *)
            print_color $RED "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"