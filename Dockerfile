# Multi-stage build for Faultend
FROM node:20.18.1-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY public/ ./public/
COPY migrations/ ./migrations/

# Create data directory for persistence
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["sh", "-c", "echo '[DEBUG] .env file contents:' && cat .env 2>/dev/null || echo '[DEBUG] No .env file found' && echo '[DEBUG] Environment variables:' && env | sort && echo '' && node src/index.js"]
