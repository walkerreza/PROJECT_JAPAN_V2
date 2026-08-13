# Midtrans Payment Gateway

## Arsitektur

1. User memilih plan dari halaman kelas.
2. Frontend membuat UUID `checkout_request_key` dan memanggil checkout.
3. Backend memvalidasi plan, program, kloter, kapasitas, dan user.
4. Backend membuat atau menggunakan kembali transaksi berdasarkan idempotency key.
5. Frontend membuka Snap dengan token transaksi.
6. Midtrans mengirim webhook ke backend.
7. Backend memverifikasi signature, nominal, order ID, dan transisi status.
8. Akses kelas diaktifkan atau masuk approval mentor sesuai scope.
9. Scheduler merekonsiliasi transaksi pending bila webhook terlambat.

## Environment Sandbox

```dotenv
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

Production memakai pasangan key production dan `MIDTRANS_IS_PRODUCTION=true`. Jangan mencampur server/client key sandbox dan production.

## Dashboard Midtrans

Set notification URL:

```text
https://rezawalker.web.id/payments/midtrans/notification
```

Webhook route publik sengaja tidak memakai CSRF, tetapi dilindungi signature Midtrans. Jangan menambahkan throttle Laravel agresif karena dapat menghambat retry resmi.

Finish redirect tidak boleh diarahkan ke route `user.checkout` tanpa `transactionCode`, karena route itu wajib memiliki parameter. Flow utama sudah dikendalikan callback Snap dan invoice aplikasi. Jika dashboard mewajibkan URL umum, gunakan halaman aman yang tidak membutuhkan parameter, misalnya halaman kelas user.

## Idempotensi

Frontend menyimpan `checkout_request_key` di session storage. Backend memiliki constraint dan lock sehingga klik berulang dengan key yang sama menggunakan transaksi yang sama. Ini mencegah pembuatan banyak transaksi aplikasi, tetapi Midtrans tetap dapat meminta pembayaran hanya setelah user mengonfirmasi metode pembayaran pada Snap.

Idempotensi juga diterapkan saat status masuk berulang: transaksi dikunci, transisi status divalidasi, dan aktivasi subscription tidak digandakan.

## Validasi Webhook

Urutan keamanan:

1. Ambil `order_id`, `status_code`, `gross_amount`, dan `signature_key`.
2. Hitung SHA-512 `order_id + status_code + gross_amount + server_key`.
3. Bandingkan dengan `hash_equals`.
4. Cari transaksi berdasarkan kode.
5. Pastikan payload dan nominal sama dengan transaksi.
6. Map status secara fail-closed.
7. Jalankan perubahan dan aktivasi dalam transaksi database.

Mapping utama:

```text
capture + accept     -> success
capture + challenge  -> pending
capture + deny       -> failed
capture + unknown    -> pending
settlement           -> success
pending/authorize    -> pending
deny/failure         -> failed
cancel               -> canceled
expire               -> expired
refund/chargeback    -> refunded
unknown              -> pending
```

Status tidak dikenal tidak boleh mengaktifkan akses.

## Reconciliation

Command:

```bash
php artisan payments:reconcile-pending --hours=48
```

Scheduler menjalankannya setiap 10 menit dengan `withoutOverlapping`. Reconciliation adalah reliability layer; mapping webhook aman tidak boleh menunggu scheduler selesai dibuat.

## Cancel dan Refund

- User hanya dapat membatalkan transaksi Midtrans miliknya yang masih pending.
- Pembatalan memanggil API Midtrans dan menyelaraskan status resmi jika API cancel gagal.
- Refund/chargeback membatalkan hanya subscription terkait transaksi.
- Penolakan enrollment kelas mentor tidak otomatis melakukan refund finansial; superadmin harus memproses refund melalui Midtrans dan mencatatnya.

## Email Invoice

Invoice `PurchaseReceiptNotification` dipicu ketika status pertama kali berubah menjadi `success`. Kelas mentor dapat tetap menunggu approval walaupun pembayaran sukses; isi invoice harus membedakan status pembayaran dan status akses.

## Test Wajib

- signature invalid menghasilkan 403;
- nominal atau order ID berbeda tidak mengaktifkan akses;
- semua kombinasi capture/fraud status;
- callback sukses berulang tidak membuat subscription ganda;
- klik checkout berulang memakai transaksi yang sama;
- sync hanya membaca transaksi milik user;
- cancel pending dan callback terlambat;
- settlement kelas mandiri langsung aktif;
- settlement kelas mentor menjadi `paid_pending_approval`;
- reconciliation mengubah pending sesuai status resmi.
