#!/bin/bash
# Setup test database containers

echo "🚀 Starting test database containers..."

# Start test containers
docker-compose -f docker-compose.test.yml up -d test-postgres test-redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec myexpo-test-postgres pg_isready -U myexpo > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Test PostgreSQL is ready on port 5433"

# Run migrations on test database
echo "🔧 Running migrations on test database..."
APP_ENV=test bun run db:push

echo "✅ Test database setup complete!"
echo ""
echo "📝 Test database connection:"
echo "   postgresql://myexpo:myexpo123@localhost:5433/myexpo_test"
echo ""
echo "To run tests:"
echo "   bun run test:integration"