FROM node:20-alpine

WORKDIR /usr/app

# Copy package files and install dependencies
COPY services/whatsapp/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY services/whatsapp/src/ ./src/

# Expose port
EXPOSE 8500

# Start the service
CMD ["node", "src/index.js"]
