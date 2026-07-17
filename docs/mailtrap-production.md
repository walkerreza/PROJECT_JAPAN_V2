# Mailtrap Production Setup

Dokumen ini dipakai saat Japanlingo mengirim email sungguhan ke Gmail atau provider penerima lain. Jangan pernah menyimpan API token, password SMTP, atau Template UUID rahasia di Git.

## Prasyarat Mailtrap

1. Buka **Email Sending > Sending Domains** dan tambahkan `rezawalker.web.id`.
2. Tambahkan seluruh record DNS yang diberikan Mailtrap: domain verification, DKIM, DMARC, dan tracking domain bila tersedia.
3. Isi **Sender Information** dari account owner.
4. Tunggu status domain menjadi `Verified`.
5. Buat API token untuk Email Sending. Token ini dipakai oleh API template dan SMTP production.
6. Buat tiga template Transactional pada domain tersebut, lalu simpan UUID-nya:
   - Password reset OTP
   - Verifikasi email
   - Bukti pembayaran

HTML siap-tempel untuk template berada di `docs/mailtrap-templates/`.

## Environment VPS

Gunakan nilai asli dari menu **Integration** Mailtrap. Jangan gunakan kredensial Email Sandbox.

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://rezawalker.web.id

# Trafik awal kecil: email diproses langsung tanpa queue worker.
QUEUE_CONNECTION=sync

# SMTP production sebagai fallback jika Mailtrap Template API gagal.
MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=apismtp@mailtrap.io
MAIL_PASSWORD=GANTI_DENGAN_API_TOKEN_MAILTRAP
MAIL_FROM_ADDRESS=noreply@rezawalker.web.id
MAIL_FROM_NAME="Japanlingo"

# Template API production.
MAILTRAP_TEMPLATES_ENABLED=true
MAILTRAP_API_TOKEN=GANTI_DENGAN_API_TOKEN_MAILTRAP
MAILTRAP_API_ENDPOINT=https://send.api.mailtrap.io/api/send
MAILTRAP_SANDBOX_INBOX_ID=
MAILTRAP_TEMPLATE_PASSWORD_RESET_OTP_UUID=UUID_OTP
MAILTRAP_TEMPLATE_VERIFY_EMAIL_UUID=UUID_VERIFIKASI
MAILTRAP_TEMPLATE_PURCHASE_RECEIPT_UUID=UUID_INVOICE
```

`MAILTRAP_SANDBOX_INBOX_ID` harus kosong di production. Jika nilainya terisi, email template masuk ke inbox Sandbox dan tidak diteruskan ke Gmail.

## Terapkan Konfigurasi

Setelah `.env` diubah pada VPS:

```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Dengan `QUEUE_CONNECTION=sync`, worker queue tidak diperlukan. Saat trafik meningkat, ubah ke `QUEUE_CONNECTION=database`, jalankan worker Supervisor, dan gunakan retry untuk email invoice.

## Uji Produksi

1. Daftarkan akun manual baru memakai Gmail uji.
2. Pastikan email verifikasi datang dari `noreply@rezawalker.web.id`.
3. Klik link verifikasi dan pastikan kembali ke `https://rezawalker.web.id`.
4. Uji reset password dari `/forgot-password`.
5. Uji pembayaran Midtrans Sandbox dan pastikan bukti pembayaran masuk setelah status transaksi sukses.
6. Periksa **Email Logs** Mailtrap untuk status delivery, bounce, atau spam complaint.

## Troubleshooting

- Email tidak masuk Gmail dan `MAILTRAP_SANDBOX_INBOX_ID` terisi: kosongkan nilai itu dan bersihkan config cache.
- Log menampilkan fallback, tetapi email tidak masuk: pastikan `MAIL_MAILER=smtp`, bukan `log`.
- Link verifikasi mengarah ke `localhost`: perbaiki `APP_URL` pada environment VPS.
- API template gagal: aplikasi mencoba SMTP fallback. Periksa API token, UUID template, serta status domain `Verified`.
- Token pernah dibagikan di chat, log, atau commit: revoke token tersebut dari Mailtrap dan buat token baru.
