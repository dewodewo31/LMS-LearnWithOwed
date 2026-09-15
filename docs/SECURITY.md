# Security — LearnWithOwed

---

## 1. Authentication

### JWT + HTTP-only Cookie

- Access token: short-lived (15m default)
- Refresh token: long-lived (7d default)
- Cookie flags: `HttpOnly`, `Secure` (production), `SameSite=lax`
- Refresh token scoped to `/api/v1/auth` path

### Password Security

- Minimum 8 characters
- Hashed with bcryptjs
- Never returned via API
- Reset token with expiration

### Token Verification

```javascript
// auth.js middleware
const token = req.cookies?.access_token 
  || req.headers.authorization?.slice(7);
```

Bearer header accepted as fallback for tests/tools.

---

## 2. Authorization

### Role Hierarchy

```
admin > mentor > student
```

### Middleware Chain

1. `authenticate` - Verify JWT, attach user
2. `authorize('admin', 'mentor')` - Check role
3. `canManageCourse` - Check ownership (mentor)

### Ownership Rules

| Resource | Admin | Mentor | Student |
| -------- | ----- | ------ | ------- |
| Course | All | Own only | Enrolled only |
| Lesson | All | Own course | Enrolled course |
| Enrollment | All | Own course | Own only |
| Assignment | All | Own course | Enrolled only |
| Submission | All | Own course | Own only |

### IDOR Protection

Parameter `:id` does not grant access. Backend verifies:
- User role
- Resource ownership
- Enrollment status

---

## 3. Input Validation

### Zod Schemas

All request bodies validated at boundary:

```javascript
const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  price: z.number().min(0),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
});
```

### MongoDB Sanitization

```javascript
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());
```

Prevents NoSQL injection via `$` operators.

---

## 4. HTML Sanitization

### CKEditor Content

All HTML from CKEditor treated as untrusted:

```javascript
// sanitizeHtml.js
const options = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'a', 'ul', 'ol', 'li', ...],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
};
```

**Stripped:** `script`, `iframe`, `object`, `embed`, event handlers, `javascript:` URLs.

### YouTube Embeds

Video lessons use dedicated YouTube embed player, not HTML iframes.

---

## 5. File Upload Security

### Multer Configuration

- Max file size: 2 MB (images), 10 MB (assignments)
- Max files per upload: 5
- Storage: `uuid.ext` (original name for display only)

### Extension Whitelist (Assignments)

```
.lua .js .jsx .ts .tsx .py .php .html .css .json .zip .txt .md 
.java .c .cpp .cs .rb .go .sql .xml .yml .yaml
```

### Storage Separation

- Public uploads: `/uploads/` (thumbnails, profile photos)
- Private uploads: `/uploads-private/assignments/` (student submissions)

Private files served only via authenticated download endpoints.

### Path Traversal Prevention

- Stored names: `uuid + ext` (no user input in path)
- Download validation: regex on storedName
- Authorization check before serving

---

## 6. Rate Limiting

| Endpoint | Limit | Window |
| -------- | ----- | ------ |
| Auth (login/register) | 5 req | 1 min |
| Forgot password | 3 req | 1 min |
| General API | 100 req | 1 min |
| Community posts | 10 req | 1 min |
| Community media | 20 req | 1 min |
| Lesson content | 60 req | 1 min |

All limits per IP (auth) or per user (community/lesson).

---

## 7. CORS Configuration

```javascript
cors({
  origin: [config.frontendUrl, 'http://localhost:5173'],
  credentials: true,
})
```

- Production: specific origin only
- Development: localhost origins
- Never: `Access-Control-Allow-Origin: *` for authenticated APIs

---

## 8. Security Headers (Helmet)

```javascript
app.use(helmet({ 
  crossOriginResourcePolicy: { policy: 'cross-origin' } 
}));
```

Default Helmet headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (production)

---

## 9. Request Limits

- JSON body: 1 MB max
- URL-encoded: 1 MB max
- File upload: 2 MB (images), 10 MB (assignments)

---

## 10. Payment Security

### Midtrans Integration

- Order ID generated server-side
- Amount fetched from database (not frontend)
- Webhook signature verification
- Idempotent processing (duplicate webhooks safe)

### What Frontend Cannot Send

```javascript
// FORBIDDEN
{ amount: 150000 }  // Must come from course.price in DB
```

---

## 11. Error Handling

### Information Leakage Prevention

Production errors never expose:
- Stack traces
- Database credentials
- JWT secrets
- Internal paths

```javascript
if (status >= 500) {
  message = 'Internal Server Error';
  errors = undefined;
}
```

---

## 12. Audit Logging

All sensitive actions logged:

```javascript
// Logged actions
USER_LOGIN, USER_LOGOUT, PASSWORD_CHANGED,
COURSE_CREATED, COURSE_UPDATED, COURSE_DELETED, COURSE_PUBLISHED,
STUDENT_CREATED, ENROLLMENT_CREATED,
PAYMENT_COMPLETED, CERTIFICATE_ISSUED
```

Log includes: userId, action, entity, entityId, IP, userAgent, timestamp.

---

## 13. Cookie Security

```javascript
// env.js
cookie: {
  httpOnly: true,
  secure: isProd,    // HTTPS only in production
  sameSite: 'lax',
}
```

Refresh token path-scoped to `/api/v1/auth`.

---

## 14. Known Limitations

- No CSRF token (relies on SameSite cookie)
- No IP blacklisting
- No account lockout after failed attempts
- No email verification
- No 2FA
