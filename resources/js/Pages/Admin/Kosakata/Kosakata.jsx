import React, { useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/UI/Card';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SearchIcon from '@mui/icons-material/Search';
import TranslateIcon from '@mui/icons-material/Translate';

const emptyForm = {
    word: '',
    reading: '',
    meaning_id: '',
    meaning_en: '',
    jlpt_level: 'N3',
    category: '',
    tags_text: '',
    example_sentence: '',
    example_reading: '',
    example_meaning: '',
    audio_url: '',
    status: 'draft',
};

const parseTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

const toForm = (item) => ({
    word: item.word || '',
    reading: item.reading || '',
    meaning_id: item.meaning_id || '',
    meaning_en: item.meaning_en || '',
    jlpt_level: item.jlpt_level || 'N3',
    category: item.category || '',
    tags_text: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    example_sentence: item.example_sentence || '',
    example_reading: item.example_reading || '',
    example_meaning: item.example_meaning || '',
    audio_url: item.audio_url || '',
    status: item.status || 'draft',
});

function Field({ label, children, wide = false }) {
    return (
        <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400">{label}</span>
            {children}
        </label>
    );
}

const inputClass = 'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-orange-900/30';

export default function Kosakata({ vocabulary = {}, filters = {} }) {
    const rows = vocabulary.data || [];
    const importInputRef = useRef(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [jlptLevel, setJlptLevel] = useState(filters.jlpt_level || 'all');
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const form = useForm(emptyForm);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        form.setData(toForm(item));
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        form.reset();
    };

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('admin.vocabulary.index'), { search, status, jlpt_level: jlptLevel }, { preserveState: true, replace: true });
    };

    const submitForm = (event) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, tags: parseTags(data.tags_text) }));

        return editing
            ? form.put(route('admin.vocabulary.update', editing.id), { preserveScroll: true, onSuccess: closeForm })
            : form.post(route('admin.vocabulary.store'), { preserveScroll: true, onSuccess: closeForm });
    };

    const importVocabulary = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const payload = new FormData();
        payload.append('import_file', file);

        router.post(route('admin.vocabulary.import'), payload, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                event.target.value = '';
            },
        });
    };

    const deleteVocabulary = (item) => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus Kosakata?',
            message: 'Kosakata ini akan dihapus dari library dan tidak bisa dipakai lagi untuk flashcard/kuis baru.',
            confirmLabel: 'Iya, Hapus',
            details: [
                { label: 'Kata', value: item.word },
                { label: 'Arti', value: item.meaning_id || item.meaning_en || '-' },
                { label: 'Level', value: item.jlpt_level || '-' },
            ],
            onConfirm: () => router.delete(route('admin.vocabulary.destroy', item.id), {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    const previewWord = form.data.word || 'Kosakata';
    const previewMeaning = form.data.meaning_id || form.data.meaning_en || 'Arti akan tampil di sini';

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Kosakata" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="relative z-20 rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm dark:border-orange-900/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Vocabulary Bank</p>
                            <h1 className="mt-1 text-3xl font-black text-gray-900 dark:text-white">Kosakata</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Input kosakata untuk library kelas, flashcard, dan kuis. Form dibuat seperti builder agar entry data lebih cepat.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateMenu(value => !value)}
                                    className="h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-colors hover:bg-red-700"
                                >
                                    Template
                                </button>
                                {showTemplateMenu && (
                                    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                        <a
                                            href={route('admin.vocabulary.template', { format: 'xlsx' })}
                                            onClick={() => setShowTemplateMenu(false)}
                                            className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                                        >
                                            Download Excel (.xlsx)
                                        </a>
                                        <a
                                            href={route('admin.vocabulary.template', { format: 'csv' })}
                                            onClick={() => setShowTemplateMenu(false)}
                                            className="block border-t border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                        >
                                            Download CSV (.csv)
                                        </a>
                                    </div>
                                )}
                            </div>
                            <input ref={importInputRef} type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={importVocabulary} />
                            <button onClick={() => importInputRef.current?.click()} className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                <FileUploadIcon sx={{ fontSize: 18 }} />
                                Import CSV/Excel
                            </button>
                            <button onClick={openCreate} className="flex h-11 items-center gap-2 rounded-2xl bg-[#E64A19] px-5 text-sm font-black text-white shadow-sm">
                                <AddIcon sx={{ fontSize: 18 }} />
                                Tambah
                            </button>
                        </div>
                    </div>
                </section>

                <Card className="shadow-sm">
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_160px_auto]">
                        <label className="flex h-11 items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-950">
                            <SearchIcon sx={{ fontSize: 18 }} className="text-gray-400" />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kata, reading, arti, kategori..." className="w-full border-0 bg-transparent text-sm font-semibold outline-none focus:ring-0 dark:text-white" />
                        </label>
                        <select value={jlptLevel} onChange={(event) => setJlptLevel(event.target.value)} className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua JLPT</option>
                            <option value="N3">N3</option>
                            <option value="N4">N4</option>
                            <option value="N5">N5</option>
                        </select>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <button className="h-11 rounded-2xl bg-gray-950 px-5 text-sm font-black text-white dark:bg-white dark:text-gray-950">Filter</button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {rows.map((item) => (
                        <article key={item.id} className="overflow-hidden rounded-[1.35rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                            <div className="relative p-5">
                                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100 dark:bg-orange-950/30" />
                                <div className="relative">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-600 dark:bg-orange-900/20">{item.jlpt_level}</span>
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === 'published' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'}`}>{item.status}</span>
                                        {item.category && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">{item.category}</span>}
                                    </div>
                                    <h2 className="mt-4 text-4xl font-black text-gray-900 dark:text-white">{item.word}</h2>
                                    <p className="mt-1 text-lg font-bold text-gray-500 dark:text-gray-400">{item.reading || '-'}</p>
                                    <p className="mt-4 rounded-2xl bg-gray-50 p-3 text-sm font-black text-gray-900 dark:bg-gray-950 dark:text-white">{item.meaning_id || item.meaning_en || 'Belum ada arti'}</p>
                                    <p className="mt-3 line-clamp-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{item.example_sentence || 'Contoh kalimat belum diisi.'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-4 dark:border-gray-800">
                                <button onClick={() => openEdit(item)} className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:text-gray-200">
                                    <EditIcon sx={{ fontSize: 16 }} />
                                    Edit
                                </button>
                                <button onClick={() => deleteVocabulary(item)} className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 px-4 py-2 text-xs font-black text-red-600 dark:border-red-900/40">
                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    Hapus
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                {rows.length === 0 && (
                    <Card>
                        <p className="text-center text-sm font-bold text-gray-500">Belum ada kosakata. Tambahkan manual atau import CSV.</p>
                    </Card>
                )}

                {vocabulary.links && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {vocabulary.links.map((link, index) => (
                            <Link key={`${link.label}-${index}`} href={link.url || '#'} preserveScroll className={`rounded-xl px-3 py-2 text-xs font-black ${link.active ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}

                {showForm && (
                    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gray-950/60 p-4 backdrop-blur-sm">
                        <div className="mx-auto my-6 max-w-6xl overflow-hidden rounded-[1.6rem] bg-white shadow-2xl dark:bg-gray-900">
                            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Vocabulary Builder</p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{editing ? 'Edit Kosakata' : 'Tambah Kosakata'}</h2>
                                </div>
                                <button onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>

                            <form onSubmit={submitForm} className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
                                <aside className="bg-gradient-to-br from-orange-500 to-rose-600 p-6 text-white">
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">Live Preview</p>
                                    <div className="mt-6 rounded-[1.4rem] bg-white/15 p-5 shadow-xl backdrop-blur">
                                        <div className="flex items-center justify-between">
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">{form.data.jlpt_level}</span>
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">{form.data.status}</span>
                                        </div>
                                        <h3 className="mt-6 text-5xl font-black">{previewWord}</h3>
                                        <p className="mt-2 text-lg font-bold text-white/75">{form.data.reading || 'reading'}</p>
                                        <p className="mt-6 rounded-2xl bg-white px-4 py-3 text-sm font-black text-orange-700">{previewMeaning}</p>
                                    </div>
                                    <p className="mt-4 text-sm font-semibold leading-relaxed text-white/75">
                                        Isi data utama dulu, lalu lengkapi contoh kalimat agar kosakata siap dipakai di flashcard dan kuis.
                                    </p>
                                </aside>

                                <div className="max-h-[78vh] overflow-y-auto p-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Field label="Kata Jepang">
                                            <input value={form.data.word} onChange={(event) => form.setData('word', event.target.value)} placeholder="Contoh: 会議" className={inputClass} />
                                        </Field>
                                        <Field label="Reading">
                                            <input value={form.data.reading} onChange={(event) => form.setData('reading', event.target.value)} placeholder="Contoh: kaigi" className={inputClass} />
                                        </Field>
                                        <Field label="Arti Indonesia">
                                            <input value={form.data.meaning_id} onChange={(event) => form.setData('meaning_id', event.target.value)} placeholder="rapat" className={inputClass} />
                                        </Field>
                                        <Field label="English Meaning">
                                            <input value={form.data.meaning_en} onChange={(event) => form.setData('meaning_en', event.target.value)} placeholder="meeting" className={inputClass} />
                                        </Field>
                                        <Field label="JLPT">
                                            <select value={form.data.jlpt_level} onChange={(event) => form.setData('jlpt_level', event.target.value)} className={inputClass}>
                                                <option value="N3">N3</option>
                                                <option value="N4">N4</option>
                                                <option value="N5">N5</option>
                                            </select>
                                        </Field>
                                        <Field label="Status">
                                            <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className={inputClass}>
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </Field>
                                        <Field label="Kategori">
                                            <input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} placeholder="noun, verb, grammar" className={inputClass} />
                                        </Field>
                                        <Field label="Tags">
                                            <input value={form.data.tags_text} onChange={(event) => form.setData('tags_text', event.target.value)} placeholder="daily, office" className={inputClass} />
                                        </Field>
                                        <Field label="Contoh Kalimat" wide>
                                            <textarea value={form.data.example_sentence} onChange={(event) => form.setData('example_sentence', event.target.value)} placeholder="Kalimat contoh dalam bahasa Jepang" className={`${inputClass} min-h-24`} />
                                        </Field>
                                        <Field label="Reading Contoh">
                                            <textarea value={form.data.example_reading} onChange={(event) => form.setData('example_reading', event.target.value)} placeholder="Reading contoh" className={`${inputClass} min-h-24`} />
                                        </Field>
                                        <Field label="Arti Contoh">
                                            <textarea value={form.data.example_meaning} onChange={(event) => form.setData('example_meaning', event.target.value)} placeholder="Arti contoh" className={`${inputClass} min-h-24`} />
                                        </Field>
                                        <Field label="Audio URL" wide>
                                            <input value={form.data.audio_url} onChange={(event) => form.setData('audio_url', event.target.value)} placeholder="Opsional" className={inputClass} />
                                        </Field>
                                    </div>

                                    {Object.values(form.errors).length > 0 && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-950/30">{Object.values(form.errors)[0]}</p>}

                                    <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-gray-100 bg-white/95 pt-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                                        <button type="button" onClick={closeForm} className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                                        <button disabled={form.processing} className="rounded-2xl bg-[#E64A19] px-6 py-3 text-sm font-black text-white disabled:opacity-50">{form.processing ? 'Menyimpan...' : 'Simpan Kosakata'}</button>
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
