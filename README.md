# KN-LMS — Koding Next Samarinda LMS

LMS berbasis MERN dengan **enrollment yang sepenuhnya dikontrol Admin** — student menerima akses course dari administrator, tanpa alur pembelian/checkout.

## Struktur

```text
docs/     — dokumentasi (mulai dari docs/README.md)
server/   — Express API + MongoDB
client/   — React 18 + Vite + Tailwind (dark theme, Poppins, responsive mobile + desktop)
```

## Menjalankan (Development)

Prasyarat: Node.js 18+, MongoDB lokal (`mongod` berjalan di `:27017`).

```bash
# 1. Backend
cd server
cp .env.example .env.development   # sudah tersedia nilai default lokal
npm install
npm run seed                       # buat akun admin/mentor/student demo
npm run dev                        # API di http://localhost:5000

# 2. Frontend (terminal lain)
cd client
npm install
npm run dev                        # http://localhost:5173 (proxy /api ke :5000)
```

Akun seed (dev): `admin@lms.test / admin12345` · `mentor@lms.test / mentor12345` · `student@lms.test / student12345`

## Perintah

| Lokasi | Perintah | Fungsi |
| ------ | -------- | ------ |
| `server/` | `npm test` | Integration tests (99 tests, auth/RBAC/enrollment/progress) |
| `server/` | `npm run seed` | Seed akun demo |
| `client/` | `npm run build` | Production build |
| `client/` | `npx eslint src` | Lint |

## Alur Produk

```text
Admin → kelola course & lesson → kelola student → Enroll Student (grant access)
Student → My Courses → belajar → track progress → course completion
```

Dokumentasi lengkap: [docs/README.md](./docs/README.md)
