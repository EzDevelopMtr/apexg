# =====================================================
# APEX GYM — una sola imagen de build, dos destinos: backend y web.
# docs/plan-multi-gimnasio.md, fase 6. Uno para TODOS los gimnasios.
# =====================================================

# Debian y no Alpine: argon2 es nativo y sus binarios precompilados son glibc.
FROM node:22-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @apexg/backend build && pnpm --filter @apexg/web build

FROM build AS backend
WORKDIR /app/apps/backend
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM build AS web
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
