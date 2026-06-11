FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/worker/package*.json ./apps/worker/
RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

WORKDIR /app/apps/worker
RUN npm run build

FROM node:20-alpine
# Install Docker CLI so the worker can spawn execution containers
RUN apk add --no-cache docker-cli

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker/package*.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker
CMD ["npm", "start"]
