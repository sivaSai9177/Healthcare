#!/bin/bash

# Healthcare Alert System - Unified Docker Development Environment Startup
# This script manages all services needed for development

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
        print_color $RED "Error: Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to cleanup existing containers
cleanup_existing() {
    print_color $BLUE "🧹 Cleaning up existing containers..."
    
    # Stop any containers using our ports
    local containers=$(docker ps -q --filter "publish=5432" --filter "publish=6379" --filter "publish=3002" --filter "publish=8081" --filter "publish=3000")
    if [ -n "$containers" ]; then
        print_color $YELLOW "Stopping containers using our ports..."
        docker stop $containers >/dev/null 2>&1 || true
    fi
    
    # Remove orphaned containers
    docker-compose -f docker-compose.dev.yml down --remove-orphans >/dev/null 2>&1 || true
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local max_attempts=30
    local attempt=0
    
    print_color $YELLOW "⏳ Waiting for $service_name..."
    
    while [ $attempt -lt $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            print_color $GREEN "✅ $service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    print_color $RED "❌ $service_name failed to start"
    return 1
}

# Function to run database migrations
run_migrations() {
    print_color $BLUE "📝 Running database migrations..."
    
    # Export DATABASE_URL for migrations
    export DATABASE_URL="postgres://postgres:postgres@localhost:5432/healthcare_dev"
    
    # Run migrations
    if bun run db:push; then
        print_color $GREEN "✅ Migrations completed successfully!"
    else
        print_color $RED "❌ Migration failed"
        return 1
    fi
}

# Function to seed database
seed_database() {
    print_color $BLUE "🌱 Seeding database with healthcare data..."
    
    # Run the manage-users script to create healthcare setup
    if bun run scripts/users/manage-users.ts setup-healthcare; then
        print_color $GREEN "✅ Database seeded successfully!"
    else
        print_color $YELLOW "⚠️  Database seeding failed, but continuing..."
    fi
}

# Main execution
main() {
    print_color $BLUE "🏥 Starting Healthcare Alert System Development Environment\n"
    
    # Check Docker
    check_docker
    
    # Cleanup existing containers
    cleanup_existing
    
    # Start core services
    print_color $BLUE "🚀 Starting core services..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # Wait for PostgreSQL
    wait_for_service "PostgreSQL" "localhost" "5432"
    
    # Wait for Redis
    wait_for_service "Redis" "localhost" "6379"
    
    # Run migrations
    run_migrations
    
    # Seed database if requested
    if [ "$1" != "--no-seed" ]; then
        seed_database
    fi
    
    # Start remaining services
    print_color $BLUE "🚀 Starting application services..."
    
    # Start WebSocket server
    docker-compose -f docker-compose.dev.yml up -d websocket
    
    # Start scripts container
    docker-compose -f docker-compose.dev.yml up -d scripts
    
    # Start optional services if requested
    if [ "$1" == "--with-tools" ] || [ "$2" == "--with-tools" ]; then
        print_color $BLUE "🔧 Starting development tools..."
        docker-compose -f docker-compose.dev.yml up -d mailhog pgadmin
    fi
    
    # Print service information
    print_color $BLUE "\n📋 Service URLs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🗄️  PostgreSQL:   localhost:5432"
    echo "📦 Redis:         localhost:6379"
    echo "🔄 WebSocket:     ws://localhost:3002"
    echo "🐳 Scripts:       docker exec -it healthcare-scripts bash"
    
    if [ "$1" == "--with-tools" ] || [ "$2" == "--with-tools" ]; then
        echo "📧 MailHog:       http://localhost:8025"
        echo "🗃️  pgAdmin:      http://localhost:5050"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    print_color $YELLOW "\n📱 Demo Credentials:"
    echo "   Operator: operator@hospital.com / password123"
    echo "   Nurse: doremon@gmail.com / password123"
    echo "   Doctor: doctor@hospital.com / password123"
    echo "   Admin: admin@hospital.com / password123"
    
    print_color $GREEN "\n✅ Docker environment is ready!"
    print_color $BLUE "\n🚀 Now start Expo in a separate terminal:"
    echo "   bun run dev"
    echo "   # or"
    echo "   expo start --host lan"
    
    print_color $YELLOW "\n💡 Useful Commands:"
    echo "   docker exec -it healthcare-scripts bash    # Access scripts container"
    echo "   docker-compose -f docker-compose.dev.yml logs -f app    # View app logs"
    echo "   ./scripts/docker-dev.sh stop    # Stop all services"
}

# Handle command line arguments
case "${1:-start}" in
    stop)
        print_color $BLUE "🛑 Stopping all services..."
        docker-compose -f docker-compose.dev.yml down
        print_color $GREEN "✅ All services stopped!"
        ;;
    restart)
        print_color $BLUE "🔄 Restarting services..."
        docker-compose -f docker-compose.dev.yml down
        sleep 2
        main "$2"
        ;;
    logs)
        docker-compose -f docker-compose.dev.yml logs -f ${2:-}
        ;;
    status)
        docker-compose -f docker-compose.dev.yml ps
        ;;
    *)
        main "$@"
        ;;
esac