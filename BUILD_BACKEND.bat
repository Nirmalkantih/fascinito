@echo off
REM ============================================================================
REM Product Variation System - Backend Build Script (Windows)
REM ============================================================================
REM This script builds the backend using Maven and starts the Spring Boot server
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     Product Variation System - Backend Build ^& Run (Windows) ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Maven is installed
echo Checking prerequisites...
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Maven not found
    echo.
    echo Please install Maven from https://maven.apache.org/
    echo Or install via Chocolatey: choco install maven
    echo Or install via Scoop: scoop install maven
    echo.
    echo After installation, add Maven to your PATH environment variable
    exit /b 1
)

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Java not found
    echo.
    echo Please install Java 17 or higher from https://adoptium.net/
    echo Or install via Chocolatey: choco install temurin17
    exit /b 1
)

echo ✓ Maven found
echo ✓ Java found
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend

if not exist "!BACKEND_DIR!" (
    echo ✗ Backend directory not found: !BACKEND_DIR!
    exit /b 1
)

echo Backend directory: !BACKEND_DIR!
cd /d "!BACKEND_DIR!"

if not exist "pom.xml" (
    echo ✗ pom.xml not found in backend directory
    exit /b 1
)

echo ✓ pom.xml found
echo.

REM Check database configuration
echo Checking database configuration...
if not exist "src\main\resources\application.properties" (
    echo ⚠ application.properties not found
    echo   Please configure database before running backend
    echo.
    echo Create/edit: !BACKEND_DIR!\src\main\resources\application.properties
    echo.
    echo Example configuration:
    echo   spring.datasource.url=jdbc:mysql://localhost:3306/fascinito_pos
    echo   spring.datasource.username=root
    echo   spring.datasource.password=your_password
    echo   spring.jpa.hibernate.ddl-auto=validate
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if not "!CONTINUE!"=="y" if not "!CONTINUE!"=="Y" (
        echo Aborting...
        exit /b 1
    )
)

REM Clean previous build
echo.
echo Step 1: Cleaning previous builds...
call mvn clean -q
if %errorlevel% neq 0 (
    echo ✗ Clean failed
    exit /b 1
)

REM Download dependencies and compile
echo.
echo Step 2: Downloading dependencies and compiling...
echo This may take several minutes on first build...
echo.

call mvn install -DskipTests -q
if %errorlevel% neq 0 (
    echo ✗ Build failed
    echo.
    echo Trying verbose build to see errors...
    call mvn install -DskipTests
    exit /b 1
)

echo ✓ Build successful
echo.

REM Verify JAR was created
echo Step 3: Verifying build artifacts...
if exist "target\pos-backend-1.0.0.jar" (
    for %%A in ("target\pos-backend-1.0.0.jar") do set SIZE=%%~zA
    echo ✓ JAR created: target\pos-backend-1.0.0.jar (!SIZE! bytes)
) else (
    echo ✗ JAR not found
    exit /b 1
)

REM Ask if user wants to start the server
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          Backend Build Complete - Ready to Run                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Build Summary:
echo   ✓ Dependencies downloaded
echo   ✓ Code compiled
echo   ✓ JAR packaged: target\pos-backend-1.0.0.jar
echo.
echo To start the backend server, run:
echo   mvn spring-boot:run
echo.
echo Or:
echo   java -jar target\pos-backend-1.0.0.jar
echo.
set /p START_SERVER="Start backend server now? (Y/n): "

if not "!START_SERVER!"=="n" if not "!START_SERVER!"=="N" (
    echo.
    echo Starting Spring Boot application...
    echo.
    call mvn spring-boot:run
) else (
    echo To start the backend later, run:
    echo   cd !BACKEND_DIR! ^&^& mvn spring-boot:run
)

endlocal
exit /b 0
