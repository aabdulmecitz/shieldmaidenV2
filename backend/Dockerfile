# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed (e.g., for native modules)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDeps if build scripts need them)
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl/wget for healthcheck
RUN apk add --no-cache curl

# Create user/group (node:node exists by default in alpine ref, but ensuring permissions)
# We will use the default 'node' user

# Copy production node_modules and app from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app .

# Create uploads directory and set permissions
RUN mkdir -p uploads/temp uploads/encrypted && \
    chown -R node:node uploads

# Switch to non-root user
USER node

# Environment Variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose Port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start
CMD ["node", "server.js"]
