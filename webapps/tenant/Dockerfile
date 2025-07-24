FROM node:22-bookworm-slim AS base

# Enable corepack for proper yarn version
RUN corepack enable

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production

# Copy root workspace files including yarn release
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types/package.json ./types/
COPY webapps/commonui/package.json ./webapps/commonui/
COPY webapps/tenant/package.json ./webapps/tenant/

# Install dependencies
RUN yarn install && yarn cache clean --all

FROM base AS build
WORKDIR /usr/app
ENV BASE_PATH=/__MRE_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1

# Copy root workspace files including yarn release
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY types/ ./types/
COPY webapps/commonui/ ./webapps/commonui/
COPY webapps/tenant/ ./webapps/tenant/

# Install all dependencies
RUN yarn install

# Build types first
RUN cd types && yarn build

# Build the application
RUN cd webapps/tenant && yarn build

# Create a placeholder environment file in public directory
RUN echo 'window.__ENV = {}' > ./webapps/tenant/public/__ENV.js

# Set proper permissions
RUN chown -R 1000 ./webapps/tenant/.next && \
    chown -R 1000 ./webapps/tenant/public

FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the entire standalone build
COPY --from=build /usr/app/webapps/tenant/.next/standalone ./
# Copy static files
COPY --from=build /usr/app/webapps/tenant/.next/static ./webapps/tenant/.next/static
# Copy public files
COPY --from=build /usr/app/webapps/tenant/public ./webapps/tenant/public
# Copy runtime scripts
COPY --from=build /usr/app/webapps/commonui/scripts/replacebasepath-docker.js ./webapps/commonui/scripts/replacebasepath-docker.js
COPY --from=build /usr/app/webapps/commonui/scripts/generateruntimeenvfile-docker.js ./webapps/commonui/scripts/generateruntimeenvfile-docker.js
# Copy startup script
COPY --from=build /usr/app/webapps/tenant/startup.js ./startup.js

USER 1000
CMD ["startup.js"]
