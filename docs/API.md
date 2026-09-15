# API Documentation — LMS Dashboard System

**Base URL:** `/api/v1`
**Sumber:** PRD Section 29–33, 53, 106
**Format selalu mengikuti standar response di bawah.**

---

## 1. Response Standard

Semua endpoint menggunakan format konsisten.

### Success

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

### HTTP Status Codes

| Code | Arti |
| ---- | ---- |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate email, slug, enrollment, dst.) |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

Error response **tidak boleh** membocorkan: password, JWT, database credentials, stack trace (production), internal secrets.

---

## 2. Pagination

Semua endpoint list wajib mendukung pagination.

**Request:**

```text
?page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

---

## 3. Filter Parameters

| Entity | Parameter |
| ------ | --------- |
| Course | `keyword`, `category`, `level`, `price`, `status`, `mentor` |
| Student | `keyword`, `status`, `course` |
| Transaction | `status`, `date`, `student`, `course` |

Search harus: debounced (frontend), case insensitive, paginated, URL state aware bila diperlukan. Contoh: `/courses?search=javascript&page=1`.

---

## 4. Authorization Model

Semua endpoint dilindungi middleware backend:

- `authenticate` — verifikasi JWT dari HTTP-only cookie.
- `authorize` — cek role dan ownership.

Aturan pokok:

- Authorization dilakukan di **backend**, frontend permission bukan security boundary.
- IDOR protection: parameter `:id` di URL tidak otomatis memberi akses. Backend cek `User → Role → Resource ownership → Enrollment`.
- Mentor hanya boleh mengubah resource dengan `course.mentorId === authenticatedUser.id`. Admin bypass ownership.
- Student hanya boleh mengakses resource dengan `enrollment.studentId === authenticatedUser.id`.
- Transaction: student lihat miliknya, mentor lihat transaction course miliknya, admin lihat semua.

---

## 5. Endpoints

### 5.1 Authentication

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| POST | `/auth/register` | Public | Register student. Rate limit 5 req/min/IP |
| POST | `/auth/login` | Public | Set HTTP-only cookie. Rate limit 5 req/min/IP |
| POST | `/auth/logout` | Authenticated | Hapus session/token |
| POST | `/auth/refresh` | Refresh token | Rotate access token |
| GET | `/auth/me` | Authenticated | Data user saat ini |
| POST | `/auth/forgot-password` | Public | Rate limit 3 req/min/IP |
| POST | `/auth/reset-password` | Public | Token dengan expiration |

### 5.2 Courses

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/courses` | Authenticated | Published course tampil untuk semua; draft hanya owner |
| GET | `/courses/:id` | Public (published) | Draft tidak tersedia untuk public |
| POST | `/courses` | Admin / Mentor | Validasi via Zod |
| PATCH | `/courses/:id` | Admin / Mentor (owner) | Cek ownership |
| DELETE | `/courses/:id` | Admin | Course dengan transaction/enrollment/progress → tolak, gunakan archive |
| POST | `/courses/:id/publish` | Admin / Mentor (owner) | Tolak bila: title kosong, description kosong, thumbnail tidak ada, tidak ada lesson |
| POST | `/courses/:id/archive` | Admin / Mentor (owner) | Enrollment lama tetap punya akses |

### 5.3 Lessons

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| POST | `/courses/:courseId/lessons` | Admin / Mentor (owner) | contentType: `text` / `video` |
| PATCH | `/lessons/:id` | Admin / Mentor (owner) | HTML text lesson wajib disanitasi |
| DELETE | `/lessons/:id` | Admin / Mentor (owner) | — |
| PATCH | `/courses/:courseId/lessons/reorder` | Admin / Mentor (owner) | Body berisi urutan lesson; backend cegah duplicate `order` |

### 5.4 Students

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/students` | Admin / Mentor (limited) | Mentor hanya student pada course miliknya |
| GET | `/students/:id` | Admin / Mentor (limited) | — |
| POST | `/students` | Admin | — |
| PATCH | `/students/:id` | Admin | Termasuk reset password |
| DELETE | `/students/:id` | Admin | Soft delete / deactivate |

### 5.5 Enrollment

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/enrollments` | Admin / Mentor (own course) | — |
| POST | `/enrollments` | Admin / Mentor | Manual enrollment, tanpa transaksi Midtrans. Source: `manual` |
| PATCH | `/enrollments/:id` | Admin / Mentor | Update status (mis. `revoked`) |
| DELETE | `/enrollments/:id` | Admin | — |

