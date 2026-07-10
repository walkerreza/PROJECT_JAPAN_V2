import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

export default function DataUser({
    stats = [],
    users = { data: [], links: [] },
    filters = {},
}) {
    const { flash = {} } = usePage().props;
    const [statusTarget, setStatusTarget] = useState(null);
    const [reason, setReason] = useState('');
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();
    const filterForm = useForm({
        search: filters.search || '',
        status: filters.status || 'all',
    });

    const items = users?.data || [];

    const submitStatus = () => {
        const nextStatus = statusTarget.raw_status === 'suspended' ? 'active' : 'suspended';

        router.patch(route('superadmin.users.status', statusTarget.id), {
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

    const resetPassword = (user) => {
        openConfirm({
            variant: 'warning',
            title: 'Reset Password Student?',
            message: 'Password lama tidak bisa dipakai lagi setelah reset. Password baru akan muncul di notifikasi halaman.',
            details: [
                { label: 'Student', value: user.name },
                { label: 'Email', value: user.email },
            ],
            confirmLabel: 'Reset Password',
            onConfirm: () => router.post(route('superadmin.users.reset-password', user.id), {}, {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    const submitFilters = (e) => {
        e.preventDefault();
        router.get(route('superadmin.users'), filterForm.data, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Data User" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Data User</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Monitoring student, status akun, dan progres belajar dengan filter dan pagination.
                        </p>
                    </div>
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
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_120px]">
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
                        <button className="rounded-xl bg-gray-900 text-sm font-black text-white dark:bg-white dark:text-gray-900">Filter</button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card padding={false}>
                        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Daftar Student</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aksi suspend, activate, dan reset password tersambung ke backend.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-[920px] w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">XP</th>
                                        <th className="px-6 py-3">Level</th>
                                        <th className="px-6 py-3">Streak</th>
                                        <th className="px-6 py-3">Progress</th>
                                        <th className="px-6 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-sm font-bold text-gray-400">Belum ada student.</td>
                                        </tr>
                                    )}
                                    {items.map((item) => (
                                        <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-black ${item.raw_status === 'suspended' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.xp}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.level}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.streak}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-28 rounded-full bg-gray-100 dark:bg-gray-800">
                                                    <div className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-black text-white" style={{ width: item.progress }}>{item.progress}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setStatusTarget(item)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                        {item.raw_status === 'suspended' ? 'Activate' : 'Suspend'}
                                                    </button>
                                                    <button onClick={() => resetPassword(item)} className="rounded-lg border border-red-100 dark:border-red-900/30 px-3 py-2 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                        Reset
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {users?.links && users.links.length > 3 && (
                            <div className="flex flex-wrap justify-center gap-2 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                                {users.links.map((link, index) => (
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

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Aksi Tersedia</h2>
                        <div className="mt-4 grid grid-cols-1 gap-3">
                            {['Suspend atau activate akun student', 'Reset password student', 'Semua aksi tercatat ke activity log', 'Search dan filter sudah aktif'].map((item) => (
                                <div key={item} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmActionDialog
                show={Boolean(statusTarget)}
                variant={statusTarget?.raw_status === 'suspended' ? 'success' : 'danger'}
                title={statusTarget?.raw_status === 'suspended' ? 'Aktifkan Student?' : 'Suspend Student?'}
                message="Perubahan status akan langsung memengaruhi akses student ke kelas dan fitur belajar."
                details={[
                    { label: 'Student', value: statusTarget?.name },
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
