#!/bin/sh
set -e
if [ -f node_modules/prisma/build/index.js ]; then
  node node_modules/prisma/build/index.js db push --skip-generate
elif [ -f node_modules/.bin/prisma ]; then
  ./node_modules/.bin/prisma db push --skip-generate
else
  echo "WARNING: prisma CLI missing; skipping db push"
fi
exec node server.js
