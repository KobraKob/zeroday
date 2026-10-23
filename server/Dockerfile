# ZeroDay Railway Backend
FROM node:20-alpine AS builder

WORKDIR /app

# The service has its own pinned package manifest. A lockfile is not yet checked
# in, so use npm install instead of npm ci (which requires a lockfile).
COPY server/package.json ./
RUN npm install --no-audit --no-fund

COPY server/tsconfig.json ./
COPY server/src ./src
COPY data /app/data

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

EXPOSE 8080

CMD ["node", "dist/index.js"]
