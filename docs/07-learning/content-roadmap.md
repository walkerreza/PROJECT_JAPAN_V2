# Konten, Roadmap, Kuis, dan Progress

## Struktur Data Pembelajaran

```text
Program/Kelas
  -> Modul/Week
      -> Presentasi opening
      -> Day 1..n
          -> set flashcard/repetisi
          -> kuis checkpoint
          -> handwriting practice di alur kuis
      -> Presentasi after_day (opsional)
      -> Ujian mingguan 1..n
      -> Presentasi closing
```

`ProgramPembelajaran` adalah produk kelas. `Modul` mewakili Week. `HariModul` mewakili Day dan dapat menunjuk checkpoint quiz. Konten disimpan satu kali per program, bukan diduplikasi untuk setiap kloter.

## Workflow Admin

1. Buat/ubah kelas dari Kelas & Roadmap.
2. Buka Kelola Isi Kelas.
3. Atur Week dan Day di Roadmap.
4. Kelola presentasi mingguan.
5. Kelola Kuis & Repetisi untuk flashcard, soal, dan handwriting.
6. Kelola Bank Konten N3 secara terpisah sebagai sumber kosakata/kanji/bunpo.
7. Publish hanya setelah preview dan scoping Week/Day diperiksa.

Route lama manajemen terpisah dapat tetap sebagai redirect kompatibilitas, tetapi UI utama harus melalui konteks kelas agar admin tidak salah memilih Week/Day.

## Bank Konten dan Flashcard

Bank Konten menyimpan:

- kata/karakter, reading, arti Indonesia/Inggris;
- kategori dan tipe konten;
- contoh kalimat serta arti;
- audio;
- onyomi, kunyomi, radical, jumlah stroke, dan metadata;
- status publish serta relasi Week/Day.

Flashcard dapat menunjuk `vocabulary_id`, sehingga perubahan sumber dapat disinkronkan tanpa membuat bank kedua. Data snapshot flashcard tetap berguna agar sesi belajar konsisten.

## Import Spreadsheet

- admin dapat import manual/CSV/XLSX melalui service yang ada;
- template baru membawa konteks Week dan Day;
- template lama tetap kompatibel selama field wajib dasar valid;
- preview dan simpan harus memakai normalizer yang sama;
- XLSX dibatasi MIME/signature ZIP, entry, ukuran ekstraksi/XML, baris, kolom, panjang sel, path traversal, dan `LIBXML_NONET`;
- laporan baris gagal harus diperiksa, bukan dianggap seluruh import sukses;
- import berulang materi yang sama harus diuji terhadap duplikasi.

Jangan mengimport file yang tidak dipercaya hanya karena uploader adalah admin. Akun admin yang dibajak tetap menjadi jalur serangan.

## Kuis Harian dan Repetisi

- kuis Day memakai soal pilihan ganda/listening/tipe lain yang didukung builder;
- flashcard remedial dapat tampil sebelum/di sela soal;
- handwriting practice terkait karakter Bank Konten dan bersifat practice-only bila dikonfigurasi demikian;
- skor dan jawaban benar dihitung backend;
- frontend tidak menjadi sumber nilai atau XP;
- `submission_token` dan transaksi database membantu mencegah submit ganda.

## Ujian Mingguan

Ujian tetap memakai ekosistem model soal/attempt kuis, tetapi dikenali sebagai weekly exam ketika `module_day_id` null dan `exam_order` terisi.

- UI user berbentuk lembar ujian fokus;
- builder admin khusus ujian memakai CRUD backend yang sama;
- dapat ada beberapa ujian per Week dan diurutkan `exam_order`;
- mempunyai time limit, passing score, availability, bobot soal, attempt, serta jawaban;
- tidak memberi XP, streak, achievement, atau flashcard repetition;
- Week selesai setelah seluruh ujian published yang diwajibkan lulus.

## Unlock Roadmap

Otorisasi harus diperiksa backend:

- program dan Week published;
- entitlement program/subscription aktif;
- keanggotaan serta minggu aktif kloter untuk kelas mentor;
- Day/aktivitas sebelumnya selesai;
- checkpoint quiz atau ujian memenuhi passing score.

UI lock hanya representasi, bukan kontrol keamanan.

## Target Ujian Pribadi

User dapat mengatur tanggal target per program. Countdown ini hanya alat perencanaan pribadi dan tidak mengubah availability, jadwal resmi kloter, atau aturan unlock.

## Presentasi dan Storage

- deck offline dapat dibuka tanpa sesi live jika user berhak;
- PDF premium disimpan private dan disajikan melalui endpoint terotorisasi;
- source path/import metadata tidak dikirim ke Inertia user;
- XOR transport hanya obfuscation dan bukan DRM;
- presentasi live menggunakan deck yang sama, bukan menduplikasi konten.
