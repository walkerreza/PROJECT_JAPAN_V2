import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { LearningStatBadge, MascotGuide, SeasonalScene } from '@/Components/User/UserVisuals';
import theme from '@/Components/theme/themes';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StyleIcon from '@mui/icons-material/Style';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Posisi zigzag kiri-kanan untuk path ala Duolingo
const PATH_POSITIONS = ['50%', '30%', '65%', '25%', '60%', '35%', '50%', '70%', '40%', '55%'];

// Warna state node
const nodeStyles = {
    done:    { bg: '#22c55e', shadow: '#15803d', text: '#fff' },
    active:  { bg: '#dc2626', shadow: '#991b1b', text: '#fff' },
    locked:  { bg: '#e5e7eb', shadow: '#d1d5db', text: '#9ca3af' },
    unavailable: { bg: '#f3f4f6', shadow: '#d1d5db', text: '#9ca3af' },
};

function WeekTooltip({ week, onStart, placement = 'right' }) {
    const hasContent = week.has_content ?? Boolean(week.flashcard_set_id || week.quiz_id);
    const primaryStudyUrl = week.primary_url || week.flashcard_url || week.quiz_url;
    const hasStudyContent = Boolean(primaryStudyUrl);
    const canOpenStudy = ['active', 'done'].includes(week.status) && hasStudyContent;
    const actionButtonClass = week.status === 'done'
        ? 'bg-green-600 hover:bg-green-700'
        : 'bg-red-600 hover:bg-red-700';
    const lockedText = week.lock_reason || 'Selesaikan minggu sebelumnya';
    const unavailableText = week.lock_reason || 'Konten belum tersedia';
    const desktopPosition = placement === 'left'
        ? 'sm:right-full sm:mr-5 sm:left-auto'
        : 'sm:left-full sm:ml-5';
    const desktopArrow = placement === 'left'
        ? 'sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:border-8 sm:border-transparent sm:border-l-gray-900 sm:translate-x-0'
        : 'sm:right-full sm:top-1/2 sm:-translate-y-1/2 sm:border-8 sm:border-transparent sm:border-r-gray-900 sm:translate-x-0';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 top-full mt-4 left-1/2 w-[min(78vw,260px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-gray-900 px-5 py-4 text-left text-white shadow-2xl shadow-gray-900/30 sm:top-1/2 sm:mt-0 sm:w-64 sm:-translate-y-1/2 sm:translate-x-0 ${desktopPosition}`}
        >
            <p className="font-black text-sm mb-1">{week.title}</p>
            <p className="text-gray-400 text-xs mb-3">{week.subtitle}</p>
            {/* Fase info */}
            <div className="flex gap-2 justify-center mb-3">
                <span className="flex items-center gap-1 text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-bold">
                    <StyleIcon sx={{ fontSize: 10 }} /> Flashcard
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold">
                    <QuizIcon sx={{ fontSize: 10 }} /> Kuis
                </span>
            </div>
            {canOpenStudy && (
                <button
                    onClick={onStart}
                    className={`w-full rounded-xl py-2 text-xs font-black text-white transition-colors ${actionButtonClass}`}
                >
                    {week.primary_label || (week.status === 'done' ? 'Ulangi Sesi' : 'Mulai Sekarang')}
                </button>
            )}
            {week.status === 'active' && hasContent && !hasStudyContent && (
                <span className="text-gray-500 text-xs font-bold">Buka detail untuk memilih PPT atau kosakata.</span>
            )}
            {week.status === 'active' && !hasContent && (
                <span className="text-gray-500 text-xs font-bold">Konten belum tersedia.</span>
            )}
            {week.status === 'done' && (
                <span className="text-green-400 text-xs font-bold">Selesai</span>
            )}
            {week.status === 'locked' && (
                <span className="text-gray-500 text-xs font-bold">{lockedText}</span>
            )}
            {week.status === 'unavailable' && (
                <span className="text-gray-500 text-xs font-bold">{unavailableText}</span>
            )}
            {/* Arrow */}

            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900 sm:bottom-auto ${desktopArrow}`} />
        </motion.div>
    );
}

