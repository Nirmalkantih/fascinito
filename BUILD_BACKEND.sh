#!/bin/bash

# ============================================================================
# Product Variation System - Backend Build Script
# ============================================================================
# This script builds the backend using Maven and starts the Spring Boot server
# ============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Product Variation System - Backend Build & Run            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Maven is installed
echo "Checking prerequisites..."
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}✗ Maven not found${NC}"
    echo ""
    echo "Please install Maven:"
    echo "  macOS:  brew install maven"
    echo "  Ubuntu: sudo apt-get install maven"
    echo "  Windows: Download from https://maven.apache.org/"
    echo ""
    echo "Or download Maven manually and add to PATH"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java not found${NC}"
    echo ""
    echo "Please install Java 17 or higher:"
    echo "  macOS:  brew install openjdk@17"
    echo "  Ubuntu: sudo apt install openjdk-17-jdk"
    echo "  Windows: Download from https://adoptium.net/"
    exit 1
fi

echo -e "${GREEN}✓ Maven found$(mvn --version | head -1 | cut -d' ' -f3)${NC}"
echo -e "${GREEN}✓ Java found$(java -version 2>&1 | head -1 | cut -d' ' -f2)${NC}"
echo ""

# Navigate to backend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}✗ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

echo "Backend directory: $BACKEND_DIR"
cd "$BACKEND_DIR"

# Verify pom.xml exists
if [ ! -f "pom.xml" ]; then
    echo -e "${RED}✗ pom.xml not found in backend directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ pom.xml found${NC}"
echo ""

# Verify database configuration
echo "Checking database configuration..."
if [ ! -f "src/main/resources/application.properties" ]; then
    echo -e "${YELLOW}⚠ application.properties not found${NC}"
    echo "  Please configure database before running backend"
    echo ""
    echo "Create/edit: $BACKEND_DIR/src/main/resources/application.properties"
    echo ""
    echo "Example configuration:"
    echo "  spring.datasource.url=jdbc:mysql://localhost:3306/fascinito_pos"
    echo "  spring.datasource.username=root"
    echo "  spring.datasource.password=your_password"
    echo "  spring.jpa.hibernate.ddl-auto=validate"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting..."
        exit 1
    fi
fi

# Clean previous build
echo ""
echo -e "${BLUE}Step 1: Cleaning previous builds...${NC}"
mvn clean 2>&1 | grep -E "(BUILD|ERROR|Deleting)" || true

# Download dependencies and compile
echo ""
echo -e "${BLUE}Step 2: Downloading dependencies and compiling...${NC}"
echo "This may take several minutes on first build..."
echo ""

if mvn install -DskipTests -q; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo ""
    echo "Trying verbose build to see errors..."
    mvn install -DskipTests
    exit 1
fi

# Verify JAR was created
echo ""
echo -e "${BLUE}Step 3: Verifying build artifacts...${NC}"
if [ -f "target/pos-backend-1.0.0.jar" ]; then
    SIZE=$(ls -lh target/pos-backend-1.0.0.jar | awk '{print $5}')
    echo -e "${GREEN}✓ JAR created: target/pos-backend-1.0.0.jar ($SIZE)${NC}"
else
    echo -e "${RED}✗ JAR not found${NC}"
    exit 1
fi

# Ask if user wants to start the server
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Backend Build Complete - Ready to Run                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Build Summary:"
echo "  ✓ Dependencies downloaded"
echo "  ✓ Code compiled"
echo "  ✓ JAR packaged: target/pos-backend-1.0.0.jar"
echo ""
echo "To start the backend server, run:"
echo "  mvn spring-boot:run"
echo ""
echo "Or:"
echo "  java -jar target/pos-backend-1.0.0.jar"
echo ""
read -p "Start backend server now? (Y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${BLUE}Starting Spring Boot application...${NC}"
    echo ""
    mvn spring-boot:run
else
    echo "To start the backend later, run:"
    echo "  cd $BACKEND_DIR && mvn spring-boot:run"
fi

exit 0
