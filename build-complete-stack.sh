#!/bin/bash

# MicroRealEstate Complete Stack Builder v1.0.0
# This script builds the entire MicroRealEstate stack from scratch

set -e  # Exit on any error

echo "🏗️  MicroRealEstate Complete Stack Builder v1.0.0"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Stop existing containers
stop_existing_containers() {
    print_status "Stopping existing containers..."
    docker compose --profile local down --remove-orphans || true
    print_success "Existing containers stopped"
}

# Clean up Docker resources
cleanup_docker() {
    print_status "Cleaning up Docker resources..."
    
    # Remove unused containers
    docker container prune -f || true
    
    # Remove unused images (keep base images)
    docker image prune -f || true
    
    # Remove unused networks
    docker network prune -f || true
    
    print_success "Docker cleanup completed"
}

# Build all services
build_all_services() {
    print_status "Building all MicroRealEstate services..."
    
    # List of all services to build
    services=(
        "gateway"
        "authenticator" 
        "api"
        "tenantapi"
        "emailer"
        "pdfgenerator"
        "whatsapp"
        "landlord-frontend"
        "tenant-frontend"
    )
    
    for service in "${services[@]}"; do
        print_status "Building $service..."
        if docker compose --profile local build --no-cache "$service"; then
            print_success "$service built successfully"
        else
            print_error "Failed to build $service"
            exit 1
        fi
    done
    
    print_success "All services built successfully"
}

# Start the complete stack
start_stack() {
    print_status "Starting the complete MicroRealEstate stack..."
    
    # Start infrastructure services first
    print_status "Starting infrastructure services (MongoDB, Redis)..."
    docker compose --profile local up -d mongo redis
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 10
    
    # Start core services
    print_status "Starting core services..."
    docker compose --profile local up -d authenticator api tenantapi
    
    # Wait for core services
    sleep 5
    
    # Start supporting services
    print_status "Starting supporting services..."
    docker compose --profile local up -d emailer pdfgenerator whatsapp
    
    # Wait for supporting services
    sleep 5
    
    # Start frontend services
    print_status "Starting frontend services..."
    docker compose --profile local up -d landlord-frontend tenant-frontend
    
    # Start gateway last
    print_status "Starting gateway service..."
    docker compose --profile local up -d gateway
    
    print_success "Complete stack started successfully"
}

# Verify stack health
verify_stack() {
    print_status "Verifying stack health..."
    
    # Wait for all services to be fully ready
    sleep 15
    
    # Check container status
    print_status "Container status:"
    docker compose --profile local ps
    
    # Check if gateway is responding
    print_status "Testing gateway connectivity..."
    if curl -f -s http://localhost:8080/health > /dev/null; then
        print_success "Gateway is responding"
    else
        print_warning "Gateway may not be fully ready yet"
    fi
    
    # Check WhatsApp service
    print_status "Testing WhatsApp service..."
    if curl -f -s http://localhost:8500/health > /dev/null; then
        print_success "WhatsApp service is responding"
    else
        print_warning "WhatsApp service may not be fully ready yet"
    fi
}

# Display final information
display_final_info() {
    echo ""
    echo "🎉 MicroRealEstate Stack Build Complete!"
    echo "========================================"
    echo ""
    echo "📱 Application URLs:"
    echo "   • Landlord Interface: http://localhost:8080/landlord"
    echo "   • Tenant Interface:   http://localhost:8080/tenant"
    echo ""
    echo "🔧 Service URLs:"
    echo "   • Gateway:            http://localhost:8080"
    echo "   • WhatsApp Service:   http://localhost:8500"
    echo ""
    echo "📊 Stack Information:"
    echo "   • Version:            v1.0.0"
    echo "   • Release Date:       2025-07-22"
    echo "   • Codename:           Production Ready"
    echo "   • Total Services:     11 containers"
    echo ""
    echo "🏗️ Services Running:"
    echo "   • MongoDB (Database)"
    echo "   • Redis (Cache)"
    echo "   • Gateway (API Router)"
    echo "   • Authenticator (Auth Service)"
    echo "   • API (Core Business Logic)"
    echo "   • Tenant API (Tenant Services)"
    echo "   • Emailer (Email Notifications)"
    echo "   • PDF Generator (Document Creation)"
    echo "   • WhatsApp (Messaging Service)"
    echo "   • Landlord Frontend (Web UI)"
    echo "   • Tenant Frontend (Tenant Portal)"
    echo ""
    echo "🔍 To monitor logs:"
    echo "   docker compose --profile local logs -f [service-name]"
    echo ""
    echo "🛑 To stop the stack:"
    echo "   docker compose --profile local down"
    echo ""
    print_success "Build completed successfully! 🚀"
}

# Main execution
main() {
    echo "Starting complete stack build process..."
    echo ""
    
    check_prerequisites
    stop_existing_containers
    cleanup_docker
    build_all_services
    start_stack
    verify_stack
    display_final_info
}

# Run main function
main "$@"
