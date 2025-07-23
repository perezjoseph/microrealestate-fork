FROM node:20-bookworm-slim AS base

FROM base AS build
WORKDIR /usr/app

# Copy package files and install dependencies
COPY services/gateway/package*.json ./
RUN npm install

# Copy shared dependencies
COPY types ./types
COPY services/common ./services/common

# Copy source code and build
COPY services/gateway/src ./src
COPY services/gateway/tsconfig.json ./
RUN npm run build

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production
COPY services/gateway/package*.json ./
RUN npm install && npm cache clean --force

FROM gcr.io/distroless/nodejs20-debian12
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy production dependencies and built code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/dist ./dist
COPY --from=build /usr/app/package*.json ./

USER 1000
CMD ["dist/index.js"]
