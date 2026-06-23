# ─── Stage 1: Install production dependencies ─────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace manifest (needed for npm workspaces resolution)
COPY package.json package-lock.json ./

# Copy only backend package manifest
COPY backend/package.json ./backend/

# Install only production deps for the backend workspace
RUN npm ci --workspace=backend --omit=dev

# ─── Stage 2: Runtime image ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules 2>/dev/null || true

# Copy backend source
COPY backend/src ./backend/src
COPY backend/package.json ./backend/package.json

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
USER appuser

EXPOSE 3001

CMD ["node", "backend/src/server.js"]
