# Use lightweight LTS Node image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy backend source code files
COPY . .

# Expose server port
EXPOSE 5000

# Start Express server command
CMD ["node", "src/server.js"]
