#!/bin/bash
# Simple start script for demo - bypasses Docker requirements

echo "🚀 Starting Healthcare Alert System - Demo Mode"
echo "================================================"
echo ""
echo "⚠️  Note: Running without Docker services"
echo "   - No real-time WebSocket updates"
echo "   - No email notifications"
echo "   - Using external database if configured"
echo ""

# Kill any existing processes on required ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:19000 | xargs kill -9 2>/dev/null || true
lsof -ti:19001 | xargs kill -9 2>/dev/null || true

# Source environment variables
if [ -f .env.local ]; then
    echo "📋 Loading environment variables..."
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if we have a database URL
if [ -z "$DATABASE_URL" ] && [ -z "$LOCAL_DATABASE_URL" ]; then
    echo "⚠️  No database URL found in environment"
    echo "   The app will start but may have limited functionality"
    echo ""
fi

echo "📱 Demo Accounts (if database is connected):"
echo "   Admin: admin@hospital.demo"
echo "   Doctor: adella23@hotmail.com"
echo "   Nurse: mason.bailey19@hotmail.com"
echo "   (Password: use any password)"
echo ""

echo "🌐 Starting Expo in web mode..."
echo "================================================"
echo ""

# Start Expo with web flag
if command -v bunx &> /dev/null; then
    bunx expo start --web
elif command -v npx &> /dev/null; then
    npx expo start --web
else
    echo "❌ Neither bunx nor npx found. Please install bun or npm."
    exit 1
fi