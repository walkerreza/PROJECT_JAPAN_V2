import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import StyleIcon from '@mui/icons-material/Style';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

function StatusBadge({ status }) {
    const published = status === 'published';

    return (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${published ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
            {status || 'draft'}
        </span>
    );
}

function ContentCard({ tone = 'orange', icon, eyebrow, title, description, count, countLabel, actionHref, actionLabel, children }) {
    const tones = {
        orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
        teal: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
        red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    };

    return (
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 p-5 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone] || tones.orange}`}>
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">{eyebrow}</p>
                            <h2 className="mt-1 text-lg font-black text-gray-900 dark:text-white">{title}</h2>
                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{description}</p>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{count}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{countLabel}</p>
                    </div>
                </div>
                <Link href={actionHref} className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-gray-950 px-4 text-xs font-black text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-950">
                    {actionLabel}
                </Link>
            </div>
            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

function EmptyRows({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm dark:border-gray-800 dark:bg-gray-950/40">
            <p className="font-black text-gray-700 dark:text-gray-200">{title}</p>
            <p className="mt-1 font-medium text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );
}

export default function BuilderMateri({
    module,
    flashcardSets = [],
    quizzes = [],
    presentations = [],
    vocabularyStats = {},
}) {
    const hasFlashcard = flashcardSets.length > 0;
    const hasQuiz = quizzes.length > 0;
    const hasPresentation = presentations.length > 0;
    const ready = hasFlashcard && hasQuiz;
    const programTitle = module.program_pembelajaran?.title || module.programPembelajaran?.title || 'Belum masuk kelas';

    return (
        <AuthenticatedLayout>
            <Head title={`Kelola Isi Modul - ${module.title}`} />

            <div className="min-h-screen bg-[#F8F9FB] px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
                <main className="mx-auto max-w-7xl space-y-6">
                    <header className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 shadow-sm dark:border-orange-900/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                        <div className="p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex min-w-0 gap-4">
                                    <Link href={route('admin.modules.index')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300">
                                        <ArrowBackIcon sx={{ fontSize: 18 }} />
                                    </Link>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#E64A19]">Workflow Modul Mingguan</p>
                                        <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{module.title}</h1>
                                        <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                                            {programTitle} - Week {module.week_number || '-'} - {module.description || 'Kelola PPT, kosakata, flashcard, dan kuis dalam satu tempat.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black ${ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                                        {ready ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <WarningAmberIcon sx={{ fontSize: 18 }} />}
                                        {ready ? 'Siap Dipakai User' : 'Belum Lengkap'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/70">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">PPT</p>
                                    <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{presentations.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/70">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kosakata N3</p>
                                    <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{vocabularyStats.n3 || 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/70">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Flashcard</p>
                                    <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{flashcardSets.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-gray-900/70">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kuis</p>
                                    <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{quizzes.length}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <ContentCard
                            tone="orange"
                            icon={<SlideshowIcon sx={{ fontSize: 26 }} />}
                            eyebrow="Presentasi"
                            title="PPT Modul"
                            description="Deck penunjang kelas untuk ditampilkan ke user atau dipakai sensei."
                            count={presentations.length}
                            countLabel="deck"
                            actionHref={route('admin.presentations.index', { module_id: module.id })}
                            actionLabel="Kelola Presentasi"
                        >
                            {hasPresentation ? (
                                <div className="space-y-3">
                                    {presentations.map((deck) => (
                                        <div key={deck.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                            <div className="min-w-0">
                                                <StatusBadge status={deck.status} />
                                                <p className="mt-2 truncate text-sm font-black text-gray-900 dark:text-white">{deck.title}</p>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{deck.slides_count || 0} slide</p>
                                            </div>
                                            <Link href={route('admin.presentations.builder', deck.id)} className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-black text-white">Builder</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyRows title="Belum ada PPT" description="Buat deck presentasi dan pilih modul ini sebagai target." />
                            )}
                        </ContentCard>

                        <ContentCard
                            tone="blue"
                            icon={<LibraryBooksIcon sx={{ fontSize: 26 }} />}
                            eyebrow="Library"
                            title="Kosakata N3"
                            description="Bank kosakata dipakai untuk flashcard dan generate soal kuis."
                            count={vocabularyStats.published || 0}
                            countLabel="published"
                            actionHref={route('admin.vocabulary.index')}
                            actionLabel="Buka Kosakata"
                        >
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-gray-50 p-4 text-center dark:bg-gray-950/40">
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{vocabularyStats.total || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                                </div>
                                <div className="rounded-2xl bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                                    <p className="text-xl font-black text-blue-700 dark:text-blue-300">{vocabularyStats.n3 || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">N3</p>
                                </div>
                                <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{vocabularyStats.published || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Ready</p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                Catatan: kosakata saat ini masih library global, belum dikunci per modul.
                            </p>
                        </ContentCard>

                        <ContentCard
                            tone="teal"
                            icon={<StyleIcon sx={{ fontSize: 26 }} />}
                            eyebrow="Flashcard"
                            title="Set Flashcard"
                            description="Kartu latihan sela-sela sebelum user mengerjakan kuis."
                            count={flashcardSets.length}
                            countLabel="set"
                            actionHref={route('admin.flashcards.index')}
                            actionLabel="Kelola Flashcard"
                        >
                            {hasFlashcard ? (
                                <div className="space-y-3">
                                    {flashcardSets.map((set) => (
                                        <div key={set.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                            <div className="min-w-0">
                                                <StatusBadge status={set.status} />
                                                <p className="mt-2 truncate text-sm font-black text-gray-900 dark:text-white">{set.title}</p>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{set.flashcards_count || 0} kartu</p>
                                            </div>
                                            <Link href={route('admin.flashcards.builder', set.id)} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white">Builder</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyRows title="Belum ada flashcard" description="Buat flashcard set dan pilih modul ini sebagai target." />
                            )}
                        </ContentCard>

                        <ContentCard
                            tone="red"
                            icon={<QuizIcon sx={{ fontSize: 26 }} />}
                            eyebrow="Assessment"
                            title="Kuis Modul"
                            description="Kuis akhir sesi yang mengunci progress roadmap user."
                            count={quizzes.length}
                            countLabel="kuis"
                            actionHref={route('admin.quizzes.index', { module_id: module.id })}
                            actionLabel="Kelola Bank Kuis"
                        >
                            {hasQuiz ? (
                                <div className="space-y-3">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                            <div className="min-w-0">
                                                <StatusBadge status={quiz.status} />
                                                <p className="mt-2 truncate text-sm font-black text-gray-900 dark:text-white">Quiz #{quiz.id}</p>
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{quiz.questions_count || 0} soal - {quiz.type}</p>
                                            </div>
                                            <Link href={route('admin.quizzes.builder', quiz.id)} className="rounded-xl bg-[#E64A19] px-4 py-2 text-xs font-black text-white">Builder</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyRows title="Belum ada kuis" description="Buat kuis dan pilih modul ini sebagai target." />
                            )}
                        </ContentCard>
                    </section>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
