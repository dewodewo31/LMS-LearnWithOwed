# UI/UX Guidelines — LearnWithOwed

---

## 1. Layout Architecture

### Dashboard

```
┌─────────────────────────────────────────────┐
│ TopBar (fixed)                              │
├──────────┬──────────────────────────────────┤
│ Sidebar  │ Content Area                     │
│ (fixed)  │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

- Sidebar: 240px desktop, drawer on mobile
- Content: fluid, max-width container
- TopBar: 64px height, glass effect on scroll

### Landing Page

- Hero: full-width, asymmetric layout
- Sections: varied composition (not uniform grid)
- Container: `min(1200px, calc(100% - 96px))`

---

## 2. Component Library

### UI Components (`client/src/components/ui/`)

| Component | Purpose |
| --------- | ------- |
| Button | Multi-variant button (primary/secondary/ghost/danger) |
| Badge | Status labels |
| Avatar | User photos/initials |
| Modal | Dialog windows |
| Form | Form wrapper with validation |
| Pagination | Page navigation |
| Progress | Progress bars |
| RichTextEditor | CKEditor wrapper |
| StatCard | Dashboard statistics |
| States | Loading/Empty/Error states |

### Feature Components

| Feature | Location |
| ------- | -------- |
| Auth | `features/auth/` |
| Courses | `features/courses/` |
| Lessons | `features/modules/` |
| Students | `features/students/` |
| Assignments | `features/assignments/` |
| Community | `features/community/` |
| Notifications | `features/notifications/` |
| Landing | `features/landing/` |

---

## 3. Navigation Patterns

### Dashboard Routes

| Path | Role | Description |
| ---- | ---- | ----------- |
| `/dashboard` | Admin/Mentor | Overview with stats |
| `/dashboard/courses` | Admin/Mentor | Course list |
| `/dashboard/courses/:id` | Admin/Mentor | Course edit |
| `/dashboard/students` | Admin/Mentor | Student list |
| `/dashboard/enrollments` | Admin/Mentor | Enrollment list |
| `/dashboard/leaderboard` | Public | Rankings |

### Student Routes

| Path | Role | Description |
| ---- | ---- | ----------- |
| `/student` | Student | Dashboard |
| `/student/courses` | Student | My courses |
| `/student/courses/:id` | Student | Course detail |
| `/student/learn/:lessonId` | Student | Lesson player |
| `/student/profile` | Student | Profile edit |

### Public Routes

| Path | Auth | Description |
| ---- | ---- | ----------- |
| `/` | No | Landing page |
| `/modules` | No | All modules |
| `/modules/:slug` | No | Module detail |
| `/leaderboard` | No | Rankings |
| `/login` | No | Login |
| `/register` | No | Register |

---

## 4. State Management

### Server State (TanStack Query)

```javascript
// Query keys follow convention:
['public', 'courses', 'home']      // Landing hero + modules
['public', 'courses', 'all']       // All modules page
['public', 'courses', slug]        // Module detail
['courses']                        // Dashboard course list
['students']                       // Student list
['enrollments']                    // Enrollment list
```

### Local State

- `useState` for UI toggles
- `useReducer` for complex forms
- Context only for: auth, theme

---

## 5. Forms

### Validation

- Zod schemas at component level
- Inline error messages
- Disable submit during processing
- Confirmation for destructive actions

### Error Display

- Field-level: below input
- Form-level: top of form
- Toast: for async operations (sonner)

---

## 6. Loading States

| State | Pattern |
| ----- | ------- |
| Initial load | Skeleton loaders |
| Refetching | Keep existing data, show indicator |
| Submitting | Disable button, show spinner |
| Empty | Message + action button |
| Error | Message + retry button |

---

## 7. Responsive Behavior

### Mobile (< 768px)

- Sidebar becomes hamburger menu
- Tables become card lists
- Multi-column grids stack
- Touch targets: min 44px

### Tablet (768px - 1024px)

- Sidebar collapsible
- 2-column grids
- Adaptive padding

### Desktop (> 1024px)

- Full sidebar
- Multi-column layouts
- Max-width container

---

## 8. Accessibility

- Focus visible on all interactive elements
- Keyboard navigation for all components
- ARIA labels on icon buttons
- Color contrast: WCAG AA minimum
- Reduced motion: respects system preference

---

## 9. Dark Theme

- Default theme: dark
- No light mode toggle (yet)
- Colors optimized for dark backgrounds
- Text: high contrast on dark surfaces
- Borders: subtle opacity-based
