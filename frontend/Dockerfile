# syntax=docker/dockerfile:1.7

# ---------- build: compile the Vite SPA ----------
FROM node:20-alpine AS build
WORKDIR /app

# Vite inlines VITE_* vars at build time, so they must be present here.
ARG VITE_API_URL
ARG VITE_AUTH_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_WS_URL=$VITE_WS_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime: nginx serving static assets ----------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
