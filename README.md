# Japanlingo V2

Japanlingo V2 adalah platform belajar bahasa Jepang berbasis kelas untuk program JLPT, dengan fokus awal pada kelas N3. Project ini menggabungkan roadmap mingguan, PPT/presentasi, kosakata, flashcard, kuis, progress, gamifikasi, payment Midtrans, access key, dan kloter belajar.

Tujuan V2 bukan memindahkan web lama secara mentah, tetapi membangun ulang pengalaman belajar yang lebih jelas: user memilih kelas, masuk ke roadmap mingguan, belajar lewat konten interaktif, mengerjakan kuis, lalu membuka progress berikutnya setelah lulus.

![Kelas N3 Mingguan](public/images/kelas-n3-mingguan.jpg)

## Ringkasan Produk

Japanlingo V2 dirancang untuk kebutuhan kursus Jepang yang lebih terarah:

- User belajar dari kelas/program, bukan dari halaman materi panjang.
- Setiap kelas berisi modul mingguan.
- Setiap modul dapat berisi PPT, kosakata, flashcard, dan kuis.
- Flashcard menjadi bentuk materi interaktif sebelum kuis.
- Kuis menjadi gate untuk membuka week berikutnya.
- Free user dapat preview Week 1.
- Premium/access key membuka kelas lanjutan sesuai scope akses.
- Kloter mengatur batch belajar berdasarkan tanggal mulai dan minggu aktif.

![Kelas Kosakata](public/images/kelas-n3-kosakata.jpg)

## Fitur Utama

### User

- Dashboard belajar dengan quick access.
- Halaman kelas sebagai entry point utama.
- Roadmap mingguan bergaya learning path.
- PPT/presentasi yang dibagikan admin.
- Library kosakata Jepang.
- Flashcard interaktif.
- Kuis dengan timer, nyawa, score, XP, dan feedback.
- Progress dan pencapaian.
- Notifikasi in-app untuk payment, akses, kloter, konten, dan progress.
- Redeem access key dari profile.

### Admin

- Manajemen kelas/program.
- Manajemen modul mingguan.
- Builder PPT/presentasi.
- Builder flashcard.
- Builder kuis dan soal.
- Library kosakata.
- Data user dan analitik pembelajaran.
- Import konten tertentu dari spreadsheet atau file pendukung.

### Superadmin

- Dashboard operasional.
- Manajemen user dan admin.
- Manajemen payment plan.
- Monitoring transaksi Midtrans/manual.
- Generate dan revoke access key.
- Manajemen kloter belajar.
- Assign user ke kloter.
- Monitoring kapasitas dan progress anggota kloter.
- Pengaturan sistem dasar.

![Kelas Kanji](public/images/kelas-n3-kanji.jpg)

## Alur Belajar

```text
Login
-> Kelas
-> Pilih kelas N3
-> Roadmap mingguan
-> PPT / Kosakata / Flashcard
-> Kuis
-> Lulus passing score
-> Progress tersimpan
-> Week berikutnya terbuka
```

Aturan utama:

- Flashcard harus selesai sebelum kuis.
- Kuis lulus jika memenuhi `passing_score`.
- Progress modul hanya dianggap selesai jika kuis lulus.
- Jika user berada dalam kloter, week yang belum masuk minggu aktif kloter tetap terkunci.

## Payment dan Access

Project ini memakai Midtrans untuk checkout. Scope akses dibuat hybrid agar fleksibel:

- `global`: membuka semua kelas premium.
- `program`: membuka satu kelas/program tertentu.

Access key juga mendukung akses global, per kelas, atau per kloter. Ini berguna untuk kebutuhan semi-manual dari superadmin atau kloter khusus.

Email notification sudah disiapkan, tetapi default nonaktif. Notifikasi utama tetap berjalan lewat bell/sidebar.

```env
MAIL_NOTIFICATIONS_ENABLED=false
```

Aktifkan email hanya jika SMTP valid sudah tersedia.

## Stack

- Laravel 13
- PHP 8.3
- MySQL
- Inertia.js
- React
- Vite
- Tailwind CSS
- Material UI Icons
- Framer Motion
- Midtrans

## Setup Local

Clone repository, lalu install dependency:

```bash
composer install
npm install
```

Copy environment:

```bash
cp .env.example .env
php artisan key:generate
```

Sesuaikan database MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=Project_japan
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migration dan seeder:

```bash
php artisan migrate --seed
```

Jalankan aplikasi:

```bash
php artisan serve
npm run dev
```

Build production:

```bash
npm run build
```

## Env Penting

Midtrans sandbox:

```env
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

Mail notification:

```env
MAIL_NOTIFICATIONS_ENABLED=false
MAIL_MAILER=log
```

Untuk production, gunakan SMTP yang valid dan jangan commit `.env`.

## Struktur Konteks Project

Catatan keputusan produk ada di folder:

```text
../context_project/6-changed/
```

Dokumen yang sebaiknya dibaca lebih dulu:

- `latest-changed.md`
- `modul-mingguan-concept.md`
- `kloter-payment-access-2026-07-09.md`
- `hybrid-payment-access-scope-2026-07-06.md`

## Catatan Development

- Target aktif adalah `japanlingov2`.
- Project lama `japanlingo` hanya referensi.
- Jangan menghidupkan ulang halaman materi panjang sebagai flow utama user.
- Jangan menambah tabel baru jika relasi existing sudah cukup.
- Untuk fitur berat seperti import PDF/PPT lanjutan, pertimbangkan storage dan resource VPS.

## Status

V2 saat ini adalah checkpoint aktif untuk pengembangan kelas N3, roadmap mingguan, kloter, payment, notifikasi, dan presentasi. Fokus berikutnya adalah QA, polishing UI, pematangan admin input, dan validasi flow user end-to-end.
