# @template Dockerfile
# @version 4.1.0
# @description Multi-stage Docker build for DEMO001 tenant app.
#              Stage 1: Vite SPA build. Stage 2: Nginx static serving.

# Stage 1: Build - Install deps and build Vite SPA
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_MIDDLEWARE_URL=""
ARG VITE_BASE_PATH="/"
ENV VITE_MIDDLEWARE_URL=$VITE_MIDDLEWARE_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

# Stage 2: Serve - nginx for static SPA
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
