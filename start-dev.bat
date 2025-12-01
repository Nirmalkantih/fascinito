@echo off
REM Fascinito POS - Development Environment Starter (Windows)
REM This script starts both frontend and backend servers

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo     Fascinito POS - Development Environment Starter
echo ============================================================
echo.

REM Check if running in correct directory
if not exist "docker-compose.yml" (
    echo [ERROR] Please run this script from the Fascinito project root directory
    pause
    exit /b 1
)

REM Check Node.js
echo [INFO] Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js found: %NODE_VERSION%

REM Check npm
echo [INFO] Checking npm installation...
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm found: %NPM_VERSION%

REM Check Java
echo [INFO] Checking Java installation...
where java >nul 2>nul
if errorlevel 1 (
    echo [WARNING] Java is not installed. Backend will not start.
    set SKIP_BACKEND=true
) else (
    echo [SUCCESS] Java found
)

REM Check Maven
echo [INFO] Checking Maven installation...
where mvn >nul 2>nul
if errorlevel 1 (
    if not defined SKIP_BACKEND (
        echo [WARNING] Maven is not installed. Backend will not start.
        set SKIP_BACKEND=true
    )
) else (
    echo [SUCCESS] Maven found
)

echo.
echo ============================================================
echo              Starting Development Servers
echo ============================================================
echo.

REM Start Frontend
echo [INFO] Starting Frontend Development Server...
cd frontend

echo [INFO] Installing frontend dependencies (if needed)...
call npm install >nul 2>&1

echo [SUCCESS] Frontend server starting...
echo [INFO] Frontend will be available at: http://localhost:5173
start cmd /k npm run dev

REM Start Backend
if not defined SKIP_BACKEND (
    cd..
    echo.
    echo [INFO] Starting Backend Development Server...
    cd backend

    echo [INFO] Building backend (this may take a moment)...
    call mvn clean install -q >nul 2>&1

    echo [SUCCESS] Backend server starting...
    echo [INFO] Backend will be available at: http://localhost:8080
    start cmd /k mvn spring-boot:run
) else (
    echo [WARNING] Backend will not start. Install Java and Maven to enable backend.
)

echo.
echo ============================================================
echo              Development Environment Ready
echo ============================================================
echo.
echo [SUCCESS] Frontend: http://localhost:5173
if not defined SKIP_BACKEND (
    echo [SUCCESS] Backend:  http://localhost:8080
) else (
    echo [WARNING] Backend:  Not started (Java/Maven required)
)
echo.
echo Available Commands:
echo  - Close terminal window to stop servers
echo  - Hard refresh browser: Ctrl+Shift+R (Chrome/Firefox/Edge)
echo  - Clear cache: DevTools ^> Application ^> Clear site data
echo.
echo Troubleshooting:
echo  - If changes don't appear: Hard refresh browser (Ctrl+Shift+R)
echo  - If API calls fail: Check backend is running on port 8080
echo  - If port in use: Kill process using that port
echo.
pause
