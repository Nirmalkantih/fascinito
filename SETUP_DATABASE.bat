@echo off
REM ============================================================================
REM Product Variation System - Database Setup Script (Windows)
REM ============================================================================
REM This script sets up the MySQL database with the new variation schema
REM Run this script before building and deploying the application
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     Product Variation System - Database Setup (Windows)        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if MySQL is installed
echo Checking prerequisites...
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ MySQL client not found
    echo.
    echo Please install MySQL Server from https://dev.mysql.com/downloads/mysql/
    echo Make sure to add MySQL to your PATH environment variable
    exit /b 1
)

echo ✓ MySQL client found
echo.

REM Get credentials from user
echo Database Configuration:
set /p DB_HOST="MySQL Host [localhost]: "
if "!DB_HOST!"=="" set DB_HOST=localhost

set /p DB_PORT="MySQL Port [3306]: "
if "!DB_PORT!"=="" set DB_PORT=3306

set /p DB_USER="MySQL Username [root]: "
if "!DB_USER!"=="" set DB_USER=root

set /p DB_PASSWORD="MySQL Password: "

REM Test connection
echo.
echo Testing database connection...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! -e "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Failed to connect to MySQL
    echo Please verify your credentials and try again
    exit /b 1
)

echo ✓ Connection successful
echo.

REM Create database
echo Creating database 'fascinito_pos'...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! -e "CREATE DATABASE IF NOT EXISTS fascinito_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% neq 0 (
    echo ✗ Failed to create database
    exit /b 1
)

echo ✓ Database created successfully
echo.

REM Run migration script
echo Running migration script...
set MIGRATION_FILE=%~dp0REBUILD_VARIATION_SCHEMA.sql

if not exist "!MIGRATION_FILE!" (
    echo ✗ Migration file not found: !MIGRATION_FILE!
    exit /b 1
)

mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! fascinito_pos < "!MIGRATION_FILE!"

if %errorlevel% neq 0 (
    echo ✗ Failed to execute migration script
    exit /b 1
)

echo ✓ Migration script executed successfully
echo.

REM Verify tables
echo Verifying tables...
mysql -h !DB_HOST! -P !DB_PORT! -u !DB_USER! -p!DB_PASSWORD! fascinito_pos -e "SHOW TABLES LIKE '%%variation%%';"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          Database Setup Complete - Ready for Build            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo ✓ Database 'fascinito_pos' is ready
echo ✓ Tables 'product_variations' and 'variation_options' created
echo.
echo Next Steps:
echo   1. Configure backend\src\main\resources\application.properties
echo   2. Build backend:  cd backend ^&^& mvn clean install -DskipTests
echo   3. Build frontend: cd frontend ^&^& npm install ^&^& npm run build
echo   4. Run backend:    mvn spring-boot:run
echo   5. Run frontend:   npm run dev
echo.
echo Configuration for application.properties:
echo   spring.datasource.url=jdbc:mysql://!DB_HOST!:!DB_PORT!/fascinito_pos
echo   spring.datasource.username=!DB_USER!
echo   spring.datasource.password=^<your_password^>
echo.

exit /b 0
