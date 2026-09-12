# Dokumentasi

Dokumentasi teknis platform LearnWithOwed.

## Alur Discover Modul (Public)

```text
Landing (/)                All Modules (/modules)         Detail (/modules/:slug)
4 modul acak        →      6 modul + Load More (+6)  →    Tentang, Poin, Prasyarat,
"Lihat Semua Modul"        spinner, end-of-list           Materi (syllabus)
```

Ketiga halaman public (tanpa autentikasi) bersumber dari endpoint yang sama dengan
data admin — tidak ada data modul yang di-hardcode di frontend.

## Public API

Semua di bawah `GET /api/v1/public/...`, tanpa auth, hanya course
`status: 'published'` dan `isDeleted: false`.

### GET /public/courses/random?limit=4

Satu agregasi MongoDB (`$facet`): `$sample` N course acak + statistik eksak
seluruh dataset published. Dipakai landing (4 card + angka hero) dalam SATU
request. Limit di-clamp 1–8. Setiap refresh menghasilkan set acak baru.

```json
{
  "data": {
    "courses": [ { "id", "title", "slug", "shortDescription", "thumbnail",
      "category", "level", "language", "totalLessons", "publishedAt" } ],
    "stats": { "totalCourses": 13, "totalLessons": 34, "categories": 8 }
  }
}
```

### GET /public/courses?page=&limit=

Listing paginasi untuk All Modules (frontend memakai `limit=6`).
`meta: { page, limit, total, totalPages }` — `hasNextPage` diturunkan dari
`page < totalPages`. Sort: `publishedAt` desc. Load More meng-APPEND halaman
berikutnya; frontend mencegah duplikat via `Set` berisi `course.id`.

### GET /public/courses/:slug

Detail modul (slug, bukan id — slug sudah ada di schema). SATU endpoint
mengembalikan course + syllabus (tanpa N+1):

```json
{
  "data": {
    "course": { "id", "title", "slug", "shortDescription", "description",
      "thumbnail", "category", "level", "language", "totalLessons",
      "publishedAt", "requirements": [], "learningObjectives": [] },
    "lessons": [ { "id", "title", "order", "contentType", "duration" } ]
  }
}
```

404 bila slug tidak ada, course draft/archived, atau soft-deleted.

### Aturan Publikasi

Course baru **tidak otomatis** muncul di halaman public. Admin harus:

1. Membuat course dengan `title`, `description`, dan `thumbnail`.
2. Menambahkan minimal 1 lesson.
3. Memanggil `POST /api/v1/courses/:id/publish`.

### Aturan ekspos data (security)

- Field course yang **tidak** diekspos: `mentor`, `price` (legacy, tak pernah
  dipakai UI), `status`, `isDeleted`.
- Lesson yang tampil di syllabus: **metadata saja** (`order`, `title`,
  `contentType`, `duration`), hanya `isPublished: true`, sort `order: 1`.
  Konten (`textContent`, `youtubeUrl`, `youtubeVideoId`) tetap di balik auth —
  disajikan per-lesson via endpoint terproteksi (docs/SECURITY.md §5).
- `description` adalah HTML tersanitasi **saat write** (server
  `utils/sanitizeHtml.js` — strip script/iframe/event handler/javascript: URL).
  Client merender via `dangerouslySetInnerHTML` mengikuti strategi sanitasi
  proyek yang sudah ada (sama dengan CourseManagePage/LearnPage).
- Tidak ada rating/review di API — LMS belum punya model Review; detail page
  tidak menampilkan section reviews (tidak ada data fiktif).

## Pemetaan Section Detail ↔ Schema

| Section UI | Sumber data |
|------------|-------------|
| Tentang Modul | `course.description` (HTML tersanitasi) |
| Poin Pembelajaran | `course.learningObjectives[]` |
| Prasyarat | `course.requirements[]` |
| Materi Pembelajaran | `Lesson` (published, `order` asc) |
| Tools / Sneak Peek / Reviews / Designed For | **Tidak ada field-nya di schema** → section disembunyikan, tidak pernah dikarang |

Navigasi anchor sticky (Tentang / Poin / Prasyarat / Materi) hanya menampilkan
section yang datanya ada; section memakai `scroll-margin-top` agar tidak
tertutup top bar.

## Aturan Enrollment

Enrollment dikontrol penuh oleh admin. Tidak ada pembelian/checkout/self-enroll.
CTA di detail: anonim → `/login`; student → `/student`; admin/mentor →
`/dashboard`. Akses isi modul tetap lewat alur enrollment yang sudah ada.

## Catatan Frontend

- Hook publik: `client/src/features/modules/hooks.js` — `useHomeModules`
  (random+stats), `useAllModules` (useInfiniteQuery + dedupe by id),
  `useModuleDetail` (retry di-skip untuk 404).
- Card modul: `features/modules/ModuleCard.jsx` — satu komponen untuk landing
  dan All Modules; seluruh card adalah Link ke `/modules/:slug`.
- Jangan tambahkan class `lp-reveal` pada card yang dirender async (observer
  reveal di LandingPage berjalan sekali saat mount).
- Cache: query key `['public','courses','home']` dibagi Hero + section Modul
  (satu request); `staleTime` default sehingga refresh halaman menarik set
  acak baru. All Modules dan Detail stabil per paginasi/slug.

## Testing

- Server: `cd server && npm test` — suite `public-courses.test.js` mencakup
  listing publik, random (filter/limit/stats), detail (field privat, urutan
  lesson, lesson draft disembunyikan, sanitasi end-to-end, 404).
- Client: `npx oxlint client/src`, `npm run build --prefix client`.
- Verifikasi manual: refresh landing (set acak berubah), Load More
  (6→12→…→habis + pesan akhir), overflow horizontal 320–1920px di ketiga
  halaman, detail slug tak dikenal (404 state).
