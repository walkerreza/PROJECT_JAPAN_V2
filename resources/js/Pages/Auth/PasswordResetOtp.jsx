import GuestAuthLayout from '@/Components/Layout/GuestAuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import ReplayIcon from '@mui/icons-material/Replay';
import { useEffect, useMemo, useState } from 'react';

const RESEND_SECONDS = 60;

const remainingSeconds = (sentAt) => {
    if (!sentAt) return 0;

    return Math.max(0, Math.ceil((new Date(sentAt).getTime() + (RESEND_SECONDS * 1000) - Date.now()) / 1000));
};

export default function PasswordResetOtp({ mode, email = '', status, sentAt = null }) {
    const [now, setNow] = useState(Date.now());
    const { data, setData, post, processing, errors, clearErrors, reset } = useForm({
        email,
        otp: '',
        password: '',
        password_confirmation: '',
    });
    const secondsLeft = useMemo(() => remainingSeconds(sentAt), [sentAt, now]);

    useEffect(() => {
        setData('email', email || '');
    }, [email, setData]);

    useEffect(() => {
        if (secondsLeft === 0) return undefined;

        const interval = window.setInterval(() => setNow(Date.now()), 1000);

        return () => window.clearInterval(interval);
    }, [secondsLeft]);

    const sendOtp = (event) => {
        event?.preventDefault();
        clearErrors();
        post(route('password.email'), {
            preserveScroll: true,
        });
    };

    const submitReset = (event) => {
        event.preventDefault();
        clearErrors();
        post(route('password.store'), {
            preserveScroll: true,
            onFinish: () => reset('otp', 'password', 'password_confirmation'),
        });
    };

    const emailField = (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Alamat Email</label>
            <div className="relative">
                <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                <input
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
    );

    const isRequestMode = mode === 'request';

    return (
        <GuestAuthLayout>
            <Head title={isRequestMode ? 'Lupa Kata Sandi' : 'Verifikasi OTP'} />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <KeyIcon sx={{ fontSize: 30 }} />
                    </div>
                    <h2 className="mb-1 text-xl font-extrabold text-gray-900">
                        {isRequestMode ? 'Atur Ulang Kata Sandi' : 'Masukkan Kode OTP'}
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-500">
                        {isRequestMode
                            ? 'Masukkan email Anda untuk menerima kode OTP enam digit.'
                            : 'Masukkan kode dari email dan buat kata sandi baru.'}
                    </p>
                </div>

                {status && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{status}</div>}

                {isRequestMode ? (
                    <form onSubmit={sendOtp} className="space-y-4">
                        {emailField}
                        <button type="submit" disabled={processing} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                            Kirim Kode OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={submitReset} className="space-y-4">
                        {emailField}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Kode OTP</label>
                            <div className="relative">
                                <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={data.otp}
                                    onChange={(event) => setData('otp', event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-center font-mono text-lg font-bold tracking-[0.35em] focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                                />
                            </div>
                            {errors.otp && <p className="mt-1 text-xs text-red-600">{errors.otp}</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Kata Sandi Baru</label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20" />
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi</label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                                <input type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} autoComplete="new-password" className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20" />
                            </div>
                        </div>

                        <button type="submit" disabled={processing} className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                            Simpan Kata Sandi Baru
                        </button>
                    </form>
                )}

                {!isRequestMode && (
                    <div className="mt-5 flex flex-col items-center gap-3 text-center text-sm">
                        {secondsLeft > 0 ? (
                            <p className="text-gray-500">Kirim ulang kode dalam {secondsLeft} detik.</p>
                        ) : (
                            <button type="button" onClick={sendOtp} disabled={processing} className="inline-flex min-h-11 items-center gap-2 font-semibold text-red-600 hover:text-red-700 disabled:opacity-50">
                                <ReplayIcon sx={{ fontSize: 18 }} /> Kirim ulang kode
                            </button>
                        )}
                        <Link href={`${route('password.request')}?email=${encodeURIComponent(data.email)}`} className="font-semibold text-gray-500 no-underline hover:text-red-600">
                            Ganti alamat email
                        </Link>
                    </div>
                )}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
                Menggunakan akun Google? <Link href={route('login')} className="font-semibold text-red-600 no-underline hover:underline">Masuk dengan Google</Link>.
            </p>
        </GuestAuthLayout>
    );
}
