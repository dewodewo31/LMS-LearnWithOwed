# Deployment — LearnWithOwed

---

## 1. Environment Options

| Option | Command | Use Case |
| ------ | ------- | -------- |
| Docker Compose | `docker compose up` | Local development |
| Docker Compose Prod | `docker compose -f docker-compose.prod.yml up -d` | Production |
| Manual | Node.js + MongoDB | Custom setup |

---

## 2. Docker Development

```bash
# Start all services
docker compose up

# Detached mode
docker compose up -d

# Stop
docker compose down

# Rebuild
docker compose up --build
```

### Services

| Service | Port | Description |
| ------- | ---- | ----------- |
| mongo | 27017 | MongoDB 7 |
| server | 5000 | Express API |
| client | 5173 | Vite dev server |

---

## 3. Docker Production

```bash
# Start production stack
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop
docker compose -f docker-compose.prod.yml down
```

### Production Services

| Service | Port | Description |
| ------- | ---- | ----------- |
| mongo | internal | MongoDB 7 (not exposed) |
| server | 5000 | Express API |
| client | 80 | Nginx serving React |

---

## 4. Environment Variables

### Required for Production

```bash
JWT_ACCESS_SECRET=<random-64-char-hex>
JWT_REFRESH_SECRET=<random-64-char-hex>
FRONTEND_URL=https://yourdomain.com
```

### Generate Secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 5. Dockerfile (Server)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

---

## 6. Dockerfile (Client)

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 7. Nginx Configuration

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 8. Database

### MongoDB Setup

```bash
# Production: use managed MongoDB Atlas or self-hosted
# Connection string format:
mongodb://<username>:<password>@<host>:<port>/<dbname>
```

### Backup

```bash
# Dump
mongodump --uri="mongodb://..." --out=/backup

# Restore
mongorestore --uri="mongodb://..." /backup
```

---

## 9. SSL/TLS

### Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Docker with SSL

```yaml
# docker-compose.prod.yml
services:
  client:
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt
```

---

## 10. Monitoring

### Health Check Endpoint

```bash
curl http://localhost:5000/health
# {"success":true,"message":"OK","data":{"uptime":12345.678}}
```

### Docker Health Check

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 11. Logging

### Docker Logs

```bash
# View logs
docker compose logs -f server

# Limit log size
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Production Log Aggregation

Consider:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- Sentry (error tracking)

---

## 12. Common Issues

### Port Already in Use

```bash
# Find process on port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### MongoDB Connection Refused

```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check connection string
echo $MONGODB_URI
```

### CORS Errors

- Verify `FRONTEND_URL` matches exactly
- Check protocol (http vs https)
- Ensure cookies are sent with `credentials: true`

---

## 13. Rollback

### Docker

```bash
# List images
docker images

# Rollback to previous version
docker compose -f docker-compose.prod.yml up -d --no-deps server
```

### Database

```bash
# Restore from backup
mongorestore --uri="mongodb://..." /backup/2026-09-15
```
