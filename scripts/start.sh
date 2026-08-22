#!/bin/sh
set -u

echo "[start] uid=$(id -u) pwd=$(pwd) PORT=${PORT:-} HOSTNAME=${HOSTNAME:-}"

# Coolify/Docker WORKDIR should be /app; be defensive anyway.
if [ -d /app ]; then
  cd /app || exit 1
fi

echo "[start] listing cwd"
ls -la . | head -40 || true
echo "[start] listing prisma"
ls -la ./prisma 2>/dev/null || ls -la /app/prisma 2>/dev/null || true

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

TEMPLATE=""
for candidate in ./prisma/template.db /app/prisma/template.db; do
  if [ -f "$candidate" ]; then
    TEMPLATE="$candidate"
    break
  fi
done

if [ ! -f "$DATA_DIR/prod.db" ]; then
  echo "[start] seeding $DATA_DIR/prod.db from ${TEMPLATE:-NONE}"
  if [ -z "$TEMPLATE" ]; then
    echo "[start] FATAL: template.db not found"
    exit 1
  fi
  cp "$TEMPLATE" "$DATA_DIR/prod.db" || exit 1
fi

export DATABASE_URL="file:$DATA_DIR/prod.db"
echo "[start] DATABASE_URL=$DATABASE_URL"

SERVER=""
for candidate in ./server.js /app/server.js ./.next/standalone/server.js; do
  if [ -f "$candidate" ]; then
    SERVER="$candidate"
    break
  fi
done

if [ -z "$SERVER" ]; then
  echo "[start] FATAL: server.js not found"
  find . -name 'server.js' 2>/dev/null | head -20 || true
  exit 1
fi

echo "[start] exec node $SERVER"
exec node "$SERVER"
