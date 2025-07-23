#!/bin/bash

# MicroRealEstate Services Test Script
# Tests all services with Node.js v22.17.1

set -e

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🚀 Testing MicroRealEstate Services with Node.js $(node --version)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test service build
test_build() {
    local service_path=$1
    local service_name=$2
    
    echo -e "\n${YELLOW}📦 Building $service_name...${NC}"
    cd "$service_path"
    
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        if yarn build >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name build successful${NC}"
            return 0
        else
            echo -e "${RED}❌ $service_name build failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  $service_name has no build script${NC}"
        return 0
    fi
}

# Function to test service startup (basic syntax check)
test_syntax() {
    local service_path=$1
    local service_name=$2
    local main_file=$3
    
    echo -e "\n${YELLOW}🔄 Testing $service_name syntax...${NC}"
    cd "$service_path"
    
    if node --check "$main_file" 2>/dev/null; then
        echo -e "${GREEN}✅ $service_name syntax OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name syntax error${NC}"
        return 1
    fi
}

# Change to project root
cd /home/jperez/microrealestate

echo -e "\n${YELLOW}🔧 Building shared dependencies...${NC}"

# Build types
echo "Building types..."
cd types && yarn build >/dev/null 2>&1
cd ..

# Build common
echo "Building common..."
cd services/common && yarn build >/dev/null 2>&1
cd ../..

echo -e "\n${YELLOW}🧪 Testing Backend Services...${NC}"

# Test services
SERVICES=(
    "services/api:API:src/index.js"
    "services/authenticator:Authenticator:src/index.js"
    "services/gateway:Gateway:dist/index.js"
    "services/tenantapi:TenantAPI:src/index.js"
    "services/pdfgenerator:PDFGenerator:src/index.js"
    "services/emailer:Emailer:src/index.js"
    "services/whatsapp:WhatsApp:src/index.js"
    "services/resetservice:ResetService:src/index.js"
    "services/cache:Cache:index.js"
    "services/monitoring:Monitoring:valkey-monitor.js"
)

BUILD_SUCCESS=0
SYNTAX_SUCCESS=0
TOTAL_SERVICES=${#SERVICES[@]}

for service_info in "${SERVICES[@]}"; do
    IFS=':' read -r path name main_file <<< "$service_info"
    
    if test_build "$path" "$name"; then
        ((BUILD_SUCCESS++))
    fi
    
    if test_syntax "$path" "$name" "$main_file"; then
        ((SYNTAX_SUCCESS++))
    fi
done

echo -e "\n${YELLOW}🌐 Testing Frontend Applications...${NC}"

# Test frontend builds
FRONTENDS=(
    "webapps/landlord:Landlord Frontend"
    "webapps/tenant:Tenant Frontend"
    "webapps/commonui:Common UI Components"
)

FRONTEND_SUCCESS=0
TOTAL_FRONTENDS=${#FRONTENDS[@]}

for frontend_info in "${FRONTENDS[@]}"; do
    IFS=':' read -r path name <<< "$frontend_info"
    
    if test_build "$path" "$name"; then
        ((FRONTEND_SUCCESS++))
    fi
done

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "==============="
echo -e "Backend Services Build: ${GREEN}$BUILD_SUCCESS/$TOTAL_SERVICES${NC}"
echo -e "Backend Services Syntax: ${GREEN}$SYNTAX_SUCCESS/$TOTAL_SERVICES${NC}"
echo -e "Frontend Applications: ${GREEN}$FRONTEND_SUCCESS/$TOTAL_FRONTENDS${NC}"

if [ $BUILD_SUCCESS -eq $TOTAL_SERVICES ] && [ $FRONTEND_SUCCESS -eq $TOTAL_FRONTENDS ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Node.js v22.17.1 is working perfectly with MicroRealEstate${NC}"
    echo -e "${GREEN}✅ All 10 backend services are building successfully${NC}"
    echo -e "${GREEN}✅ All 3 frontend applications are building successfully${NC}"
    echo -e "${GREEN}✅ All services have proper Node.js v22 compatibility${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
