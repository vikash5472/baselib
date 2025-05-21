#!/bin/bash
set -e

# Save current branch name
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🏗️ Building and preparing release branch..."

# Step 1: Build already done via npm script
npm run build

# Step 2: Switch to release branch (create/reset it)
git checkout -B release

# Step 3: Clean up everything except .git
git reset --hard
git clean -fd

# Step 4: Prepare temp-release folder
mkdir -p temp-release
cp -r dist temp-release/
cp package.json temp-release/
cp README.md temp-release/ 2>/dev/null || true

# Step 5: Remove all files and restore dist+meta files
find . -mindepth 1 -maxdepth 1 ! -name 'temp-release' ! -name '.git' -exec rm -rf {} +
mv temp-release/* .
rmdir temp-release

# Step 6: Commit and force-push to release branch
git add .
git commit -m "release: compiled dist only"
git push -f origin release

# Step 7: Return to original branch
git checkout "$ORIGINAL_BRANCH"

echo "✅ Release branch updated and returned to '$ORIGINAL_BRANCH'!"