FROM node:22-bookworm-slim AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/whatsapp/package.json ./services/whatsapp/
RUN yarn workspaces focus @microrealestate/whatsapp --production

FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/whatsapp/package.json ./services/whatsapp/
RUN yarn workspaces focus @microrealestate/whatsapp

FROM build-deps AS build
WORKDIR /usr/app
# Build types first
RUN cd types && npm run build
# Build common package
RUN cd services/common && npm run build

FROM base
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy workspace dependencies and built packages
COPY --from=workspace-deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/types/dist ./types/dist
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/common/package.json ./services/common/
COPY services/whatsapp/src ./services/whatsapp/src
COPY services/whatsapp/package.json ./services/whatsapp/

WORKDIR /usr/app/services/whatsapp
USER 1000
CMD ["node", "src/standalone-index.js"]
