import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';
import { playSoundEffect } from '@/Components/UI/SoundEffects';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';

const RESOURCE_COLORS = {
    presentation: { color: '#0284c7', shadow: '#075985' },
    day: { color: '#dc2626', shadow: '#991b1b' },
    quiz: { color: '#e11d48', shadow: '#9f1239' },
    exam: { color: '#16a34a', shadow: '#166534' },
    live: { color: '#f97316', shadow: '#c2410c' },
};

const todayInputValue = () => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
};

const formatExamDate = (value) => {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
};

const dateInputValue = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function ExamDatePicker({ value, onChange }) {
    const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
    const [visibleMonth, setVisibleMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    const today = new Date();
    const todayValue = todayInputValue();
    const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    const dayCount = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const calendarCells = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: dayCount }, (_, index) => index + 1),
    ];
    const canGoPrevious = (
        visibleMonth.getFullYear() > today.getFullYear()
        || (
            visibleMonth.getFullYear() === today.getFullYear()
            && visibleMonth.getMonth() > today.getMonth()
        )
    );
    const monthLabel = new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(visibleMonth);

    const moveMonth = (offset) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    };

    return (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-2.5 dark:border-gray-700 dark:bg-gray-950/70 min-[360px]:p-3 sm:mt-5 sm:p-4">
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    disabled={!canGoPrevious}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
                    aria-label="Bulan sebelumnya"
                >
                    <ChevronLeftIcon />
                </button>
                <p className="text-sm font-black capitalize text-gray-900 dark:text-white">{monthLabel}</p>
                <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
                    aria-label="Bulan berikutnya"
                >
                    <ChevronRightIcon />
                </button>
            </div>

            <div className="mt-2 grid grid-cols-7 text-center text-[8px] font-black uppercase text-gray-400 min-[360px]:text-[9px] sm:mt-3">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                    <span key={day} className="py-1">{day}</span>
                ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5 min-[360px]:gap-1">
                {calendarCells.map((day, index) => {
                    if (!day) return <span key={`empty-${index}`} className="aspect-square" />;

                    const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                    const candidateValue = dateInputValue(candidate);
                    const isPast = candidateValue < todayValue;
                    const isSelected = candidateValue === value;
                    const isToday = candidateValue === todayValue;

                    return (
                        <button
                            key={candidateValue}
                            type="button"
                            disabled={isPast}
                            onClick={() => onChange(candidateValue)}
                            className={`aspect-square min-h-8 rounded-lg text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 min-[360px]:text-xs ${
                                isSelected
                                    ? 'bg-red-600 text-white shadow-[0_3px_0_#991b1b]'
                                    : isToday
                                        ? 'border border-red-200 bg-white text-red-600 dark:border-red-900 dark:bg-gray-900 dark:text-red-300'
                                        : 'text-gray-700 hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-300 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-red-300 dark:disabled:text-gray-700'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-gray-200 pt-2 text-[11px] dark:border-gray-800 min-[360px]:mt-3 min-[360px]:pt-3 min-[360px]:text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400">Tanggal dipilih</span>
                <span className="font-black text-gray-900 dark:text-white">
                    {value ? formatExamDate(value) : 'Belum dipilih'}
                </span>
            </div>
        </div>
    );
}

function ExamTargetCard({ program, completedWeekCount, totalWeeks }) {
    const target = program?.exam_target;
    const [showForm, setShowForm] = useState(false);
    const { confirmState, openConfirm, closeConfirm, setConfirmProcessing } = useConfirmAction();
    const { data, setData, put, processing, errors, clearErrors } = useForm({
        exam_date: target?.exam_date || '',
    });

    const openForm = () => {
        setData('exam_date', target?.exam_date || '');
        clearErrors();
        setShowForm(true);
    };

    const submit = (event) => {
        event.preventDefault();
        put(route('user.modul.program.exam-target.update', program.slug), {
            preserveScroll: true,
            onSuccess: () => setShowForm(false),
        });
    };

    const requestDelete = () => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus target ujian?',
            message: 'Tanggal target akan dihapus, tetapi progres roadmap tetap tersimpan.',
            confirmLabel: 'Hapus Target',
            onConfirm: () => {
                setConfirmProcessing(true);
                router.delete(route('user.modul.program.exam-target.destroy', program.slug), {
                    preserveScroll: true,
                    onFinish: () => {
                        setConfirmProcessing(false);
                        closeConfirm();
                    },
                });
            },
        });
    };

    const countdownLabel = target
        ? target.days_remaining < 0
            ? 'Tanggal telah lewat'
            : target.days_remaining === 0
                ? 'Hari ujian'
                : `${target.days_remaining} hari lagi`
        : null;

    return (
        <>
            <section className="mt-3 rounded-xl border border-white/80 bg-white/70 p-2.5 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/70">
                {target ? (
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
                            <CalendarMonthIcon sx={{ fontSize: 19 }} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-1.5">
                                <p className="text-sm font-black text-gray-900 dark:text-white">{countdownLabel}</p>
                                <span className="text-[10px] font-bold text-gray-400">{formatExamDate(target.exam_date)}</span>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-4 text-gray-500 dark:text-gray-400">
                                {target.pace_message}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={openForm}
                                title="Ubah target ujian"
                                aria-label="Ubah target ujian"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-300"
                            >
                                <EditCalendarIcon sx={{ fontSize: 17 }} />
                            </button>
                            <button
                                type="button"
                                onClick={requestDelete}
                                title="Hapus target ujian"
                                aria-label="Hapus target ujian"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={openForm}
                        className="flex w-full items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300/40"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
                            <CalendarMonthIcon sx={{ fontSize: 19 }} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-black text-gray-800 dark:text-gray-100">Atur target ujian</span>
                            <span className="block truncate text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                Dapatkan hitung mundur dan ritme belajar.
                            </span>
                        </span>
                        <EditCalendarIcon className="shrink-0 text-red-500" sx={{ fontSize: 18 }} />
                    </button>
                )}
            </section>

            {typeof document !== 'undefined' && createPortal(
                <>
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setShowForm(false);
                        }}
                            >
                                <motion.form
                            onSubmit={submit}
                            className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-gray-900 min-[360px]:p-5 sm:max-h-[90dvh] sm:max-w-md sm:rounded-3xl"
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                                >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                                        {program?.level || 'Target Ujian'}
                                    </p>
                                    <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Atur Target Ujian</h2>
                                    <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                        Target ini bersifat pribadi dan tidak mengubah jadwal kelas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                                    aria-label="Tutup"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            <ExamDatePicker
                                value={data.exam_date}
                                onChange={(value) => {
                                    setData('exam_date', value);
                                    clearErrors('exam_date');
                                }}
                            />
                            {errors.exam_date && <span className="mt-1.5 block text-xs font-bold text-red-600">{errors.exam_date}</span>}

                            <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600 dark:bg-gray-950 dark:text-gray-300">
                                Progress saat ini: <strong>{completedWeekCount} dari {totalWeeks} Minggu selesai</strong>
                            </div>

                            <div className="sticky -bottom-4 z-10 mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 bg-white/95 pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 min-[360px]:-bottom-5 sm:mt-5">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="h-11 rounded-xl border border-gray-200 text-sm font-black text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.exam_date}
                                    className="h-11 rounded-xl bg-red-600 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Target'}
                                </button>
                            </div>
                                </motion.form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
                </>,
                document.body,
            )}
        </>
    );
}

function itemStatusLabel(item) {
    if (item.kind === 'live') return item.status === 'active' ? 'Live sekarang' : 'Terjadwal';
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

    if (item.kind === 'live') {
        return <VideoCameraFrontIcon sx={{ fontSize: size - 3, color: '#fff' }} />;
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
        lockReason: checkpoint.lock_reason || day.quiz_locked_reason || day.lock_reason,
        href: day.quiz_url,
    };
}

function weeklyMainItems(week) {
    const items = [];
    const presentations = week.presentations || [];
    const liveSession = week.live_session;

    if (liveSession) {
        const schedule = liveSession.scheduled_at
            ? new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(liveSession.scheduled_at))
            : 'Menunggu mentor';

        items.push({
            key: `live-${liveSession.id}`,
            kind: 'live',
            level: 'root',
            eyebrow: liveSession.status === 'live' ? 'Sedang berlangsung' : 'Kelas mentor',
            title: liveSession.deck_title || 'Ruang Kelas',
            weekLabel: `Minggu ${week.week_number}`,
            detail: `${schedule}${liveSession.mentor_name ? ` · ${liveSession.mentor_name}` : ''}`,
            status: liveSession.status === 'live' ? 'active' : 'scheduled',
            href: liveSession.join_url,
            mainPosition: 'center',
        });
    }
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
                ? `Belum dikerjakan · Target ${exam.passing_score}`
                : exam.done
                    ? `Nilai ${exam.best_score} · Lulus`
                    : `Nilai ${exam.best_score} · Target ${exam.passing_score}`;

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

    return [quizItem(day, available)];
}

function PathNodeCircle({ item, selected = false, size = 68 }) {
    const colors = nodeColors(item);
    const active = item.status === 'active';

    return (
        <span
            className="relative z-10 flex shrink-0 items-center justify-center rounded-full border-[3px] border-white transition-transform duration-200 group-hover:scale-105 group-active:translate-y-1 dark:border-gray-950"
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
                <motion.span
                    className="absolute -inset-2 rounded-full border-2"
                    style={{ borderColor: `${colors.color}55` }}
                    animate={{ scale: [0.92, 1.12], opacity: [0.75, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden="true"
                />
            )}
            {iconFor(item, size <= 48 ? 23 : 32)}
        </span>
    );
}

function StatusBadge({ item, className = '' }) {
    return (
        <span className={`${className} inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${
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
                aria-current={item.status === 'active' ? 'step' : undefined}
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
            <Link href={item.href} aria-current={item.status === 'active' ? 'step' : undefined} className={className}>
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
    const showStatus = item.status !== 'done';
    const hasExtraInfo = showStatus || (item.kind !== 'day' && item.detail);

    if (item.kind === 'live') {
        const isLive = item.status === 'active';
        const cardClassName = `relative mt-3 block w-48 overflow-hidden rounded-xl border px-3 py-2 text-left shadow-md transition sm:w-56 ${
            isLive
                ? 'border-red-300 bg-white shadow-red-900/10 hover:-translate-y-0.5 hover:border-red-400 dark:border-red-800 dark:bg-gray-900'
                : 'border-orange-200 bg-white/95 shadow-orange-900/5 dark:border-orange-900/70 dark:bg-gray-900'
        }`;
        const cardContent = (
            <>
                <span className={`absolute inset-y-0 left-0 w-1 ${isLive ? 'bg-red-500' : 'bg-orange-500'}`} />
                <div className="flex items-center justify-between gap-2 pl-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700 dark:text-orange-300">
                        {item.weekLabel} · Kelas Live
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ${
                        isLive
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                    }`}>
                        {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />}
                        {isLive ? 'Live' : 'Terjadwal'}
                    </span>
                </div>
                <h3 className="mt-1 line-clamp-1 pl-1 text-xs font-black text-gray-900 dark:text-white sm:text-sm">
                    {item.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 pl-1 text-[9px] font-semibold text-gray-500 dark:text-gray-400 sm:text-[10px]">
                    {item.detail}
                </p>
            </>
        );

        return item.href ? (
            <Link href={item.href} className={cardClassName}>{cardContent}</Link>
        ) : (
            <div className={cardClassName}>{cardContent}</div>
        );
    }

    return (
        <div className="relative mt-3 w-36 text-center sm:w-44">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                {item.eyebrow}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-[13px] font-black leading-4 text-gray-900 dark:text-white sm:text-sm sm:leading-5">
                {item.title}
            </h3>

            {hasExtraInfo && (
                <>
                    <div className="mt-1 flex min-h-5 flex-wrap items-center justify-center gap-1 sm:hidden">
                        {item.kind !== 'day' && item.detail && (
                            <span className="line-clamp-1 text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                                {item.detail}
                            </span>
                        )}
                        {showStatus && <StatusBadge item={item} />}
                    </div>

                    <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden min-w-32 max-w-52 -translate-x-1/2 translate-y-1 rounded-xl border border-white/80 bg-white/95 px-2.5 py-2 text-center opacity-0 shadow-lg shadow-black/10 backdrop-blur-md transition duration-200 group-hover/node:translate-y-0 group-hover/node:opacity-100 group-focus-within/node:translate-y-0 group-focus-within/node:opacity-100 dark:border-gray-700 dark:bg-gray-900/95 sm:block">
                        {item.kind !== 'day' && item.detail && (
                            <p className="whitespace-nowrap text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                {item.detail}
                            </p>
                        )}
                        {showStatus && (
                            <StatusBadge
                                item={item}
                                className={item.kind !== 'day' && item.detail ? 'mt-1.5' : ''}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function DayDetailContent({ day, onClose, mobile = false }) {
    const items = dayChildItems(day);
    const completed = day.status === 'done';

    return (
        <div
            id={`day-materials-${day.id}`}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900"
        >
            <div className={`flex items-start justify-between gap-4 px-5 py-4 text-white ${
                completed ? 'bg-emerald-700 dark:bg-emerald-900' : 'bg-gray-950 dark:bg-black'
            }`}>
                <div className="min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                        completed ? 'text-emerald-100' : 'text-red-400'
                    }`}>
                        Hari {day.day_number} {completed ? '- Selesai' : '- Jalur Belajar'}
                    </p>
                    <h3 className="mt-1 text-base font-black leading-5">
                        {day.title || `Hari ${day.day_number}`}
                    </h3>
                    {day.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-white/65">
                            {day.description}
                        </p>
                    )}
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

            <div className={`space-y-3 p-3 sm:p-4 ${mobile ? 'max-h-[65dvh] overflow-y-auto' : ''}`}>
                {items.map((item, index) => {
                    const locked = ['locked', 'unavailable'].includes(item.status);
                    const row = (
                        <>
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                locked
                                    ? 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                                    : completed
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-red-700 text-white'
                            }`}>
                                <QuizIcon sx={{ fontSize: 24 }} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-black">
                                    {item.status === 'done' ? 'Ulangi Kuis & Repetisi' : 'Mulai Kuis & Repetisi'}
                                </span>
                                {!locked && (
                                    <span className="mt-0.5 block text-[10px] font-semibold opacity-75">
                                        Flashcard, soal, dan latihan menulis tersedia dalam satu sesi.
                                    </span>
                                )}
                                {locked && (
                                    <span className="mt-0.5 block line-clamp-2 text-[10px] font-semibold opacity-70">
                                        {item.lockReason || 'Materi belum tersedia.'}
                                    </span>
                                )}
                            </span>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                locked ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300' : 'bg-white/20'
                            }`}>
                                {locked
                                    ? <LockIcon sx={{ fontSize: 16 }} />
                                    : <ChevronRightIcon sx={{ fontSize: 21 }} />}
                            </span>
                        </>
                    );
                    const className = `group flex min-h-[78px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition sm:px-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${
                        locked
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                            : completed
                                ? 'bg-emerald-600 text-white shadow-[0_4px_0_#047857] hover:bg-emerald-500 active:translate-y-1 active:shadow-none'
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
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

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

const PATH_ROW_HEIGHT = 148;
const PATH_NODE_CENTER_Y = 34;

function pathX(index) {
    return 50 - (Math.sin(index * 1.12) * 19);
}

function connectorColor(previousItem, item) {
    if (previousItem.status === 'done' && item.status === 'done') {
        return '#22c55e';
    }

    if (previousItem.status === 'active' || item.status === 'active') {
        return '#ef4444';
    }

    return '#cbd5e1';
}

function connectorPath(fromIndex, toIndex) {
    const x1 = pathX(fromIndex);
    const x2 = pathX(toIndex);
    const y1 = (fromIndex * PATH_ROW_HEIGHT) + PATH_NODE_CENTER_Y;
    const y2 = (toIndex * PATH_ROW_HEIGHT) + PATH_NODE_CENTER_Y;
    const middleY = (y1 + y2) / 2;

    return `M ${x1} ${y1} C ${x1} ${middleY}, ${x2} ${middleY}, ${x2} ${y2}`;
}

function PathConnector({ items }) {
    if (items.length < 2) {
        return null;
    }

    const height = ((items.length - 1) * PATH_ROW_HEIGHT) + (PATH_NODE_CENTER_Y * 2);

    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-4 z-0 h-auto w-full overflow-visible sm:top-6"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            style={{ height: `${height}px` }}
        >
            {items.slice(0, -1).map((item, index) => {
                const nextItem = items[index + 1];
                const locked = ['locked', 'unavailable'].includes(nextItem.status);

                return (
                    <g key={`connector-${item.key}-${nextItem.key}`}>
                        <path
                            d={connectorPath(index, index + 1)}
                            fill="none"
                            stroke="rgba(148, 163, 184, 0.22)"
                            strokeLinecap="round"
                            strokeWidth="10"
                            vectorEffect="non-scaling-stroke"
                        />
                        <motion.path
                            d={connectorPath(index, index + 1)}
                            fill="none"
                            stroke={connectorColor(item, nextItem)}
                            strokeDasharray={locked ? '5 9' : '1 0'}
                            strokeLinecap="round"
                            strokeWidth="4"
                            vectorEffect="non-scaling-stroke"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: locked ? 0.55 : 0.9 }}
                            transition={{ duration: 0.45, delay: index * 0.05 }}
                        />
                    </g>
                );
            })}
        </svg>
    );
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
            <PathConnector items={items} />

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
                        className={`relative overflow-visible ${selected ? 'z-50' : 'z-10'}`}
                        style={{ height: `${PATH_ROW_HEIGHT}px` }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.035 }}
                            className="group/node absolute top-0 flex -translate-x-1/2 flex-col items-center"
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
    const canExpand = !locked || Boolean(week.live_session);
    const completedDays = days.filter((day) => day.status === 'done').length;
    const progress = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;

    useEffect(() => {
        setSelectedDayId(null);
    }, [week.id]);

    const toggleDay = (dayId) => {
        const isClosing = selectedDayId === dayId;

        playSoundEffect(isClosing ? 'close' : 'open');
        setSelectedDayId(isClosing ? null : dayId);
    };

    return (
        <section className="mx-auto mb-5 max-w-4xl sm:mb-7">
            <button
                type="button"
                onClick={() => {
                    if (!canExpand) return;

                    playSoundEffect(expanded ? 'close' : 'open');
                    onToggle();
                }}
                disabled={!canExpand}
                aria-expanded={expanded}
                className={`relative flex min-h-[76px] w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 text-left shadow-lg shadow-red-900/5 transition sm:px-5 ${
                    week.status === 'active'
                        ? 'border-red-300 bg-white hover:border-red-400 hover:shadow-xl dark:border-red-900/70 dark:bg-gray-900'
                        : week.status === 'done'
                            ? 'border-emerald-200 bg-white/90 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-gray-900'
                            : 'border-white/70 bg-white/75 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900/75'
                } ${!canExpand ? 'cursor-not-allowed opacity-75' : 'hover:-translate-y-0.5'}`}
            >
                <span className={`absolute inset-y-0 left-0 w-1.5 ${
                    week.status === 'done'
                        ? 'bg-emerald-500'
                        : week.status === 'active'
                            ? 'bg-red-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                }`} />
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
                    <span className="flex items-center gap-2">
                        <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-red-600 dark:text-red-400">
                            Minggu {week.week_number}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            week.status === 'done'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : week.status === 'active'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                            {itemStatusLabel(week)}
                        </span>
                    </span>
                    <span className="block truncate text-sm font-black text-gray-900 sm:text-base dark:text-white">
                        {week.display_title || week.title}
                    </span>
                    {!locked && days.length > 0 ? (
                        <span className="mt-1.5 flex items-center gap-3">
                            <span className="h-1.5 max-w-sm flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <span className={`block h-full rounded-full ${week.status === 'done' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${progress}%` }} />
                            </span>
                            <span className="shrink-0 text-[10px] font-bold text-gray-500 dark:text-gray-400">{completedDays}/{days.length} Hari</span>
                        </span>
                    ) : (
                        <span className="mt-1 block line-clamp-2 text-[10px] font-semibold text-gray-400">{week.lock_reason}</span>
                    )}
                </span>
                {canExpand && (
                    <ExpandMoreIcon className={`shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} sx={{ fontSize: 24 }} />
                )}
            </button>

            <AnimatePresence initial={false}>
                {expanded && canExpand && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 rounded-2xl border border-white/70 bg-white/35 px-1 py-3 shadow-xl shadow-red-900/5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/35 sm:mt-4 sm:px-6 sm:py-6">
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

function LibraryShortcut({ program }) {
    if (!program?.resources?.vocabulary_url) return null;

    return (
        <Link
            href={program.resources.vocabulary_url}
            className="group mb-5 flex min-h-14 items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/75 px-2.5 py-2 backdrop-blur-sm transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40 dark:border-amber-900/60 dark:bg-amber-950/25 dark:hover:border-amber-700 dark:hover:bg-amber-950/40 min-[360px]:gap-3 min-[360px]:px-3 sm:px-3.5 xl:hidden"
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309] min-[360px]:h-10 min-[360px]:w-10">
                <AutoStoriesIcon sx={{ fontSize: 21 }} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-gray-900 dark:text-white">
                    Pustaka {program.level || 'N3'}
                </span>
                <span className="block truncate text-[10px] font-semibold text-gray-600 dark:text-gray-400 min-[360px]:text-[11px]">
                    Kosakata, kanji, dan bunpo
                </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
                <span className="rounded-lg bg-white/80 px-2 py-1 text-center dark:bg-gray-900/70">
                    <span className="block text-xs font-black leading-none text-gray-800 dark:text-gray-100">
                        {program.resources.vocabulary_count || 0}
                    </span>
                    <span className="mt-0.5 block text-[8px] font-bold uppercase leading-none text-gray-500 dark:text-gray-400">
                        Entri
                    </span>
                </span>
                <ChevronRightIcon
                    className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600"
                    sx={{ fontSize: 21 }}
                />
            </span>
        </Link>
    );
}

function DesktopLibraryPanel({ program, open, onToggle }) {
    if (!program?.resources?.vocabulary_url) return null;

    return (
        <aside className="sticky top-20 hidden xl:block">
            <AnimatePresence initial={false} mode="wait">
                {open ? (
                    <motion.div
                        key="library-panel"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white/90 shadow-lg shadow-amber-950/5 backdrop-blur-md dark:border-amber-900/60 dark:bg-gray-900/90"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/35">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309]">
                                <AutoStoriesIcon sx={{ fontSize: 22 }} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-gray-900 dark:text-white">
                                    Pustaka {program.level || 'N3'}
                                </span>
                                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-gray-500 dark:text-gray-400">
                                    Referensi pendukung roadmap
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={onToggle}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-amber-300"
                                aria-label="Tutup Pustaka"
                                aria-expanded="true"
                                title="Tutup Pustaka"
                            >
                                <ChevronRightIcon sx={{ fontSize: 20 }} />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">
                                        {program.resources.vocabulary_count || 0}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                                        Entri tersedia
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Pendukung
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Isi Pustaka">
                                {['Kosakata', 'Kanji', 'Bunpo'].map((label) => (
                                    <span
                                        key={label}
                                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>

                            <p className="mt-4 text-xs font-semibold leading-5 text-gray-500 dark:text-gray-400">
                                Gunakan sebagai referensi saat mempelajari materi pada setiap Minggu.
                            </p>

                            <Link
                                href={program.resources.vocabulary_url}
                                className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 text-xs font-black text-amber-950 shadow-[0_3px_0_#b45309] transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40 active:translate-y-0.5 active:shadow-[0_1px_0_#b45309]"
                            >
                                Buka Pustaka
                                <ChevronRightIcon sx={{ fontSize: 18 }} />
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="library-rail"
                        type="button"
                        onClick={onToggle}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.16 }}
                        className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-amber-200/80 bg-white/90 px-1 py-3 text-amber-900 shadow-lg shadow-amber-950/5 backdrop-blur-md transition hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/40 dark:border-amber-900/60 dark:bg-gray-900/90 dark:text-amber-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/40"
                        aria-label={`Buka Pustaka ${program.level || 'N3'}`}
                        aria-expanded="false"
                        title={`Buka Pustaka ${program.level || 'N3'}`}
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-[0_2px_0_#b45309] transition-transform group-hover:-translate-y-0.5">
                            <AutoStoriesIcon sx={{ fontSize: 20 }} />
                        </span>
                        <span className="text-[10px] font-black leading-none">
                            {program.resources.vocabulary_count || 0}
                        </span>
                        <span className="[writing-mode:vertical-rl] text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                            Pustaka
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </aside>
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
        || displayWeeks.find((week) => Boolean(week.live_session))?.id
        || [...displayWeeks].reverse().find((week) => week.status === 'done')?.id
        || null;
    const [expandedWeekId, setExpandedWeekId] = useState(defaultExpandedWeekId);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const completedWeekCount = displayWeeks.filter((week) => week.status === 'done').length;
    const roadmapProgress = displayWeeks.length > 0
        ? Math.round((completedWeekCount / displayWeeks.length) * 100)
        : 0;
    const activeWeek = displayWeeks.find((week) => week.status === 'active');
    const activeDay = activeWeek?.days?.find((day) => day.status === 'active');
    const liveSessionSignature = displayWeeks
        .map((week) => `${week.live_session?.id || ''}:${week.live_session?.status || ''}`)
        .join('|');
    const nextAction = activeWeek
        ? `Lanjutkan Minggu ${activeWeek.week_number}${activeDay ? `, Hari ${activeDay.day_number}` : ''}`
        : completedWeekCount === displayWeeks.length
            ? 'Semua Minggu sudah selesai'
            : 'Belum ada Minggu yang dapat dibuka';

    useEffect(() => {
        setExpandedWeekId(defaultExpandedWeekId);
    }, [defaultExpandedWeekId, program?.id]);

    useEffect(() => {
        setLibraryOpen(window.localStorage.getItem('japanlingo:roadmap-library-open') === 'true');
    }, []);

    useEffect(() => {
        window.localStorage.setItem('japanlingo:roadmap-library-open', String(libraryOpen));
    }, [libraryOpen]);

    useEffect(() => {
        if (!libraryOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setLibraryOpen(false);
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [libraryOpen]);

    useEffect(() => {
        if (!program?.kloter) return undefined;

        const hasVisibleSession = displayWeeks.some((week) => Boolean(week.live_session));

        const interval = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ only: ['weeks'], preserveScroll: true, preserveState: true });
        }, hasVisibleSession ? 30000 : 60000);

        return () => window.clearInterval(interval);
    }, [liveSessionSignature, program?.kloter?.id]);

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`${program?.title || 'Roadmap'} - Japanlingo`} />

            <div className="relative min-h-[100dvh] overflow-x-clip bg-[#f7efe6] text-gray-900 transition-colors duration-300 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(220,38,38,0.10)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.12)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(120,53,15,0.055)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(120,53,15,0.045)_0_1px,transparent_1px_82px)] dark:bg-[linear-gradient(120deg,rgba(220,38,38,0.14)_0%,transparent_28%),linear-gradient(240deg,rgba(245,158,11,0.08)_0%,transparent_30%),repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_82px),repeating-linear-gradient(0deg,rgba(255,255,255,0.028)_0_1px,transparent_1px_82px)]" />
                <div className="pointer-events-none absolute left-4 top-40 hidden text-[13rem] font-black leading-none text-red-900/[0.045] dark:text-white/[0.035] lg:block">道</div>
                <div className="pointer-events-none absolute right-8 top-[560px] hidden text-[12rem] font-black leading-none text-amber-900/[0.05] dark:text-white/[0.03] lg:block">週</div>

                <header className="relative z-10 px-4 pb-3 pt-5 sm:px-6 sm:pb-5 sm:pt-7 lg:px-20">
                    <div className="mx-auto max-w-4xl">
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

                        <div className="mt-5 sm:flex sm:items-start sm:justify-between sm:gap-8">
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
                                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/80 shadow-inner dark:bg-gray-800">
                                    <motion.div
                                        className="h-full rounded-full bg-red-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${roadmapProgress}%` }}
                                        transition={{ duration: 0.55, ease: 'easeOut' }}
                                    />
                                </div>
                                {program?.id && (
                                    <ExamTargetCard
                                        program={program}
                                        completedWeekCount={completedWeekCount}
                                        totalWeeks={displayWeeks.length}
                                    />
                                )}
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

                <main className="relative z-10 px-3 pb-8 pt-3 sm:px-6 sm:pb-14 sm:pt-5">
                    <div
                        className={`mx-auto max-w-7xl xl:grid xl:items-start xl:gap-5 ${
                            program?.resources?.vocabulary_url
                                ? libraryOpen
                                    ? 'xl:grid-cols-[minmax(0,1fr)_280px]'
                                    : 'xl:grid-cols-[minmax(0,1fr)_52px]'
                                : 'xl:grid-cols-1'
                        }`}
                    >
                        <div className="min-w-0">
                            <LibraryShortcut program={program} />

                            {displayWeeks.map((week) => (
                                <WeekRoadmapSection
                                    key={week.id}
                                    week={week}
                                    expanded={expandedWeekId === week.id}
                                    onToggle={() => setExpandedWeekId((current) => current === week.id ? null : week.id)}
                                />
                            ))}
                        </div>

                        <DesktopLibraryPanel
                            program={program}
                            open={libraryOpen}
                            onToggle={() => setLibraryOpen((current) => !current)}
                        />
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
