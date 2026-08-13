# Testing dan Checklist Rilis

## Pemeriksaan Otomatis

```bash
php artisan optimize:clear
php artisan test
npm run build
composer audit --locked --no-interaction
npm audit --omit=dev
php artisan route:list
php artisan schedule:list
git diff --check
```

Jangan melaporkan test timed out sebagai lulus. Catat nama test, exit code, dan bagian yang belum terverifikasi.

## Auth

- register manual dan verifikasi email;
- resend cooldown/rate limit;
- OTP reset password;
- login Google dengan state valid;
- state invalid ditolak;
- email Google unverified ditolak;
- admin tanpa link Google tidak auto-link;
- hapus akun manual/Google dan logout.

## Payment dan Akses

- checkout idempoten;
- Snap sandbox;
- webhook signature valid/invalid;
- nominal mismatch;
- mapping seluruh status;
- reconciliation;
- invoice email;
- kelas mandiri langsung aktif;
- kelas mentor menunggu approval;
- admin pengampu approve/reject;
- retry approval tidak menggandakan subscription;
- access key program/kloter dan rate limit.

## Pembelajaran

- roadmap lock/active/completed;
- Week/Day/presentasi terurut;
- kuis, repetisi, audio, handwriting, score backend;
- ujian tanpa XP/repetisi;
- submit ganda;
- target ujian pribadi;
- user tanpa entitlement mendapat 403;
- kloter belum masuk minggu aktif tetap terkunci.

## Admin dan Import

- CRUD kelas, Week, Day, presentasi, flashcard, kuis, ujian, Bank Konten;
- konteks module/day tidak tertukar;
- preview import sama dengan hasil simpan;
- template lama dan baru;
- file oversize/ZIP unsafe ditolak;
- item lintas program/Week/Day fail-closed;
- route legacy redirect/403 sesuai keputusan.

## Gamifikasi

- XP idempoten pada request paralel;
- level dan streak;
- achievement satu kali;
- leaderboard weekly/all-time;
- ujian/handwriting practice tidak memberi XP.

## Kelas Realtime

- mentor pengampu vs bukan pengampu;
- siswa aktif vs luar kloter;
- lobby dan izin browser;
- kamera/audio/screen share;
- Reverb state dan late join snapshot;
- PTT, raise hand, satu izin menggambar;
- mic block server-side setelah reconnect;
- kick vs network disconnect;
- end room;
- dua perangkat dan dua jaringan;
- load test bertahap.

## Staging Sebelum Production

- clone konfigurasi production tanpa memakai data/secret production;
- jalankan migration pada salinan database;
- uji vendor sandbox/test mode;
- uji Nginx/TLS/WSS/firewall;
- lakukan restore backup;
- pantau log tanpa `APP_DEBUG`.

## Go-Live

- [ ] backup database dan private storage;
- [ ] secret production baru;
- [ ] document root `/public`;
- [ ] `APP_DEBUG=false`;
- [ ] migration dan build berhasil;
- [ ] scheduler aktif;
- [ ] worker aktif hanya bila queue database;
- [ ] Reverb/LiveKit aktif dan origin dibatasi;
- [ ] Google redirect URI production terdaftar;
- [ ] Mailtrap domain/template verified;
- [ ] Midtrans notification URL HTTPS;
- [ ] Cloudflare/firewall aktif;
- [ ] smoke test semua role;
- [ ] monitoring dan rollback siap.

## Setelah Rilis

Periksa log/error, transaksi pending, email bounce, queue failed, disk, RAM, serta service selama minimal satu siklus penggunaan nyata. Jangan menggabungkan perubahan payment besar dan perubahan media realtime besar dalam satu rilis tanpa staging dan rollback terpisah.
