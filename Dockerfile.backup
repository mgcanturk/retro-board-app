# 1. Frontend build aşaması
FROM node:18-slim AS frontend-build
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm ci && npm run build

# 2. Backend build aşaması
FROM node:18-slim AS backend-build
WORKDIR /app
COPY backend ./backend
ARG FRONTEND_URL
ENV FRONTEND_URL=$FRONTEND_URL
COPY --from=frontend-build /app/frontend/build ./backend/public
WORKDIR /app/backend
RUN npm ci

# 3. Final image
FROM node:18-slim
WORKDIR /app/backend
COPY --from=backend-build /app/backend .
ENV NODE_ENV=production
CMD ["node", "server.js"] 