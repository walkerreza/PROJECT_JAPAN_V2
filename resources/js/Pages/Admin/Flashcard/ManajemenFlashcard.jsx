import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/UI/Card';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const emptyForm = {
    title: '',
    description: '',
    level_id: '',
    module_id: '',
    status: 'draft',
};

export default function ManajemenFlashcard({ sets = {}, filters = {}, levels = [], modules = [] }) {
    const rows = sets.data || [];
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const form = useForm(emptyForm);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const openCreate = () => {
        setEditing(null);
        form.setData(emptyForm);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        form.setData({
            title: item.title || '',
            description: item.description || '',
            level_id: item.level_id || '',
            module_id: item.module_id || '',
            status: item.status || 'draft',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        form.reset();
    };

    const normalizePayload = (data) => ({
        ...data,
        level_id: data.level_id || null,
        module_id: data.module_id || null,
    });

    const submitForm = (event) => {
        event.preventDefault();
        form.transform(normalizePayload);

        return editing
            ? form.put(route('admin.flashcards.update', editing.id), { preserveScroll: true, onSuccess: closeForm })
            : form.post(route('admin.flashcards.store'), { preserveScroll: true });
    };

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('admin.flashcards.index'), { search, status }, { preserveState: true, replace: true });
    };

    const deleteSet = (item) => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus Flashcard Set?',
            message: 'Apakah kamu setuju untuk menghapus set flashcard ini?',
            confirmLabel: 'Iya, Hapus',
            details: [
                { label: 'Judul', value: item.title },
                { label: 'Jumlah kartu', value: `${item.flashcards_count || 0} kartu` },
            ],
            onConfirm: () => router.delete(route('admin.flashcards.destroy', item.id), {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Flashcard" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-600">Fast Card Builder</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Flashcard</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Buat set kartu kosakata untuk modul mingguan dan generate kuis.</p>
                    </div>
                    <button onClick={openCreate} className="h-11 rounded-xl bg-[#14B8A6] px-5 text-sm font-black text-white">Buat Set Flashcard</button>
                </div>

                <Card>
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari flashcard set..." className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <button className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-black text-white dark:bg-white dark:text-gray-900">Filter</button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {rows.map((item) => (
                        <Card key={item.id} className="h-full">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.status === 'published' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'}`}>{item.status}</span>
                                        <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-600 dark:bg-teal-900/20">{item.flashcards_count || 0} kartu</span>
                                    </div>
                                    <h2 className="mt-3 text-lg font-black text-gray-900 dark:text-white">{item.title}</h2>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description || 'Belum ada deskripsi.'}</p>
                                    <p className="mt-3 text-xs font-bold text-gray-400">{item.level?.level_name || 'General'} {item.module ? `- ${item.module.title}` : ''}</p>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-2">
                                <Link href={route('admin.flashcards.builder', item.id)} className="rounded-xl bg-teal-600 px-4 py-2 text-center text-xs font-black text-white">Builder</Link>
                                <button onClick={() => openEdit(item)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:text-gray-200">Edit</button>
                                <button onClick={() => deleteSet(item)} className="col-span-2 rounded-xl border border-red-100 px-4 py-2 text-xs font-black text-red-600 dark:border-red-900/40">Hapus</button>
                            </div>
                        </Card>
                    ))}
                </div>

                {rows.length === 0 && <Card><p className="text-center text-sm font-bold text-gray-500">Belum ada flashcard set.</p></Card>}

                {showForm && (
                    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm">
                        <div className="mx-auto my-8 max-w-3xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-600">Flashcard Set</p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{editing ? 'Edit Set' : 'Buat Set Baru'}</h2>
                                </div>
                                <button onClick={closeForm} className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">Tutup</button>
                            </div>
                            <form onSubmit={submitForm} className="space-y-4">
                                <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} placeholder="Kosakata Minggu 1" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder="Deskripsi set" className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <select value={form.data.level_id} onChange={(event) => form.setData('level_id', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="">Tanpa Level</option>
                                        {levels.map((level) => <option key={level.id} value={level.id}>{level.level_name}</option>)}
                                    </select>
                                    <select value={form.data.module_id} onChange={(event) => form.setData('module_id', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" required>
                                        <option value="">Pilih Modul</option>
                                        {modules.map((module) => <option key={module.id} value={module.id}>Week {module.week_number || '-'} - {module.title}</option>)}
                                    </select>
                                    <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                                {Object.values(form.errors).length > 0 && <p className="text-sm font-bold text-red-600">{Object.values(form.errors)[0]}</p>}
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                                    <button disabled={form.processing} className="rounded-xl bg-[#14B8A6] px-6 py-3 text-sm font-black text-white disabled:opacity-50">{form.processing ? 'Menyimpan...' : 'Simpan'}</button>
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
