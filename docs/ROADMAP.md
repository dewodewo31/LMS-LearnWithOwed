# Roadmap — LearnWithOwed

**Last updated:** 2026-09-15

---

## 1. Completed Features

### Phase 1 — Foundation

- [x] Express + MongoDB setup with Mongoose
- [x] JWT auth with HTTP-only cookies (access + refresh)
- [x] Role-based access control (admin/mentor/student)
- [x] Zod validation on all endpoints
- [x] Rate limiting (auth, general, community)
- [x] File upload with Multer (2MB limit)
- [x] API response convention: `{ success, message, data }`
- [x] Centralized error handler (Mongoose, JWT, Multer, Zod)

### Phase 2 — Course Management

- [x] Course CRUD (title, description, price, category, level)
- [x] Thumbnail upload + delete
- [x] Publish / archive workflow
- [x] Slug auto-generation + uniqueness
- [x] Mentor ownership verification

### Phase 3 — Lessons

- [x] Lesson CRUD with course association
- [x] Rich text content (CKEditor, sanitized HTML)
- [x] YouTube embed (iframe URL validation)
- [x] Video upload + automatic duration detection
- [x] Lesson ordering / reorder API

### Phase 4 — Student System

- [x] Student CRUD (enforce 3 personal details)
- [x] Manual enrollment (admin/mentor)
- [x] Unenrollment + status transitions
- [x] Bulk enrollment
- [x] Course access control (enrollment-gated)
- [x] Progress tracking per lesson/course

### Phase 5 — Assignments

- [x] Assignment CRUD (instructor, per-lesson)
- [x] File upload/download with storage separation
- [x] Student submit + resubmit with versioning
- [x] Grading + notifications
- [x] Assignment list (student/mentor)

### Phase 6 — Leaderboard

- [x] Points system (daily login, submission)
- [x] Rank calculation
- [x] Course-specific leaderboard
- [x] Public leaderboard page

### Phase 7 — Community (Q&A)

- [x] Post questions (course-scoped)
- [x] Post answers (reply)
- [x] Verified answer marking
- [x] File attachments (2MB limit)
- [x] Rate limiting on posts/media

### Phase 8 — Dashboard & Notifications

- [x] Dashboard stats (admin, mentor, student)
- [x] Real-time notifications (bell dropdown)
- [x] Mark read/unread
- [x] Mark all as read

### Phase 9 — Landing Page

- [x] Hero section with random courses
- [x] Modules page with random ordering
- [x] Module detail by slug
- [x] Load More pagination
- [x] Public leaderboard (lessons/modules)

---

## 2. In Progress

### Landing Page Antislop Redesign

- [x] Audit existing violations (20+ found)
- [x] Remove decorative noise (cursor glow, pulsing dots, arrows)
- [x] Rebuild HeroSection with honest course card
- [x] Rebuild FeaturesSection with visual hierarchy
- [x] Rebuild HowItWorksSection with alternating layout
- [x] Rebuild CTASection without gradient effects
- [ ] Final QA pass on all sections
- [ ] Design system documentation (docs/DESIGN.md)

---

## 3. Planned (Backlog)

### Payment Integration

- [ ] Midtrans gateway integration
- [ ] Payment method selection
- [ ] Webhook verification
- [ ] Payment history
- [ ] Course access on payment success

### Certificate System

- [ ] Certificate generation on course completion
- [ ] PDF certificate with verification URL
- [ ] Certificate download

### Advanced Analytics

- [ ] Course completion rates
- [ ] Average grades per course
- [ ] Student engagement metrics
- [ ] Export to Excel/PDF

### Email System

- [ ] Email verification
- [ ] Password reset via email
- [ ] Enrollment notifications
- [ ] Grade notifications

### Mobile Responsiveness

- [ ] Admin dashboard mobile optimization
- [ ] Student panel mobile optimization
- [ ] Lesson player mobile optimization

### Performance

- [ ] Database indexing optimization
- [ ] API response caching
- [ ] Image optimization
- [ ] Lazy loading for lesson content

---

## 4. Technical Debt

| Area | Issue | Priority |
| ---- | ----- | -------- |
| Tests | No integration test runner in CI | Medium |
| Client | No type checking (TypeScript) | Low |
| Client | No automated accessibility testing | Low |
| Docs | API docs not auto-generated | Medium |
| Logs | No structured logging format | Medium |

---

## 5. Version History

| Version | Date | Changes |
| ------- | ---- | ------- |
| 1.0.0 | 2026-09 | Initial release: full LMS with all core features |