function ModulDetailPanel({ week, onClose }) {
    const hasContent = week.has_content ?? Boolean(week.flashcard_set_id || week.quiz_id);
    const canOpenResource = ['active', 'done'].includes(week.status);
    const primaryStudyUrl = week.primary_url || week.flashcard_url || week.quiz_url;
    const canStart = canOpenResource && Boolean(primaryStudyUrl);
    const startButtonClass = week.status === 'done'
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white';
    const statusLabel = {
        done: 'Selesai',
        active: hasContent ? 'Sedang berjalan' : 'Konten belum tersedia',
        locked: week.lock_reason || 'Terkunci',
        unavailable: week.lock_reason || 'Konten belum tersedia',
    }[week.status] || 'Terkunci';

    const handleStart = () => {
        if (!canStart) return;
        window.location.href = primaryStudyUrl;
    };

    const resourceItems = [
        {
            label: 'PPT / Board',
            count: week.presentations_count ?? 0,
            href: week.presentation_url,
            icon: <SlideshowIcon sx={{ fontSize: 22 }} />,
            tone: 'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/25 dark:text-sky-300',
        },
        {
            label: 'Kosakata',
            count: week.vocabulary_count ?? 0,
            href: week.vocabulary_url,
            icon: <TranslateIcon sx={{ fontSize: 22 }} />,
            tone: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-300',
        },
        {
            label: 'Flashcard',
            count: week.flashcard_total ?? 0,
            href: week.flashcard_url,
            icon: <StyleIcon sx={{ fontSize: 22 }} />,
            tone: 'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/25 dark:text-orange-300',
        },
        {
            label: 'Kuis',
            count: week.questions_count ?? 0,
            href: week.quiz_url,
            lockedReason: week.quiz_locked_reason,
            icon: <QuizIcon sx={{ fontSize: 22 }} />,
            tone: 'border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/25 dark:text-red-300',
        },
    ];

    return (
        <motion.div
            className="fixed inset-0 z-40 flex justify-end bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.aside
                className="h-full w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl p-6 overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-red-600 mb-2">Detail Modul</p>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{week.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{week.subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center"
                        aria-label="Tutup detail modul"
                    >
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Status</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{statusLabel}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {resourceItems.map((item) => {
                            const enabled = canOpenResource && item.href && item.count > 0;
                            const content = (
                                <>
                            <div className="mb-2">{item.icon}</div>
                            <p className="text-sm font-black">{item.label}</p>
                            <p className="mt-1 text-xs font-bold opacity-70">{item.count} item</p>
                            {item.lockedReason && <p className="mt-2 text-[11px] font-black leading-4 opacity-80">{item.lockedReason}</p>}
                        </>
                    );

                            return enabled ? (
                                <Link key={item.label} href={item.href} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${item.tone}`}>
                                    {content}
                                </Link>
                            ) : (
                                <div key={item.label} className={`rounded-2xl border p-4 opacity-55 ${item.tone}`}>
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleStart}
                    disabled={!canStart}
                    className={`w-full rounded-2xl py-3 text-sm font-black transition-colors ${
                        canStart
                            ? startButtonClass
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-400 cursor-not-allowed'
                    }`}
                >
                        {canStart ? (week.primary_label || (week.status === 'done' ? 'Ulangi Sesi' : 'Mulai Belajar')) : (hasContent ? 'Pilih resource di atas' : statusLabel)}
                </button>
            </motion.aside>
        </motion.div>
    );
}

function ResourceBar({ resources = {} }) {
    const items = [
        {
            label: 'PPT / Board',
            count: resources.presentations_count ?? 0,
            href: resources.presentations_url,
            icon: <SlideshowIcon sx={{ fontSize: 22 }} />,
            tone: 'from-sky-500 to-cyan-600',
        },
        {
            label: 'Kosakata',
            count: resources.vocabulary_count ?? 0,
            href: resources.vocabulary_url,
            icon: <TranslateIcon sx={{ fontSize: 22 }} />,
            tone: 'from-emerald-500 to-teal-600',
        },
        {
            label: 'Flashcard',
            count: resources.flashcard_count ?? 0,
            href: resources.flashcards_url,
            icon: <StyleIcon sx={{ fontSize: 22 }} />,
            tone: 'from-orange-500 to-amber-600',
        },
        {
            label: 'Kuis',
            count: resources.quiz_count ?? 0,
            href: resources.quizzes_url,
            icon: <QuizIcon sx={{ fontSize: 22 }} />,
            tone: 'from-red-500 to-rose-600',
        },
    ];

    return (
        <section className="relative z-10 px-6 pb-6 lg:px-20">
            <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => {
                    const disabled = !item.href || item.count === 0;
                    const className = `group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-4 text-left shadow-xl shadow-red-900/5 backdrop-blur-md transition dark:border-gray-800 dark:bg-gray-900/70 ${
                        disabled ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-1 hover:shadow-2xl'
                    }`;
                    const content = (
                        <>
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-lg`}>
                                {item.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-gray-900 dark:text-white">{item.label}</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.count} item tersedia</p>
                            </div>
                        </>
                    );

                    return disabled ? (
                        <div key={item.label} className={className}>
                            {content}
                        </div>
                    ) : (
                        <Link key={item.label} href={item.href} className={className}>
                            {content}
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}


export default function DaftarModul({ weeks = [], userProgress = {}, program = null, back_url = null }) {
    const [openTooltip, setOpenTooltip] = useState(null);
    const [clickedTooltip, setClickedTooltip] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(null);

    const handleMouseEnter = (i) => setOpenTooltip(i);
    const handleMouseLeave = (i) => { if (clickedTooltip !== i) setOpenTooltip(null); };
    const handleClick = (i, isLocked, week) => {
        setSelectedWeek(week);
        if (isLocked) return;
        if (clickedTooltip === i) {
            setClickedTooltip(null);
            setOpenTooltip(null);
        } else {
            setClickedTooltip(i);
            setOpenTooltip(i);
        }
    };
    const isOpen = (i) => openTooltip === i || clickedTooltip === i;

    // Jika tidak ada data dari backend, tampilkan placeholder
    const displayWeeks = weeks.length > 0 ? weeks : [
        { id: 1, title: 'Week 1 - Perkenalan', subtitle: 'Admin belum menambahkan modul.', status: 'unavailable', has_content: false, flashcard_set_id: null, quiz_id: null },
    ];

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`${program?.title || 'Modul'} - Japanlingo`} />

            <div className="relative min-h-screen overflow-hidden bg-[#f7efe6] pb-24 text-gray-900 transition-colors duration-300 sm:pb-0 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,38,38,0.10)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.12)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(120,53,15,0.055)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(120,53,15,0.045)_0_1px,transparent_1px_82px)] dark:bg-[linear-gradient(120deg,rgba(220,38,38,0.14)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.08)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0_1px,transparent_1px_82px)]" />
                <div className="pointer-events-none absolute left-4 top-40 hidden text-[13rem] font-black leading-none text-red-900/[0.045] dark:text-white/[0.035] lg:block">道</div>
                <div className="pointer-events-none absolute right-8 top-[560px] hidden text-[12rem] font-black leading-none text-amber-900/[0.05] dark:text-white/[0.03] lg:block">週</div>
                <div className="relative z-10 px-6 pt-8 lg:px-20">
                    <SeasonalScene
                        title={`Roadmap ${program?.title || 'Mingguan JLPT N3'}`}
                        subtitle="Setiap node adalah satu quest: flashcard untuk mengenal pola, kuis untuk mengunci mastery, lalu lanjut ke minggu berikutnya."
                        label="Weekly Roadmap"
                        icon="torii"
                        compact
                    >
                        <div className="grid w-full max-w-sm grid-cols-3 gap-3">
                            <LearningStatBadge icon={<CheckCircleIcon sx={{ fontSize: 20 }} />} label="Selesai" value={displayWeeks.filter(w => w.status === 'done').length} color="green" />
                            <LearningStatBadge icon={<PlayArrowIcon sx={{ fontSize: 20 }} />} label="Aktif" value={displayWeeks.filter(w => w.status === 'active').length} color="red" />
                            <LearningStatBadge icon={<LockIcon sx={{ fontSize: 20 }} />} label="Terkunci" value={displayWeeks.filter(w => w.status === 'locked' || w.status === 'unavailable').length} color="amber" />
                        </div>
                    </SeasonalScene>
                </div>

                {/* Hero Section */}
                <div className="relative z-10 px-6 pt-12 pb-8 lg:px-20">
                    <div className="max-w-2xl mx-auto text-center">
                        {back_url && (
                            <Link
                                href={back_url}
                                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-600 dark:border-gray-800 dark:bg-gray-900/75 dark:text-gray-300"
                            >
                                <ArrowBackIcon sx={{ fontSize: 16 }} />
                                Pilih Program
                            </Link>
                        )}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/10 text-red-600 text-xs font-bold uppercase tracking-wider mb-5">
                            <AutoStoriesIcon sx={{ fontSize: 14 }} />
                            {program?.level ? `Kurikulum ${program.level}` : 'Kurikulum JLPT N3'}
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                            {program?.title ? `Peta ${program.title}` : 'Peta Perjalanan Mingguan'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base leading-relaxed">
                            Setiap minggu berisi <strong>PPT/Kosakata</strong> sebagai penunjang, lalu <strong>Flashcard</strong> dan <strong>Kuis</strong> sebagai jalur utama. Selesaikan satu minggu untuk membuka minggu berikutnya.
                        </p>

                        {/* Stats mini */}
                        <div className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-4 rounded-[1.5rem] border border-white/70 bg-white/55 px-5 py-4 shadow-xl shadow-red-900/5 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/55">
                            <div className="text-center">
                                <p className="text-2xl font-black text-green-600">{displayWeeks.filter(w => w.status === 'done').length}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selesai</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-red-600">{displayWeeks.length}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Minggu</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-700 dark:text-gray-300">
                                    {displayWeeks.filter(w => w.status === 'locked').length}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Terkunci</p>
                            </div>
                        </div>

                        {program?.kloter ? (
                            <div className="mx-auto mt-4 max-w-xl rounded-[1.5rem] border border-emerald-100 bg-emerald-50/80 px-5 py-4 text-left shadow-sm dark:border-emerald-900/35 dark:bg-emerald-900/20">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Kloter aktif</p>
                                <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">{program.kloter.nama}</p>
                                <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Week aktif: {program.kloter.minggu_aktif || 0} - mulai {program.kloter.tanggal_mulai || '-'}
                                </p>
                            </div>
                        ) : (
                            <div className="mx-auto mt-4 max-w-xl rounded-[1.5rem] border border-amber-100 bg-amber-50/80 px-5 py-4 text-left shadow-sm dark:border-amber-900/35 dark:bg-amber-900/20">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">Belum masuk kloter</p>
                                <p className="mt-1 text-xs font-semibold leading-5 text-gray-500 dark:text-gray-400">
                                    Roadmap masih memakai akses umum. Setelah masuk kloter, pembukaan week akan mengikuti tanggal mulai batch.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <ResourceBar resources={program?.resources} />

                {/* Path Section */}
                <div className="relative z-10 px-6 py-10 pb-24">
                    <div className="mx-auto mb-10 max-w-3xl">
                        <MascotGuide
                            title="Tips Jalur Belajar"
                            message="Node abu-abu berarti belum saatnya dibuka. Node aktif bisa dimulai, dan node hijau sudah selesai. Klik node untuk melihat detail flashcard dan kuis."
                        />
                    </div>
                    {Object.entries(
                        displayWeeks.reduce((acc, week) => {
                            const wn = week.week_number || 1;
                            if (!acc[wn]) acc[wn] = [];
                            acc[wn].push(week);
                            return acc;
                        }, {})
                    ).map(([weekNumber, groupWeeks], groupIdx) => (
                        <div key={weekNumber} className="relative mb-24">
                            {/* Week Header */}
                            <div className="max-w-xl mx-auto mb-10 text-center relative z-10">
                                <div className="inline-block bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-[0_6px_0_#991b1b] transform hover:-translate-y-1 transition-transform cursor-default">
                                    <h2 className="text-xl">Unit {weekNumber}</h2>
                                    <p className="text-xs font-bold text-red-100 uppercase tracking-widest mt-1">
                                        Kumpulan Modul
                                    </p>
                                </div>
                            </div>
                            
                            <div className="max-w-lg mx-auto relative rounded-[2rem] border border-white/70 bg-white/35 py-10 shadow-2xl shadow-red-900/5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/35" style={{ minHeight: `${groupWeeks.length * 130 + 160}px` }}>

                                {/* SVG Connector Lines */}
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    viewBox={`0 0 400 ${groupWeeks.length * 130 + 160}`}
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id={`weekPathGrad-${weekNumber}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={theme.pathGrad?.[0] || '#dc2626'} />
                                            <stop offset="50%" stopColor={theme.pathGrad?.[1] || '#f97316'} />
                                            <stop offset="100%" stopColor={theme.pathGrad?.[2] || '#e5e7eb'} />
                                        </linearGradient>
                                    </defs>
                                    {groupWeeks.slice(0, -1).map((_, i) => {
                                        const positions = PATH_POSITIONS;
                                        const pct1 = parseFloat(positions[i % positions.length]) / 100;
                                        const pct2 = parseFloat(positions[(i + 1) % positions.length]) / 100;
                                        const x1 = pct1 * 400;
                                        const x2 = pct2 * 400;
                                        const y1 = i * 130 + 105;
                                        const y2 = (i + 1) * 130 + 105;
                                        const isDone = groupWeeks[i].status === 'done';
                                        return (
                                            <line
                                                key={i}
                                                x1={x1} y1={y1}
                                                x2={x2} y2={y2}
                                                stroke={isDone ? '#22c55e' : `url(#weekPathGrad-${weekNumber})`}
                                                strokeWidth="5"
                                                strokeDasharray="12 7"
                                                strokeLinecap="round"
                                                opacity={isDone ? 0.9 : 0.45}
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Week Nodes */}
                                {groupWeeks.map((week, i) => {
                                    const left = PATH_POSITIONS[i % PATH_POSITIONS.length];
                                    const style = nodeStyles[week.status] || nodeStyles.locked;
                                    const isDone = week.status === 'done';
                                    const isActive = week.status === 'active';
                                    const isLocked = week.status === 'locked' || week.status === 'unavailable';
                                    const isFinal = week.isFinal;
                                    const tooltipId = `tooltip-${week.id}`;

                                    return (
                                        <div
                                            key={week.id}
                                            className="absolute"
                                            style={{ left, top: `${i * 130 + 40}px`, transform: 'translateX(-50%)' }}
                                        >
                                            {/* Tooltip */}
                                            <AnimatePresence>
                                                {(openTooltip === tooltipId || clickedTooltip === tooltipId) && (
                                                    <WeekTooltip
                                                        week={week}
                                                        placement={parseFloat(left) > 50 ? 'left' : 'right'}
                                                  onStart={() => {
                                                      const target = week.primary_url || week.flashcard_url || week.quiz_url;
                                                      if (target) {
                                                          window.location.href = target;
                                                      }
                                                      setOpenTooltip(null);
                                                      setClickedTooltip(null);
                                                        }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Pulse ring for active */}
                                            {isActive && (
                                                <div
                                                    className="absolute inset-0 rounded-full animate-ping opacity-25"
                                                    style={{ backgroundColor: style.bg, margin: '-8px' }}
                                                />
                                            )}

                                            {/* Node Button */}
                                            <button
                                                onMouseEnter={() => handleMouseEnter(tooltipId)}
                                                onMouseLeave={() => handleMouseLeave(tooltipId)}
                                                onClick={() => handleClick(tooltipId, isLocked, week)}
                                                className="relative flex flex-col items-center gap-2 focus:outline-none group"
                                            >
                                        {/* Circle */}
                                        <motion.div
                                            whileHover={!isLocked ? { scale: 1.1 } : {}}
                                            whileTap={!isLocked ? { scale: 0.95 } : {}}
                                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200"
                                            style={{
                                                backgroundColor: style.bg,
                                                boxShadow: `0 6px 0 ${style.shadow}`,
                                                border: isActive ? '4px solid #fff' : 'none',
                                                outline: isActive ? `3px solid ${style.bg}` : 'none',
                                            }}
                                        >
                                            {isDone ? (
                                                <CheckCircleIcon sx={{ fontSize: 40, color: '#fff' }} />
                                            ) : isLocked ? (
                                                <LockIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
                                            ) : isFinal ? (
                                                <EmojiEventsIcon sx={{ fontSize: 36, color: '#fff' }} />
                                            ) : (
                                                <div className="text-center">
                                                    <StyleIcon sx={{ fontSize: 22, color: '#fff' }} />
                                                    <p className="text-[9px] text-white font-black mt-0.5">WEEK</p>
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Stars for done */}
                                        {isDone && (
                                            <div className="flex gap-0.5">
                                                {[0, 1, 2].map(s => (
                                                    <StarIcon key={s} sx={{ fontSize: 13, color: '#FFD700' }} />
                                                ))}
                                            </div>
                                        )}

                                        {/* MULAI button bounce for active */}
                                        {isActive && (
                                            <motion.span
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.2 }}
                                                className="text-white text-xs font-black px-4 py-1.5 rounded-full shadow-md"
                                                style={{ backgroundColor: style.bg }}
                                            >
                                                MULAI
                                            </motion.span>
                                        )}

                                        {/* Week label */}
                                        <span
                                            className="text-[11px] font-bold max-w-[110px] text-center leading-tight"
                                            style={{ color: isLocked ? '#9ca3af' : '#374151' }}
                                        >
                                            {week.title}
                                        </span>

                                        {/* Phase indicators */}
                                        {!isLocked && (
                                            <div className="flex gap-1 items-center">
                                                <span className={`w-2 h-2 rounded-full ${week.flashcard_done ? 'bg-orange-400' : 'bg-gray-200'}`} title="Flashcard" />
                                                <span className={`w-2 h-2 rounded-full ${week.quiz_done ? 'bg-red-400' : 'bg-gray-200'}`} title="Kuis" />
                                            </div>
                                        )}

                                        {isFinal && (
                                            <span className="text-amber-500 text-[10px] font-black uppercase tracking-wide">Ujian Akhir</span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="fixed bottom-4 left-4 right-4 z-20 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
                    <div className="max-w-full overflow-x-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900 sm:overflow-visible">
                    <div className="flex min-w-max items-center gap-4 rounded-2xl border border-gray-100 px-4 py-3 text-[11px] font-bold text-gray-500 dark:border-gray-800 sm:gap-5 sm:px-5 sm:text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                            Selesai
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                            Sedang Berjalan
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                            Terkunci
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                            Flashcard / Kuis
                        </div>
                    </div>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedWeek && (
                        <ModulDetailPanel
                            week={selectedWeek}
                            onClose={() => setSelectedWeek(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </AuthenticatedLayout>
    );
}
