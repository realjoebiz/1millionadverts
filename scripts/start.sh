#!/bin/sh
# Keep going so we can see errors in Coolify logs.
set -u

DATA_DIR="${DATA_DIR:-/data}"
echo "[start] uid=$(id -u) gid=$(id -g) pwd=$(pwd)"
echo "[start] listing /app"
ls -la /app || true
echo "[start] listing /app/prisma"
ls -la /app/prisma || true

mkdir -p "$DATA_DIR" || echo "[start] mkdir $DATA_DIR failed: $?"
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || echo "[start] chown $DATA_DIR failed"
fi

if [ ! -f "$DATA_DIR/prod.db" ]; then
  echo "[start] seeding $DATA_DIR/prod.db"
  if [ ! -f /app/prisma/template.db ]; then
    echo "[start] FATAL: missing /app/prisma/template.db"
    exit 1
  fi
  cp /app/prisma/template.db "$DATA_DIR/prod.db" || {
    echo "[start] FATAL: cp to $DATA_DIR/prod.db failed"
    exit 1
  }
  if [ "$(id -u)" = "0" ]; then
    chown nextjs:nodejs "$DATA_DIR/prod.db" 2>/dev/null || true
  fi
fi

export DATABASE_URL="file:$DATA_DIR/prod.db"
echo "[start] DATABASE_URL=$DATABASE_URL"

if [ ! -f /app/server.js ]; then
  echo "[start] FATAL: /app/server.js missing"
  ls -la /app
  exit 1
fi

if [ "$(id -u)" = "0" ]; then
  echo "[start] dropping to nextjs via su-exec"
  exec su-exec nextjs node server.js
fi
echo "[start] exec node server.js"
exec node server.js
