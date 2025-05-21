#!/bin/bash
set -e

echo "🏗️ Building and preparing release branch..."

# Step 1: Build already done via npm script

# Step 2: Switch to release branch
git checkout -B release

# Step 3: Clean up everything
git reset --hard
git clean -fd

# Step 4: Copy only what we want in release
mkdir -p temp-release
cp -r dist temp-release/
cp package.json temp-release/
cp README.md temp-release/

# Step 5: Remove all files and move release files back
find . -mindepth 1 -maxdepth 1 ! -name 'temp-release' ! -name '.git' -exec rm -rf {} +
mv temp-release/* .
rmdir temp-release

# Step 6: Commit and push
git add .
git commit -m "release: compiled dist only"
git push -f origin release

echo "✅ Release branch updated successfully!"