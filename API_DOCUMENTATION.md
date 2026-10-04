# 📖 Dokumentasi Lengkap REST API: Susi Air Pilot App

Dokumentasi ini menjelaskan seluruh endpoint, spesifikasi autentikasi OAuth 2.0 Bearer Token, skema request/response, penanganan error, serta mekanisme keamanan menggunakan modul bawaan (`built-in`) Node.js.

---

## 🛡️ 1. Standar Keamanan & Autentikasi (OAuth 2.0)

Aplikasi ini menggunakan standar **OAuth 2.0 Bearer Token** (RFC 6749 & RFC 7519) dengan memanfaatkan modul keamanan bawaan Node.js (`crypto`):

1. **Anti Timing Attack**: Autentikasi kredensial pilot menggunakan `crypto.timingSafeEqual` untuk mencegah kebocoran informasi waktu respons.
2. **Kriptografi HMAC-SHA256**: Token JWT ditandatangani menggunakan algoritma standar `HS256` dengan kunci rahasia (`JWT_SECRET`) tanpa bergantung pada modul eksternal yang rentan.
3. **Verifikasi Token Konstan**: Verifikasi signature token juga memvalidasi buffer tanda tangan dengan `crypto.timingSafeEqual`.
4. **Global Auth Guard**: Seluruh endpoint (kecuali endpoint publik seperti `/auth/login`, `/health`, dan `/docs`) secara otomatis dilindungi oleh Guard. Token harus dikirimkan pada header HTTP:
   ```http
   Authorization: Bearer <ACCESS_TOKEN>
   ```

---

## 🌐 2. Base URL & Dokumentasi Interaktif

- **Base URL**: `http://localhost:3000` (atau URL server deployment)
- **Swagger OpenAPI Docs**: `http://localhost:3000/docs`
- **Kredensial Default**:
  - Username: `johndoe`
  - Password: `susiairtest`
- **Konfigurasi Tanggal Acuan ("Today")**: `2026-05-15` (dikelola oleh `ClockService`)

---

## 📌 3. Standar Bentuk Respons Error

Semua exception menghasilkan format respons error yang konsisten di seluruh aplikasi:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid username or password",
  "path": "/auth/login",
  "timestamp": "2026-05-15T00:00:00.000Z"
}
```

> **Catatan untuk Validasi (400 Bad Request)**: `message` dapat berupa array string (daftar validasi yang gagal) atau string tunggal.

---

## 🚀 4. Daftar Endpoint

### 4.1. Autentikasi: Login Pilot

Memvalidasi username & password pilot, lalu menerbitkan OAuth 2.0 Bearer access token.

- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth**: Public (Tanpa Token)
- **Request Headers**:
  - `Content-Type: application/json`

#### Request Body:
```json
{
  "username": "johndoe",
  "password": "susiairtest"
}
```

#### Respons Sukses (200 OK):
Format respons mendukung format internal dan standar OAuth 2.0:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

#### Respons Gagal (401 Unauthorized):
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid username or password",
  "path": "/auth/login",
  "timestamp": "2026-05-15T00:00:00.000Z"
}
```

---

### 4.2. Pilot: Profil Saya

Mengambil profil pilot yang sedang login.

- **Method**: `GET`
- **Path**: `/pilot/me`
- **Auth**: Wajib (`Bearer <token>`)

#### Respons Sukses (200 OK):
```json
{
  "name": "John Doe",
  "totalFlightHours": 1444.5,
  "avatarUrl": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=256&q=80"
}
```

---

### 4.3. Flight Hours: Ringkasan Jam Terbang & Trend Chart

Menghitung deret angka rolling sum untuk chart (15 titik) dan 4 kartu ringkasan limit regulasi penerbangan. Perhitungan rolling sum dilakukan sepenuhnya di sisi server menggunakan method `rollingWindowBluffing()`.

- **Method**: `GET`
- **Path**: `/flight-hours/summary`
- **Auth**: Wajib (`Bearer <token>`)
- **Query Parameters**:
  - `range` (*string, required*): Pilihan rentang rolling window: `1w`, `1m`, `3m`, `6m`, atau `1y`.

