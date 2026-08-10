import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LiveClassRoom from '@/Components/Features/Presentation/LiveClassRoom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-orange-950/40';

function RoomSetup({ setup, storeEndpoint, exitUrl }) {
    const form = useForm({
        kloter_belajar_id: '',
        presentation_deck_id: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(storeEndpoint);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Ruang Kelas - ${setup.program.title}`} />

            <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <Link href={exitUrl} className="inline-flex items-center gap-2 text-sm font-black text-gray-600 transition hover:text-orange-600 dark:text-gray-300">
                        <ArrowBackIcon sx={{ fontSize: 18 }} />
                        Kembali ke kelas
                    </Link>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-b border-gray-100 bg-gray-950 px-5 py-6 text-white dark:border-gray-800 sm:px-7">
                            <div className="flex items-start gap-4">
                                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-600">
                                    <VideoCameraFrontIcon sx={{ fontSize: 25 }} />
                                </span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Persiapan Ruang Kelas</p>
                                    <h1 className="mt-1 text-2xl font-black sm:text-3xl">{setup.program.title}</h1>
                                    <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-300">Pilih kloter dan materi pembuka sebelum masuk ke lobby mentor.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-5">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Kloter yang diajar</span>
                                    <select
                                        value={form.data.kloter_belajar_id}
                                        onChange={(event) => form.setData('kloter_belajar_id', event.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Pilih kloter aktif</option>
                                        {setup.kloters.map((kloter) => (
                                            <option key={kloter.id} value={kloter.id}>{kloter.nama} ({kloter.kode})</option>
                                        ))}
                                    </select>
                                    {form.errors.kloter_belajar_id && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.kloter_belajar_id}</p>}
                                    {setup.kloters.length === 0 && <p className="mt-2 text-sm font-semibold text-amber-600">Belum ada kloter aktif yang kamu ampu untuk kelas ini.</p>}
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Materi awal</span>
                                    <select
                                        value={form.data.presentation_deck_id}
                                        onChange={(event) => form.setData('presentation_deck_id', event.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Papan tulis kosong</option>
                                        {setup.decks.map((deck) => (
                                            <option key={deck.id} value={deck.id}>
                                                Minggu {deck.module?.week_number || '-'} - {deck.title} ({deck.slides_count || 0} slide)
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.presentation_deck_id && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.presentation_deck_id}</p>}
                                </label>

                                {Object.keys(form.errors).some((key) => !['kloter_belajar_id', 'presentation_deck_id'].includes(key)) && (
                                    <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">{Object.values(form.errors)[0]}</p>
                                )}
                            </div>

                            <aside className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-950">
                                <div>
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-orange-600 shadow-sm dark:bg-gray-900">
                                        <SlideshowIcon sx={{ fontSize: 21 }} />
                                    </span>
                                    <h2 className="mt-4 text-base font-black text-gray-900 dark:text-white">Lobby mentor</h2>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-gray-500 dark:text-gray-400">Kamera dan mikrofon baru diperiksa setelah ruang dibuat. Siswa belum masuk sampai tautan dibagikan.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={form.processing || setup.kloters.length === 0}
                                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <PlayArrowIcon sx={{ fontSize: 20 }} />
                                    {form.processing ? 'Menyiapkan...' : 'Lanjut ke Lobby'}
                                </button>
                            </aside>
                        </form>
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}

export default function Show(props) {
    if (!props.session) {
        return <RoomSetup setup={props.setup} storeEndpoint={props.storeEndpoint} exitUrl={props.exitUrl} />;
    }

    return (
        <>
            <Head title={`Ruang Kelas - ${props.session.program.title}`} />
            <LiveClassRoom {...props} role="mentor" deck={props.session.deck} />
        </>
    );
}
