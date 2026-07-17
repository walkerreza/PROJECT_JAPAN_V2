import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ChartCard from '@/Components/Features/Dashboard/ChartCard';
import Card from '@/Components/UI/Card';

function toneClass(tone) {
    const tones = {
        red: 'border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400',
        amber: 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400',
        green: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400',
        blue: 'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/30 dark:bg-sky-900/20 dark:text-sky-400',
    };

    return tones[tone] || tones.blue;
}

function EmptyState({ children }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm font-bold text-gray-400 dark:border-gray-800">
            {children}
        </div>
    );
}

export default function SuperadminDashboard({
    metrics = [],
    alerts = [],
    activities = [],
    learningBars = [],
    focusBars = [],
    healthCards = [],
    quickActions = [],
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Beranda" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="p-6 lg:p-8">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white">Beranda Platform</h1>
                            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-gray-500 dark:text-gray-400">
                                Ringkasan operasional Japanlingo untuk user, konten, kloter, pembayaran, gamifikasi, dan audit sistem.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600 dark:bg-red-900/20 dark:text-red-300">N3 Learning Loop</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">MySQL</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">Midtrans Ready</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-950/50 lg:border-l lg:border-t-0">
                            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-gray-400">Quick Actions</h2>
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {quickActions.slice(0, 4).map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 transition hover:border-red-200 hover:bg-red-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-red-900/40 dark:hover:bg-red-900/10"
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white">
                                            {item.icon}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-black text-gray-900 dark:text-white">{item.label}</span>
                                            <span className="mt-0.5 block truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{item.description}</span>
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {metrics.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                    {metrics.length === 0 && (
                        <Card className="sm:col-span-2 xl:col-span-3">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Belum ada metrik platform.</p>
                        </Card>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                    <ChartCard title="Aktivitas Belajar 7 Hari" subtitle="Modul selesai vs pengerjaan kuis">
                        <div className="flex h-64 items-end gap-3">
                            {learningBars.map((item) => (
                                <div key={item.label} className="flex flex-1 flex-col justify-end gap-1">
                                    <div className="flex min-h-[160px] flex-col justify-end rounded-2xl bg-gray-50 px-2 pb-2 dark:bg-gray-950">
                                        <div className="rounded-t-xl bg-red-200" style={{ height: `${Math.max(4, Math.min(item.lesson, 100))}%` }} />
                                        <div className="mt-1 rounded-t-xl bg-red-600" style={{ height: `${Math.max(4, Math.min(item.quiz, 100))}%` }} />
                                    </div>
                                    <p className="pt-2 text-center text-[11px] font-black text-gray-400 dark:text-gray-500">{item.label}</p>
                                </div>
                            ))}
                            {learningBars.length === 0 && (
                                <div className="flex h-full w-full items-center justify-center">
                                    <EmptyState>Belum ada aktivitas belajar.</EmptyState>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-200" /> Modul selesai</span>
                            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" /> Kuis dikerjakan</span>
                        </div>
                    </ChartCard>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Health Check</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Sinyal operasional yang perlu dipantau.</p>
                        <div className="mt-5 space-y-3">
                            {healthCards.map((item) => (
                                <div key={item.label} className={`rounded-2xl border px-4 py-3 ${toneClass(item.tone)}`}>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-black">{item.label}</span>
                                        <span className="text-lg font-black">{item.value}</span>
                                    </div>
                                    <p className="mt-1 text-xs font-bold opacity-80">{item.note}</p>
                                </div>
                            ))}
                            {healthCards.length === 0 && <EmptyState>Belum ada health check.</EmptyState>}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                    <ChartCard title="Distribusi Fokus Platform" subtitle="Diambil dari angka operasional saat ini">
                        <div className="space-y-4">
                            {focusBars.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                                        <span className="font-black text-gray-900 dark:text-white">{item.value}</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800">
                                        <div className={`h-3 rounded-full ${item.color}`} style={{ width: item.width }} />
                                    </div>
                                </div>
                            ))}
                            {focusBars.length === 0 && <EmptyState>Belum ada distribusi fokus.</EmptyState>}
                        </div>
                    </ChartCard>

                    <Card>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">Aksi Superadmin</h2>
                                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Shortcut ke panel yang sudah tersambung route.</p>
                            </div>
                            <Link href={route('superadmin.activity')} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                Lihat Log
                            </Link>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {quickActions.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="group rounded-2xl border border-gray-100 p-4 transition hover:border-red-200 hover:bg-red-50 dark:border-gray-800 dark:hover:border-red-900/40 dark:hover:bg-red-900/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-black text-white transition group-hover:bg-red-600 dark:bg-white dark:text-gray-900 dark:group-hover:bg-red-500 dark:group-hover:text-white">
                                            {item.icon}
                                        </span>
                                        <span>
                                            <span className="block text-sm font-black text-gray-900 dark:text-white">{item.label}</span>
                                            <span className="mt-1 block text-xs font-semibold leading-5 text-gray-500 dark:text-gray-400">{item.description}</span>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Alert Operasional</h2>
                        <div className="mt-4 space-y-3">
                            {alerts.map((item) => (
                                <div key={item.text} className={`rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${toneClass(item.tone)}`}>
                                    {item.text}
                                </div>
                            ))}
                            {alerts.length === 0 && <EmptyState>Tidak ada alert.</EmptyState>}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Aktivitas Terkini</h2>
                        <div className="mt-4 space-y-3">
                            {activities.map((item) => (
                                <div key={`${item.actor}-${item.time}-${item.action}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-gray-800 dark:bg-gray-800/50">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{item.action}</p>
                                        <span className="shrink-0 text-xs font-bold text-gray-400">{item.time}</span>
                                    </div>
                                    <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        {item.actor} - {item.target}
                                    </p>
                                </div>
                            ))}
                            {activities.length === 0 && <EmptyState>Belum ada log aktivitas.</EmptyState>}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
