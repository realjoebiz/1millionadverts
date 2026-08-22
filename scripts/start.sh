#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

# Named volumes are often root-owned; fix so the app user can write SQLite.
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$DATA_DIR" || true
fi

if [ ! -f "$DATA_DIR/prod.db" ]; then
  echo "Seeding empty SQLite database into $DATA_DIR/prod.db"
  if [ ! -f /app/prisma/template.db ]; then
    echo "FATAL: missing /app/prisma/template.db"
    ls -la /app/prisma || true
    exit 1
  fi
  cp /app/prisma/template.db "$DATA_DIR/prod.db"
  if [ "$(id -u)" = "0" ]; then
    chown nextjs:nodejs "$DATA_DIR/prod.db" || true
  fi
fi

export DATABASE_URL="file:$DATA_DIR/prod.db"
echo "Starting Next.js with DATABASE_URL=$DATABASE_URL"

if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs node server.js
fi
exec node server.js
