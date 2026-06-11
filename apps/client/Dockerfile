FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package and workspace definitions
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/client/package*.json ./apps/client/

# Install dependencies
RUN npm ci

# Copy source
COPY packages/shared ./packages/shared
COPY apps/client ./apps/client

# Build client
WORKDIR /app/apps/client
RUN npm run build

# Production server
FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
# SPA routing fallback
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; try_files \$uri /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
