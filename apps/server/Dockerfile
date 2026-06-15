FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install all workspace deps
RUN npm ci

# Build packages/shared first so server can depend on its dist output
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN npm run build

# Now build the server
WORKDIR /app/apps/server
COPY apps/server ./
RUN npm run build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

WORKDIR /app/apps/server
EXPOSE 5000
CMD ["npm", "start"]
