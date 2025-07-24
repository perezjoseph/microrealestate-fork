#!/bin/bash

# Validation script for GitHub Actions CI setup
# This script tests the same commands that will run in CI

set -e

echo "🔍 Validating GitHub Actions CI Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

echo "1. Checking Node.js version..."
node_version=$(node --version)
required_version="v22"
if [[ $node_version == v22* ]]; then
    print_status 0 "Node.js version: $node_version (✅ Compatible)"
elif [[ $node_version == v20* ]]; then
    print_warning "Node.js version: $node_version (⚠️ May work, but CI uses v22)"
else
    print_warning "Node.js version: $node_version (❌ CI requires v22.x)"
    echo "  💡 To fix locally:"
    echo "     - Install Node.js 22: https://nodejs.org/"
    echo "     - Or use nvm: nvm install 22 && nvm use 22"
    echo "     - Or use the .nvmrc file: nvm use"
fi

echo ""
echo "2. Checking Yarn version..."
yarn_version=$(yarn --version)
print_status 0 "Yarn version: $yarn_version"

echo ""
echo "3. Testing workspace dependency installation..."
if yarn install --immutable --check-cache; then
    print_status 0 "Workspace dependencies are up to date"
else
    echo "Installing dependencies..."
    yarn install --immutable
    print_status $? "Workspace dependencies installed"
fi

echo ""
echo "4. Testing types build..."
yarn workspace @microrealestate/types run build
print_status $? "Types build completed"

echo ""
echo "5. Testing workspace linting..."
if yarn lint; then
    print_status 0 "Linting passed"
else
    print_warning "Linting found issues (non-critical for CI)"
fi

echo ""
echo "6. Checking Docker setup..."
if command -v docker &> /dev/null; then
    print_status 0 "Docker is available"
else
    print_status 1 "Docker is not available"
    exit 1
fi

if command -v docker compose &> /dev/null; then
    print_status 0 "Docker Compose is available"
else
    print_status 1 "Docker Compose is not available"
    exit 1
fi

echo ""
echo "7. Checking service definitions in docker-compose.yml..."
services=("valkey" "mongo" "gateway" "api" "authenticator" "emailer" "tenantapi" "whatsapp" "tenant-frontend" "landlord-frontend")

for service in "${services[@]}"; do
    if grep -q "^  $service:" docker-compose.yml; then
        print_status 0 "Service '$service' found in docker-compose.yml"
    else
        print_status 1 "Service '$service' not found in docker-compose.yml"
    fi
done

echo ""
echo "8. Checking Dockerfiles..."
dockerfiles=(
    "webapps/tenant/Dockerfile"
    "webapps/tenant/Dockerfile.spanish"
    "webapps/landlord/Dockerfile"
    "services/api/Dockerfile"
    "services/authenticator/Dockerfile"
    "services/emailer/Dockerfile"
    "services/gateway/Dockerfile"
    "services/pdfgenerator/Dockerfile"
    "services/resetservice/Dockerfile"
    "services/tenantapi/Dockerfile"
    "services/whatsapp/Dockerfile"
)

for dockerfile in "${dockerfiles[@]}"; do
    if [ -f "$dockerfile" ]; then
        print_status 0 "Dockerfile found: $dockerfile"
    else
        print_warning "Dockerfile not found: $dockerfile"
    fi
done

echo ""
echo "9. Testing Docker build (tenant-frontend)..."
if docker build -f webapps/tenant/Dockerfile -t test-tenant-frontend . > /dev/null 2>&1; then
    print_status 0 "Tenant frontend Docker build successful"
    docker rmi test-tenant-frontend > /dev/null 2>&1
else
    print_status 1 "Tenant frontend Docker build failed"
fi

echo ""
echo "10. Checking environment file template..."
if [ -f ".env" ]; then
    print_status 0 "Environment file exists"
else
    print_warning "No .env file found - CI will create one"
fi

echo ""
echo "11. Testing docker-compose syntax..."
if docker compose config > /dev/null 2>&1; then
    print_status 0 "Docker Compose configuration is valid"
else
    print_status 1 "Docker Compose configuration has errors"
fi

echo ""
echo "🎉 Validation Complete!"
echo "======================"
echo ""
echo "Summary:"
echo "- The CI workflow should work with your current setup"
echo "- Make sure to push to a branch first to test the workflow"
echo "- Monitor the GitHub Actions tab for the first run"
echo ""
echo "If you encounter issues:"
echo "1. Check the GitHub Actions logs"
echo "2. Verify all required secrets are set in your repository"
echo "3. Ensure your repository has the necessary permissions"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Fix GitHub Actions CI workflow'"
echo "3. git push origin your-branch-name"
echo "4. Check GitHub Actions tab for workflow execution"
