#!/bin/bash

echo "🔒 MicroRealEstate Rate Limiting Feedback Test"
echo "=============================================="
echo ""

# Function to make a request and show formatted output
test_endpoint() {
    local endpoint=$1
    local data=$2
    local description=$3
    
    echo "📍 Testing: $description"
    echo "Endpoint: $endpoint"
    echo "Data: $data"
    echo ""
    
    response=$(curl -X POST "http://localhost:8080/api/v2/authenticator/landlord$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -s -w "HTTP_STATUS:%{http_code}")
    
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "🔍 HTTP Status: $http_status"
    
    if [ "$http_status" = "429" ]; then
        echo "🚨 RATE LIMITED!"
        echo "$response_body" | jq -r '
            "❌ Error: " + .error + "\n" +
            "📝 Details: " + .details + "\n" +
            "⏰ Wait Time: " + (.retryAfterMinutes | tostring) + " minutes\n" +
            "🏷️  Type: " + .type + "\n" +
            "📅 Timestamp: " + .timestamp
        ' 2>/dev/null || echo "$response_body"
    elif [ "$http_status" = "401" ]; then
        echo "🔐 Authentication Failed (Expected for test)"
        echo "$response_body" | jq -r '.message // .' 2>/dev/null || echo "$response_body"
    elif [ "$http_status" = "201" ]; then
        echo "✅ Success: Account created"
    elif [ "$http_status" = "204" ]; then
        echo "✅ Success: Request processed"
    elif [ "$http_status" = "200" ]; then
        echo "✅ Success: Login successful"
        # Check for warnings in successful responses
        if echo "$response_body" | jq -e '.warning' >/dev/null 2>&1; then
            echo "⚠️  Warning included in response:"
            echo "$response_body" | jq -r '.warning.message' 2>/dev/null
        fi
    else
        echo "❓ Unexpected status: $http_status"
        echo "$response_body"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

echo "🧪 Starting Rate Limiting Tests..."
echo ""

# Test 1: Authentication Rate Limiting
echo "TEST 1: Authentication Rate Limiting (5 attempts per 15 minutes)"
for i in {1..7}; do
    test_endpoint "/signin" '{"email":"test@example.com","password":"wrongpassword"}' "Login Attempt #$i"
    sleep 0.5
done

echo ""
echo "TEST 2: Password Reset Rate Limiting (3 attempts per hour)"
for i in {1..5}; do
    test_endpoint "/forgotpassword" '{"email":"reset@example.com"}' "Password Reset Attempt #$i"
    sleep 0.5
done

echo ""
echo "TEST 3: Signup Rate Limiting (5 attempts per hour)"
for i in {1..7}; do
    test_endpoint "/signup" "{\"firstname\":\"Test\",\"lastname\":\"User\",\"email\":\"signup$i@example.com\",\"password\":\"testpass123\"}" "Signup Attempt #$i"
    sleep 0.3
done

echo ""
echo "🎉 Rate Limiting Feedback Test Complete!"
echo ""
echo "📊 Summary of Enhanced Features:"
echo "✅ Clear error messages with explanations"
echo "✅ Specific wait times in minutes"
echo "✅ Different message types for different limits"
echo "✅ Timestamps for tracking"
echo "✅ Helpful details and support guidance"
echo "✅ Account-specific vs IP-specific messaging"
