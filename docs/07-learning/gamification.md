# Gamifikasi

## Tujuan

Gamifikasi membantu konsistensi belajar tanpa menjadi sumber otorisasi. XP, level, liga, streak, dan achievement tidak boleh dipakai untuk membuka konten berbayar; akses tetap ditentukan subscription, program, kloter, dan progress.

## Komponen

- XP total pada user;
- level berdasarkan threshold;
- reward log sebagai audit sumber XP;
- streak harian dan bonus milestone;
- achievement/pencapaian;
- leaderboard weekly dan all-time;
- liga berdasarkan total XP;
- konfigurasi superadmin.

## Default Konfigurasi

XP kuis:

```text
100%      50 XP
>= 80%    35 XP
>= 60%    20 XP
partisipasi mengikuti path kalkulasi yang digunakan saat submit
```

Streak default:

```text
7 hari     50 XP
30 hari   200 XP
100 hari 1000 XP
```

Liga default:

```text
Bronze        0 XP
Silver      500 XP
Gold       2000 XP
Diamond    5000 XP
Amethyst  12000 XP
```

Superadmin dapat mengubah konfigurasi di halaman Gamifikasi. Perubahan harus diuji terhadap tampilan dashboard, leaderboard, dan kalkulasi reward baru.

## Integritas XP

`XpService`:

- mengunci row user dalam transaksi database;
- membuat reward log sebelum menambah XP;
- memakai unique `(user_id, source_type, source_id)` untuk sumber yang mempunyai ID;
- menangani duplicate-key sebagai reward duplikat tanpa menambah XP;
- menghitung ulang level setelah XP berubah.

Jangan mengganti constraint database dengan pemeriksaan `exists()` saja karena dua request paralel dapat lolos bersamaan.

## Level

Threshold internal `XpService` saat ini:

```text
Level 1      0 XP
Level 2    100 XP
Level 3    300 XP
Level 4    600 XP
Level 5   1000 XP
Level 6   1500 XP
```

Jika level juga dikelola melalui tabel/halaman admin, audit konsistensi dengan threshold service sebelum mengubah salah satunya. Hindari dua sumber konfigurasi yang menghasilkan level berbeda.

## Streak

- aktivitas pertama memulai streak 1;
- aktivitas pada hari kalender berikutnya menambah streak;
- jeda lebih dari satu hari mereset ke 1;
- milestone memberi bonus sesuai konfigurasi;
- gunakan timezone aplikasi `Asia/Jakarta` secara konsisten untuk leaderboard weekly dan aktivitas harian.

## Achievement

Kondisi yang didukung service saat ini mencakup:

- jumlah lesson/progress selesai;
- jumlah kuis nilai 100;
- jumlah hari streak.

Achievement baru di-attach sekali. XP achievement juga melewati `XpService`, lalu notifikasi in-app dikirim.

## Leaderboard

- weekly menjumlah `reward_logs` pada Senin-Minggu;
- all-time memakai `users.xp`;
- hasil top 50 dan posisi user di-cache 60 detik;
- tie diurutkan deterministik dengan ID user;
- Redis tidak wajib untuk satu instance; cache database cukup, Redis dipertimbangkan saat multi-instance atau beban tinggi.

## Ujian dan Handwriting

- ujian mingguan tidak memberi XP atau streak;
- handwriting practice tidak memengaruhi skor/XP jika dikonfigurasi practice-only;
- reveal/hint dapat dicatat sebagai belum mastery tanpa menghukum entitlement user.

## Pengujian

- dua reward paralel hanya menambah satu log/XP;
- retry submit tidak menggandakan XP;
- perubahan konfigurasi XP berlaku pada attempt baru;
- weekly reset mengikuti timezone;
- achievement tidak terduplikasi;
- ujian tidak memicu gamifikasi;
- leaderboard tetap cepat pada banyak reward log.
