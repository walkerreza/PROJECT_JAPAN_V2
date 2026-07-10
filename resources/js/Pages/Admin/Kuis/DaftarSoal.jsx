import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ChecklistIcon from '@mui/icons-material/Checklist';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HearingIcon from '@mui/icons-material/Hearing';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ConfirmActionDialog from '@/Components/UI/ConfirmActionDialog';

const QUIZ_TYPE_LABELS = {
    multiple_choice: { label: 'Pilihan Ganda', icon: <ChecklistIcon sx={{ fontSize: 12 }} />, color: 'bg-red-100 text-red-700 dark:text-red-400' },
    typing:          { label: 'Mengetik',      icon: <KeyboardIcon sx={{ fontSize: 12 }} />,  color: 'bg-purple-100 text-purple-700' },
    listening:       { label: 'Mendengarkan',  icon: <HearingIcon sx={{ fontSize: 12 }} />,   color: 'bg-green-100 text-green-700 dark:text-green-400' },
};

export default function QuestionsIndex({ questions = [], quizzes = [], selectedQuizId = null }) {
    const [filterQuiz, setFilterQuiz] = useState(selectedQuizId || 'all');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const filtered = filterQuiz === 'all'
        ? questions
        : questions.filter(q => q.quiz?.id == filterQuiz);

    const confirmDelete = () => {
        router.delete(route('admin.questions.destroy', deleteConfirm.id), {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    const selectedQuiz = quizzes.find(q => q.id == filterQuiz);

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Pertanyaan - Japanlingo" />
            <div className="min-h-screen bg-[#F8F9FB] font-sans">

                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#E64A19] rounded-xl flex items-center justify-center text-white">
                            <QuizOutlinedIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-white">Manajemen Pertanyaan</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{filtered.length} Pertanyaan</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                            <FilterListIcon sx={{ fontSize: 16 }} className="text-gray-400 dark:text-gray-500" />
                            <select
                                value={filterQuiz}
                                onChange={e => setFilterQuiz(e.target.value)}
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none focus:ring-0 outline-none"
                            >
                                <option value="all">Semua Kuis</option>
                                {quizzes.map(q => (
                                    <option key={q.id} value={q.id}>
                                        {q.lesson?.title ? `${q.lesson.title} — ` : ''}{q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'typing' ? 'Mengetik' : 'Mendengarkan'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedQuiz && (
                            <Link
                                href={route('admin.quizzes.builder', selectedQuiz.id)}
                                className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-xl px-4 h-10 text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                                Buka Builder
                            </Link>
                        )}

                        <Link
                            href={route('admin.questions.create', filterQuiz !== 'all' ? { quiz_id: filterQuiz } : {})}
                            className="bg-[#E64A19] hover:bg-[#D84315] text-white rounded-xl px-5 h-10 text-sm font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-colors"
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                            Tambah Pertanyaan
                        </Link>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto p-6">
                    {filtered.length === 0 ? (
                        <div className="text-center py-24 text-gray-400 dark:text-gray-500">
                            <QuizOutlinedIcon sx={{ fontSize: 48 }} className="mb-3 opacity-30" />
                            <p className="font-medium">Belum ada pertanyaan.</p>
                            <Link
                                href={route('admin.questions.create', filterQuiz !== 'all' ? { quiz_id: filterQuiz } : {})}
                                className="mt-4 inline-block text-sm font-bold text-[#E64A19] hover:underline"
                            >
                                + Buat Pertanyaan Pertama
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((question, idx) => {
                                const quizType = question.quiz?.type || 'multiple_choice';
                                const typeConf = QUIZ_TYPE_LABELS[quizType] || { label: quizType, icon: null, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };

                                return (
                                    <div key={question.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4 flex items-center gap-4 group hover:border-gray-300 dark:border-gray-600 transition-colors">
                                        <div className="text-gray-300 cursor-grab">
                                            <DragIndicatorIcon sx={{ fontSize: 20 }} />
                                        </div>

                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-black text-gray-400 dark:text-gray-500 shrink-0">
                                            {idx + 1}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${typeConf.color}`}>
                                                    {typeConf.icon}{typeConf.label}
                                                </span>
                                                {question.audio_url && (
                                                    <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">🔊 Audio</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {question.question_text}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                                Jawaban: <span className="font-bold text-green-600">{question.correct_answer}</span>
                                                {question.options && question.options.length > 0 && (
                                                    <span className="ml-2">• {question.options.length} pilihan</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={route('admin.questions.edit', question.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 transition-colors"
                                                title="Edit"
                                            >
                                                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteConfirm(question)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 transition-colors"
                                                title="Hapus"
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {deleteConfirm && (
                <ConfirmActionDialog
                    show
                    variant="danger"
                    title="Hapus Pertanyaan?"
                    message="Pertanyaan akan dihapus permanen dari bank soal."
                    confirmLabel="Iya, Hapus"
                    details={[
                        { label: 'Pertanyaan', value: `${deleteConfirm.question_text?.substring(0, 80) || '-'}...` },
                        { label: 'Jawaban', value: deleteConfirm.correct_answer || '-' },
                    ]}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </AuthenticatedLayout>
    );
}
