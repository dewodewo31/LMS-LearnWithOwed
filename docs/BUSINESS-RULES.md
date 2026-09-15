# Business Rules — LearnWithOwed

---

## 1. User Roles

### Role Hierarchy

```
admin > mentor > student
```

### Permissions Matrix

| Action | Admin | Mentor | Student |
| ------ | ----- | ------ | ------- |
| Create course | Yes | Yes | No |
| Edit any course | Yes | No | No |
| Edit own course | Yes | Yes | No |
| Delete course | Yes | No | No |
| Publish course | Yes | Yes | No |
| Archive course | Yes | Yes | No |
| Create lesson | Yes | Yes (own course) | No |
| Edit lesson | Yes | Yes (own course) | No |
| Delete lesson | Yes | Yes (own course) | No |
| Create assignment | Yes | Yes (own course) | No |
| Grade assignment | Yes | Yes (own course) | No |
| Enroll student | Yes | Yes (own course) | No |
| Unenroll student | Yes | Yes (own course) | No |
| View students | Yes | Yes (enrolled) | No |
| Submit assignment | No | No | Yes (enrolled) |
| View own progress | No | No | Yes |
| Post question | No | No | Yes (enrolled) |
| Post answer | No | No | Yes (enrolled) |
| Verify answer | Yes | Yes (own course) | No |
| View leaderboard | Yes | Yes | Yes |
| Manage users | Yes | No | No |

---

## 2. Course Business Rules

### Creation

- Title: required, 3-150 characters
- Description: required
- Price: required, minimum 0
- Category: required
- Level: `beginner`, `intermediate`, `advanced`
- Status: defaults to `draft`

### Slug Generation

- Auto-generated from title
- Lowercase, hyphens for spaces
- Unique across all courses
- Example: "React Fundamentals" → "react-fundamentals"

### Status Transitions

```
draft → published → archived
```

- `draft`: editable, not visible to students
- `published`: visible to students, enrollment allowed
- `archived`: hidden from students, read-only

### Ownership

- Mentor can only edit own courses
- Admin can edit any course
- Ownership checked via `mentorId` field

### Deletion

- Soft delete only (`isDeleted: true`)
- Not visible after deletion
- Data preserved for audit

---

## 3. Lesson Business Rules

### Creation

- Title: required
- Content type: `text` or `video`
- Course association: required
- Order: auto-assigned (last position)

### Content Types

#### Text Lessons

- Rich text (CKEditor)
- Sanitized HTML output
- No script/iframe allowed
- YouTube iframes via embed URL

#### Video Lessons

- YouTube: embed URL validated
- Upload: MP4, max 10MB
- Duration: auto-detected from upload
- Duration extraction: ffmpeg → metadata

### Ordering

- Lessons ordered by `order` field
- Reorder API updates positions
- Default order: creation sequence

### Access Control

- Student must be enrolled
- Course must be published
- Draft courses: mentor/admin only

---

## 4. Enrollment Business Rules

### Creation

- Only admin/mentor can enroll students
- Student cannot self-enroll
- Duplicate prevention (409 Conflict)
- Status: always `active`

### Status Transitions

```
active (only status used)
```

- No soft-delete for enrollments
- Unenrollment removes record entirely

### Unenrollment

- Admin/mentor can unenroll
- Removes enrollment record
- Student loses access immediately
- Progress data preserved

### Bulk Enrollment

- Admin/mentor can enroll multiple students
- Validates all student IDs first
- Rolls back on any failure
- Returns per-student status

### Access Control

- Enrolled: full access to course content
- Not enrolled: 403 Forbidden
- Draft course: no student access (even if enrolled)

---

## 5. Progress Business Rules

### Per-Lesson Progress

- Status: `not_started`, `in_progress`, `completed`
- One progress record per lesson per student
- Created on first access (`in_progress`)
- Updated on completion (`completed`)

### Course Progress

- Calculated: completed lessons / total lessons
- Percentage: 0-100%
- Real-time calculation (not stored)

### Course Completion

- Triggered when all lessons completed
- Notification sent to student
- Certificate generation (planned)

---

## 6. Assignment Business Rules

### Creation

- Title: required
- Instructions: sanitized HTML
- Lesson association: optional
- File attachment: optional (10MB max)

### Submission

- Student must be enrolled
- Course must be published
- Text + optional file
- One submission per student initially

### Resubmission

- Student can resubmit
- Previous submission overwritten
- Version incremented
- History preserved (not implemented yet)

### Grading

- Score: 0-100
- Grade: letter grade (A+, A, B+, B, C)
- Feedback: optional text
- Only mentor/admin can grade

### Duplicate Prevention

- One assignment per title per course
- Returns 409 Conflict on duplicate

---

## 7. Community Q&A Business Rules

### Questions

- Must be enrolled in course
- Course must be published
- Title: required
- Content: required
- Attachments: optional (2MB max, 5 files)

### Answers

- Any enrolled student can answer
- Content: required
- Attachments: optional

### Verified Answer

- Only mentor/admin can verify
- One verified answer per question
- Toggles on/off

### Rate Limiting

- Posts: 10 per minute per user
- Media: 20 per minute per user

---

## 8. Payment Business Rules (Planned)

### Midtrans Integration

- Order ID: server-generated
- Amount: from course.price (not frontend)
- Payment methods: credit card, bank transfer, e-wallet
- Webhook: signature verification

### Access Control

- Payment pending: limited access
- Payment success: full access
- Payment failed: no access

---

## 9. Notification Business Rules

### Types

| Type | Trigger |
| ---- | -------- |
| `enrollment` | Student enrolled in course |
| `course` | Course published/updated |
| `lesson` | New lesson added |
| `assignment` | Assignment created/graded |
| `community` | Question answered/verified |
| `system` | System announcements |

### Read Status

- `isRead: false` — new
- `isRead: true` — read
- Mark individual or all as read

### Delivery

- In-app only (no email yet)
- Real-time via polling
- Bell icon shows unread count

---

## 10. Leaderboard Business Rules

### Points

| Action | Points |
| ------ | ------ |
| Daily login | 10 |
| Submit assignment | 10 |

### Ranking

- Points accumulated over time
- Rank 1 = highest points
- Tie-breaking: by timestamp

### Scopes

- Course leaderboard: within specific course
- Global leaderboard: across all students

---

## 11. File Upload Business Rules

### Public Files (Thumbnails)

- Location: `/uploads/`
- Access: public
- Naming: `uuid.ext`
- Limit: 2MB

### Private Files (Assignments)

- Location: `/uploads-private/assignments/`
- Access: authenticated + authorized
- Naming: `uuid.ext`
- Limit: 10MB

### Allowed Extensions (Assignments)

```
.lua .js .jsx .ts .tsx .py .php .html .css .json .zip .txt .md 
.java .c .cpp .cs .rb .go .sql .xml .yml .yaml
```

### Security

- No user input in file path
- Regex validation on stored name
- Authorization check before serving
