# Dependencies dan Tooling

## PHP / Composer

`composer.json` menetapkan PHP 8.3 dan Laravel 13. Dependency utama:

- Inertia Laravel untuk bridge Laravel-React.
- Socialite untuk Google OAuth.
- Reverb untuk event WebSocket aplikasi.
- LiveKit Server SDK untuk token dan kontrol room media.
- Dompdf untuk invoice/sertifikat PDF.
- Sanctum dan Ziggy sebagai bagian autentikasi/API helper dan named route frontend.

Dependency development mencakup Breeze, Pint, Pest, Mockery, Faker, Collision, Pail, dan Pao. `composer.lock` adalah sumber versi reproducible; deployment memakai `composer install`, bukan `composer update`.

## JavaScript / npm

`package.json` memakai React 18, Inertia 2, Vite 8, dan Tailwind. Dependency fitur utama:

- LiveKit React/client untuk kamera, mic, screen share, dan media room.
- Laravel Echo + Pusher client untuk event Reverb.
- TipTap untuk rich text berita/editor.
- Fabric untuk canvas presentasi/jamboard.
- pdf.js untuk render PDF.
- Kanji recognizer dan aset stroke untuk handwriting.
- Framer Motion, Recharts, React Confetti, MUI, dan Headless UI untuk interaksi/visual tertentu.

`package-lock.json` harus sinkron dengan `package.json`; gunakan `npm install` saat sengaja memperbarui lock lokal dan `npm ci` pada deployment/CI setelah keduanya sinkron.

## File Tooling Root

| File | Fungsi |
|---|---|
| `artisan` | CLI Laravel. |
| `vite.config.js` | Entry Vite, plugin Laravel/React/Tailwind, dan build frontend. |
| `tailwind.config.js` | Content scan dan theme Tailwind. |
| `postcss.config.js` | Pipeline PostCSS/autoprefixer. |
| `jsconfig.json` | Resolusi module/editor JavaScript. |
| `phpunit.xml` | Environment dan konfigurasi PHPUnit/Pest. |
| `.npmrc` | Perilaku npm project. |
| `.editorconfig` | Aturan format editor lintas IDE. |
| `build-stroke-assets.mjs` | Membangun indeks/aset stroke kanji untuk frontend. |
| `scripts/generate-code-reference.ps1` | Memperbarui katalog file dokumentasi. |

Perintah umum:

```powershell
composer install
npm install
npm run dev
npm run build
php artisan test
vendor/bin/pint --test
```

Jangan menjalankan `npm audit fix --force` atau `composer update` langsung di production; perubahan versi harus diuji dan lock file ditinjau di development.

