# ─── Stage 1: Install ALL deps (including devDeps for build) ──────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./

# Copy frontend package manifest
COPY frontend/package.json ./frontend/

# Install all dependencies (dev included — needed for next build)
RUN npm ci --workspace=frontend

# ─── Stage 2: Build Next.js ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules 2>/dev/null || true

# Copy frontend source
COPY frontend ./frontend

# Pass ARG and set ENV for Next.js build time
ARG NEXT_PUBLIC_METRICS_SSE_URL
ENV NEXT_PUBLIC_METRICS_SSE_URL=$NEXT_PUBLIC_METRICS_SSE_URL

# Build — output: standalone generates .next/standalone
RUN cd frontend && npx next build

# ─── Stage 3: Minimal runtime image ───────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server bundle (self-contained, no node_modules needed)
COPY --from=builder /app/frontend/.next/standalone ./
# Copy static assets
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

USER nextjs

EXPOSE 3000

# Next.js standalone entrypoint
CMD ["node", "frontend/server.js"]
