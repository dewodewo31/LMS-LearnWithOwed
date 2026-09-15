# Development Guide — LearnWithOwed

---

## 1. Prerequisites

- Node.js 20+
- MongoDB 7 (or Docker)
- npm or yarn

---

## 2. Quick Start

### Option A: Docker Compose (Recommended)

```bash
docker compose up
```

Services:
- MongoDB: `localhost:27017`
- Server: `localhost:5000`
- Client: `localhost:5173`

### Option B: Manual Setup

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Server
cd server
cp .env.example .env.development
npm install
npm run dev

# Terminal 3 — Client
cd client
npm install
npm run dev
```

---

## 3. Project Structure

```
LMS-LearnWithOwed/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/ui/     # Reusable UI components
│   │   ├── features/          # Feature modules
│   │   ├── hooks/             # Custom hooks
│   │   ├── contexts/          # React contexts
│   │   └── utils/             # Utilities
│   ├── public/                # Static assets
│   └── vite.config.js
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB, env, mail
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/         # Auth, validation, errors
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # Express routes
│   │   ├── schemas/           # Zod validation
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── tests/                 # Jest tests
│   └── scripts/               # Seed scripts
├── docs/                      # Documentation
└── docker-compose.yml
```

---

## 4. Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature
```

### 2. Make Changes

- Backend: `server/src/`
- Frontend: `client/src/`

### 3. Test

```bash
# Backend tests
cd server && npm test

# Frontend lint
cd client && npx oxlint src

# Build check
cd client && npm run build
```

### 4. Commit

```bash
git add .
git commit -m "feat: your feature description"
```

### 5. Push & PR

```bash
git push origin feature/your-feature
```

---

## 5. Backend Development

### Adding a New Endpoint

1. Create schema in `server/src/schemas/`
2. Create controller in `server/src/controllers/`
3. Create route in `server/src/routes/`
4. Register route in `server/src/app.js`
5. Add tests in `server/tests/`

### Pattern

```javascript
// schema
const createSchema = z.object({
  title: z.string().min(3).max(150),
});

// controller
const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const item = await Model.create(data);
  res.status(201).json({ success: true, message: 'Created', data: item });
});

// route
router.post('/', authenticate, authorize('admin'), create);
```

---

## 6. Frontend Development

### Adding a New Feature

1. Create feature directory in `client/src/features/`
2. Add components, hooks, API calls
3. Register routes in `client/src/routes/index.jsx`
4. Add navigation links if needed

### Pattern

```javascript
// api call
export const getCourses = async () => {
  const res = await axios.get('/api/v1/courses');
  return res.data.data;
};

// component
const CourseList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  if (isLoading) return <Loading />;
  return <div>{data.map(c => <CourseCard key={c._id} course={c} />)}</div>;
};
```

---

## 7. Database

### Collections

| Collection | Description |
| ---------- | ----------- |
| users | Admin, mentor, student accounts |
| courses | Course definitions |
| lessons | Lesson content |
| enrollments | Student-course links |
| lessonprogress | Progress tracking |
| assignments | Assignment definitions |
| assignmentsubmissions | Student submissions |
| notifications | User notifications |
| communityattachments | Q&A file uploads |
| auditlogs | Activity logging |

### Seed Data

```bash
cd server
npm run seed          # Basic users
npm run seed:data     # Users + courses + lessons
```

---

## 8. Common Commands

### Server

```bash
npm run dev           # Start with nodemon
npm start             # Production start
npm test              # Run tests
npm run test:watch    # Watch mode
npm run seed          # Seed database
```

### Client

```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build
npx oxlint src        # Lint
```

### Docker

```bash
docker compose up              # Start dev stack
docker compose down            # Stop stack
docker compose logs -f server  # Server logs
docker compose exec server sh  # Shell into server
```

---

## 9. Debugging

### Backend

```bash
# Node.js inspector
node --inspect src/server.js

# Mongoose debug
DEBUG=mongoose:* npm start
```

### Frontend

- React DevTools (browser extension)
- Vite HMR (hot module replacement)

---

## 10. Git Workflow

### Branch Naming

- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring

### Commit Messages

```
feat: add course enrollment endpoint
fix: resolve duplicate email validation
docs: update API documentation
refactor: simplify auth middleware
```

### Pre-commit Checklist

- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npx oxlint src`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log left in code
- [ ] No secrets in code
