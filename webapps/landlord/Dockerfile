FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM base AS build
WORKDIR /usr/app
ENV BASE_PATH=/__MRE_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code and configuration files
COPY .eslintrc.json ./
COPY locales ./locales
COPY public ./public
COPY src ./src
COPY i18n.js ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Set proper permissions and create environment file
RUN touch ./public/__ENV.js && \
    chown -R 1000 ./.next && \
    chown -R 1000 ./public

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /usr/app
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=build /usr/app/public ./public
COPY --from=build /usr/app/.next/standalone/node_modules ./node_modules
COPY --from=build /usr/app/.next/standalone ./
COPY --from=build /usr/app/.next/static ./.next/static

USER 1000
CMD ["server.js"]
