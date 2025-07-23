FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production
COPY services/authenticator/package*.json ./
RUN npm install && npm cache clean --force

FROM base
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy production dependencies and source code
COPY --from=deps /usr/app/node_modules ./node_modules
COPY services/authenticator/src ./src
COPY services/authenticator/package*.json ./

USER 1000
CMD ["node", "src/index.js"]
