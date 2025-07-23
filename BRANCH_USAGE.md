# Node.js v22 Modernization Branch Usage Guide

## Branch Information
- **Branch Name**: `feature/nodejs-v22-modernization`
- **Purpose**: Node.js v22.17.1 LTS modernization
- **Status**: ✅ Ready for testing and integration

## Quick Start

### 1. Switch to the modernization branch
```bash
git checkout feature/nodejs-v22-modernization
```

### 2. Use the correct Node.js version
```bash
# The .nvmrc file will automatically set the correct version
nvm use
# Should show: Now using node v22.17.1
```

### 3. Install dependencies
```bash
yarn install
```

### 4. Test all services
```bash
# Run the comprehensive test script
./test-services.sh
```

## What's Included in This Branch

### ✅ Core Modernization
- Node.js v22.17.1 (Latest LTS)
- npm v11.4.2 (Latest)
- Updated package.json engines requirements
- .nvmrc for team consistency

### ✅ Fixed Issues
- next-translate-plugin TypeScript errors
- Optional chaining support
- Modern JavaScript features support
- Build compatibility issues

### ✅ Testing Infrastructure
- Comprehensive service testing script
- Build verification for all services
- Frontend application testing

## Service Status

### Backend Services ✅
- API Service - Core business logic
- Authenticator Service - JWT authentication
- Gateway Service - API gateway
- Emailer Service - Email notifications
- PDF Generator Service - Document generation
- Reset Service - Password reset
- Tenant API Service - Tenant endpoints
- Common Service - Shared utilities

### Frontend Applications ✅
- Landlord Frontend - Property management
- Tenant Frontend - Tenant portal

## Development Workflow

### For New Development
```bash
# Start from this branch for new features
git checkout feature/nodejs-v22-modernization
git checkout -b feature/your-new-feature
```

### For Testing
```bash
# Test individual services
cd services/api && yarn build && node src/index.js

# Test frontend applications
cd webapps/landlord && yarn build
cd webapps/tenant && yarn build

# Run comprehensive tests
./test-services.sh
```

### For Docker Development
```bash
# Services are ready for Docker with Node.js 22
# Update Dockerfiles to use node:22-alpine base images
```

## Integration with Master

### Before Merging
1. ✅ All services build successfully
2. ✅ Frontend applications compile
3. ✅ No breaking changes introduced
4. ✅ Comprehensive testing completed

### Merge Strategy
```bash
# Recommended: Create PR for review
git push origin feature/nodejs-v22-modernization

# Or merge directly (if authorized)
git checkout master
git merge feature/nodejs-v22-modernization
```

## Troubleshooting

### If Node.js version issues occur:
```bash
nvm install 22.17.1
nvm use 22.17.1
nvm alias default 22.17.1
```

### If build issues occur:
```bash
# Clean and rebuild
yarn clean  # if available
rm -rf node_modules
yarn install
```

### If service startup issues occur:
```bash
# Check environment variables
# Ensure MongoDB and Redis are running
# Review service logs for specific errors
```

## Performance Benefits
- 🚀 Faster startup times
- 💾 Better memory management
- 🔒 Enhanced security
- ⚡ Improved TypeScript compilation

---
**Created**: 2025-07-23  
**Node.js Version**: v22.17.1 LTS  
**Status**: Production Ready
