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
RUN DATABASE_URL="file:./prisma/template.db" npx prisma db push
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN mkdir -p /data
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/package.json ./package.json
# Inline start avoids Windows CRLF breaking Alpine /bin/sh scripts
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/data/prod.db"
CMD ["sh","-c","mkdir -p /data && if [ ! -f /data/prod.db ]; then cp prisma/template.db /data/prod.db; fi && export DATABASE_URL=file:/data/prod.db && exec node server.js"]
