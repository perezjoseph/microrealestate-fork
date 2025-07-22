#!/bin/bash

echo "🔒 Rate Limiting Verification Test"
echo "=================================="

# Test 1: Authentication Rate Limiting
echo ""
echo "Test 1: Authentication Rate Limiting"
echo "------------------------------------"

echo "Making 10 rapid authentication requests..."
for i in {1..10}; do
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST http://localhost:8080/api/v2/authenticator/landlord/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}')
  
  http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
  
  echo "Request $i: HTTP $http_code"
  
  if [ "$http_code" = "429" ]; then
    echo "✅ Rate limiting triggered at request $i"
    echo "Response: $body"
    break
  fi
  
  # Small delay to avoid overwhelming
  sleep 0.1
done

echo ""
echo "Test 2: Password Reset Rate Limiting"
echo "-----------------------------------"

echo "Making 5 password reset requests..."
for i in {1..5}; do
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST http://localhost:8080/api/v2/authenticator/landlord/forgotpassword \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}')
  
  http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
  
  echo "Request $i: HTTP $http_code"
  
  if [ "$http_code" = "429" ]; then
    echo "✅ Password reset rate limiting triggered at request $i"
    echo "Response: $body"
    break
  fi
  
  sleep 0.1
done

echo ""
echo "Test 3: Signup Rate Limiting"
echo "----------------------------"

echo "Making 8 signup requests..."
for i in {1..8}; do
  response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST http://localhost:8080/api/v2/authenticator/landlord/signup \
    -H "Content-Type: application/json" \
    -d "{\"firstname\":\"Test\",\"lastname\":\"User\",\"email\":\"test$i@example.com\",\"password\":\"testpass123\"}")
  
  http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
  body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
  
  echo "Request $i: HTTP $http_code"
  
  if [ "$http_code" = "429" ]; then
    echo "✅ Signup rate limiting triggered at request $i"
    echo "Response: $body"
    break
  fi
  
  sleep 0.2
done

echo ""
echo "Test 4: Check Rate Limit Headers"
echo "-------------------------------"

echo "Checking for rate limit headers in response..."
response=$(curl -s -I -X POST http://localhost:8080/api/v2/authenticator/landlord/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}')

echo "Response headers:"
echo "$response" | grep -i "ratelimit\|x-ratelimit"

if echo "$response" | grep -qi "ratelimit"; then
  echo "✅ Rate limit headers found"
else
  echo "❌ No rate limit headers found"
fi

echo ""
echo "Test Summary:"
echo "============"
echo "If rate limiting is working correctly, you should see:"
echo "- HTTP 429 responses after several requests"
echo "- Rate limit headers in responses"
echo "- Appropriate error messages"
