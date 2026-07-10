import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShieldIcon from '@mui/icons-material/Shield';
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';

const defaultActivityStats = [
    { title: 'Aksi Hari Ini', value: '128', icon: '<ReceiptLongIcon className="w-5 h-5 inline-block text-gray-500" />', change: '14%', changeType: 'up' },
    { title: 'Login Berhasil', value: '96', icon: '🔐', change: '9%', changeType: 'up' },
    { title: 'Perubahan Role', value: '7', icon: '<ShieldIcon className="w-5 h-5 text-blue-500 inline-block" />', change: '3', changeType: 'down' },
    { title: 'Alert Keamanan', value: '2', icon: '🚨', change: '1', changeType: 'down' },
];

const defaultTimeline = [
    { actor: 'Root Superadmin', action: 'Suspend user', target: 'takumi.n3', time: '08:45', tone: 'red' },
    { actor: 'Maya Admin', action: 'Publish module update', target: 'Kanji N3 Bab 4', time: '08:10', tone: 'amber' },
    { actor: 'Root Superadmin', action: 'Reset password', target: 'admin.yuki', time: '07:52', tone: 'blue' },
    { actor: 'System', action: 'Streak sync job complete', target: '247 users', time: '06:30', tone: 'emerald' },
    { actor: 'System', action: 'Repeated login attempts', target: 'IP 103.14.xx.xx', time: '02:14', tone: 'red' },
];

const defaultLogins = [
    { user: 'rei.student', role: 'Student', status: 'Berhasil', location: 'Jakarta', device: 'Chrome / Android' },
    { user: 'admin.yuki', role: 'Admin', status: 'Berhasil', location: 'Bandung', device: 'Edge / Windows' },
    { user: 'root.superadmin', role: 'Superadmin', status: 'Berhasil', location: 'Tokyo', device: 'Safari / macOS' },
    { user: 'guest-flagged', role: 'Unknown', status: 'Ditolak', location: 'Surabaya', device: 'Firefox / Linux' },
];

const defaultRiskyEvents = [
    'Admin menghapus 12 soal dalam 10 menit terakhir',
    'Percobaan login gagal berulang dari dua IP baru',
    'Perubahan massal role belum terjadi dalam 24 jam terakhir',
];

function toneClasses(tone) {
    const styles = {
        red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
        blue: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    };

    return styles[tone] || styles.blue;
}

export default function Activity({
    activityStats = defaultActivityStats,
    timeline = defaultTimeline,
    logins = defaultLogins,
    riskyEvents = defaultRiskyEvents,
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Aktivitas" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Aktivitas Platform</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Ringkasan audit trail, login history, dan aktivitas sensitif admin maupun superadmin.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Snapshot terakhir diperbarui 5 menit lalu
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {activityStats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <Card>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Timeline Aktivitas</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aksi penting terbaru dari sistem, admin, dan superadmin.</p>
                        </div>
                        <div className="mt-6 space-y-4">
                            {timeline.map((item) => (
                                <div key={`${item.time}-${item.target}`} className="flex gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border font-black ${toneClasses(item.tone)}`}>
                                        {item.actor.charAt(0)}
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
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Perhatian Cepat</h2>
                            <div className="mt-4 space-y-3">
                                {riskyEvents.map((item) => (
                                    <div key={item} className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Aksi yang Dicatat</h2>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                {['Suspend user', 'Reset password', 'Publish news', 'Role changes'].map((item) => (
                                    <div key={item} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                <Card padding={false}>
                    <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Login History</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aktivitas masuk terbaru untuk monitoring keamanan dasar.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-[760px] w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Lokasi</th>
                                    <th className="px-6 py-3">Perangkat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logins.map((item) => (
                                    <tr key={`${item.user}-${item.device}`} className="border-t border-gray-100 dark:border-gray-800">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.user}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === 'Berhasil' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.location}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.device}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
