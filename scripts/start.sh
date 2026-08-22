#!/bin/sh
set -u

DATA_DIR="${DATA_DIR:-/data}"
echo "[start] uid=$(id -u) pwd=$(pwd)"
ls -la /app | head -40 || true
ls -la /app/prisma || true
ls -la /app/node_modules/.prisma/client 2>/dev/null | head -20 || echo "[start] no .prisma/client"

mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/prod.db" ]; then
  echo "[start] seeding $DATA_DIR/prod.db"
  if [ ! -f /app/prisma/template.db ]; then
    echo "[start] FATAL: missing /app/prisma/template.db"
    exit 1
  fi
  cp /app/prisma/template.db "$DATA_DIR/prod.db" || exit 1
fi

export DATABASE_URL="file:$DATA_DIR/prod.db"
echo "[start] DATABASE_URL=$DATABASE_URL"

if [ ! -f /app/server.js ]; then
  echo "[start] FATAL: /app/server.js missing"
  exit 1
fi

# Run as root in Coolify for SQLite volume simplicity.
echo "[start] exec node server.js"
exec node server.js
