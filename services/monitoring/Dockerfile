FROM node:22-bookworm-slim

WORKDIR /usr/app

# Install dependencies
COPY package.json ./
RUN npm install --only=production redis express

# Copy monitoring service
COPY services/monitoring/ ./

EXPOSE 8600

CMD ["node", "valkey-monitor.js"]
