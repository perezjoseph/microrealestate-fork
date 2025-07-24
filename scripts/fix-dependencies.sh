#!/bin/bash

# Fix Dependencies Script
# This script helps resolve Node.js version conflicts in dependencies

set -e

echo "🔧 Fixing Node.js Version Dependency Issues"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

echo "1. Checking current Node.js version..."
node_version=$(node --version)
echo "Current Node.js version: $node_version"

if [[ $node_version == v22* ]]; then
    print_status 0 "Node.js version is compatible"
elif [[ $node_version == v20* ]]; then
    print_warning "Node.js v20 detected. v22 is recommended for best compatibility."
else
    print_warning "Node.js $node_version detected. This may cause dependency issues."
    echo ""
    echo "💡 To fix this issue:"
    echo "   Option 1 - Install Node.js 22:"
    echo "     - Download from: https://nodejs.org/"
    echo "     - Or use nvm: nvm install 22 && nvm use 22"
    echo ""
    echo "   Option 2 - Use the .nvmrc file:"
    echo "     - Run: nvm use"
    echo ""
    echo "   Option 3 - Continue with current version (may have issues)"
    echo ""
    read -p "Continue with current Node.js version? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please upgrade Node.js and run this script again."
        exit 1
    fi
fi

echo ""
echo "2. Backing up current yarn.lock..."
if [ -f "yarn.lock" ]; then
    cp yarn.lock yarn.lock.backup
    print_status 0 "yarn.lock backed up to yarn.lock.backup"
else
    print_warning "No yarn.lock found"
fi

echo ""
echo "3. Cleaning existing installations..."
echo "   - Removing node_modules..."
rm -rf node_modules
echo "   - Removing .yarn/cache..."
rm -rf .yarn/cache
echo "   - Cleaning yarn cache..."
yarn cache clean --all
print_status 0 "Clean completed"

echo ""
echo "4. Reinstalling dependencies with current Node.js version..."
if yarn install; then
    print_status 0 "Dependencies installed successfully"
else
    print_status 1 "Dependency installation failed"
    echo ""
    echo "🔍 Common solutions:"
    echo "   1. Upgrade to Node.js 22"
    echo "   2. Check for conflicting global packages"
    echo "   3. Clear npm cache: npm cache clean --force"
    echo "   4. Try: yarn install --network-timeout 100000"
    exit 1
fi

echo ""
echo "5. Building types (required for workspace)..."
if yarn workspace @microrealestate/types run build; then
    print_status 0 "Types built successfully"
else
    print_status 1 "Types build failed"
    exit 1
fi

echo ""
echo "6. Testing workspace functionality..."
if yarn workspaces list; then
    print_status 0 "Workspace structure is valid"
else
    print_status 1 "Workspace structure has issues"
fi

echo ""
echo "7. Running linting test..."
if yarn lint; then
    print_status 0 "Linting passed"
else
    print_warning "Linting found issues (this is normal)"
fi

echo ""
echo "🎉 Dependency Fix Complete!"
echo "=========================="
echo ""
echo "Summary:"
echo "- Dependencies have been reinstalled with Node.js $node_version"
echo "- yarn.lock has been updated for your Node.js version"
echo "- Types have been built successfully"
echo ""
echo "Next steps:"
echo "1. Test your application locally"
echo "2. Commit the updated yarn.lock:"
echo "   git add yarn.lock"
echo "   git commit -m 'Update yarn.lock for Node.js compatibility'"
echo "3. Push changes to trigger CI again"
echo ""
echo "If you still have issues:"
echo "- Consider upgrading to Node.js 22 for best compatibility"
echo "- Check the GitHub Actions logs for specific errors"
echo "- The CI workflow has been updated to handle dependency conflicts"