> Enrollment otomatis dari pembayaran **tidak** melalui endpoint ini — dibuat backend setelah webhook Midtrans tervalidasi. Lihat [BUSINESS-RULES.md](./BUSINESS-RULES.md).

### 5.6 Transactions

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| POST | `/transactions` | Student | Checkout. Amount diambil dari `course.price` di database |
| GET | `/transactions` | Role-scoped | Admin semua, mentor own-course, student own |
| GET | `/transactions/:id` | Ownership check | — |
| POST | `/transactions/:id/cancel` | Student (own, pending) | — |

### 5.7 Payment (Midtrans Snap)

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| POST | `/payments/midtrans/create` | Student | Buat order ID server-side + Snap token |
| POST | `/payments/midtrans/webhook` | Midtrans (signature) | Verifikasi signature; idempotent |

Ketentuan `POST /payments/midtrans/create`:

- Order ID dibuat **server-side** (format contoh: `LMS-20260905-8F42K`).
- Amount diambil dari `course.price` database — frontend **tidak boleh** mengirim amount.
- Webhook: verifikasi signature Midtrans, cegah duplicate enrollment & duplicate payment processing, catat webhook event.

### 5.8 Progress

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/courses/:courseId/progress` | Student (own) / Mentor (own course) / Admin | — |
| POST | `/lessons/:lessonId/start` | Student enrolled | Catat `startedAt` |
| POST | `/lessons/:lessonId/complete` | Student enrolled | Update progress; completion 100% → `enrollment.status = completed` |
| GET | `/lessons/:lessonId/content` | Student enrolled (published) / Mentor owner / Admin | Konten lesson per-lesson (anti-scrape). Student menerima metadata lesson saja dari `GET /courses/:id`; konten diambil lewat endpoint ini. Rate limit 60 req/min/user. Draft lesson → 404 untuk student. |

### 5.9 Certificate Verification (Public)

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/certificates/verify/:code` | Public | Verifikasi certificate via `verificationCode` |

### 5.10 Community / Q&A (Course-scoped)

Komunitas di-scope ke **Course** (struktur pembelajaran: Course → Lessons). Akses mengikuti enrollment/ownership — **divalidasi server-side di setiap endpoint** (admin semua, mentor course miliknya, student dengan enrollment `active/completed`).

| Method | Endpoint | Auth | Catatan |
| ------ | -------- | ---- | ------- |
| GET | `/courses/:courseId/questions` | Akses course | Query: `page`, `limit`, `keyword` (judul), `filter=all\|unanswered\|answered\|verified` |
| POST | `/courses/:courseId/questions` | Akses course | Body: `title`, `body`, `attachmentIds[]` (max 3). Rate limit 10 req/min/user |
| GET | `/questions/:id` | Akses course course terkait | Termasuk attachments |
| PATCH | `/questions/:id` | Author (content) / staff (status) | `status` hanya `active\|closed`; `resolved` diatur otomatis oleh verify |
| DELETE | `/questions/:id` | Author / staff | Cascade answers + attachments |
| GET | `/questions/:id/answers` | Akses course | Verified answer diurut pertama; paginated |
| POST | `/questions/:id/answers` | Akses course | Body: `body`, `attachmentIds[]` (max 2). Ditolak 409 bila question `closed` |
| PATCH | `/answers/:id` | Author saja | Edit body |
| DELETE | `/answers/:id` | Author / staff | Bila verified → verification di-clear, status kembali `active` |
| POST | `/answers/:id/verify` | Admin / Mentor (owner) | Satu verified answer per question; status → `resolved` |
| POST | `/answers/:id/unverify` | Admin / Mentor (owner) | Status kembali `active` |
| POST | `/uploads/community` | Authenticated | Multipart `file`. Gambar ≤2 MB (JPEG/PNG/WebP); video ≤25 MB **dan ≤30 detik** (MP4/WebM, durasi diverifikasi server-side). Rate limit 20 req/min/user |
| DELETE | `/uploads/community/:id` | Owner | Hanya attachment yang belum di-claim |

Detail model: [DATA-MODEL.md §12](./DATA-MODEL.md). Konten Q&A disimpan sebagai plain text dan dirender escaped oleh client (XSS-safe by construction).

---

## 6. API Documentation Format

API wajib terdokumentasi menggunakan **OpenAPI / Swagger**, mencakup: endpoint, method, authentication, request body, response, error, dan permission per endpoint.
