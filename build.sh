#!/bin/bash
set -e

echo "🔨 Building InventraERP (Combined Frontend & Backend)..."

# Step 1: Install root dependencies
echo "📦 Installing root dependencies..."
npm install --omit=dev

# Step 2: Build Next.js frontend
echo "🎨 Building Next.js frontend..."
npm run build

# Step 3: Install and build backend
echo "🔧 Installing backend dependencies..."
cd backend
npm install --omit=dev

echo "🏗️  Building backend..."
npm run build

cd ..

echo "✅ Build completed successfully!"
echo "📝 Ready to start with: npm run start"
