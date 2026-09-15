# Design System — LearnWithOwed

**Stack:** React 18 + Vite + Tailwind CSS
**Fonts:** Poppins (dashboard), Manrope (landing), DM Mono (monospace)
**Theme:** Dark (dashboard), Dark glassmorphism (landing)

---

## 1. Color Tokens

### Dashboard (Legacy)

| Token | Value | Usage |
| ----- | ----- | ----- |
| `navy` | `#05051E` | Background |
| `surface` | `#15162F` | Cards, inputs |
| `surface-hover` | `#202143` | Hover state |
| `edge` | `#292A45` | Borders |
| `ink` | `#FFFFFF` | Primary text |
| `ink-soft` | `#D5D6E3` | Secondary text |
| `ink-muted` | `#85889F` | Muted text |
| `primary-500` | `#8B5CF6` | Primary accent |
| `primary-600` | `#7C3AED` | Primary dark |

### Landing Page

| Token | Value | Usage |
| ----- | ----- | ----- |
| `lp-bg` | `#08090d` | Background |
| `lp-bg-soft` | `#0d0f15` | Section alt |
| `lp-card` | `#11131a` | Cards |
| `lp-text` | `#f5f5f7` | Primary text |
| `lp-muted` | `#8b8f9a` | Secondary text |
| `lp-border` | `rgba(255,255,255,0.09)` | Borders |
| `lp-accent` | `#a78bfa` | Accent purple |
| `lp-green` | `#6ee7b7` | Success |

---

## 2. Typography

### Fonts

| Font | Weight | Usage |
| ---- | ------ | ----- |
| Poppins | 400-800 | Dashboard body, headings |
| Manrope | 400-800 | Landing page |
| DM Mono | 400-500 | Monospace (logo, code) |

### Scale

| Element | Size | Weight |
| ------- | ---- | ------ |
| H1 | clamp(40px, 7vw, 88px) | 800 |
| H2 | clamp(28px, 4vw, 44px) | 700 |
| H3 | 18-20px | 700 |
| Body | 14-16px | 400-500 |
| Small | 11-12px | 500-600 |

---

## 3. Spacing Scale

| Token | Value |
| ----- | ----- |
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| section | 120px (desktop), 80px (mobile) |

---

## 4. Border Radius

| Token | Value | Usage |
| ----- | ----- | ----- |
| none | 0 | Sharp edges |
| sm | 8px | Buttons, small elements |
| DEFAULT | 12px | Default |
| lg | 16px | Cards |
| xl | 20px | Large cards |
| 2xl | 24px | Modals |
| full | 9999px | Pills (buttons only) |

---

## 5. Shadows

| Token | Value | Usage |
| ----- | ----- | ----- |
| sm | `0 1px 2px 0 rgb(0 0 0 / 0.3)` | Subtle |
| DEFAULT | `0 2px 8px 0 rgb(0 0 0 / 0.25)` | Cards |
| lg | `0 12px 32px -8px rgb(0 0 0 / 0.4)` | Elevated |

---

## 6. Component Patterns

### Buttons

- Primary: `bg-primary-600 text-white hover:bg-primary-500`
- Secondary: `bg-surface text-ink-soft border border-edge`
- Ghost: `text-ink-soft hover:bg-surface-hover`
- Danger: `bg-[#EF4444] text-white`
- All buttons: `min-h-[44px]` (tap target), `rounded-full`

### Cards

- Background: `bg-lp-card` or `bg-surface`
- Border: `border-lp-border` or `border-edge`
- Hover: border-color change only (no translateY)
- Radius: `rounded-2xl` (16px)

### Forms

- Input: `bg-surface border-edge text-ink`
- Focus: `outline-primary-500`
- Error: `border-[#EF4444]`

---

## 7. Animations

- Scroll reveal: `opacity 0.5s ease-out`, `transform 20px`
- Transitions: `transition-colors duration-150`
- No perpetual animations (cursor glow removed)
- Reduced motion: respects `prefers-reduced-motion`

---

## 8. Breakpoints

| Name | Width |
| ---- | ----- |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |

Mobile-first approach. Dashboard sidebar becomes drawer on mobile.
