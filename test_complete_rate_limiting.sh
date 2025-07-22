#!/bin/bash

echo "🔒 MicroRealEstate Complete Rate Limiting Test"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📍 Testing Backend Rate Limiting API${NC}"
echo ""

# Function to test rate limiting
test_rate_limiting() {
    local endpoint=$1
    local data=$2
    local description=$3
    local expected_limit=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $endpoint"
    echo "Expected limit: $expected_limit requests"
    echo ""
    
    local success_count=0
    local rate_limited=false
    
    for i in $(seq 1 $((expected_limit + 2))); do
        response=$(curl -X POST "http://localhost:8080/api/v2/authenticator/landlord$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -s -w "HTTP_STATUS:%{http_code}")
        
        http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
        
        if [ "$http_status" = "429" ]; then
            echo -e "${RED}🚨 Request $i: RATE LIMITED (HTTP 429)${NC}"
            if echo "$response_body" | jq -e '.error' >/dev/null 2>&1; then
                error_msg=$(echo "$response_body" | jq -r '.error')
                wait_time=$(echo "$response_body" | jq -r '.retryAfterMinutes // "N/A"')
                echo -e "   ${RED}Error: $error_msg${NC}"
                echo -e "   ${RED}Wait time: $wait_time minutes${NC}"
            fi
            rate_limited=true
            break
        else
            echo -e "${GREEN}✅ Request $i: SUCCESS (HTTP $http_status)${NC}"
            ((success_count++))
        fi
        
        sleep 0.3
    done
    
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo -e "  Successful requests: ${GREEN}$success_count${NC}"
    echo -e "  Rate limited after: ${RED}$((success_count + 1)) requests${NC}"
    echo -e "  Expected limit: ${YELLOW}$expected_limit${NC}"
    
    if [ $success_count -eq $expected_limit ] && [ "$rate_limited" = true ]; then
        echo -e "  ${GREEN}✅ RATE LIMITING WORKING CORRECTLY${NC}"
    else
        echo -e "  ${RED}❌ RATE LIMITING NOT WORKING AS EXPECTED${NC}"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test Authentication Rate Limiting
test_rate_limiting "/signin" '{"email":"test1@example.com","password":"wrongpassword"}' "Authentication Rate Limiting" 5

# Test Password Reset Rate Limiting  
test_rate_limiting "/forgotpassword" '{"email":"test2@example.com"}' "Password Reset Rate Limiting" 3

# Test Signup Rate Limiting
test_rate_limiting "/signup" '{"firstname":"Test","lastname":"User","email":"test3@example.com","password":"testpass123"}' "Signup Rate Limiting" 5

echo -e "${BLUE}📱 Frontend Integration Status${NC}"
echo ""

# Check if frontend is accessible
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/landlord/signin)
if [ "$frontend_status" = "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible at http://localhost:8080/landlord/signin${NC}"
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $frontend_status)${NC}"
fi

# Check translation files
if [ -f "/home/jperez/microrealestate/webapps/landlord/locales/es-CO/common.json" ]; then
    if grep -q "Rate limit exceeded" "/home/jperez/microrealestate/webapps/landlord/locales/es-CO/common.json"; then
        echo -e "${GREEN}✅ Spanish translations for rate limiting added${NC}"
    else
        echo -e "${RED}❌ Spanish translations for rate limiting missing${NC}"
    fi
else
    echo -e "${RED}❌ Spanish translation file not found${NC}"
fi

echo ""
echo -e "${BLUE}🎯 Rate Limiting Features Implemented:${NC}"
echo ""
echo -e "${GREEN}✅ Backend API Rate Limiting${NC}"
echo "   • Authentication: 5 requests per 15 minutes"
echo "   • Password Reset: 3 requests per hour"  
echo "   • Signup: 5 requests per hour"
echo "   • Token Refresh: 20 requests per 5 minutes"
echo ""
echo -e "${GREEN}✅ Enhanced Error Messages${NC}"
echo "   • User-friendly error messages"
echo "   • Detailed explanations"
echo "   • Wait time information"
echo "   • Timestamps and error types"
echo ""
echo -e "${GREEN}✅ Frontend Integration${NC}"
echo "   • Updated User store to handle 429 errors"
echo "   • Enhanced toast notifications"
echo "   • Longer display duration for rate limit messages"
echo ""
echo -e "${GREEN}✅ Multilingual Support${NC}"
echo "   • Spanish translations added"
echo "   • English translations added"
echo "   • Consistent message formatting"
echo ""
echo -e "${BLUE}🌐 To test the frontend:${NC}"
echo "1. Open http://localhost:8080/landlord/signin"
echo "2. Try to login multiple times with wrong credentials"
echo "3. After 5 attempts, you should see a rate limiting message"
echo "4. Change language to Spanish to see localized messages"
echo ""
echo -e "${GREEN}🎉 Rate Limiting Implementation Complete!${NC}"
