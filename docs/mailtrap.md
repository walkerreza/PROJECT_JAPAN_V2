# Mailtrap SMTP dan Template

Gunakan Mailpit atau Mailtrap Sandbox untuk pengembangan lokal. Keduanya hanya menangkap email dan tidak mengirimkannya ke inbox pengguna.

Untuk produksi awal, gunakan Mailtrap Email Sending:

1. Verifikasi domain `japanlingo.com` pada dashboard Mailtrap.
2. Tambahkan DNS SPF, DKIM, dan DMARC yang diberikan Mailtrap.
3. Isi credential SMTP production pada `.env` server sesuai dashboard Mailtrap.
4. Gunakan `MAIL_FROM_ADDRESS=noreply@japanlingo.com` dan jangan memasukkan credential ke Git.
5. Jalankan worker permanen: `php artisan queue:work database --queue=mail,default --tries=3 --sleep=3`.
6. Jalankan scheduler Laravel setiap menit agar pembersihan token reset dan job terjadwal tetap bekerja.

`MAIL_NOTIFICATIONS_ENABLED` sengaja tetap `false`. OTP, verifikasi email, dan invoice memakai notifikasi email khusus; notifikasi aplikasi biasa hanya masuk database agar inbox pengguna tidak penuh.

## Template yang di-host Mailtrap (opsional)

Secara default aplikasi mengirim email melalui SMTP Laravel. Untuk memakai desain dari menu **Email Templates** Mailtrap, aktifkan adapter API ini hanya setelah tiga template dibuat pada dashboard:

1. Buka file di `docs/mailtrap-templates/`, lalu salin masing-masing HTML ke editor Mailtrap.
2. Buat template terpisah untuk OTP reset, verifikasi email, dan bukti pembayaran.
3. Salin **Template UUID** pada tab Integration, serta buat API token di Settings > API Tokens. Jangan pakai username/password SMTP sebagai API token.
4. Isi konfigurasi server berikut dan jalankan `php artisan optimize:clear`:

```env
MAILTRAP_TEMPLATES_ENABLED=true
MAILTRAP_API_TOKEN=token_api_mailtrap
MAILTRAP_TEMPLATE_PASSWORD_RESET_OTP_UUID=uuid_template_otp
MAILTRAP_TEMPLATE_VERIFY_EMAIL_UUID=uuid_template_verifikasi
MAILTRAP_TEMPLATE_PURCHASE_RECEIPT_UUID=uuid_template_invoice
```

Untuk menguji template API ke Mailtrap Sandbox, tambahkan `MAILTRAP_SANDBOX_INBOX_ID` dari sandbox. Untuk pengiriman nyata, kosongkan nilai tersebut dan gunakan domain pengirim yang telah diverifikasi di Mailtrap.

Jika flag, token, atau UUID sebuah template belum tersedia, notifikasi tersebut otomatis kembali memakai SMTP Laravel. Kredensial Mailtrap hanya berada di `.env`; frontend tidak menerima token maupun UUID.
