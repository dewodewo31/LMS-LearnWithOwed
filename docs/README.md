Dokumentasi

Dokumentasi teknis platform LearnWithOwed.
Alur Discover Modul (Public)

Landing (/)                All Modules (/modules)         Detail (/modules/:slug)
4 modul acak        →      6 modul + Load More (+6)  →    Tentang, Poin, Prasyarat,
"Lihat Semua Modul"        spinner, end-of-list           Materi (syllabus)

Ketiga halaman public (tanpa autentikasi) bersumber dari endpoint yang sama dengan data admin — tidak ada data modul yang di-hardcode di frontend.
Leaderboard

Halaman public /leaderboard menampilkan papan peringkat peserta berdasarkan dua metrik: jumlah lesson yang diselesaikan dan jumlah modul yang diikuti.

Papan Peringkat (/leaderboard)
  ├── Most Lessons Learned (default)
  └── Most Modules Enrolled

Ranking dihitung di backend via MongoDB aggregation — tidak ada data yang di-hardcode di frontend. Hanya menampilkan field publik: displayName, avatar, rank, value. Email, phone, dan data privat tidak diekspos.
Assignment (Tugas Koding)

Lesson bertipe assignment (tipe lesson: text | video | assignment) membawa satu assignment — workflow ala Google Classroom untuk kelas coding, tanpa payment/self-enrollment dan tanpa eksekusi kode (LMS hanya mendistribusikan & mengumpulkan file).
Model data

Assignment            (1 per lesson — unique lessonId)
  lessonId, courseId, title, instructions (HTML tersanitasi), deadline,
  attachments[] {originalName, storedName(uuid+ext), mimeType, size},
  assessmentCriteria[] {name, description}, status (draft|published), createdBy

AssignmentSubmission  (1 per student per assignment — unique; resubmit = versi baru)
  assignmentId, studentId, version, attachments[], note, status
  (submitted|reviewed|returned), isLate, submittedAt,
  history[] (snapshot versi lama incl. assessment-nya),
  assessment {teacherId, criteria[] {name, grade, feedback}, overallFeedback, gradedAt}

    Skala grade: A+, A, B+, B — konstanta Assignment.GRADES (server, sumber kebenaran) disalin ke client/src/features/assignments/constants.js hanya untuk render opsi.
    Late: submission setelah deadline → isLate: true; late TIDAK diblokir.
    Resubmit: versi saat ini di-snapshot ke history (termasuk assessment yang berlaku padanya), version +1, status kembali submitted.
    Grading: criteria pada assessment wajib cover persis semua assessmentCriteria assignment (nama harus sama) — snapshot saat dinilai, rename kriteria belakangan tidak merusak riwayat.

API (semua di bawah /api/v1/assignments, authenticate wajib)
Method & path 	Role 	Catatan
POST /lessons/:lessonId/assignment 	admin/mentor 	lesson harus bertipe assignment; 409 jika sudah ada
GET  /lessons/:lessonId/assignment 	admin/mentor 	lookup editor; assignment: null bila belum dibuat
GET  /:id 	admin/mentor/student 	student: wajib enrolled + published; mengembalikan mySubmission miliknya
PATCH /:id 	admin/mentor 	update field/kriteria/status; draft→publish menotifikasi student ter-enroll
DELETE /:id 	admin/mentor 	soft delete (submission disimpan untuk audit)
POST /:id/attachments 	admin/mentor 	multipart files[] (maks 5, 10 MB/file)
DELETE /:id/attachments/:fileId 	admin/mentor 	hapus lampiran
GET  /:id/files/:fileId 	admin/mentor/student enrolled 	unduh file teacher
POST /:id/submissions 	student 	multipart files[] + note; versi baru jika resubmit; menotifikasi mentor
GET  /:id/submissions 	admin/mentor 	roster student ter-enroll + submission terakhir masing-masing (tanpa N+1)
GET  /submissions/:submissionId 	admin/mentor/owner 	detail submission + student (staff) + assignment
GET  /submissions/:submissionId/files/:fileId 	admin/mentor/owner 	unduh file submission (termasuk file versi history)
PATCH /submissions/:submissionId/assessment 	admin/mentor 	simpan grade+feedback per kriteria + overall feedback; menotifikasi student
Keamanan file

    Allowlist ekstensi (server middleware/upload.js): .lua .js .jsx .ts .tsx .py .php .html .css .json .zip .txt .md .java .c .cpp .cs .rb .go .sql .xml .yml .yaml — MIME kode tidak reliable, jadi allowlist ekstensi adalah boundary; file disimpan, tidak pernah dieksekusi.
    Maks 10 MB/file, maks 5 file per upload, maks 10 lampiran per assignment.
    Nama storage = uuid + ext (originalName hanya untuk display/download) — path traversal mustahil; storedName tervalidasi regex saat download.
    File assignment disimpan di uploads-private/assignments/ di LUAR root statis /uploads — satu-satunya jalur adalah endpoint download terautentikasi dengan authorization (student hanya file miliknya; mentor hanya course-nya, via canManageCourse).

