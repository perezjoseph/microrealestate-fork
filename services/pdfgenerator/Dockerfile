FROM node:20-bookworm-slim AS base

FROM base AS workspace-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/pdfgenerator/package.json ./services/pdfgenerator/
RUN yarn workspaces focus @microrealestate/pdfgenerator --production

FROM base AS build-deps
WORKDIR /usr/app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types ./types
COPY services/common ./services/common
COPY services/pdfgenerator/package.json ./services/pdfgenerator/
RUN yarn workspaces focus @microrealestate/pdfgenerator

FROM build-deps AS build
WORKDIR /usr/app
# Build types first
RUN cd types && npm run build
# Build common package
RUN cd services/common && npm run build

FROM base
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app

# Copy workspace dependencies and built packages
COPY --from=workspace-deps /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/types/dist ./types/dist
COPY --from=build /usr/app/services/common/dist ./services/common/dist
COPY --from=build /usr/app/services/common/package.json ./services/common/
COPY services/pdfgenerator/src ./services/pdfgenerator/src
COPY services/pdfgenerator/templates ./services/pdfgenerator/templates
COPY services/pdfgenerator/data ./services/pdfgenerator/data
COPY services/pdfgenerator/package.json ./services/pdfgenerator/

# Create pdf_documents directory with proper permissions
# Let the service create tmp directory as needed
RUN mkdir -p /usr/app/services/pdfgenerator/pdf_documents && \
    chown -R 1000:1000 /usr/app/services/pdfgenerator

WORKDIR /usr/app/services/pdfgenerator
USER 1000
CMD ["node", "src/index.js"]
