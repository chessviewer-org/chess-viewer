# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Base — pinned Node + pnpm (version comes from package.json "packageManager")
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true
# Enable corepack and activate the exact pnpm pinned in package.json.
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN corepack prepare --activate

# ---------------------------------------------------------------------------
# Deps — full install (incl. dev deps) with a cached pnpm store
# ---------------------------------------------------------------------------
FROM base AS deps
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Build — compile the production bundle
# ---------------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Development — hot-reload dev server (source is bind-mounted via compose)
# ---------------------------------------------------------------------------
FROM deps AS development
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]

# ---------------------------------------------------------------------------
# Production — static assets served by nginx, unprivileged
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production
# Drop default config and ship our SPA-aware one.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Run nginx as the unprivileged "nginx" user (nginx.conf listens on 8080).
RUN sed -i '/^user /d' /etc/nginx/nginx.conf \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/cache/nginx /var/run/nginx.pid /usr/share/nginx/html
USER nginx

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
