#!/bin/bash

# EAS Quick Setup Script
# This script sets up EAS Build for the Healthcare Alert System

set -e

echo "🚀 EAS Quick Setup for Healthcare Alert System"
echo "=============================================="
echo

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

# Check if logged in
echo
echo "🔐 Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "Please login to your Expo account:"
    eas login
else
    WHOAMI=$(eas whoami)
    echo "✅ Logged in as: $WHOAMI"
fi

# Check if eas.json exists
if [ ! -f "eas.json" ]; then
    echo
    echo "❌ eas.json not found!"
    echo "This file has been created for you. Please check the configuration."
    exit 1
fi

# Display project info
echo
echo "📱 Project Information:"
echo "----------------------"
if [ -f "app.json" ]; then
    PROJECT_NAME=$(grep -o '"name": *"[^"]*"' app.json | grep -o '"[^"]*"$' | tr -d '"')
    BUNDLE_ID=$(grep -o '"bundleIdentifier": *"[^"]*"' app.json | grep -o '"[^"]*"$' | tr -d '"')
    PACKAGE_NAME=$(grep -o '"package": *"[^"]*"' app.json | grep -o '"[^"]*"$' | tr -d '"')
    
    echo "Project Name: $PROJECT_NAME"
    echo "iOS Bundle ID: $BUNDLE_ID"
    echo "Android Package: $PACKAGE_NAME"
fi

# Check git status
echo
echo "📝 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "EAS Build requires a clean git working directory"
    echo
    read -p "Would you like to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "chore: prepare for EAS build"
        echo "✅ Changes committed"
    fi
else
    echo "✅ Git working directory is clean"
fi

# Menu
echo
echo "🎯 What would you like to do?"
echo "1) Setup EAS (first time)"
echo "2) Build for development"
echo "3) Build for preview/testing"
echo "4) Build for production"
echo "5) Check build status"
echo "6) Submit to app stores"
echo "7) Exit"
echo

read -p "Select an option (1-7): " choice

case $choice in
    1)
        echo
        echo "🔧 Running EAS setup..."
        bun scripts/deployment/manage-eas.ts setup
        ;;
    2)
        echo
        echo "🏗️  Building for development..."
        bun scripts/deployment/manage-eas.ts build --platform=all --profile=development
        ;;
    3)
        echo
        echo "🧪 Building for preview..."
        bun scripts/deployment/manage-eas.ts build --platform=all --profile=preview
        ;;
    4)
        echo
        echo "🚀 Building for production..."
        echo "⚠️  This will create production builds for app stores!"
        read -p "Are you sure? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            bun scripts/deployment/manage-eas.ts build --platform=all --profile=production
        fi
        ;;
    5)
        echo
        echo "📊 Checking build status..."
        bun scripts/deployment/manage-eas.ts status
        ;;
    6)
        echo
        echo "📤 Submitting to app stores..."
        echo "⚠️  Make sure you have a successful production build first!"
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            bun scripts/deployment/manage-eas.ts submit --platform=all
        fi
        ;;
    7)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo
echo "✅ Done! Check the output above for any next steps."
echo
echo "📚 For more information, see:"
echo "   - docs/guides/EAS_DEPLOYMENT_GUIDE.md"
echo "   - https://docs.expo.dev/eas/"