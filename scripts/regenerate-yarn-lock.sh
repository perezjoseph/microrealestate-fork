#!/bin/bash

# Script to regenerate yarn.lock for Node.js 22 compatibility
# This helps resolve CI dependency installation issues

echo " Regenerating yarn.lock for Node.js 22 compatibility"
echo "======================================================="

# Check current Node.js version
echo "Current Node.js version: $(node --version)"
echo "Current Yarn version: $(yarn --version)"

# Backup current yarn.lock
if [ -f "yarn.lock" ]; then
    echo " Backing up current yarn.lock..."
    cp yarn.lock yarn.lock.backup
    echo " Backup created: yarn.lock.backup"
else
    echo " No existing yarn.lock found"
fi

# Clean yarn cache
echo " Cleaning yarn cache..."
yarn cache clean --all

# Remove node_modules to ensure clean state
echo " Removing node_modules for clean installation..."
rm -rf node_modules
rm -rf .yarn/cache
rm -rf .yarn/install-state.gz

# Remove existing yarn.lock
echo " Removing existing yarn.lock..."
rm -f yarn.lock

# Regenerate yarn.lock with current Node.js version
echo " Regenerating yarn.lock..."
if yarn install; then
    echo " yarn.lock regenerated successfully!"
    
    # Show some stats about the new lockfile
    echo ""
    echo " New yarn.lock statistics:"
    echo "File size: $(du -h yarn.lock | cut -f1)"
    echo "Number of packages: $(grep -c '^"' yarn.lock || echo 'Unable to count')"
    
    # Verify the installation works
    echo ""
    echo " Verifying installation..."
    if yarn install --check-cache; then
        echo " Verification successful - yarn.lock is valid"
        
        # Test workspace functionality
        echo ""
        echo " Testing workspace functionality..."
        if yarn workspaces list; then
            echo " Workspaces are working correctly"
        else
            echo " Workspace issues detected"
        fi
        
        echo ""
        echo " yarn.lock regeneration completed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Review the changes: git diff yarn.lock"
        echo "2. Test locally: yarn install && yarn build"
        echo "3. Commit the new yarn.lock: git add yarn.lock && git commit -m 'Regenerate yarn.lock for Node.js 22 compatibility'"
        echo "4. Push to trigger CI: git push origin <branch-name>"
        
    else
        echo " Verification failed - there may still be issues"
        exit 1
    fi
    
else
    echo " Failed to regenerate yarn.lock"
    
    # Restore backup if available
    if [ -f "yarn.lock.backup" ]; then
        echo " Restoring backup yarn.lock..."
        mv yarn.lock.backup yarn.lock
        echo " Backup restored"
    fi
    
    exit 1
fi

echo ""
echo " If you still have CI issues after this, consider:"
echo "   - Upgrading Node.js locally to match CI (Node.js 22)"
echo "   - Checking for platform-specific dependencies"
echo "   - Reviewing package.json for version conflicts"
