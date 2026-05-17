FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# ── Dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY . .
RUN pnpm build

# ── Prod ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
