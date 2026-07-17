#!/bin/bash
set -e

echo "🔨 Building backend..."
cd backend
npm install --production
cd ..

echo "🎉 Build completed!"
