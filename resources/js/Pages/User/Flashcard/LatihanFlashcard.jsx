import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';
import { KatanaIcon } from '@/Components/JapaneseIcons';
import { MascotGuide, RewardSummary, SeasonalScene } from '@/Components/User/UserVisuals';

const formatTime = (seconds) => {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${remainingSeconds}`;
};

export default function LatihanFlashcard({ set, cards = [], back_url = null, next_url = null, next_label = 'Lanjut' }) {
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [finished, setFinished] = useState(cards.length === 0);
    const [known, setKnown] = useState(0);
    const [learning, setLearning] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const card = cards[index];
    const progress = useMemo(() => (cards.length > 0 ? ((index + (finished ? 1 : 0)) / cards.length) * 100 : 0), [cards.length, finished, index]);

    useEffect(() => {
        if (finished) return undefined;

        const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
        return () => window.clearInterval(timer);
    }, [finished]);

    const playAudio = () => {
        if (!card?.audio_url) return;
        new Audio(card.audio_url).play();
    };

    const submitReview = (action) => {
        if (!card || isSubmitting) return;

        const isLast = index >= cards.length - 1;
        setIsSubmitting(true);

        router.post(route('user.flashcards.review', card.id), {
            action,
            completed: isLast,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (action === 'known') {
                    setKnown((value) => value + 1);
                } else {
                    setLearning((value) => value + 1);
                }

                if (isLast) {
                    setFinished(true);
                    return;
                }

                setIndex((value) => value + 1);
                setFlipped(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Flashcard - ${set.title}`} />

            <div className={`min-h-screen ${theme.bgColor || 'bg-[#FAFAF8]'} dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden`}>
                <div className="absolute top-10 right-10 text-[20rem] font-black text-orange-200/20 dark:text-gray-800/30 select-none pointer-events-none -z-10 rotate-12">
                    REN
                </div>
                <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-6">
                        <SeasonalScene
                            title="Dojo Flashcard"
                            subtitle="Balik kartu, jawab jujur, lalu biarkan repetisi mengatur kosakata mana yang perlu muncul lagi."
                            label="Vocabulary Dojo"
                            icon="scroll"
                            compact
                        />
                    </div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Link href={back_url || route('user.flashcards.index')} className="rounded-full bg-white border border-gray-200 dark:border-gray-800 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300 transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                            Keluar
                        </Link>
                        <div className="text-right">
                            <p className={`text-xs font-black uppercase tracking-[0.25em] ${theme.heroAccent || 'text-orange-600'} dark:text-orange-400 transition-colors duration-300`}>Flashcard</p>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 transition-colors duration-300">{set.title}</p>
                        </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-300">
                        <div className={`h-full rounded-full bg-gradient-to-r ${theme.ctaBg || 'from-orange-500 to-amber-500'} transition-all duration-300`} style={{ width: `${progress}%` }} />
                    </div>

                    {finished ? (
                        <div className="my-auto">
                            <RewardSummary
                                title="Flashcard selesai"
                                message={`Kamu menyelesaikan ${cards.length} kartu dalam ${formatTime(seconds)}. Kartu yang belum paham akan masuk antrean review.`}
                                stats={[
                                    { label: 'Sudah Paham', value: known },
                                    { label: 'Belum Paham', value: learning },
                                    { label: 'Waktu', value: formatTime(seconds) },
                                ]}
                            />
                            <div className="mt-4">
                                <MascotGuide
                                    tone="green"
                                    title="Kosakata terkunci"
                                    message="Lanjut ke kuis untuk menguji apakah kosakata ini sudah bisa dipakai dalam konteks soal."
                                />
                            </div>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                {cards.length > 0 && (
                                    <button onClick={() => { setIndex(0); setFinished(false); setKnown(0); setLearning(0); setSeconds(0); setFlipped(false); }} className={`rounded-2xl bg-gradient-to-r ${theme.ctaBg || 'from-gray-800 to-gray-900 dark:from-white dark:to-gray-100'} px-6 py-3 text-sm font-black text-white transition-colors duration-300 shadow-md hover:brightness-110 active:scale-[0.98]`}>
                                        Ulangi
                                    </button>
                                )}
                                <Link href={next_url || route('user.flashcards.index')} className="rounded-2xl bg-white border border-orange-200 px-6 py-3 text-sm font-black text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors duration-300 hover:bg-orange-50 dark:hover:bg-gray-700 shadow-sm">
                                    {next_url ? next_label : 'Pilih Set Lain'}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col">
                            <div className="mt-6">
                                <MascotGuide
                                    tone="amber"
                                    title="Aturan Dojo"
                                    message="Klik kartu untuk membuka arti. Pilih Belum Paham kalau masih ragu, karena sistem akan menjadwalkannya ulang."
                                />
                            </div>
                            
                            <div className="mt-6 relative h-[400px] w-full [perspective:1000px] cursor-pointer" onClick={() => setFlipped(!flipped)}>
                                <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
                                    
                                    {/* FRONT (Kanji/Text) */}
                                    <section className="absolute inset-0 [backface-visibility:hidden] rounded-[2rem] border-2 border-red-200 bg-gradient-to-br from-white to-red-50/50 shadow-xl dark:border-gray-800 dark:from-gray-900 flex flex-col items-center justify-center p-8">
                                        <div className="absolute top-5 left-5 flex items-center gap-3">
                                            <KatanaIcon className="w-8 h-8 text-red-500" />
                                            <span className="text-xs font-bold text-gray-500">{index + 1}/{cards.length}</span>
                                        </div>
                                        <div className="absolute top-5 right-5 rounded-full bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-red-600 shadow-sm">
                                            Lv {card.mastery_level ?? 0}
                                        </div>
                                        <p className="text-7xl font-black text-gray-900 dark:text-white" style={{fontFamily: "'Noto Sans JP', sans-serif"}}>{card.front_text}</p>
                                        <p className="mt-8 text-sm font-bold text-gray-400 animate-pulse">Klik untuk membalik</p>
                                    </section>

                                    {/* BACK (Meaning/Reading) */}
                                    <section className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] border-2 border-red-300 bg-gradient-to-br from-red-50 to-white shadow-xl dark:border-gray-700 dark:from-gray-800 flex flex-col items-center justify-center p-8 text-center">
                                        <p className="text-3xl font-bold text-gray-500 dark:text-gray-400 mb-2">{card.reading || '-'}</p>
                                        <h2 className="text-4xl font-black text-gray-900 dark:text-white" style={{fontFamily: "'Yuji Syuku', serif"}}>{card.back_text || 'Belum ada arti'}</h2>
                                        <div className="mt-5 flex items-center justify-center gap-3">
                                            {card.audio_url && (
                                                <button onClick={(e) => { e.stopPropagation(); playAudio(); }} className="flex h-11 w-11 items-center justify-center rounded-full border border-red-200 text-red-600 dark:border-gray-700 dark:text-gray-300 hover:bg-red-100">
                                                    &gt;
                                                </button>
                                            )}
                                        </div>
                                        {(card.example_sentence) && (
                                            <div className="mt-6 text-center bg-white/60 p-4 rounded-xl border border-red-100 w-full">
                                                <p className="text-lg font-bold text-gray-800">{card.example_sentence}</p>
                                                <p className="text-sm italic text-gray-600 mt-1">{card.example_meaning}</p>
                                            </div>
                                        )}
                                        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-black uppercase tracking-wider">
                                            <span className="rounded-full bg-white/70 px-3 py-1 text-gray-600">Status: {card.status === 'new' ? 'Baru' : card.status}</span>
                                            <span className="rounded-full bg-white/70 px-3 py-1 text-gray-600">Streak: {card.correct_streak ?? 0}</span>
                                            <span className="rounded-full bg-white/70 px-3 py-1 text-gray-600">Review: {card.review_count ?? 0}</span>
                                        </div>
                                    </section>
                                </div>
                            </div>


                            <section className="mt-8 grid grid-cols-2 gap-5">
                                <button
                                    onClick={() => submitReview('learning')}
                                    disabled={isSubmitting}
                                    className="rounded-[2rem] bg-[var(--btn-bg)] px-5 py-5 text-center font-black text-gray-950 dark:text-white shadow-[0_8px_0_var(--btn-shadow)] transition-all duration-300 active:translate-y-1 active:shadow-[0_4px_0_var(--btn-shadow)] disabled:cursor-wait disabled:opacity-70"
                                    style={{ '--btn-bg': theme.activeColor || '#fb923c', '--btn-shadow': theme.activeShadow || '#c2410c' }}
                                >
                                    <span className="block text-2xl">?</span>
                                    Belum Paham
                                </button>
                                <button
                                    onClick={() => submitReview('known')}
                                    disabled={isSubmitting}
                                    className="rounded-[2rem] bg-[var(--btn-bg)] px-5 py-5 text-center font-black text-gray-950 dark:text-white shadow-[0_8px_0_var(--btn-shadow)] transition-all duration-300 active:translate-y-1 active:shadow-[0_4px_0_var(--btn-shadow)] disabled:cursor-wait disabled:opacity-70"
                                    style={{ '--btn-bg': theme.doneColor || '#a3e635', '--btn-shadow': theme.doneShadow || '#65a30d' }}
                                >
                                    <span className="block text-2xl">OK</span>
                                    Sudah Paham
                                </button>
                            </section>

                            <footer className="mt-auto pt-8">
                                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-300">
                                    <div className="h-full rounded-full bg-[var(--progress-bg)] transition-all duration-300" style={{ width: `${((index + 1) / cards.length) * 100}%`, '--progress-bg': theme.activeColor || '#ef4444' }} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 py-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                    <div><span className="block text-xs">Time</span><span className="font-black text-gray-900 dark:text-white">{formatTime(seconds)}</span></div>
                                    <div><span className="block text-xs">Reviews</span><span className="font-black text-gray-900 dark:text-white">{index + 1} / {cards.length}</span></div>
                                    <div><span className="block text-xs">Progress</span><span className="font-black text-gray-900 dark:text-white">{card.status === 'new' ? 'New!' : card.status}</span></div>
                                </div>
                            </footer>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

