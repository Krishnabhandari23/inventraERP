#!/bin/bash
set -e

echo "Building InventraERP - Combined Frontend & Backend..."

# Build Frontend
echo "📦 Building Frontend (Next.js)..."
npm run build

# Build Backend
echo "📦 Building Backend (Express)..."
cd backend
npm run build
cd ..

echo "✅ Build completed successfully!"
