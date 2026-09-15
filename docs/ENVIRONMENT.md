# Environment Variables — LearnWithOwed

**File:** `server/src/config/env.js`
**Template:** `server/.env.example`

---

## 1. Required Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/kn-lms` |
| `JWT_ACCESS_SECRET` | Access token signing secret | (required) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | (required) |

---

## 2. Optional Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `JWT_ACCESS_EXPIRES` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token expiry | `7d` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `UPLOAD_PATH` | Public upload directory | `./uploads` |
| `ASSIGNMENT_UPLOAD_PATH` | Private assignment files | `./uploads-private/assignments` |

---

## 3. Seed Variables (Development)

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `SEED_ADMIN_EMAIL` | Admin seed email | `admin@lms.test` |
| `SEED_ADMIN_PASSWORD` | Admin seed password | `admin12345` |
| `SEED_MENTOR_EMAIL` | Mentor seed email | `mentor@lms.test` |
| `SEED_MENTOR_PASSWORD` | Mentor seed password | `mentor12345` |
| `SEED_STUDENT_EMAIL` | Student seed email | `student@lms.test` |
| `SEED_STUDENT_PASSWORD` | Student seed password | `student12345` |

---

## 4. Environment Loading

```javascript
// env.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
require('dotenv').config(); // fallback to plain .env
```

Priority:
1. `.env.{NODE_ENV}` (e.g., `.env.production`)
2. `.env`
3. Process environment

---

## 5. Environment-Specific Behavior

### Development

- Morgan `dev` format
- Console error logging with stack traces
- CORS: localhost origins
- Cookies: not secure

### Production

- Morgan `combined` format
- Stack traces suppressed
- CORS: specific origin only
- Cookies: `Secure` flag

### Test

- MongoDB Memory Server (in-memory)
- Rate limiting disabled
- Morgan disabled
- JWT secrets: test defaults

---

## 6. Validation

```javascript
const required = (name, fallback) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
};
```

Required variables throw on startup if missing (except in test mode).

---

## 7. Frontend Environment

### Vite Variables

| Variable | Description |
| -------- | ----------- |
| `VITE_API_URL` | Backend API URL |

### Development Proxy

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

---

## 8. Docker Environment

### Development (docker-compose.yml)

```yaml
environment:
  - NODE_ENV=development
  - PORT=5000
  - MONGODB_URI=mongodb://mongo:27017/kn-lms
  - JWT_ACCESS_SECRET=dev-access-secret-...
  - JWT_REFRESH_SECRET=dev-refresh-secret-...
```

### Production (docker-compose.prod.yml)

```yaml
environment:
  - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
  - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
  - FRONTEND_URL=${FRONTEND_URL:-http://localhost}
```

---

## 9. Security Notes

### Never Commit

- `.env` files
- `.env.development`
- `.env.production`
- Real JWT secrets
- Database credentials

### `.gitignore` Includes

```
.env
.env.*
!.env.example
```

### Secret Generation

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 10. Cookie Configuration

```javascript
// env.js
cookie: {
  httpOnly: true,
  secure: isProd,    // HTTPS only in production
  sameSite: 'lax',
},
refreshCookiePath: '/api/v1/auth',  // scoped to auth routes
```
