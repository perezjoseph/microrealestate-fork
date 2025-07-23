FROM node:22-bookworm-slim AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/gateway/package.json ./services/gateway/
RUN yarn workspaces focus @microrealestate/gateway --production

FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/gateway/package.json ./services/gateway/
RUN yarn workspaces focus @microrealestate/gateway

FROM build-deps AS build
WORKDIR /usr/app
# Build types first
RUN cd types && npm run build
# Build common package
RUN cd services/common && npm run build
# Build gateway service
COPY services/gateway/src ./services/gateway/src
COPY services/gateway/tsconfig.json ./services/gateway/
WORKDIR /usr/app/services/gateway
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy workspace dependencies and built packages
COPY --from=workspace-deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/types/dist ./types/dist
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/common/package.json ./services/common/
COPY --from=build /usr/app/services/gateway/dist ./services/gateway/dist
COPY --from=build /usr/app/services/gateway/package.json ./services/gateway/

WORKDIR /usr/app/services/gateway
USER 1000
CMD ["dist/index.js"]
