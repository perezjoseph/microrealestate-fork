FROM node:20.17-alpine3.20 AS base

FROM base AS build
RUN apk --no-cache add build-base python3
WORKDIR /usr/app

# Copy package files and install dependencies
COPY services/api/package*.json ./
RUN npm install

# Copy source code
COPY services/api/src ./src

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production
COPY services/api/package*.json ./
RUN npm install && npm cache clean --force

FROM base
ENV NODE_ENV=production
RUN apk --no-cache add mongodb-tools
WORKDIR /usr/app

# Copy production dependencies and source code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY services/api/src ./src
COPY services/api/package*.json ./

USER 1000
CMD ["node", "src/index.js"]
