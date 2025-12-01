@echo off
REM Fascinito POS System - Build Script (Windows)
REM This script builds both frontend and backend

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set FRONTEND_DIR=%PROJECT_ROOT%frontend
set BACKEND_DIR=%PROJECT_ROOT%backend

cls
echo.
echo ========================================
echo Fascinito POS System - Build Script
echo ========================================
echo.

REM Parse arguments
if "%1"=="" (
    goto build_both
) else if "%1"=="backend" (
    goto build_backend_only
) else if "%1"=="frontend" (
    goto build_frontend_only
) else if "%1"=="all" (
    goto build_both
) else if "%1"=="check" (
    goto check_prerequisites
) else if "%1"=="help" (
    goto show_help
) else (
    echo Error: Unknown option: %1
    echo Use 'build.bat help' for usage information
    exit /b 1
)

:check_prerequisites
echo Checking Prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js found: !NODE_VERSION!
) else (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    exit /b 1
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm found: !NPM_VERSION!
) else (
    echo [ERROR] npm not found. Install with Node.js
    exit /b 1
)

REM Check Java
where java >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Java found
) else (
    echo [ERROR] Java not found. Install Java 17+ from https://www.oracle.com/java/technologies/javase-jdk17-downloads.html
    exit /b 1
)

REM Check Maven
where mvn >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Maven found
) else (
    echo [ERROR] Maven not found. Install from https://maven.apache.org/download.cgi
    exit /b 1
)

echo.
if "%1"=="check" exit /b 0
goto build_both

:build_backend_only
echo.
echo ========================================
echo Building Backend
echo ========================================
echo.

cd /d "%BACKEND_DIR%"

echo Cleaning previous build...
call mvn clean -q

echo Building with Maven (this may take a minute)...
call mvn package -DskipTests -q

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend build failed
    exit /b 1
)

echo [OK] Backend built successfully!

if exist "target\pos-backend-1.0.0.jar" (
    echo [OK] JAR file created: target\pos-backend-1.0.0.jar
)

echo.
exit /b 0

:build_frontend_only
echo.
echo ========================================
echo Building Frontend
echo ========================================
echo.

cd /d "%FRONTEND_DIR%"

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo [OK] .env.local created. Please update with your Razorpay key.
    )
) else (
    echo [OK] .env.local found
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies (npm install)...
    call npm install -q
) else (
    echo [OK] node_modules found, skipping npm install
)

echo Building with Vite and TypeScript (this may take a minute)...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend build failed
    exit /b 1
)

echo [OK] Frontend built successfully!

if exist "dist" (
    echo [OK] Build output: dist\ folder
)

echo.
exit /b 0

:build_both
call :check_prerequisites
call :build_backend_only
call :build_frontend_only

echo.
echo ========================================
echo Build Summary
echo ========================================
echo.
echo Frontend:
echo   Build output: %FRONTEND_DIR%\dist\
echo   Dev server:   npm run dev (in frontend directory)
echo.
echo Backend:
echo   JAR file:     %BACKEND_DIR%\target\pos-backend-1.0.0.jar
echo   Run with:     java -jar target\pos-backend-1.0.0.jar
echo.
echo Next Steps:
echo   1. Start backend: cd backend ^&^& java -jar target\pos-backend-1.0.0.jar
echo   2. Start frontend: cd frontend ^&^& npm run dev
echo   3. Access app at: http://localhost:5173
echo   4. API endpoint: http://localhost:8080/api
echo.

exit /b 0

:show_help
echo Usage: build.bat [option]
echo.
echo Options:
echo   (no args)  - Build both backend and frontend
echo   backend    - Build only backend
echo   frontend   - Build only frontend
echo   all        - Build both with summary
echo   check      - Check prerequisites only
echo   help       - Show this help message
echo.
exit /b 0
