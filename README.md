# SubTrack — Subscription & Usage Intelligence API

> **Track your subscriptions. Understand your spending.**

SubTrack adalah RESTful API untuk manajemen langganan (subscription management) pribadi yang membantu pengguna mencatat dan memonitor biaya berulang, melacak tanggal jatuh tempo pembayaran berikutnya, mengevaluasi frekuensi penggunaan bulanan secara manual, serta melihat estimasi pengeluaran bulanan dan tahunan.

Proyek ini dibangun menggunakan **Node.js**, **Express.js**, dan **MongoDB Native Driver** (`mongodb`) tanpa Mongoose atau ODM lainnya, dengan arsitektur modular yang bersih dan pemisahan tanggung jawab (separation of concerns) yang jelas.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.x)
- **Database:** MongoDB (Community Server / Atlas)
- **Database Library:** Official MongoDB Node.js Driver (`mongodb` v6.x) — *No Mongoose/ODM*
- **Environment Management:** `dotenv`
- **Development Tool:** `nodemon`
- **API Testing:** Postman

---

## 📂 Struktur Folder Proyek

```text
subtrack-api/
├── config/
│   └── database.js                    # Koneksi MongoClient & pembuatan Index
├── controllers/
│   ├── subscriptionController.js      # Logika bisnis CRUD Subscriptions
│   ├── usageReviewController.js       # Logika bisnis CRUD Monthly Usage Reviews
│   └── analyticsController.js         # Logika kalkulasi spending summary
├── routes/
│   ├── subscriptionRoutes.js          # Routing endpoint /api/subscriptions
│   ├── usageReviewRoutes.js           # Routing endpoint /api/usage-reviews
│   └── analyticsRoutes.js             # Routing endpoint /api/analytics
├── utils/
│   └── validators.js                  # Fungsi validasi request & ObjectId reusable
├── .env                               # File konfigurasi environment (lokal)
├── .env.example                       # Template konfigurasi environment
├── .gitignore                         # File pengabaian git
├── package.json                       # Manifest dependensi & script npm
├── SubTrack_Postman_Collection.json   # File Postman collection siap import
└── index.js                           # Entry point server Express & database startup
```

---

## ⚙️ Persyaratan Sistem & Instalasi

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 18 ke atas
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) berjalan di lokal (port default `27017`) atau MongoDB Atlas URI

### 2. Clone Repository & Install Dependensi
```bash
git clone https://github.com/Zkiells/substrack-api.git
cd substrack-api
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env` di root direktori (atau salin dari `.env.example`):
```bash
cp .env.example .env
```

Sesuaikan isi `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=subtrack
```

### 4. Menjalankan Server

**Mode Development (dengan reload otomatis menggunakan nodemon):**
```bash
npm run dev
```

**Mode Production:**
```bash
npm start
```

Output terminal saat server berhasil berjalan:
```
Connected to MongoDB — database: "subtrack"
SubTrack API running on http://localhost:3000
```

---

## 📑 Spesifikasi REST API

Format respon API konsisten:
- **Sukses:** `{ "success": true, "message": "...", "data": ... }`
- **Gagal:** `{ "success": false, "message": "...", "errors": [...] }`

### HTTP Status Codes yang Digunakan:
- `200 OK`: Pengambilan, pembaruan, atau penghapusan data berhasil.
- `201 Created`: Pembuatan data baru berhasil.
- `400 Bad Request`: Validasi input gagal atau terjadi duplikasi data unik.
- `404 Not Found`: Sumber daya (resource) yang dicari tidak ditemukan.
- `500 Internal Server Error`: Kesalahan server internal.

---

### A. Subscription Endpoints (`/api/subscriptions`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/subscriptions` | Membuat data langganan baru |
| `GET` | `/api/subscriptions` | Mendapatkan semua daftar langganan |
| `GET` | `/api/subscriptions/:id` | Mendapatkan detail langganan berdasarkan ID |
| `PUT` | `/api/subscriptions/:id` | Memperbarui data langganan berdasarkan ID |
| `DELETE` | `/api/subscriptions/:id` | Menghapus langganan berdasarkan ID |

#### Contoh Request Body `POST /api/subscriptions`:
```json
{
  "name": "Netflix",
  "category": "Entertainment",
  "price": 54000,
  "currency": "IDR",
  "billingCycle": "monthly",
  "startDate": "2024-01-01",
  "nextBillingDate": "2026-12-01",
  "status": "active",
  "notes": "Paket Keluarga"
}
```

