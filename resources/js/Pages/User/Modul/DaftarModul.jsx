import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import StyleIcon from '@mui/icons-material/Style';

const RESOURCE_COLORS = {
    presentation: { color: '#0284c7', shadow: '#075985' },
    day: { color: '#dc2626', shadow: '#991b1b' },
    flashcard: { color: '#f97316', shadow: '#c2410c' },
    quiz: { color: '#e11d48', shadow: '#9f1239' },
    exam: { color: '#16a34a', shadow: '#166534' },
};

function itemStatusLabel(item) {
    if (item.status === 'done') return 'Selesai';
    if (item.status === 'active') return 'Lanjutkan';
    if (item.status === 'unavailable') return 'Belum tersedia';
    return 'Terkunci';
}

function nodeColors(item) {
    if (item.status === 'done') {
        return {
            color: theme.doneColor || '#22c55e',
            shadow: theme.doneShadow || '#15803d',
        };
    }

    if (['locked', 'unavailable'].includes(item.status)) {
        return {
            color: item.status === 'unavailable' ? '#f3f4f6' : '#e5e7eb',
            shadow: '#cbd5e1',
        };
    }

    return RESOURCE_COLORS[item.kind] || RESOURCE_COLORS.day;
}

function iconFor(item, size) {
    if (item.status === 'done') {
        return <CheckCircleIcon sx={{ fontSize: size, color: '#fff' }} />;
    }

    if (['locked', 'unavailable'].includes(item.status)) {
        return <LockIcon sx={{ fontSize: size - 5, color: '#9ca3af' }} />;
    }

    if (item.kind === 'presentation') {
        return <SlideshowIcon sx={{ fontSize: size - 3, color: '#fff' }} />;
    }

    if (item.kind === 'flashcard') {
        return <StyleIcon sx={{ fontSize: size - 3, color: '#fff' }} />;
    }

    if (item.kind === 'quiz' || item.kind === 'exam') {
        return <QuizIcon sx={{ fontSize: size - 3, color: '#fff' }} />;
    }

    return (
        <span className="text-center text-white">
            <span className="block text-[8px] font-black uppercase">Hari</span>
            <span className="block text-xl font-black leading-none">{item.dayNumber}</span>
        </span>
    );
}

function flashcardItems(day, available) {
    const sets = day.flashcard_summary?.sets || [];

    if (sets.length === 0) {
        return [{
            key: `flashcard-empty-${day.id}`,
            kind: 'flashcard',
            level: 'child',
            parentDayId: day.id,
            eyebrow: `Materi Hari ${day.day_number}`,
            title: 'Flashcard belum tersedia',
            detail: 'Admin belum menambahkan flashcard.',
            status: 'unavailable',
            href: null,
        }];
    }

    return sets.map((set) => {
        const done = set.cards_count > 0 && set.reviewed_count >= set.cards_count;

        return {
            key: `flashcard-${set.id}`,
            kind: 'flashcard',
            level: 'child',
            parentDayId: day.id,
            eyebrow: `Flashcard Hari ${day.day_number}`,
            title: 'Flashcard',
            detail: null,
            status: !available ? 'locked' : done ? 'done' : 'active',
            lockReason: day.lock_reason,
            href: available ? set.url : null,
        };
    });
}

function quizItem(day, available) {
    const checkpoint = day.checkpoint_summary;

    if (!checkpoint) {
        return {
            key: `quiz-empty-${day.id}`,
            kind: 'quiz',
            level: 'child',
            parentDayId: day.id,
            eyebrow: `Evaluasi Hari ${day.day_number}`,
            title: `Kuis Hari ${day.day_number}`,
            detail: 'Admin belum menambahkan kuis checkpoint.',
            status: 'unavailable',
            href: null,
        };
    }

    return {
        key: `quiz-${day.id}`,
        kind: 'quiz',
        level: 'child',
        parentDayId: day.id,
        eyebrow: `Evaluasi Hari ${day.day_number}`,
        title: 'Kuis',
        detail: null,
        status: !available || checkpoint.locked
            ? 'locked'
            : day.status === 'done'
                ? 'done'
                : 'active',
        lockReason: checkpoint.lock_reason || day.quiz_locked_reason || 'Review semua flashcard Hari ini.',
        href: day.quiz_url,
    };
}

