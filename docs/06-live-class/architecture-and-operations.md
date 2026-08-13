# Arsitektur dan Operasi Kelas Realtime

## Tujuan

Ruang Kelas adalah kelas virtual berbasis kloter, bukan meeting umum dan bukan deck yang berdiri sendiri. Mentor membuat sesi untuk satu program dan satu kloter, lalu dapat memilih deck presentasi atau membuka papan kosong.

## Pembagian Sistem

### Laravel/Inertia

- autentikasi dan otorisasi mentor/siswa;
- pembuatan sesi, `room_name`, dan `join_code`;
- penerbitan token LiveKit berumur pendek;
- penyimpanan status sesi, slide aktif, mode panggung, snapshot papan, serta status peserta;
- endpoint moderasi dan private broadcast channel.

### Laravel Reverb

- sinkronisasi state slide, pointer, drawing, mode panggung, raise hand, dan perubahan peserta;
- private channel `live-class.{sessionId}`;
- bukan server kamera atau audio.

### LiveKit

- kamera dan mikrofon mentor;
- mikrofon siswa;
- screen share dan screen audio;
- enforcement permission publish media di SFU.

Reverb dan LiveKit tidak saling menggantikan. Jika Reverb mati, media mungkin masih aktif tetapi state kelas tidak sinkron. Jika LiveKit mati, slide/state mungkin masih bergerak tetapi audio/video tidak tersedia.

## Data Persisten dan Temporer

Persisten di database:

- program, kloter, deck, mentor, room name, join code;
- status `draft/live/ended`;
- `stage_mode`, `current_slide_index`, dan snapshot papan terakhir;
- peserta, role, izin menggambar, waktu join/leave/last seen;
- status mic blocked dan kicked.

Temporer/realtime:

- pergerakan pointer;
- status koneksi dan active speaker;
- media audio/video/screen share;
- event UI frekuensi tinggi yang tidak dibutuhkan sebagai histori permanen.

Command `live-classes:cleanup-snapshots --days=30` menghapus snapshot papan sesi lama tanpa menghapus histori sesi. Recording dan LiveKit Egress tidak diaktifkan.

## Aturan Akses

- pembuat room harus `role=admin` dan menjadi `admin_id` kloter aktif;
- admin global juga harus ditetapkan sebagai pengampu kloter tersebut;
- deck yang dipilih harus berasal dari program kloter;
- hanya satu sesi berstatus live per kloter;
- siswa harus login, verified, dan berstatus anggota aktif kloter;
- join code bukan bypass autentikasi;
- peserta yang di-kick tidak mendapat token baru untuk sesi yang sama;
- disconnect jaringan biasa tidak sama dengan kick.

## Permission LiveKit

Mentor dapat publish:

```text
camera, microphone, screen_share, screen_share_audio, data
```

Siswa dapat subscribe, publish data, dan publish microphone selama tidak diblokir. Blokir mic memanggil `UpdateParticipant`, sehingga permission dicabut di server, bukan hanya tombol disembunyikan.

Token memiliki TTL default 900 detik. Key dan secret hanya berada di backend.

## Moderasi

- mute/block mic satu siswa;
- mute semua siswa;
- izin menulis hanya untuk satu siswa pada satu waktu;
- kick peserta;
- end session dan hapus room media;
- raise hand dan push-to-talk dikelola UI/realtime state.

## Alur Mentor

1. Superadmin membuat kloter aktif dan menetapkan admin pengampu.
2. Admin membuka `Kelas & Roadmap -> Kelola Isi -> Ruang Kelas`.
3. Admin memilih kloter dan opsional deck.
4. Backend membuat serta langsung memulai sesi.
5. Mentor memeriksa kamera/mikrofon di lobby dan masuk.
6. Mentor menyalin link join.
7. Mentor mengajar melalui slide, papan, pointer, kamera, audio, atau screen share.
8. Mentor mengakhiri sesi dari UI.

## Alur Siswa

1. Siswa membuka `/user/live-classes/{JOIN_CODE}`.
2. Backend memeriksa keanggotaan aktif.
3. Siswa memeriksa mikrofon di lobby.
4. Backend menerbitkan token student.
5. Siswa masuk, menerima media dan state terkini, lalu memakai PTT/raise hand sesuai izin.

## Batas Kapasitas

VPS 2 core/2 GB dengan sisa disk sekitar 20 GB hanya layak untuk POC atau kelas kecil. Disk bukan bottleneck utama bila tidak merekam; CPU, bandwidth keluar, NAT traversal, dan UDP lebih menentukan. Uji bertahap 5, 10, lalu 20 peserta. Untuk kelas stabil dengan banyak kamera atau peserta lebih besar, pindahkan LiveKit ke server/media provider terpisah.
