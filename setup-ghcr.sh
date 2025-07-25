#!/bin/bash

# Setup script for GitHub Container Registry
# This script helps authenticate and push images to GHCR

echo "🔐 GitHub Container Registry Setup"
echo "=================================="
echo ""

# Check if user is already logged in
if docker info | grep -q "Username:"; then
    echo "✅ Already logged into Docker registry"
else
    echo "🔑 Please log into GitHub Container Registry:"
    echo "   docker login ghcr.io"
    echo ""
    echo "   Use your GitHub username and a Personal Access Token with 'write:packages' scope"
    echo "   Create token at: https://github.com/settings/tokens"
    echo ""
    read -p "Press Enter after logging in..."
fi

echo ""
echo "📋 Available commands:"
echo "   ./push-to-ghcr.sh                           - Push all images to registry"
echo "   APP_PORT=8080 docker-compose -f docker-compose.ghcr.yml up -d  - Run with GHCR images"
echo ""
echo "🏷️  Registry: ghcr.io/perezjoseph/microrealestate-whatsapp/"
echo ""
echo "📦 Services that will be pushed:"
echo "   - gateway"
echo "   - authenticator"
echo "   - api"
echo "   - tenantapi"
echo "   - pdfgenerator"
echo "   - emailer"
echo "   - whatsapp"
echo "   - landlord-frontend"
echo "   - tenant-frontend"
echo ""
echo "Ready to push images? Run: ./push-to-ghcr.sh"