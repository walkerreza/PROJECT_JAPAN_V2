import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ChartCard from '@/Components/Features/Dashboard/ChartCard';
import Card from '@/Components/UI/Card';

export default function BerandaAdmin({
    totalModules = 0,
    totalLessons = 0,
    totalQuizzes = 0,
    totalQuestions = 0,
    totalUsers = 0,
    activeUsers = 0,
    completedLessons = 0,
    totalAttempts = 0,
    averageScore = 0,
    popularModules = [],
    recentAttempts = [],
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Admin Sensei</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard Pembelajaran</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ringkasan konten, murid aktif, dan performa quiz dari data nyata.</p>
                    </div>
                    <Link href={route('admin.analytics')} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-red-500/20">
                        Buka Analitik
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Total Murid" value={totalUsers.toLocaleString()} icon="U" />
                    <StatCard title="Murid Aktif 7 Hari" value={activeUsers.toLocaleString()} icon="A" />
                    <StatCard title="Modul Selesai" value={completedLessons.toLocaleString()} icon="M" />
                    <StatCard title="Rata-rata Skor" value={averageScore || 0} icon="S" />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
                    <ChartCard title="Modul Populer">
                        <div className="space-y-4 pt-4">
                            {popularModules.map((mod) => (
                                <div key={mod.id} className="flex flex-col gap-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{mod.title}</span>
                                        <span className="text-gray-500 dark:text-gray-400">{mod.completions_count} selesai</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, mod.completions_count * 10)}%` }} />
                                    </div>
                                </div>
                            ))}
                            {popularModules.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada progress modul.</p>}
                        </div>
                    </ChartCard>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Ringkasan Konten</h2>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalModules}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Modul</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalLessons}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Modul Mingguan</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalQuizzes}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Quiz</p>
                            </div>
                            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{totalQuestions}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Question</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Quiz Attempt Terbaru</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{totalAttempts} total attempt tersimpan.</p>
                        </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left">
                            <thead>
                                <tr className="text-xs font-black uppercase tracking-wider text-gray-400">
                                    <th className="py-3">Murid</th>
                                    <th className="py-3">Modul</th>
                                    <th className="py-3">Skor</th>
                                    <th className="py-3">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {recentAttempts.map((attempt) => (
                                    <tr key={attempt.id} className="text-sm">
                                        <td className="py-3 font-bold text-gray-900 dark:text-white">{attempt.student}</td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400">{attempt.lesson || 'Quiz'}</td>
                                        <td className="py-3 font-black text-red-600 dark:text-red-400">{attempt.score}</td>
                                        <td className="py-3 text-gray-500 dark:text-gray-400">{attempt.attempted_at}</td>
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