*Catatan Bisnis Subscription:*
- `category` harus salah satu dari: `Entertainment`, `Productivity`, `Cloud Storage`, `Education`, `Communication`, `Other`.
- `billingCycle` harus salah satu dari: `monthly`, `yearly`, `custom`.
- Jika `billingCycle` bernilai `custom`, field `customIntervalDays` **wajib** diisi dengan integer positif (misal `90`).
- `status` dapat bernilai `active`, `cancelled`, atau `expired` (default: `active`).

---

### B. Monthly Usage Review Endpoints (`/api/usage-reviews`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/usage-reviews` | Mencatat evaluasi frekuensi penggunaan bulanan |
| `GET` | `/api/usage-reviews` | Mendapatkan seluruh histori evaluasi penggunaan |
| `GET` | `/api/usage-reviews/:id` | Mendapatkan evaluasi berdasarkan ID |
| `PUT` | `/api/usage-reviews/:id` | Memperbarui evaluasi berdasarkan ID |

#### Contoh Request Body `POST /api/usage-reviews`:
```json
{
  "subscriptionId": "6afd26f4f61595b85869101f",
  "month": 11,
  "year": 2026,
  "usageCount": 42,
  "note": "Digunakan rutin setiap hari"
}
```

*Catatan Bisnis Usage Review:*
- `subscriptionId` harus berupa MongoDB ObjectId valid dan wajib merujuk ke dokumen langganan yang memang ada.
- `month` bernilai integer antara `1` sampai `12`.
- `usageCount` bernilai integer non-negatif (`>= 0`).
- **Unique Compound Index:** Sebuah subscription hanya dapat memiliki satu evaluasi untuk bulan dan tahun yang sama (`{ subscriptionId: 1, month: 1, year: 1 }`). Jika terjadi duplikasi, server mengembalikan status `400 Bad Request`.

---

### C. Analytics Summary Endpoint (`/api/analytics`)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/analytics/summary` | Mendapatkan ringkasan pengeluaran langganan aktif |

#### Contoh Respon `GET /api/analytics/summary`:
```json
{
  "success": true,
  "data": {
    "totalActiveSubscriptions": 3,
    "estimatedMonthlyExpense": 127481.67,
    "estimatedYearlyExpense": 1529780.04,
    "activeSubscriptions": [
      {
        "_id": "6afd2608eebf3abffccc2fb3",
        "name": "Adobe Creative Cloud",
        "category": "Productivity",
        "price": 150000,
        "currency": "IDR",
        "billingCycle": "custom",
        "customIntervalDays": 90,
        "status": "active",
        "nextBillingDate": "2026-12-01T00:00:00.000Z",
        "monthlyEquivalent": 50000
      },
      {
        "_id": "6afd26f4f61595b85869101f",
        "name": "Spotify",
        "category": "Entertainment",
        "price": 54990,
        "currency": "IDR",
        "billingCycle": "monthly",
        "customIntervalDays": null,
        "status": "active",
        "nextBillingDate": "2026-12-01T00:00:00.000Z",
        "monthlyEquivalent": 54990
      },
      {
        "_id": "6afd26f4f61595b858691020",
        "name": "Google Drive",
        "category": "Cloud Storage",
        "price": 269900,
        "currency": "IDR",
        "billingCycle": "yearly",
        "customIntervalDays": null,
        "status": "active",
        "nextBillingDate": "2026-12-01T00:00:00.000Z",
        "monthlyEquivalent": 22491.67
      }
    ]
  }
}
```

*Formula Normalisasi Pengeluaran Bulanan (Monthly Equivalent):*
- **Monthly:** `price`
- **Yearly:** `price / 12`
- **Custom:** `(price * 30) / customIntervalDays`
- **Yearly Total:** `estimatedMonthlyExpense * 12`
- *Hanya subscription dengan status `active` yang diikutsertakan.*

---

## 🧪 Panduan Testing via Postman

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di pojok kiri atas.
3. Pilih file `SubTrack_Postman_Collection.json` yang ada di direktori root proyek ini.
4. Collection **"SubTrack — Subscription & Usage Intelligence API"** akan muncul lengkap dengan seluruh request:
   - Buat subscription terlebih dahulu (`POST /api/subscriptions`).
   - Salin nilai `_id` dari respon, lalu masukkan ke variabel collection `subscriptionId` (atau langsung pakai di parameter URL).
   - Jalankan request lainnya: `GET`, `PUT`, `DELETE`, `POST /api/usage-reviews`, dan `GET /api/analytics/summary`.

---

## 👨‍💻 Author

- **Nama Mentee:** Jehezkiel Hinn Sumit
- **Program:** Backend Basic — Final Project
- **Repository:** [https://github.com/Zkiells/substrack-api](https://github.com/Zkiells/substrack-api)
