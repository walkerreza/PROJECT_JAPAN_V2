import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/UI/Card';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import SlideshowIcon from '@mui/icons-material/Slideshow';

const emptyForm = {
    title: '',
    description: '',
    level_id: '',
    module_id: '',
    status: 'draft',
};

const inputClass = 'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-orange-900/30';

function Field({ label, children, wide = false }) {
    return (
        <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400">{label}</span>
            {children}
        </label>
    );
}

export default function ManajemenPresentasi({ decks = {}, filters = {}, levels = [], modules = [] }) {
    const rows = decks.data || [];
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [moduleId, setModuleId] = useState(filters.module_id || 'all');
    const form = useForm(emptyForm);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();
    const groupedRows = useMemo(() => {
        return rows.reduce((groups, deck) => {
            const module = deck.module;
            const key = module?.id ? `module-${module.id}` : 'unlinked';
            if (!groups[key]) {
                groups[key] = {
                    key,
                    label: module ? `Week ${module.week_number ?? '-'} - ${module.title}` : 'Belum dikaitkan ke week',
                    sort: module?.week_number ?? 9999,
                    rows: [],
                };
            }

            groups[key].rows.push(deck);
            return groups;
        }, {});
    }, [rows]);

    const groupedSections = useMemo(() => {
        return Object.values(groupedRows).sort((left, right) => left.sort - right.sort || left.label.localeCompare(right.label));
    }, [groupedRows]);

    const normalizePayload = (data) => ({
        ...data,
        level_id: data.level_id || null,
        module_id: data.module_id || null,
    });

    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        setShowForm(true);
    };

    const openEdit = (deck) => {
        setEditing(deck);
        form.setData({
            title: deck.title || '',
            description: deck.description || '',
            level_id: deck.level_id || '',
            module_id: deck.module_id || '',
            status: deck.status || 'draft',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        form.reset();
    };

    const submitForm = (event) => {
        event.preventDefault();
        form.transform(normalizePayload);

        return editing
            ? form.put(route('admin.presentations.update', editing.id), { preserveScroll: true, onSuccess: closeForm })
            : form.post(route('admin.presentations.store'), { preserveScroll: true });
    };

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('admin.presentations.index'), { search, status, module_id: moduleId }, { preserveState: true, replace: true });
    };

    const deleteDeck = (deck) => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus Presentasi?',
            message: 'Deck presentasi akan dihapus dari resource kelas user.',
            confirmLabel: 'Iya, Hapus',
            details: [
                { label: 'Judul', value: deck.title },
                { label: 'Slide', value: `${deck.slides_count || 0} slide` },
                { label: 'Modul', value: deck.module ? `Week ${deck.module.week_number ?? '-'} - ${deck.module.title}` : 'Belum dikaitkan' },
            ],
            onConfirm: () => router.delete(route('admin.presentations.destroy', deck.id), {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    const previewTitle = form.data.title || 'Judul Presentasi';
    const previewDescription = form.data.description || 'Deskripsi deck akan tampil di sini.';

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Presentasi" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm dark:border-orange-900/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Quizizz-style Slides</p>
                            <h1 className="mt-1 text-3xl font-black text-gray-900 dark:text-white">Presentasi</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Buat deck PPT penunjang kelas. Deck published akan tampil di resource kelas user.
                            </p>
                        </div>
                        <button onClick={openCreate} className="flex h-11 items-center gap-2 rounded-2xl bg-[#E64A19] px-5 text-sm font-black text-white shadow-sm">
                            <AddIcon sx={{ fontSize: 18 }} />
                            Buat Presentasi
                        </button>
                    </div>
                </section>

                <Card className="shadow-sm">
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_220px_auto]">
                        <label className="flex h-11 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-950">
                            <SearchIcon sx={{ fontSize: 18 }} className="text-gray-400" />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari presentasi..." className="w-full border-0 bg-transparent text-sm font-semibold outline-none focus:ring-0 dark:text-white" />
                        </label>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <select value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Week</option>
                            {modules.map((module) => (
                                <option key={module.id} value={module.id}>Week {module.week_number ?? '-'} - {module.title}</option>
                            ))}
                        </select>
                        <button className="h-11 rounded-2xl bg-gray-950 px-5 text-sm font-black text-white dark:bg-white dark:text-gray-950">Filter</button>
                    </form>
                </Card>

                <div className="space-y-6">
                    {groupedSections.map((section) => (
                        <section key={section.key} className="space-y-3">
                            <div className="flex items-center justify-between rounded-[1.2rem] border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Kelompok Presentasi</p>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">{section.label}</h2>
                                </div>
                                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 dark:bg-orange-900/25 dark:text-orange-300">{section.rows.length} deck</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                {section.rows.map((deck) => (
                                    <article key={deck.id} className="overflow-hidden rounded-[1.35rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                                        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-orange-500 to-rose-600 p-5 text-white">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18px_18px,rgba(255,255,255,0.23)_2px,transparent_3px)] bg-[length:30px_30px]" />
                                            <div className="relative flex h-full flex-col justify-between">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black ${deck.status === 'published' ? 'bg-white text-green-700' : 'bg-white/20 text-white'}`}>{deck.status}</span>
                                                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black">{deck.slides_count || 0} slide</span>
                                                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black">{deck.module ? `Week ${deck.module.week_number ?? '-'}` : 'No Week'}</span>
                                                </div>
                                                <h2 className="line-clamp-2 text-xl font-black">{deck.title}</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-5">
                                            <p className="line-clamp-2 text-sm font-semibold text-gray-500 dark:text-gray-400">{deck.description || 'Belum ada deskripsi.'}</p>
                                            <p className="text-xs font-bold text-gray-400">{deck.level?.level_name || 'General'} {deck.module ? `- ${deck.module.title}` : ''}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link href={route('admin.presentations.builder', deck.id)} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-2 text-xs font-black text-white">
                                                    <SlideshowIcon sx={{ fontSize: 16 }} />
                                                    Builder
                                                </Link>
                                                <Link href={route('admin.presentations.presenter', deck.id)} className="flex items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-2 text-xs font-black text-white dark:bg-white dark:text-gray-950">
                                                    <PlayArrowIcon sx={{ fontSize: 16 }} />
                                                    Present
                                                </Link>
                                                <button onClick={() => openEdit(deck)} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:text-gray-200">
                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                    Edit
                                                </button>
                                                <button onClick={() => deleteDeck(deck)} className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 px-4 py-2 text-xs font-black text-red-600 dark:border-red-900/40">
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {rows.length === 0 && <Card><p className="text-center text-sm font-bold text-gray-500">Belum ada presentasi.</p></Card>}

                {showForm && (
                    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gray-950/60 p-4 backdrop-blur-sm">
                        <div className="mx-auto my-6 max-w-6xl overflow-hidden rounded-[1.6rem] bg-white shadow-2xl dark:bg-gray-900">
                            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Deck Builder Setup</p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{editing ? 'Edit Presentasi' : 'Buat Presentasi Baru'}</h2>
                                </div>
                                <button onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>

                            <form onSubmit={submitForm} className="grid gap-0 lg:grid-cols-[380px_minmax(0,1fr)]">
                                <aside className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 text-white">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">Preview Deck</p>
                                    <div className="mt-6 aspect-[4/3] rounded-[1.4rem] bg-white p-5 text-gray-950 shadow-xl">
                                        <div className="flex h-full flex-col justify-between rounded-[1rem] bg-gradient-to-br from-orange-50 to-rose-50 p-5">
                                            <div className="flex items-center justify-between">
                                                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">{form.data.status}</span>
                                                <SlideshowIcon className="text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black">{previewTitle}</h3>
                                                <p className="mt-2 line-clamp-3 text-sm font-semibold text-gray-500">{previewDescription}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm font-semibold leading-relaxed text-white/75">
                                        Setelah deck dibuat, lanjutkan ke Builder untuk menambah slide, board, dan konten presentasi.
                                    </p>
                                </aside>

                                <div className="max-h-[78vh] overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Field label="Judul Deck" wide>
                                            <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} placeholder="Contoh: Week 1 - Perkenalan N3" className={inputClass} />
                                        </Field>
                                        <Field label="Deskripsi" wide>
                                            <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder="Deskripsi singkat untuk siswa/admin" className={`${inputClass} min-h-28`} />
                                        </Field>
                                        <Field label="Level">
                                            <select value={form.data.level_id} onChange={(event) => form.setData('level_id', event.target.value)} className={inputClass}>
                                                <option value="">Tanpa Level</option>
                                                {levels.map((level) => <option key={level.id} value={level.id}>{level.level_name}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Modul Mingguan">
                                            <select value={form.data.module_id} onChange={(event) => form.setData('module_id', event.target.value)} className={inputClass}>
                                                <option value="">Tanpa Modul</option>
                                                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Status">
                                            <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className={inputClass}>
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </Field>
                                    </div>

                                    {Object.values(form.errors).length > 0 && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-950/30">{Object.values(form.errors)[0]}</p>}

                                    <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-gray-100 bg-white/95 pt-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                                        <button type="button" onClick={closeForm} className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                                        <button disabled={form.processing} className="rounded-2xl bg-[#E64A19] px-6 py-3 text-sm font-black text-white disabled:opacity-50">{form.processing ? 'Menyimpan...' : 'Simpan Deck'}</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
