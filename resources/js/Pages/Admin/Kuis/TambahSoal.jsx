import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function QuestionCreate({ quizzes = [], defaultQuizId = null }) {
    const { data, setData, post, processing, errors } = useForm({
        quiz_id: defaultQuizId || '',
        question_text: '',
        correct_answer: '',
        explanation: '',
        options: ['', '', '', ''],
        audio_url: '',
        order: 0,
    });

    const selectedQuiz = quizzes.find(q => q.id == data.quiz_id);
    const quizType = selectedQuiz?.type || '';

    const updateOption = (index, value) => {
        const newOptions = [...data.options];
        newOptions[index] = value;
        setData('options', newOptions);
    };

    const addOption = () => setData('options', [...data.options, '']);
    const removeOption = (index) => {
        if (data.options.length <= 2) return;
        setData('options', data.options.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.questions.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tambah Pertanyaan - Japanlingo" />
            <div className="min-h-screen bg-[#F8F9FB] font-sans">

                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.questions.index')} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-white transition-colors">
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </Link>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="w-9 h-9 bg-[#E64A19] rounded-xl flex items-center justify-center text-white">
                            <QuizOutlinedIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-white">Tambah Pertanyaan Baru</h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Isi detail pertanyaan dan jawaban</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-[#E64A19] hover:bg-[#D84315] disabled:opacity-60 text-white rounded-xl px-6 h-10 text-sm font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-colors"
                    >
                        <SaveOutlinedIcon sx={{ fontSize: 18 }} />
                        {processing ? 'Menyimpan...' : 'Simpan Pertanyaan'}
                    </button>
                </header>

                <main className="max-w-3xl mx-auto p-6 space-y-5">

                    {/* Info Dasar */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Informasi Pertanyaan</h2>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Kuis <span className="text-red-500">*</span></label>
                            <select
                                value={data.quiz_id}
                                onChange={e => setData('quiz_id', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19]"
                                required
                            >
                                <option value="">Pilih Kuis</option>
                                {quizzes.map(q => (
                                    <option key={q.id} value={q.id}>
                                        {q.lesson?.title ? `${q.lesson.title} — ` : ''}{q.type === 'multiple_choice' ? 'Pilihan Ganda' : q.type === 'typing' ? 'Mengetik' : 'Mendengarkan'}
                                    </option>
                                ))}
                            </select>
                            {errors.quiz_id && <p className="text-red-500 text-xs mt-1">{errors.quiz_id}</p>}
                        </div>

                        {quizType && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
                                <span className="text-xs font-bold text-[#E64A19]">
                                    Tipe: {quizType === 'multiple_choice' ? 'Pilihan Ganda' : quizType === 'typing' ? 'Mengetik' : 'Mendengarkan'}
                                </span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Teks Pertanyaan <span className="text-red-500">*</span></label>
                            <textarea
                                value={data.question_text}
                                onChange={e => setData('question_text', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19] resize-none"
                                placeholder="Tulis pertanyaan di sini..."
                                required
                            />
                            {errors.question_text && <p className="text-red-500 text-xs mt-1">{errors.question_text}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Urutan</label>
                                <input type="number" min="0" value={data.order} onChange={e => setData('order', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Field Khusus: Listening */}
                    {quizType === 'listening' && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
                            <h2 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">File Audio</h2>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">URL Audio</label>
                                <input
                                    type="url"
                                    value={data.audio_url}
                                    onChange={e => setData('audio_url', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19]"
                                    placeholder="https://example.com/audio.mp3"
                                />
                                {errors.audio_url && <p className="text-red-500 text-xs mt-1">{errors.audio_url}</p>}
                            </div>
                        </div>
                    )}

                    {/* Field Khusus: Multiple Choice */}
                    {quizType === 'multiple_choice' && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Pilihan Jawaban</h2>
                                <button type="button" onClick={addOption} className="text-xs font-bold text-[#E64A19] hover:underline flex items-center gap-1">
                                    <AddIcon sx={{ fontSize: 14 }} /> Tambah Pilihan
                                </button>
                            </div>
                            {errors.options && <p className="text-red-500 text-xs">{errors.options}</p>}
                            <div className="space-y-3">
                                {data.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-black text-gray-500 dark:text-gray-400 shrink-0">
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={e => updateOption(idx, e.target.value)}
                                            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19]"
                                            placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                        />
                                        {data.options.length > 2 && (
                                            <button type="button" onClick={() => removeOption(idx)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">
                                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Jawaban Benar & Penjelasan */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Jawaban</h2>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Jawaban Benar <span className="text-red-500">*</span>
                                {quizType === 'multiple_choice' && (
                                    <span className="ml-2 text-[11px] font-medium text-gray-400 dark:text-gray-500">(Ketik teks pilihan yang benar persis)</span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={data.correct_answer}
                                onChange={e => setData('correct_answer', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19]"
                                placeholder="Jawaban yang benar..."
                                required
                            />
                            {errors.correct_answer && <p className="text-red-500 text-xs mt-1">{errors.correct_answer}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Penjelasan (Opsional)</label>
                            <textarea
                                value={data.explanation}
                                onChange={e => setData('explanation', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E64A19]/30 focus:border-[#E64A19] resize-none"
                                placeholder="Penjelasan mengapa jawaban ini benar..."
                            />
                        </div>
                    </div>

                </main>
            </div>
        </AuthenticatedLayout>
    );
}
