FROM node:22-alpine

WORKDIR /usr/app

# Copy package files and install dependencies
ENV NODE_ENV=production
COPY services/whatsapp/package*.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY services/whatsapp/src ./src

# Expose port
EXPOSE 8500

# Start the service
CMD ["node", "src/index.js"]
