# Testing — LearnWithOwed

**Framework:** Jest + Supertest (backend)
**Lint:** Oxlint (frontend)
**Build:** Vite production build

---

## 1. Test Setup

### Backend

```bash
cd server
npm test                    # Run all tests
npm run test:watch          # Watch mode
```

Configuration in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "setupFiles": ["<rootDir>/tests/setup.js"]
  }
}
```

Environment: `NODE_ENV=test` (auto-set by cross-env)

### Frontend

```bash
cd client
npx oxlint src              # Lint
npm run build               # Build check
```

---

## 2. Test Structure

```
server/tests/
├── setup.js                 # MongoDB Memory Server setup
├── auth.test.js             # Authentication flows
├── courses.test.js          # Course CRUD
├── lessons.test.js          # Lesson management
├── students.test.js         # Student management
├── enrollments.test.js      # Enrollment flows
├── progress.test.js         # Progress tracking
├── assignments.test.js      # Assignment workflow
├── community.test.js        # Q&A system
├── public-courses.test.js   # Public API
├── dashboard.test.js        # Dashboard stats
├── notifications.test.js    # Notification system
└── uploads.test.js          # File uploads
```

---

## 3. Test Database

- MongoDB Memory Server (in-memory)
- Fresh database per test file
- Cleanup after each test
- No external MongoDB required

---

## 4. Test Patterns

### API Test Structure

```javascript
describe('POST /api/v1/courses', () => {
  it('creates course as admin', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Cookie', adminToken)
      .send({ title: 'Test Course', description: '...' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Course');
  });
});
```

### Authentication in Tests

```javascript
// Login and extract token
const loginRes = await request(app)
  .post('/api/v1/auth/login')
  .send({ email, password });

const token = loginRes.headers['set-cookie'][0];
```

### Authorization Tests

```javascript
// Test role-based access
it('rejects student from creating course', async () => {
  await request(app)
    .post('/api/v1/courses')
    .set('Cookie', studentToken)
    .send({ title: '...' })
    .expect(403);
});
```

---

## 5. Test Coverage Areas

### Authentication (auth.test.js)

- Register success/duplicate
- Login success/invalid credentials
- Logout
- Token refresh
- Password reset flow
- Rate limiting (5 req/min)

### Courses (courses.test.js)

- CRUD operations
- Role-based access (admin/mentor/student)
- Ownership validation (mentor can only edit own)
- Soft delete
- Publish/archive workflow
- Slug generation and uniqueness

### Lessons (lessons.test.js)

- Create/update/delete
- Content type handling (text/video)
- YouTube URL validation
- Lesson ordering
- Sanitization of HTML content

### Enrollments (enrollments.test.js)

- Manual enrollment (admin/mentor)
- Duplicate prevention
- Status transitions
- Student isolation

### Progress (progress.test.js)

- Start lesson
- Complete lesson
- Course progress calculation
- Course completion trigger

### Assignments (assignments.test.js)

- CRUD + instruction sanitization
- Authorization (mentor isolation)
- Duplicate prevention (409)
- File upload/delete/download
- Extension whitelist
- Path traversal prevention
- Student access (enrolled/draft/unenrolled)
- Submit + notifications
- Late flag
- Resubmit versioning + history
- Grading completeness + notifications
- Grade validation (422)

### Community (community.test.js)

- Question CRUD
- Answer CRUD
- Verify/unverify answers
- Attachment upload
- Rate limiting
- Course-scoped access

### Public API (public-courses.test.js)

- Random courses endpoint
- Paginated listing
- Detail by slug
- Leaderboard (lessons/modules)
- Field filtering (no private data)

---

## 6. Running Tests

```bash
# All tests
cd server && npm test

# Specific file
cd server && npx jest tests/auth.test.js

# Watch mode
cd server && npm run test:watch

# Coverage (if configured)
cd server && npx jest --coverage
```

---

## 7. CI/CD Integration

```bash
# Pre-deploy checklist
npm test                      # All tests pass
npx oxlint client/src         # No lint errors
npm run build --prefix client # Build succeeds
```

---

## 8. Manual Testing Checklist

### Landing Page

- [ ] Random modules change on refresh
- [ ] Load More pagination works
- [ ] Module detail shows correct data
- [ ] Responsive at 320px, 768px, 1024px, 1920px

### Dashboard

- [ ] Stats load correctly
- [ ] Course CRUD works
- [ ] Lesson reordering works
- [ ] Student list filters by mentor

### Student Flow

- [ ] Can access enrolled courses
- [ ] Progress tracking works
- [ ] Assignment submit/resubmit works
- [ ] Community Q&A works

### Auth

- [ ] Login/logout works
- [ ] Token refresh works
- [ ] Role-based redirects work
