import { Link } from '@inertiajs/react';
import fujiImage from '@/../Images/Mount-Fuji-New.jpg';

export default function GuestAuthLayout({ children }) {
    return (
        <div className="flex min-h-screen">
            <div className="relative hidden overflow-hidden bg-gradient-to-b from-red-700 via-red-800 to-red-950 p-10 lg:flex lg:w-1/2 xl:p-12">
                <img
                    src={fujiImage}
                    className="absolute inset-0 h-full w-full object-cover opacity-75"
                    alt="Mount Fuji"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/25 via-red-950/55 to-red-950/95" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-950/55 via-transparent to-transparent" />
                <div className="absolute left-10 top-20 text-[200px] font-black text-white/5 -rotate-12">文</div>
                <div className="absolute bottom-20 right-10 text-[150px] font-black text-white/5 rotate-12">語</div>

                <div className="relative z-10 flex min-h-full w-full flex-col justify-between">
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <img src="/logo.png" alt="Japanlingo" className="h-10 w-auto" />
                    </Link>

                    <div className="max-w-xl pb-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
                            JLPT N3 STRUCTURED
                        </div>
                        <h1 className="mb-5 text-4xl font-black leading-[0.95] text-white drop-shadow-xl xl:text-6xl">
                            Kuasai Bahasa Jepang<br />Satu Tingkat Setiap Waktu.
                        </h1>
                        <p className="max-w-md text-base leading-relaxed text-white/75 xl:text-lg">
                            Bergabunglah dengan komunitas Japanlingo. Pelajaran tergamifikasi yang dirancang untuk membantu Anda lulus ujian N3 dengan percaya diri.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {['A', 'B', 'C'].map((item) => (
                                <span key={item} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-800 bg-white/20 text-xs font-black text-white">{item}</span>
                            ))}
                        </div>
                        <div className="text-sm text-white/70">
                            <span className="text-amber-400">*</span> <strong className="text-white">4.9/5</strong> Rating dari komunitas kami
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-gray-50 lg:w-1/2">
                <div className="px-5 py-4 sm:p-6 lg:hidden">
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <img src="/logo.png" alt="Japanlingo" className="h-8 w-auto" />
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:px-16">
                    <div className="w-full max-w-lg">
                        {children}
                    </div>
                </div>

                <div className="flex justify-center gap-4 px-6 py-4 text-center text-xs text-gray-400">
                    <Link href="#" className="no-underline transition-colors hover:text-red-600">Kebijakan Privasi</Link>
                    <Link href="#" className="no-underline transition-colors hover:text-red-600">Syarat & Ketentuan</Link>
                </div>
            </div>
        </div>
    );
}
