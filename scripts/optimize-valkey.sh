#!/bin/bash

# Valkey Performance Optimization Script for MicroRealEstate
# This script optimizes Valkey configuration for property management workloads

echo "Starting Valkey optimization for MicroRealEstate..."

# Check if Valkey is running
if ! docker compose ps valkey | grep -q "Up"; then
    echo "Valkey is not running. Please start the services first."
    exit 1
fi

# Load environment variables
source .env 2>/dev/null || true
VALKEY_PASSWORD=${REDIS_PASSWORD:-5b69073c3b32f4206c24556d01e7f658c07fa657be57ff00afc29f9c13b0727a}

echo "Current Valkey statistics:"
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" info memory | grep used_memory_human

echo "Applying performance optimizations..."

# Set optimal memory policy for property management
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set maxmemory-policy allkeys-lru

# Optimize for property/tenant data access patterns
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set hash-max-ziplist-entries 512
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set hash-max-ziplist-value 64

# Optimize for session management
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set timeout 300

# Set up slow query logging
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set slowlog-log-slower-than 10000
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" config set slowlog-max-len 128

echo "Valkey optimization complete!"

echo "Performance recommendations applied:"
echo "   - Memory policy: allkeys-lru (optimal for caching)"
echo "   - Hash optimization: enabled for property/tenant data"
echo "   - Session timeout: 5 minutes"
echo "   - Slow query logging: enabled"

echo "To monitor performance:"
echo "   curl http://localhost:8600/valkey/stats (when monitor is running)"

echo "Testing key operations:"
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" set test:performance "Valkey optimized!"
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" get test:performance
docker compose exec valkey valkey-cli -a "$VALKEY_PASSWORD" del test:performance

echo "Optimization complete! Your Valkey instance is now optimized for property management workloads."
