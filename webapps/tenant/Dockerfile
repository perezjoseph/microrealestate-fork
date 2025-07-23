FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /usr/app
COPY webapps/tenant/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build
WORKDIR /usr/app
ENV BASE_PATH=/__MRE_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install all dependencies (including dev)
COPY webapps/tenant/package*.json ./
RUN npm ci

# Copy source code and configuration files
COPY webapps/tenant/.eslintrc.json ./
COPY webapps/tenant/components.json ./
COPY webapps/tenant/next.config.js ./
COPY webapps/tenant/postcss.config.js ./
COPY webapps/tenant/tailwind.config.ts ./
COPY webapps/tenant/tsconfig.json ./
COPY webapps/tenant/locales ./locales
COPY webapps/tenant/public ./public
COPY webapps/tenant/src ./src

# Build the application
RUN npm run build

# Set proper permissions
RUN chown -R 1000 ./.next && \
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
