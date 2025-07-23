FROM node:20.17-alpine3.20 AS base

FROM base AS build
RUN apk --no-cache add build-base python3
WORKDIR /usr/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY src ./src

FROM base AS deps
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base
ENV NODE_ENV=production
RUN apk --no-cache add mongodb-tools
WORKDIR /usr/app

# Copy production dependencies and source code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./

USER 1000
CMD ["node", "src/index.js"]
