# Docker Image Workflow Guide

This guide explains the streamlined Docker image workflow for MicroRealEstate with proper `latest` tag management.

## Overview

The workflow now uses a **single, unified approach** to handle all Docker image operations:

- **`docker-images.yml`** - Handles all Docker image building, tagging, and promotion
- **`ci.yml`** - Handles code quality (linting) only
- **`release.yml`** - Handles GitHub releases and deployment packages only

## Single Workflow Approach

### `docker-images.yml` - The Only Docker Workflow

This workflow handles three scenarios:

1. **Development Builds** (push to master)
   - Builds all services
   - Tags with commit SHA only
   - No `latest` tag (prevents unstable latest)

2. **Release Builds** (version tags like v1.2.3)
   - Builds all services
   - Tags with version AND `latest`
   - Automatically promotes to latest

3. **Manual Promotion** (workflow dispatch)
   - Promotes any existing tag to `latest`
   - No building required

## Usage Examples

### 1. Development Workflow
```bash
# Push to master - builds with commit SHA only
git push origin master
# Creates: ghcr.io/.../api:abc1234 (no latest tag)
```

### 2. Release Workflow
```bash
# Create and push version tag - builds with version + latest
git tag v1.2.3
git push origin v1.2.3
# Creates: ghcr.io/.../api:v1.2.3 AND ghcr.io/.../api:latest
```

### 3. Manual Promotion
```bash
# Via GitHub Actions UI:
# Go to Actions → "Docker Images" → Run workflow
# Enter tag to promote (e.g., abc1234 or v1.2.3)
# This promotes existing images to latest without rebuilding
```

## Why This Approach is Better

### ❌ **Old Problem: Two Workflows Creating Latest**
- `ci.yml` created `latest` on every push
- `release.yml` also created `latest` on releases
- **Conflict**: Latest could be unstable development code

### ✅ **New Solution: Single Source of Truth**
- Only `docker-images.yml` handles Docker operations
- `latest` only created for releases or manual promotion
- Development builds don't interfere with stable `latest`

## Workflow Triggers

| Trigger | Action | Tags Created | Purpose |
|---------|--------|-------------|---------|
| Push to master | Build | `{commit-sha}` | Development testing |
| Push version tag | Build + Latest | `{version}`, `latest` | Stable release |
| Manual dispatch | Promote | `latest` | Promote specific version |

## Local Development

### Using the Makefile
```bash
# Build all services locally
make build-all

# Push as latest (for testing)
make push-latest

# Push with specific tag
make push-tag TAG=v1.2.3

# Promote existing tag to latest
make promote TAG=abc1234
```

### Using the Enhanced Script
```bash
# Push local images as latest
./push-to-ghcr.sh

# Promote existing tag to latest
./push-to-ghcr.sh v1.2.3 latest
```

## Production Deployment

### Always Use Latest for Production
```bash
# Your docker-compose.ghcr.yml already uses :latest
docker compose -f docker-compose.ghcr.yml up -d
```

### Pin to Specific Version (if needed)
```bash
# Replace :latest with specific version
sed 's/:latest/:v1.2.3/g' docker-compose.ghcr.yml | docker compose -f - up -d
```

## Monitoring

### Check Current Workflow Status
```bash
# List local images
make list-images

# Check what's in registry
make check-registry

# View running containers
docker compose ps
```

### GitHub Actions
- **Docker Images**: All Docker operations
- **CI**: Code quality only
- **Release**: GitHub releases only

## Migration Benefits

### Before (Multiple Workflows)
- ❌ Redundant Docker builds
- ❌ Conflicting `latest` tags
- ❌ Complex workflow dependencies
- ❌ Harder to debug issues

### After (Single Workflow)
- ✅ Single source of truth for Docker operations
- ✅ Clear separation of concerns
- ✅ Stable `latest` tags
- ✅ Easier to understand and maintain

## Troubleshooting

### If Latest is Broken
```bash
# Promote a known good version to latest
# Via GitHub UI: Actions → Docker Images → Run workflow
# Enter the good version tag (e.g., v1.2.2)
```

### If Build Fails
```bash
# Check the Docker Images workflow logs
# All Docker operations are in one place now
```

### Local Testing
```bash
# Build and test locally first
make build-all
docker compose --profile dev up -d

# Then push when ready
make push-latest
```

---

This streamlined approach eliminates workflow redundancy while providing clear, predictable Docker image management.
