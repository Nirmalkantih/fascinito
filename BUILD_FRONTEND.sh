#!/bin/bash

# ============================================================================
# Product Variation System - Frontend Build Script
# ============================================================================
# This script builds the frontend using npm and starts the development server
# ============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Product Variation System - Frontend Build & Run           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node and npm are installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo ""
    echo "Please install Node.js 18 or higher:"
    echo "  macOS:  brew install node"
    echo "  Ubuntu: sudo apt-get install nodejs npm"
    echo "  Windows: Download from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    echo ""
    echo "npm should be installed with Node.js"
    echo "Please reinstall Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo -e "${GREEN}✓ Node.js found ($NODE_VERSION)${NC}"
echo -e "${GREEN}✓ npm found ($NPM_VERSION)${NC}"
echo ""

# Navigate to frontend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

echo "Frontend directory: $FRONTEND_DIR"
cd "$FRONTEND_DIR"

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ package.json not found in frontend directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ package.json found${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found${NC}"
    echo "  Dependencies need to be installed"
    echo ""
    INSTALL=true
else
    echo -e "${GREEN}✓ node_modules found${NC}"
    echo ""
    read -p "Reinstall dependencies? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        INSTALL=true
    else
        INSTALL=false
    fi
fi

# Install dependencies if needed
if [ "$INSTALL" = true ]; then
    echo -e "${BLUE}Step 1: Installing dependencies...${NC}"
    echo "This may take several minutes..."
    echo ""

    if npm install --verbose; then
        echo ""
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ Dependency installation failed${NC}"
        echo ""
        echo "Try clearing cache:"
        echo "  npm cache clean --force"
        echo "  rm -rf node_modules package-lock.json"
        echo "  npm install"
        exit 1
    fi
    echo ""
fi

# Build for production
echo -e "${BLUE}Step 2: Building frontend...${NC}"
if npm run build; then
    echo ""
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Verify build output
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | awk '{print $1}')
    echo -e "${GREEN}✓ Build output created: dist/ ($DIST_SIZE)${NC}"
else
    echo -e "${RED}✗ Build output directory not found${NC}"
    exit 1
fi

# Ask if user wants to start development server
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Frontend Build Complete - Ready to Run                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Build Summary:"
echo "  ✓ Dependencies installed"
echo "  ✓ Code compiled"
echo "  ✓ Build output: dist/ ($DIST_SIZE)"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To preview the production build, run:"
echo "  npm run preview"
echo ""
read -p "Start development server now? (Y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${BLUE}Starting development server...${NC}"
    echo ""
    npm run dev
else
    echo "To start the development server later, run:"
    echo "  cd $FRONTEND_DIR && npm run dev"
fi

exit 0
