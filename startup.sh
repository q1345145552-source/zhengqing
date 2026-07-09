#!/bin/sh
cd /app/frontend
echo "Installing frontend dependencies..."
npm install
echo "Building frontend..."
npm run build
echo "Copying to nginx..."
rm -rf /frontend-dist/*
cp -r dist/* /frontend-dist/
cd /app/backend
echo "Installing backend dependencies..."
npm install
echo "Installing fonts..."
apk add --no-cache font-noto-cjk font-noto-thai 2>/dev/null
echo "Starting backend..."
exec node src/app.js
