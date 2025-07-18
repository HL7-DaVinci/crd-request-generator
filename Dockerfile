# Multi-stage build for smaller production image
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install wget for health check
RUN apk add --no-cache wget

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=appuser:nodejs /app/build ./build
COPY --from=builder --chown=appuser:nodejs /app/server.js ./server.js

# Create default db.json file
RUN echo '{}' > db.json && chown appuser:nodejs db.json

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start only the backend (frontend is already built)
CMD ["npm", "run", "production"]