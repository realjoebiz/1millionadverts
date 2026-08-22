#!/bin/sh
set -eu
echo "[start] uid=$(id -u) pwd=$(pwd)"
cd /app 2>/dev/null || true
ls -la . | head -40 || true
ls -la prisma 2>/dev/null || true
mkdir -p /data
if [ ! -f /data/prod.db ]; then
  echo "[start] seeding /data/prod.db"
  cp prisma/template.db /data/prod.db
fi
export DATABASE_URL="file:/data/prod.db"
echo "[start] DATABASE_URL=$DATABASE_URL"
exec node server.js
