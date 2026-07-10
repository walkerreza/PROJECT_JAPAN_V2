import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import Avatar from '@/Components/UI/Avatar';

export default function Users({ students = { data: [], links: [] }, filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const items = students?.data || [];

    const submitSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.users'), { search }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Student Directory" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card className="!p-0 !rounded-2xl border-transparent shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Data Murid</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring progress, XP, streak, dan skor quiz murid.</p>
                            </div>
                            <form onSubmit={submitSearch} className="relative w-full sm:w-auto">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">Search</span>
                                <input
                                    type="text"
                                    placeholder="Nama atau email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:w-80 h-10 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl pl-20 pr-4 text-sm focus:bg-white dark:focus:bg-gray-900 focus:border-red-100 dark:focus:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                                />
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                                        <th className="px-4 py-4 sm:px-6 lg:px-8 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Murid</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Progress</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Skor</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Gamifikasi</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">Status</th>
                                        <th className="px-4 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-5 sm:px-6 lg:px-8">
                                                <div className="flex items-center gap-3">
                                                    <Avatar size="sm" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.username}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{user.email}</p>
                                                        <p className="text-[11px] text-gray-400 mt-1">Aktif: {user.last_activity}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{user.lessons_done} lesson</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.quizzes_done} quiz attempt</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{user.average_score || 0}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">rata-rata quiz</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{user.xp.toLocaleString()} XP</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.streak_count} hari streak</p>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge color={user.status === 'active' ? 'green' : 'red'} className="!text-xs">{user.status}</Badge>
                                                    <Badge color={user.subscription_status === 'premium' ? 'purple' : 'gray'} className="!text-xs">{user.subscription_status}</Badge>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-right">
                                                <Link href={route('admin.users.show', user.id)} className="text-xs font-black text-red-600 dark:text-red-400 hover:underline">
                                                    Lihat Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                Belum ada murid yang cocok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {students?.links && students.links.length > 3 && (
                            <div className="flex flex-wrap justify-center gap-2 p-5">
                                {students.links.map((link, index) => (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-4 py-2 text-sm font-bold ${link.active ? 'bg-red-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
