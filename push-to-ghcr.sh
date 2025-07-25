#!/bin/bash

# Script to push all MicroRealEstate images to GitHub Container Registry
# Usage: ./push-to-ghcr.sh [source-tag] [target-tag]
# Examples:
#   ./push-to-ghcr.sh                    # Push local latest as latest
#   ./push-to-ghcr.sh v1.2.3 latest     # Push v1.2.3 as latest
#   ./push-to-ghcr.sh abc123 latest     # Push commit SHA as latest

REGISTRY="ghcr.io/perezjoseph/microrealestate-whatsapp"
SOURCE_TAG="${1:-latest}"
TARGET_TAG="${2:-latest}"

echo "🚀 Pushing MicroRealEstate images to GitHub Container Registry..."
echo "Registry: $REGISTRY"
echo "Source tag: $SOURCE_TAG"
echo "Target tag: $TARGET_TAG"
echo ""

# Check if we need to login
if ! docker info | grep -q "Username:"; then
    echo "🔐 Please login to GitHub Container Registry first:"
    echo "echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
    echo ""
    read -p "Press Enter to continue after logging in..."
fi

# List of services to push
services=(
    "gateway"
    "authenticator" 
    "api"
    "tenantapi"
    "pdfgenerator"
    "emailer"
    "whatsapp"
    "landlord-frontend"
    "tenant-frontend"
    "cache"
    "monitoring"
    "resetservice"
)

# Function to push a service
push_service() {
    local service=$1
    echo "📦 Processing $service..."
    
    local source_image=""
    local target_image="$REGISTRY/$service:$TARGET_TAG"
    
    # Determine source image
    if [[ "$SOURCE_TAG" == "latest" ]] && docker images | grep -q "microrealestate-whatsapp-$service"; then
        # Use local image
        source_image="microrealestate-whatsapp-$service:latest"
        echo "   Using local image: $source_image"
    else
        # Use registry image
        source_image="$REGISTRY/$service:$SOURCE_TAG"
        echo "   Pulling from registry: $source_image"
        
        if ! docker pull "$source_image"; then
            echo "   ❌ Failed to pull $source_image"
            return 1
        fi
    fi
    
    # Tag the image
    echo "   🏷️  Tagging as: $target_image"
    if ! docker tag "$source_image" "$target_image"; then
        echo "   ❌ Failed to tag $service"
        return 1
    fi
    
    # Push the image
    echo "   📤 Pushing..."
    if docker push "$target_image"; then
        echo "   ✅ Successfully pushed $service"
        
        # Add additional tags if pushing as latest
        if [[ "$TARGET_TAG" == "latest" ]]; then
            # Also tag with current date
            local date_tag=$(date +%Y%m%d)
            local dated_image="$REGISTRY/$service:$date_tag"
            echo "   🏷️  Also tagging as: $dated_image"
            docker tag "$source_image" "$dated_image"
            docker push "$dated_image"
        fi
        
        return 0
    else
        echo "   ❌ Failed to push $service"
        return 1
    fi
}

# Track failures
failed_services=()

# Push each service
for service in "${services[@]}"; do
    if ! push_service "$service"; then
        failed_services+=("$service")
    fi
    echo ""
done

# Summary
if [ ${#failed_services[@]} -eq 0 ]; then
    echo "🎉 All images pushed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "   Registry: $REGISTRY"
    echo "   Services: ${#services[@]}"
    echo "   Target tag: $TARGET_TAG"
    echo ""
    echo "To use these images, update your docker-compose.yml with:"
    echo "   image: $REGISTRY/[service-name]:$TARGET_TAG"
else
    echo "⚠️  Some images failed to push:"
    for service in "${failed_services[@]}"; do
        echo "   - $service"
    done
    echo ""
    echo "You can retry failed services individually:"
    echo "   docker push $REGISTRY/[service-name]:$TARGET_TAG"
    exit 1
fi