# Railway için optimize edilmiş Dockerfile
FROM node:18-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Package.json dosyalarını kopyala
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Frontend build
WORKDIR /app/frontend
RUN npm ci --only=production
COPY frontend/ ./
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Backend setup
WORKDIR /app/backend
RUN npm ci --only=production
COPY backend/ ./

# Frontend build'i backend public klasörüne kopyala
COPY --from=0 /app/frontend/build ./public

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Railway için gerekli environment variables
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG FRONTEND_URL
ENV FRONTEND_URL=$FRONTEND_URL

# Port exposure
EXPOSE 5000

# Health check için curl ekle
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Uygulamayı başlat
CMD ["node", "server.js"] 