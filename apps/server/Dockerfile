FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/
RUN npm ci

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

WORKDIR /app/apps/server
RUN npm run build

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
