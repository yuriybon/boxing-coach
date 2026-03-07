# Use node 20 as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend (creates dist/)
RUN npm run build

# Expose the port (Cloud Run will provide PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
