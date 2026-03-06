# ─── Stage 1: Build ───
FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
COPY libs/prisma-db/prisma ./libs/prisma-db/prisma/
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bunx prisma generate --schema=libs/prisma-db/prisma/schema.prisma

# Build API
RUN bunx nx build api --configuration=production

# ─── Stage 2: Production ───
FROM oven/bun:1-slim AS production
WORKDIR /app

# Add non-root user
RUN addgroup --system --gid 1001 opshub && \
    adduser --system --uid 1001 opshub

# Copy built output and node_modules
COPY --from=builder /app/dist/apps/api ./dist/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/libs/prisma-db/prisma ./prisma/

# Create uploads directory
RUN mkdir -p uploads exports && chown -R opshub:opshub uploads exports

USER opshub

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD bun --eval "const r=await fetch('http://localhost:3000/api/health');process.exit(r.ok?0:1)"

CMD ["bun", "dist/main.js"]