function weeklyMainItems(week) {
    const items = [];
    const presentations = week.presentations || [];
    const presentationItem = (presentation, eyebrow) => ({
        key: `presentation-${presentation.id}`,
        kind: 'presentation',
        level: 'root',
        eyebrow,
        title: presentation.title,
        detail: `${presentation.slides_count} slide`,
        status: presentation.locked ? 'locked' : 'active',
        lockReason: presentation.placement === 'closing'
            ? 'Selesaikan ujian Mingguan untuk membuka presentasi ini.'
            : presentation.placement === 'after_day'
                ? 'Selesaikan Day terkait untuk membuka presentasi ini.'
                : 'Minggu ini belum terbuka.',
        href: presentation.url,
        mainPosition: items.length % 2 === 0 ? 'left' : 'right',
    });

    presentations
        .filter((presentation) => presentation.placement === 'opening')
        .forEach((presentation) => items.push(presentationItem(
            presentation,
            `Pembuka Minggu ${week.week_number}`,
        )));

    const days = week.days || [];

    days.forEach((day) => {
        items.push({
            key: `day-${day.id}`,
            kind: 'day',
            level: 'root',
            dayId: day.id,
            dayNumber: day.day_number,
            eyebrow: `Hari ${day.day_number}`,
            title: day.title || `Materi Hari ${day.day_number}`,
            detail: null,
            status: day.status,
            lockReason: day.lock_reason,
            day,
            mainPosition: items.length % 2 === 0 ? 'left' : 'right',
        });

        presentations
            .filter((presentation) => (
                presentation.placement === 'after_day'
                && Number(presentation.module_day_id) === Number(day.id)
            ))
            .forEach((presentation) => items.push(presentationItem(
                presentation,
                `Setelah Hari ${day.day_number}`,
            )));
    });

    const exams = week.weekly_exams || [];

    if (exams.length > 0) {
        exams.forEach((exam, examIndex) => {
            const scoreDetail = exam.best_score === null
                ? `Belum dikerjakan - nilai lulus ${exam.passing_score}%`
                : exam.done
                    ? `Lulus - nilai terbaik ${exam.best_score}`
                    : `Belum lulus - nilai terbaik ${exam.best_score} - minimal ${exam.passing_score}%`;

            items.push({
                key: `exam-${exam.id}`,
                kind: 'exam',
                level: 'root',
                eyebrow: `Evaluasi Minggu ${week.week_number}`,
                title: exam.title || `Ujian ${examIndex + 1}`,
                detail: scoreDetail,
                status: exam.done ? 'done' : exam.locked ? 'locked' : 'active',
                lockReason: exam.lock_reason,
                href: exam.url,
                mainPosition: items.length % 2 === 0 ? 'left' : 'right',
            });
        });
    } else {
        items.push({
            key: `exam-empty-${week.id}`,
            kind: 'exam',
            level: 'root',
            eyebrow: `Evaluasi Minggu ${week.week_number}`,
            title: 'Ujian Mingguan',
            detail: 'Admin belum menambahkan ujian Mingguan.',
            status: 'unavailable',
            href: null,
            mainPosition: 'center',
        });
    }

    presentations
        .filter((presentation) => presentation.placement === 'closing')
        .forEach((presentation) => items.push(presentationItem(
            presentation,
            `Penutup Minggu ${week.week_number}`,
        )));

    return items;
}

function dayChildItems(day) {
    const available = ['active', 'done'].includes(day.status);

    return [
        ...flashcardItems(day, available),
        quizItem(day, available),
    ];
}