Notifikasi

Menggunakan infrastruktur Notification yang ada, tipe baru: ASSIGNMENT_PUBLISHED (publish → semua student ter-enroll), ASSIGNMENT_SUBMITTED (student → mentor course), ASSIGNMENT_GRADED (mentor → student). Dedup index diperluas dengan assignmentId agar notifikasi antar-assignment/versi tidak saling menelan.
Frontend
Route 	Role 	File
/dashboard/lessons/:lessonId/assignment 	admin/mentor 	editor (judul, instruksi rich text, deadline, kriteria add/remove/reorder, file, publish) + tabel submissions (tabel di desktop, card di mobile)
/dashboard/assignments/submissions/:submissionId 	admin/mentor 	review submission + form grading per kriteria + overall feedback
/student/assignments/:assignmentId 	student 	instruksi, file teacher (unduh), upload/resubmit + catatan, riwayat versi, hasil penilaian

Integrasi: LearnPage menampilkan card "Buka Assignment" untuk lesson bertipe assignment (GET /lessons/:lessonId/content mengembalikan assignmentId hanya untuk lesson tipe ini). CourseManagePage menambah opsi "Assignment" pada tipe lesson + link "Kelola Assignment".
Testing

server/tests/assignments.test.js — 29 test: CRUD + sanitasi instruksi, authz mentor lain, duplikat 409, upload/hapus/unduh file, ekstensi ditolak, traversal 404, akses student (enrolled/draft/unenrolled), submit + notifikasi, wajib ≥1 file, late flag, resubmit versi + history, isolasi antar-student (403 detail & file), grading lengkap + notifikasi, grading tidak cover kriteria 422, grade invalid 422, student tidak bisa grade, minimalsasi field student.
Keterbatasan yang disengaja

    Tidak ada code execution/sandbox/plagiarisme/AI grading (sesuai batasan fitur).
    Deadline memakai jam server; klien dan server di TZ berbeda bisa melenceng hingga selisih zona waktu (catat bila deploy multi-region).
    Tidak ada status draft submission (upload langsung = submit); status returned tersedia di skema namun belum dipakai UI.
    Menghapus lesson meng-soft-delete assignment-nya (submission tetap untuk audit).

Public API

Semua di bawah GET /api/v1/public/..., tanpa auth, hanya course status: 'published' dan isDeleted: false.
GET /public/courses/random?limit=4

Satu agregasi MongoDB ($facet): $sample N course acak + statistik eksak seluruh dataset published. Dipakai landing (4 card + angka hero) dalam SATU request. Limit di-clamp 1–8. Setiap refresh menghasilkan set acak baru.

{
  "data": {
    "courses": [ { "id", "title", "slug", "shortDescription", "thumbnail",
      "category", "level", "language", "totalLessons", "publishedAt" } ],
    "stats": { "totalCourses": 13, "totalLessons": 34, "categories": 8 }
  }
}

GET /public/courses?page=&limit=

Listing paginasi untuk All Modules (frontend memakai limit=6). meta: { page, limit, total, totalPages } — hasNextPage diturunkan dari page < totalPages. Sort: publishedAt desc. Load More meng-APPEND halaman berikutnya; frontend mencegah duplikat via Set berisi course.id.
GET /public/courses/:slug

Detail modul (slug, bukan id — slug sudah ada di schema). SATU endpoint mengembalikan course + syllabus (tanpa N+1):

{
  "data": {
    "course": { "id", "title", "slug", "shortDescription", "description",
      "thumbnail", "category", "level", "language", "totalLessons",
      "publishedAt", "requirements": [], "learningObjectives": [] },
    "lessons": [ { "id", "title", "order", "contentType", "duration" } ]
  }
}

