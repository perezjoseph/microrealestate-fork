FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM base
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy production dependencies and source code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./

USER 1000
CMD ["node", "src/index.js"]
