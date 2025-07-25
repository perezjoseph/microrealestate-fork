#!/bin/bash

# Build script for MicroRealEstate services
set -e

echo " Building MicroRealEstate Services"

# Build services without workspace dependencies first
echo " Building WhatsApp service..."
docker compose build whatsapp

# Try to build services with simpler dependencies
echo " Building services with workspace dependencies..."

# Build services one by one to isolate issues
services=("authenticator" "emailer" "api" "gateway" "pdfgenerator" "tenantapi" "landlord-frontend" "tenant-frontend")

for service in "${services[@]}"; do
    echo " Building $service..."
    if docker compose build "$service"; then
        echo " $service built successfully"
    else
        echo " $service build failed"
    fi
done

echo " Build process completed!"
