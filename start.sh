#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Resume Manager - Starting ==="

# Install backend dependencies
echo "[1/3] Installing Python dependencies..."
cd "$PROJECT_DIR/backend"
pip install -q -r requirements.txt --break-system-packages

# Install frontend dependencies and build
echo "[2/3] Building frontend..."
cd "$PROJECT_DIR/frontend"
npm install --silent 2>/dev/null
npm run build

# Start backend (serves built frontend as static files)
echo "[3/3] Starting server on http://0.0.0.0:8000 ..."
cd "$PROJECT_DIR/backend"
exec python3 main.py
