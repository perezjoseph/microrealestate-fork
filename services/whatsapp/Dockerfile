FROM node:20-alpine

WORKDIR /usr/app

# Copy package files and install dependencies
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 8500

# Start the service
CMD ["node", "src/index.js"]
