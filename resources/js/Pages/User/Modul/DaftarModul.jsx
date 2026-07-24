import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StyleIcon from '@mui/icons-material/Style';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Posisi zigzag kiri-kanan untuk path ala Duolingo
const PATH_POSITIONS = ['50%', '30%', '65%', '25%', '60%', '35%', '50%', '70%', '40%', '55%'];

// Warna state node
const nodeStyles = {
    done:    { bg: '#22c55e', shadow: '#15803d', text: '#fff' },
    active:  { bg: '#dc2626', shadow: '#991b1b', text: '#fff' },
    locked:  { bg: '#e5e7eb', shadow: '#d1d5db', text: '#9ca3af' },
    unavailable: { bg: '#f3f4f6', shadow: '#d1d5db', text: '#9ca3af' },
};

function ModulDetailPanel({ week, initialDayId = null, onClose }) {
    const [isDesktopPanel, setIsDesktopPanel] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
    ));
    const selectedDay = week.days?.find((day) => day.id === initialDayId) || null;
    const activeResource = selectedDay || week;
    const presentationPreviews = activeResource.presentation_previews || [];
    const vocabularyPreview = activeResource.vocabulary_preview || [];
    const flashcardSummary = activeResource.flashcard_summary || {
        sets: [],
        total: activeResource.flashcard_total || 0,
        reviewed: activeResource.flashcard_reviewed || 0,
    };
    const checkpointSummary = activeResource.checkpoint_summary || null;
    const defaultSection = presentationPreviews.length > 0
        ? 'presentation'
        : vocabularyPreview.length > 0
            ? 'vocabulary'
            : flashcardSummary.total > 0
                ? 'flashcard'
                : checkpointSummary
                    ? 'quiz'
                    : null;
    const [openSection, setOpenSection] = useState(defaultSection);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 640px)');
        const syncPanelMode = () => setIsDesktopPanel(mediaQuery.matches);

        syncPanelMode();
        mediaQuery.addEventListener('change', syncPanelMode);

        return () => mediaQuery.removeEventListener('change', syncPanelMode);
    }, []);

    useEffect(() => {
        setOpenSection(defaultSection);
    }, [activeResource.id, defaultSection]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') onClose();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose]);

    const hasContent = activeResource.has_content ?? week.has_content ?? Boolean(week.flashcard_set_id || week.quiz_id);
    const canOpenResource = ['active', 'done'].includes(activeResource.status);
    const statusLabel = {
        done: 'Selesai',
        active: hasContent ? 'Sedang berjalan' : 'Konten belum tersedia',
        locked: activeResource.lock_reason || 'Terkunci',
        unavailable: activeResource.lock_reason || 'Konten belum tersedia',
    }[activeResource.status] || 'Terkunci';
    const statusTone = activeResource.status === 'done'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
        : activeResource.status === 'active'
            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    const flashcardProgress = flashcardSummary.total > 0
        ? Math.min(100, Math.round((flashcardSummary.reviewed / flashcardSummary.total) * 100))
        : 0;

    const sections = [
        {
            id: 'presentation',
            label: 'PPT / Board',
            count: activeResource.presentations_count ?? 0,
            href: activeResource.presentation_url,
            icon: <SlideshowIcon sx={{ fontSize: 22 }} />,
            iconTone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
        },
        {
            id: 'vocabulary',
            label: 'Konten N3',
            count: activeResource.vocabulary_count ?? 0,
            href: activeResource.vocabulary_url,
            icon: <TranslateIcon sx={{ fontSize: 22 }} />,
            iconTone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
        },
        {
            id: 'flashcard',
            label: 'Flashcard',
            count: flashcardSummary.total,
            href: activeResource.flashcard_url,
            icon: <StyleIcon sx={{ fontSize: 22 }} />,
            iconTone: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
        },
        {
            id: 'quiz',
            label: 'Kuis Checkpoint',
            count: checkpointSummary?.questions_count ?? activeResource.questions_count ?? 0,
            href: activeResource.quiz_url,
            locked: Boolean(checkpointSummary?.locked || activeResource.quiz_locked_reason),
            lockedReason: checkpointSummary?.lock_reason || activeResource.quiz_locked_reason,
            icon: <QuizIcon sx={{ fontSize: 22 }} />,
            iconTone: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
        },
    ];

    const sectionBody = (section) => {
        if (section.id === 'presentation') {
            return (
                <div className="space-y-3">
                    {presentationPreviews.map((deck) => {
                        const coverImage = deck.cover?.snapshot_url || deck.cover?.media_url;
                        const coverColor = deck.cover?.background?.startsWith('#') ? deck.cover.background : '#f3f4f6';

                        return (
                            <div key={deck.id} className="flex gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                                <div
                                    className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                                    style={{ backgroundColor: coverColor }}
                                >
                                    {coverImage ? (
                                        <img src={coverImage} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="line-clamp-3 px-2 text-center text-[10px] font-black text-gray-600 dark:text-gray-300">
                                            {deck.cover?.title || deck.title}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-black text-gray-900 dark:text-white">{deck.title}</p>
                                    <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{deck.slides_count} slide</p>
                                    {deck.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{deck.description}</p>}
                                </div>
                            </div>
                        );
                    })}
                    {canOpenResource && section.href && (
                        <Link href={section.href} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-black text-white hover:bg-sky-700">
                            <PlayArrowIcon sx={{ fontSize: 19 }} />
                            Buka presentasi
                        </Link>
                    )}
                </div>
            );
        }

        if (section.id === 'vocabulary') {
            return (
                <div className="space-y-3">
                    <div className="divide-y divide-gray-100 rounded-xl bg-gray-50 px-3 dark:divide-gray-800 dark:bg-gray-900">
                        {vocabularyPreview.map((item) => (
                            <div key={item.id} className="grid grid-cols-2 gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-gray-900 dark:text-white">{item.word}</p>
                                    {item.reading && <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400">{item.reading}</p>}
                                </div>
                                <p className="text-right text-sm font-semibold text-gray-600 dark:text-gray-300">{item.meaning}</p>
                            </div>
                        ))}
                    </div>
                    {canOpenResource && section.href && (
                        <Link href={section.href} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700">
                            <AutoStoriesIcon sx={{ fontSize: 19 }} />
                            Buka Konten N3
                        </Link>
                    )}
                </div>
            );
        }

        if (section.id === 'flashcard') {
            return (
                <div className="space-y-3">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
                        <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <span>Sudah direview</span>
                            <span>{flashcardSummary.reviewed}/{flashcardSummary.total} kartu</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${flashcardProgress}%` }} />
                        </div>
                        {flashcardSummary.sets?.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {flashcardSummary.sets.map((set) => {
                                    const content = (
                                        <>
                                            <span className="min-w-0 flex-1 truncate text-xs font-black text-gray-700 dark:text-gray-200">{set.title}</span>
                                            <span className="shrink-0 text-[11px] font-bold text-gray-500 dark:text-gray-400">{set.reviewed_count}/{set.cards_count}</span>
                                        </>
                                    );

                                    return canOpenResource && set.url ? (
                                        <Link key={set.id} href={set.url} className="flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 hover:border-orange-300 dark:border-gray-700 dark:bg-gray-950">
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={set.id} className="flex min-h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 opacity-60 dark:border-gray-700">
                                            {content}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {canOpenResource && section.href && !flashcardSummary.sets?.length && (
                        <Link href={section.href} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-black text-white hover:bg-orange-700">
                            <StyleIcon sx={{ fontSize: 19 }} />
                            {flashcardProgress === 100 ? 'Ulangi flashcard' : 'Review flashcard'}
                        </Link>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-900">
                        <p className="text-base font-black text-gray-900 dark:text-white">{checkpointSummary?.questions_count || 0}</p>
                        <p className="text-[10px] font-bold text-gray-500">Soal</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-900">
                        <p className="text-base font-black text-gray-900 dark:text-white">{checkpointSummary?.passing_score || 70}</p>
                        <p className="text-[10px] font-bold text-gray-500">Nilai lulus</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-900">
                        <p className="text-base font-black text-gray-900 dark:text-white">{checkpointSummary?.best_score ?? '-'}</p>
                        <p className="text-[10px] font-bold text-gray-500">Terbaik</p>
                    </div>
                </div>
                {section.locked ? (
                    <div className="flex gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold leading-5 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <LockIcon sx={{ fontSize: 18 }} className="mt-0.5 shrink-0" />
                        <span>{section.lockedReason || 'Selesaikan materi sebelumnya untuk membuka kuis.'}</span>
                    </div>
                ) : canOpenResource && section.href ? (
                    <Link href={section.href} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700">
                        <QuizIcon sx={{ fontSize: 19 }} />
                        Mulai kuis
                    </Link>
                ) : null}
            </div>
        );
    };

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <motion.div
            className="fixed inset-0 z-[90] flex items-end bg-black/40 sm:justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.aside
                className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl dark:bg-gray-950 sm:h-full sm:max-h-none sm:max-w-[480px] sm:rounded-none"
                initial={isDesktopPanel ? { x: '100%', y: 0 } : { x: 0, y: '100%' }}
                animate={{ x: 0, y: 0 }}
                exit={isDesktopPanel ? { x: '100%', y: 0 } : { x: 0, y: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="shrink-0 border-b border-gray-100 bg-white px-4 pb-4 pt-3 dark:border-gray-800 dark:bg-gray-950 sm:px-6 sm:pt-5">
                    <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gray-200 dark:bg-gray-800 sm:hidden" />
                    <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-600">
                                    Minggu {week.week_number}{selectedDay ? ` / Hari ${selectedDay.day_number}` : ''}
                                </p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusTone}`}>{statusLabel}</span>
                            </div>
                            <h2 className="text-lg font-black text-gray-900 sm:text-xl dark:text-white">
                            {selectedDay?.title || week.display_title || week.title}
                        </h2>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400 sm:text-sm">
                            {selectedDay?.description || week.subtitle}
                        </p>
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
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    <div className="space-y-2">
                        {sections.map((section) => {
                            const available = section.count > 0;
                            const expanded = openSection === section.id;

                            return (
                                <section key={section.id} className={`overflow-hidden rounded-xl border ${expanded ? 'border-gray-300 dark:border-gray-700' : 'border-gray-200 dark:border-gray-800'} ${available ? '' : 'opacity-55'}`}>
                                    <button
                                        type="button"
                                        disabled={!available}
                                        onClick={() => setOpenSection((current) => current === section.id ? null : section.id)}
                                        aria-expanded={expanded}
                                        className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left"
                                    >
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${section.iconTone}`}>
                                            {section.locked ? <LockIcon sx={{ fontSize: 19 }} /> : section.icon}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-black text-gray-900 dark:text-white">{section.label}</span>
                                            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                {available ? `${section.count} item` : 'Belum tersedia'}
                                                {section.id === 'flashcard' && available ? ` / ${flashcardSummary.reviewed} direview` : ''}
                                            </span>
                                        </span>
                                        {available && <ExpandMoreIcon className={`shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />}
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {expanded && available && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                                                    {sectionBody(section)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            );
                        })}
                    </div>

                    {!hasContent && (
                        <p className="rounded-xl bg-gray-50 px-4 py-4 text-center text-sm font-semibold text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                            Konten untuk Hari ini belum tersedia.
                        </p>
                    )}
                </div>
            </motion.aside>
        </motion.div>,
        document.body
    );
}

function ResourceBar({ resources = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const items = [
        {
            label: 'PPT / Board',
            count: resources.presentations_count ?? 0,
            href: resources.presentations_url,
            icon: <SlideshowIcon sx={{ fontSize: 22 }} />,
            tone: 'from-sky-500 to-cyan-600',
        },
        {
            label: 'Konten N3',
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
    const totalItems = items.reduce((total, item) => total + item.count, 0);

    return (
        <section className="relative z-10 px-4 pb-6 sm:px-6 lg:px-20">
            <div className="mx-auto max-w-3xl">
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-controls="roadmap-resource-library"
                    className="flex min-h-12 w-full items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left shadow-lg shadow-red-900/5 backdrop-blur-md transition hover:border-red-200 dark:border-gray-800 dark:bg-gray-900/70"
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                            <AutoStoriesIcon sx={{ fontSize: 21 }} />
                        </span>
                        <span className="min-w-0">
                             <span className="block text-sm font-black text-gray-900 dark:text-white">Perpustakaan Materi</span>
                             <span className="block truncate text-xs font-semibold text-gray-500 dark:text-gray-400">
                                 {totalItems} materi dan latihan dari seluruh minggu
                             </span>
                        </span>
                    </span>
                    <ExpandMoreIcon
                        className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        sx={{ fontSize: 24 }}
                    />
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            id="roadmap-resource-library"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-2 pt-3 sm:gap-3 lg:grid-cols-4">
                                {items.map((item) => {
                                    const disabled = !item.href || item.count === 0;
                                    const className = `group flex min-h-[88px] flex-col items-start gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-3 text-left shadow-md backdrop-blur-md transition sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 dark:border-gray-800 dark:bg-gray-900/70 ${
                                        disabled ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-0.5 hover:border-red-200'
                                    }`;
                                    const content = (
                                        <>
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-md`}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-900 sm:text-sm dark:text-white">{item.label}</p>
                                                <p className="text-[10px] font-bold text-gray-500 sm:text-xs dark:text-gray-400">{item.count} item</p>
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

function WeekRoadmapSection({ week, expanded, onToggle, onSelect }) {
    const days = week.days || [];
    const hasDays = days.length > 0;
    const roadmapItems = hasDays
        ? days
        : [{
            id: `week-${week.id}`,
            day_number: null,
            title: 'Materi Minggu',
            status: week.status,
            has_content: week.has_content,
            lock_reason: week.lock_reason,
        }];
    const completedDays = days.filter((day) => day.status === 'done').length;
    const progressPercent = hasDays ? Math.round((completedDays / days.length) * 100) : (week.status === 'done' ? 100 : 0);
    const nextDay = days.find((day) => day.status === 'active');
    const isLocked = ['locked', 'unavailable'].includes(week.status);
    const statusText = week.status === 'done'
        ? 'Selesai'
        : week.status === 'active'
            ? 'Sedang berjalan'
            : 'Terkunci';
    const statusTone = week.status === 'done'
        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
        : week.status === 'active'
            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    const pathHeight = roadmapItems.length * 124 + 116;

    return (
        <section className="mx-auto mb-5 max-w-xl sm:mb-7">
            <button
                type="button"
                onClick={() => !isLocked && onToggle()}
                disabled={isLocked}
                aria-expanded={expanded}
                className={`flex min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left shadow-lg shadow-red-900/5 transition sm:px-5 ${
                    week.status === 'active'
                        ? 'border-red-200 bg-white hover:border-red-300 dark:border-red-900/60 dark:bg-gray-900'
                        : 'border-white/70 bg-white/75 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900/75'
                } ${isLocked ? 'cursor-not-allowed opacity-75' : ''}`}
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        week.status === 'done'
                            ? 'bg-green-600 text-white'
                            : week.status === 'active'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                        {week.status === 'done'
                            ? <CheckCircleIcon sx={{ fontSize: 23 }} />
                            : isLocked
                                ? <LockIcon sx={{ fontSize: 20 }} />
                                : week.week_number}
                    </span>
                    <span className="min-w-0">
                        <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
                            Minggu {week.week_number}
                        </span>
                         <span className="mt-0.5 block truncate text-sm font-black text-gray-900 sm:text-base dark:text-white">
                             {week.display_title || week.title}
                         </span>
                         {hasDays && !isLocked && (
                             <span className="mt-1.5 block">
                                 <span className="flex items-center justify-between gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                     <span>{nextDay ? `Lanjut Hari ${nextDay.day_number}` : `${completedDays}/${days.length} Hari selesai`}</span>
                                     <span>{progressPercent}%</span>
                                 </span>
                                 <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                     <span
                                         className={`block h-full rounded-full ${week.status === 'done' ? 'bg-green-500' : 'bg-red-500'}`}
                                         style={{ width: `${progressPercent}%` }}
                                     />
                                 </span>
                             </span>
                         )}
                         {isLocked && (
                            <span className="mt-0.5 block truncate text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                {week.lock_reason || 'Selesaikan minggu sebelumnya.'}
                            </span>
                        )}
                    </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-right sm:block">
                        <span className={`block rounded-full px-2.5 py-1 text-[10px] font-black ${statusTone}`}>{statusText}</span>
                        {hasDays && <span className="mt-1 block text-[10px] font-bold text-gray-400">{completedDays}/{days.length} Hari</span>}
                    </span>
                    {!isLocked && (
                        <ExpandMoreIcon
                            className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            sx={{ fontSize: 24 }}
                        />
                    )}
                </span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && !isLocked && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            className="relative mx-auto mt-3 max-w-lg rounded-2xl border border-white/70 bg-white/35 py-6 shadow-xl shadow-red-900/5 backdrop-blur-sm sm:rounded-3xl sm:py-8 dark:border-gray-800 dark:bg-gray-900/35"
                            style={{ minHeight: `${pathHeight}px` }}
                        >
                            <svg
                                className="pointer-events-none absolute inset-0 h-full w-full"
                                viewBox={`0 0 400 ${pathHeight}`}
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <defs>
                                    <linearGradient id={`dayPathGrad-${week.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={theme.pathGrad?.[0] || '#dc2626'} />
                                        <stop offset="50%" stopColor={theme.pathGrad?.[1] || '#f97316'} />
                                        <stop offset="100%" stopColor={theme.pathGrad?.[2] || '#e5e7eb'} />
                                    </linearGradient>
                                </defs>
                                {roadmapItems.slice(0, -1).map((item, index) => {
                                    const x1 = (parseFloat(PATH_POSITIONS[index % PATH_POSITIONS.length]) / 100) * 400;
                                    const x2 = (parseFloat(PATH_POSITIONS[(index + 1) % PATH_POSITIONS.length]) / 100) * 400;
                                    const y1 = index * 124 + 64;
                                    const y2 = (index + 1) * 124 + 64;

                                    return (
                                        <line
                                            key={item.id}
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke={item.status === 'done' ? '#22c55e' : `url(#dayPathGrad-${week.id})`}
                                            strokeWidth="5"
                                            strokeDasharray="12 7"
                                            strokeLinecap="round"
                                            opacity={item.status === 'done' ? 0.9 : 0.45}
                                        />
                                    );
                                })}
                            </svg>

                            {roadmapItems.map((item, index) => {
                                const left = PATH_POSITIONS[index % PATH_POSITIONS.length];
                                const style = nodeStyles[item.status] || nodeStyles.locked;
                                const itemLocked = ['locked', 'unavailable'].includes(item.status);
                                const itemDone = item.status === 'done';
                                const itemActive = item.status === 'active';

                                return (
                                    <div
                                        key={item.id}
                                        className="absolute"
                                        style={{ left, top: `${index * 124 + 28}px`, transform: 'translateX(-50%)' }}
                                    >
                                        {itemActive && (
                                            <div
                                                className="absolute inset-0 animate-ping rounded-full opacity-20"
                                                style={{ backgroundColor: style.bg, margin: '-6px' }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            disabled={itemLocked}
                                            onClick={() => onSelect(hasDays ? item.id : null)}
                                            aria-label={`${hasDays ? `Hari ${item.day_number}` : 'Materi Minggu'}: ${item.title}${itemLocked ? ', terkunci' : ''}`}
                                            className={`group relative flex w-[112px] flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-4 ${
                                                itemLocked ? 'cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <motion.span
                                                whileHover={!itemLocked ? { scale: 1.08 } : {}}
                                                whileTap={!itemLocked ? { scale: 0.96 } : {}}
                                                className="flex h-16 w-16 items-center justify-center rounded-full transition-all sm:h-[72px] sm:w-[72px]"
                                                style={{
                                                    backgroundColor: style.bg,
                                                    boxShadow: `0 5px 0 ${style.shadow}`,
                                                    border: itemActive ? '3px solid #fff' : 'none',
                                                    outline: itemActive ? `3px solid ${style.bg}` : 'none',
                                                }}
                                            >
                                                {itemDone ? (
                                                    <CheckCircleIcon sx={{ fontSize: 34, color: '#fff' }} />
                                                ) : itemLocked ? (
                                                    <LockIcon sx={{ fontSize: 27, color: '#9ca3af' }} />
                                                ) : (
                                                    <span className="text-center text-white">
                                                        <span className="block text-[9px] font-black uppercase">Hari</span>
                                                        <span className="block text-lg font-black leading-none">{item.day_number || week.week_number}</span>
                                                    </span>
                                                )}
                                            </motion.span>

                                            <span className={`line-clamp-2 max-w-[112px] text-center text-[11px] font-bold leading-tight ${
                                                itemLocked ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'
                                            }`}>
                                                {item.title}
                                            </span>

                                            {itemActive && (
                                                <span className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-black text-white shadow-sm">
                                                    LANJUTKAN
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}


export default function DaftarModul({ weeks = [], userProgress = {}, program = null, back_url = null }) {
    // Jika tidak ada data dari backend, tampilkan placeholder
    const displayWeeks = weeks.length > 0 ? weeks : [
        { id: 1, title: 'Week 1 - Perkenalan', display_title: 'Perkenalan', week_number: 1, subtitle: 'Admin belum menambahkan modul.', status: 'unavailable', has_content: false, flashcard_set_id: null, quiz_id: null, days: [] },
    ];
    const defaultExpandedWeekId = displayWeeks.find((week) => week.status === 'active')?.id
        || [...displayWeeks].reverse().find((week) => week.status === 'done')?.id
        || displayWeeks[0]?.id
        || null;
    const completedWeekCount = displayWeeks.filter((week) => week.status === 'done').length;
    const roadmapProgress = displayWeeks.length > 0
        ? Math.round((completedWeekCount / displayWeeks.length) * 100)
        : 0;
    const activeWeek = displayWeeks.find((week) => week.status === 'active');
    const activeDay = activeWeek?.days?.find((day) => day.status === 'active');
    const nextAction = activeWeek
        ? `Lanjutkan Week ${activeWeek.week_number}${activeDay ? `, Hari ${activeDay.day_number}` : ''}`
        : completedWeekCount === displayWeeks.length
            ? 'Semua Week sudah selesai'
            : 'Belum ada Week yang dapat dibuka';
    const [expandedWeekId, setExpandedWeekId] = useState(defaultExpandedWeekId);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        setExpandedWeekId(defaultExpandedWeekId);
        setSelectedItem(null);
    }, [program?.id]);

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`${program?.title || 'Modul'} - Japanlingo`} />

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
                                    <span>{completedWeekCount} dari {displayWeeks.length} Week selesai</span>
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
                                    <span>· Week aktif {program.kloter.minggu_aktif || 0}</span>
                                    <span>· Mulai {program.kloter.tanggal_mulai || '-'}</span>
                                </>
                            ) : (
                                <span>Jadwal umum aktif</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Path Section */}
                <div className="relative z-10 px-4 pb-8 pt-3 sm:px-6 sm:pb-14 sm:pt-5">
                    {displayWeeks.map((week) => (
                        <WeekRoadmapSection
                            key={week.id}
                            week={week}
                            expanded={expandedWeekId === week.id}
                            onToggle={() => setExpandedWeekId((current) => current === week.id ? null : week.id)}
                            onSelect={(dayId) => setSelectedItem({ week, dayId })}
                        />
                    ))}
                </div>

                <ResourceBar resources={program?.resources} />

                <AnimatePresence>
                    {selectedItem && (
                        <ModulDetailPanel
                            week={selectedItem.week}
                            initialDayId={selectedItem.dayId}
                            onClose={() => setSelectedItem(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </AuthenticatedLayout>
    );
}
