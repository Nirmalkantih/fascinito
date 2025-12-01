# Fascinito POS System - Makefile
# Quick commands for building and running the project

.PHONY: help build backend frontend dev run run-backend run-frontend clean check install

help:
	@echo "Fascinito POS System - Build Commands"
	@echo "======================================"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build          - Build both frontend and backend"
	@echo "  make backend        - Build only backend"
	@echo "  make frontend       - Build only frontend"
	@echo "  make clean          - Clean build artifacts"
	@echo ""
	@echo "Run Commands:"
	@echo "  make run            - Run both backend and frontend"
	@echo "  make run-backend    - Run backend only (java -jar)"
	@echo "  make run-frontend   - Run frontend dev server"
	@echo "  make dev            - Run frontend dev server (alias)"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install        - Install all dependencies"
	@echo "  make check          - Check prerequisites"
	@echo ""
	@echo "Other:"
	@echo "  make help           - Show this help message"
	@echo ""

# Build targets
build: backend frontend
	@echo ""
	@echo "✓ Both frontend and backend built successfully!"
	@echo ""
	@echo "Next steps:"
	@echo "  make run          - Run both applications"
	@echo "  make run-backend  - Start backend only"
	@echo "  make run-frontend - Start frontend only"
	@echo ""

backend:
	@echo "Building Backend..."
	@cd backend && mvn clean -q && mvn package -DskipTests -q
	@echo "✓ Backend built successfully!"
	@echo "  JAR: backend/target/pos-backend-1.0.0.jar"
	@echo ""

frontend:
	@echo "Building Frontend..."
	@cd frontend && npm run build
	@echo "✓ Frontend built successfully!"
	@echo "  Output: frontend/dist/"
	@echo ""

# Clean targets
clean:
	@echo "Cleaning build artifacts..."
	@cd backend && mvn clean -q
	@cd frontend && rm -rf dist node_modules package-lock.json
	@echo "✓ Clean complete!"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	@echo ""
	@echo "Frontend dependencies:"
	@cd frontend && npm install
	@echo ""
	@echo "✓ All dependencies installed!"
	@echo ""

# Run targets
run: run-backend run-frontend
	@echo ""
	@echo "Both backend and frontend are running!"
	@echo ""

run-backend:
	@echo "Starting Backend..."
	@echo "Backend running at: http://localhost:8080/api"
	@cd backend && java -jar target/pos-backend-1.0.0.jar

run-frontend:
	@echo "Starting Frontend Dev Server..."
	@echo "Frontend running at: http://localhost:5173"
	@cd frontend && npm run dev

dev:
	@$(MAKE) run-frontend

# Check prerequisites
check:
	@echo "Checking Prerequisites..."
	@echo ""
	@echo "Node.js:"
	@node --version
	@echo ""
	@echo "npm:"
	@npm --version
	@echo ""
	@echo "Java:"
	@java -version 2>&1 | head -1
	@echo ""
	@echo "Maven:"
	@mvn --version | head -1
	@echo ""
	@echo "✓ All prerequisites found!"
	@echo ""

.DEFAULT_GOAL := help
