import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import {
    QUESTION_TYPES,
    TYPE_COLORS,
    TYPE_LABELS,
    emptyQuestion,
    getQuestionError,
    normalizeQuestionType,
    normalizeQuestions,
} from './Builder/helpers';

export default function QuizBuilder({ quiz, questions: initialQuestions = [] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('questions');
    const [importProcessing, setImportProcessing] = useState(false);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [showKanjiGenerate, setShowKanjiGenerate] = useState(false);
    const importInputRef = useRef(null);
    const initialForm = {
        time_limit: quiz?.time_limit ?? '',
        passing_score: quiz?.passing_score ?? 70,
        questions: normalizeQuestions(initialQuestions, quiz?.type),
    };
    const cleanSnapshotRef = useRef(JSON.stringify(initialForm));

    const { data, setData, post, processing, recentlySuccessful, errors, clearErrors } = useForm(initialForm);
    const kanjiForm = useForm({
        jlpt_level: 'N3',
        count: 10,
        mode: 'meaning',
        status: 'published',
    });
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const activeQ = data.questions[activeIndex] || data.questions[0] || emptyQuestion(quiz?.type || 'multiple_choice');
    const optLabels = ['A', 'B', 'C', 'D'];
    const questionErrors = useMemo(() => data.questions.map(getQuestionError), [data.questions]);
    const firstQuestionError = questionErrors.find(Boolean);
    const currentSnapshot = useMemo(() => JSON.stringify(data), [data]);
    const hasUnsavedChanges = currentSnapshot !== cleanSnapshotRef.current;

    useEffect(() => {
        if (activeIndex > data.questions.length - 1) {
            setActiveIndex(Math.max(0, data.questions.length - 1));
        }
    }, [activeIndex, data.questions.length]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const requestUnsavedAction = (action, config = {}) => {
        if (!hasUnsavedChanges) {
            action();
            return;
        }

        openConfirm({
            variant: 'warning',
            title: 'Ada Perubahan Belum Disimpan',
            message: 'Perubahan terakhir di builder belum dipublish. Lanjutkan aksi ini?',
            confirmLabel: 'Lanjutkan',
            ...config,
            onConfirm: () => {
                closeConfirm();
                action();
            },
        });
    };

    const updateQuestion = (index, field, value) => {
        clearErrors();
        const updated = [...data.questions];
        updated[index] = { ...updated[index], [field]: value };
        setData('questions', updated);
    };

    const updateOption = (qIndex, optIndex, value) => {
        clearErrors();
        const updated = [...data.questions];
        const opts = [...(updated[qIndex].options || ['', '', '', ''])];
        opts[optIndex] = value;
        updated[qIndex] = { ...updated[qIndex], options: opts };
        setData('questions', updated);
    };

    const setCorrectAnswer = (qIndex, value) => {
        clearErrors();
        const updated = [...data.questions];
        updated[qIndex] = { ...updated[qIndex], correct_answer: value };
        setData('questions', updated);
    };

    const changeQuestionType = (index, newType) => {
        clearErrors();
        const updated = [...data.questions];
        updated[index] = {
            ...updated[index],
            type: newType,
            options: newType === 'multiple_choice' ? (updated[index].options?.length ? updated[index].options : ['', '', '', '']) : [],
        };
        setData('questions', updated);
    };

    const addQuestion = (type) => {
        clearErrors();
        const newQ = emptyQuestion(type || quiz?.type || 'multiple_choice');
        newQ.order = data.questions.length;
        setData('questions', [...data.questions, newQ]);
        setActiveIndex(data.questions.length);
    };

    const removeQuestion = (index) => {
        if (data.questions.length <= 1) return;
        clearErrors();
        const updated = data.questions.filter((_, i) => i !== index);
        setData('questions', updated);
        if (activeIndex >= updated.length) setActiveIndex(updated.length - 1);
    };

    const handleSave = () => {
        if (firstQuestionError) {
            const invalidIndex = questionErrors.findIndex(Boolean);
            setActiveTab('questions');
            setActiveIndex(invalidIndex);
            openConfirm({
                variant: 'warning',
                title: 'Soal Belum Lengkap',
                message: firstQuestionError,
                details: [{ label: 'Nomor soal', value: `Q${invalidIndex + 1}` }],
                confirmLabel: 'Perbaiki',
                cancelLabel: 'Tutup',
                onConfirm: closeConfirm,
            });
            return;
        }

        post(route('admin.quizzes.builder.update', quiz.id), {
            preserveScroll: true,
            onSuccess: () => {
                cleanSnapshotRef.current = JSON.stringify(data);
            },
        });
    };

    const handleImportQuestions = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const input = event.target;

        const importNow = () => {
            const payload = new FormData();
            payload.append('import_file', file);
            setImportProcessing(true);

            router.post(route('admin.quizzes.questions.import', quiz.id), payload, {
                forceFormData: true,
                preserveScroll: true,
                preserveState: false,
                onFinish: () => {
                    setImportProcessing(false);
                    input.value = '';
                },
            });
        };

        if (hasUnsavedChanges) {
            input.value = '';
            requestUnsavedAction(importNow, {
                title: 'Import Soal Sekarang?',
                message: 'Import akan memuat ulang daftar soal dari file. Perubahan yang belum dipublish bisa tertimpa.',
                confirmLabel: 'Import Sekarang',
            });
            return;
        }

        importNow();
    };

    const handleGenerateKanjiQuestions = (event) => {
        event.preventDefault();
        requestUnsavedAction(() => {
            kanjiForm.post(route('admin.quizzes.questions.generate-kanji', quiz.id), {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => setShowKanjiGenerate(false),
            });
        }, {
            title: 'Generate Soal Kanji?',
            message: 'Soal hasil generate akan ditambahkan dari Kanji Bank. Simpan perubahan manual dulu jika masih diperlukan.',
            confirmLabel: 'Generate',
        });
    };

    const totalPoints = data.questions.length * 10;

    // ─── RENDER: QUESTION EDITOR (by type) ──────────────────
    const renderEditor = () => {
        const qType = activeQ.type || 'multiple_choice';

        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-[#E64A19] overflow-hidden">
                {/* Editor Header */}
                <div className="flex flex-col gap-3 p-4 border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        </div>
                        <h2 className="font-black text-gray-900 dark:text-white">Q{activeIndex + 1}</h2>
                        {questionErrors[activeIndex] && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-black uppercase text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Belum lengkap</span>
                        )}
                        <select
                            value={qType}
                            onChange={(e) => changeQuestionType(activeIndex, e.target.value)}
                            className="bg-transparent font-medium text-sm text-gray-600 dark:text-gray-400 focus:outline-none cursor-pointer"
                        >
                            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Difficulty</span>
                            <span className="text-xs font-black text-[#E64A19] bg-orange-50 px-2 py-0.5 rounded">N3</span>
                        </div>
                        <button onClick={() => removeQuestion(activeIndex)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6 sm:p-8 sm:space-y-8">
                    {errors.questions && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                            {errors.questions}
                        </div>
                    )}
                    {/* ─── Listening: Audio URL ─── */}
                    {qType === 'listening' && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <MicNoneOutlinedIcon sx={{ fontSize: 14 }} /> Audio URL
                            </label>
                            <input
                                type="text"
                                value={activeQ.audio_url || ''}
                                onChange={(e) => updateQuestion(activeIndex, 'audio_url', e.target.value)}
                                placeholder="https://example.com/audio.mp3"
                                className="w-full rounded-xl border border-transparent bg-gray-50 p-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-red-100 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:bg-gray-800/50 dark:text-white dark:focus:border-red-900/30 dark:focus:bg-gray-950"
                            />
                            {activeQ.audio_url && (
                                <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                                        <MicNoneOutlinedIcon sx={{ fontSize: 20 }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-green-700 dark:text-green-400 truncate">{activeQ.audio_url}</p>
                                        <audio controls className="w-full mt-2 h-8" src={activeQ.audio_url} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Question Text ─── */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                            {qType === 'listening' ? 'Question After Listening' : qType === 'fill_blank' ? 'Sentence (use ___ for blank)' : 'Question Text (Kanji Supported)'}
                        </label>
                        <div className="relative">
                            <textarea
                                value={activeQ.question_text}
                                onChange={(e) => updateQuestion(activeIndex, 'question_text', e.target.value)}
                                placeholder={
                                    qType === 'fill_blank'
                                        ? 'e.g. 彼は___に行きました。'
                                        : qType === 'listening'
                                        ? 'e.g. 音声で言っていることは何ですか？'
                                        : 'e.g. Choose the correct reading for: 経済'
                                }
                                className="w-full min-h-[100px] rounded-xl border border-transparent bg-gray-50 p-4 text-base font-medium text-gray-900 outline-none transition-all resize-none focus:border-red-100 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:bg-gray-800/50 dark:text-white dark:focus:border-red-900/30 dark:focus:bg-gray-950"
                            />
                        </div>
                    </div>

                    {/* ─── Multiple Choice: Options Grid ─── */}
                    {qType === 'multiple_choice' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {(activeQ.options || ['', '', '', '']).map((opt, optIdx) => {
                                const isCorrect = activeQ.correct_answer === opt && opt !== '';
                                return (
                                    <div key={optIdx} className="relative group">
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-xs font-bold z-10 ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200'}`}>
                                            {optLabels[optIdx]}
                                        </div>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => updateOption(activeIndex, optIdx, e.target.value)}
                                            placeholder={`Opsi ${optLabels[optIdx]}`}
                                            className={`w-full h-14 rounded-xl pl-14 pr-12 text-sm font-medium focus:outline-none ${
                                                isCorrect
                                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-500 text-green-900 dark:text-green-200 font-bold focus:ring-4 focus:ring-green-500/20'
                                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:border-gray-400'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCorrectAnswer(activeIndex, opt)}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 ${isCorrect ? 'text-green-500' : 'text-gray-300 hover:text-gray-400 dark:text-gray-500'}`}
                                        >
                                            {isCorrect ? <CheckCircleIcon sx={{ fontSize: 22 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 22 }} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── Fill in Blank: Answer Input ─── */}
                    {qType === 'fill_blank' && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 dark:bg-purple-900/20 dark:border-purple-900/40">
                                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Preview Soal</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">
                                    {activeQ.question_text
                                        ? activeQ.question_text.split('___').map((part, i, arr) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <span className="inline-block mx-1 px-4 py-1 bg-white dark:bg-gray-950 border-2 border-dashed border-purple-400 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-300 font-black text-sm">
                                                        {activeQ.correct_answer || '?'}
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))
                                        : <span className="text-gray-300">Tulis kalimat dengan ___ ...</span>
                                    }
                                </p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Jawaban Benar (isi dari blank)</label>
                                <input
                                    type="text"
                                    value={activeQ.correct_answer}
                                    onChange={(e) => updateQuestion(activeIndex, 'correct_answer', e.target.value)}
                                    placeholder="e.g. 学校"
                                    className="w-full h-14 bg-white dark:bg-gray-950 border-2 border-purple-300 dark:border-purple-800 rounded-xl px-4 text-lg font-bold text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Hint (Opsional)</label>
                                <input
                                    type="text"
                                    value={(activeQ.options && activeQ.options[0]) || ''}
                                    onChange={(e) => {
                                        const updated = [...data.questions];
                                        updated[activeIndex] = { ...updated[activeIndex], options: [e.target.value] };
                                        setData('questions', updated);
                                    }}
                                    placeholder="e.g. がっこう (petunjuk membaca)"
                                    className="w-full h-12 rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-medium text-gray-600 outline-none focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-500/10 dark:bg-gray-800/50 dark:text-gray-300 dark:focus:border-gray-600 dark:focus:bg-gray-950"
                                />
                            </div>
                        </div>
                    )}

                    {/* ─── Listening: Answer (same as MC or direct) ─── */}
                    {qType === 'listening' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Jawaban Benar</label>
                                <input
                                    type="text"
                                    value={activeQ.correct_answer}
                                    onChange={(e) => updateQuestion(activeIndex, 'correct_answer', e.target.value)}
                                    placeholder="e.g. 天気予報"
                                    className="w-full h-14 bg-white dark:bg-gray-950 border-2 border-green-300 dark:border-green-800 rounded-xl px-4 text-lg font-bold text-green-900 dark:text-green-200 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500"
                                />
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                <HelpOutlineIcon className="text-green-500" sx={{ fontSize: 18 }} />
                                <p className="text-xs text-green-700 dark:text-green-400 font-medium">Siswa akan mendengarkan audio, lalu mengetikkan jawaban. Cocok untuk latihan <strong>dictation</strong> atau <strong>comprehension</strong>.</p>
                            </div>
                        </div>
                    )}

                    {/* ─── Explanation (all types) ─── */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Explanation for Correct Answer
                        </label>
                        <textarea
                            value={activeQ.explanation || ''}
                            onChange={(e) => updateQuestion(activeIndex, 'explanation', e.target.value)}
                            placeholder="e.g. 経済 (Keizai) means economy."
                            className="w-full min-h-[80px] rounded-xl border border-transparent bg-gray-50 p-4 text-sm font-medium text-gray-500 outline-none transition-all resize-none focus:border-red-100 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:bg-gray-800/50 dark:text-gray-300 dark:focus:border-red-900/30 dark:focus:bg-gray-950"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // ─── RENDER: SETTINGS PANEL ─────────────────────────────
    const renderSettings = () => (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2"><SettingsIcon sx={{ fontSize: 20 }} className="text-[#E64A19]" /> Pengaturan Kuis</h2>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><TimerOutlinedIcon sx={{ fontSize: 12 }} /> Batas Waktu (menit)</label>
                        <input
                            type="number"
                            min="0"
                            value={data.time_limit ?? ''}
                            onChange={(e) => setData('time_limit', e.target.value)}
                            className="w-full h-12 rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-bold text-gray-900 outline-none focus:border-red-100 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:bg-gray-800/50 dark:text-white dark:focus:border-red-900/30 dark:focus:bg-gray-950"
                            placeholder="Kosong = tanpa batas"
                        />
                        {errors.time_limit && <p className="mt-1 text-[10px] font-bold text-red-600">{errors.time_limit}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUpIcon sx={{ fontSize: 12 }} /> Nilai Lulus (%)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={data.passing_score ?? 70}
                            onChange={(e) => setData('passing_score', e.target.value)}
                            className="w-full h-12 rounded-xl border border-transparent bg-gray-50 px-4 text-sm font-bold text-gray-900 outline-none focus:border-red-100 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:bg-gray-800/50 dark:text-white dark:focus:border-red-900/30 dark:focus:bg-gray-950"
                            placeholder="Default 70"
                        />
                        {errors.passing_score && <p className="mt-1 text-[10px] font-bold text-red-600">{errors.passing_score}</p>}
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                    <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Opsi Pengacakan</h3>
                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl opacity-70">
                        <div className="flex items-center gap-3">
                            <ShuffleIcon className="text-red-500" sx={{ fontSize: 20 }} />
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Acak Urutan Soal</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">Soal muncul acak untuk setiap siswa</p>
                            </div>
                        </div>
                        <input type="checkbox" disabled className="w-5 h-5 rounded text-[#E64A19] focus:ring-[#E64A19]/30 border-gray-300 dark:border-gray-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl opacity-70">
                        <div className="flex items-center gap-3">
                            <ShuffleIcon className="text-purple-500" sx={{ fontSize: 20 }} />
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Acak Pilihan Jawaban</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">Opsi A/B/C/D diacak per siswa (Multiple Choice)</p>
                            </div>
                        </div>
                        <input type="checkbox" disabled className="w-5 h-5 rounded text-[#E64A19] focus:ring-[#E64A19]/30 border-gray-300 dark:border-gray-600" />
                    </label>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                    <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Percobaan</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Maks. Percobaan</label>
                            <input type="number" min="1" defaultValue="3" disabled className="w-full h-12 rounded-xl border border-transparent bg-gray-100 px-4 text-sm font-bold text-gray-400 outline-none dark:bg-gray-800/50 dark:text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Tampilkan Penjelasan?</label>
                            <select disabled className="w-full h-12 rounded-xl border border-transparent bg-gray-100 px-4 text-sm font-bold text-gray-400 outline-none dark:bg-gray-800/50 dark:text-gray-500">
                                <option value="after_submit">Setelah Submit</option>
                                <option value="after_all">Setelah Semua Selesai</option>
                                <option value="never">Tidak Ditampilkan</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── RENDER: ANALYSIS PANEL ─────────────────────────────
    const renderAnalysis = () => {
        const qCount = data.questions.length;
        const mcCount = data.questions.filter(q => (q.type || 'multiple_choice') === 'multiple_choice').length;
        const fillCount = data.questions.filter(q => q.type === 'fill_blank').length;
        const listenCount = data.questions.filter(q => q.type === 'listening').length;
        const filledCount = data.questions.filter((_, index) => !questionErrors[index]).length;

        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Total Soal', value: qCount, color: 'text-[#E64A19]' },
                        { label: 'Multiple Choice', value: mcCount, color: 'text-red-600 dark:text-red-400' },
                        { label: 'Fill in Blank', value: fillCount, color: 'text-purple-600' },
                        { label: 'Listening', value: listenCount, color: 'text-green-600' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 text-center">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Completeness */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChartIcon sx={{ fontSize: 18 }} className="text-[#E64A19]" /> Kelengkapan Soal</h3>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                        <div className="h-3 bg-gradient-to-r from-[#E64A19] to-[#FF7043] rounded-full transition-all" style={{ width: `${qCount > 0 ? (filledCount / qCount) * 100 : 0}%` }}></div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{filledCount}/{qCount} soal terisi lengkap ({qCount > 0 ? Math.round((filledCount / qCount) * 100) : 0}%)</p>
                </div>

                {/* Per-Question Analysis Table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2"><TrendingUpIcon sx={{ fontSize: 18 }} className="text-[#E64A19]" /> Item Analysis</h3>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Analisis tiap soal — data akan terisi setelah ada percobaan siswa</p>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <th className="px-5 py-3 text-left">#</th>
                                <th className="px-5 py-3 text-left">Tipe</th>
                                <th className="px-5 py-3 text-left">Soal</th>
                                <th className="px-5 py-3 text-center">Difficulty (p)</th>
                                <th className="px-5 py-3 text-center">Discrimination</th>
                                <th className="px-5 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.questions.map((q, i) => {
                                const isFilled = !questionErrors[i];
                                const typeConf = TYPE_LABELS[q.type || 'multiple_choice'];
                                const typeColor = TYPE_COLORS[q.type || 'multiple_choice'];
                                return (
                                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 dark:bg-gray-800/50">
                                        <td className="px-5 py-3 font-black text-gray-400 dark:text-gray-500">Q{i + 1}</td>
                                        <td className="px-5 py-3"><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${typeColor}`}>{typeConf}</span></td>
                                        <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{q.question_text || <span className="text-gray-300 italic">Kosong</span>}</td>
                                        <td className="px-5 py-3 text-center font-bold text-gray-600 dark:text-gray-300">
                                            {q.correct_rate === null || q.correct_rate === undefined ? '—' : `${q.correct_rate}%`}
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold text-gray-600 dark:text-gray-300">
                                            {q.attempts_count ? `${q.correct_count}/${q.attempts_count}` : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {isFilled
                                                ? <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">Siap</span>
                                                : <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded">Belum Lengkap</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                    <HelpOutlineIcon className="text-red-500 shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                    <div>
                        <p className="text-sm font-bold text-red-900">Tentang Item Analysis</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                            <strong>Difficulty (p-value)</strong>: Proporsi siswa yang menjawab benar. Rentang 0.0 (semua salah) — 1.0 (semua benar). Ideal: 0.3–0.7.<br />
                            <strong>Discrimination</strong>: Seberapa baik soal membedakan siswa pintar vs kurang. Positif = baik. Nol/negatif = soal perlu direvisi.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // ─── RENDER: STUDENT PREVIEW ────────────────────────────
    const renderPreview = () => {
        const qType = activeQ.type || 'multiple_choice';
        return (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-200 dark:border-gray-700 h-[500px] overflow-hidden flex flex-col relative">
                <div className="bg-[#E64A19] h-12 flex items-center px-4 justify-between shrink-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Student Preview</span>
                    <div className="w-2 h-2 rounded-full bg-white dark:bg-gray-900/50"></div>
                </div>
                <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                        <div className="h-1.5 bg-[#E64A19] rounded-full" style={{ width: `${data.questions.length > 0 ? ((activeIndex + 1) / data.questions.length) * 100 : 0}%` }}></div>
                    </div>

                    {qType === 'listening' && activeQ.audio_url && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                            <MicNoneOutlinedIcon className="text-green-600" sx={{ fontSize: 16 }} />
                            <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase">Audio</span>
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest mb-2">Question {activeIndex + 1}</p>
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                            {activeQ.question_text || <span className="text-gray-300">...</span>}
                        </h3>
                    </div>

                    {qType === 'multiple_choice' && (
                        <div className="space-y-2 mb-auto">
                            {(activeQ.options || []).map((opt, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-2.5 text-center text-xs font-bold ${
                                    activeQ.correct_answer === opt && opt !== '' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                    {opt || <span className="text-gray-300">—</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {qType === 'fill_blank' && (
                        <div className="mb-auto">
                            <div className="border-2 border-dashed border-purple-300 rounded-xl px-4 py-3 text-center">
                                <input type="text" disabled placeholder={activeQ.correct_answer || '???'} className="w-full text-center bg-transparent border-none text-sm font-bold text-purple-600 placeholder-purple-300" />
                            </div>
                        </div>
                    )}

                    {qType === 'listening' && (
                        <div className="mb-auto">
                            <div className="border-2 border-dashed border-green-300 rounded-xl px-4 py-3 text-center">
                                <input type="text" disabled placeholder={activeQ.correct_answer || '???'} className="w-full text-center bg-transparent border-none text-sm font-bold text-green-600 placeholder-green-300" />
                            </div>
                        </div>
                    )}

                    <button className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-500 font-bold text-xs mt-4">Next Question</button>
                </div>
                <div className="h-10 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Time: {data.time_limit ? `${data.time_limit} min` : '∞'}</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Lulus: {data.passing_score || 70}%</span>
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pts: 10</span>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-[#F8F9FB] dark:bg-gray-950 flex flex-col font-sans">
            <Head title="Quiz Builder - Japanlingo" />

            {/* Top Nav */}
            <header className="sticky top-0 z-40 shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 lg:h-16 lg:px-6 lg:py-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    <button type="button" onClick={() => requestUnsavedAction(() => router.visit(route('admin.quizzes.index')), { title: 'Keluar dari Builder?', message: 'Perubahan terakhir belum dipublish. Keluar sekarang?' })} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">文A</div>
                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">JapanLingo Quiz Builder</h1>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400 dark:text-gray-500">{quiz?.lesson?.title || 'Untitled'} — {quiz?.type}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                    {['questions', 'settings', 'analysis'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 h-9 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
                                activeTab === tab ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {tab === 'questions' && <><FormatListBulletedIcon sx={{ fontSize: 16 }} /> Questions</>}
                            {tab === 'settings' && <><SettingsIcon sx={{ fontSize: 16 }} /> Settings</>}
                            {tab === 'analysis' && <><AssessmentIcon sx={{ fontSize: 16 }} /> Analysis</>}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    {hasUnsavedChanges && <span className="text-xs font-bold text-yellow-600">Belum disimpan</span>}
                    {recentlySuccessful && <span className="text-xs font-bold text-green-600 animate-pulse">Tersimpan!</span>}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowTemplateMenu(value => !value)}
                            className="h-9 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300"
                        >
                            Template Import
                        </button>
                        {showTemplateMenu && (
                            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                <a
                                    href={route('admin.quizzes.questions.template', { quiz: quiz.id, format: 'xlsx' })}
                                    onClick={() => setShowTemplateMenu(false)}
                                    className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                                >
                                    Download Excel (.xlsx)
                                </a>
                                <a
                                    href={route('admin.quizzes.questions.template', { quiz: quiz.id, format: 'csv' })}
                                    onClick={() => setShowTemplateMenu(false)}
                                    className="block border-t border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                >
                                    Download CSV (.csv)
                                </a>
                            </div>
                        )}
                    </div>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".csv,.txt,.xlsx"
                        className="hidden"
                        onChange={handleImportQuestions}
                    />
                    <button
                        type="button"
                        onClick={() => importInputRef.current?.click()}
                        disabled={importProcessing}
                        className="h-9 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        <UploadFileIcon sx={{ fontSize: 18 }} className="mr-1 align-[-4px]" />
                        {importProcessing ? 'Import...' : 'Import CSV/Excel'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowKanjiGenerate(true)}
                        className="h-9 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-bold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-300"
                    >
                        Generate Kanji
                    </button>
                    <button onClick={handleSave} disabled={processing} className="bg-[#E64A19] hover:bg-[#D84315] disabled:opacity-50 text-white rounded-xl px-6 h-9 shadow-md shadow-orange-500/20 text-sm font-bold flex items-center gap-2 transition-colors">
                        <SaveOutlinedIcon sx={{ fontSize: 18 }} />
                        {processing ? 'Menyimpan...' : 'Publish Quiz'}
                    </button>
                </div>
                </div>
            </header>

            {/* Workspace */}
            <main className="flex-1 flex flex-col overflow-hidden lg:flex-row">

                {/* Left Panel (only on questions tab) */}
                {activeTab === 'questions' && (
                    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:w-72 lg:border-b-0 lg:border-r">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Questions ({data.questions.length})</span>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">Points: {totalPoints}</span>
                        </div>
                        <div className="flex-1 overflow-x-auto p-3 lg:overflow-y-auto">
                            <div className="flex min-w-max gap-2 lg:min-w-0 lg:block lg:space-y-2">
                            {data.questions.map((q, i) => {
                                const tLabel = TYPE_LABELS[q.type || 'multiple_choice'];
                                const tColor = TYPE_COLORS[q.type || 'multiple_choice'];
                                const itemError = questionErrors[i];
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        className={`w-56 shrink-0 rounded-xl border p-3 text-left transition-all lg:w-full ${
                                            activeIndex === i ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm ring-1 ring-red-500' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${activeIndex === i ? 'text-red-700 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>Q{i + 1}</span>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${tColor}`}>{tLabel}</span>
                                            {itemError && <span className="ml-auto h-2 w-2 rounded-full bg-yellow-500" title={itemError}></span>}
                                        </div>
                                        <p className={`text-sm font-bold truncate ${activeIndex === i ? 'text-red-900 dark:text-red-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {q.question_text || 'Pertanyaan baru...'}
                                        </p>
                                    </button>
                                );
                            })}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 sm:grid-cols-3 lg:grid-cols-1">
                            {QUESTION_TYPES.map(t => (
                                <button key={t.value} onClick={() => addQuestion(t.value)} className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
                                    <AddIcon sx={{ fontSize: 14 }} /> {t.label}
                                </button>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Center */}
                <section className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {activeTab === 'questions' && renderEditor()}
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'analysis' && renderAnalysis()}

                    {activeTab === 'questions' && (
                        <div className="fixed bottom-6 right-6 z-30 lg:bottom-8 lg:right-[340px]">
                            <button onClick={() => addQuestion()} className="w-14 h-14 bg-[#E64A19] hover:bg-[#D84315] text-white rounded-full shadow-xl shadow-orange-500/30 flex items-center justify-center transition-transform hover:scale-105">
                                <AddIcon sx={{ fontSize: 28 }} />
                            </button>
                        </div>
                    )}
                </section>

                {/* Right Panel (preview, always visible on questions tab) */}
                {activeTab === 'questions' && (
                    <aside className="flex w-full shrink-0 flex-col space-y-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 lg:w-80 lg:border-t-0 lg:border-l">
                        {renderPreview()}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                            <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest mb-4">Set Summary</h4>
                            <div className="flex justify-between gap-4">
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">Questions</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{data.questions.length}</p>
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1">Avg. Grade</p>
                                    <p className="text-lg font-black text-[#E64A19]">N3</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
            </main>
            {showKanjiGenerate && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleGenerateKanjiQuestions} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
                        <div className="mb-5">
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Kanji Bank</p>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Generate Soal dari Kanji Bank</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Soal baru akan ditambahkan ke akhir quiz ini.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="space-y-1">
                                <span className="text-xs font-black text-gray-500 dark:text-gray-400">JLPT</span>
                                <select value={kanjiForm.data.jlpt_level} onChange={(e) => kanjiForm.setData('jlpt_level', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="N5">N5</option>
                                    <option value="N4">N4</option>
                                    <option value="N3">N3</option>
                                </select>
                            </label>
                            <label className="space-y-1">
                                <span className="text-xs font-black text-gray-500 dark:text-gray-400">Jumlah</span>
                                <input type="number" min="1" max="50" value={kanjiForm.data.count} onChange={(e) => kanjiForm.setData('count', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                            </label>
                            <label className="space-y-1 sm:col-span-2">
                                <span className="text-xs font-black text-gray-500 dark:text-gray-400">Mode Soal</span>
                                <select value={kanjiForm.data.mode} onChange={(e) => kanjiForm.setData('mode', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="meaning">Apa arti kanji?</option>
                                    <option value="reading">Apa reading utama?</option>
                                    <option value="kanji_from_meaning">Pilih kanji dari arti</option>
                                </select>
                            </label>
                            <label className="space-y-1 sm:col-span-2">
                                <span className="text-xs font-black text-gray-500 dark:text-gray-400">Sumber Data</span>
                                <select value={kanjiForm.data.status} onChange={(e) => kanjiForm.setData('status', e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="published">Published saja</option>
                                    <option value="draft">Draft saja</option>
                                    <option value="all">Semua status</option>
                                </select>
                            </label>
                        </div>
                        {kanjiForm.errors.generate && <p className="mt-3 text-sm font-bold text-red-600">{kanjiForm.errors.generate}</p>}
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowKanjiGenerate(false)} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                            <button disabled={kanjiForm.processing} className="rounded-xl bg-[#E64A19] px-6 py-3 text-sm font-black text-white disabled:opacity-50">{kanjiForm.processing ? 'Generate...' : 'Generate'}</button>
                        </div>
                    </form>
                </div>
            )}
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
            </div>
        </AuthenticatedLayout>
    );
}
