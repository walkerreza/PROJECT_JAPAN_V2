import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TranslateIcon from '@mui/icons-material/Translate';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const clamp = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const toList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object') {
        return Object.values(value);
    }

    return [];
};

function StatCard({ label, value, icon, accent }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/75 p-4 shadow-sm shadow-emerald-900/5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/75">
            <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
            <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${accent}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">
                        {(Number(value) || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-gray-400">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ProgressBar({ value, className = 'bg-emerald-500' }) {
    return (
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
            <div className={`h-full rounded-full ${className}`} style={{ width: `${clamp(value)}%` }} />
        </div>
    );
}

function ActivityIcon({ type }) {
    if (type === 'lesson') {
        return <AutoStoriesIcon sx={{ fontSize: 16 }} />;
    }

    if (type === 'quiz') {
        return <HelpCenterIcon sx={{ fontSize: 16 }} />;
    }

    return <LocalFireDepartmentIcon sx={{ fontSize: 16 }} />;
}

function EmptyActivity() {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40">
            <LibraryBooksIcon className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-500 dark:text-gray-400">Belum ada aktivitas.</p>
        </div>
    );
}

export default function Progress({
    stats = {},
    weekActivity = [],
    jlptJourney = [],
    recentActivity = [],
    skills = [],
    next_learning: nextLearning = null,
}) {
    const weekItems = toList(weekActivity);
    const journeyItems = toList(jlptJourney);
    const recentItems = toList(recentActivity);
    const skillItems = toList(skills);
    const totalXP = weekItems.reduce((total, day) => total + (Number(day.xp) || 0), 0);
    const peakWeekXp = Math.max(1, ...weekItems.map((day) => Number(day.xp) || 0));

    if (import.meta.env.DEV) {
        console.debug('[Progress] weekActivity', weekItems);
    }
    const statCards = [
        {
            label: 'Total XP',
            value: stats.xp,
            icon: <EmojiEventsIcon sx={{ fontSize: 26 }} />,
            accent: 'bg-gradient-to-r from-amber-500 to-yellow-400',
        },
        {
            label: 'Streak',
            value: stats.streak,
            icon: <LocalFireDepartmentIcon sx={{ fontSize: 26 }} />,
            accent: 'bg-gradient-to-r from-orange-500 to-rose-500',
        },
        {
            label: 'Modul Selesai',
            value: stats.lessonsDone,
            icon: <AutoStoriesIcon sx={{ fontSize: 26 }} />,
            accent: 'bg-gradient-to-r from-red-500 to-rose-500',
        },
        {
            label: 'Kuis Selesai',
            value: stats.quizzesDone,
            icon: <HelpCenterIcon sx={{ fontSize: 26 }} />,
            accent: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        },
    ];
    const skillColors = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-sky-500'];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                    <ShowChartIcon className="text-rose-500 dark:text-rose-400" />
                    Progres Saya
                </h2>
            }
        >
            <Head title="Progres - Japanlingo" />

            <div className="relative min-h-screen overflow-hidden bg-[#eef6f2] pb-12 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,185,129,0.14)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.09)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(6,95,70,0.045)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(6,95,70,0.035)_0_1px,transparent_1px_78px)] dark:bg-[linear-gradient(130deg,rgba(16,185,129,0.10)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.12)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(255,255,255,0.032)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(255,255,255,0.026)_0_1px,transparent_1px_78px)]" />

                <main className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
                    <section className="mb-5 overflow-hidden rounded-xl border border-white/70 bg-white/70 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/70 sm:p-6">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300">
                                    Dasbor Progres
                                </p>
                                <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                                    Perjalanan Belajarmu <TranslateIcon className="inline-block text-rose-500" />
                                </h1>
                            </div>
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                7 hari: {totalXP.toLocaleString()} XP
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {statCards.map((card) => (
                                <StatCard key={card.label} {...card} />
                            ))}
                        </div>
                    </section>

                    <section className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                Langkah Berikutnya
                            </p>
                            <h2 className="mt-1 truncate text-base font-black text-slate-900 dark:text-white">
                                {nextLearning?.title || 'Pilih kelas untuk mulai belajar'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {nextLearning?.message || 'Pilih kelas aktif agar roadmap belajarmu dapat ditampilkan di sini.'}
                            </p>
                        </div>
                        <Link
                            href={nextLearning?.url || route('user.kelas.index')}
                            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                        >
                            {nextLearning?.action_label || 'Pilih kelas'}
                        </Link>
                    </section>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <section className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75 sm:p-6">
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Aktivitas Mingguan</h3>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-500">
                                            XP yang dikumpulkan 7 hari terakhir
                                        </p>
                                    </div>
                                </div>

                                <div className="flex min-h-[180px] items-end gap-2">
                                    {weekItems.map((day, index) => {
                                        const xp = Number(day.xp) || 0;
                                        const pct = xp > 0 ? Math.max(18, Math.round((xp / peakWeekXp) * 100)) : 0;

                                        return (
                                            <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-1.5">
                                                <span className={`h-4 text-[10px] font-bold ${day.today ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-gray-500'}`}>
                                                    {xp > 0 ? xp : ''}
                                                </span>
                                                <div
                                                    style={{
                                                        height: 132,
                                                        width: '100%',
                                                        minWidth: 34,
                                                        borderRadius: 18,
                                                        border: '1px solid rgba(148, 163, 184, 0.35)',
                                                        background: 'rgba(226, 232, 240, 0.78)',
                                                        display: 'flex',
                                                        alignItems: 'flex-end',
                                                        overflow: 'hidden',
                                                        boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.08)',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: `${pct}%`,
                                                            minHeight: xp > 0 ? 24 : 0,
                                                            background: day.today
                                                                ? 'linear-gradient(180deg, #facc15 0%, #f59e0b 100%)'
                                                                : 'linear-gradient(180deg, #818cf8 0%, #7c3aed 100%)',
                                                            opacity: xp > 0 ? 1 : 0,
                                                            borderRadius: 16,
                                                            boxShadow: xp > 0 ? '0 -4px 16px rgba(245, 158, 11, 0.22)' : 'none',
                                                        }}
                                                    />
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase ${day.today ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-gray-500'}`}>
                                                    {day.day}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75 sm:p-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Aktivitas per Topik</h3>
                                <p className="mb-5 mt-1 text-xs text-slate-500 dark:text-gray-500">
                                    Ringkasan aktivitas belajar per topik
                                </p>

                                <div className="space-y-4">
                                    {skillItems.map((skill, index) => (
                                        <div key={skill.label || index}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{skill.label}</span>
                                                <span className="text-xs font-black tabular-nums text-slate-500 dark:text-gray-400">
                                                    {clamp(skill.value)}%
                                                </span>
                                            </div>
                                            <ProgressBar value={skill.value} className={skillColors[index % skillColors.length]} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-6">
                            <section className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75 sm:p-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Perjalanan JLPT</h3>
                                <p className="mb-5 mt-1 text-xs text-slate-500 dark:text-gray-500">
                                    Level yang sudah dan belum tercapai
                                </p>

                                <div className="mb-6 grid grid-cols-5 gap-2">
                                    {journeyItems.map((level, index) => {
                                        const active = !level.done && clamp(level.pct) > 0;

                                        return (
                                            <div key={`${level.level}-${index}`} className="flex flex-col items-center gap-2">
                                                <div
                                                    className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black ${
                                                        level.done
                                                            ? 'bg-emerald-500 text-white'
                                                            : active
                                                                ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white'
                                                                : 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-500'
                                                    }`}
                                                >
                                                    {level.done ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : level.level}
                                                </div>
                                                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-gray-400">
                                                    {level.level}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="space-y-3">
                                    {journeyItems.map((level, index) => (
                                        <div key={`${level.level}-bar-${index}`} className="flex items-center gap-3">
                                            <span className="w-7 shrink-0 text-[10px] font-black text-slate-500 dark:text-gray-400">
                                                {level.level}
                                            </span>
                                            <div className="flex-1">
                                                <ProgressBar
                                                    value={level.pct}
                                                    className={level.done ? 'bg-emerald-500' : 'bg-gradient-to-r from-rose-500 to-orange-500'}
                                                />
                                            </div>
                                            <span className="w-9 text-right text-[10px] font-black tabular-nums text-slate-400 dark:text-gray-500">
                                                {clamp(level.pct)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-emerald-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75 sm:p-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Aktivitas Terkini</h3>
                                <p className="mb-5 mt-1 text-xs text-slate-500 dark:text-gray-500">Riwayat belajar kamu</p>

                                <div className="space-y-4">
                                    {recentItems.length > 0 ? recentItems.map((activity, index) => (
                                        <div key={`${activity.text}-${index}`} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                    <ActivityIcon type={activity.type} />
                                                </div>
                                                {index < recentItems.length - 1 && (
                                                    <div className="mt-1 h-4 w-px bg-slate-200 dark:bg-gray-700" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 pb-1">
                                                <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-800 dark:text-white">
                                                    {activity.text}
                                                </p>
                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] text-slate-400 dark:text-gray-500">{activity.time}</span>
                                                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                        +{activity.xp} XP
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <EmptyActivity />
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
