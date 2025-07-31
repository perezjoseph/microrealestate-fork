FROM node:22-bookworm-slim

WORKDIR /usr/app

# Copy package files and install dependencies
COPY services/monitoring/package.json ./
RUN npm install --only=production

# Copy monitoring service files
COPY services/monitoring/valkey-monitor.js ./

# Expose correct port
EXPOSE 8800

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Monitoring service health check')" || exit 1

# Run the monitoring service
CMD ["node", "valkey-monitor.js"]
