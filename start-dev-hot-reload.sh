#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Starting Development Environment${NC}"
echo -e "${BLUE}========================================${NC}"

# Stop and remove existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.dev.yml down

# Build and start containers with hot reload
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose -f docker-compose.dev.yml up --build -d

echo -e "${GREEN}✓ Development environment started!${NC}"
echo -e ""
echo -e "${GREEN}Services:${NC}"
echo -e "  Frontend (with hot reload): ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend API:                ${BLUE}http://localhost:8080${NC}"
echo -e "  Database (MySQL):           ${BLUE}localhost:3307${NC}"
echo -e "  Adminer (DB Admin):         ${BLUE}http://localhost:8081${NC}"
echo -e ""
echo -e "${YELLOW}Hot Reload Enabled:${NC} Changes to frontend code will automatically refresh!"
echo -e ""
echo -e "To view logs: ${BLUE}docker-compose -f docker-compose.dev.yml logs -f frontend${NC}"
echo -e "To stop:      ${BLUE}docker-compose -f docker-compose.dev.yml down${NC}"
