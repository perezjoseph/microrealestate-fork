#!/bin/bash

# Check for Docker-required files that might not be git-tracked
# This helps prevent "file not found" errors in Docker builds

echo "🔍 Checking for Docker-required files that might not be git-tracked"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

missing_files=0

check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        if git ls-files | grep -q "$(basename "$file")"; then
            echo -e "${GREEN}✅ $file${NC} - $description"
        else
            echo -e "${RED}❌ $file${NC} - $description (NOT GIT-TRACKED)"
            missing_files=$((missing_files + 1))
        fi
    else
        echo -e "${YELLOW}⚠️ $file${NC} - $description (FILE MISSING)"
    fi
}

echo ""
echo "📋 Checking startup scripts..."
check_file "webapps/tenant/startup.js" "Tenant frontend startup script"
check_file "webapps/landlord/startup.js" "Landlord frontend startup script"

echo ""
echo "📋 Checking commonui scripts..."
check_file "webapps/commonui/scripts/replacebasepath.js" "Base path replacement (standard)"
check_file "webapps/commonui/scripts/replacebasepath-docker.js" "Base path replacement (Docker)"
check_file "webapps/commonui/scripts/generateruntimeenvfile.js" "Runtime env file (standard)"
check_file "webapps/commonui/scripts/generateruntimeenvfile-docker.js" "Runtime env file (Docker)"
check_file "webapps/commonui/scripts/generateruntimeenvfile-build.js" "Runtime env file (build)"
check_file "webapps/commonui/scripts/runner.js" "Script runner"

echo ""
echo "📋 Checking other potential Docker dependencies..."
check_file "webapps/landlord/start.js" "Landlord start script"

# Check for any .js files in scripts directories that might be missing
echo ""
echo "📋 Scanning for other untracked script files..."
find webapps/*/scripts -name "*.js" 2>/dev/null | while read file; do
    if [ -f "$file" ] && ! git ls-files | grep -q "$(basename "$file")"; then
        echo -e "${YELLOW}⚠️ $file${NC} - Found untracked script file"
        missing_files=$((missing_files + 1))
    fi
done

# Check for any startup-related files
echo ""
echo "📋 Scanning for other startup files..."
find webapps -name "start*.js" -o -name "startup*.js" 2>/dev/null | while read file; do
    if [ -f "$file" ] && ! git ls-files | grep -q "$(basename "$file")"; then
        echo -e "${YELLOW}⚠️ $file${NC} - Found untracked startup file"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
echo "📊 Summary:"
if [ $missing_files -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker-required files are git-tracked!${NC}"
    echo "Your Docker builds should work correctly."
else
    echo -e "${RED}❌ Found $missing_files untracked files that might be needed by Docker builds${NC}"
    echo ""
    echo "To fix this, run:"
    echo "  git add <missing-files>"
    echo "  git commit -m 'Add missing Docker-required files'"
    echo "  git push origin <branch-name>"
fi

echo ""
echo "💡 Remember: Docker build context only includes git-tracked files!"
echo "   Even if files exist locally, they must be committed to git to be available in Docker builds."
