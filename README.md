# ✈️ Susi Air Pilot App — Backend API

REST API backend untuk aplikasi pilot Susi Air, dibangun dengan **NestJS 12** (ESM), diamankan menggunakan **OAuth 2.0 Bearer Token** dengan modul keamanan bawaan Node.js (`crypto`).

---

## ⚡ Quick Start

```bash
# 1. Masuk ke direktori project
cd susi_air_pilot_app

# 2. Salin file environment (sesuaikan jika perlu)
cp .env.example .env

# 3. Install dependencies
npm install            # atau: bun install

# 4. Build project
npm run build          # atau: bun run build

# 5. Jalankan server (development)
npm run start:dev      # atau: node dist/main.js

# 6. Buka dokumentasi API interaktif
# http://localhost:3000/docs
```

---

## 🔑 Kredensial Default

| Field    | Value          |
|----------|----------------|
| Username | `johndoe`      |
| Password | `susiairtest`  |

---

## 📖 Dokumentasi

| File | Deskripsi |
|------|-----------|
| [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | Spesifikasi lengkap seluruh endpoint, request/response schema, dan standar keamanan |
| [`CARA_MENGHUBUNGKAN_API.md`](./CARA_MENGHUBUNGKAN_API.md) | Panduan langkah demi langkah menghubungkan frontend (Nuxt 3 / Vue 3) ke backend |
| `/docs` (Swagger UI) | Dokumentasi interaktif OpenAPI yang bisa langsung di-test dari browser |

---

## 🗂️ Struktur Project

```
susi_air_pilot_app/
├── data/                          # Mock JSON datasets
│   ├── mock-documents.json        # Dokumen pilot (license, medical, dll)
│   ├── mock-flight-hours.json     # Data jam terbang harian (521 hari)
│   └── mock-schedules.json        # Jadwal tugas pilot + legend
├── src/
│   ├── auth/                      # Modul autentikasi OAuth 2.0
│   │   ├── auth.controller.ts     # POST /auth/login
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts        # JWT sign/verify dgn Node.js crypto
│   │   └── dto/login.dto.ts       # Validasi input login
│   ├── common/                    # Shared utilities
│   │   ├── clock/                 # ClockService (tanggal UTC, APP_TODAY)
│   │   ├── data-store/            # DataStoreService (in-memory JSON)
│   │   ├── decorators/            # @Public() decorator
│   │   ├── filters/               # AllExceptionsFilter (format error konsisten)
│   │   ├── guards/                # AuthGuard (validasi Bearer token)
│   │   └── interfaces/            # ErrorResponse interface
│   ├── documents/                 # GET /documents
│   ├── flight-hours/              # GET /flight-hours, GET /flight-hours/summary
│   ├── pilot/                     # GET /pilot/me
│   ├── schedules/                 # GET /schedules
│   ├── config/configuration.ts    # Environment config factory
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # GET / dan GET /health
│   └── main.ts                    # Bootstrap + Swagger setup
├── .env.example                   # Template environment variables
├── API_DOCUMENTATION.md           # Dokumentasi API lengkap
├── CARA_MENGHUBUNGKAN_API.md      # Panduan integrasi frontend
└── package.json
```

---

## 🛡️ Fitur Keamanan

- **OAuth 2.0 Bearer Token** — standar industri untuk API authentication
- **HMAC-SHA256 JWT** — signed menggunakan `crypto.createHmac()` bawaan Node.js (tanpa dependency eksternal)
- **Timing-safe comparison** — `crypto.timingSafeEqual()` untuk validasi kredensial dan signature token, mencegah timing attacks
- **Global Auth Guard** — semua endpoint otomatis dilindungi kecuali yang ditandai `@Public()`
- **Input Validation** — `class-validator` + `ValidationPipe` untuk whitelist/forbid unknown fields
- **Consistent Error Format** — `AllExceptionsFilter` menstandarkan semua error response

---

## 📡 Daftar Endpoint

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| `GET` | `/` | Public | Welcome & status |
| `GET` | `/health` | Public | Health check |
| `POST` | `/auth/login` | Public | Login, mendapat Bearer token |
| `GET` | `/pilot/me` | Bearer | Profil pilot |
| `GET` | `/documents` | Bearer | Dokumen pilot + status expiry |
| `GET` | `/flight-hours?from=&to=` | Bearer | Jam terbang harian per range |
| `GET` | `/flight-hours/summary?range=` | Bearer | Rolling sum chart + limit cards |
| `GET` | `/schedules?year=&month=` | Bearer | Jadwal bulanan + legend |

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📝 Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `3000` | Port server |
| `APP_TODAY` | `2026-05-15` | Tanggal acuan "hari ini" untuk perhitungan |
| `JWT_SECRET` | *(lihat .env.example)* | Kunci rahasia untuk signing JWT |
| `JWT_EXPIRES_IN` | `86400` | Masa berlaku token (detik) |
| `CORS_ORIGIN` | `*` | Allowed origins (pisahkan dengan koma) |
| `PILOT_USERNAME` | `johndoe` | Username pilot untuk login |
| `PILOT_PASSWORD` | `susiairtest` | Password pilot untuk login |

---

## 🚀 Deploy ke Vercel

Backend ini di-deploy sebagai **Vercel Serverless Function** (handler di `api/index.ts`), bukan sebagai server tradisional. Ikuti langkah berikut agar build tidak gagal dengan error `No entrypoint found which imports nestjs`.

1. **Framework Preset harus `Other`** — JANGAN gunakan preset `Nest.js`.
   - Dashboard Vercel → project → **Settings → Framework Preset → `Other`** (atau lewat CLI: `vercel project update susiAirPilotBackend --framework other`).
   - Penyebab: detector `@vercel/nest` hanya mengenali pola CommonJS dan akan gagal pada project ESM (`"type": "module"`) seperti ini. Preset `Other` memaksa Vercel pakai builder Node.js generik (`@vercel/node`) yang menjalankan handler `api/index.ts`.
2. **Build Command**: `npm run build` (sudah diatur di `vercel.json`).
3. **Konfigurasi** (`vercel.json`):
   - `functions.api/index.ts.includeFiles`: `"data/**"` — agar file mock JSON ikut terbundel ke dalam function.
   - `rewrites`: semua path `/...` diteruskan ke `/api` agar endpoint (`/auth/login`, `/pilot/me`, `/docs`, dll.) tetap bisa diakses di root domain.
4. **Redeploy** setelah mengubah preset: buka **Deployments → Redeploy** (push saja tidak selalu memicu rebuild saat preset lama masih aktif).
5. **Verifikasi**: Build Logs baris atas harus menyebut `@vercel/node`, BUKAN `@vercel/nest`. Lalu tes `POST https://<domain>/auth/login` — harus balas token `200`.

> Catatan: `src/main.ts` hanya untuk dev lokal (`npm run start:dev`). Di Vercel, request ditangani oleh `api/index.ts` melalui `app.getHttpAdapter().getInstance()`.

---

## 👨‍💻 Developer

Dikembangkan oleh **Wahyu Sahri Rhamadhan**

🌐 https://www.wahyusahrirhamadhan.web.id/
