# PRODUCT REQUIREMENT DOCUMENT (PRD)

# LMS Dashboard System

**Product Name:** LMS Dashboard System
**Version:** 2.0
**Date:** 5 September 2026
**Status:** Approved / Ready for Development
**Architecture:** MERN Stack
**Target Platform:** Web Application / Responsive Dashboard

---

# 1. PRODUCT OVERVIEW

## 1.1 Executive Summary

LMS Dashboard System adalah platform Learning Management System berbasis web yang memungkinkan organisasi, mentor, instructor, maupun company untuk membuat dan mengelola kursus digital serta menyediakan pengalaman belajar terstruktur kepada student.

Platform dirancang menggunakan arsitektur MERN:

- MongoDB
- Express.js
- React 18
- Node.js

Dengan tambahan:

- Mongoose
- Zod
- JWT / HTTP-only Cookie
- bcrypt
- Multer
- CKEditor 5
- Midtrans Snap
- YouTube Embed
- Tailwind CSS / UI Component Library

Sistem tidak hanya berfungsi sebagai repository materi, tetapi sebagai platform pembelajaran dengan:

- Course management
- Lesson management
- Student management
- Enrollment
- Payment
- Learning progress
- Dashboard analytics
- Quiz / assessment
- Certificate
- Notification
- Search
- Activity tracking
- Role-based access control
- Audit logging

---

# 2. PRODUCT VISION

## 2.1 Vision

Membangun LMS yang sederhana untuk digunakan oleh student, namun cukup powerful bagi mentor/company untuk mengelola seluruh proses pembelajaran dari pembuatan kursus hingga monitoring perkembangan student.

## 2.2 Product Principles

Sistem harus mengikuti prinsip:

1. Simple
2. Fast
3. Secure
4. Responsive
5. Modular
6. Scalable
7. Maintainable
8. Data-driven

---

# 3. TARGET USERS

## 3.1 Admin

Administrator memiliki akses penuh terhadap sistem.

Responsibilities:

- Mengelola seluruh user
- Mengelola mentor
- Mengelola student
- Mengelola course
- Melihat transaksi
- Melihat analytics
- Mengelola system configuration
- Melihat audit log

## 3.2 Mentor

Mentor bertanggung jawab terhadap course dan materi.

Responsibilities:

- Membuat course
- Mengedit course
- Menghapus course
- Membuat lesson
- Mengelola video
- Mengelola materi
- Melihat enrolled student
- Melihat progress student
- Membuat quiz
- Melihat hasil assessment

## 3.3 Student

Student menggunakan sistem untuk belajar.

Responsibilities:

- Login
- Melihat course
- Membeli course
- Mengakses course yang dimiliki
- Membaca materi
- Menonton video
- Menyelesaikan lesson
- Mengikuti quiz
- Melihat progress
- Mendapatkan certificate

---

# 4. ROLE & PERMISSION MATRIX

| Feature         | Admin |          Mentor |       Student |
| --------------- | ----: | --------------: | ------------: |
| Dashboard       |     ✓ |               ✓ |             ✓ |
| Manage Users    |     ✓ |         Limited |             - |
| Manage Course   |     ✓ |               ✓ |             - |
| Manage Lesson   |     ✓ |               ✓ |             - |
| Manage Quiz     |     ✓ |               ✓ |             - |
| View Students   |     ✓ |               ✓ |    Own Course |
| Enrollment      |     ✓ |               ✓ | Self Purchase |
| Payment         |     ✓ |            View |             ✓ |
| Transaction     |     ✓ | View Own Course |           Own |
| Progress        |     ✓ |               ✓ |           Own |
| Certificate     |     ✓ |               ✓ |           Own |
| Analytics       |     ✓ |      Own Course |  Own Progress |
| Audit Log       |     ✓ |    Own Activity |  Own Activity |
| System Settings |     ✓ |               - |             - |

---

# 5. PRODUCT SCOPE

## 5.1 MVP

MVP wajib mencakup:

### Authentication

- Login
- Logout
- Register student
- Password hashing
- JWT authentication
- HTTP-only cookie
- Role authorization

### Course

- Course CRUD
- Thumbnail
- Category
- Price
- Draft / Published
- Course detail

### Lesson

- Text lesson
- YouTube lesson
- CKEditor
- Lesson ordering

### Student

- Student CRUD
- Student profile
- Enrollment

### Payment

- Midtrans Snap
- Transaction
- Payment callback
- Webhook
- Automatic enrollment

### Learning

- Course player
- Lesson navigation
- Mark lesson completed
- Progress tracking

### Dashboard

- Course statistics
- Student statistics
- Transaction statistics
- Learning progress

---

# 6. POST-MVP FEATURES

Fitur berikut dapat dikembangkan setelah MVP:

- Quiz
- Assignment
- Certificate
- Course review
- Wishlist
- Coupon
- Discount
- Notification
- Email notification
- Discussion
- Announcement
- Course bundle
- Subscription
- Live class
- Zoom integration
- Google Meet integration
- Analytics dashboard
- Learning streak
- Gamification
- Achievement / badge

---

# 7. INFORMATION ARCHITECTURE

## 7.1 Public Pages

```text
/
├── Home
├── Courses
│   ├── Course Detail
│   └── Search / Filter
├── Login
├── Register
├── Forgot Password
├── Reset Password
└── Payment Result
```

## 7.2 Admin / Mentor Dashboard

