import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import theme from '@/Components/theme/themes';

const loadSnapScript = (midtrans) => new Promise((resolve, reject) => {
  if (window.snap) {
    resolve();
    return;
  }

  if (!midtrans?.clientKey) {
    reject(new Error('Midtrans client key belum dikonfigurasi.'));
    return;
  }

  const existing = document.getElementById('midtrans-snap-script');
  if (existing) {
    existing.addEventListener('load', resolve, { once: true });
    existing.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = 'midtrans-snap-script';
  script.src = midtrans.isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
  script.setAttribute('data-client-key', midtrans.clientKey);
  script.onload = resolve;
  script.onerror = reject;
  document.body.appendChild(script);
});

const statusText = {
  pending: 'Menunggu pembayaran',
  success: 'Pesanan selesai',
  failed: 'Pembayaran gagal',
  expired: 'Pembayaran kedaluwarsa',
  canceled: 'Pembayaran dibatalkan',
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export default function Checkout({ transaction, midtrans }) {
  const [status, setStatus] = useState(transaction.status);
  const [snapToken, setSnapToken] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [kloter, setKloter] = useState(transaction.kloter || null);

  const isDone = status === 'success';
  const isPending = status === 'pending';
  const storageKey = `midtrans:${transaction.transaction_code}`;

  const savedPayment = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage?.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  }, [storageKey]);

  useEffect(() => {
    if (savedPayment?.snapToken) {
      setSnapToken(savedPayment.snapToken);
    }
  }, [savedPayment?.snapToken]);

  const syncStatus = async (successMessage = '') => {
    setError('');
    setIsSyncing(true);

    try {
      const response = await window.axios.post(route('payments.midtrans.sync', transaction.transaction_code));
      const nextStatus = response.data?.status || status;
      setStatus(nextStatus);

      if (nextStatus === 'success' || response.data?.is_premium) {
        setKloter(response.data?.kloter || null);
        window.sessionStorage?.removeItem(storageKey);
        setNotice(successMessage || 'Pembayaran berhasil divalidasi. Pesanan selesai dan akses belajar sudah aktif.');
        router.reload({ only: ['auth'] });
        return;
      }

      if (nextStatus === 'pending') {
        setNotice('Pembayaran masih pending. Jika sudah membayar QRIS/VA, tunggu sebentar lalu validasi lagi.');
        return;
      }

      setError('Status pembayaran belum berhasil. Silakan coba ulang pembayaran atau hubungi admin.');
    } catch (syncError) {
      setError(syncError.response?.data?.message || 'Gagal validasi status pembayaran.');
    } finally {
      setIsSyncing(false);
    }
  };

  const prepareSnapToken = async () => {
    if (snapToken) return snapToken;

    const response = await window.axios.post(route('payments.midtrans.snap', transaction.transaction_code));
    setSnapToken(response.data.snap_token);
    window.sessionStorage?.setItem(storageKey, JSON.stringify({
      snapToken: response.data.snap_token,
      redirectUrl: response.data.redirect_url,
    }));
    return response.data.snap_token;
  };

  const openMidtrans = async () => {
    setError('');
    setNotice('');
    setIsOpening(true);

    try {
      await loadSnapScript(midtrans);
      const token = await prepareSnapToken();

      window.snap.pay(token, {
        onSuccess: async () => syncStatus('Pembayaran berhasil. Pesanan selesai dan akses belajar sudah aktif.'),
        onPending: async () => syncStatus(),
        onError: () => setError('Pembayaran gagal diproses. Silakan buka Midtrans lagi.'),
        onClose: () => setNotice('Popup pembayaran ditutup. Kamu bisa membuka Midtrans lagi dari tombol di bawah.'),
      });
    } catch (openError) {
      setError(openError.response?.data?.message || openError.message || 'Gagal membuka Midtrans.');
    } finally {
      setIsOpening(false);
    }
  };

  if (isDone) {
    return (
      <>
        <Head title="Pembayaran Selesai - Japanlingo" />

        <main className="min-h-screen bg-[#fbfcfe] px-5 py-8 text-gray-900 sm:px-8">
          <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50"
              >
                <motion.svg
                  viewBox="0 0 96 96"
                  className="h-20 w-20"
                  aria-hidden="true"
                >
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="34"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="6"
                    initial={{ pathLength: 0, opacity: 0.3 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <motion.path
                    d="M32 49.5 43.5 61 65 37"
                    fill="none"
                    stroke="#16a34a"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.28, duration: 0.42, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-green-600">Payment Success</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
                  Pembayaran selesai
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-gray-500 sm:text-base">
                  Akses belajar sudah aktif. Simpan invoice ini sebagai bukti pembayaran.
                </p>
                {kloter ? (
                  <div className="mx-auto mt-5 max-w-xl border-y border-green-100 py-4 text-sm font-bold text-green-700">
                    Kamu masuk ke kloter {kloter.nama}. Mulai {kloter.tanggal_mulai_label || '-'}
                    {kloter.admin_name ? ` bersama ${kloter.admin_name}` : ''}.
                  </div>
                ) : (
                  <div className="mx-auto mt-5 max-w-xl border-y border-amber-100 py-4 text-sm font-bold text-amber-700">
                    Akses aktif, tetapi akun ini belum masuk kloter. Superadmin bisa menempatkan akun ke kloter belajar.
                  </div>
                )}
                <p className="mt-7 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl">
                  {transaction.amount_formatted}
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-10 w-full text-left"
            >
              <button
                type="button"
                onClick={() => setInvoiceOpen((open) => !open)}
                className="flex w-full items-center justify-between border-y border-gray-200 py-5 text-left transition hover:border-gray-300"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Invoice</p>
                  <h2 className="mt-2 text-lg font-black text-gray-950 sm:text-xl">#{transaction.transaction_code}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Status</p>
                    <p className="mt-2 text-sm font-black text-green-600">Lunas</p>
                  </div>
                  <KeyboardArrowDownIcon
                    className={`text-gray-400 transition-transform ${invoiceOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {invoiceOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-gray-100">
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Paket</p>
                        <p className="text-sm font-black text-gray-900">{transaction.payment_plan?.name || 'Akses Japanlingo'}</p>
                      </div>
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Akses</p>
                        <p className="text-sm font-black text-gray-900">{transaction.scope_label || 'Semua kelas'}</p>
                      </div>
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Kloter</p>
                        <p className="text-sm font-black text-gray-900">{kloter?.nama || 'Menunggu penempatan kloter'}</p>
                      </div>
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Deskripsi</p>
                        <p className="text-sm font-semibold leading-6 text-gray-600">
                          {transaction.payment_plan?.description || 'Akses untuk membuka konten belajar lanjutan.'}
                        </p>
                      </div>
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Tanggal</p>
                        <p className="text-sm font-semibold text-gray-700">{formatDate(transaction.processed_at || transaction.created_at)}</p>
                      </div>
                      <div className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                        <p className="text-sm font-bold text-gray-400">Total</p>
                        <p className="text-xl font-black text-gray-950">{transaction.amount_formatted}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="mt-10 flex w-full flex-col gap-3 sm:flex-row"
            >
              <Link
                href={route('user.dashboard')}
                className={`inline-flex h-13 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r ${theme.ctaBg} px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:brightness-95`}
              >
                Kembali ke Dashboard
              </Link>
              <Link
                href={route('user.kelas.index')}
                className="inline-flex h-13 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:-translate-y-0.5 hover:bg-gray-50"
              >
                Lanjut ke Kelas
              </Link>
            </motion.div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head title={`Checkout ${transaction.transaction_code} - Japanlingo`} />

      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#fee2e2_0,transparent_34%),linear-gradient(135deg,#fff_0%,#f8fafc_45%,#fff7ed_100%)] px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-2xl shadow-red-900/10 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative flex min-h-[620px] flex-col justify-between overflow-hidden bg-gray-950 p-7 text-white sm:p-10">
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.ctaBg} opacity-95`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22px_22px,rgba(255,255,255,0.20)_2px,transparent_3px)] bg-[length:32px_32px] opacity-35" />
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                  <WorkspacePremiumIcon sx={{ fontSize: 16 }} />
                  Checkout Akses
                </div>
                <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
                  {isDone ? 'Pembayaran berhasil.' : 'Selesaikan pembayaran akses belajar.'}
                </h1>
                <p className="mt-4 max-w-lg text-sm font-semibold leading-7 text-white/78">
                  {isDone
                    ? 'Akses belajar sudah aktif. Kamu bisa kembali ke dashboard dan lanjut belajar.'
                    : 'Pilih metode pembayaran di Midtrans. Setelah selesai, validasi status pesanan di halaman ini.'}
                </p>
              </div>

              <AnimatePresence>
                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.84, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                    className="relative my-10 flex justify-center"
                  >
                    <div className="relative">
                      {[0, 1, 2].map((ring) => (
                        <motion.span
                          key={ring}
                          className="absolute inset-0 rounded-full border border-white/40"
                          initial={{ scale: 0.7, opacity: 0.9 }}
                          animate={{ scale: 1.55 + ring * 0.24, opacity: 0 }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            delay: ring * 0.25,
                            ease: 'easeOut',
                          }}
                        />
                      ))}
                      <motion.div
                        initial={{ rotate: -16 }}
                        animate={{ rotate: 0 }}
                        className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white text-green-600 shadow-2xl shadow-black/20"
                      >
                        <CheckCircleIcon sx={{ fontSize: 72 }} />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Order ID</p>
                  <p className="mt-2 break-all text-sm font-black">#{transaction.transaction_code}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Total</p>
                  <p className="mt-2 text-2xl font-black">{transaction.amount_formatted}</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Status pesanan</p>
                  <h2 className="mt-2 text-2xl font-black">{statusText[status] || status}</h2>
                </div>
                <motion.div
                  animate={isDone ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ repeat: isDone ? Infinity : 0, duration: 1.8 }}
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}
                >
                  {isDone ? <CheckCircleIcon sx={{ fontSize: 34 }} /> : <CreditCardIcon sx={{ fontSize: 32 }} />}
                </motion.div>
              </div>

              <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm">
                    <ReceiptLongIcon />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{transaction.payment_plan?.name || 'Akses Japanlingo'}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wider text-red-500">
                      {transaction.scope_label || 'Semua kelas'}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
                      {transaction.payment_plan?.description || 'Akses untuk membuka konten belajar lanjutan.'}
                    </p>
                    <p className="mt-3 text-xs font-bold text-gray-400">Dibuat: {formatDate(transaction.created_at)}</p>
                  </div>
                </div>
              </div>

              {(notice || error) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-5 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${error ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'}`}
                >
                  {error ? <ErrorOutlineIcon sx={{ fontSize: 20 }} /> : <CheckCircleIcon sx={{ fontSize: 20 }} />}
                  <span>{error || notice}</span>
                </motion.div>
              )}

              <div className="mt-8 space-y-3">
                {isPending && (
                  <button
                    type="button"
                    onClick={openMidtrans}
                    disabled={isOpening}
                    className={`inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${theme.ctaBg} px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <OpenInNewIcon sx={{ fontSize: 19 }} />
                    {isOpening ? 'Membuka Midtrans...' : 'Buka Pembayaran Midtrans'}
                  </button>
                )}

                {!isDone && (
                  <button
                    type="button"
                    onClick={() => syncStatus()}
                    disabled={isSyncing}
                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:-translate-y-0.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HourglassTopIcon sx={{ fontSize: 19 }} />
                    {isSyncing ? 'Memvalidasi...' : 'Validasi Status Pembayaran'}
                  </button>
                )}

                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Link
                      href={route('user.dashboard')}
                      className={`inline-flex h-13 items-center justify-center rounded-2xl bg-gradient-to-r ${theme.ctaBg} px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:brightness-95`}
                    >
                      Kembali ke Dashboard
                    </Link>
                    <Link
                      href={route('user.kelas.index')}
                      className="inline-flex h-13 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-black text-gray-800 transition hover:-translate-y-0.5 hover:bg-gray-50"
                    >
                      Lanjut ke Kelas
                    </Link>
                  </motion.div>
                )}
              </div>

              <p className="mt-6 text-center text-xs font-semibold leading-5 text-gray-400">
                Jangan tutup halaman ini sebelum status tervalidasi jika kamu sedang melakukan demo pembayaran.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
