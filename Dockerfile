# Next.js 14 standalone + Prisma SQLite
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# SQLite paths are relative to the schema dir (prisma/), not repo root
RUN DATABASE_URL="file:./template.db" npx prisma db push
RUN test -f prisma/template.db && ls -la prisma
RUN npm run build
# Prove standalone layout during build (shows up in Coolify build logs)
RUN echo "=== standalone tree ===" && find .next/standalone -maxdepth 3 -type f -name 'server.js' -o -name 'package.json' | head -50 && ls -la .next/standalone && ls -la prisma

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir -p /data
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/data/prod.db"
# Absolute paths + diagnostics so Coolify logs show the real failure
CMD ["sh","-c","set -x; echo PWD=$(pwd); ls -la /app; ls -la /app/prisma; mkdir -p /data; TEMPLATE=; for f in /app/prisma/template.db /app/prisma/prisma/template.db; do if [ -f \"$f\" ]; then TEMPLATE=$f; break; fi; done; if [ -z \"$TEMPLATE\" ]; then echo MISSING_TEMPLATE; find /app -name '*.db'; exit 1; fi; test -f /data/prod.db || cp \"$TEMPLATE\" /data/prod.db; export DATABASE_URL=file:/data/prod.db; test -f /app/server.js || { echo MISSING_SERVER; find /app -name server.js; exit 1; }; exec node /app/server.js"]
