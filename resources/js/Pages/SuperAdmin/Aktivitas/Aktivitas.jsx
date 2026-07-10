import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';

function toneClasses(tone) {
    const styles = {
        red: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
        amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        blue: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-900/30',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
    };

    return styles[tone] || styles.blue;
}

function Pagination({ links = [] }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex flex-wrap justify-center gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            {links.map((link, index) => (
                <Link
                    key={`${link.label}-${index}`}
                    href={link.url || '#'}
                    preserveScroll
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`rounded-xl px-4 py-2 text-sm font-bold ${link.active ? 'bg-red-600 text-white' : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                />
            ))}
        </div>
    );
}

export default function Activity({
    activityStats = [],
    timeline = { data: [], links: [] },
    logins = { data: [], links: [] },
    riskyEvents = [],
    filters = {},
    filterOptions = { actors: [], actions: [] },
}) {
    const filterForm = useForm({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        actor_id: filters.actor_id || '',
        action: filters.action || 'all',
        login_status: filters.login_status || 'all',
    });

    const timelineItems = timeline?.data || [];
    const loginItems = logins?.data || [];

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('superadmin.activity'), filterForm.data, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const resetFilters = () => {
        router.get(route('superadmin.activity'), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Aktivitas" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Aktivitas Platform</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Audit trail, login history, dan aktivitas sensitif admin maupun superadmin.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        Data dipaginasi agar query tetap ringan
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {activityStats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                    {activityStats.length === 0 && (
                        <Card className="sm:col-span-2 xl:col-span-4">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Belum ada statistik aktivitas.</p>
                        </Card>
                    )}
                </div>

                <Card>
                    <form onSubmit={submitFilters} className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1.2fr_1fr_auto_auto]">
                        <input
                            type="date"
                            value={filterForm.data.date_from}
                            onChange={(event) => filterForm.setData('date_from', event.target.value)}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        />
                        <input
                            type="date"
                            value={filterForm.data.date_to}
                            onChange={(event) => filterForm.setData('date_to', event.target.value)}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        />
                        <select
                            value={filterForm.data.actor_id}
                            onChange={(event) => filterForm.setData('actor_id', event.target.value)}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        >
                            <option value="">Semua actor</option>
                            {(filterOptions.actors || []).map((actor) => (
                                <option key={actor.id} value={actor.id}>{actor.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterForm.data.action}
                            onChange={(event) => filterForm.setData('action', event.target.value)}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        >
                            <option value="all">Semua action</option>
                            {(filterOptions.actions || []).map((action) => (
                                <option key={action.value} value={action.value}>{action.label}</option>
                            ))}
                        </select>
                        <select
                            value={filterForm.data.login_status}
                            onChange={(event) => filterForm.setData('login_status', event.target.value)}
                            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                        >
                            <option value="all">Semua login</option>
                            <option value="success">Berhasil</option>
                            <option value="failed">Ditolak</option>
                        </select>
                        <button className="h-11 rounded-xl bg-gray-900 px-4 text-sm font-black text-white dark:bg-white dark:text-gray-900">
                            Filter
                        </button>
                        <button type="button" onClick={resetFilters} className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                            Reset
                        </button>
                    </form>
                </Card>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card padding={false}>
                        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Timeline Aktivitas</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">15 item per halaman dari activity_logs.</p>
                        </div>
                        <div className="space-y-4 p-6">
                            {timelineItems.map((item) => (
                                <div key={`${item.time}-${item.actor}-${item.target}`} className="flex gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border font-black ${toneClasses(item.tone)}`}>
                                        {(item.actor || 'S').charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.action}</p>
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{item.time}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{item.actor}</span> terhadap{' '}
                                            <span className="font-bold text-red-600 dark:text-red-400">{item.target}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {timelineItems.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm font-bold text-gray-400 dark:border-gray-800">
                                    Belum ada timeline aktivitas.
                                </div>
                            )}
                        </div>
                        <Pagination links={timeline?.links} />
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Status Risiko</h2>
                            <div className="mt-4 space-y-3">
                                {riskyEvents.map((item) => (
                                    <div key={item} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                <Card padding={false}>
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Login History</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">10 item per halaman dari login_histories.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full text-sm">
                            <thead className="bg-gray-50 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">IP</th>
                                    <th className="px-6 py-3">Perangkat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loginItems.map((item) => (
                                    <tr key={`${item.user}-${item.device}-${item.location}`} className="border-t border-gray-100 dark:border-gray-800">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.user}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.location}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.device}</td>
                                    </tr>
                                ))}
                                {loginItems.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm font-bold text-gray-400">Belum ada riwayat login.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={logins?.links} />
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
