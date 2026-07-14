# Stage 1: Build React Production Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configuration definitions
COPY package*.json ./

# Install all development and production packages
RUN npm install

# Copy source code files
COPY . .

# Compile static assets
RUN npm run build

# Stage 2: Serve Built Files using Nginx
FROM nginx:alpine

# Copy built HTML/JS static bundle from Node builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx proxy and routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx server port
EXPOSE 5173

# Start Nginx command
CMD ["nginx", "-g", "daemon off;"]
