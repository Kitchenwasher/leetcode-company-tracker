# Multi-stage build for LeetTracker Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo files and backend package.json
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

RUN npm install --workspace=backend

# Copy source and build
COPY backend/ ./backend/
RUN cd backend && npm run build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install --omit=dev --workspace=backend

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "dist/server.js"]
