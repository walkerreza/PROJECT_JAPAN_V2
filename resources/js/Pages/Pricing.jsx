import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';
import GuestNavbar from '@/Components/Layout/GuestNavbar';
import Footer from '@/Components/Layout/GuestFooter';

const freeFeatures = [
  'Preview materi dan kuis Week 1',
  'Review kosakata dan flashcard',
  'Progress belajar dan leaderboard',
];

const fallbackPaidFeatures = [
  'Akses kelas belajar',
  'Kuis dan progress XP',
  'Flashcard dan review kosakata',
  'Leaderboard dan fitur gamifikasi',
];

const freq = [
  {
    name: 'Apa yang bisa saya akses dengan akun gratis?',
    desc: 'Kamu dapat mencoba preview materi dan kuis Week 1, mengulang kosakata serta flashcard, dan melihat progress belajarmu.',
  },
  {
    name: 'Bagaimana cara membeli paket?',
    desc: 'Pilih paket yang sesuai, masuk atau buat akun, lalu selesaikan pembayaran. Setelah pembayaran dikonfirmasi, akses paket aktif otomatis.',
  },
  {
    name: 'Kapan akses premium saya aktif?',
    desc: 'Akses aktif setelah status pembayaran berhasil dikonfirmasi. Kamu dapat melihat dan melanjutkan pembayaran yang masih tertunda dari Riwayat Transaksi di Profil.',
  },
  {
    name: 'Apakah masa akses setiap paket sama?',
    desc: 'Tidak selalu. Lama akses tercantum pada masing-masing paket sebelum kamu melakukan pembayaran.',
  },
  {
    name: 'Apakah saya bisa menggunakan access key?',
    desc: 'Bisa. Masukkan access key yang kamu terima melalui menu Profil untuk mengaktifkan akses yang terkait dengan kode tersebut.',
  },
];

const formatDuration = (days) => {
  if (!days) return '';
  if (days >= 365) return `${Math.round(days / 365)} tahun`;
  if (days >= 30) return `${Math.round(days / 30)} bulan`;
  return `${days} hari`;
};

