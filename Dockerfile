# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose app port
EXPOSE 5000

# Run the app
CMD ["node", "dist/app.js"]
