#!/bin/bash

# E-Commerce Microservices Test Script
# This script validates the project structure and dependencies

echo "🔍 E-Commerce Microservices Validation"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((FAILED++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found directory: $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing directory: $1"
        ((FAILED++))
    fi
}

echo "📁 Checking project structure..."
echo ""

# Check service directories
check_dir "api-gateway"
check_dir "product-service"
check_dir "order-service"
check_dir "user-service"

echo ""
echo "📄 Checking configuration files..."
echo ""

# Check main config files
check_file "docker-compose.yml"
check_file ".gitignore"
check_file "README.md"
check_file "QUICK_START.md"
check_file "postman_collection.json"

echo ""
echo "🔧 Checking API Gateway..."
echo ""
check_file "api-gateway/package.json"
check_file "api-gateway/server.js"
check_file "api-gateway/Dockerfile"
check_file "api-gateway/.env.example"

echo ""
echo "📦 Checking Product Service..."
echo ""
check_file "product-service/package.json"
check_file "product-service/server.js"
check_file "product-service/Dockerfile"
check_file "product-service/.env.example"

echo ""
echo "🛒 Checking Order Service..."
echo ""
check_file "order-service/package.json"
check_file "order-service/server.js"
check_file "order-service/Dockerfile"
check_file "order-service/.env.example"

echo ""
echo "👤 Checking User Service..."
echo ""
check_file "user-service/package.json"
check_file "user-service/server.js"
check_file "user-service/Dockerfile"
check_file "user-service/.env.example"

echo ""
echo "🔍 Checking Node.js syntax..."
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js is installed ($(node --version))"
    ((PASSED++))
    
    # Syntax check for each server.js
    for service in api-gateway product-service order-service user-service; do
        if node -c "$service/server.js" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $service/server.js syntax is valid"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} $service/server.js has syntax errors"
            ((FAILED++))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} Node.js is not installed (skipping syntax checks)"
fi

echo ""
echo "🐳 Checking Docker configuration..."
echo ""

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed ($(docker --version))"
    ((PASSED++))
    
    # Validate docker-compose.yml
    if docker compose config > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} docker-compose.yml has errors"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Docker is not installed"
fi

echo ""
echo "========================================"
echo "📊 Validation Results"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed! Project structure is valid.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
