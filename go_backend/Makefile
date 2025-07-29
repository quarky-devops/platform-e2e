# Makefile for QuarkFin Platform E2E Backend

# Variables
BINARY_NAME=server
DEMO_BINARY=demo
MAIN_PATH=cmd/server/main.go
DEMO_PATH=cmd/demo/main.go

# Default target
.PHONY: all
all: build

# Build the main server
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	go build -o $(BINARY_NAME) $(MAIN_PATH)

# Build the demo application
.PHONY: build-demo
build-demo:
	@echo "Building $(DEMO_BINARY)..."
	go build -o $(DEMO_BINARY) $(DEMO_PATH)

# Run the server
.PHONY: run
run:
	@echo "Running server..."
	go run $(MAIN_PATH)

# Run the demo
.PHONY: demo
demo:
	@echo "Running demo..."
	go run $(DEMO_PATH)

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -v -cover ./...

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(BINARY_NAME) $(DEMO_BINARY)
	go clean

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	go fmt ./...

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	golangci-lint run

# Run security checks
.PHONY: security
security:
	@echo "Running security checks..."
	gosec ./...

# Generate documentation
.PHONY: docs
docs:
	@echo "Generating documentation..."
	godoc -http=:6060

# Docker build
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t quarkfin-platform-backend .

# Docker run
.PHONY: docker-run
docker-run:
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file .env quarkfin-platform-backend

# Development setup
.PHONY: dev-setup
dev-setup: deps
	@echo "Setting up development environment..."
	@echo "Please ensure you have a .env file with the following variables:"
	@echo "SUPABASE_URL=your_supabase_url"
	@echo "SUPABASE_SERVICE_KEY=your_supabase_service_key"

# Production build
.PHONY: prod-build
prod-build:
	@echo "Building for production..."
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o $(BINARY_NAME) $(MAIN_PATH)

# Health check
.PHONY: health
health:
	@echo "Checking server health..."
	curl -f http://localhost:8080/ping || exit 1

# Load test (requires wrk)
.PHONY: load-test
load-test:
	@echo "Running load test..."
	wrk -t12 -c400 -d30s http://localhost:8080/ping

# Database migration (placeholder)
.PHONY: migrate
migrate:
	@echo "Running database migrations..."
	@echo "Please run the SQL commands in README.md to set up the database schema"

# Backup (placeholder)
.PHONY: backup
backup:
	@echo "Creating backup..."
	@echo "Please use your database backup procedures"

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build         - Build the main server binary"
	@echo "  build-demo    - Build the demo application"
	@echo "  run           - Run the server"
	@echo "  demo          - Run the demo application"
	@echo "  deps          - Install dependencies"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  clean         - Clean build artifacts"
	@echo "  fmt           - Format code"
	@echo "  lint          - Lint code"
	@echo "  security      - Run security checks"
	@echo "  docs          - Generate documentation"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  dev-setup     - Set up development environment"
	@echo "  prod-build    - Build for production"
	@echo "  health        - Check server health"
	@echo "  load-test     - Run load test"
	@echo "  migrate       - Run database migrations"
	@echo "  backup        - Create backup"
	@echo "  help          - Show this help message"
