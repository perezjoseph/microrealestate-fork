# MicroRealEstate Docker Image Management
REGISTRY := ghcr.io/perezjoseph/microrealestate-whatsapp
SERVICES := gateway authenticator api tenantapi pdfgenerator emailer whatsapp landlord-frontend tenant-frontend cache monitoring resetservice

# Default target
.PHONY: help
help:
	@echo "MicroRealEstate Docker Image Management"
	@echo ""
	@echo "Available targets:"
	@echo "  build-all          Build all services locally"
	@echo "  push-latest        Push all local images as latest"
	@echo "  push-tag TAG=x.x.x Push all local images with specific tag"
	@echo "  promote TAG=x.x.x  Promote existing tag to latest"
	@echo "  list-images        List all local images"
	@echo "  clean-images       Remove all local images"
	@echo "  login              Login to GitHub Container Registry"
	@echo ""
	@echo "Examples:"
	@echo "  make build-all"
	@echo "  make push-latest"
	@echo "  make push-tag TAG=v1.2.3"
	@echo "  make promote TAG=v1.2.3"

# Build all services locally
.PHONY: build-all
build-all:
	@echo "🔨 Building all services..."
	docker compose --profile dev build

# Login to GitHub Container Registry
.PHONY: login
login:
	@echo "🔐 Logging into GitHub Container Registry..."
	@echo "Please ensure GITHUB_TOKEN is set in your environment"
	@echo "$$GITHUB_TOKEN" | docker login ghcr.io -u $(shell git config user.name) --password-stdin

# Push all images as latest
.PHONY: push-latest
push-latest:
	@echo "📤 Pushing all images as latest..."
	@$(foreach service,$(SERVICES), \
		echo "Processing $(service)..."; \
		docker tag microrealestate-whatsapp-$(service):latest $(REGISTRY)/$(service):latest && \
		docker push $(REGISTRY)/$(service):latest && \
		echo "✅ $(service) pushed successfully" || \
		(echo "❌ Failed to push $(service)" && exit 1); \
	)
	@echo "🎉 All images pushed as latest!"

# Push all images with a specific tag
.PHONY: push-tag
push-tag:
ifndef TAG
	$(error TAG is required. Usage: make push-tag TAG=v1.2.3)
endif
	@echo "📤 Pushing all images with tag: $(TAG)..."
	@$(foreach service,$(SERVICES), \
		echo "Processing $(service)..."; \
		docker tag microrealestate-whatsapp-$(service):latest $(REGISTRY)/$(service):$(TAG) && \
		docker push $(REGISTRY)/$(service):$(TAG) && \
		echo "✅ $(service):$(TAG) pushed successfully" || \
		(echo "❌ Failed to push $(service):$(TAG)" && exit 1); \
	)
	@echo "🎉 All images pushed with tag $(TAG)!"

# Promote existing tag to latest
.PHONY: promote
promote:
ifndef TAG
	$(error TAG is required. Usage: make promote TAG=v1.2.3)
endif
	@echo "🔄 Promoting $(TAG) to latest..."
	@$(foreach service,$(SERVICES), \
		echo "Processing $(service)..."; \
		docker pull $(REGISTRY)/$(service):$(TAG) && \
		docker tag $(REGISTRY)/$(service):$(TAG) $(REGISTRY)/$(service):latest && \
		docker push $(REGISTRY)/$(service):latest && \
		echo "✅ $(service) promoted to latest" || \
		(echo "❌ Failed to promote $(service)" && exit 1); \
	)
	@echo "🎉 All images promoted to latest!"

# List all local images
.PHONY: list-images
list-images:
	@echo "📋 Local MicroRealEstate images:"
	@docker images | grep -E "(microrealestate-whatsapp|$(REGISTRY))" || echo "No images found"

# Clean all local images
.PHONY: clean-images
clean-images:
	@echo "🧹 Cleaning local images..."
	@docker images | grep -E "(microrealestate-whatsapp|$(REGISTRY))" | awk '{print $$3}' | xargs -r docker rmi -f
	@echo "✅ Local images cleaned"

# Build and push in one command
.PHONY: build-push-latest
build-push-latest: build-all push-latest

# Build and push with tag
.PHONY: build-push-tag
build-push-tag: build-all
	@$(MAKE) push-tag TAG=$(TAG)

# Check if all images exist in registry
.PHONY: check-registry
check-registry:
	@echo "🔍 Checking registry for all services..."
	@$(foreach service,$(SERVICES), \
		echo -n "$(service): "; \
		docker manifest inspect $(REGISTRY)/$(service):latest >/dev/null 2>&1 && \
		echo "✅ exists" || echo "❌ missing"; \
	)