```text
/dashboard
├── Overview
├── Courses
│   ├── All Courses
│   ├── Create Course
│   ├── Edit Course
│   └── Course Detail
├── Lessons
├── Students
├── Enrollments
├── Transactions
├── Analytics
├── Quiz
├── Certificates
├── Notifications
├── Audit Logs
└── Settings
```

## 7.3 Student Dashboard

```text
/student
├── Overview
├── My Courses
├── Course Detail
├── Learning Player
├── Progress
├── Transactions
├── Certificates
├── Notifications
└── Profile
```

---

# 8. DASHBOARD REQUIREMENTS

## 8.1 Admin Dashboard

Dashboard harus memberikan ringkasan:

### KPI Cards

- Total Users
- Total Students
- Total Mentors
- Total Courses
- Published Courses
- Total Revenue
- Pending Transactions
- Completed Enrollments

### Charts

Revenue:

```text
Daily
Weekly
Monthly
Yearly
```

Enrollment:

```text
New Enrollment
Completed Course
Active Student
```

### Recent Activities

Menampilkan:

- Student baru
- Course baru
- Transaction terbaru
- Enrollment terbaru
- Course completion

---

# 9. MENTOR DASHBOARD

Mentor dashboard menampilkan:

- Total courses
- Published courses
- Total students
- Total enrollments
- Course completion rate
- Revenue
- Recent transactions
- Recent student activity

Mentor hanya dapat melihat data yang berkaitan dengan course miliknya.

---

# 10. STUDENT DASHBOARD

Student dashboard harus fokus pada learning experience.

## KPI

- My Courses
- Courses Completed
- Learning Hours
- Certificates

## Continue Learning

Menampilkan course terakhir yang dipelajari.

Contoh:

```text
JavaScript Fundamentals

Progress
████████████░░░░ 75%

Continue Learning
```

## My Courses

Setiap course menampilkan:

- Thumbnail
- Title
- Mentor
- Progress
- Last lesson
- Completion percentage

---

# 11. COURSE MANAGEMENT

## 11.1 Course Fields

Course harus memiliki:

```text
title
slug
shortDescription
description
thumbnail
category
price
level
language
status
mentorId
lessons
requirements
learningObjectives
publishedAt
createdAt
updatedAt
```

## 11.2 Course Status

```text
draft
published
archived
```

### Draft

Tidak tersedia untuk public.

### Published

Dapat dilihat dan dibeli student.

### Archived

Tidak dapat dibeli lagi tetapi enrollment lama tetap memiliki akses.

---

# 12. COURSE CREATION FLOW

```text
Create Course
      ↓
Basic Information
      ↓
Upload Thumbnail
      ↓
Course Description
      ↓
Learning Objectives
      ↓
Requirements
      ↓
Create Lessons
      ↓
Arrange Lessons
      ↓
Preview Course
      ↓
Publish
```

Course tidak boleh dipublish apabila:

- Title kosong
- Description kosong
- Thumbnail tidak tersedia
- Tidak memiliki lesson

---

# 13. LESSON MANAGEMENT

Lesson mendukung beberapa tipe konten.

## 13.1 Content Types

```text
text
video
```

Future:

```text
quiz
assignment
document
audio
live
```

---

# 14. TEXT LESSON

Text lesson menggunakan CKEditor 5.

Content dapat memiliki:

- Heading
- Paragraph
- Bold
- Italic
- Link
- List
- Ordered list
- Quote
- Code block
- Image

HTML harus disanitasi sebelum disimpan / ditampilkan.

Tidak boleh menggunakan `dangerouslySetInnerHTML` tanpa sanitization.

Recommended architecture:

```text
CKEditor
   ↓
HTML
   ↓
Sanitization
   ↓
MongoDB
   ↓
Sanitized HTML
   ↓
React Renderer
```

---

# 15. YOUTUBE LESSON

Mentor memasukkan:

```text
https://www.youtube.com/watch?v=VIDEO_ID
```

atau:

```text
https://youtu.be/VIDEO_ID
```

Sistem harus mengekstrak:

```text
youtubeVideoId
```

Contoh:

```text
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

menjadi:

```text
dQw4w9WgXcQ
```

Database menyimpan:

```json
{
  "youtubeUrl": "...",
  "youtubeVideoId": "dQw4w9WgXcQ"
}
```

Student melihat:

```text
YouTube Embedded Player
```

---

# 16. LESSON ORDERING

Mentor dapat mengubah urutan lesson menggunakan:

- Drag & Drop
- Move Up
- Move Down

Database harus menyimpan:

```text
order
```

Contoh:

```text
Lesson 1 → order 1
Lesson 2 → order 2
Lesson 3 → order 3
```

Backend harus memastikan tidak terjadi duplicate ordering yang tidak disengaja.

---

# 17. ENROLLMENT SYSTEM

Enrollment merupakan hubungan antara:

```text
Student
      +
Course
```

Enrollment harus memiliki collection tersendiri.

Tidak direkomendasikan menyimpan enrolled students hanya sebagai array pada Course karena akan menyulitkan:

- Progress tracking
- Transaction history
- Enrollment metadata
- Scalability
- Reporting

## Enrollment Schema

```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId",
  "courseId": "ObjectId",
  "source": "purchase",
  "status": "active",
  "enrolledAt": "Date",
  "completedAt": "Date",
  "progress": 0,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Source:

```text
purchase
admin
mentor
manual
promotion
```

Status:

```text
pending
active
completed
revoked
expired
```

---

# 18. LEARNING PROGRESS

