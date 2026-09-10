FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_PROXY=/api
ARG VITE_UPLOADS_PROXY=/uploads
RUN npm run build

# --- Production: serve with nginx ---
FROM nginx:alpine AS production

# SPA routing: try_files for BrowserRouter
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
