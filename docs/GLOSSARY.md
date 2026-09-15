# Glossary — LearnWithOwed

---

## Core Concepts

| Term | Definition |
| ---- | ---------- |
| **LMS** | Learning Management System — platform for managing online courses |
| **MERN** | MongoDB, Express, React, Node.js — full-stack JavaScript |
| **CRUD** | Create, Read, Update, Delete — basic data operations |
| **IDOR** | Insecure Direct Object Reference — security vulnerability |

---

## Roles

| Role | Description |
| ---- | ----------- |
| **Admin** | Full access to all resources and settings |
| **Mentor** | Course instructor — manages own courses, students, assignments |
| **Student** | Learner — accesses enrolled courses, submits assignments |

---

## Course System

| Term | Definition |
| ---- | ---------- |
| **Course** | Main learning container with title, description, price, category |
| **Module** | Alias for course in public-facing pages |
| **Lesson** | Individual learning unit within a course |
| **Slug** | URL-friendly identifier (e.g., `react-fundamentals`) |
| **Status** | `draft` → `published` → `archived` workflow |

---

## Content Types

| Term | Definition |
| ---- | ---------- |
| **Rich Text** | HTML content from CKEditor (sanitized) |
| **YouTube Embed** | iframe-based video player |
| **Video Upload** | MP4 file stored in uploads directory |
| **Text Lesson** | HTML-based lesson content |
| **Video Lesson** | Video content (YouTube or upload) |

---

## User Management

| Term | Definition |
| ---- | ---------- |
| **Enrollment** | Link between student and course (admin-created) |
| **Unenrollment** | Removing student from course |
| **Status** | `active` — only status used (no soft-delete for enrollments) |
| **Personal Details** | 3 fields required: name, email, phone (or NIK, address) |

---

## Assignments

| Term | Definition |
| ---- | ---------- |
| **Assignment** | Task with title, instructions, optional file |
| **Submission** | Student's response (text + optional file) |
| **Resubmit** | Student overwrites previous submission |
| **Versioning** | Each resubmit creates new `submissionVersion` |
| **Grade** | Mentor's score and feedback |

---

## Grading

| Field | Type | Description |
| ----- | ---- | ----------- |
| `score` | Number | 0–100 |
| `grade` | String | Letter grade (A+, A, B+, B, C) |
| `feedback` | String | Mentor comments |

---

## Progress

| Term | Definition |
| ---- | ---------- |
| **Progress Tracking** | Per-lesson completion status |
| **Course Progress** | Percentage of lessons completed |
| **Completion** | Triggered when all lessons finished |

---

## Community

| Term | Definition |
| ---- | ---------- |
| **Q&A** | Question and Answer system |
| **Question** | Course-scoped post by student |
| **Answer** | Reply to question |
| **Verified** | Mentor marks answer as correct |
| **Attachment** | File upload on questions/answers |

---

## Notifications

| Term | Definition |
| ---- | ---------- |
| **Notification** | System message to user |
| **Type** | `enrollment`, `course`, `lesson`, `assignment`, `community`, `system` |
| **Read** | `isRead: true` — user has seen notification |
| **Unread** | `isRead: false` — new notification |

---

## Payments

| Term | Definition |
| ---- | ---------- |
| **Midtrans** | Payment gateway (Xendit alternative) |
| **Order ID** | Server-generated unique identifier |
| **Webhook** | Payment status callback from Midtrans |
| **Idempotent** | Safe to process duplicate webhooks |

---

## Leaderboard

| Term | Definition |
| ---- | ---------- |
| **Points** | Score earned from actions |
| **Rank** | Position in leaderboard (1 = highest) |
| **Course Leaderboard** | Rankings within specific course |
| **Global Leaderboard** | Rankings across all students |

### Points Breakdown

| Action | Points |
| ------ | ------ |
| Daily login | 10 |
| Submit assignment | 10 |

---

## Technical Terms

| Term | Definition |
| ---- | ---------- |
| **JWT** | JSON Web Token — authentication mechanism |
| **Access Token** | Short-lived JWT (15m) for API access |
| **Refresh Token** | Long-lived JWT (7d) for getting new access tokens |
| **HTTP-only Cookie** | Cookie inaccessible to JavaScript |
| **Zod** | TypeScript-first schema validation |
| **Mongoose** | MongoDB ODM for Node.js |
| **TanStack Query** | React data fetching/caching library |
| **CKEditor** | Rich text editor for lesson content |
| **Multer** | File upload middleware for Express |

---

## API Conventions

| Term | Definition |
| ---- | ---------- |
| **API Prefix** | `/api/v1/` — all routes start here |
| **Success Response** | `{ success: true, message, data }` |
| **Error Response** | `{ success: false, message, errors? }` |
| **Soft Delete** | `isDeleted: true` flag instead of removing record |
| **Pagination** | `?page=1&limit=10` query parameters |

---

## Frontend Terms

| Term | Definition |
| ---- | ---------- |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Router** | Client-side routing |
| **TanStack Query** | Server state management |
| **Zustand** | Lightweight state management (if used) |
| **Sonner** | Toast notification library |