function PathNodeCircle({ item, selected = false, size = 68 }) {
    const colors = nodeColors(item);
    const active = item.status === 'active';

    return (
        <span
            className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-[3px] border-white transition-transform duration-200 group-hover:scale-105 dark:border-gray-950"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: colors.color,
                boxShadow: `0 6px 0 ${colors.shadow}`,
                outline: selected
                    ? `4px solid ${colors.color}88`
                    : active
                        ? `3px solid ${colors.color}55`
                        : 'none',
            }}
        >
            {active && (
                <span
                    className="absolute inset-1 animate-pulse rounded-full border-2 border-white/45"
                    aria-hidden="true"
                />
            )}
            {iconFor(item, size <= 48 ? 23 : 32)}
        </span>
    );
}

function StatusBadge({ item }) {
    return (
        <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${
            item.status === 'done'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : item.status === 'active'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
        }`}>
            {itemStatusLabel(item)}
        </span>
    );
}

function PathNode({ item, selected, onDayToggle }) {
    const locked = ['locked', 'unavailable'].includes(item.status);
    const className = `group relative inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 ${
        locked ? 'cursor-not-allowed' : ''
    }`;

    if (item.kind === 'day') {
        return (
            <button
                type="button"
                onClick={() => !locked && onDayToggle(item.dayId)}
                disabled={locked}
                aria-expanded={selected}
                aria-controls={`day-materials-${item.dayId}`}
                className={className}
            >
                <PathNodeCircle item={item} selected={selected} />
                {!locked && (
                    <span className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-transform dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 ${selected ? 'rotate-180' : ''}`}>
                        <ExpandMoreIcon sx={{ fontSize: 17 }} />
                    </span>
                )}
            </button>
        );
    }

    if (!locked && item.href) {
        return (
            <Link href={item.href} className={className}>
                <PathNodeCircle item={item} />
            </Link>
        );
    }

    return (
        <div className={className}>
            <PathNodeCircle item={item} />
        </div>
    );
}

function PathNodeLabel({ item }) {
    return (
        <div className="mt-3 w-44 rounded-lg bg-[#f7efe6]/90 px-2 py-1 text-center backdrop-blur-sm dark:bg-[#050b18]/90">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                {item.eyebrow}
            </p>
            <h3 className="mt-0.5 text-sm font-black leading-5 text-gray-900 dark:text-white">
                {item.title}
            </h3>
            <StatusBadge item={item} />
        </div>
    );
}

