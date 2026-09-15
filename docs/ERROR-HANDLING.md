# Error Handling — LearnWithOwed

---

## 1. Response Format

### Success

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": { "id": "...", "title": "..." }
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title must be at least 3 characters",
    "price": "Price must be a positive number"
  }
}
```

---

## 2. HTTP Status Codes

| Code | Meaning | Usage |
| ---- | ------- | ----- |
| 200 | OK | Successful GET, update |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid JSON, missing fields, Multer errors |
| 401 | Unauthorized | Missing/invalid JWT, expired token |
| 403 | Forbidden | Valid JWT but insufficient role |
| 404 | Not Found | Resource not found, route not found |
| 409 | Conflict | Duplicate unique field |
| 422 | Unprocessable Entity | Zod validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

---

## 3. Error Middleware

### Route Not Found

```javascript
const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
```

### Global Error Handler

```javascript
const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors;
  // ... Mongoose error mapping ...
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
```

---

## 4. Mongoose Error Mapping

| Error | Status | Message |
| ----- | ------ | ------- |
| `MongoServerError` (code 11000) | 409 | `Duplicate value for: field` |
| `ValidationError` | 422 | `Validation failed` + field errors |
| `CastError` | 404 | `Resource not found` |

---

## 5. JWT Errors

| Error | Status | Message |
| ----- | ------ | ------- |
| `JsonWebTokenError` | 401 | `Invalid token` |
| `TokenExpiredError` | 401 | `Token expired` |

---

## 6. File Upload Errors (Multer)

| Error | Status | Message |
| ----- | ------ | ------- |
| `LIMIT_FILE_SIZE` | 400 | `File too large (max 2 MB)` |
| Other `MulterError` | 400 | `err.message` |

---

## 7. Body Parser Errors

| Error | Status | Message |
| ----- | ------ | ------- |
| `entity.too.large` | 400 | `Request body too large` |
| `entity.parse.failed` | 400 | `Malformed JSON body` |

---

## 8. Production Safety

```javascript
// Never leak internals
if (status >= 500) {
  message = 'Internal Server Error';
  errors = undefined;
}

// Only log in non-production
if (!config.isProd && status >= 400) {
  console.error('[error]', status, err.stack || err);
}
```

---

## 9. Client-Side Error Handling

### Axios Interceptors

```javascript
// Automatic token refresh on 401
if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  await refreshAccessToken();
  return axios(originalRequest);
}
```

### Toast Notifications (Sonner)

```javascript
import { toast } from 'sonner';

// Success
toast.success('Course created successfully');

// Error
toast.error('Failed to save changes');

// Info
toast.info('Your changes have been saved');
```

### Form Errors

```javascript
// Zod validation on client
const result = schema.safeParse(formData);
if (!result.success) {
  setErrors(result.error.flatten().fieldErrors);
}
```

---

## 10. Custom ApiError Class

```javascript
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Usage
throw new ApiError(403, 'You do not have permission');
throw new ApiError(422, 'Validation failed', { title: 'Required' });
```

---

## 11. Error Logging Format

```
[error] 409 Duplicate value for: email
[error] 401 Authentication required
[error] 500 Internal Server Error
```

Production: no stack traces in logs.
Development: full stack traces logged.
