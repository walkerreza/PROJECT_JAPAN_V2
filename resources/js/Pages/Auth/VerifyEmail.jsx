import GuestAuthLayout from '@/Components/Layout/GuestAuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const sent = status === 'verification-link-sent';

    const submit = (event) => {
        event.preventDefault();
        post(route('verification.send'), { preserveScroll: true });
    };

    return (
        <GuestAuthLayout>
            <Head title="Verifikasi Email" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="mx-auto mb-6 max-w-sm text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <MarkEmailReadOutlinedIcon sx={{ fontSize: 30 }} />
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-900">Verifikasi alamat email</h1>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                        Kami telah mengirim tautan verifikasi ke alamat email Anda. Buka email tersebut untuk mengaktifkan akun.
                    </p>
                </div>

                {sent && (
                    <div className="mb-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-700">
                        Tautan verifikasi baru sudah dikirim. Periksa kotak masuk dan folder spam Anda.
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshOutlinedIcon sx={{ fontSize: 18 }} />
                        {processing ? 'Mengirim ulang...' : 'Kirim ulang tautan verifikasi'}
                    </button>
                    <p className="px-2 text-center text-xs leading-relaxed text-gray-500">
                        Tidak menerima email? Pastikan alamat email benar dan periksa folder Spam atau Promosi.
                    </p>
                </form>
            </div>

            <div className="mt-5 text-center">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-500 no-underline transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                    <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
                    Keluar dari akun
                </Link>
            </div>
        </GuestAuthLayout>
    );
}
