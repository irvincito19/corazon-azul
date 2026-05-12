# Stage 1: Build
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Run
FROM node:22-slim
WORKDIR /app

# Better-sqlite3 needs some libraries in the runtime if built with certain options,
# but usually slim is fine if node versions match.
# To be safe, we'll use node:22 (non-slim) for building to ensure native modules compile.

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=/app/data/local.db

RUN mkdir -p /app/data
VOLUME /app/data

EXPOSE 3000
CMD ["node", "build/index.js"]
