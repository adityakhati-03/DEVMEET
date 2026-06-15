FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install all workspace deps
RUN npm ci

# Copy all source
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Build server (tsconfig includes shared sources for type-checking)
WORKDIR /app/apps/server
RUN npm run build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Explicitly place @devmeet/shared in node_modules so Node can resolve it at runtime
# (npm workspace symlinks don't survive Docker COPY)
RUN mkdir -p ./node_modules/@devmeet/shared
COPY --from=builder /app/packages/shared/package.json ./node_modules/@devmeet/shared/package.json
COPY --from=builder /app/packages/shared/src ./node_modules/@devmeet/shared/src

WORKDIR /app/apps/server
EXPOSE 5000
CMD ["npm", "start"]