export default function Pricing({ paymentPlans = [] }) {
  const { auth } = usePage().props;
  const [openFaq, setOpenFaq] = useState(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const checkoutRequestKey = (planId) => `midtrans:checkout-intent:${planId}`;

  const createCheckoutRequestKey = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : ((random & 0x3) | 0x8);

      return value.toString(16);
    });
  };

  const paidPlans = useMemo(() => paymentPlans.filter((plan) => Number(plan.price) > 0), [paymentPlans]);
  const primaryPaidPlan = paidPlans[0] || null;
  const visiblePaidPlans = paidPlans.length ? paidPlans : [primaryPaidPlan].filter(Boolean);
  const hasThreeOrMorePlans = visiblePaidPlans.length + 1 >= 3;

  const startCheckout = async (plan) => {
    setCheckoutError('');

    if (!auth?.user) {
      window.location.href = route('register');
      return;
    }

    try {
      setCheckoutPlanId(plan.id);
      const storageKey = checkoutRequestKey(plan.id);
      const requestKey = window.sessionStorage?.getItem(storageKey) || createCheckoutRequestKey();
      window.sessionStorage?.setItem(storageKey, requestKey);
      const response = await window.axios.post(route('payments.midtrans.checkout'), {
        payment_plan_id: plan.id,
        checkout_request_key: requestKey,
      });
      const transactionCode = response.data?.transaction_code;

      if (!transactionCode) {
        throw new Error('Checkout tidak mengembalikan kode transaksi. Silakan coba lagi.');
      }

      window.sessionStorage?.removeItem(storageKey);

      window.sessionStorage?.setItem(
        `midtrans:${transactionCode}`,
        JSON.stringify({
          snapToken: response.data.snap_token,
          redirectUrl: response.data.redirect_url,
        }),
      );

      window.location.href = route('user.checkout', { transactionCode });
    } catch (error) {
      if (error.response?.status === 409) {
        window.sessionStorage?.removeItem(checkoutRequestKey(plan.id));
      }

      setCheckoutError(error.response?.data?.message || error.message || 'Gagal memulai pembayaran Midtrans.');
    } finally {
      setCheckoutPlanId(null);
    }
  };

  return (
    <>
      <Head title="Harga - Japanlingo" />
      <GuestNavbar />

      <section className="px-5 sm:px-6 lg:px-20 py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-white via-white to-red-50 text-center">
        <Badge color="red" className="mb-4">Paket Harga</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
          Kuasai Bahasa Jepang dengan <span className="text-red-600">Paket yang Tepat</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
          Pilih akses belajar yang sesuai. Paket membuka modul, kuis, flashcard, dan progress belajar yang lebih lengkap.
        </p>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-20 lg:py-20">
        <div className={`mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 ${hasThreeOrMorePlans ? 'xl:grid-cols-3 xl:gap-6' : 'lg:grid-cols-2 lg:gap-6'}`}>
          <div className="relative mx-auto flex w-full max-w-md min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow sm:max-w-none sm:p-6 lg:p-7 xl:hover:shadow-lg">
            <h3 className="mb-2 break-words text-xl font-bold text-gray-900">Dasar</h3>
            <p className="mb-5 text-sm leading-6 text-gray-500">Coba preview materi dan kuis Week 1.</p>
            <div className="mb-5 flex min-w-0 items-baseline gap-1 sm:mb-6">
              <span className="break-words text-2xl font-black leading-tight text-gray-900 sm:text-4xl">Preview Week 1</span>
            </div>
            <ul className="mb-6 flex-1 space-y-2.5 sm:mb-8 sm:space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex min-w-0 items-start gap-2.5 text-sm leading-6 text-gray-700">
                  <span className="shrink-0 text-base text-green-500">?</span>
                  <span className="break-words">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" href="/register" className="min-h-12 w-full">Mulai Preview Gratis</Button>
          </div>

          {visiblePaidPlans.map((plan, index) => {
            const features = Array.isArray(plan.features) && plan.features.length ? plan.features : fallbackPaidFeatures;
            const highlighted = index === 0;

            return (
              <div
                key={plan.id}
                className={`relative mx-auto flex w-full max-w-md min-w-0 flex-col rounded-lg border p-5 shadow-sm transition-shadow sm:max-w-none sm:p-6 lg:p-7 xl:hover:shadow-lg ${highlighted
                  ? 'z-10 border-gray-800 bg-gray-900 text-white shadow-lg'
                  : 'border-gray-200 bg-white'
                  }`}
              >
                {highlighted && (
                  <Badge color="yellow" className="absolute -top-3 left-1/2 -translate-x-1/2">PALING POPULER</Badge>
                )}
                <h3 className={`mb-2 break-words text-xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`mb-3 text-sm leading-6 ${highlighted ? 'text-gray-300' : 'text-gray-500'}`}>{plan.description || 'Akses belajar Japanlingo.'}</p>
                <p className={`mb-5 inline-flex w-fit max-w-full break-words rounded-full px-3 py-1 text-xs font-black ${highlighted ? 'bg-white/10 text-white' : 'bg-red-50 text-red-600'}`}>
                  {plan.scope_label || 'Semua kelas'}
                </p>
                <div className="mb-1 flex min-w-0 items-baseline gap-1">
                  <span className={`break-words text-3xl font-black leading-tight sm:text-4xl ${highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price_formatted}</span>
                </div>
                <p className={`mb-5 text-xs ${highlighted ? 'text-gray-400' : 'text-gray-500'}`}>Aktif {formatDuration(plan.duration_days)}</p>
                <ul className="mb-6 flex-1 space-y-2.5 sm:mb-8 sm:space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className={`flex min-w-0 items-start gap-2.5 text-sm leading-6 ${highlighted ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="shrink-0 text-base text-green-400">?</span>
                      <span className="break-words">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => startCheckout(plan)}
                  disabled={checkoutPlanId === plan.id}
                  className={`min-h-12 w-full rounded-lg px-5 py-3 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${highlighted ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  {checkoutPlanId === plan.id ? 'Membuka Midtrans...' : (auth?.user ? 'Bayar' : 'Daftar untuk Akses')}
                </button>
              </div>
            );
          })}
        </div>

        {checkoutError && (
          <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
            {checkoutError}
          </p>
        )}
      </section>

      <section className="px-4 sm:px-6 lg:px-20 py-14 sm:py-20 lg:py-32 bg-[#F9FAFB]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge color="red" className="mb-4">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-gray-500">Punya pertanyaan tentang paket kami? Temukan jawabannya di sini.</p>
          </div>

          <div className="space-y-4">
            {freq.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-red-500 shadow-lg shadow-red-500/5' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <button
                    className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                  >
                    <span className={`text-sm sm:text-base font-bold transition-colors ${isOpen ? 'text-red-600' : 'text-gray-900'}`}>{faq.name}</span>
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xl font-light leading-none ${isOpen ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>{isOpen ? '-' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div id={`faq-panel-${i}`} className="transition-all duration-300 ease-in-out">
                      <div className="mx-4 border-t border-gray-50 px-0 pb-5 pt-2 text-sm sm:mx-6 sm:pb-6 text-gray-500 leading-relaxed">{faq.desc}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-20 py-12 sm:py-16 lg:py-20">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl sm:rounded-3xl px-5 sm:px-6 lg:px-16 py-10 sm:py-14 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3">Mulai belajar secara gratis hari ini</h2>
          <p className="text-sm sm:text-base text-red-100 max-w-lg mx-auto mb-8">Akun gratis bisa mencoba modul dan kuis Week 1. Upgrade akses untuk membuka Week berikutnya.</p>
          <Button href="/register" className="w-full sm:w-auto !bg-white !text-red-600 hover:!bg-gray-100" size="lg">Mulai Preview Gratis</Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
