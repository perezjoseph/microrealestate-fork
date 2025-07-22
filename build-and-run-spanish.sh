#!/bin/bash

# Stop any running containers
echo "Stopping any running containers..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Build the custom images
echo "Building custom images with Spanish support..."
cd /home/jperez/microrealestate
docker compose -f docker-compose.spanish.yml build landlord-frontend tenant-frontend

# Run the stack
echo "Starting MicroRealEstate with Spanish as default language..."
docker compose -f docker-compose.spanish.yml up -d

echo ""
echo "Application is starting up..."
echo "Landlord interface will be available at: http://localhost:8082/landlord"
echo "Tenant interface will be available at: http://localhost:8082/tenant"
echo "Both interfaces will default to Spanish language"
