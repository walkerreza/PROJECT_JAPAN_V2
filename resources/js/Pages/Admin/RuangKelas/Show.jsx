import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import LiveClassRoom from '@/Components/Features/Presentation/LiveClassRoom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-orange-950/50';

const nextHourInputValue = () => {
    const value = new Date(Date.now() + (60 * 60 * 1000));
    value.setMinutes(0, 0, 0);
    return new Date(value.getTime() - (value.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
};

function SelectionRow({ selected, title, meta, badge, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                selected
                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/25'
                    : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-600 dark:hover:bg-gray-800'
            }`}
        >
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-orange-600' : 'border-gray-300 dark:border-gray-600'}`}>
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{title}</span>
                {meta && <span className="mt-0.5 block truncate text-xs font-medium text-gray-500 dark:text-gray-400">{meta}</span>}
            </span>
            {badge && <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{badge}</span>}
        </button>
    );
}

function RoomSetup({ setup, storeEndpoint, exitUrl }) {
    const [deckSearch, setDeckSearch] = useState('');
    const form = useForm({
        kloter_belajar_id: setup.kloters.length === 1 ? String(setup.kloters[0].id) : '',
        presentation_deck_id: '',
        scheduled_at: nextHourInputValue(),
    });

    const selectedKloter = setup.kloters.find((kloter) => String(kloter.id) === String(form.data.kloter_belajar_id));
    const selectedDeck = setup.decks.find((deck) => String(deck.id) === String(form.data.presentation_deck_id));
    const filteredDecks = useMemo(() => {
        const query = deckSearch.trim().toLowerCase();
        if (!query) return setup.decks;

        return setup.decks.filter((deck) => [deck.title, deck.module?.title, `minggu ${deck.module?.week_number || ''}`]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query)));
    }, [deckSearch, setup.decks]);

    const submit = (action) => {
        form.transform((data) => ({ ...data, action }));
        form.post(storeEndpoint);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Ruang Kelas - ${setup.program.title}`} />

            <main className="min-h-screen bg-gray-50 px-4 py-5 dark:bg-gray-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <Link href={exitUrl} className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-orange-600 dark:text-gray-300">
                        <ArrowBackIcon sx={{ fontSize: 18 }} />
                        Kembali ke kelas
                    </Link>

                    <header className="mt-5 border-b border-gray-200 pb-5 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-600 text-white">
                                <VideoCameraFrontIcon sx={{ fontSize: 22 }} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase text-orange-600">Ruang Kelas</p>
                                <h1 className="truncate text-xl font-black text-gray-950 dark:text-white sm:text-2xl">Siapkan sesi {setup.program.title}</h1>
                            </div>
                        </div>
                        <p className="mt-3 max-w-2xl text-sm font-medium text-gray-600 dark:text-gray-400">Tentukan peserta dan materi. Pemeriksaan kamera serta mikrofon dilakukan di lobby berikutnya.</p>
                    </header>

                    <form onSubmit={(event) => event.preventDefault()} className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-8">
                            <section aria-labelledby="kloter-title">
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-900 text-xs font-black text-white dark:bg-white dark:text-gray-950">1</span>
                                    <div>
                                        <h2 id="kloter-title" className="text-sm font-black text-gray-950 dark:text-white">Pilih kloter</h2>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Siswa dalam kloter ini akan melihat sesi di roadmap.</p>
                                    </div>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {setup.kloters.map((kloter) => (
                                        <SelectionRow
                                            key={kloter.id}
                                            selected={String(form.data.kloter_belajar_id) === String(kloter.id)}
                                            title={kloter.nama}
                                            meta="Kloter aktif"
                                            badge={kloter.kode}
                                            onClick={() => form.setData('kloter_belajar_id', String(kloter.id))}
                                        />
                                    ))}
                                </div>
                                    {form.errors.kloter_belajar_id && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.kloter_belajar_id}</p>}
                                {setup.kloters.length === 0 && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                        Belum ada kloter aktif yang dapat dipilih untuk kelas ini.
                                    </div>
                                )}
                            </section>

                            <section aria-labelledby="materi-title">
                                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-900 text-xs font-black text-white dark:bg-white dark:text-gray-950">2</span>
                                        <div>
                                            <h2 id="materi-title" className="text-sm font-black text-gray-950 dark:text-white">Pilih tampilan awal</h2>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mulai dengan papan tulis atau presentasi yang sudah dibuat.</p>
                                        </div>
                                    </div>
                                    {setup.decks.length > 4 && (
                                        <input
                                            type="search"
                                            value={deckSearch}
                                            onChange={(event) => setDeckSearch(event.target.value)}
                                            placeholder="Cari presentasi"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white sm:w-56"
                                        />
                                    )}
                                </div>

                                <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
                                    <SelectionRow
                                        selected={form.data.presentation_deck_id === ''}
                                        title="Papan tulis kosong"
                                        meta="Mulai tanpa slide dan tulis langsung saat mengajar"
                                        badge="Kosong"
                                        onClick={() => form.setData('presentation_deck_id', '')}
                                    />
                                    {filteredDecks.map((deck) => (
                                        <SelectionRow
                                            key={deck.id}
                                            selected={String(form.data.presentation_deck_id) === String(deck.id)}
                                            title={deck.title}
                                            meta={`Minggu ${deck.module?.week_number || '-'}${deck.module?.title ? ` - ${deck.module.title}` : ''}`}
                                            badge={`${deck.slides_count || 0} slide`}
                                            onClick={() => form.setData('presentation_deck_id', String(deck.id))}
                                        />
                                    ))}
                                    {filteredDecks.length === 0 && (
                                        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">Presentasi tidak ditemukan.</p>
                                    )}
                                </div>
                                    {form.errors.presentation_deck_id && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.presentation_deck_id}</p>}
                            </section>

                            <section aria-labelledby="jadwal-title">
                                <div className="mb-3 flex items-center gap-3">
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-900 text-xs font-black text-white dark:bg-white dark:text-gray-950">3</span>
                                    <div>
                                        <h2 id="jadwal-title" className="text-sm font-black text-gray-950 dark:text-white">Jadwalkan untuk nanti</h2>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Lewati bagian ini bila kelas akan dimulai sekarang.</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                    <label className="block">
                                        <span className="mb-1.5 block text-xs font-bold text-gray-600 dark:text-gray-300">Tanggal dan waktu</span>
                                    <input
                                        type="datetime-local"
                                        value={form.data.scheduled_at}
                                        min={new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)}
                                        onChange={(event) => form.setData('scheduled_at', event.target.value)}
                                        className={inputClass}
                                    />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => submit('schedule')}
                                        disabled={form.processing || !form.data.kloter_belajar_id || !form.data.scheduled_at}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    >
                                        <CalendarMonthIcon sx={{ fontSize: 18 }} />
                                        Simpan jadwal
                                    </button>
                                </div>
                                {form.errors.scheduled_at && <p className="mt-2 text-xs font-bold text-red-600">{form.errors.scheduled_at}</p>}
                            </section>

                            {Object.keys(form.errors).some((key) => !['kloter_belajar_id', 'presentation_deck_id', 'scheduled_at'].includes(key)) && (
                                <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/30 dark:text-red-300">{Object.values(form.errors)[0]}</p>
                            )}
                        </div>

                        <aside className="lg:sticky lg:top-6 lg:self-start">
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                                    <SlideshowIcon className="text-orange-600" sx={{ fontSize: 20 }} />
                                    <h2 className="text-sm font-black text-gray-950 dark:text-white">Ringkasan sesi</h2>
                                </div>

                                <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                                    <div className="py-3">
                                        <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">Kelas</dt>
                                        <dd className="mt-1 font-bold text-gray-900 dark:text-white">{setup.program.title}</dd>
                                    </div>
                                    <div className="py-3">
                                        <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">Kloter</dt>
                                        <dd className={`mt-1 font-bold ${selectedKloter ? 'text-gray-900 dark:text-white' : 'text-amber-600'}`}>{selectedKloter ? `${selectedKloter.nama} (${selectedKloter.kode})` : 'Belum dipilih'}</dd>
                                    </div>
                                    <div className="py-3">
                                        <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">Tampilan awal</dt>
                                        <dd className="mt-1 font-bold text-gray-900 dark:text-white">{selectedDeck?.title || 'Papan tulis kosong'}</dd>
                                    </div>
                                </dl>

                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => submit('start')}
                                        disabled={form.processing || !form.data.kloter_belajar_id}
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-black text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:ring-offset-gray-900"
                                    >
                                        <PlayArrowIcon sx={{ fontSize: 20 }} />
                                        {form.processing ? 'Menyiapkan...' : 'Lanjut ke lobby'}
                                    </button>
                                    <p className="mt-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Kamera dan mikrofon belum aktif pada tahap ini.</p>
                                </div>
                            </div>
                        </aside>
                    </form>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}

function ScheduledRoom({ session, startEndpoint, cancelEndpoint, exitUrl }) {
    const action = useForm({});
    const scheduledAt = session.scheduled_at
        ? new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short',
        }).format(new Date(session.scheduled_at))
        : 'Waktu belum ditentukan';

    const cancel = () => {
        if (!window.confirm('Batalkan jadwal kelas ini?')) return;
        action.delete(cancelEndpoint);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Jadwal Kelas - ${session.program.title}`} />
            <main className="grid min-h-[calc(100dvh-4rem)] place-items-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
                <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="bg-gray-950 px-6 py-7 text-white">
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-600">
                            <CalendarMonthIcon sx={{ fontSize: 25 }} />
                        </span>
                        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-orange-400">Kelas Terjadwal</p>
                        <h1 className="mt-1 text-2xl font-black">{session.program.title}</h1>
                        <p className="mt-2 text-sm font-semibold text-gray-300">{session.kloter.nama} · {session.mentor.username}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Waktu mulai</p>
                        <p className="mt-1 text-lg font-black text-gray-900 dark:text-white">{scheduledAt}</p>
                        <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
                            {session.deck?.title ? `Materi: ${session.deck.title}` : 'Mode papan tulis kosong'}
                        </p>

                        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
                            <button
                                type="button"
                                onClick={() => action.post(startEndpoint)}
                                disabled={action.processing}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-50"
                            >
                                <PlayArrowIcon sx={{ fontSize: 20 }} /> Mulai Kelas
                            </button>
                            <button
                                type="button"
                                onClick={cancel}
                                disabled={action.processing}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/30"
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 19 }} /> Batal
                            </button>
                        </div>
                        <Link href={exitUrl} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-orange-600 dark:text-gray-400">
                            <ArrowBackIcon sx={{ fontSize: 17 }} /> Kembali ke kelas
                        </Link>
                    </div>
                </section>
            </main>
        </AuthenticatedLayout>
    );
}

export default function Show(props) {
    if (!props.session) {
        return <RoomSetup setup={props.setup} storeEndpoint={props.storeEndpoint} exitUrl={props.exitUrl} />;
    }

    if (props.session.status !== 'live') {
        return <ScheduledRoom {...props} />;
    }

    return (
        <>
            <Head title={`Ruang Kelas - ${props.session.program.title}`} />
            <LiveClassRoom {...props} role="mentor" deck={props.session.deck} />
        </>
    );
}
