#!/bin/sh
set -e
if [ ! -f /data/prod.db ]; then
  echo "Seeding empty SQLite database into /data/prod.db"
  cp /app/prisma/template.db /data/prod.db
fi
export DATABASE_URL="file:/data/prod.db"
exec node server.js
