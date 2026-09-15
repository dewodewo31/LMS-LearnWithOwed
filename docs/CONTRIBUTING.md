# Contributing — LearnWithOwed

---

## 1. Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7 (or Docker)
- Git

### Setup

```bash
git clone https://github.com/your-org/LMS-LearnWithOwed.git
cd LMS-LearnWithOwed
docker compose up
```

---

## 2. Development Workflow

### 1. Create Branch

```bash
git checkout -b feature/your-feature
# or
git checkout -b fix/your-bugfix
```

### 2. Make Changes

- Backend: `server/src/`
- Frontend: `client/src/`
- Docs: `docs/`

### 3. Test

```bash
# Backend
cd server && npm test

# Frontend lint
cd client && npx oxlint src

# Build
cd client && npm run build
```

### 4. Commit

```bash
git add .
git commit -m "feat: add course enrollment"
```

### 5. Push

```bash
git push origin feature/your-feature
```

### 6. Create PR

- Fill PR template
- Link related issues
- Request review

---

## 3. Branch Naming

| Prefix | Purpose |
| ------ | ------- |
| `feature/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `refactor/` | Code refactoring |
| `test/` | Adding tests |
| `chore/` | Maintenance |

---

## 4. Commit Messages

### Format

```
type(scope): description
```

### Types

| Type | Description |
| ---- | ----------- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code style (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance |

### Examples

```
feat: add course enrollment endpoint
fix: resolve duplicate email validation
docs: update API documentation
refactor: simplify auth middleware
test: add assignment grading tests
chore: update dependencies
```

---

## 5. Code Style

### Backend (Node.js)

- Use `const` by default
- Destructure when possible
- No semicolons (if using StandardJS)
- 2-space indentation

### Frontend (React)

- Functional components only
- Hooks for state/side effects
- Destructure props
- Named exports preferred

### Files

- kebab-case for files: `user.controller.js`
- PascalCase for components: `CourseCard.jsx`
- camelCase for utilities: `formatDate.js`

---

## 6. Testing

### Backend Tests

```bash
cd server
npm test                    # All tests
npx jest tests/auth.test.js # Specific file
npm run test:watch          # Watch mode
```

### Frontend Lint

```bash
cd client
npx oxlint src              # Lint
npx oxlint src --fix        # Auto-fix
```

### Coverage Goals

- Critical paths: 80%+
- Utils: 90%+
- Controllers: 70%+

---

## 7. Documentation

### When to Update Docs

- New feature → update relevant doc
- API change → update API.md
- New decision → update DECISIONS.md
- New term → update GLOSSARY.md

### Doc Files

| File | When |
| ---- | ---- |
| README.md | Project overview changes |
| ARCHITECTURE.md | Structure changes |
| API.md | Endpoint changes |
| SECURITY.md | Security changes |
| DEVELOPMENT.md | Workflow changes |
| BUSINESS-RULES.md | Business logic changes |

---

## 8. Pull Request Process

### Before Submitting

- [ ] Tests pass
- [ ] Lint passes
- [ ] Build succeeds
- [ ] No console.log in code
- [ ] No secrets in code
- [ ] Docs updated (if applicable)

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

### Review Process

1. Assign reviewer
2. Address feedback
3. Get approval
4. Merge (squash or rebase)

---

## 9. Issue Reporting

### Bug Report

```markdown
**Describe the bug**
Clear description.

**To reproduce**
Steps to reproduce.

**Expected behavior**
What should happen.

**Screenshots**
If applicable.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node: [e.g., 20.10]
```

### Feature Request

```markdown
**Is your feature request related to a problem?**
Clear description.

**Describe the solution**
What you want.

**Describe alternatives**
Other solutions considered.

**Additional context**
Mockups, examples, etc.
```

---

## 10. Code of Conduct

- Be respectful
- Be constructive
- Be patient
- Be inclusive

---

## 11. Questions?

- Open an issue
- Start a discussion
- Reach out to maintainers
