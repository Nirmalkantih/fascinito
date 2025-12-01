#!/bin/bash

# Database Reset Script
# This script resets the database to the new schema

echo "🗑️  Resetting Database..."
echo "This will:"
echo "  1. Stop Docker containers"
echo "  2. Remove MySQL volume"
echo "  3. Restart containers with fresh database"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Stop containers
echo "Stopping containers..."
docker-compose down || true

# Remove MySQL volume
echo "Removing MySQL volume..."
docker volume rm fascinito_mysql_data || true

# Start containers again
echo "Starting containers with fresh database..."
docker-compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 10

# Initialize database
echo "Initializing database with new schema..."
docker exec pos-mysql mysql -u root -ppassword < /Users/nirmal/Fascinito/database/init.sql

echo "✅ Database reset complete!"
echo ""
echo "Access the database:"
echo "  mysql -h localhost -P 3307 -u root -ppassword pos_db"
