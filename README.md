# LearnWithOwed

Platform LMS (Learning Management System) berbasis MERN stack untuk belajar programming. Enrollment dikontrol sepenuhnya oleh **admin** — student menerima akses course dari administrator, tanpa alur pembelian atau checkout.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS (dark theme, Poppins) |
| Backend | Express.js + MongoDB (Mongoose) |
| Auth | JWT (access + refresh token via cookie) |
| Deployment | Docker + Nginx |

## Fitur

### 👨‍💼 Admin
- Kelola user (admin, mentor, student)
- Kelola course (CRUD, publish, archive)
- Kelola lesson per course (CRUD, reorder)
- Enroll / unenroll student ke course
- Dashboard dengan statistik

### 🎓 Mentor
- Kelola course & lesson
- Jawab pertanyaan di komunitas
- Tandai jawaban verified

### 📚 Student
- Lihat course yang sudah di-enroll (My Courses)
- Belajar per lesson dengan progress tracking
- Tanya jawab di komunitas course
- Notifikasi real-time
- Update profile

## Struktur Project

```text
client/          → React 18 + Vite + Tailwind (responsive mobile + desktop)
server/          → Express API + MongoDB
docs/            → dokumentasi (docs/README.md)
```

## Menjalankan (Development)

Prasyarat: Node.js 18+, MongoDB (`mongod` di port `27017`)

```bash
# 1. Backend
cd server
cp .env.example .env.development
npm install
npm run seed                       # buat akun admin/mentor/student demo
npm run dev                        # API di http://localhost:5000

# 2. Frontend (terminal lain)
cd client
npm install
npm run dev                        # http://localhost:5173 (proxy /api ke :5000)
```

### Akun Demo (Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lms.test` | `admin12345` |
| Mentor | `mentor@lms.test` | `mentor12345` |
| Student | `student@lms.test` | `student12345` |

## Perintah

| Lokasi | Perintah | Fungsi |
| ------ | -------- | ------ |
| `server/` | `npm test` | Integration tests (154 tests) |
| `server/` | `npm run seed` | Seed akun demo |
| `client/` | `npm run build` | Production build |
| `client/` | `npx eslint src` | Lint |

## Deploy (Docker)

```bash
docker compose up -d
```

## Alur Produk

```text
Admin → buat course & lesson → enroll student → student belajar
Student → My Courses → belajar → track progress → selesai
```

Dokumentasi lengkap: [docs/README.md](./docs/README.md)