Progress harus disimpan secara individual per lesson.

## Lesson Progress

```json
{
  "studentId": "ObjectId",
  "courseId": "ObjectId",
  "lessonId": "ObjectId",
  "status": "completed",
  "startedAt": "Date",
  "completedAt": "Date"
}
```

Course progress dihitung berdasarkan:

```text
completed lessons / total lessons × 100
```

Contoh:

```text
8 / 10 lessons

Progress = 80%
```

---

# 19. COURSE PLAYER

Course player terdiri dari:

```text
┌──────────────────────────────────────────┐
│ Course Title                             │
├───────────────┬──────────────────────────┤
│ Lesson List   │ Content                  │
│               │                          │
│ ✓ Lesson 1    │ Video / Text             │
│ ✓ Lesson 2    │                          │
│ ● Lesson 3    │                          │
│ ○ Lesson 4    │                          │
│ ○ Lesson 5    │                          │
├───────────────┴──────────────────────────┤
│ Previous                Mark Complete     │
│                         Next Lesson       │
└──────────────────────────────────────────┘
```

Student hanya dapat membuka lesson apabila:

1. Memiliki enrollment aktif
2. Course masih valid
3. User authenticated

Optional:

```text
Sequential Learning
```

Jika enabled:

```text
Lesson 2 terkunci
hingga Lesson 1 selesai
```

---

# 20. COURSE COMPLETION

Course dianggap completed ketika:

```text
100% lessons completed
```

Setelah completion:

```text
Enrollment.status = completed
Enrollment.completedAt = now
```

Jika certificate aktif:

```text
Generate Certificate
```

---

# 21. PAYMENT SYSTEM

Payment menggunakan Midtrans Snap.

Payment lifecycle:

```text
Student
   ↓
Select Course
   ↓
Checkout
   ↓
Create Transaction
   ↓
Midtrans Snap Token
   ↓
Payment
   ↓
Midtrans
   ↓
Webhook
   ↓
Validate Transaction
   ↓
Update Transaction
   ↓
Create Enrollment
```

---

# 22. TRANSACTION STATUS

System mendukung:

```text
pending
paid
failed
expired
cancelled
refunded
```

Jangan hanya mengandalkan status dari frontend.

Status final harus ditentukan berdasarkan webhook / server-side verification.

---

# 23. PAYMENT SECURITY

Backend harus:

- Generate order ID secara server-side
- Generate amount berdasarkan database course
- Tidak mempercayai price dari frontend
- Verify Midtrans notification signature
- Mencegah duplicate enrollment
- Mencegah duplicate payment processing
- Mencatat webhook event

Frontend tidak boleh mengirim:

```text
amount = arbitrary value
```

Backend harus mengambil:

```text
course.price
```

langsung dari database.

---

# 24. IDEMPOTENCY

Webhook dapat dikirim lebih dari sekali.

System harus aman terhadap duplicate notification.

Contoh:

```text
Webhook #1 → paid
Webhook #2 → paid
Webhook #3 → paid
```

Result:

```text
1 Transaction
1 Enrollment
```

Tidak boleh:

```text
3 Enrollments
```

---

# 25. STUDENT MANAGEMENT

Admin / Mentor dapat:

- Create student
- Update student
- Delete / deactivate student
- Reset password
- Upload photo
- View profile
- View enrolled courses
- View progress
- View transaction history

Student tidak boleh mengakses student management milik user lain.

---

# 26. USER PROFILE

Profile memiliki:

```text
name
email
photo
phone
bio
role
createdAt
lastLoginAt
```

Student dapat mengubah:

- Name
- Photo
- Phone
- Bio
- Password

Email perubahan dapat membutuhkan verification.

---

# 27. AUTHENTICATION

Authentication menggunakan:

```text
JWT
+
HTTP-only Cookie
```

Recommended:

```text
Access Token
Short-lived

Refresh Token
Long-lived
```

Cookie harus menggunakan:

```text
HttpOnly
Secure
SameSite
```

sesuai environment.

---

# 28. PASSWORD SECURITY

Password:

- Minimal 8 karakter
- Hash menggunakan bcrypt
- Tidak pernah dikembalikan melalui API
- Tidak disimpan plaintext

Password reset menggunakan token dengan expiration.

---

# 29. AUTHORIZATION

Backend harus memiliki middleware:

```text
authenticate
authorize
```

Contoh:

```text
GET /api/courses
→ authenticated

POST /api/courses
→ admin / mentor

DELETE /api/users/:id
→ admin

GET /api/student/my-courses
→ student
```

Authorization harus dilakukan di backend, bukan hanya frontend.

---

# 30. API ARCHITECTURE

Base URL:

```text
/api/v1
```

## Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
```

## Courses

```http
GET    /courses
GET    /courses/:id
POST   /courses
PATCH  /courses/:id
DELETE /courses/:id
POST   /courses/:id/publish
POST   /courses/:id/archive
```

## Lessons

```http
POST   /courses/:courseId/lessons
PATCH  /lessons/:id
DELETE /lessons/:id
PATCH  /courses/:courseId/lessons/reorder
```

## Students

```http
GET    /students
GET    /students/:id
POST   /students
PATCH  /students/:id
DELETE /students/:id
```

## Enrollment

```http
GET  /enrollments
POST /enrollments
PATCH /enrollments/:id
DELETE /enrollments/:id
```

## Transactions

```http
POST /transactions
GET  /transactions
GET  /transactions/:id
POST /transactions/:id/cancel
```

## Payment

```http
POST /payments/midtrans/create
POST /payments/midtrans/webhook
```

## Progress

```http
GET  /courses/:courseId/progress
POST /lessons/:lessonId/start
POST /lessons/:lessonId/complete
```

---

# 31. API RESPONSE STANDARD

Semua API harus menggunakan format konsisten.

Success:

```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required"
  }
}
```

---

# 32. PAGINATION

Endpoint list harus menggunakan pagination.

Request:

```text
?page=1&limit=20
```

Response:

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

# 33. SEARCH & FILTER

Course dapat difilter berdasarkan:

```text
keyword
category
level
price
status
mentor
```

Student:

```text
keyword
status
course
```

Transaction:

```text
status
date
student
course
```

---

# 34. FILE UPLOAD

Multer digunakan untuk:

```text
Course Thumbnail
Profile Photo
```

Allowed:

```text
image/jpeg
image/png
image/webp
```

Maximum:

```text
2 MB
```

Backend harus memvalidasi:

- MIME type
- File extension
- File size

Filename harus dibuat secara server-side.

Contoh:

```text
uuid.webp
```

Jangan menggunakan filename asli sebagai storage identifier.

---

# 35. STORAGE ARCHITECTURE

MVP:

```text
Local Storage
```

Production recommended:

```text
Object Storage
```

Contoh:

```text
S3-compatible storage
```

Database hanya menyimpan:

```text
file URL / object key
```

bukan binary image.

---

# 36. DATABASE COLLECTIONS

Minimal collection:

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

---

# 37. COURSE SCHEMA

```json
{
  "_id": "ObjectId",
  "title": "JavaScript Fundamentals",
  "slug": "javascript-fundamentals",
  "shortDescription": "Learn JavaScript from zero",
  "description": "<sanitized-html>",
  "thumbnail": "/uploads/course.webp",
  "categoryId": "ObjectId",
  "mentorId": "ObjectId",
  "price": 150000,
  "level": "beginner",
  "language": "id",
  "status": "published",
  "requirements": [],
  "learningObjectives": [],
  "totalLessons": 12,
  "createdAt": "Date",
  "updatedAt": "Date",
  "publishedAt": "Date"
}
```

Lesson dipisahkan menjadi collection tersendiri agar course document tidak menjadi terlalu besar.

---

# 38. LESSON SCHEMA

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId",
  "title": "Variables and Data Types",
  "contentType": "text",
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

---

# 39. DATABASE INDEXING

Required indexes:

```text
users.email UNIQUE
courses.slug UNIQUE
courses.mentorId
courses.status
courses.categoryId

lessons.courseId
lessons.courseId + order

enrollments.studentId
enrollments.courseId
enrollments.studentId + courseId UNIQUE

transactions.orderId UNIQUE
transactions.studentId
transactions.courseId
transactions.status

lesson_progress.studentId + lessonId UNIQUE
lesson_progress.studentId + courseId
```

---

# 40. DATA INTEGRITY

System harus mencegah:

- Duplicate email
- Duplicate slug
- Duplicate enrollment
- Duplicate order ID
- Duplicate lesson progress
- Invalid course reference
- Invalid student reference

---

# 41. VALIDATION

Zod digunakan pada boundary request.

Contoh:

```typescript
const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10),
  price: z.number().min(0),
  categoryId: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});
```

Validation harus dilakukan sebelum business logic.

---

# 42. YOUTUBE VALIDATION

URL harus:

- Valid URL
- Domain YouTube
- Memiliki video ID

Supported:

```text
youtube.com/watch?v=
youtu.be/
youtube.com/embed/
youtube.com/shorts/
```

System harus menolak domain yang tidak relevan.

---

# 43. CKEDITOR SECURITY

HTML dari CKEditor dianggap sebagai untrusted input.

Pipeline:

```text
Input
 ↓
Zod Validation
 ↓
HTML Sanitization
 ↓
Business Validation
 ↓
MongoDB
```

Sanitization harus membatasi:

```text
script
iframe
object
embed
event handlers
javascript:
```

Jika iframe dibutuhkan khusus untuk YouTube, hanya domain YouTube yang diperbolehkan.

---

# 44. QUIZ SYSTEM

Post-MVP tetapi schema harus dipersiapkan.

Quiz terdiri dari:

```text
Question
Options
Correct Answer
Points
Explanation
```

Question types:

```text
multiple_choice
true_false
```

Student dapat:

```text
Start Quiz
Answer
Submit
Receive Score
```

---

# 45. QUIZ SCORING

Contoh:

```text
Total Questions: 10
Correct: 8

