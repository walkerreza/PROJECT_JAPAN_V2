import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import theme from '@/Components/theme/themes';
import { FloatingLearningDecor, MascotGuide, RewardSummary } from '@/Components/User/UserVisuals';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';
import JapaneseSpeechButton from '@/Components/UI/JapaneseSpeechButton';

// MUI Icons
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';

const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
    const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
};

const reviewPriority = (question) => {
    if (question.review_due) return 0;
    if (question.review_status === 'learning') return 1;
    if (question.review_status === 'review') return 2;
    if (question.review_status === 'new') return 3;
    return 4;
};

function normalizeQuestionType(type) {
    if (type === 'fill_blank' || type === 'typing') return 'fill_blank';
    if (type === 'listening') return 'listening';
    return 'multiple_choice';
}

const japaneseTextPattern = /[\u3040-\u30ff\u3400-\u9fff]/g;

const getJapaneseSpeechText = (question) => {
    const source = [
        question?.kanji,
        question?.question,
        question?.correct_answer,
    ].filter(Boolean).join(' ');

    const matches = source.match(japaneseTextPattern);

    return matches?.length ? matches.join('') : '';
};

export default function Quiz({ quiz, questions: rawQuestions = [], flashcards = [], module_flow = false, back_url = null, finish_url = null }) {
    const [questions, setQuestions] = useState(() =>
        rawQuestions
            .map((q, index) => ({
                ...q,
                originalIndex: index,
                originalQuestionId: q.originalQuestionId ?? q.id,
                type: normalizeQuestionType(q.type),
                options: Array.isArray(q.options) ? q.options : [],
                attemptKey: `${q.id}-${index}-0`,
                repeatCount: 0,
            }))
            .sort((a, b) => reviewPriority(a) - reviewPriority(b) || a.originalIndex - b.originalIndex)
    );
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [answerFeedback, setAnswerFeedback] = useState(null);
    
    // Status Quiz
    const [lives, setLives] = useState(5);
    const [score, setScore] = useState(0);
    const [completedOriginalQuestionIds, setCompletedOriginalQuestionIds] = useState(() => new Set());
    const [showResult, setShowResult] = useState(false);
    const [showFlashcard, setShowFlashcard] = useState(false);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [needsFlashcardReview, setNeedsFlashcardReview] = useState(false);
    const hasTimeLimit = Number(quiz?.time_limit || 0) > 0;
    const [secondsLeft, setSecondsLeft] = useState(Number(quiz?.time_limit || 0));
    const [finishedByTimeout, setFinishedByTimeout] = useState(false);
    const [attemptResult, setAttemptResult] = useState(null);
    const [attemptError, setAttemptError] = useState(null);
    const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
    
    const submitted = useRef(false);
    const answerPendingRef = useRef(false);
    const answerLogRef = useRef({});
    const answerEventsRef = useRef([]);
    const correctMapRef = useRef({});

    // Animasi state
    const [shakeKey, setShakeKey] = useState(0); // Trigger shake animation
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    // Window size for Confetti
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentQ = questions[currentIndex];
    const currentType = currentQ?.type || 'multiple_choice';
    const currentSpeechText = getJapaneseSpeechText(currentQ);
    const hasQuestionAudio = Boolean(currentQ?.audio_url || currentSpeechText);
    const totalQuestionCount = rawQuestions.length || questions.length;
    const originalQuestionCount = rawQuestions.length || questions.filter((question) => !question.isRepeat).length || questions.length;
    const answeredCount = Object.keys(answerLogRef.current).length;
    const correctCount = Object.values(correctMapRef.current).filter(Boolean).length;
    const passingScore = Number(quiz?.passing_score || 70);
    const progressPercentage = originalQuestionCount > 0
        ? Math.min(100, (completedOriginalQuestionIds.size / originalQuestionCount) * 100)
        : 0;
    const timePercentage = hasTimeLimit ? (secondsLeft / Number(quiz.time_limit)) * 100 : 100;
    const activeFlashcard = flashcards[flashcardIndex] || null;
    const shouldShowFlashcardAfterQuestion = (lastQuestion, gameOver) => (
        !lastQuestion
        && !gameOver
        && flashcards.length > 0
        && flashcardIndex < flashcards.length
        && needsFlashcardReview
    );

    const repeatWrongQuestion = (question) => {
        const repeatCount = Number(question.repeatCount || 0);

        if (repeatCount >= 2) return;

        setQuestions((items) => [
            ...items,
            {
                ...question,
                attemptKey: `${question.id}-${items.length}-${repeatCount + 1}`,
                repeatCount: repeatCount + 1,
                isRepeat: true,
            },
        ]);
    };

    const checkAnswer = async ({ answerValue, selectedIndex = null, answerPayload }) => {
        if (!currentQ || selectedAnswer !== null || answerPendingRef.current) return;

        answerPendingRef.current = true;

        try {
            const response = await window.axios.post(route('user.questions.check', currentQ.id), {
                answer: answerValue,
            });
            const isCorrect = Boolean(response.data?.is_correct);
            const explanation = response.data?.explanation;

            const answerEvent = {
                question_id: currentQ.id,
                answer_text: answerValue,
                answer_payload: {
                    ...answerPayload,
                    is_correct: isCorrect,
                    attempt_key: currentQ.attemptKey,
                    repeat_count: currentQ.repeatCount || 0,
                },
            };
            answerLogRef.current[currentQ.id] = answerEvent;
            answerEventsRef.current.push(answerEvent);
            correctMapRef.current[currentQ.id] = isCorrect;
            setSelectedAnswer(selectedIndex ?? answerValue);

            if (isCorrect) {
                setNeedsFlashcardReview(false);
                setScore(Object.values({ ...correctMapRef.current, [currentQ.id]: true }).filter(Boolean).length);
                setCompletedOriginalQuestionIds((items) => {
                    const next = new Set(items);
                    next.add(currentQ.originalQuestionId ?? currentQ.id);
                    return next;
                });
                setAnswerFeedback({
                    status: 'correct',
                    title: currentQ.isRepeat ? 'Mantap, sudah membaik!' : 'Benar!',
                    message: currentQ.isRepeat ? 'Soal yang tadi sulit sudah berhasil kamu jawab.' : 'Jawaban ini masuk ke progres mastery.',
                });
            } else {
                setNeedsFlashcardReview(true);
                setLives((value) => Math.max(0, value - 1));
                setShakeKey((value) => value + 1);
                repeatWrongQuestion(currentQ);
                setAnswerFeedback({
                    status: 'wrong',
                    title: 'Belum tepat',
                    message: explanation || 'Soal ini akan muncul lagi di akhir sesi untuk repetisi.',
                });
            }
        } catch (error) {
            setSelectedAnswer(null);
            setAnswerFeedback({
                status: 'error',
                title: 'Gagal mengecek jawaban',
                message: 'Coba kirim ulang jawaban. Jika masih gagal, cek koneksi atau login.',
            });
        } finally {
            answerPendingRef.current = false;
        }
    };

    const handleAnswerClick = (index) => {
        if (selectedAnswer !== null || answerPendingRef.current) return;

        const answerValue = currentQ.options[index] || '';
        if (!answerValue) return;

        checkAnswer({
            answerValue,
            selectedIndex: index,
            answerPayload: {
                selected_index: index,
                selected_option: answerValue,
                question_type: currentType,
            },
        });
    };

    const handleTypedAnswerSubmit = (event) => {
        event.preventDefault();
        if (selectedAnswer !== null || answerPendingRef.current) return;

        const answer = textAnswer.trim();
        if (!answer) return;

        checkAnswer({
            answerValue: answer,
            selectedIndex: null,
            answerPayload: {
                typed_answer: answer,
                question_type: currentType,
            },
        });
    };

    const submitAttempt = async ({ timeout = false } = {}) => {
        if (submitted.current || !quiz?.id) return;
        submitted.current = true;
        setIsSubmittingAttempt(true);
        setAttemptError(null);

        try {
            const response = await window.axios.post(route('user.attempts.store'), {
                quiz_id: quiz.id,
                module_flow,
                finished_by_timeout: timeout,
                answers: answerEventsRef.current,
            });

            setAttemptResult(response.data || null);
        } catch (error) {
            submitted.current = false;
            setAttemptError('Hasil kuis belum tersimpan. Coba kirim ulang sebelum keluar dari halaman ini.');
        } finally {
            setIsSubmittingAttempt(false);
        }
    };

    useEffect(() => {
        if (!hasTimeLimit || questions.length === 0 || showResult || showFlashcard) return undefined;

        const timer = window.setInterval(() => {
            setSecondsLeft((value) => {
                if (value <= 1) {
                    window.clearInterval(timer);
                    setFinishedByTimeout(true);
                    submitAttempt({ timeout: true });
                    setShowResult(true);
                    return 0;
                }

                return value - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [hasTimeLimit, questions.length, showResult, showFlashcard, score]);

    const handleNext = () => {
        const gameOver = lives <= 0;
        const lastQuestion = currentIndex >= questions.length - 1;

        if (gameOver || lastQuestion) {
            submitAttempt({ timeout: false });
            setShowResult(true);
            return;
        }

        if (shouldShowFlashcardAfterQuestion(lastQuestion, gameOver)) {
            setShowFlashcard(true);
            setSelectedAnswer(null);
            setTextAnswer('');
            setAnswerFeedback(null);
            return;
        }

        setCurrentIndex(prev => prev + 1);
        setNeedsFlashcardReview(false);
        setSelectedAnswer(null);
        setTextAnswer('');
        setAnswerFeedback(null);
    };

    const continueAfterFlashcard = () => {
        setShowFlashcard(false);
        setNeedsFlashcardReview(false);
        setFlashcardIndex((prev) => prev + 1);
        setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
        setSelectedAnswer(null);
        setTextAnswer('');
        setAnswerFeedback(null);
    };

    const handleFlashcardReview = (action) => {
        if (!activeFlashcard?.id) {
            continueAfterFlashcard();
            return;
        }

        router.post(route('user.flashcards.review', activeFlashcard.id), {
            action,
            completed: false,
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: continueAfterFlashcard,
        });
    };

    const confirmExit = (e) => {
        e.preventDefault();
        openConfirm({
            variant: 'warning',
            title: 'Keluar dari Kuis?',
            message: 'Progres sesi kuis yang belum dikirim akan hilang.',
            confirmLabel: 'Iya, Keluar',
            details: [
                { label: 'Kuis', value: quiz?.title || quiz?.module?.title || 'Kuis aktif' },
                { label: 'Progress', value: `${answeredCount}/${totalQuestionCount} soal dijawab` },
                { label: 'Nyawa tersisa', value: `${lives} nyawa` },
            ],
            onConfirm: () => router.get(back_url || '/user/dashboard'),
        });
    };

    // Jika tidak ada soal dari DB
    if (questions.length === 0) {
        return (
            <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-amber-50 p-6">
                <Head title="Quiz" />
                <FloatingLearningDecor />
                <div className="relative z-10 max-w-md text-center">
                    <p className="text-2xl font-black text-gray-400 mb-4">😅 Belum Ada Soal</p>
                    <p className="text-gray-500 mb-6">Admin belum menambahkan soal untuk kuis ini.</p>
                    <Link href={route('user.dashboard')} className="inline-flex rounded-2xl bg-red-600 px-6 py-3 font-black text-white no-underline shadow-lg shadow-red-500/20">
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // === TAMPILAN HASIL (SUMMARY SCREEN) ===
    if (showResult) {
        const answeredCount = Object.keys(answerLogRef.current).length;
        const finalCorrectCount = Object.values(correctMapRef.current).filter(Boolean).length;
        const fallbackScore = totalQuestionCount > 0 ? Math.round((finalCorrectCount / totalQuestionCount) * 100) : 0;
        const finalScore = Number(attemptResult?.score ?? fallbackScore);
        const hasAnsweredAll = answeredCount >= totalQuestionCount;
        const isSuccess = typeof attemptResult?.passed === 'boolean'
            ? attemptResult.passed
            : (!finishedByTimeout && lives > 0 && hasAnsweredAll && finalScore >= passingScore);
        const resultTotalQuestions = attemptResult?.total_questions ?? totalQuestionCount;
        const resultAnsweredCount = attemptResult?.answered_count ?? answeredCount;
        const resultXp = attemptResult?.xp_earned;
        const retryQuiz = () => {
            if (typeof window !== 'undefined') {
                router.get(window.location.href);
            }
        };
        const retrySubmit = () => submitAttempt({ timeout: finishedByTimeout });

        return (
            <div className="min-h-screen font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden" 
                 style={{ backgroundColor: theme.sectionBg }}>
                <Head title="Hasil Kuis" />
                
                {isSuccess && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                    className="relative z-10 w-full max-w-xl"
                >
                    <RewardSummary
                        status={isSuccess ? 'success' : 'review'}
                        title={finishedByTimeout ? 'Waktu Habis!' : (isSuccess ? 'Quest Kuis Selesai!' : 'Belum Lulus')}
                        message={finishedByTimeout
                            ? 'Jawaban yang sudah dikerjakan tetap dikirim, tetapi week belum selesai karena waktu habis.'
                            : isSuccess
                                ? (attemptResult?.message || 'Skor cukup dan mastery naik. Week ini selesai, lanjutkan momentum ke roadmap.')
                                : (attemptResult?.message || `Target lulus ${passingScore}%. Soal yang salah masuk repetisi, ulangi sampai cukup kuat.`)
                        }
                        stats={[
                            { label: 'Skor', value: `${finalScore}%` },
                            { label: 'Terjawab', value: `${resultAnsweredCount}/${resultTotalQuestions}` },
                            { label: 'Status', value: finishedByTimeout ? 'Timeout' : `${finalScore}%` },
                            { label: 'Target', value: `${passingScore}%` },
                            { label: 'XP', value: isSubmittingAttempt ? 'Menyimpan...' : (resultXp !== undefined && resultXp !== null ? `+${resultXp}` : 'Belum tersimpan') },
                        ]}
                    />
                    {attemptError && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {attemptError}
                        </div>
                    )}
                    <div className="mt-4">
                        <MascotGuide
                            tone={isSuccess ? 'green' : 'amber'}
                            title={isSuccess ? 'Mastery naik' : 'Review dulu'}
                            message={isSubmittingAttempt
                                ? 'Hasil sedang disimpan ke server. Tunggu sebentar sebelum kembali ke roadmap.'
                                : (isSuccess ? 'Satu quest selesai. Week berikutnya terbuka jika akses dan jadwal kloter sudah memenuhi.' : 'Week berikutnya tetap terkunci sampai skor lulus. Polanya dibuat seperti Duolingo: salah berarti latihan ulang, bukan berhenti.')}
                        />
                    </div>

                    <button 
                        onClick={() => {
                            if (attemptError) {
                                retrySubmit();
                                return;
                            }

                            isSuccess
                                ? router.get(attemptResult?.next_url || finish_url || route('user.dashboard'))
                                : retryQuiz();
                        }}
                        disabled={isSubmittingAttempt}
                        className="mt-4 w-full py-4 rounded-2xl font-black text-white text-lg tracking-wide uppercase shadow-lg hover:brightness-110 active:translate-y-1 active:shadow-none transition-all"
                        style={{ backgroundColor: theme.doneColor, boxShadow: `0 4px 0 0 ${theme.doneShadow}` }}
                    >
                        {isSubmittingAttempt ? 'MENYIMPAN...' : (attemptError ? 'KIRIM ULANG HASIL' : (isSuccess ? 'LANJUTKAN' : 'ULANGI KUIS'))}
                    </button>
                </motion.div>
            </div>
        );
    }

    if (showFlashcard && activeFlashcard) {
        return (
            <div className="min-h-screen font-sans flex flex-col items-center px-4 pb-10 pt-8 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-lime-50">
                <Head title="Kosakata Baru" />
                <div className="pointer-events-none fixed -left-24 top-24 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
                <div className="pointer-events-none fixed -right-24 bottom-24 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl" />

                <header className="relative z-10 mb-8 flex w-full max-w-4xl items-center gap-3 px-2 md:gap-5 md:px-4">
                    <button onClick={confirmExit} className="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <CloseIcon />
                    </button>
                    <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: theme.activeColor }}
                            initial={false}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                    <div className="flex h-10 min-w-[58px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-base font-black text-red-500 shadow-sm ring-1 ring-red-100">
                        <FavoriteIcon sx={{ fontSize: 22, color: lives > 0 ? '#EF4444' : '#D1D5DB' }} />
                        <span className="tabular-nums">{lives}</span>
                    </div>
                    {hasTimeLimit && (
                        <div className={`hidden rounded-full px-3 py-1 text-xs font-black tabular-nums sm:block ${secondsLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                            {formatTime(secondsLeft)}
                        </div>
                    )}
                    {flashcards.length > 0 && (
                        <div className="hidden shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700 md:block">
                            {flashcards.length} Kosakata
                        </div>
                    )}
                </header>

                <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center relative z-10">
                    <motion.div
                        key={`flashcard-${activeFlashcard.id}`}
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.35 }}
                        className="relative w-full overflow-hidden rounded-[2.5rem] border-2 border-orange-100 bg-white shadow-[0_30px_80px_-35px_rgba(234,88,12,0.65)]"
                    >
                        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-orange-300 to-lime-300 opacity-30" />
                        <div className="relative border-b border-orange-100 bg-gradient-to-r from-orange-50 to-lime-50 px-6 py-5 sm:px-8">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-600">Mini Lesson</p>
                                    <h1 className="mt-2 text-xl font-black text-gray-900 sm:text-2xl">Kosakata baru sebelum lanjut soal</h1>
                                </div>
                                <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-700 shadow-sm">
                                    {flashcardIndex + 1}/{flashcards.length}
                                </span>
                            </div>
                        </div>

                        <div className="relative max-h-[58vh] overflow-y-auto overscroll-contain px-5 py-8 text-center sm:px-10 sm:py-12">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-3xl font-black text-orange-700">
                                あ
                            </div>
                            <p className="break-words text-4xl font-black tracking-tight text-gray-950 sm:text-7xl">{activeFlashcard.front_text}</p>
                            <p className="mt-4 break-words text-xl font-bold text-gray-500 sm:text-2xl">{activeFlashcard.reading || '-'}</p>
                            <div className="mx-auto mt-5 h-px max-w-md bg-orange-200" />

                            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                <JapaneseSpeechButton
                                    text={activeFlashcard.front_text || activeFlashcard.reading}
                                    audioUrl={activeFlashcard.audio_url}
                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                                />
                                {activeFlashcard.hint && (
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500">{activeFlashcard.hint}</span>
                                )}
                            </div>

                            <h2 className="mt-6 break-words text-2xl font-black text-gray-900 sm:text-3xl">{activeFlashcard.back_text || 'Belum ada arti'}</h2>
                            <p className="mt-3 text-sm font-bold text-gray-400">Pilih jujur. Yang belum paham akan masuk ke Review Kosakata.</p>

                            {(activeFlashcard.example_sentence || activeFlashcard.example_meaning) && (
                                <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-gray-50 p-5 text-left">
                                    <p className="break-words text-base font-bold text-gray-700">{activeFlashcard.example_sentence}</p>
                                    <p className="mt-2 break-words text-sm italic text-gray-500">{activeFlashcard.example_meaning}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                        <button
                            onClick={() => handleFlashcardReview('learning')}
                            className="rounded-[2rem] bg-orange-500 px-6 py-5 text-center text-lg font-black text-white shadow-[0_8px_0_#C2410C] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_4px_0_#C2410C]"
                        >
                            <span className="block text-2xl">?</span>
                            Belum Paham
                        </button>
                        <button
                            onClick={() => handleFlashcardReview('known')}
                            className="rounded-[2rem] bg-lime-400 px-6 py-5 text-center text-lg font-black text-gray-900 shadow-[0_8px_0_#65A30D] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_4px_0_#65A30D]"
                        >
                            <span className="block text-2xl">OK</span>
                            Sudah Paham
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // === TAMPILAN KUIS AKTIF ===
    return (
        <div className="min-h-screen font-sans flex flex-col items-center px-4 pb-56 pt-8 overflow-x-hidden sm:pb-40 md:pt-16"
             style={{ backgroundColor: theme.landingHeroBg }}>
            <Head title={`Quiz - Level 2`} />

            {/* Top Progress & Lives */}
            <header className="relative z-10 mb-8 flex w-full max-w-4xl items-center gap-3 px-2 md:mb-12 md:gap-5 md:px-4">
                <button onClick={confirmExit} className="text-gray-400 hover:text-gray-600 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <CloseIcon />
                </button>
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <motion.div 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: theme.activeColor }}
                        initial={false}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
                <div className="flex h-10 min-w-[58px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-base font-black text-red-500 shadow-sm ring-1 ring-red-100">
                    <FavoriteIcon sx={{ fontSize: 22, color: lives > 0 ? '#EF4444' : '#D1D5DB' }} />
                    <span className="tabular-nums">{lives}</span>
                </div>
                {hasTimeLimit && (
                    <div className={`hidden rounded-full px-3 py-1 text-xs font-black tabular-nums sm:block ${secondsLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-white text-gray-700'}`}>
                        {formatTime(secondsLeft)}
                    </div>
                )}
                {flashcards.length > 0 && (
                    <div className="hidden shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700 md:block">
                        {flashcards.length} Kosakata
                    </div>
                )}
            </header>

            {hasTimeLimit && (
                <div className="mb-6 w-full max-w-4xl px-2 md:px-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Waktu</span>
                        <span>{formatTime(secondsLeft)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                        <motion.div
                            className={`h-full rounded-full ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-orange-500'}`}
                            animate={{ width: `${timePercentage}%` }}
                            transition={{ duration: 0.25 }}
                        />
                    </div>
                </div>
            )}

            {/* Quiz Content Area */}
            <main className="w-full max-w-3xl flex-1 flex flex-col items-center relative z-10">
                
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-col items-center"
                    >
                        {/* Question Info */}
                        <div className="text-center mb-8 w-full">
                            <h2 className="mb-2 break-words px-1 text-xl font-black text-gray-900 md:text-3xl">{currentQ.question}</h2>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-shadow">
                                Soal {currentIndex + 1} dari {questions.length} - Terjawab {answeredCount}/{questions.length}
                            </p>
                        </div>

                        {/* Flashcard Canvas / Media */}
                        {(currentQ.kanji || currentQ.audio_url || currentSpeechText) && (
                            <div className="w-full max-w-[500px] aspect-video bg-white rounded-[2rem] shadow-sm border-2 border-gray-100 flex items-center justify-center relative mb-10 overflow-hidden">
                                {currentQ.kanji ? (
                                    <span className="max-w-full break-words px-4 text-[64px] font-medium leading-none text-gray-900 select-none sm:text-[100px] md:text-[140px]">{currentQ.kanji}</span>
                                ) : !currentQ.audio_url ? (
                                    <div className="max-h-[72%] overflow-y-auto overscroll-contain px-6 text-center sm:px-8">
                                        <span className="text-xs font-black uppercase tracking-[0.25em] text-gray-300">Narator Jepang</span>
                                        <p className="mt-3 break-words text-2xl font-black text-gray-700 sm:text-3xl md:text-5xl">{currentSpeechText}</p>
                                    </div>
                                ) : null}
                                
                                {currentQ.audio_url && (
                                    (currentQ.audio_url.includes('youtube.com') || currentQ.audio_url.includes('youtu.be')) ? (
                                        <iframe
                                            src={currentQ.audio_url.includes('watch?v=') ? currentQ.audio_url.replace('watch?v=', 'embed/') : currentQ.audio_url}
                                            className="w-full h-full"
                                            allowFullScreen
                                            title="Audio Question"
                                        />
                                    ) : (
                                        <>
                                            {!currentQ.kanji && <span className="text-gray-400 font-bold tracking-widest uppercase">Pesan Suara</span>}
                                            <JapaneseSpeechButton
                                                audioUrl={currentQ.audio_url}
                                                text={currentSpeechText || currentQ.kanji || currentQ.question}
                                                className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 text-white rounded-2xl shadow-md border-b-4 flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all hover:brightness-110"
                                                style={{ backgroundColor: theme.activeColor, borderColor: theme.activeShadow }}
                                            />
                                        </>
                                    )
                                )}
                                {!currentQ.audio_url && hasQuestionAudio && (
                                    <JapaneseSpeechButton
                                        text={currentSpeechText || currentQ.kanji || currentQ.question}
                                        className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-12 h-12 text-white rounded-2xl shadow-md border-b-4 flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all hover:brightness-110"
                                        style={{ backgroundColor: theme.activeColor, borderColor: theme.activeShadow }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Answer Area */}
                        <motion.div
                            className="w-full max-w-[500px]"
                            animate={shakeKey > 0 ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            {currentType === 'multiple_choice' && currentQ.options.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {currentQ.options.map((option, index) => {
                                        const isSelected = selectedAnswer === index;
                                        let buttonStyle = {
                                            backgroundColor: "white",
                                            borderColor: "#E5E7EB",
                                            color: "#4B5563",
                                            boxShadow: `0 4px 0 0 #E5E7EB`
                                        };

                                        if (isSelected && answerFeedback?.status === 'correct') {
                                            buttonStyle = {
                                                backgroundColor: '#dcfce7',
                                                borderColor: '#22c55e',
                                                color: '#166534',
                                                boxShadow: '0 4px 0 0 #16a34a',
                                            };
                                        } else if (isSelected && answerFeedback?.status === 'wrong') {
                                            buttonStyle = {
                                                backgroundColor: '#fee2e2',
                                                borderColor: '#ef4444',
                                                color: '#991b1b',
                                                boxShadow: '0 4px 0 0 #dc2626',
                                            };
                                        } else if (isSelected) {
                                            buttonStyle = {
                                                backgroundColor: theme.heroBlob1 || '#F0FDF4',
                                                borderColor: theme.activeColor,
                                                color: theme.activeShadow,
                                                boxShadow: `0 4px 0 0 ${theme.activeColor}`
                                            };
                                        }

                                        return (
                                            <button
                                                key={index}
                                                disabled={selectedAnswer !== null}
                                                onClick={() => handleAnswerClick(index)}
                                                className="relative w-full text-center py-5 px-6 rounded-2xl border-2 font-bold text-base transition-all active:translate-y-1 active:shadow-none disabled:cursor-default"
                                                style={buttonStyle}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <form onSubmit={handleTypedAnswerSubmit} className="space-y-4">
                                    {currentType === 'fill_blank' && currentQ.options?.[0] && (
                                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-bold text-yellow-700">
                                            Hint: {currentQ.options[0]}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        disabled={selectedAnswer !== null}
                                        placeholder={currentType === 'listening' ? 'Ketik jawaban dari audio...' : 'Ketik jawaban yang tepat...'}
                                        className="w-full rounded-2xl border-2 border-gray-200 bg-white px-5 py-5 text-center text-lg font-black text-gray-800 shadow-sm outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:bg-gray-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={selectedAnswer !== null || textAnswer.trim() === ''}
                                        className="w-full rounded-2xl bg-red-600 px-6 py-4 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cek Jawaban
                                    </button>
                                </form>
                            )}
                        </motion.div>

                        {answerFeedback?.status === 'error' && selectedAnswer === null && (
                            <div className="mt-5 w-full max-w-[500px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {answerFeedback.message}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Floating Success/Action Bar */}
            <AnimatePresence>
                {selectedAnswer !== null && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`fixed bottom-0 left-0 right-0 border-t-2 z-50`}
                        style={{ 
                            backgroundColor: answerFeedback?.status === 'wrong' ? '#fef2f2' : (theme.sectionBg || '#F0FDF4'),
                            borderColor: answerFeedback?.status === 'wrong' ? '#ef4444' : theme.activeColor
                        }}
                    >
                        <div className="mx-auto flex max-w-4xl flex-col items-stretch justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-8 sm:py-8">
                            
                            {/* Feedback Message */}
                            <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-16 sm:w-16"
                                    style={{ color: answerFeedback?.status === 'wrong' ? '#ef4444' : theme.activeColor }}
                                >
                                    {answerFeedback?.status === 'wrong' ? <CloseIcon sx={{ fontSize: 30 }} /> : <CheckCircleIcon sx={{ fontSize: 30 }} />}
                                </motion.div>
                                <div>
                                    <h3 className="mb-1 break-words text-xl font-black sm:text-2xl"
                                        style={{ color: answerFeedback?.status === 'wrong' ? '#991b1b' : theme.activeShadow }}>
                                        {answerFeedback?.title || 'Jawaban direkam'}
                                    </h3>
                                    <p className="break-words text-xs font-medium sm:text-sm"
                                       style={{ color: answerFeedback?.status === 'wrong' ? '#b91c1c' : theme.activeShadow }}>
                                        {answerFeedback?.message || 'Koreksi dan XP dihitung oleh server.'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={handleNext}
                                className="w-full rounded-2xl px-8 py-3.5 text-base font-black uppercase tracking-wide text-white shadow-lg transition-all active:translate-y-1 active:shadow-none hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-12 sm:py-4 sm:text-lg"
                                style={{ 
                                    backgroundColor: theme.doneColor, 
                                    boxShadow: `0 4px 0 0 ${theme.doneShadow}` 
                                }}
                            >
                                {lives === 0 ? "SELESAI" : "LANJUT"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </div>
    );
}
