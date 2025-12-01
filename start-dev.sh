#!/bin/bash

# Fascinito POS - Development Environment Starter
# This script starts both frontend and backend servers

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Fascinito POS - Development Environment Starter       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the Fascinito project root directory"
    exit 1
fi

# Check Node.js
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi
print_success "npm found: $(npm --version)"

# Check Java
print_status "Checking Java installation..."
if ! command -v java &> /dev/null; then
    print_warning "Java is not installed. Backend will not start."
    SKIP_BACKEND=true
else
    print_success "Java found: $(java -version 2>&1 | head -1)"
fi

# Check Maven
print_status "Checking Maven installation..."
if ! command -v mvn &> /dev/null; then
    print_warning "Maven is not installed. Backend will not start."
    SKIP_BACKEND=true
else
    print_success "Maven found: $(mvn -version | head -1)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Starting Development Servers                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Start Frontend
print_status "Starting Frontend Development Server..."
cd frontend

print_status "Installing frontend dependencies (if needed)..."
npm install > /dev/null 2>&1

print_success "Frontend server starting..."
print_status "Frontend will be available at: ${BLUE}http://localhost:5173${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""

# Start Backend (if available)
if [ -z "$SKIP_BACKEND" ]; then
    print_status "Starting Backend Development Server..."
    cd ../backend

    print_status "Building backend (this may take a moment)..."
    mvn clean install -q > /dev/null 2>&1

    print_success "Backend server starting..."
    print_status "Backend will be available at: ${BLUE}http://localhost:8080${NC}"
    mvn spring-boot:run &
    BACKEND_PID=$!
else
    print_warning "Backend will not start. Install Java and Maven to enable backend."
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Development Environment Ready                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Frontend:${NC}  http://localhost:5173"
if [ -z "$SKIP_BACKEND" ]; then
    echo -e "${GREEN}✓ Backend:${NC}   http://localhost:8080"
else
    echo -e "${YELLOW}✗ Backend:${NC}   Not started (Java/Maven required)"
fi
echo ""
echo "Available Commands:"
echo "  - Press Ctrl+C to stop all servers"
echo "  - Hard refresh browser: Ctrl+Shift+R (Chrome/Firefox) or Cmd+Shift+R (Mac)"
echo "  - Clear cache: DevTools → Application → Clear site data"
echo ""
echo "Troubleshooting:"
echo "  - If changes don't appear: Hard refresh browser (Ctrl+Shift+R)"
echo "  - If API calls fail: Check backend is running on port 8080"
echo "  - If port in use: Kill process or use different port"
echo ""

# Wait for user to stop
wait

# Cleanup
print_status "Shutting down servers..."
kill $FRONTEND_PID 2>/dev/null || true
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
fi

print_success "Development servers stopped."