#### Contoh Request:
```http
GET /flight-hours/summary?range=1w HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>
```

#### Respons Sukses (200 OK):
```json
{
  "range": "1w",
  "windowDays": 7,
  "limit": 40,
  "yMax": 45,
  "today": "2026-05-15",
  "series": [
    {
      "date": "2026-05-08",
      "hours": 5.2,
      "rollingSum": 15.0,
      "isToday": false,
      "isFuture": false,
      "partialWindow": false,
      "overLimit": false
    },
    {
      "date": "2026-05-15",
      "hours": 6.4,
      "rollingSum": 25.2,
      "isToday": true,
      "isFuture": false,
      "partialWindow": false,
      "overLimit": false
    },
    {
      "date": "2026-05-18",
      "hours": 6.4,
      "rollingSum": 42.8,
      "isToday": false,
      "isFuture": true,
      "partialWindow": false,
      "overLimit": true
    }
  ],
  "cards": [
    {
      "key": "daily",
      "label": "Daily",
      "windowDays": 1,
      "hours": 6.4,
      "limit": 8,
      "percent": 80.0,
      "overLimit": false
    },
    {
      "key": "weekly",
      "label": "Weekly",
      "windowDays": 7,
      "hours": 25.2,
      "limit": 40,
      "percent": 63.0,
      "overLimit": false
    },
    {
      "key": "monthly",
      "label": "Monthly",
      "windowDays": 30,
      "hours": 87.2,
      "limit": 100,
      "percent": 87.2,
      "overLimit": false
    },
    {
      "key": "annual",
      "label": "Annual",
      "windowDays": 365,
      "hours": 1013.8,
      "limit": 1050,
      "percent": 96.6,
      "overLimit": false
    }
  ]
}
```

#### Nilai Acuan Spesifikasi (Reference Benchmark pada Today = 15 Mei 2026):
| Kartu | Window | Hours | Limit | Persentase |
|---|---|---|---|---|
| Daily | 1 hari (15 Mei) | **6.4** | 8 | 80.0% |
| Weekly | 7 hari | **25.2** | 40 | 63.0% |
| Monthly | 30 hari | **87.2** | 100 | 87.2% |
| Annual | 365 hari | **1013.8** | 1050 | 96.6% |

- Titik pada `series` selalu berjumlah **15 tanggal**: `today - 7` sampai `today + 7`, dengan `today` tepat berada di indeks ke-7 (tengah).
- `isFuture`: bernilai `true` untuk tanggal setelah hari ini.
- `overLimit`: bernilai `true` jika `rollingSum > limit`.
- `partialWindow`: bernilai `true` bila jendela perhitungan menjangkau sebelum awal dataset (27 Des 2024).

---

### 4.4. Flight Hours: Riwayat Harian

Mengambil jam terbang per hari dalam rentang tanggal kalender tertentu. Hari tanpa penerbangan otomatis bernilai `0`.

- **Method**: `GET`
- **Path**: `/flight-hours`
- **Auth**: Wajib (`Bearer <token>`)
- **Query Parameters**:
  - `from` (*string, YYYY-MM-DD, required*): Tanggal awal.
  - `to` (*string, YYYY-MM-DD, required*): Tanggal akhir (`from <= to`, maksimal 400 hari).

#### Contoh Request:
```http
GET /flight-hours?from=2026-05-01&to=2026-05-05 HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>
```

#### Respons Sukses (200 OK):
```json
{
  "from": "2026-05-01",
  "to": "2026-05-05",
  "items": [
    { "date": "2026-05-01", "hours": 3.8 },
    { "date": "2026-05-02", "hours": 0.0 },
    { "date": "2026-05-03", "hours": 0.0 },
    { "date": "2026-05-04", "hours": 4.0 },
    { "date": "2026-05-05", "hours": 0.9 }
  ]
}
```

---

### 4.5. Documents: Daftar Dokumen Pilot & Status Masa Berlaku

Mengambil daftar sertifikat/dokumen pilot dengan perhitungan sisa hari (`daysRemaining`) dan status urgensi otomatis dari server, diurutkan mulai dari yang paling mendesak.

- **Method**: `GET`
- **Path**: `/documents`
- **Auth**: Wajib (`Bearer <token>`)

