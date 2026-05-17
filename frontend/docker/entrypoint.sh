#!/bin/sh
set -e

echo "📦 Ensuring frontend dependencies are up to date..."
if ! pnpm install --no-frozen-lockfile --force; then
    echo "⚠️ Pnpm install failed, clearing node_modules and retrying..."
    rm -rf node_modules
    pnpm install --no-frozen-lockfile --force
fi

echo "🚀 Starting Next.js..."
exec pnpm dev
