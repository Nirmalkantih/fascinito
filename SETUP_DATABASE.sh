#!/bin/bash

# ============================================================================
# Product Variation System - Database Setup Script
# ============================================================================
# This script sets up the MySQL database with the new variation schema
# Run this script before building and deploying the application
# ============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Product Variation System - Database Setup                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is installed
echo "Checking prerequisites..."
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}✗ MySQL client not found${NC}"
    echo "Please install MySQL client:"
    echo "  macOS:  brew install mysql-client"
    echo "  Ubuntu: sudo apt-get install mysql-client"
    echo "  Windows: Install MySQL Server with MySQL Shell"
    exit 1
fi

echo -e "${GREEN}✓ MySQL client found${NC}"

# Get credentials from user
echo ""
echo "Database Configuration:"
read -p "MySQL Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL Port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "MySQL Username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL Password: " DB_PASSWORD
echo ""

# Test connection
echo ""
echo "Testing database connection..."
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}✗ Failed to connect to MySQL${NC}"
    echo "Please verify your credentials and try again"
    exit 1
fi

echo -e "${GREEN}✓ Connection successful${NC}"

# Create database
echo ""
echo "Creating database 'fascinito_pos'..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS fascinito_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
fi

# Run migration script
echo ""
echo "Running migration script..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="$SCRIPT_DIR/REBUILD_VARIATION_SCHEMA.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" fascinito_pos < "$MIGRATION_FILE"; then
    echo -e "${GREEN}✓ Migration script executed successfully${NC}"
else
    echo -e "${RED}✗ Failed to execute migration script${NC}"
    exit 1
fi

# Verify tables
echo ""
echo "Verifying tables..."
TABLES=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" fascinito_pos -e "SHOW TABLES LIKE '%variation%';" 2>/dev/null | wc -l)

if [ "$TABLES" -ge 2 ]; then
    echo -e "${GREEN}✓ Tables created successfully${NC}"
    echo ""
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" fascinito_pos -e "SHOW TABLES LIKE '%variation%';"
else
    echo -e "${RED}✗ Tables not created${NC}"
    exit 1
fi

# Display summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Database Setup Complete - Ready for Build            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Database 'fascinito_pos' is ready${NC}"
echo -e "${GREEN}✓ Tables 'product_variations' and 'variation_options' created${NC}"
echo ""
echo "Next Steps:"
echo "  1. Configure backend/src/main/resources/application.properties"
echo "  2. Build backend:  cd backend && mvn clean install -DskipTests"
echo "  3. Build frontend: cd frontend && npm install && npm run build"
echo "  4. Run backend:    mvn spring-boot:run"
echo "  5. Run frontend:   npm run dev"
echo ""
echo "Configuration for application.properties:"
echo "  spring.datasource.url=jdbc:mysql://$DB_HOST:$DB_PORT/fascinito_pos"
echo "  spring.datasource.username=$DB_USER"
echo "  spring.datasource.password=<your_password>"
echo ""

exit 0
