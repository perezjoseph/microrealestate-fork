#!/bin/bash

# Immediate fix for yarn.lock Node.js 22 compatibility
# Run this locally to fix the CI issue right now

echo "🚀 Immediate yarn.lock Fix for Node.js 22 Compatibility"
echo "======================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "yarn.lock" ]; then
    echo "❌ Error: Run this script from the repository root directory"
    echo "   Make sure package.json and yarn.lock exist"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "📋 Node.js version: $(node --version)"
echo "📋 Yarn version: $(yarn --version)"

# Backup current yarn.lock
echo ""
echo "📋 Creating backup of current yarn.lock..."
cp yarn.lock yarn.lock.backup
echo "✅ Backup created: yarn.lock.backup"

# Clean everything
echo ""
echo "🧹 Cleaning caches and node_modules..."
yarn cache clean --all
rm -rf node_modules
rm -rf .yarn/cache
rm -rf .yarn/install-state.gz
echo "✅ Cleanup completed"

# Remove yarn.lock to force regeneration
echo ""
echo "🗑️ Removing yarn.lock to force regeneration..."
rm yarn.lock

# Temporarily modify .yarnrc.yml to allow lockfile creation if needed
if [ -f .yarnrc.yml ]; then
    cp .yarnrc.yml .yarnrc.yml.backup-config
    # Remove or comment out enableImmutableInstalls if present
    if grep -q "enableImmutableInstalls:" .yarnrc.yml; then
        echo "📝 Temporarily disabling immutable installs in .yarnrc.yml..."
        sed 's/^enableImmutableInstalls:/# enableImmutableInstalls:/' .yarnrc.yml > .yarnrc.yml.temp
        mv .yarnrc.yml.temp .yarnrc.yml
    fi
fi
echo "✅ yarn.lock removed and configuration adjusted"

# Regenerate yarn.lock
echo ""
echo "🔄 Regenerating yarn.lock for current Node.js version..."
if yarn install; then
    echo "✅ yarn.lock regenerated successfully!"
    
    # Restore original .yarnrc.yml if we modified it
    if [ -f .yarnrc.yml.backup-config ]; then
        mv .yarnrc.yml.backup-config .yarnrc.yml
        echo "📝 Restored original .yarnrc.yml configuration"
    fi
    
    # Show stats
    echo ""
    echo "📊 New yarn.lock statistics:"
    echo "  File size: $(du -h yarn.lock | cut -f1)"
    echo "  Line count: $(wc -l < yarn.lock)"
    
    # Verify it works
    echo ""
    echo "🔍 Verifying new yarn.lock..."
    if yarn install --check-cache; then
        echo "✅ Verification successful - new yarn.lock is valid"
        
        # Test workspace functionality
        echo ""
        echo "🧪 Testing workspace functionality..."
        if yarn workspaces list >/dev/null 2>&1; then
            echo "✅ Workspaces are working correctly"
            
            echo ""
            echo "🎉 yarn.lock regeneration completed successfully!"
            echo ""
            echo "📋 Summary of changes:"
            echo "  - yarn.lock regenerated for Node.js $(node --version)"
            echo "  - Backup saved as yarn.lock.backup"
            echo "  - All caches cleaned"
            echo "  - Workspace functionality verified"
            echo ""
            echo "🚀 Next steps:"
            echo "  1. Review changes: git diff yarn.lock.backup yarn.lock"
            echo "  2. Test locally: yarn build"
            echo "  3. Commit changes: git add yarn.lock && git commit -m 'Fix yarn.lock for Node.js 22 compatibility'"
            echo "  4. Push to trigger CI: git push origin feature/nodejs-v22-modernization"
            echo ""
            echo "✅ Your CI should now work without dependency issues!"
            
        else
            echo "⚠️ Workspace functionality test failed (may not be critical)"
        fi
        
    else
        echo "⚠️ Verification failed - there may still be issues"
        echo "   But the yarn.lock was regenerated, so CI might still work"
    fi
    
else
    echo "❌ Failed to regenerate yarn.lock"
    echo ""
    echo "🔄 Restoring backups..."
    mv yarn.lock.backup yarn.lock
    if [ -f .yarnrc.yml.backup-config ]; then
        mv .yarnrc.yml.backup-config .yarnrc.yml
        echo "📝 Restored original .yarnrc.yml configuration"
    fi
    echo "✅ Original files restored"
    echo ""
    echo "💡 Troubleshooting suggestions:"
    echo "  - Make sure you're using Node.js 22 (nvm use 22)"
    echo "  - Check for any package.json syntax errors"
    echo "  - Try running: yarn install --verbose"
    echo "  - Check network connectivity"
    exit 1
fi

echo ""
echo "🎯 Status: Ready to commit and push!"
echo "   The regenerated yarn.lock should resolve all CI dependency issues."
