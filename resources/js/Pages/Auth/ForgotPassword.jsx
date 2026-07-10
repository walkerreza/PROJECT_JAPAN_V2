import GuestAuthLayout from '@/Components/Layout/GuestAuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import KeyIcon from '@mui/icons-material/Key';
import EmailIcon from '@mui/icons-material/Email';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestAuthLayout>
            <Head title="Lupa Kata Sandi" />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                        <KeyIcon sx={{ fontSize: 32 }} />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-1">Lupa Kata Sandi?</h2>
                    <p className="text-sm text-gray-500">Tidak masalah. Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</p>
                </div>

                {status && <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-lg">{status}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Email</label>
                        <div className="relative">
                            <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 18 }} />
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                            />
                        </div>
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                    </div>

                    <button type="submit" disabled={processing} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 text-sm">
                        Kirim Tautan Atur Ulang
                    </button>
                </form>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
                Ingat kata sandi Anda? <Link href={route('login')} className="text-red-600 font-semibold no-underline hover:underline">Kembali ke login</Link>
            </p>
        </GuestAuthLayout>
    );
}
