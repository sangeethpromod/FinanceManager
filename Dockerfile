# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy the rest of the app
COPY . .

# Build TypeScript (with error handling)
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose app port
EXPOSE 5000

# Run the app
CMD ["node", "dist/app.js"]