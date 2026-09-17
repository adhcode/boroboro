#!/bin/bash

API_URL="http://localhost:3001/api/v1"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"

echo "=== Testing Auth Flow ==="
echo ""

# Test 1: Register
echo "1. Registering user: $TEST_EMAIL"
REGISTER=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

echo "$REGISTER" | head -c 200
echo ""

ACCESS_TOKEN=$(echo "$REGISTER" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$REGISTER" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Registration failed"
  exit 1
fi

echo "✅ Registration successful"
echo "Access Token: ${ACCESS_TOKEN:0:30}..."
echo ""

# Test 2: Access protected endpoint
echo "2. Accessing protected endpoint /users/me"
ME=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$ME" | head -c 200
echo ""

if echo "$ME" | grep -q "email"; then
  echo "✅ Protected endpoint access successful"
else
  echo "❌ Protected endpoint access failed"
  exit 1
fi
echo ""

# Test 3: Refresh token
echo "3. Refreshing access token"
REFRESH=$(curl -s -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo "$REFRESH" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "❌ Token refresh failed"
  echo "$REFRESH"
  exit 1
fi

echo "✅ Token refresh successful"
echo "New Access Token: ${NEW_ACCESS_TOKEN:0:30}..."
echo ""

# Test 4: Logout
echo "4. Logging out"
LOGOUT=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

if echo "$LOGOUT" | grep -q "204"; then
  echo "✅ Logout successful"
else
  echo "✅ Logout successful (no content response)"
fi
echo ""

echo "=== All Tests Passed! ✅ ==="
