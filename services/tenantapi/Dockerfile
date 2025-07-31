FROM node:22-bookworm-slim AS base

# Build workspace dependencies (production only)
FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/tenantapi/package.json ./services/tenantapi/
RUN yarn workspaces focus @microrealestate/tenantapi --production

# Build workspace dependencies (including dev dependencies)
FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/tenantapi/package.json ./services/tenantapi/
RUN yarn workspaces focus @microrealestate/tenantapi

FROM build-deps AS build
WORKDIR /usr/app
# Build types first
RUN cd types && npm run build
# Build common package
RUN cd services/common && npm run build
# Build tenantapi service
COPY services/tenantapi/src ./services/tenantapi/src
COPY services/tenantapi/tsconfig.json ./services/tenantapi/
WORKDIR /usr/app/services/tenantapi
RUN npm run build

FROM base
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy built dependencies and source code
COPY --from=workspace-deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/types/dist ./types/dist
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/common/package.json ./services/common/
COPY --from=build /usr/app/services/tenantapi/dist ./dist
COPY --from=build /usr/app/services/tenantapi/package.json ./

USER 1000
CMD ["node", "dist/index.js"]
