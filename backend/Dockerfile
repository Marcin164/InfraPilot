# syntax=docker/dockerfile:1.7

# ---------- deps: install full deps (incl. dev) for the build ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build: compile NestJS to dist/ ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- prod-deps: prune to production dependencies only ----------
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- runtime: minimal image, non-root, only what we ship ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# wget is used by HEALTHCHECK; tini gives us PID 1 signal handling;
# iputils provides a setuid `ping` binary so the non-root `app` user below
# can still send ICMP (used by the device availability monitor).
RUN apk add --no-cache tini wget iputils \
 && addgroup -S app && adduser -S app -G app

COPY --from=prod-deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build     --chown=app:app /app/dist         ./dist
COPY --chown=app:app package.json ./

# Writable uploads/certs dirs — mount a volume here in compose / EFS on AWS.
RUN mkdir -p /app/uploads /app/certs && chown -R app:app /app/uploads /app/certs

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
