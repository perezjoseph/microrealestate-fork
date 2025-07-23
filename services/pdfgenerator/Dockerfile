FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app

# Copy production dependencies and source code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./

USER 1000
CMD ["node", "src/index.js"]
