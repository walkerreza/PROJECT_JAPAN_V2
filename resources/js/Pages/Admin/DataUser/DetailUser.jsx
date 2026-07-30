import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ChartCard from '@/Components/Features/Dashboard/ChartCard';
import ChartPeriodSelect from '@/Components/Features/Dashboard/ChartPeriodSelect';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartEmpty, ChartTooltip, ChartTooltipContent } from '@/Components/UI/Chart';

export default function DetailUser({ student, filters = {}, studentActivitySeries = [], levelProgress = [], recentProgress = [], recentAttempts = [], rewardHistory = [], certificates = [] }) {
    const totalModules = levelProgress.reduce((total, level) => total + Number(level.total_lessons || 0), 0);
    const completedModules = levelProgress.reduce((total, level) => total + Number(level.completed_lessons || 0), 0);
    const progressDistribution = [
        { label: 'Selesai', value: completedModules },
        { label: 'Belum selesai', value: Math.max(0, totalModules - completedModules) },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`${student.username} - Detail Murid`} />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link href={route('admin.users', filters.kloter ? { kloter: filters.kloter } : {})} className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline">Kembali ke Kloter & Siswa</Link>
                        <h1 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{student.username}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                        {student.status} / {student.subscription_status}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="XP" value={student.xp.toLocaleString()} icon="XP" />
                    <StatCard title="Streak" value={student.streak_count} icon="S" />
                    <StatCard title="Modul Selesai" value={student.lessons_done} icon="M" />
                    <StatCard title="Rata-rata Skor" value={student.average_score || 0} icon="Q" />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                    <ChartCard title="Progres Kelas" subtitle={`${completedModules} dari ${totalModules} modul selesai`}>
                        {totalModules > 0 ? (
                            <ChartContainer config={{ complete: { label: 'Selesai', color: '#dc2626' } }}>
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Pie data={progressDistribution} dataKey="value" nameKey="label" innerRadius={62} outerRadius={92} paddingAngle={3}>
                                        <Cell fill="#dc2626" />
                                        <Cell fill="#e5e7eb" />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        ) : <ChartEmpty>Belum ada modul dalam cakupan siswa ini.</ChartEmpty>}
                    </ChartCard>

                    <ChartCard
                        title="Aktivitas Belajar"
                        subtitle="Progres dan attempt kuis siswa"
                        action={<ChartPeriodSelect routeName="admin.users.show" routeParams={student.id} filters={filters} />}
                    >
                        {studentActivitySeries.some((item) => item.progress || item.quiz_attempts) ? (
                            <ChartContainer config={{ progress: { label: 'Progres', color: '#0ea5e9' }, quiz_attempts: { label: 'Kuis', color: '#dc2626' } }}>
                                <BarChart data={studentActivitySeries} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} className="fill-gray-400 text-xs" />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="fill-gray-400 text-xs" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="progress" name="Progres" fill="var(--color-progress)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="quiz_attempts" name="Kuis" fill="var(--color-quiz_attempts)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        ) : <ChartEmpty>Belum ada aktivitas pada periode ini.</ChartEmpty>}
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Progress per Level</h2>
                        <div className="mt-5 space-y-4">
                            {levelProgress.map((level) => (
                                <div key={level.id}>
                                    <div className="mb-2 flex justify-between text-sm">
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{level.name}</span>
                                        <span className="text-gray-500 dark:text-gray-400">{level.completed_lessons}/{level.total_lessons} modul</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                        <div className="h-full rounded-full bg-red-600" style={{ width: `${level.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Sertifikat</h2>
                        <div className="mt-4 space-y-3">
                            {certificates.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada sertifikat.</p>}
                            {certificates.map((certificate) => (
                                <div key={certificate.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p className="font-black text-gray-900 dark:text-white">{certificate.level}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{certificate.certificate_number} - {certificate.issued_at}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Modul Terbaru</h2>
                        <div className="mt-4 space-y-3">
                            {recentProgress.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{item.lesson}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.level} - {item.module}</p>
                                    <p className="mt-2 text-xs font-bold text-gray-400">{item.completed_at}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Quiz Attempt</h2>
                        <div className="mt-4 space-y-3">
                            {recentAttempts.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{item.lesson || item.quiz}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.module}</p>
                                    <p className="mt-2 text-xs font-bold text-red-600 dark:text-red-400">Skor {item.score} / +{item.xp_earned} XP</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Reward History</h2>
                        <div className="mt-4 space-y-3">
                            {rewardHistory.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{item.description || item.source_type}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">+{item.xp_amount} XP - {item.created_at}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
