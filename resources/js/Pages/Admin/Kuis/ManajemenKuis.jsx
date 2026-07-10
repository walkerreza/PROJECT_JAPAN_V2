import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const TYPE_CONFIG = {
    multiple_choice: { label: 'Pilihan Ganda', color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
    typing: { label: 'Mengetik', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
    listening: { label: 'Mendengarkan', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
};

function StatusBadge({ status }) {
    const isDraft = status === 'draft';

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${isDraft ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
            {status || 'published'}
        </span>
    );
}

function TypeBadge({ type }) {
    const config = TYPE_CONFIG[type] || { label: type || '-', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${config.color}`}>
            {config.label}
        </span>
    );
}

export default function QuizzesIndex({ quizzes, modules = [], filters = {} }) {
    const [filterModule, setFilterModule] = useState(filters?.module_id || 'all');
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const createForm = useForm({
        module_id: '',
        type: 'multiple_choice',
        time_limit: '',
        passing_score: 70,
        status: 'published',
    });

    const quizItems = quizzes?.data || quizzes || [];
    const filtered = filterModule === 'all'
        ? quizItems
        : quizItems.filter((quiz) => quiz.module?.id == filterModule);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.quizzes.index'), {
            search: searchQuery,
            module_id: filterModule === 'all' ? undefined : filterModule,
        }, { preserveState: true });
    };

    const confirmDelete = () => {
        router.delete(route('admin.quizzes.destroy', deleteConfirm.id), {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const handleCreateQuiz = (e) => {
        e.preventDefault();
        createForm.post(route('admin.quizzes.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const toggleStatus = (quiz) => {
        const nextStatus = quiz.status === 'draft' ? 'published' : 'draft';
        openConfirm({
            variant: nextStatus === 'published' ? 'success' : 'warning',
            title: nextStatus === 'published' ? 'Publish Kuis?' : 'Ubah ke Draft?',
            message: nextStatus === 'published' ? 'Kuis akan bisa diakses sesuai aturan kelas/modul.' : 'Kuis akan disembunyikan sementara dari user.',
            confirmLabel: nextStatus === 'published' ? 'Iya, Publish' : 'Iya, Draft',
            details: [
                { label: 'Modul', value: quiz.module?.title || quiz.lesson?.title || '-' },
                { label: 'Soal', value: `${quiz.question_count || 0} soal` },
            ],
            onConfirm: () => router.patch(route('admin.quizzes.status', quiz.id), {
                status: nextStatus,
            }, {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Kuis - Japanlingo" />

            <div className="min-h-screen bg-[#F8F9FB] dark:bg-gray-950">
                <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E64A19] text-white">
                                    <QuizOutlinedIcon sx={{ fontSize: 22 }} />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#E64A19]">Assessment Admin</p>
                                    <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Manajemen Kuis</h1>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filtered.length} kuis modul ditampilkan dari {quizItems.length} total data halaman ini.</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E64A19] px-5 text-sm font-black text-white shadow-sm shadow-orange-500/20 transition-colors hover:bg-[#D84315]"
                            >
                                <AddIcon sx={{ fontSize: 18 }} />
                                Buat Kuis Baru
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <form onSubmit={handleSearch} className="relative">
                                <SearchIcon sx={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari kuis atau tipe..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition focus:border-[#E64A19] focus:bg-white focus:ring-4 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:focus:bg-gray-900"
                                />
                            </form>
                            <select
                                value={filterModule}
                                onChange={(e) => {
                                    setFilterModule(e.target.value);
                                    router.get(route('admin.quizzes.index'), {
                                        search: searchQuery,
                                        module_id: e.target.value === 'all' ? undefined : e.target.value,
                                    }, { preserveState: true });
                                }}
                                className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#E64A19] focus:ring-4 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300"
                            >
                                <option value="all">Semua Modul</option>
                                {modules.map((module) => <option key={module.id} value={module.id}>Week {module.week_number || '-'} - {module.title}</option>)}
                            </select>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-black uppercase tracking-wider text-gray-400 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-4">Modul</th>
                                        <th className="px-6 py-4">Tipe</th>
                                        <th className="px-6 py-4">Soal</th>
                                        <th className="px-6 py-4">Time Limit</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filtered.map((quiz) => (
                                        <tr key={quiz.id} className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                                            <td className="px-6 py-5">
                                                <p className="font-black text-gray-900 dark:text-white">{quiz.module?.title || quiz.lesson?.title || 'Modul tidak ditemukan'}</p>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Week {quiz.module?.week_number || '-'} - Quiz #{quiz.id}</p>
                                            </td>
                                            <td className="px-6 py-5"><TypeBadge type={quiz.type} /></td>
                                            <td className="px-6 py-5 text-sm font-bold text-gray-600 dark:text-gray-300">{quiz.question_count} soal</td>
                                            <td className="px-6 py-5 text-sm font-bold text-gray-600 dark:text-gray-300">
                                                <div>{quiz.time_limit ? `${Math.floor(quiz.time_limit / 60)} menit` : 'Tanpa batas'}</div>
                                                <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Lulus {quiz.passing_score ?? 70}%</div>
                                            </td>
                                            <td className="px-6 py-5"><StatusBadge status={quiz.status} /></td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('admin.quizzes.builder', quiz.id)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-[#E64A19] transition-colors hover:border-[#E64A19] dark:border-gray-700">
                                                        Builder
                                                    </Link>
                                                    <Link href={route('admin.questions.index', { quiz_id: quiz.id })} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 dark:border-gray-700" title="Kelola Soal">
                                                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                                    </Link>
                                                    <button onClick={() => toggleStatus(quiz)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:border-[#E64A19] hover:text-[#E64A19] dark:border-gray-700 dark:text-gray-300">
                                                        {quiz.status === 'draft' ? 'Publish' : 'Draft'}
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(quiz)} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 dark:border-gray-700">
                                                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 lg:hidden">
                            {filtered.map((quiz) => (
                                <div key={quiz.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h2 className="truncate text-base font-black text-gray-900 dark:text-white">{quiz.module?.title || quiz.lesson?.title || 'Modul tidak ditemukan'}</h2>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{quiz.question_count} soal - {quiz.time_limit ? `${Math.floor(quiz.time_limit / 60)} menit` : 'Tanpa batas'} - Lulus {quiz.passing_score ?? 70}%</p>
                                        </div>
                                        <StatusBadge status={quiz.status} />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <TypeBadge type={quiz.type} />
                                    </div>
                                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                                        <Link href={route('admin.quizzes.builder', quiz.id)} className="rounded-lg bg-[#E64A19] px-3 py-2 text-xs font-black text-white">Builder</Link>
                                        <Link href={route('admin.questions.index', { quiz_id: quiz.id })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Soal</Link>
                                        <button onClick={() => toggleStatus(quiz)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">{quiz.status === 'draft' ? 'Publish' : 'Draft'}</button>
                                        <button onClick={() => setDeleteConfirm(quiz)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-black text-red-600 dark:border-red-900/40">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="px-6 py-16 text-center text-sm font-bold text-gray-400">Belum ada kuis yang cocok.</div>
                        )}
                    </section>

                    {quizzes?.links && quizzes.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {quizzes.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${link.active ? 'bg-[#E64A19] text-white shadow-md' : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'} ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                        <div className="border-b border-gray-100 p-6 dark:border-gray-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Buat Kuis Baru</h3>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Pilih modul mingguan dan tipe kuis. Soal ditambahkan lewat Builder.</p>
                        </div>
                        <form onSubmit={handleCreateQuiz} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Modul Mingguan</label>
                                <select value={createForm.data.module_id} onChange={(e) => createForm.setData('module_id', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" required>
                                    <option value="">Pilih Modul</option>
                                    {modules.map((module) => <option key={module.id} value={module.id}>Week {module.week_number || '-'} - {module.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Tipe Kuis</label>
                                <select value={createForm.data.type} onChange={(e) => createForm.setData('type', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" required>
                                    <option value="multiple_choice">Pilihan Ganda</option>
                                    <option value="typing">Mengetik</option>
                                    <option value="listening">Mendengarkan</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Batas Waktu (detik)</label>
                                <input type="number" min="0" value={createForm.data.time_limit} onChange={(e) => createForm.setData('time_limit', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="Kosongkan jika tanpa batas" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Nilai Lulus (%)</label>
                                <input type="number" min="1" max="100" value={createForm.data.passing_score} onChange={(e) => createForm.setData('passing_score', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" placeholder="Default 70" />
                                <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">Week berikutnya baru terbuka jika skor kuis mencapai nilai ini.</p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Status Publish</label>
                                <select value={createForm.data.status} onChange={(e) => createForm.setData('status', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 dark:border-gray-700 dark:text-gray-400">Batal</button>
                                <button type="submit" disabled={createForm.processing} className="h-11 flex-1 rounded-xl bg-[#E64A19] text-sm font-bold text-white">{createForm.processing ? 'Membuat...' : 'Buat Kuis'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmActionDialog
                    show
                    variant="danger"
                    title="Hapus Kuis?"
                    message="Kuis dan semua soalnya akan dihapus."
                    confirmLabel="Iya, Hapus"
                    details={[
                        { label: 'Modul', value: deleteConfirm.module?.title || deleteConfirm.lesson?.title || '-' },
                        { label: 'Soal', value: `${deleteConfirm.question_count || 0} soal` },
                    ]}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={confirmDelete}
                />
            )}
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
