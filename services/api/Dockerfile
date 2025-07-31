FROM node:22-alpine AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/api/package.json ./services/api/
RUN yarn workspaces focus @microrealestate/api --production

FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/api/package.json ./services/api/
RUN yarn workspaces focus @microrealestate/api

FROM build-deps AS build
WORKDIR /usr/app
# Build types first
RUN cd types && npm run build
# Build common package
RUN cd services/common && npm run build

FROM base
ENV NODE_ENV=production
RUN apk --no-cache add mongodb-tools
WORKDIR /usr/app

# Copy workspace dependencies and built packages
COPY --from=workspace-deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/types/dist ./types/dist
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/common/package.json ./services/common/
COPY services/api/src ./services/api/src
COPY services/api/scripts ./services/api/scripts
COPY services/api/package.json ./services/api/

WORKDIR /usr/app/services/api
USER 1000
CMD ["node", "src/index.js"]
