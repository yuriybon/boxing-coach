# Stage 1: Build the frontend
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (including dev)
RUN npm ci
COPY . .
# Build frontend to dist/
RUN npm run build

# Stage 2: Production Runner
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
# Install ONLY production dependencies (skips vitest, etc.)
# NOTE: We moved 'tsx' to dependencies, so it WILL be installed here.
RUN npm ci --omit=dev

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy backend code
COPY server.ts ./
COPY src/server ./src/server

# Expose port
EXPOSE 8080

# Start
CMD ["npm", "start"]