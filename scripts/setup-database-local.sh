#!/bin/bash

# One-time database setup script
# This sets up the database schema and demo data

echo "🗄️  Setting up local database..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start local database if not already running
echo "🗄️  Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.local.yml up -d postgres-local redis-local

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose -f docker-compose.local.yml exec -T postgres-local pg_isready -U myexpo > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# Run migrations
echo ""
echo "📋 Running database migrations..."
APP_ENV=local DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" drizzle-kit push --config=drizzle.config.ts

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

# Setup healthcare demo data
echo "🏥 Setting up healthcare demo data..."
APP_ENV=local DATABASE_URL="postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev" bun scripts/setup-healthcare-local.ts

if [ $? -ne 0 ]; then
    echo "❌ Healthcare data setup failed"
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📱 Demo Credentials:"
echo "   Operator: johncena@gmail.com (any password)"
echo "   Nurse: doremon@gmail.com (any password)" 
echo "   Doctor: johndoe@gmail.com (any password)"
echo "   Head Doctor: saipramod273@gmail.com (any password)"
echo ""
echo "You can now run: bun run local:healthcare"