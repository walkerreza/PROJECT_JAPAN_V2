# Routes dan Konfigurasi

## Peta Route

### `routes/web.php`

File route HTTP utama. Semua halaman Inertia dan endpoint web berada di sini.

- Publik: landing page, about, pricing/katalog kelas, roadmap publik, kebijakan, dan webhook Midtrans.
- Autentikasi: group `auth` + `verified` menjadi pagar umum profil, notifikasi, pembayaran, dan pembacaan presentasi privat.
- Superadmin: prefix/name `superadmin`, role `superadmin`; mengelola pengguna, admin, berita, gamifikasi, kloter, pembayaran, tema, dan sistem.
- Admin: prefix/name `admin`, role `admin`; mengelola kloter/siswa, analitik, kosakata, flashcard/repetisi, kuis/ujian, kelas/Week/Day, presentasi, upload, dan ruang kelas live.
- User: prefix/name `user`, role `user`; dashboard, kelas, checkout, roadmap, materi, berita, kelas live, kuis, repetisi inline, leaderboard, sertifikat, dan progress.

Route index lama untuk flashcard, presentasi, kuis, dan board sengaja mengarah ke workspace kelas. Route builder/CRUD tetap tersedia untuk kompatibilitas dan dipanggil dari workspace.

Webhook Midtrans tidak memakai group `auth` dan dikecualikan dari CSRF di `bootstrap/app.php`. Keamanannya bergantung pada validasi signature dan status di service pembayaran, bukan session browser.

### `routes/auth.php`

Menangani register/login manual, Google OAuth, lupa/reset password, verifikasi email, konfirmasi password, reautentikasi penghapusan akun, perubahan password, dan logout. Endpoint sensitif guest serta resend verification memakai throttle.

### `routes/channels.php`

Otorisasi private channel Laravel Reverb. Channel `live-class.{sessionId}` hanya menerima mentor sesi atau anggota aktif kloter ketika sesi berstatus `live`. Ini adalah otorisasi event aplikasi; media kamera/mic/screen share tetap diotorisasi oleh token LiveKit.

### `routes/console.php`

Mendaftarkan scheduler untuk expiry subscription, pembersihan import/log/snapshot, rekonsiliasi Midtrans, publish berita terjadwal, dan pembersihan reset token. Production wajib menjalankan `php artisan schedule:run` setiap menit.

## Bootstrap dan Provider

- `bootstrap/app.php`: memasang route files, middleware Inertia, pengecualian CSRF webhook, serta alias `role` dan `subscribed`.
- `bootstrap/providers.php`: daftar service provider aplikasi.
- `app/Providers/AppServiceProvider.php`: rate limiter access key, pembayaran, aksi belajar, kelas live, import/upload admin, dan endpoint guest sensitif.
- `app/Http/Middleware/HandleInertiaRequests.php`: shared props Inertia seperti identitas pengguna, notifikasi, akses, dan tema.
- `app/Http/Middleware/CheckRole.php`: pagar role route.
- `app/Http/Middleware/SubscriptionMiddleware.php`: pagar subscription pada route yang menggunakannya.

## File `config/`

| File | Tanggung jawab |
|---|---|
| `config/app.php` | Nama aplikasi, URL, locale, timezone, encryption, dan maintenance mode. |
| `config/auth.php` | Guard, provider model pengguna, password broker, dan timeout konfirmasi password. |
| `config/broadcasting.php` | Driver broadcast serta koneksi Reverb/Pusher/log/null. |
| `config/cache.php` | Cache store default, prefix, database/file/Redis stores, dan lock. |
| `config/database.php` | Koneksi database, migrations table, Redis client, dan prefix. |
| `config/filesystems.php` | Disk `local` privat, `public`, S3, dan symlink `public/storage`. |
| `config/logging.php` | Channel log, stack, daily/single/stderr, dan retention. |
| `config/mail.php` | Mailer SMTP/API-compatible, alamat pengirim, dan transport fallback. |
| `config/queue.php` | Driver queue sync/database/Redis/SQS dan failed jobs. |
| `config/reverb.php` | Server Reverb, app credentials, allowed origin, TLS, scaling, dan ping. |
| `config/services.php` | Kredensial vendor Google, Midtrans, Mailtrap template API, dan LiveKit. |
| `config/session.php` | Driver session, lifetime, cookie, domain, SameSite, dan secure cookie. |

Nilai rahasia hanya boleh berasal dari `.env`; jangan hard-code secret ke route, controller, config, atau frontend. Gunakan [environment reference](../01-development/environment-reference.md) sebagai daftar variabel.