function DayDetailContent({ day, onClose, mobile = false }) {
    const items = dayChildItems(day);

    return (
        <div
            id={`day-materials-${day.id}`}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900"
        >
            <div className="flex items-start justify-between gap-4 bg-gray-950 px-5 py-4 text-white dark:bg-black">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">
                        Materi Hari {day.day_number}
                    </p>
                    <h3 className="mt-1 text-base font-black leading-5">
                        {day.title || `Hari ${day.day_number}`}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup detail Hari"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                >
                    <CloseIcon sx={{ fontSize: 19 }} />
                </button>
            </div>

            <div className={`space-y-3 p-4 ${mobile ? 'max-h-[55dvh] overflow-y-auto' : ''}`}>
                {items.map((item, index) => {
                    const locked = ['locked', 'unavailable'].includes(item.status);
                    const flashcard = item.kind === 'flashcard';
                    const row = (
                        <>
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                                locked
                                    ? 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                                    : flashcard
                                        ? 'bg-amber-300 text-amber-950'
                                        : 'bg-red-700 text-white'
                            }`}>
                                {flashcard
                                    ? <StyleIcon sx={{ fontSize: 24 }} />
                                    : <QuizIcon sx={{ fontSize: 24 }} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-black">
                                    {flashcard ? 'Flashcard' : 'Kuis'}
                                </span>
                                {locked && (
                                    <span className="mt-0.5 block line-clamp-2 text-[10px] font-semibold opacity-70">
                                        {item.lockReason || 'Materi belum tersedia.'}
                                    </span>
                                )}
                            </span>
                            <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${
                                locked ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300' : 'bg-white/25'
                            }`}>
                                {locked ? itemStatusLabel(item) : 'Buka'}
                            </span>
                        </>
                    );
                    const className = `group flex min-h-[86px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${
                        locked
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                            : flashcard
                                ? 'bg-amber-400 text-amber-950 shadow-[0_4px_0_#b45309] hover:bg-amber-300 active:translate-y-1 active:shadow-none'
                                : 'bg-red-600 text-white shadow-[0_4px_0_#991b1b] hover:bg-red-500 active:translate-y-1 active:shadow-none'
                    }`;

                    return (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: index * 0.06 }}
                        >
                            {!locked && item.href ? (
                                <Link href={item.href} className={className}>{row}</Link>
                            ) : (
                                <div className={className}>{row}</div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function DesktopDayPopover({ day, x, onClose }) {
    const openToRight = x <= 50;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, x: openToRight ? -12 : 12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: openToRight ? -12 : 12 }}
            transition={{ type: 'spring', stiffness: 330, damping: 27 }}
            className="absolute top-0 z-50 hidden w-[360px] sm:block lg:w-[420px]"
            style={openToRight
                ? { left: `calc(${x}% + 54px)` }
                : { right: `calc(${100 - x}% + 54px)` }}
        >
            <span className={`absolute top-9 h-4 w-4 rotate-45 border bg-gray-950 dark:bg-black ${
                openToRight
                    ? '-left-2 border-b-0 border-l border-r-0 border-t border-gray-800'
                    : '-right-2 border-b border-l-0 border-r border-t-0 border-gray-800'
            }`} />
            <DayDetailContent day={day} onClose={onClose} />
        </motion.div>
    );
}

function MobileDaySheet({ day, onClose }) {
    return (
        <motion.div
            className="fixed inset-0 z-[90] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <button
                type="button"
                aria-label="Tutup detail Hari"
                onClick={onClose}
                className="absolute inset-0 bg-black/55"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="absolute inset-x-0 bottom-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
            >
                <DayDetailContent day={day} onClose={onClose} mobile />
            </motion.div>
        </motion.div>
    );
}

function pathX(index) {
    return 50 - (Math.sin(index * 1.05) * 14);
}

function DuolingoPath({ week, selectedDayId, onDayToggle }) {
    const items = weeklyMainItems(week);
    const selectedDay = items.find((item) => item.dayId === selectedDayId) || null;

    useEffect(() => {
        if (!selectedDay) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') onDayToggle(selectedDay.dayId);
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onDayToggle, selectedDay]);

    return (
        <div className="relative mx-auto w-full max-w-3xl py-4 sm:py-6">
            {selectedDay && (
                <button
                    type="button"
                    aria-label="Tutup detail Hari"
                    onClick={() => onDayToggle(selectedDay.dayId)}
                    className="fixed inset-0 z-30 hidden bg-transparent sm:block"
                />
            )}

            {items.map((item, index) => {
                const x = pathX(index);
                const selected = item.dayId === selectedDayId;

                return (
                    <div
                        key={item.key}
                        className={`relative h-[142px] overflow-visible sm:h-[150px] ${selected ? 'z-50' : 'z-10'}`}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.035 }}
                            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                            style={{ left: `${x}%` }}
                        >
                            <PathNode item={item} selected={selected} onDayToggle={onDayToggle} />
                            <PathNodeLabel item={item} />
                        </motion.div>

                        <AnimatePresence initial={false}>
                            {item.kind === 'day' && selected && (
                                <DesktopDayPopover
                                    key={`popover-${item.dayId}`}
                                    day={item.day}
                                    x={x}
                                    onClose={() => onDayToggle(item.dayId)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            <AnimatePresence initial={false}>
                {selectedDay && (
                    <MobileDaySheet
                        key={`sheet-${selectedDay.dayId}`}
                        day={selectedDay.day}
                        onClose={() => onDayToggle(selectedDay.dayId)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function WeekRoadmapSection({ week, expanded, onToggle }) {
    const days = week.days || [];
    const [selectedDayId, setSelectedDayId] = useState(null);
    const locked = ['locked', 'unavailable'].includes(week.status);
    const completedDays = days.filter((day) => day.status === 'done').length;
    const progress = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;

    useEffect(() => {
        setSelectedDayId(null);
    }, [week.id]);

    const toggleDay = (dayId) => {
        setSelectedDayId((current) => current === dayId ? null : dayId);
    };

    return (
        <section className="mx-auto mb-7 max-w-4xl">
            <button
                type="button"
                onClick={() => !locked && onToggle()}
                disabled={locked}
                aria-expanded={expanded}
                className={`flex min-h-[76px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-lg shadow-red-900/5 transition sm:px-5 ${
                    week.status === 'active'
                        ? 'border-red-200 bg-white hover:border-red-300 dark:border-red-900/60 dark:bg-gray-900'
                        : 'border-white/70 bg-white/75 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900/75'
                } ${locked ? 'cursor-not-allowed opacity-75' : ''}`}
            >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                    week.status === 'done'
                        ? 'bg-emerald-600 text-white'
                        : week.status === 'active'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                    {week.status === 'done'
                        ? <CheckCircleIcon sx={{ fontSize: 24 }} />
                        : locked
                            ? <LockIcon sx={{ fontSize: 21 }} />
                            : week.week_number}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-red-600 dark:text-red-400">
                        Minggu {week.week_number}
                    </span>
                    <span className="block truncate text-sm font-black text-gray-900 sm:text-base dark:text-white">
                        {week.display_title || week.title}
                    </span>
                    {!locked && days.length > 0 ? (
                        <span className="mt-1.5 flex items-center gap-3">
                            <span className="h-1.5 max-w-sm flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <span className={`block h-full rounded-full ${week.status === 'done' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${progress}%` }} />
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{completedDays}/{days.length} Hari</span>
                        </span>
                    ) : (
                        <span className="mt-1 block line-clamp-2 text-[10px] font-semibold text-gray-400">{week.lock_reason}</span>
                    )}
                </span>
                {!locked && (
                    <ExpandMoreIcon className={`shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} sx={{ fontSize: 24 }} />
                )}
            </button>

            <AnimatePresence initial={false}>
                {expanded && !locked && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 rounded-2xl border border-white/70 bg-white/30 px-2 py-4 shadow-xl shadow-red-900/5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/30 sm:px-6 sm:py-6">
                            <DuolingoPath
                                week={week}
                                selectedDayId={selectedDayId}
                                onDayToggle={toggleDay}
                            />

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export default function DaftarModul({ weeks = [], program = null, back_url = null }) {
    const displayWeeks = weeks.length > 0 ? weeks : [{
        id: 'empty',
        display_title: 'Roadmap belum tersedia',
        week_number: 1,
        status: 'unavailable',
        lock_reason: 'Admin belum menambahkan Minggu.',
        days: [],
    }];
    const defaultExpandedWeekId = displayWeeks.find((week) => week.status === 'active')?.id
        || [...displayWeeks].reverse().find((week) => week.status === 'done')?.id
        || null;
    const [expandedWeekId, setExpandedWeekId] = useState(defaultExpandedWeekId);
    const completedWeekCount = displayWeeks.filter((week) => week.status === 'done').length;
    const roadmapProgress = displayWeeks.length > 0
        ? Math.round((completedWeekCount / displayWeeks.length) * 100)
        : 0;
    const activeWeek = displayWeeks.find((week) => week.status === 'active');
    const activeDay = activeWeek?.days?.find((day) => day.status === 'active');
    const nextAction = activeWeek
        ? `Lanjutkan Minggu ${activeWeek.week_number}${activeDay ? `, Hari ${activeDay.day_number}` : ''}`
        : completedWeekCount === displayWeeks.length
            ? 'Semua Minggu sudah selesai'
            : 'Belum ada Minggu yang dapat dibuka';

    useEffect(() => {
        setExpandedWeekId(defaultExpandedWeekId);
    }, [defaultExpandedWeekId, program?.id]);

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`${program?.title || 'Roadmap'} - Japanlingo`} />

            <div className="relative min-h-[100dvh] overflow-hidden bg-[#f7efe6] text-gray-900 transition-colors duration-300 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,38,38,0.10)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.12)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(120,53,15,0.055)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(120,53,15,0.045)_0_1px,transparent_1px_82px)] dark:bg-[linear-gradient(120deg,rgba(220,38,38,0.14)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.08)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0_1px,transparent_1px_82px)]" />
                <div className="pointer-events-none absolute left-4 top-40 hidden text-[13rem] font-black leading-none text-red-900/[0.045] dark:text-white/[0.035] lg:block">道</div>
                <div className="pointer-events-none absolute right-8 top-[560px] hidden text-[12rem] font-black leading-none text-amber-900/[0.05] dark:text-white/[0.03] lg:block">週</div>

                <header className="relative z-10 px-4 pb-3 pt-5 sm:px-6 sm:pb-5 sm:pt-7 lg:px-20">
                    <div className="mx-auto max-w-3xl">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {back_url ? (
                                <Link
                                    href={back_url}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/75 px-3 text-xs font-black text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-600 dark:border-gray-800 dark:bg-gray-900/75 dark:text-gray-300"
                                >
                                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                                    Pilih Program
                                </Link>
                            ) : <span />}
                            <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-red-600/10 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-red-600">
                                <AutoStoriesIcon sx={{ fontSize: 15 }} />
                                {program?.level ? `Kurikulum ${program.level}` : 'Kurikulum JLPT N3'}
                            </span>
                        </div>

                        <div className="mt-5 sm:flex sm:items-end sm:justify-between sm:gap-8">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-black text-gray-900 sm:text-3xl dark:text-white">
                                    {program?.title ? `Roadmap ${program.title}` : 'Roadmap Mingguan'}
                                </h1>
                                <p className={`mt-1.5 text-sm font-bold ${activeWeek ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {nextAction}
                                </p>
                            </div>

                            <div className="mt-4 w-full sm:mt-0 sm:max-w-xs">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <span>{completedWeekCount} dari {displayWeeks.length} Minggu selesai</span>
                                    <span>{roadmapProgress}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80 shadow-inner dark:bg-gray-800">
                                    <div className="h-full rounded-full bg-red-600 transition-all" style={{ width: `${roadmapProgress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span className={`h-2 w-2 rounded-full ${program?.kloter ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {program?.kloter ? (
                                <>
                                    <span className="font-black text-gray-700 dark:text-gray-200">{program.kloter.nama}</span>
                                    <span>- Minggu aktif {program.kloter.minggu_aktif || 0}</span>
                                    <span>- Mulai {program.kloter.tanggal_mulai || '-'}</span>
                                </>
                            ) : (
                                <span>Jadwal umum aktif</span>
                            )}
                        </div>
                    </div>
                </header>

                <main className="relative z-10 px-4 pb-8 pt-3 sm:px-6 sm:pb-14 sm:pt-5">
                    {program?.resources?.vocabulary_url && (
                        <Link
                            href={program.resources.vocabulary_url}
                            className="group mx-auto mb-5 flex min-h-16 max-w-4xl items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2.5 shadow-lg shadow-amber-900/5 backdrop-blur-sm transition hover:border-amber-300 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40 dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-amber-700 dark:hover:bg-gray-900 sm:px-4"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-[0_3px_0_#b45309]">
                                <AutoStoriesIcon sx={{ fontSize: 23 }} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-gray-900 dark:text-white">
                                    Pustaka Materi {program?.level || 'N3'}
                                </span>
                                <span className="block truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                    Kosakata · Kanji · Bunpo
                                </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                                <span className="hidden text-right sm:block">
                                    <span className="block text-sm font-black text-gray-800 dark:text-gray-100">
                                        {program.resources.vocabulary_count || 0}
                                    </span>
                                    <span className="block text-[9px] font-bold uppercase tracking-wide text-gray-400">
                                        Materi
                                    </span>
                                </span>
                                <ChevronRightIcon
                                    className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600"
                                    sx={{ fontSize: 24 }}
                                />
                            </span>
                        </Link>
                    )}

                    {displayWeeks.map((week) => (
                        <WeekRoadmapSection
                            key={week.id}
                            week={week}
                            expanded={expandedWeekId === week.id}
                            onToggle={() => setExpandedWeekId((current) => current === week.id ? null : week.id)}
                        />
                    ))}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
