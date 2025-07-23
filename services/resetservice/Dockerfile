FROM node:22-bookworm-slim AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/resetservice/package.json ./services/resetservice/
RUN yarn workspaces focus @microrealestate/resetservice --production

FROM base
ENV NODE_ENV=production
WORKDIR /usr/app

# Copy workspace dependencies and source code
COPY --from=workspace-deps /usr/app ./
COPY services/resetservice/src ./services/resetservice/src

WORKDIR /usr/app/services/resetservice
USER 1000
CMD ["node", "src/index.js"]
