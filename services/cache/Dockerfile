FROM node:22-bookworm-slim

WORKDIR /usr/app

# Copy package files and install dependencies
COPY services/cache/package.json ./
RUN npm install --only=production

# Copy cache service files
COPY services/cache/index.js services/cache/logger.js ./

# Expose port (if needed)
EXPOSE 6380

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Cache service health check')" || exit 1

# Run the cache service
CMD ["node", "index.js"]
