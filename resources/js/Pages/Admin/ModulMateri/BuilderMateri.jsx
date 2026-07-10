import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StyleIcon from '@mui/icons-material/Style';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

function StatusBadge({ status }) {
    const published = status === 'published';

    return (
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${published ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
            {status || 'draft'}
        </span>
    );
}

function EmptyState({ icon, title, description, href, action }) {
    return (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                {icon}
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-500 dark:text-gray-400">{description}</p>
            <Link href={href} className="mt-5 inline-flex rounded-xl bg-[#E64A19] px-5 py-3 text-sm font-black text-white">
                {action}
            </Link>
        </div>
    );
}

export default function BuilderMateri({ module, flashcardSets = [], quizzes = [] }) {
    const ready = flashcardSets.length > 0 && quizzes.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Konten Modul - ${module.title}`} />

            <div className="min-h-screen bg-[#F8F9FB] px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
                <main className="mx-auto max-w-6xl space-y-6">
                    <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 gap-4">
                                <Link href={route('admin.modules.index')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300">
                                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                                </Link>
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#E64A19]">Komposisi Modul Mingguan</p>
                                    <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{module.title}</h1>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Week {module.week_number || '-'} - {module.description || 'Hubungkan flashcard dan kuis untuk flow belajar user.'}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ${ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'}`}>
                                {ready ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : <WarningAmberIcon sx={{ fontSize: 18 }} />}
                                {ready ? 'Siap dipakai user' : 'Belum lengkap'}
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">Materi Flashcard</p>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Flashcard Set</h2>
                                </div>
                                <Link href={route('admin.flashcards.index')} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                    Kelola Flashcard
                                </Link>
                            </div>

                            {flashcardSets.length === 0 ? (
                                <EmptyState
                                    icon={<StyleIcon sx={{ fontSize: 28 }} />}
                                    title="Belum ada flashcard"
                                    description="Buat flashcard set dan pilih modul ini sebagai target agar muncul di roadmap user."
                                    href={route('admin.flashcards.index')}
                                    action="Buka Flashcard"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {flashcardSets.map((set) => (
                                        <div key={set.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <StatusBadge status={set.status} />
                                                    <h3 className="mt-3 text-base font-black text-gray-900 dark:text-white">{set.title}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{set.flashcards_count || 0} kartu</p>
                                                </div>
                                                <Link href={route('admin.flashcards.builder', set.id)} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-black text-white">
                                                    Builder
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Assessment</p>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Kuis Modul</h2>
                                </div>
                                <Link href={route('admin.quizzes.index')} className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                    Kelola Kuis
                                </Link>
                            </div>

                            {quizzes.length === 0 ? (
                                <EmptyState
                                    icon={<QuizIcon sx={{ fontSize: 28 }} />}
                                    title="Belum ada kuis"
                                    description="Buat kuis dan pilih modul ini sebagai target agar muncul setelah flashcard user."
                                    href={route('admin.quizzes.index')}
                                    action="Buka Kuis"
                                />
                            ) : (
                                <div className="space-y-3">
                                    {quizzes.map((quiz) => (
                                        <div key={quiz.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <StatusBadge status={quiz.status} />
                                                    <h3 className="mt-3 text-base font-black text-gray-900 dark:text-white">Quiz #{quiz.id}</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{quiz.questions_count || 0} soal - {quiz.type}</p>
                                                </div>
                                                <Link href={route('admin.quizzes.builder', quiz.id)} className="rounded-xl bg-[#E64A19] px-4 py-2 text-xs font-black text-white">
                                                    Builder
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
