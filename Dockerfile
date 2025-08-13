# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Use --legacy-peer-deps to avoid issues with some dependency versions
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Install backend dependencies
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app
# Install nginx
RUN apk add --no-cache nginx

# Copy built frontend from the builder stage
COPY --from=frontend-builder /app/frontend/dist /var/www/frontend

# Copy backend code and dependencies from the backend-builder stage
COPY --from=backend-builder /app/backend ./backend
COPY backend/ ./backend

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for nginx
EXPOSE 80

# Create a startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx &' >> /app/start.sh && \
    echo 'exec node backend/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]
