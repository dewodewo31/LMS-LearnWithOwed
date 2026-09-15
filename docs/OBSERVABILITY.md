# Observability — LearnWithOwed

---

## 1. Logging

### Morgan (HTTP Logs)

```javascript
// app.js
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));
```

| Environment | Format | Output |
| ----------- | ------ | ------ |
| Development | `dev` | Color-coded, concise |
| Production | `combined` | Full Apache-style |
| Test | none | Disabled |

### Console Logging

```javascript
// error.js
if (!config.isProd && status >= 400) {
  console.error('[error]', status, err.stack || err);
}
```

- Development: logs 4xx+ errors with stack
- Production: stack traces suppressed
- 500 errors: generic "Internal Server Error" to client

---

## 2. Health Check

```javascript
app.get('/health', (_req, res) => 
  res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } })
);
```

Response:
```json
{
  "success": true,
  "message": "OK",
  "data": { "uptime": 12345.678 }
}
```

---

## 3. Audit Logging

### What's Logged

All sensitive actions create `AuditLog` entries:

| Action | Entity | Example |
| ------ | ------ | ------- |
| `USER_LOGIN` | user | Login success |
| `USER_LOGOUT` | user | Logout |
| `PASSWORD_CHANGED` | user | Password update |
| `COURSE_CREATED` | course | New course |
| `COURSE_UPDATED` | course | Edit course |
| `COURSE_DELETED` | course | Soft delete |
| `COURSE_PUBLISHED` | course | Status change |
| `STUDENT_CREATED` | student | New student |
| `ENROLLMENT_CREATED` | enrollment | Manual enrollment |
| `PAYMENT_COMPLETED` | payment | Midtrans webhook |
| `CERTIFICATE_ISSUED` | certificate | Course completion |

### Log Entry Structure

```json
{
  "userId": "...",
  "action": "COURSE_CREATED",
  "entity": "course",
  "entityId": "...",
  "meta": { "title": "..." },
  "ip": "127.0.0.1",
  "userAgent": "...",
  "createdAt": "2026-09-15T..."
}
```

---

## 4. Error Tracking

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": { "field": "specific issue" }
}
```

### Error Types Tracked

| Error Type | Status Code | Source |
| ---------- | ----------- | ------ |
| Validation | 422 | Zod, Mongoose |
| Authentication | 401 | JWT, missing token |
| Authorization | 403 | Role check |
| Not Found | 404 | Resource, route |
| Conflict | 409 | Duplicate key |
| Rate Limit | 429 | Rate limiter |
| Bad Request | 400 | Body parser, Multer |
| Server Error | 500 | Unexpected |

---

## 5. Performance Monitoring

### Request Metrics (Morgan)

Development format example:
```
POST /api/v1/courses 201 45.123 ms - 256
```

- HTTP method
- Route
- Status code
- Response time
- Response size

### Database Queries

Mongoose debug mode (development):
```javascript
mongoose.set('debug', true);
```

Logs all queries with execution time.

---

## 6. Client-Side Observability

### TanStack Query DevTools

Available in development:
```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

### Network Request Logging

Vite proxy logs all API requests in development.

---

## 7. Production Monitoring

### Recommended (Not Implemented)

| Tool | Purpose |
| ---- | ------- |
| Sentry | Error tracking |
| Prometheus | Metrics |
| Grafana | Dashboards |
| APM (New Relic/Datadog) | Performance |

### Current State

- No external error tracking
- No metrics collection
- No distributed tracing
- Logs go to stdout/stderr only

---

## 8. Log Rotation

### Development

- Logs written to console
- No rotation needed

### Production

- Docker logs: `docker logs --max-size 10m`
- Optional: configure Morgan to write to file
- Consider log aggregation service

---

## 9. Debugging

### Environment Variables

```bash
# Enable Mongoose debugging
DEBUG=mongoose:* npm start

# Node.js debug
node --inspect src/server.js
```

### Common Debug Patterns

```javascript
// Add temporary debug logging
console.log('[debug] user:', req.user);
console.log('[debug] body:', req.body);

// Remove before commit
```

---

## 10. Alerting

### Not Implemented

Currently no alerting system. Recommended thresholds:

| Metric | Threshold | Action |
| ------ | --------- | ------ |
| Error rate | > 5% in 5 min | Alert |
| Response time | > 2s avg | Alert |
| Memory usage | > 80% | Alert |
| Disk usage | > 90% | Alert |
| Failed auth | > 20 in 1 min | Alert |
