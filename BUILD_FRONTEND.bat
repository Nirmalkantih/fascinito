@echo off
REM ============================================================================
REM Product Variation System - Frontend Build Script (Windows)
REM ============================================================================
REM This script builds the frontend using npm and starts the development server
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     Product Variation System - Frontend Build ^& Run (Windows) ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node and npm are installed
echo Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Node.js not found
    echo.
    echo Please install Node.js 18 or higher from https://nodejs.org/
    echo Or install via Chocolatey: choco install nodejs
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ npm not found
    echo.
    echo npm should be installed with Node.js
    echo Please reinstall Node.js from https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%A in ('node -v') do set NODE_VERSION=%%A
for /f "tokens=*" %%A in ('npm -v') do set NPM_VERSION=%%A

echo ✓ Node.js found (!NODE_VERSION!)
echo ✓ npm found (!NPM_VERSION!)
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set FRONTEND_DIR=!SCRIPT_DIR!frontend

if not exist "!FRONTEND_DIR!" (
    echo ✗ Frontend directory not found: !FRONTEND_DIR!
    exit /b 1
)

echo Frontend directory: !FRONTEND_DIR!
cd /d "!FRONTEND_DIR!"

if not exist "package.json" (
    echo ✗ package.json not found in frontend directory
    exit /b 1
)

echo ✓ package.json found
echo.

REM Check if node_modules exists
set INSTALL_DEPS=0
if not exist "node_modules" (
    echo ⚠ node_modules not found
    echo   Dependencies need to be installed
    echo.
    set INSTALL_DEPS=1
) else (
    echo ✓ node_modules found
    echo.
    set /p REINSTALL="Reinstall dependencies? (y/N): "
    if "!REINSTALL!"=="y" if "!REINSTALL!"=="Y" (
        set INSTALL_DEPS=1
    )
)

REM Install dependencies if needed
if !INSTALL_DEPS! equ 1 (
    echo.
    echo Step 1: Installing dependencies...
    echo This may take several minutes...
    echo.

    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Dependency installation failed
        echo.
        echo Try clearing cache:
        echo   npm cache clean --force
        echo   rmdir /s /q node_modules
        echo   del package-lock.json
        echo   npm install
        exit /b 1
    )
    echo.
    echo ✓ Dependencies installed
    echo.
) else (
    echo Step 1: Dependencies ready
    echo.
)

REM Build for production
echo Step 2: Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ Build failed
    exit /b 1
)

echo.
echo ✓ Production build successful
echo.

REM Verify build output
if exist "dist" (
    for /f "tokens=*" %%A in ('powershell -Command "'{0:N2}' -f ((Get-ChildItem -Path 'dist' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)" 2^>nul') do set DIST_SIZE=%%A MB
    if "!DIST_SIZE!"=="" set DIST_SIZE=~10 MB
    echo ✓ Build output created: dist (!DIST_SIZE!
) else (
    echo ✗ Build output directory not found
    exit /b 1
)

REM Ask if user wants to start development server
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          Frontend Build Complete - Ready to Run                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Build Summary:
echo   ✓ Dependencies installed
echo   ✓ Code compiled
echo   ✓ Build output: dist
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo To preview the production build, run:
echo   npm run preview
echo.
set /p START_DEV="Start development server now? (Y/n): "

if not "!START_DEV!"=="n" if not "!START_DEV!"=="N" (
    echo.
    echo Starting development server...
    echo.
    call npm run dev
) else (
    echo To start the development server later, run:
    echo   cd !FRONTEND_DIR! ^&^& npm run dev
)

endlocal
exit /b 0
