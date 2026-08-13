# Database, Storage, dan Public

## Database

Daftar lengkap migration, factory, dan seeder berada di [database and test catalog](database-and-test-catalog.md). Migration adalah histori skema dan tidak boleh digabung atau diedit setelah pernah dijalankan di environment bersama tanpa rencana migrasi yang eksplisit.

- `database/migrations/`: perubahan skema dan migrasi data historis.
- `database/factories/`: factory untuk test/development.
- `database/seeders/`: akun demo, master data, kelas, konten, berita, pembayaran, dan skenario pengujian sesuai seeder masing-masing.
- `database/database.sqlite`: hanya relevan bila memang dipilih sebagai database lokal; konfigurasi utama project memakai env database.

## `storage/`

`storage/` berisi data runtime dan tidak boleh dianggap source code.

| Lokasi | Isi dan aturan |
|---|---|
| `storage/app/private/` | File yang harus dibaca melalui controller/authorization. Presentasi premium, hasil import, dan aset terlindungi berada di sini. |
| `storage/app/public/` | Upload yang memang boleh disajikan melalui `/storage`, misalnya gambar berita. Jangan menaruh PDF premium di sini. |
| `storage/framework/cache/` | Cache Laravel; boleh dibersihkan melalui Artisan, bukan diedit manual. |
| `storage/framework/sessions/` | Session bila driver file digunakan. Kehilangan folder ini mengeluarkan user. |
| `storage/framework/views/` | Blade hasil kompilasi; generated. |
| `storage/framework/testing/` | Disk sementara test; bukan data production. |
| `storage/logs/` | Log aplikasi. Terapkan rotation/retention dan jangan commit isi log. |

Disk `local` mengarah ke `storage/app/private`, sedangkan disk `public` mengarah ke `storage/app/public`. `php artisan storage:link` hanya mengekspos disk public. Akses file privat harus lewat endpoint yang melakukan authorization.

Backup production minimal mencakup database dan file bisnis pada `storage/app/private` serta upload publik yang tidak mudah diregenerasi. Cache, session, compiled view, test disk, dan log lama tidak wajib masuk backup aplikasi.

## `public/`

`public/` adalah satu-satunya document root web server.

| Lokasi | Status |
|---|---|
| `public/index.php` | Front controller Laravel; entry point HTTP. |
| `public/.htaccess` | Rewrite/guard Apache. Nginx memakai virtual host tersendiri. |
| `public/robots.txt` | Arahan crawler, bukan kontrol keamanan. |
| `public/logo.png`, `public/favicon.ico` | Aset brand root. Periksa favicon jika ukurannya nol sebelum release. |
| `public/images/` | Thumbnail kelas statis. |
| `public/audio/sfx/` | Efek suara UI/pembelajaran beserta attribution bila ada. |
| `public/vendor/japanese-strokes/` | Aset stroke kanji sumber/hasil build yang digunakan handwriting dan stroke guide. Jangan hapus hanya karena berada di `vendor`; ini bukan Composer vendor. |
| `public/build/` | Output Vite generated oleh `npm run build`; jangan diedit manual. |
| `public/storage` | Symlink menuju `storage/app/public`; dibuat oleh `php artisan storage:link`. |
| `public/hot` | Penanda Vite dev server. File ini tidak boleh ikut deployment production karena dapat mengarahkan browser ke dev server lokal. |

Jangan menaruh `.env`, dump SQL, backup, log, source map rahasia, atau file privat di bawah `public/`.

## Artefak Anomali

`app/grep.exe.stackdump` adalah dump proses Windows, bukan file aplikasi. Ia aman untuk dikeluarkan dari katalog source dan sebaiknya dihapus dalam cleanup terpisah setelah memastikan tidak ada kebutuhan forensik/debug.

