# Stage 1: build the static bundle
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve via Nginx (static files + /api-proxy reverse proxy)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# The official image runs envsubst on *.template files in this directory at
# container start, producing /etc/nginx/conf.d/default.conf with ${API_TARGET}.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV API_TARGET=http://10.0.65.40:8080
EXPOSE 80
