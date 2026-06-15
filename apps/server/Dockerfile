FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install all workspace deps
RUN npm ci

# Copy and build packages/shared first
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN npx tsc

# Copy and build the server
WORKDIR /app
COPY apps/server ./apps/server
WORKDIR /app/apps/server
RUN npm run build

# --- Production image ---
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# The npm workspace symlink for @devmeet/shared is broken in production image.
# Replace it with the actual compiled package output.
RUN rm -f /app/node_modules/@devmeet/shared
COPY --from=builder /app/packages/shared/package.json /app/node_modules/@devmeet/shared/package.json
COPY --from=builder /app/packages/shared/dist /app/node_modules/@devmeet/shared/dist

WORKDIR /app/apps/server
EXPOSE 5000
CMD ["npm", "start"]
