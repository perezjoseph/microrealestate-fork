FROM node:18-alpine

WORKDIR /usr/app

# Copy package files
COPY services/whatsapp/package*.json ./
COPY services/whatsapp/yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY services/whatsapp/src/ ./src/

# Expose port
EXPOSE 8500

# Start the service
CMD ["node", "src/index.js"]
