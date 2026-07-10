import TranslateIcon from '@mui/icons-material/Translate';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import React, { useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { motion, useInView } from 'framer-motion';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import { MascotGuide } from '@/Components/User/UserVisuals';

/* ─── Animated counter ──────────────────────────────────────────── */
function CountUp({ target, duration = 1200 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const end = parseInt(target) || 0;
        if (end === 0) { setCount(0); return; }
        let start = 0;
        const step = Math.ceil(end / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
}

/* ─── Animated bar (skill) ──────────────────────────────────────── */
function AnimBar({ value, color }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <div ref={ref} className="h-3 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden transition-colors duration-300">
            <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${value}%` } : { width: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
            />
        </div>
    );
}

/* ─── Stagger container ─────────────────────────────────────────── */
const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function Progress({
    stats = {},
    weekActivity = [],
    jlptJourney = [],
    recentActivity = [],
    skills = [],
}) {
    const totalXP = weekActivity.reduce((a, c) => a + (c.xp || 0), 0);

    const statCards = [
        {
            label: 'Total XP',
            value: stats.xp || 0,
            icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />,
            gradient: 'from-amber-500 to-yellow-400',
            glow: 'shadow-amber-500/30',
            ring: 'ring-amber-200 dark:ring-amber-400/30',
        },
        {
            label: 'Hari Beruntun',
            value: stats.streak || 0,
            icon: <LocalFireDepartmentIcon sx={{ fontSize: 28 }} />,
            gradient: 'from-orange-500 to-rose-500',
            glow: 'shadow-orange-500/30',
            ring: 'ring-orange-200 dark:ring-orange-400/30',
        },
        {
            label: 'Pelajaran Selesai',
            value: stats.lessonsDone || 0,
            icon: <AutoStoriesIcon sx={{ fontSize: 28 }} />,
            gradient: 'from-red-500 to-rose-500',
            glow: 'shadow-red-500/30',
            ring: 'ring-red-200 dark:ring-red-400/30',
        },
        {
            label: 'Kuis Selesai',
            value: stats.quizzesDone || 0,
            icon: <HelpCenterIcon sx={{ fontSize: 28 }} />,
            gradient: 'from-emerald-500 to-teal-400',
            glow: 'shadow-emerald-500/30',
            ring: 'ring-emerald-200 dark:ring-emerald-400/30',
        },
    ];

    const activityIcon = (type) => {
        if (type === 'lesson') return <AutoStoriesIcon sx={{ fontSize: 16 }} />;
        if (type === 'quiz')   return <HelpCenterIcon  sx={{ fontSize: 16 }} />;
        return <LocalFireDepartmentIcon sx={{ fontSize: 16 }} />;
    };
    const activityColor = (type) => {
        if (type === 'lesson') return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-500/30' };
        if (type === 'quiz')   return { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30' };
        return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' };
    };

    const skillColors = [
        'linear-gradient(90deg,#6366f1,#8b5cf6)',
        'linear-gradient(90deg,#f59e0b,#f97316)',
        'linear-gradient(90deg,#10b981,#06b6d4)',
        'linear-gradient(90deg,#ec4899,#f43f5e)',
        'linear-gradient(90deg,#3b82f6,#06b6d4)',
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                    <ShowChartIcon className="text-rose-500 dark:text-rose-400" />
                    Progres Saya
                </h2>
            }
        >
            <Head title="Progres - Japanlingo" />

            <div className="relative min-h-screen overflow-hidden bg-[#eef6f2] pb-12 transition-colors duration-300 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,185,129,0.14)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.09)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(6,95,70,0.045)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(6,95,70,0.035)_0_1px,transparent_1px_78px)] dark:bg-[linear-gradient(130deg,rgba(16,185,129,0.10)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.12)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(255,255,255,0.032)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(255,255,255,0.026)_0_1px,transparent_1px_78px)]" />
                <div className="pointer-events-none absolute left-6 top-36 hidden text-[12rem] font-black leading-none text-emerald-900/[0.045] dark:text-white/[0.035] lg:block">進</div>
                <div className="pointer-events-none absolute right-8 top-[700px] hidden text-[12rem] font-black leading-none text-red-900/[0.04] dark:text-white/[0.03] lg:block">練</div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                    {/* ── HERO SECTION ───────────────────────────────────────── */}
                    <section className="relative overflow-hidden rounded-[2rem] mb-8 border border-white/70 bg-white/62 p-8 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/62">
                        {/* Kanji Watermark */}
                        <span
                            aria-hidden="true"
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-[160px] font-black leading-none select-none pointer-events-none opacity-[0.03] dark:opacity-[0.04] text-rose-900 dark:text-white transition-colors duration-300"
                            style={{ fontFamily: 'serif' }}
                        >
                            進
                        </span>

                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-red-500 to-amber-400" />
                        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(15,23,42,0.035)_0_1px,transparent_1px_18px)] dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_18px)]" />

                        <div className="relative z-10">
                        <p className="text-rose-600 dark:text-rose-300 text-xs font-bold uppercase tracking-widest mb-1 transition-colors duration-300">Dasbor Progres</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6 transition-colors duration-300">Perjalanan Belajarmu <TranslateIcon className="w-6 h-6 inline-block" /></h1>

                        <motion.div
                            variants={stagger}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
                        >
                            {statCards.map((s, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeUp}
                                    className={`relative rounded-2xl p-5 ring-1 ${s.ring} shadow-sm dark:shadow-xl ${s.glow} overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur-md transition-all duration-300`}
                                    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                >
                                    {/* Gradient accent strip */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white mb-3 shadow-md dark:shadow-lg`}>
                                        {s.icon}
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none transition-colors duration-300">
                                        <CountUp target={s.value} />
                                    </p>
                                    <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-gray-400 mt-1 transition-colors duration-300">{s.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                        </div>
                    </section>

                    <div className="mb-8">
                        <MascotGuide
                            tone="green"
                            title="Peta perkembangan"
                            message="XP menunjukkan aktivitas, streak menunjukkan konsistensi, dan skill bar menunjukkan area yang perlu diperkuat minggu ini."
                        />
                    </div>

                    {/* ── MAIN GRID ──────────────────────────────────────────── */}
                    <div className="grid lg:grid-cols-3 gap-6">

                        {/* ── LEFT COL (chart + skills) ───────────────────────── */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* WEEKLY ACTIVITY CHART */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.55 }}
                                className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/72"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg transition-colors duration-300">Aktivitas Mingguan</h3>
                                        <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5 transition-colors duration-300">XP yang dikumpulkan 7 hari terakhir</p>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-xl transition-colors duration-300">
                                        Total: {totalXP.toLocaleString()} XP
                                    </span>
                                </div>

                                <div className="flex items-end gap-2 h-44">
                                    {weekActivity.map((d, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex-1 flex flex-col items-center gap-1.5"
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            transition={{ delay: 0.3 + i * 0.07, duration: 0.5, ease: 'easeOut' }}
                                            style={{ transformOrigin: 'bottom' }}
                                        >
                                            {d.xp > 0 && (
                                                <span className={`text-[10px] font-bold ${d.today ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-gray-500'} transition-colors duration-300`}>
                                                    {d.xp}
                                                </span>
                                            )}
                                            <div className="w-full relative" style={{ height: '120px' }}>
                                                {/* Background track */}
                                                <div className="absolute inset-0 bg-slate-100 dark:bg-gray-800 rounded-2xl transition-colors duration-300" />
                                                {/* Bar */}
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 rounded-2xl transition-all duration-700"
                                                    style={{
                                                        height: d.height || '0%',
                                                        minHeight: d.xp > 0 ? '8px' : '0',
                                                        background: d.today
                                                            ? 'linear-gradient(180deg,#fbbf24,#f59e0b)'
                                                            : 'linear-gradient(180deg,#6366f1,#7c3aed)',
                                                        boxShadow: d.today
                                                            ? '0 0 12px rgba(251,191,36,0.4)'
                                                            : '0 0 8px rgba(99,102,241,0.3)',
                                                    }}
                                                />
                                                {/* Today ring */}
                                                {d.today && (
                                                    <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/60 ring-offset-1 ring-offset-white dark:ring-offset-gray-900 transition-colors duration-300" />
                                                )}
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase ${d.today ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-gray-500'} transition-colors duration-300`}>
                                                {d.day}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* SKILL BREAKDOWN */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.55 }}
                                className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/72"
                            >
                                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 transition-colors duration-300">Kemampuan Skill</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-500 mb-6 transition-colors duration-300">Persentase penguasaan per topik</p>

                                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                                    {skills.map((s, i) => (
                                        <motion.div key={i} variants={fadeUp}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ background: skillColors[i % skillColors.length].split(',')[1]?.replace(')', '').trim() || '#6366f1' }}
                                                    />
                                                    <span className="text-sm font-bold text-slate-800 dark:text-gray-200 transition-colors duration-300">{s.label}</span>
                                                </div>
                                                <span className="text-xs font-black text-slate-500 dark:text-gray-400 tabular-nums transition-colors duration-300">{s.value}%</span>
                                            </div>
                                            <AnimBar value={s.value} color={skillColors[i % skillColors.length]} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* ── RIGHT COL (JLPT + activity) ─────────────────────── */}
                        <div className="space-y-6">

                            {/* JLPT JOURNEY */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25, duration: 0.55 }}
                                className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/72"
                            >
                                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 transition-colors duration-300">Perjalanan JLPT</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-500 mb-6 transition-colors duration-300">Level yang sudah & belum tercapai</p>

                                {/* Badge row */}
                                <div className="flex justify-between items-start gap-1 mb-6 px-1">
                                    {jlptJourney.map((l, i) => {
                                        const isActive = !l.done && l.pct > 0;
                                        const isDone   = l.done;
                                        return (
                                            <motion.div
                                                key={i}
                                                className="flex flex-col items-center gap-2 flex-1"
                                                initial={{ opacity: 0, scale: 0.6 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.4 + i * 0.1, duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] }}
                                            >
                                                <div
                                                    className={`
                                                        relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm
                                                        transition-all duration-300
                                                        ${isDone
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                                            : isActive
                                                            ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-400/30 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                                                            : 'bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-500'
                                                        }
                                                    `}
                                                >
                                                    {isDone
                                                        ? <CheckCircleIcon sx={{ fontSize: 22 }} />
                                                        : l.level}
                                                    {isActive && (
                                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse transition-colors duration-300" />
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase transition-colors duration-300 ${isDone ? 'text-emerald-500' : isActive ? 'text-rose-500' : 'text-slate-400 dark:text-gray-500'}`}>
                                                    {l.level}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Connector line + individual progress */}
                                <div className="space-y-3">
                                    {jlptJourney.map((l, i) => {
                                        const isActive = !l.done && l.pct > 0;
                                        const isDone   = l.done;
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black w-6 shrink-0 transition-colors duration-300 ${isDone ? 'text-emerald-500' : isActive ? 'text-rose-500' : 'text-slate-400 dark:text-gray-500'}`}>
                                                    {l.level}
                                                </span>
                                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden transition-colors duration-300">
                                                    <motion.div
                                                        className={`h-full rounded-full transition-colors duration-300 ${!isDone && !isActive ? 'bg-slate-200 dark:bg-gray-700' : ''}`}
                                                        style={{
                                                            background: isDone
                                                                ? 'linear-gradient(90deg,#10b981,#06b6d4)'
                                                                : isActive
                                                                ? 'linear-gradient(90deg,#f43f5e,#f97316)'
                                                                : undefined,
                                                        }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${l.pct}%` }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 w-8 text-right tabular-nums transition-colors duration-300">
                                                    {l.pct}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* RECENT ACTIVITY TIMELINE */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.55 }}
                                className="rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/72"
                            >
                                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1 transition-colors duration-300">Aktivitas Terkini</h3>
                                <p className="text-xs text-slate-500 dark:text-gray-500 mb-5 transition-colors duration-300">Riwayat belajar kamu</p>

                                <div className="space-y-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                                    {recentActivity.length > 0 ? recentActivity.map((a, i) => {
                                        const c = activityColor(a.type);
                                        return (
                                            <motion.div
                                                key={i}
                                                className="flex items-start gap-3"
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + i * 0.07, duration: 0.4 }}
                                            >
                                                {/* Timeline line */}
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-xl ${c.bg} border ${c.border} ${c.text} flex items-center justify-center shrink-0 transition-colors duration-300`}>
                                                        {activityIcon(a.type)}
                                                    </div>
                                                    {i < recentActivity.length - 1 && (
                                                        <div className="w-px h-4 bg-slate-200 dark:bg-gray-700 mt-1 transition-colors duration-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pb-1">
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-snug line-clamp-2 transition-colors duration-300">{a.text}</p>
                                                    <div className="flex items-center justify-between mt-1 gap-2">
                                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 transition-colors duration-300">{a.time}</span>
                                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 transition-colors duration-300">
                                                            +{a.xp} XP
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="text-center py-8 transition-colors duration-300">
                                            <p className="text-4xl mb-2"><LibraryBooksIcon className="w-8 h-8 text-gray-400 inline-block" /></p>
                                            <p className="text-xs text-slate-400 dark:text-gray-500">Belum ada aktivitas.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
