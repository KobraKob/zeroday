# ZeroDay Railway Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root data files and server package manifests
COPY server/package*.json ./
RUN npm ci

# Copy server code and data
COPY server/tsconfig.json ./
COPY server/src ./src
COPY data ../data

# Build TypeScript to JavaScript
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY server/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY data /app/data

EXPOSE 8080

CMD ["node", "dist/index.js"]
