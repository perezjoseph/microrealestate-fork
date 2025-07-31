FROM node:22-bookworm-slim AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/emailer/package.json ./services/emailer/
RUN yarn workspaces focus @microrealestate/emailer --production

FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/emailer/package.json ./services/emailer/
RUN yarn workspaces focus @microrealestate/emailer

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
COPY services/emailer/src ./services/emailer/src
COPY services/emailer/package.json ./services/emailer/

# Create tmp directory with proper permissions
RUN mkdir -p /usr/app/services/emailer/tmp && \
    chown -R 1000:1000 /usr/app/services/emailer/tmp

WORKDIR /usr/app/services/emailer
USER 1000
CMD ["node", "src/index.js"]