Score = 80
```

Passing score configurable:

```text
Passing Score = 70
```

Jika:

```text
score >= 70
```

maka:

```text
passed = true
```

---

# 46. CERTIFICATE SYSTEM

Certificate diberikan apabila:

```text
Course completed
+
Required assessment passed
```

Certificate memiliki:

```text
certificateNumber
studentName
courseName
mentorName
issuedAt
verificationCode
```

Public verification:

```text
/certificates/verify/:code
```

---

# 47. NOTIFICATION SYSTEM

Notification types:

```text
payment_success
enrollment_success
course_published
course_completed
certificate_issued
password_changed
system
```

Notification memiliki:

```json
{
  "userId": "ObjectId",
  "type": "payment_success",
  "title": "Payment Successful",
  "message": "Your payment has been confirmed.",
  "read": false,
  "createdAt": "Date"
}
```

---

# 48. EMAIL NOTIFICATION

Future integration.

Email dikirim untuk:

- Welcome
- Registration
- Payment success
- Enrollment
- Password reset
- Course completion
- Certificate

Email sending harus asynchronous agar tidak memperlambat request utama.

---

# 49. AUDIT LOG

Admin dapat melihat aktivitas penting.

Contoh:

```text
USER_LOGIN
COURSE_CREATED
COURSE_UPDATED
COURSE_DELETED
COURSE_PUBLISHED
STUDENT_CREATED
ENROLLMENT_CREATED
PAYMENT_COMPLETED
CERTIFICATE_ISSUED
```

Log:

```json
{
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

---

# 50. SECURITY REQUIREMENTS

System wajib memiliki:

- Helmet
- CORS configuration
- Rate limiting
- Input validation
- HTML sanitization
- Password hashing
- Secure cookies
- JWT expiration
- Authorization middleware
- File validation
- MongoDB query protection
- Request size limits

---

# 51. RATE LIMITING

Recommended:

```text
Login:
5 requests / minute / IP

Register:
5 requests / minute / IP

Forgot Password:
3 requests / minute / IP

General API:
100 requests / minute / IP
```

Nilai dapat disesuaikan berdasarkan production traffic.

---

# 52. CORS

Development:

```text
localhost
```

Production:

```text
https://your-domain.com
```

Jangan menggunakan:

```text
Access-Control-Allow-Origin: *
```

untuk authenticated production API.

---

# 53. ERROR HANDLING

Backend harus menggunakan centralized error handler.

Kategori:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

Error response tidak boleh membocorkan:

- Password
- JWT
- Database credentials
- Stack trace production
- Internal secrets

---

# 54. FRONTEND ARCHITECTURE

Recommended:

```text
src/
├── components/
├── layouts/
├── pages/
├── features/
│   ├── auth/
│   ├── courses/
│   ├── lessons/
│   ├── students/
│   ├── payments/
│   ├── progress/
│   └── dashboard/
├── hooks/
├── services/
├── lib/
├── schemas/
├── routes/
├── stores/
└── utils/
```

Feature-based architecture lebih disarankan daripada menyimpan seluruh component berdasarkan tipe file saja.

---

# 55. FRONTEND STATE MANAGEMENT

Local UI state:

```text
useState
useReducer
```

Server state dapat menggunakan:

```text
TanStack Query
```

Global state hanya untuk kebutuhan seperti:

```text
Authentication
Theme
UI preferences
```

Jangan menyimpan seluruh API response ke global state tanpa kebutuhan.

---

# 56. UI / UX PRINCIPLES

Dashboard harus:

- Clean
- Professional
- Responsive
- Consistent
- Accessible
- Fast

Avoid:

- Excessive animation
- Excessive gradients
- Excessive shadows
- Unnecessary decoration
- Overloaded dashboard

Focus:

```text
Information hierarchy
Readability
Clear actions
Fast navigation
```

---

# 57. RESPONSIVE DESIGN

Breakpoints minimal:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Dashboard sidebar pada mobile berubah menjadi:

```text
Drawer / Sheet
```

Course player harus tetap nyaman digunakan pada mobile.

---

# 58. LOADING STATES

Setiap request asynchronous harus memiliki:

```text
Loading
Success
Empty
Error
```

Contoh:

```text
Loading courses...
No courses found.
Failed to load courses.
```

Skeleton loader lebih disarankan daripada blank screen.

---

# 59. EMPTY STATES

Contoh:

```text
No Courses Yet

You haven't enrolled in any course.
Browse Courses
```

Admin:

```text
No students found.

Create Student
```

---

# 60. FORM UX

Form harus menyediakan:

- Inline validation
- Error message
- Loading submit
- Disabled submit ketika processing
- Confirmation untuk destructive action

Delete:

```text
Are you sure?
This action cannot be undone.
```

---

# 61. SEARCH UX

Search harus:

- Debounced
- Case insensitive
- Paginated
- URL state aware jika diperlukan

Contoh:

```text
/courses?search=javascript&page=1
```

---

# 62. ACCESS CONTROL FRONTEND

Frontend boleh menyembunyikan UI berdasarkan role.

Namun:

> Frontend permission bukan security boundary.

Backend tetap wajib melakukan authorization.

---

# 63. PAYMENT UX

Checkout:

```text
Course Detail
 ↓
Buy Course
 ↓
Order Summary
 ↓
Confirm
 ↓
Midtrans Snap
 ↓
Payment
 ↓
Success / Pending / Failed
```

Student harus mendapatkan status yang jelas.

---

# 64. PAYMENT RESULT

Success:

```text
Payment Successful

Your course is now available.
Start Learning
```

Pending:

```text
Payment Pending

We're waiting for payment confirmation.
```

Failed:

```text
Payment Failed

Please try again.
```

---

# 65. ENROLLMENT BUSINESS RULES

Rule:

```text
Paid transaction
      ↓
Active enrollment
```

Tidak boleh:

```text
Frontend success
      ↓
Enrollment
```

Enrollment harus berasal dari backend setelah payment tervalidasi.

---

# 66. MANUAL ENROLLMENT

Admin / Mentor dapat memberikan enrollment manual.

Contoh:

```text
Student:
John Doe

Course:
Laravel Fundamentals

Source:
manual

Status:
active
```

Manual enrollment tidak membutuhkan transaksi Midtrans.

---

# 67. COURSE ACCESS RULE

Student dapat mengakses course apabila:

```text
authenticated
AND
enrollment.status = active/completed
```

Jika:

```text
revoked
```

maka akses dicabut.

---

# 68. COURSE DELETION RULE

Course yang sudah memiliki:

- Transaction
- Enrollment
- Student progress

tidak boleh langsung dihapus secara destructive.

Gunakan:

```text
archive
```

atau soft delete.

---

# 69. SOFT DELETE

Entity penting menggunakan soft delete:

```text
Course
User
```

Data transaksi tidak boleh dihapus secara sembarangan.

---

# 70. ANALYTICS

System harus dapat menghitung:

```text
Total Revenue
Total Transactions
Successful Transactions
Total Students
Total Enrollments
Course Completion Rate
Average Course Progress
Most Popular Course
```

---

# 71. COURSE ANALYTICS

Mentor dapat melihat:

```text
Total Students
Total Revenue
Average Progress
Completion Rate
Most Completed Lesson
Least Completed Lesson
```

---

# 72. STUDENT ANALYTICS

Student dapat melihat:

```text
Courses
Completed Courses
Learning Hours
Progress
Quiz Scores
Certificates
```

---

# 73. PERFORMANCE REQUIREMENTS

Target:

```text
API p95 < 500ms
```

untuk normal CRUD operation pada production environment yang sehat.

Frontend:

```text
Initial page load < 3 seconds
```

dengan kondisi network normal.

---

# 74. PERFORMANCE STRATEGY

Gunakan:

- Database indexes
- Pagination
- Projection
- Lazy loading
- Image optimization
- API caching jika diperlukan
- CDN
- Compression
- Code splitting

---

# 75. OBSERVABILITY

Production harus memiliki:

```text
Application Logs
Error Logs
HTTP Request Logs
Payment Logs
Webhook Logs
Audit Logs
```

Sensitive information tidak boleh masuk log.

Jangan log:

```text
password
JWT
Midtrans secret key
API secret
```

---

# 76. ENVIRONMENT CONFIGURATION

Development:

```text
.env.development
```

Production:

```text
.env.production
```

Environment variables minimal:

```text
NODE_ENV
PORT
MONGODB_URI
JWT_SECRET
JWT_REFRESH_SECRET
MIDTRANS_SERVER_KEY
MIDTRANS_CLIENT_KEY
MIDTRANS_IS_PRODUCTION
UPLOAD_PATH
FRONTEND_URL
```

Secrets tidak boleh disimpan di Git.

---

# 77. PROJECT STRUCTURE

## Backend

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── schemas/
│   ├── utils/
│   ├── jobs/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
├── uploads/
└── package.json
```

## Frontend

```text
client/
├── src/
│   ├── components/
│   ├── features/
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

---

# 78. TESTING STRATEGY

## Backend

Testing:

```text
Unit Test
Integration Test
API Test
Authentication Test
Payment Test
Webhook Test
```

## Frontend

Testing:

```text
Component Test
Integration Test
Form Validation Test
Route Protection Test
```

---

# 79. CRITICAL TEST CASES

Authentication:

```text
Valid login → success
Invalid password → reject
Expired token → reject
Unauthorized role → reject
```

Payment:

```text
Valid payment → enrollment
Duplicate webhook → no duplicate enrollment
Invalid signature → reject
Failed payment → no enrollment
```

Enrollment:

```text
Duplicate enrollment → reject
Manual enrollment → active
Revoked enrollment → access denied
```

Course:

```text
Draft course → unavailable publicly
Published course → accessible
Archived course → cannot purchase
```

---

# 80. ACCEPTANCE CRITERIA — AUTHENTICATION

Feature dianggap selesai apabila:

- User dapat register
- User dapat login
- Password tersimpan hashed
- JWT berhasil dibuat
- HTTP-only cookie digunakan
- Logout menghapus session/token
- Role authorization berjalan
- Protected API menolak unauthenticated request

---

# 81. ACCEPTANCE CRITERIA — COURSE

Course feature selesai apabila:

- Mentor dapat membuat course
- Mentor dapat mengedit course
- Mentor dapat menghapus/archive course
- Mentor dapat upload thumbnail
- Mentor dapat membuat lesson
- Mentor dapat reorder lesson
- Mentor dapat publish course
- Student dapat melihat published course

---

# 82. ACCEPTANCE CRITERIA — PAYMENT

Payment feature selesai apabila:

- Student dapat checkout
- Backend membuat order
- Midtrans Snap token dibuat
- Student dapat membayar
- Webhook diterima
- Signature diverifikasi
- Transaction diperbarui
- Enrollment dibuat otomatis
- Duplicate webhook tidak membuat duplicate enrollment

---

# 83. ACCEPTANCE CRITERIA — LEARNING

Learning feature selesai apabila:

- Student dapat membuka course yang dimiliki
- Student dapat melihat lesson
- Student dapat menonton video
- Student dapat membaca text content
- Student dapat mark lesson completed
- Progress otomatis diperbarui
- Course dapat mencapai 100%
- Completion timestamp tercatat

---

# 84. SECURITY ACCEPTANCE CRITERIA

Sistem dianggap secure baseline apabila:

- Password tidak plaintext
- JWT tidak muncul di response body jika menggunakan cookie strategy
- Protected endpoints membutuhkan authentication
- Role restriction berjalan
- HTML disanitasi
- Upload dibatasi
- File type divalidasi
- Rate limiting aktif
- CORS dikonfigurasi
- Payment webhook diverifikasi
- Secrets tidak masuk repository

---

# 85. DEPLOYMENT ARCHITECTURE

Recommended:

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

YouTube:

```text
Student Browser
      │
      └──────► YouTube
```

Video tidak melewati backend.

---

# 86. DEPLOYMENT ENVIRONMENTS

Minimal:

```text
Development
Staging
Production
```

Development:

```text
Local MongoDB
Midtrans Sandbox
```

Staging:

```text
Cloud MongoDB
Midtrans Sandbox
```

Production:

```text
Production MongoDB
Midtrans Production
HTTPS
```

---

# 87. BACKUP STRATEGY

MongoDB backup:

```text
Daily backup
```

Retensi:

```text
7 daily backups
4 weekly backups
```

Production backup harus diuji dengan restore test secara berkala.

---

# 88. DATA RETENTION

Transactions harus dipertahankan untuk historical reporting.

Audit log tidak boleh dihapus secara normal oleh Mentor.

Admin dapat memiliki retention policy untuk data non-critical.

---

# 89. ACCESSIBILITY

UI harus memenuhi baseline accessibility:

- Semantic HTML
- Keyboard navigation
- Focus states
- Proper labels
- Accessible buttons
- Color contrast
- Screen-reader friendly forms

---

# 90. SEO

Public course pages harus memiliki:

```text
Title
Meta Description
Open Graph
Canonical URL
```

Contoh:

```text
/courses/javascript-fundamentals
```

Student dashboard tidak perlu di-index search engine.

---

# 91. SLUG MANAGEMENT

Slug otomatis dibuat dari title.

Contoh:

```text
JavaScript Fundamentals
```

menjadi:

```text
javascript-fundamentals
```

Jika title berubah, slug tidak boleh otomatis berubah apabila course sudah published tanpa confirmation.

---

# 92. COURSE VERSIONING

Future-ready architecture harus mempertimbangkan perubahan materi.

Perubahan lesson setelah student belajar tidak boleh merusak:

```text
Progress
Quiz attempt
Certificate
```

Minimal MVP harus menggunakan stable lesson IDs.

---

# 93. TRANSACTION NUMBER

Order ID harus unik.

Format contoh:

```text
LMS-20260905-8F42K
```

Order ID dibuat server-side.

---

# 94. BUSINESS RULE — PRICE

Harga course berasal dari:

```text
Course.price
```

Harga pada transaction harus disimpan sebagai snapshot.

Contoh:

```text
Course price:
Rp150.000

Transaction amount:
Rp150.000
```

Jika harga course kemudian berubah:

```text
Rp200.000
```

transaction lama tetap:

```text
Rp150.000
```

---

# 95. BUSINESS RULE — REFUND

Future support:

```text
refund_requested
refund_approved
refunded
```

Refund harus:

```text
Transaction
 ↓
Refund
 ↓
Enrollment revoked
```

sesuai business policy.

---

# 96. ADMIN SETTINGS

Admin dapat mengatur:

```text
Site Name
Site Logo
Currency
Default Language
Payment Configuration
Course Configuration
Certificate Configuration
Email Configuration
```

Secrets tetap berada di environment variable dan tidak dapat diedit melalui dashboard.

---

# 97. NOTIFICATION CENTER

Header dashboard menyediakan notification icon.

Contoh:

```text
🔔 3

Payment successful
You are enrolled in Laravel Course

Certificate available
```

Notification dapat:

```text
Mark as read
Mark all as read
```

---

# 98. ACTIVITY TIMELINE

Dashboard dapat menampilkan:

```text
10:30
John purchased Laravel Course

10:12
Course "React Fundamentals" published

09:45
New student registered
```

---

# 99. SEARCH GLOBAL

Future feature.

Search:

```text
Courses
Students
Transactions
Lessons
```

Contoh:

```text
Search "John"
```

Result:

```text
Student: John Doe
Transaction: LMS-20260905-...
Course: JavaScript Fundamentals
```

---

# 100. UX PRINCIPLE — FEEDBACK

Setiap action penting harus memberikan feedback.

Success:

```text
Course published successfully.
```

Error:

```text
Unable to publish course.
Please try again.
```

Destructive:

```text
This action cannot be undone.
```

---

# 101. SECURITY THREAT MODEL

Threats yang harus diperhatikan:

```text
XSS
CSRF
Credential stuffing
Brute force
JWT theft
Privilege escalation
IDOR
Malicious file upload
Payment manipulation
Webhook spoofing
MongoDB injection
```

Protection harus diterapkan pada API layer.

---

# 102. IDOR PROTECTION

Request:

```text
GET /courses/123
```

tidak otomatis berarti user memiliki akses.

Backend harus memeriksa:

```text
User
 ↓
Role
 ↓
Resource ownership
 ↓
Enrollment
```

---

# 103. RESOURCE OWNERSHIP

Mentor hanya dapat mengubah:

```text
course.mentorId === authenticatedUser.id
```

Admin dapat bypass ownership sesuai permission.

Student hanya dapat mengakses:

```text
enrollment.studentId === authenticatedUser.id
```

---

# 104. TRANSACTION OWNERSHIP

Student hanya boleh melihat transaction miliknya.

Mentor hanya dapat melihat transaction yang berkaitan dengan course miliknya.

Admin dapat melihat seluruh transaction.

---

# 105. AUDITABILITY

Action sensitif harus dicatat.

Minimal:

```text
Login
Logout
Password Change
Course CRUD
Student CRUD
Enrollment
Payment
Refund
Role Change
```

---

# 106. API DOCUMENTATION

API harus terdokumentasi menggunakan:

```text
OpenAPI / Swagger
```

Documentation mencakup:

- Endpoint
- Method
- Authentication
- Request body
- Response
- Error
- Permission

---

# 107. DEVELOPMENT WORKFLOW

Recommended:

```text
Requirement
   ↓
Schema
   ↓
API Contract
   ↓
Backend
   ↓
Testing
   ↓
Frontend
   ↓
Integration
   ↓
QA
   ↓
Staging
   ↓
Production
```

---

# 108. GIT WORKFLOW

Branch:

```text
main
develop
feature/*
fix/*
hotfix/*
```

Commit harus jelas.

Contoh:

```text
feat: add course enrollment
fix: prevent duplicate payment webhook
refactor: improve lesson service
```

---

# 109. DEFINITION OF DONE

Feature dianggap Done apabila:

- Requirement selesai
- Backend implemented
- Frontend implemented
- Validation implemented
- Authorization implemented
- Error handling implemented
- Tests passed
- Responsive UI
- No critical console errors
- Documentation updated

---

# 110. MVP RELEASE CHECKLIST

## Authentication

- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Refresh
- [ ] Password reset
- [ ] RBAC

## Course

- [ ] CRUD
- [ ] Thumbnail
- [ ] Category
- [ ] Lesson
- [ ] CKEditor
- [ ] YouTube
- [ ] Publish
- [ ] Archive

## Student

- [ ] CRUD
- [ ] Profile
- [ ] Enrollment

## Payment

- [ ] Midtrans Snap
- [ ] Transaction
- [ ] Webhook
- [ ] Signature validation
- [ ] Idempotency

## Learning

- [ ] Course player
- [ ] Lesson completion
- [ ] Progress
- [ ] Course completion

## Dashboard

- [ ] Admin dashboard
- [ ] Mentor dashboard
- [ ] Student dashboard
- [ ] Analytics

## Security

- [ ] Helmet
- [ ] CORS
- [ ] Rate limit
- [ ] Validation
- [ ] Sanitization
- [ ] Secure cookies
- [ ] File validation

---

# 111. PHASED DEVELOPMENT ROADMAP

## Phase 1 — Foundation

```text
Project setup
MongoDB
Express
React
Authentication
RBAC
Validation
Error handling
```

## Phase 2 — Course

```text
Course CRUD
Category
Thumbnail
Lesson
CKEditor
YouTube
Ordering
Publishing
```

## Phase 3 — Student

```text
Student CRUD
Enrollment
Student dashboard
Access control
```

## Phase 4 — Payment

```text
Midtrans
Checkout
Transaction
Webhook
Idempotency
Automatic enrollment
```

## Phase 5 — Learning

```text
Course player
Progress
Lesson completion
Course completion
```

## Phase 6 — Analytics

```text
Revenue
Enrollment
Students
Course performance
```

## Phase 7 — Advanced LMS

```text
Quiz
Certificate
Notification
Email
Review
Assignment
Gamification
```

---

# 112. FUTURE SCALABILITY

Architecture harus memungkinkan penambahan:

```text
Redis
Queue Worker
Object Storage
CDN
Search Engine
Email Provider
Analytics Service
```

tanpa harus melakukan rewrite besar terhadap core application.

---

# 113. SUCCESS METRICS

Product KPI:

### Learning

```text
Course Completion Rate
Average Progress
Average Learning Time
```

### Business

```text
Gross Revenue
Successful Payment Rate
Enrollment Rate
Course Conversion Rate
```

### Platform

```text
Active Students
Active Mentors
Published Courses
Daily Active Users
```

---

# 114. CORE USER JOURNEY

## Student Purchase Journey

```text
Landing Page
     ↓
Browse Course
     ↓
Course Detail
     ↓
Buy Course
     ↓
Login / Register
     ↓
Checkout
     ↓
Midtrans
     ↓
Payment
     ↓
Webhook
     ↓
Enrollment
     ↓
My Course
     ↓
Learning
     ↓
Progress
     ↓
Completion
     ↓
Certificate
```

---

# 115. CORE MENTOR JOURNEY

```text
Login
 ↓
Dashboard
 ↓
Create Course
 ↓
Add Information
 ↓
Upload Thumbnail
 ↓
Add Lessons
 ↓
Add Text / YouTube
 ↓
Arrange Lessons
 ↓
Preview
 ↓
Publish
 ↓
Students Purchase
 ↓
Monitor Progress
 ↓
Review Analytics
```

---

# 116. CORE ADMIN JOURNEY

```text
Login
 ↓
Dashboard
 ↓
Monitor Users
 ↓
Monitor Courses
 ↓
Monitor Transactions
 ↓
Monitor Enrollment
 ↓
Review Analytics
 ↓
Audit Logs
```

---

# 117. FINAL PRODUCT DEFINITION

LMS Dashboard System V2 bukan hanya CRUD dashboard untuk course.

Produk harus diposisikan sebagai:

> **A complete web-based Learning Management Platform that manages the entire lifecycle of digital learning — from course creation, content delivery, student enrollment, payment processing, learning progress, assessment, and certification.**

Core architecture:

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

Dengan struktur ini, MVP tetap dapat dikembangkan secara bertahap tanpa mengorbankan fondasi untuk fitur LMS yang lebih advanced di masa depan.
