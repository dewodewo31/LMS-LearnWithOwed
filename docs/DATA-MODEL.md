# Data Model — LMS Dashboard System

**Database:** MongoDB (Mongoose)
**Sumber:** PRD Section 17–18, 26, 36–40, 44–49

---

## 1. Collections

Minimal collections:

```text
users
courses
lessons
enrollments
lesson_progress
transactions
quiz
quiz_attempts
certificates
notifications
audit_logs
```

Catatan: **lesson dipisah** menjadi collection tersendiri agar course document tidak terlalu besar. **Enrollment wajib collection tersendiri** — tidak menyimpan enrolled students sebagai array di Course (menyulitkan progress tracking, transaction history, enrollment metadata, scalability, reporting).

---

## 2. Users

Profile fields (PRD §26) + auth fields:

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique)",
  "password": "String (bcrypt hash, tidak pernah dikembalikan via API)",
  "photo": "String (file URL / object key)",
  "phone": "String",
  "bio": "String",
  "role": "admin | mentor | student",
  "isDeleted": false,
  "createdAt": "Date",
  "lastLoginAt": "Date"
}
```

- Password: minimal 8 karakter, bcrypt, tidak plaintext.
- Email change dapat membutuhkan verification.
- Soft delete (PRD §69).

---

## 3. Courses

```json
{
  "_id": "ObjectId",
  "title": "JavaScript Fundamentals",
  "slug": "javascript-fundamentals (unique)",
  "shortDescription": "Learn JavaScript from zero",
  "description": "<sanitized-html>",
  "thumbnail": "/uploads/course.webp",
  "categoryId": "ObjectId",
  "mentorId": "ObjectId",
  "price": 150000,
  "level": "beginner | intermediate | advanced",
  "language": "id",
  "status": "draft | published | archived",
  "requirements": [],
  "learningObjectives": [],
  "totalLessons": 12,
  "isDeleted": false,
  "createdAt": "Date",
  "updatedAt": "Date",
  "publishedAt": "Date"
}
```

- Database hanya menyimpan file URL / object key, bukan binary image.
- Slug otomatis dari title; slug course yang sudah published tidak berubah otomatis tanpa confirmation.
- Soft delete (PRD §69).

---

## 4. Lessons

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId",
  "title": "Variables and Data Types",
  "contentType": "text | video",
  "textContent": "<sanitized-html>",
  "youtubeUrl": null,
  "youtubeVideoId": null,
  "duration": 15,
  "order": 1,
  "isPublished": true,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

- Untuk video lesson, sistem mengekstrak `youtubeVideoId` dari URL (watch / youtu.be / embed / shorts).
- `textContent` selalu hasil sanitasi — HTML dari CKEditor adalah untrusted input.
- Lesson ID harus stabil (PRD §92) agar progress, quiz attempt, dan certificate tidak rusak saat materi berubah.
- Future content types (schema-ready): `quiz`, `assignment`, `document`, `audio`, `live`.

---

## 5. Enrollments

```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "courseId": "ObjectId",
  "source": "purchase | admin | mentor | manual | promotion",
  "status": "pending | active | completed | revoked | expired",
  "enrolledAt": "Date",
  "completedAt": "Date",
  "progress": 0,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Constraint: `studentId + courseId` unique — mencegah duplicate enrollment.

---

## 6. Lesson Progress

```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "courseId": "ObjectId",
  "lessonId": "ObjectId",
  "status": "completed",
  "startedAt": "Date",
  "completedAt": "Date"
}
```

Constraint: `studentId + lessonId` unique — mencegah duplicate lesson progress.

Course progress dihitung: `completed lessons / total lessons × 100`. Course completion tercapai pada 100% lessons.

---

## 7. Transactions

