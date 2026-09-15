# Architecture — LMS Dashboard System

**Stack:** MERN
**Sumber:** PRD Section 1, 27–28, 34–35, 43, 50–52, 54–55, 73–77, 85–86, 101–103, 106–107, 112

---

## 1. Tech Stack

Core:

- MongoDB
- Express.js
- React 18
- Node.js

Pendukung:

| Teknologi | Kegunaan |
| --------- | -------- |
| Mongoose | ODM MongoDB |
| Zod | Validasi request boundary |
| JWT + HTTP-only Cookie | Authentication (access + refresh token) |
| bcrypt | Password hashing |
| Multer | File upload (thumbnail, photo) |
| CKEditor 5 | Text lesson editor |
| Midtrans Snap | Payment gateway |
| YouTube Embed | Video lesson player |
| Tailwind CSS / UI Component Library | Styling |

---

## 2. System Overview

```text
                 LMS PLATFORM
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      ADMIN         MENTOR       STUDENT
        │             │             │
        └─────────────┼─────────────┘
                      │
                 COURSE ENGINE
                      │
       ┌──────────────┼──────────────┐
       │              │              │
    LESSON         ENROLLMENT      PAYMENT
       │              │              │
    CKEditor       Progress       Midtrans
    YouTube          │              │
       │              └──────┬───────┘
       │                     │
       └──────────────┬──────┘
                      │
                 LEARNING ENGINE
                      │
             ┌────────┼────────┐
             │        │        │
            QUIZ   COMPLETION CERTIFICATE
             │        │        │
             └────────┼────────┘
                      │
                  ANALYTICS
                      │
                  AUDIT LOG
```

---

## 3. Deployment Architecture

```text
                 Internet
                    │
                    ▼
              Reverse Proxy
                 Nginx
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      React App           Express API
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
                 MongoDB            Midtrans
                    │
                    ▼
              File Storage
```

YouTube video **tidak melewati backend** — embed langsung dari student browser ke YouTube.

### Environments & Backup

Detail environment, pre-deploy checklist, dan backup strategy: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## 4. Project Structure

### Backend (`server/`)

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/      # authenticate, authorize
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── schemas/         # Zod
│   ├── utils/
│   ├── jobs/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
├── uploads/
└── package.json
```

### Frontend (`client/`) — feature-based

```text
client/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── lessons/
│   │   ├── students/
│   │   ├── payments/
│   │   ├── progress/
│   │   └── dashboard/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── hooks/
│   ├── schemas/
│   ├── lib/
│   └── main.jsx
└── package.json
```

Feature-based architecture dipilih daripada pengelompokan berdasarkan tipe file.

---

## 5. Frontend State Management

| Jenis state | Solusi |
| ----------- | ------ |
| Local UI state | `useState`, `useReducer` |
| Server state | TanStack Query |
| Global state | Hanya: authentication, theme, UI preferences |

Jangan menyimpan seluruh API response ke global state tanpa kebutuhan.

---

## 6. Authentication Flow

```text
JWT (access: short-lived) + HTTP-only Cookie (refresh: long-lived)
```

Cookie flags sesuai environment: `HttpOnly`, `Secure`, `SameSite`.

- Password: min 8 karakter, bcrypt, tidak pernah dikembalikan via API.
- Password reset: token dengan expiration.
- JWT tidak muncul di response body saat cookie strategy digunakan.

---

## 7. Security

Baseline wajib: Helmet, CORS, rate limiting, input validation (Zod), HTML sanitization, password hashing, secure cookies, JWT expiration, authorization middleware, file validation, MongoDB query protection, request size limits.

**Detail lengkap — threat model, IDOR & ownership, sanitasi CKEditor, file upload, payment security, rate limits, CORS: [SECURITY.md](./SECURITY.md).**

Storage: MVP local storage; production object storage (S3-compatible). Database hanya menyimpan file URL / object key.

---

## 8. Performance

| Target | Nilai |
| ------ | ----- |
| API p95 (normal CRUD) | < 500 ms |
| Initial page load | < 3 detik |

Strategi: database indexes, pagination, projection, lazy loading, image optimization, API caching (jika perlu), CDN, compression, code splitting.

---

## 9. Observability

Logs wajib: application, error, HTTP request, payment, webhook, audit.

Jangan log: password, JWT, Midtrans secret key, API secret.

---

## 10. Environment Configuration

Variabel lengkap, nilai per environment, dan kebijakan secrets: **[ENVIRONMENT.md](./ENVIRONMENT.md)**.

Poin kunci: secrets tidak disimpan di Git dan tidak dapat diedit melalui admin dashboard.

---

## 11. Scalability Path

Arsitektur harus memungkinkan penambahan berikut tanpa rewrite besar:

```text
Redis, Queue Worker, Object Storage, CDN,
Search Engine, Email Provider, Analytics Service
```

Contoh yang sudah dipersiapkan: email notification dikirim asynchronous agar tidak memblokir request utama.

---

## 12. Development Workflow

```text
Requirement → Schema → API Contract → Backend → Testing
→ Frontend → Integration → QA → Staging → Production
```

Git workflow: `main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`. Commit format: `feat: add course enrollment`, `fix: prevent duplicate payment webhook`, `refactor: improve lesson service`.
