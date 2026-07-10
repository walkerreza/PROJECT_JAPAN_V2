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
    name: 'Bagaimana pembayaran diproses?',
    desc: 'Pembayaran diproses melalui Midtrans sandbox pada fase development. Setelah pembayaran berhasil, akses belajar aktif otomatis.',
  },
  {
    name: 'Apakah access key masih bisa digunakan?',
    desc: 'Bisa. Access key dipindahkan ke menu Profil agar dashboard awal tetap fokus pada aktivitas belajar.',
  },
  {
    name: 'Apakah paket membuka modul dan kuis?',
    desc: 'Ya. Paket membuka konten yang dikunci sesuai cakupan paket, termasuk modul mingguan, flashcard, dan kuis terkait.',
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

  const paidPlans = useMemo(() => paymentPlans.filter((plan) => Number(plan.price) > 0), [paymentPlans]);
  const primaryPaidPlan = paidPlans[0] || null;

  const startCheckout = async (plan) => {
    setCheckoutError('');

    if (!auth?.user) {
      window.location.href = route('register');
      return;
    }

    try {
      setCheckoutPlanId(plan.id);
      const response = await window.axios.post(route('payments.midtrans.checkout'), {
        payment_plan_id: plan.id,
      });

      window.sessionStorage?.setItem(
        `midtrans:${response.data.transaction_code}`,
        JSON.stringify({
          snapToken: response.data.snap_token,
          redirectUrl: response.data.redirect_url,
        }),
      );

      window.location.href = route('user.checkout', response.data.transaction_code);
    } catch (error) {
      setCheckoutError(error.response?.data?.message || error.message || 'Gagal memulai pembayaran Midtrans.');
    } finally {
      setCheckoutPlanId(null);
    }
  };

  return (
    <>
      <Head title="Harga - Japanlingo" />
      <GuestNavbar />

      <section className="px-6 lg:px-20 py-16 lg:py-20 bg-gradient-to-br from-white via-white to-red-50 text-center">
        <Badge color="red" className="mb-4">Paket Harga</Badge>
        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
          Kuasai Bahasa Jepang dengan <span className="text-red-600">Paket yang Tepat</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Pilih akses belajar yang sesuai. Paket membuka modul, kuis, flashcard, dan progress belajar yang lebih lengkap.
        </p>
      </section>

      <section className="px-6 lg:px-20 py-16 lg:py-20">
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-6xl mx-auto">
          <div className="relative rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex-1 max-w-sm bg-white border-gray-200">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Dasar</h3>
            <p className="text-sm mb-5 text-gray-500">Coba preview materi dan kuis Week 1.</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-gray-900">Preview Week 1</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="text-base text-green-500">?</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" href="/register" className="w-full">Mulai Preview Gratis</Button>
          </div>

          {(paidPlans.length ? paidPlans : [primaryPaidPlan]).filter(Boolean).map((plan, index) => {
            const features = Array.isArray(plan.features) && plan.features.length ? plan.features : fallbackPaidFeatures;
            const highlighted = index === 0;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex-1 max-w-sm ${highlighted
                  ? 'bg-gray-900 text-white border-gray-800 shadow-2xl z-10 scale-[1.03]'
                  : 'bg-white border-gray-200'
                  }`}
              >
                {highlighted && (
                  <Badge color="yellow" className="absolute -top-3 left-1/2 -translate-x-1/2">PALING POPULER</Badge>
                )}
                <h3 className={`text-xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-2 ${highlighted ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description || 'Akses belajar Japanlingo.'}</p>
                <p className={`mb-5 inline-flex rounded-full px-3 py-1 text-xs font-black ${highlighted ? 'bg-white/10 text-white' : 'bg-red-50 text-red-600'}`}>
                  {plan.scope_label || 'Semua kelas'}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-black ${highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price_formatted}</span>
                </div>
                <p className="text-xs text-gray-400 mb-5">Aktif {formatDuration(plan.duration_days)}</p>
                <ul className="space-y-3 mb-8">
                  {features.map((feature) => (
                    <li key={feature} className={`flex items-center gap-2.5 text-sm ${highlighted ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="text-base text-green-400">?</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => startCheckout(plan)}
                  disabled={checkoutPlanId === plan.id}
                  className={`w-full rounded-xl px-5 py-3 text-sm font-black transition-colors disabled:opacity-60 ${highlighted ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'}`}
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

      <section className="px-6 lg:px-20 py-20 lg:py-32 bg-[#F9FAFB]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <Badge color="red" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4 tracking-tight">
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
                  <button className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none" onClick={() => setOpenFaq(isOpen ? null : i)}>
                    <span className={`font-bold transition-colors ${isOpen ? 'text-red-600' : 'text-gray-900'}`}>{faq.name}</span>
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xl font-light leading-none ${isOpen ? 'bg-red-600 text-white rotate-[135deg]' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>+</span>
                  </button>
                  <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-6 pt-2 text-gray-500 leading-relaxed border-t border-gray-50 mx-6">{faq.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 py-16 lg:py-20">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl px-6 lg:px-16 py-14 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-3">Mulai belajar secara gratis hari ini</h2>
          <p className="text-red-100 max-w-lg mx-auto mb-8">Akun gratis bisa mencoba modul dan kuis Week 1. Upgrade akses untuk membuka Week berikutnya.</p>
          <Button href="/register" className="!bg-white !text-red-600 hover:!bg-gray-100" size="lg">Mulai Preview Gratis</Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
