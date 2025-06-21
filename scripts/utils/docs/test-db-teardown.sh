#!/bin/bash
# Teardown test database containers

echo "🧹 Stopping test database containers..."

docker-compose -f docker-compose.test.yml down

echo "✅ Test database containers stopped"

# Optional: Remove volumes to start fresh next time
read -p "Remove test data volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Test data volumes removed"
fi