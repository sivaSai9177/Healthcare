#!/bin/bash

echo "🧹 Cleaning up healthcare services..."

# Kill WebSocket server
echo "Stopping WebSocket server..."
pkill -f "websocket" 2>/dev/null || true
pkill -f "3002" 2>/dev/null || true
./scripts/check-port.sh kill 3002

# Kill Email server
echo "Stopping Email server..."
pkill -f "email-server" 2>/dev/null || true
pkill -f "3001" 2>/dev/null || true
./scripts/check-port.sh kill 3001

# Kill any expo processes
echo "Stopping Expo server..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "8081" 2>/dev/null || true

# Stop docker containers
echo "Stopping Docker containers..."
docker stop myexpo-websocket-local 2>/dev/null || true
docker stop myexpo-email-local 2>/dev/null || true

# Clean up log files
echo "Cleaning up logs..."
rm -f logs/*.log

echo "✅ Cleanup complete!"