```json
{
  "_id": "ObjectId",
  "orderId": "LMS-20260905-8F42K (unique, server-side)",
  "studentId": "ObjectId",
  "courseId": "ObjectId",
  "amount": 150000,
  "status": "pending | paid | failed | expired | cancelled | refunded",
  "midtransToken": "String",
  "webhookEvents": [],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

- `amount` adalah **snapshot** harga course saat checkout — perubahan harga course tidak memengaruhi transaction lama.
- `orderId` dibuat server-side, unik.
- Status final ditentukan webhook / server-side verification, bukan frontend.
- Data transaction dipertahankan untuk historical reporting (PRD §88).

---

## 8. Quiz (Post-MVP, schema disiapkan)

**quiz:**

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId",
  "lessonId": "ObjectId",
  "questions": [
    {
      "question": "String",
      "type": "multiple_choice | true_false",
      "options": [],
      "correctAnswer": "...",
      "points": 1,
      "explanation": "String"
    }
  ],
  "passingScore": 70,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**quiz_attempts:**

```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId",
  "studentId": "ObjectId",
  "answers": [],
  "score": 80,
  "passed": true,
  "createdAt": "Date"
}
```

Scoring: `score = correct / total questions × 100`; `passed = score >= passingScore` (default 70, configurable).

---

## 9. Certificates

```json
{
  "_id": "ObjectId",
  "certificateNumber": "String",
  "studentId": "ObjectId",
  "studentName": "String",
  "courseId": "ObjectId",
  "courseName": "String",
  "mentorName": "String",
  "issuedAt": "Date",
  "verificationCode": "String (unique)"
}
```

Diterbitkan saat: course completed + required assessment passed. Verifikasi publik: `/certificates/verify/:code`.

---

## 10. Notifications

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "payment_success | enrollment_success | course_published | course_completed | certificate_issued | password_changed | system",
  "title": "Payment Successful",
  "message": "Your payment has been confirmed.",
  "read": false,
  "createdAt": "Date"
}
```

---

## 11. Audit Logs

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "action": "COURSE_CREATED",
  "entity": "Course",
  "entityId": "ObjectId",
  "metadata": {},
  "ip": "...",
  "userAgent": "...",
  "createdAt": "Date"
}
```

Action minimal yang dicatat: `USER_LOGIN`, `USER_LOGOUT`, `PASSWORD_CHANGED`, `COURSE_CREATED/UPDATED/DELETED/PUBLISHED`, `STUDENT_CREATED`, `ENROLLMENT_CREATED`, `PAYMENT_COMPLETED`, `CERTIFICATE_ISSUED`, `REFUND`, `ROLE_CHANGE`.

Audit log tidak boleh dihapus oleh Mentor secara normal (PRD §88).

---

## 12. Community / Q&A (Module Community)

Community dipindahkan sesuai struktur pembelajaran yang ada: **Course → Lessons** (tidak ada konsep module terpisah), sehingga komunitas di-scope ke **Course**.

**questions:**

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId (ref courses)",
  "authorId": "ObjectId (ref users)",
  "title": "String (5–150 chars)",
  "body": "String (plain text, 10–5000 chars — dirender escaped oleh client, bukan HTML)",
  "status": "active | resolved | closed",
  "verifiedAnswerId": "ObjectId | null (ref answers)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

- `resolved` diatur otomatis oleh verify/unverify — tidak bisa di-set langsung via API.
- Satu question maksimal **satu** verified answer.

**answers:**

```json
{
  "_id": "ObjectId",
  "questionId": "ObjectId (ref questions)",
  "authorId": "ObjectId (ref users)",
  "body": "String (plain text, 2–5000 chars)",
  "isVerified": false,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**community_attachments:**

```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId (ref users)",
  "kind": "image | video",
  "url": "/uploads/<uuid><ext>",
  "mimeType": "image/png | video/mp4 | ...",
  "size": 123456,
  "durationSec": null,
  "questionId": "ObjectId | null",
  "answerId": "ObjectId | null",
  "createdAt": "Date"
}
```

- Upload menghasilkan attachment **unclaimed** (questionId/answerId null); ownership divalidasi saat claim.
- Video: maks **30 detik** (divalidasi server-side via parser MP4/WebM), maks 25 MB. Gambar: maks 2 MB (JPEG/PNG/WebP). Database hanya menyimpan metadata/URL.

---

## 13. Indexing

Required indexes (PRD §39):

```text
users.email                              UNIQUE
courses.slug                             UNIQUE
courses.mentorId
courses.status
courses.categoryId

lessons.courseId
lessons.courseId + order

enrollments.studentId
enrollments.courseId
enrollments.studentId + courseId         UNIQUE

transactions.orderId                     UNIQUE
transactions.studentId
transactions.courseId
transactions.status

lesson_progress.studentId + lessonId     UNIQUE
lesson_progress.studentId + courseId

questions.courseId + createdAt
questions.authorId

answers.questionId + createdAt
answers.questionId + isVerified

community_attachments.ownerId
community_attachments.questionId
community_attachments.answerId
```

---

## 14. Data Integrity

System harus mencegah:

- Duplicate email
- Duplicate slug
- Duplicate enrollment
- Duplicate order ID
- Duplicate lesson progress
- Invalid course reference
- Invalid student reference

---

## 15. Validation

Zod pada boundary request, sebelum business logic. Contoh:

```typescript
const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  price: z.number().min(0),
  categoryId: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});
```
