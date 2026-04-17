#!/bin/bash
# CI validation script

set -e

echo "🔍 Running CI validation..."

# Check environment
echo "Checking environment..."
node --version
pnpm --version

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Lint
echo "Running linter..."
pnpm lint --quiet

# Type check
echo "Running type check..."
pnpm typecheck

# Build
echo "Building packages..."
pnpm build

# Test
echo "Running tests..."
pnpm test

echo "✅ All checks passed!"
