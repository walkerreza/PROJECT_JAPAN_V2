import React, { lazy, Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const QuillEditor = lazy(() => import('@/Components/Features/Editor/QuillEditor'));

const emptyNews = {
    title: '',
    excerpt: '',
    body: '',
    status: 'draft',
    audience: 'students',
    is_pinned: false,
    published_at: '',
    starts_at: '',
    ends_at: '',
};

function statusClass(status) {
    if (status === 'Pinned') return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
    if (status === 'Published') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400';
    if (status === 'Pending') return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400';
    if (status === 'Archived') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
}

export default function Konten({
    stats = [],
    news = { data: [], links: [] },
    updates = [],
    filters = {},
}) {
    const [editingNews, setEditingNews] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [attachmentType, setAttachmentType] = useState('image');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const items = news?.data || [];

    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyNews });
    const filterForm = useForm({
        search: filters.search || '',
        status: filters.status || 'all',
        audience: filters.audience || 'all',
        pinned: filters.pinned || 'all',
    });

    const selectedNewsAttachments = useMemo(() => editingNews?.attachments || [], [editingNews]);

    const openCreate = () => {
        setEditingNews(null);
        reset();
        setShowForm(true);
        setAttachmentFile(null);
        setVideoEmbedUrl('');
        setShowPreview(false);
    };

    const openEdit = (item) => {
        setEditingNews(item);
        setData({
            title: item.title || '',
            excerpt: item.excerpt || '',
            body: item.body || '',
            status: item.raw_status || 'draft',
            audience: item.raw_audience || 'students',
            is_pinned: Boolean(item.is_pinned),
            published_at: item.published_at || '',
            starts_at: item.starts_at || '',
            ends_at: item.ends_at || '',
        });
        setShowForm(true);
        setAttachmentFile(null);
        setVideoEmbedUrl('');
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingNews(null);
        reset();
        setAttachmentFile(null);
        setVideoEmbedUrl('');
    };

    const submitNews = (e) => {
        e.preventDefault();

        if (editingNews) {
            put(route('superadmin.content.news.update', editingNews.id), {
                preserveScroll: true,
                onSuccess: closeForm,
            });
            return;
        }

        post(route('superadmin.content.news.store'), {
            preserveScroll: true,
            onSuccess: closeForm,
        });
    };

    const deleteNews = () => {
        router.delete(route('superadmin.content.news.destroy', deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        router.get(route('superadmin.content'), filterForm.data, { preserveState: true, preserveScroll: true });
    };

    const uploadAttachment = async () => {
        if (!editingNews) return;

        const formData = new FormData();
        formData.append('type', attachmentType);

        if (attachmentType === 'video_embed') {
            formData.append('video_embed_url', videoEmbedUrl);
        } else if (attachmentFile) {
            formData.append('file', attachmentFile);
        }

        await window.axios.post(route('superadmin.content.news.attachments.store', editingNews.id), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        router.reload({ only: ['news', 'updates'] });
        setAttachmentFile(null);
        setVideoEmbedUrl('');
    };

    const deleteAttachment = (attachment) => {
        if (!editingNews) return;

        openConfirm({
            variant: 'danger',
            title: 'Hapus Attachment?',
            message: 'File atau embed ini akan dilepas dari news yang sedang diedit.',
            details: [
                { label: 'News', value: editingNews.title },
                { label: 'Attachment', value: attachment.file_name || attachment.video_embed_url || `#${attachment.id}` },
            ],
            confirmLabel: 'Hapus',
            onConfirm: () => router.delete(route('superadmin.content.news.attachments.destroy', { news: editingNews.id, attachment: attachment.id }), {
                preserveScroll: true,
                onSuccess: () => router.reload({ only: ['news', 'updates'] }),
                onFinish: closeConfirm,
            }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Konten" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Konten & News Maker</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Portal berita, review status publish, dan attachment dasar untuk dashboard student.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-red-500/20 transition-colors hover:bg-red-700"
                    >
                        Buat News
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">News Maker</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Draft, pending review, publish, dan arsipkan berita platform.</p>
                            </div>

                            <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <input
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                    placeholder="Cari judul..."
                                    className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white"
                                />
                                <select value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                    <option value="all">Semua status</option>
                                    <option value="draft">Draft</option>
                                    <option value="pending">Pending</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                                <select value={filterForm.data.audience} onChange={(e) => filterForm.setData('audience', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                    <option value="all">Semua audience</option>
                                    <option value="students">Students</option>
                                    <option value="admins">Admins</option>
                                    <option value="all">All</option>
                                </select>
                                <div className="flex gap-3">
                                    <select value={filterForm.data.pinned} onChange={(e) => filterForm.setData('pinned', e.target.value)} className="h-11 flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                        <option value="all">Pinned/all</option>
                                        <option value="yes">Pinned</option>
                                        <option value="no">Non pinned</option>
                                    </select>
                                    <button className="rounded-xl bg-gray-900 px-4 text-sm font-black text-white dark:bg-white dark:text-gray-900">Filter</button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-5 space-y-4">
                            {items.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-10 text-center text-sm font-bold text-gray-400">
                                    Belum ada news.
                                </div>
                            )}

                            {items.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row">
                                        <div className="h-28 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 sm:w-40 sm:shrink-0">
                                            {item.thumbnail_url ? (
                                                <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 text-2xl font-black text-red-200 dark:from-gray-800 dark:to-gray-900 dark:text-gray-700">
                                                    JP
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white">{item.title}</h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.excerpt || item.audience}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${statusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400">{item.audience}</span>
                                                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-400">{item.attachments.length} attachment</span>
                                            </div>
                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{item.schedule}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-black text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item)}
                                                        className="rounded-lg border border-red-100 dark:border-red-900/30 px-3 py-2 text-xs font-black text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {news?.links && news.links.length > 3 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {news.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-4 py-2 text-sm font-bold ${link.active ? 'bg-red-600 text-white' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Status Konten</h2>
                            <div className="mt-4 space-y-3">
                                {[
                                    'Status pending dipakai untuk review sebelum publish.',
                                    'Upload file mendukung image dan dokumen dasar.',
                                    'Video v1 menggunakan embed URL, bukan upload file video.',
                                ].map((item) => (
                                    <div key={item} className="rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Update Terbaru</h2>
                            <div className="mt-4 space-y-3">
                                {updates.length === 0 && (
                                    <p className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-sm font-medium text-gray-400">
                                        Belum ada aktivitas konten.
                                    </p>
                                )}

                                {updates.map((item, index) => (
                                    <div key={item.id || `${item.item}-${item.by}-${item.created_at || index}`} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{item.item}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-400">{item.by}</span>
                                            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-black text-red-700 dark:text-red-400">{item.state}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {showForm && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[1000] bg-gray-950/60">
                    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-950">
                        <div className="shrink-0 border-b border-gray-100 bg-white/95 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:p-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{editingNews ? 'Edit News' : 'Buat News Baru'}</h3>
                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Workspace fullscreen untuk menulis, mengatur publikasi, dan mengelola media berita.</p>
                        </div>

                        <form onSubmit={submitNews} className="flex min-h-0 flex-1 flex-col">
                            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_380px]">
                                <div className="min-h-0 space-y-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Judul</label>
                                        <input value={data.title} onChange={(e) => setData('title', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                        {errors.title && <p className="mt-1 text-xs font-bold text-red-500">{errors.title}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Ringkasan</label>
                                        <input value={data.excerpt} onChange={(e) => setData('excerpt', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                        {errors.excerpt && <p className="mt-1 text-xs font-bold text-red-500">{errors.excerpt}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Isi Berita</label>
                                        <div className="min-h-[520px] rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                            <Suspense fallback={<div className="h-[520px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />}>
                                                <QuillEditor
                                                    value={data.body}
                                                    onChange={(value) => setData('body', value)}
                                                    placeholder="Tulis isi berita..."
                                                    editorMinHeight="52vh"
                                                    uploadImageUrl={route('superadmin.content.news.editor-images.store')}
                                                />
                                            </Suspense>
                                        </div>
                                        {errors.body && <p className="mt-1 text-xs font-bold text-red-500">{errors.body}</p>}
                                    </div>
                                </div>

                                <div className="min-h-0 space-y-4 overflow-y-auto border-t border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/40 sm:p-6 xl:border-l xl:border-t-0">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
                                        <select value={data.status} onChange={(e) => setData('status', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                            <option value="draft">Draft</option>
                                            <option value="pending">Pending</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Audience</label>
                                        <select value={data.audience} onChange={(e) => setData('audience', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                            <option value="students">Students</option>
                                            <option value="admins">Admins</option>
                                            <option value="all">All</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Publish At</label>
                                        <input type="datetime-local" value={data.published_at} onChange={(e) => setData('published_at', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Starts At</label>
                                        <input type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Ends At</label>
                                        <input type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <input type="checkbox" checked={data.is_pinned} onChange={(e) => setData('is_pinned', e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                        Pin di dashboard
                                    </label>

                                    {editingNews && (
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white">Attachments</h4>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Attachment hanya bisa ditambah setelah news tersimpan.</p>
                                            <div className="mt-4 space-y-3">
                                                {selectedNewsAttachments.map((attachment) => (
                                                    <div key={attachment.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-sm">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate font-bold text-gray-900 dark:text-white">{attachment.file_name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{attachment.file_type}</p>
                                                            </div>
                                                                            <button type="button" onClick={() => deleteAttachment(attachment)} className="text-xs font-black text-red-600 dark:text-red-400">Hapus</button>
                                                        </div>
                                                        {attachment.url && <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-red-600 dark:text-red-400">Buka file</a>}
                                                        {attachment.video_embed_url && <a href={attachment.video_embed_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-red-600 dark:text-red-400">Buka video</a>}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                                    <option value="image">Image</option>
                                                    <option value="document">Document</option>
                                                    <option value="video_embed">Video Embed</option>
                                                </select>
                                                {attachmentType === 'video_embed' ? (
                                                    <input value={videoEmbedUrl} onChange={(e) => setVideoEmbedUrl(e.target.value)} placeholder="https://youtube.com/..." className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                                ) : (
                                                    <input type="file" onChange={(e) => setAttachmentFile(e.target.files[0] || null)} accept={attachmentType === 'image' ? '.jpg,.jpeg,.png,.webp' : '.pdf,.doc,.docx'} className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-red-50 file:px-4 file:py-3 file:text-sm file:font-black file:text-red-600" />
                                                )}
                                                <button type="button" onClick={uploadAttachment} className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-gray-900">Tambah Attachment</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
                                <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300">Batal</button>
                                <button type="button" onClick={() => setShowPreview(true)} className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-black text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                    Preview
                                </button>
                                <button disabled={processing} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-red-500/20 transition-colors hover:bg-red-700 disabled:opacity-60">
                                    {processing ? 'Menyimpan...' : editingNews ? 'Simpan News' : 'Buat News'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {showPreview && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[1100] overflow-y-auto bg-gray-950/70 p-4 sm:p-6">
                    <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-950">
                        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Preview News</p>
                                <h3 className="mt-1 text-lg font-black text-gray-900 dark:text-white">Tampilan sebelum publish</h3>
                            </div>
                            <button type="button" onClick={() => setShowPreview(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300">
                                Tutup Preview
                            </button>
                        </div>

                        <article>
                            <header className="bg-gray-50 px-5 py-8 dark:bg-gray-900/40 sm:px-8">
                                <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
                                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-600 dark:bg-red-900/20 dark:text-red-300">{data.status || 'draft'}</span>
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{data.audience || 'students'}</span>
                                    {data.is_pinned && <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">Pinned</span>}
                                </div>
                                <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-gray-900 dark:text-white md:text-5xl">
                                    {data.title || 'Judul berita belum diisi'}
                                </h1>
                                {data.excerpt && (
                                    <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-500 dark:text-gray-400 md:text-lg">
                                        {data.excerpt}
                                    </p>
                                )}
                            </header>

                            <div className="px-5 py-8 sm:px-8">
                                <div
                                    className="prose prose-lg max-w-none prose-headings:font-black prose-a:text-red-600 prose-img:rounded-3xl dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: data.body || '<p>Belum ada isi berita.</p>' }}
                                />
                            </div>
                        </article>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmActionDialog
                show={Boolean(deleteTarget)}
                variant="danger"
                title="Hapus News?"
                message="News akan dihapus dari portal berita dan dashboard student."
                details={[
                    { label: 'Judul', value: deleteTarget?.title },
                    { label: 'Attachment', value: deleteTarget?.attachments?.length || 0 },
                ]}
                confirmLabel="Hapus"
                onConfirm={deleteNews}
                onCancel={() => setDeleteTarget(null)}
            />
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