#### Logika Status:
- `expired` (merah): `daysRemaining <= 0`
- `soon` (kuning/amber): `0 < daysRemaining <= warningDays (30 hari)`
- `safe` (hijau): `daysRemaining > warningDays (30 hari)`

#### Respons Sukses (200 OK):
```json
{
  "today": "2026-05-15",
  "warningDays": 30,
  "items": [
    {
      "id": "doc_security",
      "label": "Security Clearance Exp. Date",
      "expiryDate": "2026-05-01",
      "daysRemaining": -14,
      "status": "expired"
    },
    {
      "id": "doc_license",
      "label": "Indonesian License Exp. Date",
      "expiryDate": "2026-05-29",
      "daysRemaining": 14,
      "status": "soon"
    },
    {
      "id": "doc_medical",
      "label": "Indonesian Medical Exp. Date",
      "expiryDate": "2026-06-11",
      "daysRemaining": 27,
      "status": "soon"
    },
    {
      "id": "doc_recurrent",
      "label": "Next Recurrent Date",
      "expiryDate": "2026-10-14",
      "daysRemaining": 152,
      "status": "safe"
    },
    {
      "id": "doc_ppc",
      "label": "PPC Exp. Date",
      "expiryDate": "2026-12-25",
      "daysRemaining": 224,
      "status": "safe"
    }
  ]
}
```

---

### 4.6. Schedules: Jadwal Terbang Bulanan

Mengambil jadwal pilot untuk satu bulan tertentu, lengkap dengan legenda kode tugas, base, warna hex, serta indikator penyelesaian tugas.

- **Method**: `GET`
- **Path**: `/schedules`
- **Auth**: Wajib (`Bearer <token>`)
- **Query Parameters**:
  - `year` (*number, required*): Tahun (2000 - 2100).
  - `month` (*number, required*): Bulan (1 - 12).

#### Contoh Request:
```http
GET /schedules?year=2026&month=5 HTTP/1.1
Authorization: Bearer <ACCESS_TOKEN>
```

#### Respons Sukses (200 OK):
```json
{
  "year": 2026,
  "month": 5,
  "today": "2026-05-15",
  "legend": [
    { "code": "DTY", "label": "On Duty", "color": "#10B981" },
    { "code": "RLV", "label": "Requested Leave", "color": "#475569" },
    { "code": "SCK", "label": "Sick", "color": "#EF4444" },
    { "code": "TRD", "label": "Travel Day", "color": "#FBA577" },
    { "code": "TRX", "label": "Training", "color": "#F59E0B" },
    { "code": "ADM", "label": "Administration", "color": "#9CA3AF" },
    { "code": "FER", "label": "Ferry", "color": "#7C2D12" },
    { "code": "MED", "label": "Medical", "color": "#7C3AED" },
    { "code": "REC", "label": "Recurrent", "color": "#0EA5E9" },
    { "code": "ULV", "label": "Unpaid Leave", "color": "#111827" }
  ],
  "items": [
    {
      "id": "97027",
      "duty_date": "2026-05-15",
      "status": 1,
      "base_name": "MKW",
      "base_color": "#10B981",
      "duty_type": "DTY",
      "count_schedules": 6,
      "count_logbooks": 6,
      "remaining": 0,
      "completed": true
    },
    {
      "id": "97028",
      "duty_date": "2026-05-19",
      "status": 1,
      "base_name": "SIQ",
      "base_color": "#10B981",
      "duty_type": "DTY",
      "count_schedules": 2,
      "count_logbooks": 0,
      "remaining": 2,
      "completed": false
    }
  ]
}
```

- `remaining`: dihitung dari `Math.max(count_schedules - count_logbooks, 0)`.
- `completed`: bernilai `true` jika `count_logbooks === count_schedules`.

---

### 4.7. Health & Status Service

Endpoint publik untuk monitoring dan deployment health checks (misal pada Render, Railway, atau Fly.io).

- **Method**: `GET`
- **Path**: `/health`
- **Auth**: Public

#### Respons:
```json
{
  "status": "ok",
  "timestamp": "2026-10-03T16:03:33.291Z",
  "uptime": 120.45
}
```
