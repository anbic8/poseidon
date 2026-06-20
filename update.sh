#!/bin/bash
set -e

echo "==> Pulling latest changes from GitHub..."
git pull

echo "==> Building and restarting containers..."
docker compose up --build -d

echo "==> Done. App runs on http://localhost:4000"
echo "==> Adminer runs on http://localhost:9000"
