# Architectural Decisions — LearnWithOwed

---

## ADR-001: JWT + HTTP-only Cookie Authentication

**Status:** Accepted
**Date:** 2026-09

### Decision

Use JWT access tokens stored in HTTP-only cookies with Bearer header fallback.

### Context

- SPA needs stateless auth
- XSS protection required
- API needs to work with tests/tools

### Consequences

+ Tokens not accessible via JavaScript (XSS protection)
+ Stateless — no session storage
+ Bearer header fallback for tests/tools
- Cannot blacklist tokens before expiry
- Cookie size limits

### Alternatives Considered

- Session-based: rejected (requires session store)
- localStorage: rejected (XSS vulnerable)
- Bearer-only: rejected (no cookie security benefits)

---

## ADR-002: Admin-Created Enrollments

**Status:** Accepted
**Date:** 2026-09

### Decision

Students cannot self-enroll. Only admins and mentors can create enrollments.

### Context

- B2C learning platform
- No payment gateway yet
- Manual enrollment model

### Consequences

+ No payment integration needed
+ Manual control over student access
+ Simpler enrollment logic
- Not scalable for self-service
- Requires admin intervention

### Alternatives Considered

- Self-enrollment with payment: deferred to Phase 3
- Free enrollment: rejected (no access control)

---

## ADR-003: Soft Delete Pattern

**Status:** Accepted
**Date:** 2026-09

### Decision

Use `isDeleted: true` flag instead of actual record deletion.

### Context

- Need audit trail
- Referential integrity
- Recovery capability

### Consequences

+ Data preserved for audit
+ Easy recovery
+ No orphaned references
- Query complexity (must filter `isDeleted: false`)
- Storage overhead

### Implementation

```javascript
// Query with soft delete filter
Model.find({ isDeleted: false })

// Soft delete
Model.findByIdAndUpdate(id, { isDeleted: true })
```

---

## ADR-004: Mongoose Over Raw MongoDB

**Status:** Accepted
**Date:** 2026-09

### Decision

Use Mongoose ODM instead of raw MongoDB driver.

### Context

- Need schema validation
- Need middleware hooks
- Need relationship management

### Consequences

+ Schema validation at application level
+ Middleware for pre/post hooks
+ Virtual fields and population
+ Query builder syntax
- Learning curve
- Schema migration complexity

### Alternatives Considered

- Raw MongoDB: rejected (too low-level)
- Prisma: rejected (not native MongoDB)
- Typegoose: considered (TypeScript-first)

---

## ADR-005: Zod for Validation

**Status:** Accepted
**Date:** 2026-09

### Decision

Use Zod for request validation on both client and server.

### Context

- Need type-safe validation
- Need reusable schemas
- Need good error messages

### Consequences

+ TypeScript-first (works with TS later)
+ Reusable schemas
+ Good error messages
+ Client + server validation
- Additional dependency
- Schema duplication (client/server)

### Alternatives Considered

- Joi: rejected (older, larger)
- Yup: rejected (less type-safe)
- express-validator: rejected (middleware-based)

---

## ADR-006: TanStack Query for Client State

**Status:** Accepted
**Date:** 2026-09

### Decision

Use TanStack Query for server state management.

### Context

- Need caching
- Need background refetch
- Need optimistic updates

### Consequences

+ Automatic caching
+ Background refetch
+ Loading/error states
+ Optimistic updates
- Learning curve
- Query key management

### Alternatives Considered

- Redux: rejected (overkill for server state)
- SWR: considered (simpler but less features)
- React Context: rejected (no caching)

---

## ADR-007: Tailwind CSS

**Status:** Accepted
**Date:** 2026-09

### Decision

Use Tailwind CSS for styling.

### Context

- Need utility-first CSS
- Need design system
- Need dark mode support

### Consequences

+ Rapid prototyping
+ Consistent design tokens
+ Small production CSS
+ Dark mode built-in
- HTML can be verbose
- Learning curve for utilities

### Alternatives Considered

- CSS Modules: rejected (less consistent)
- styled-components: rejected (runtime overhead)
- Sass: rejected (no utility-first)

---

## ADR-008: Separate Upload Directories

**Status:** Accepted
**Date:** 2026-09

### Decision

Public uploads (`/uploads/`) and private uploads (`/uploads-private/`) in separate directories.

### Context

- Thumbnails are public
- Student submissions are private
- Need authorization for private files

### Consequences

+ Clear access control
+ Simple nginx configuration
+ No authorization logic for public files
- Two directories to manage
- More complex backup

### Implementation

```javascript
// Public: thumbnails, profile photos
uploadPath: './uploads'

// Private: student submissions
assignmentUploadPath: './uploads-private/assignments'
```

---

## ADR-009: CKEditor for Rich Text

**Status:** Accepted
**Date:** 2026-09

### Decision

Use CKEditor 5 (Classic build) for lesson content editing.

### Context

- Need WYSIWYG editor
- Need HTML output
- Need YouTube embed support

### Consequences

+ Good rich text features
+ HTML output
+ Image upload support
+ YouTube embed
- Large bundle size
- License considerations
- Content sanitization required

### Security

All HTML output sanitized via `sanitize-html` library.

---

## ADR-010: REST API Convention

**Status:** Accepted
**Date:** 2026-09

### Decision

Use consistent REST API response format.

### Convention

```json
// Success
{
  "success": true,
  "message": "Resource created",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": { ... }
}
```

### Consequences

+ Consistent client handling
+ Easy error checking
+ Good for debugging
- Non-standard (not JSON:API)
- No pagination standard

### Alternatives Considered

- JSON:API: rejected (verbose)
- GraphQL: rejected (too complex)
- Custom: accepted (simpler)

---

## ADR-011: Monorepo Structure

**Status:** Accepted
**Date:** 2026-09

### Decision

Single repository with `client/` and `server/` directories.

### Context

- Small team
- Tightly coupled frontend/backend
- Single deployment target

### Consequences

+ Single clone
+ Shared docs
+ Easy refactoring
- Larger repo size
- No independent deployments

### Alternatives Considered

- Multi-repo: rejected (overhead)
- Turborepo: considered (overkill)
- Nx: considered (overkill)

---

## ADR-012: Docker Compose for Dev

**Status:** Accepted
**Date:** 2026-09

### Decision

Use Docker Compose for local development.

### Context

- Need consistent dev environment
- Need MongoDB
- Need hot reload

### Consequences

+ One command setup
+ Consistent environment
+ Easy onboarding
+ Volume mounts for hot reload
- Docker required
- Slower than native

### Configuration

```yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
  server:
    volumes: [./server:/app]
  client:
    volumes: [./client:/app]
```