404 bila slug tidak ada, course draft/archived, atau soft-deleted.
GET /public/leaderboard/lessons?limit=10

Ranking peserta berdasarkan jumlah lesson yang diselesaikan (LessonProgress.status: 'completed'). Aggregation: $match → $group by studentId → $lookup User → sort by value DESC, name ASC. Limit di-clamp 1–50, default 10. Tie breaker: nama ASC (deterministic).

{
  "data": [
    { "rank": 1, "student": { "id": "...", "displayName": "Andi", "avatar": "..." }, "value": 87 },
    { "rank": 2, "student": { "id": "...", "displayName": "Budi", "avatar": "..." }, "value": 74 }
  ]
}

GET /public/leaderboard/modules?limit=10

Ranking peserta berdasarkan jumlah modul yang diikuti (Enrollment.status: active|completed). Menghitung COUNT(DISTINCT courseId) per student. Tie breaker: nama ASC.

{
  "data": [
    { "rank": 1, "student": { "id": "...", "displayName": "Andi", "avatar": "..." }, "value": 12 },
    { "rank": 2, "student": { "id": "...", "displayName": "Budi", "avatar": "..." }, "value": 10 }
  ]
}

Aturan Publikasi

Course baru tidak otomatis muncul di halaman public. Admin harus:

    Membuat course dengan title, description, dan thumbnail.
    Menambahkan minimal 1 lesson.
    Memanggil POST /api/v1/courses/:id/publish.

Aturan ekspos data (security)

    Field course yang tidak diekspos: mentor, price (legacy, tak pernah dipakai UI), status, isDeleted.
    Lesson yang tampil di syllabus: metadata saja (order, title, contentType, duration), hanya isPublished: true, sort order: 1. Konten (textContent, youtubeUrl, youtubeVideoId) tetap di balik auth — disajikan per-lesson via endpoint terproteksi (docs/SECURITY.md §5).
    description adalah HTML tersanitasi saat write (server utils/sanitizeHtml.js — strip script/iframe/event handler/javascript: URL). Client merender via dangerouslySetInnerHTML mengikuti strategi sanitasi proyek yang sudah ada (sama dengan CourseManagePage/LearnPage).
    Tidak ada rating/review di API — LMS belum punya model Review; detail page tidak menampilkan section reviews (tidak ada data fiktif).

Pemetaan Section Detail ↔ Schema
Section UI 	Sumber data
Tentang Modul 	course.description (HTML tersanitasi)
Poin Pembelajaran 	course.learningObjectives[]
Prasyarat 	course.requirements[]
Materi Pembelajaran 	Lesson (published, order asc)
Tools / Sneak Peek / Reviews / Designed For 	Tidak ada field-nya di schema → section disembunyikan, tidak pernah dikarang

Navigasi anchor sticky (Tentang / Poin / Prasyarat / Materi) hanya menampilkan section yang datanya ada; section memakai scroll-margin-top agar tidak tertutup top bar.
Aturan Enrollment

Enrollment dikontrol penuh oleh admin. Tidak ada pembelian/checkout/self-enroll. CTA di detail: anonim → /login; student → /student; admin/mentor → /dashboard. Akses isi modul tetap lewat alur enrollment yang sudah ada.
Catatan Frontend

    Hook publik: client/src/features/modules/hooks.js — useHomeModules (random+stats), useAllModules (useInfiniteQuery + dedupe by id), useModuleDetail (retry di-skip untuk 404).
    Card modul: features/modules/ModuleCard.jsx — satu komponen untuk landing dan All Modules; seluruh card adalah Link ke /modules/:slug.
    Jangan tambahkan class lp-reveal pada card yang dirender async (observer reveal di LandingPage berjalan sekali saat mount).
    Cache: query key ['public','courses','home'] dibagi Hero + section Modul (satu request); staleTime default sehingga refresh halaman menarik set acak baru. All Modules dan Detail stabil per paginasi/slug.

Testing

    Server: cd server && npm test — suite public-courses.test.js mencakup listing publik, random (filter/limit/stats), detail (field privat, urutan lesson, lesson draft disembunyikan, sanitasi end-to-end, 404).
    Client: npx oxlint client/src, npm run build --prefix client.
    Verifikasi manual: refresh landing (set acak berubah), Load More (6→12→…→habis + pesan akhir), overflow horizontal 320–1920px di ketiga halaman, detail slug tak dikenal (404 state).
