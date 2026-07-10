import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const emptyAdmin = {
    username: '',
    email: '',
    password: '',
    role: 'admin',
};

export default function DataAdmin({
    stats = [],
    admins = { data: [], links: [] },
    activities = [],
    filters = {},
}) {
    const { flash = {} } = usePage().props;
    const [showForm, setShowForm] = useState(false);
    const [statusTarget, setStatusTarget] = useState(null);
    const [reason, setReason] = useState('');
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();
    const { data, setData, post, processing, errors, reset } = useForm({ ...emptyAdmin });
    const filterForm = useForm({
        search: filters.search || '',
        status: filters.status || 'all',
        role: filters.role || 'all',
    });

    const items = admins?.data || [];

    const submitAdmin = (e) => {
        e.preventDefault();
        post(route('superadmin.admins.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowForm(false);
                reset();
            },
        });
    };

    const submitStatus = () => {
        const nextStatus = statusTarget.raw_status === 'suspended' ? 'active' : 'suspended';

        router.patch(route('superadmin.admins.status', statusTarget.id), {
            status: nextStatus,
            reason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setStatusTarget(null);
                setReason('');
            },
        });
    };

    const resetPassword = (admin) => {
        openConfirm({
            variant: 'warning',
            title: 'Reset Password Admin?',
            message: 'Password lama tidak bisa dipakai lagi setelah reset. Password baru akan muncul di notifikasi halaman.',
            details: [
                { label: 'Admin', value: admin.name },
                { label: 'Email', value: admin.email },
            ],
            confirmLabel: 'Reset Password',
            onConfirm: () => router.post(route('superadmin.admins.reset-password', admin.id), {}, {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        router.get(route('superadmin.admins'), filterForm.data, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Data Admin" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Data Admin</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Pengawasan dan kontrol akses admin dengan search, filter, dan pembuatan akun baru.
                        </p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-red-500/20 hover:bg-red-700">
                        Tambah Admin
                    </button>
                </div>

                {flash.generated_password && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400">
                        Password baru: <span className="font-black">{flash.generated_password}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => <StatCard key={item.title} {...item} />)}
                </div>

                <Card>
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_120px]">
                        <input
                            value={filterForm.data.search}
                            onChange={(e) => filterForm.setData('search', e.target.value)}
                            placeholder="Cari username atau email..."
                            className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white"
                        />
                        <select value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                            <option value="all">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <select value={filterForm.data.role} onChange={(e) => filterForm.setData('role', e.target.value)} className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                            <option value="all">Semua role</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                        <button className="rounded-xl bg-gray-900 text-sm font-black text-white dark:bg-white dark:text-gray-900">Filter</button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Roster Admin</h2>
                        <div className="mt-5 space-y-4">
                            {items.length === 0 && (
                                <p className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-10 text-center text-sm font-bold text-gray-400">Belum ada admin.</p>
                            )}
                            {items.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white">{item.name}</h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.email}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-black ${item.raw_status === 'suspended' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-black text-red-600 dark:text-red-400">{item.role}</span>
                                            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-500 dark:text-gray-400">Update terakhir {item.updated}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setStatusTarget(item)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                {item.raw_status === 'suspended' ? 'Activate' : 'Suspend'}
                                            </button>
                                            <button onClick={() => resetPassword(item)} className="rounded-lg border border-red-100 dark:border-red-900/30 px-3 py-2 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {admins?.links && admins.links.length > 3 && (
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {admins.links.map((link, index) => (
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
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Aktivitas Terkini</h2>
                            <div className="mt-4 space-y-3">
                                {activities.length === 0 && (
                                    <p className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-sm font-medium text-gray-400">Belum ada aktivitas admin.</p>
                                )}
                                {activities.map((item) => (
                                    <div key={item} className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="border-b border-gray-100 dark:border-gray-800 p-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Tambah Admin</h3>
                        </div>
                        <form onSubmit={submitAdmin} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Username</label>
                                <input value={data.username} onChange={(e) => setData('username', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                {errors.username && <p className="mt-1 text-xs font-bold text-red-500">{errors.username}</p>}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                {errors.email && <p className="mt-1 text-xs font-bold text-red-500">{errors.email}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Role</label>
                                    <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm font-bold text-gray-900 dark:text-white">
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-gray-700 dark:text-gray-300">Password Opsional</label>
                                    <input type="text" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="Auto-generate jika kosong" className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 text-sm text-gray-900 dark:text-white" />
                                    {errors.password && <p className="mt-1 text-xs font-bold text-red-500">{errors.password}</p>}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
                                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300">Batal</button>
                                <button disabled={processing} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">{processing ? 'Menyimpan...' : 'Buat Admin'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmActionDialog
                show={Boolean(statusTarget)}
                variant={statusTarget?.raw_status === 'suspended' ? 'success' : 'danger'}
                title={statusTarget?.raw_status === 'suspended' ? 'Aktifkan Admin?' : 'Suspend Admin?'}
                message="Perubahan status akan langsung memengaruhi akses admin ke dashboard."
                details={[
                    { label: 'Admin', value: statusTarget?.name },
                    { label: 'Status baru', value: statusTarget?.raw_status === 'suspended' ? 'Aktif' : 'Suspended' },
                ]}
                confirmLabel="Konfirmasi"
                onConfirm={submitStatus}
                onCancel={() => {
                    setStatusTarget(null);
                    setReason('');
                }}
            >
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Alasan opsional" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
            </ConfirmActionDialog>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
