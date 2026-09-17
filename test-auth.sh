#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api/v1"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing Authentication Flow${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Test 1: Register a new user
echo -e "${YELLOW}Test 1: Register New User${NC}"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"phone\": \"+2348012345678\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:20}..."
  echo "User ID: $USER_ID"
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Login with credentials
echo -e "${YELLOW}Test 2: Login${NC}"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Login successful (HTTP $HTTP_CODE)${NC}"
  NEW_ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  NEW_REFRESH_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
  echo "New Refresh Token: ${NEW_REFRESH_TOKEN:0:20}..."
  
  # Update tokens for next tests
  ACCESS_TOKEN=$NEW_ACCESS_TOKEN
  REFRESH_TOKEN=$NEW_REFRESH_TOKEN
else
  echo -e "${RED}✗ Login failed (HTTP $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 3: Access protected endpoint
echo -e "${YELLOW}Test 3: Access Protected Endpoint (/users/me)${NC}"

ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Protected endpoint access successful (HTTP $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY" | head -c 200
  echo "..."
else
  echo -e "${RED}✗ Protected endpoint access failed (HTTP $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 4: Refresh token
echo -e "${YELLOW}Test 4: Refresh Access Token${NC}"

REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Token refresh successful (HTTP $HTTP_CODE)${NC}"
  REFRESHED_ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESHED_REFRESH_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "Refreshed Access Token: ${REFRESHED_ACCESS_TOKEN:0:20}..."
  echo "Refreshed Refresh Token: ${REFRESHED_REFRESH_TOKEN:0:20}..."
  
  # Update tokens
  ACCESS_TOKEN=$REFRESHED_ACCESS_TOKEN
  REFRESH_TOKEN=$REFRESHED_REFRESH_TOKEN
else
  echo -e "${RED}✗ Token refresh failed (HTTP $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 5: Access protected endpoint with refreshed token
echo -e "${YELLOW}Test 5: Access Protected Endpoint with Refreshed Token${NC}"

ME_RESPONSE2=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE2" | tail -n1)
RESPONSE_BODY=$(echo "$ME_RESPONSE2" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Protected endpoint access with refreshed token successful (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ Protected endpoint access failed (HTTP $HTTP_CODE)${NC}"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 6: Logout
echo -e "${YELLOW}Test 6: Logout${NC}"

LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Logout successful (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ Logout failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

echo ""

# Test 7: Try to use refresh token after logout (should fail)
echo -e "${YELLOW}Test 7: Try to Use Refresh Token After Logout (Should Fail)${NC}"

REFRESH_AFTER_LOGOUT=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_CODE=$(echo "$REFRESH_AFTER_LOGOUT" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
  echo -e "${GREEN}✓ Correctly rejected refresh token after logout (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ Should have rejected refresh token (HTTP $HTTP_CODE instead of 401)${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Authentication Tests Passed! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "✓ User registration"
echo "✓ User login"
echo "✓ Protected endpoint access"
echo "✓ Token refresh"
echo "✓ Refreshed token works"
echo "✓ User logout"
echo "✓ Token invalidation after logout"
echo ""
