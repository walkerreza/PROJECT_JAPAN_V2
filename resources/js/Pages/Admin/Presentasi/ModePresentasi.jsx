import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import BoardCanvas from '@/Components/Features/Board/BoardCanvas';

const backgroundClass = {
    light: 'bg-white text-gray-950',
    dark: 'bg-gray-950 text-white',
    sunrise: 'bg-gradient-to-br from-orange-100 via-amber-50 to-white text-gray-950',
    sakura: 'bg-gradient-to-br from-pink-100 via-white to-rose-50 text-gray-950',
    ocean: 'bg-gradient-to-br from-cyan-100 via-white to-red-100 text-gray-950',
    forest: 'bg-gradient-to-br from-emerald-100 via-white to-lime-100 text-gray-950',
    paper: 'bg-[linear-gradient(#ffffff,#fff7ed)] text-gray-950',
    grid: 'bg-white text-gray-950 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]',
    indigo: 'bg-gradient-to-br from-indigo-950 via-gray-950 to-red-950 text-white',
    matcha: 'bg-gradient-to-br from-lime-100 via-white to-emerald-100 text-gray-950',
    rose: 'bg-gradient-to-br from-rose-100 via-white to-orange-50 text-gray-950',
};

function PresenterSlide({ slide }) {
    const lines = String(slide.content || '').split('\n').filter(Boolean);
    const accent = slide.accent_color || '#E64A19';

    return (
        <section className={`${backgroundClass[slide.background] || backgroundClass.light} relative flex min-h-screen overflow-hidden p-8 sm:p-12 lg:p-16`}>
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20" style={{ backgroundColor: accent }} />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/30" />
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col">
                {slide.layout === 'title' && (
                    <div className="my-auto">
                        <p className="mb-6 text-sm font-black uppercase tracking-[0.45em]" style={{ color: accent }}>JapanLingo</p>
                        <h1 className="text-6xl font-black tracking-tight sm:text-8xl">{slide.title || 'Untitled'}</h1>
                        <p className="mt-8 max-w-3xl text-2xl font-bold leading-relaxed opacity-70">{slide.content}</p>
                    </div>
                )}

                {slide.layout === 'content' && (
                    <div className="my-auto">
                        <h1 className="text-5xl font-black sm:text-7xl">{slide.title || 'Poin Utama'}</h1>
                        <div className="mt-10 grid gap-4">
                            {(lines.length ? lines : ['Tulis poin materi di sini.']).map((line, index) => (
                                <div key={`${line}-${index}`} className="rounded-[2rem] bg-white/70 p-6 text-2xl font-black shadow-lg backdrop-blur dark:bg-gray-900/60">
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {slide.layout === 'vocabulary' && (
                    <div className="my-auto text-center">
                        <p className="text-sm font-black uppercase tracking-[0.45em]" style={{ color: accent }}>Vocabulary</p>
                        <h1 className="mt-8 text-9xl font-black">{slide.title || '単語'}</h1>
                        <p className="mt-8 text-5xl font-bold opacity-70">{lines[0] || 'reading'}</p>
                        <p className="mt-10 text-6xl font-black">{lines[1] || 'arti'}</p>
                        <p className="mx-auto mt-10 max-w-4xl text-2xl italic opacity-70">{lines[2] || 'Contoh kalimat akan tampil di sini.'}</p>
                    </div>
                )}

                {slide.layout === 'kanji' && (
                    <div className="my-auto grid items-center gap-10 lg:grid-cols-[320px_1fr]">
                        <div className="grid h-72 w-72 place-items-center rounded-[3rem] bg-white/70 text-9xl font-black shadow-2xl dark:bg-gray-900/60">
                            {slide.title || '漢'}
                        </div>
                        <div className="space-y-6">
                            {(lines.length ? lines : ['Arti: ...', 'Reading: ...', 'Contoh: ...']).map((line, index) => (
                                <p key={`${line}-${index}`} className="text-4xl font-black opacity-80">{line}</p>
                            ))}
                        </div>
                    </div>
                )}

                {slide.layout === 'media' && (
                    <div className="my-auto">
                        <h1 className="mb-8 text-6xl font-black">{slide.title || 'Media'}</h1>
                        {slide.snapshot_url || slide.media_url ? (
                            <div className="overflow-hidden rounded-[2rem] bg-gray-950 shadow-2xl">
                                <img src={slide.snapshot_url || slide.media_url} alt={slide.title || 'media'} className="h-[55vh] w-full object-contain" />
                            </div>
                        ) : (
                            <div className="grid h-[55vh] place-items-center rounded-[2rem] border-4 border-dashed border-gray-300 text-4xl font-black opacity-40">Media URL</div>
                        )}
                        <p className="mt-6 text-2xl font-bold opacity-70">{slide.content}</p>
                    </div>
                )}

                {slide.layout === 'question' && (
                    <div className="my-auto text-center">
                        <p className="text-sm font-black uppercase tracking-[0.45em]" style={{ color: accent }}>Question</p>
                        <h1 className="mt-8 text-6xl font-black sm:text-8xl">{slide.title || 'Pertanyaan'}</h1>
                        <p className="mx-auto mt-10 max-w-5xl text-4xl font-bold leading-relaxed opacity-70">{slide.content}</p>
                    </div>
                )}

                {slide.layout === 'board' && (
                    <div className="my-auto">
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.45em]" style={{ color: accent }}>Board</p>
                                <h1 className="mt-3 text-5xl font-black sm:text-6xl">{slide.title || 'Board Presentasi'}</h1>
                            </div>
                            <p className="max-w-xl text-base font-bold opacity-70">{slide.content}</p>
                        </div>
                        <BoardCanvas
                            strokes={slide.jamboard_data?.strokes || slide.board_data?.strokes || []}
                            className="rounded-[2rem] border-4 border-white/70 shadow-2xl"
                        />
                    </div>
                )}

                {slide.layout === 'canvas' && (
                    <div className="my-auto">
                        <h1 className="mb-8 text-6xl font-black">{slide.title || 'Canvas Slide'}</h1>
                        {slide.snapshot_url || slide.snapshot_data || slide.media_url ? (
                            <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                                <img src={slide.snapshot_url || slide.snapshot_data || slide.media_url} alt={slide.title || 'Canvas'} className="h-[65vh] w-full object-contain" />
                            </div>
                        ) : (
                            <div className="grid h-[65vh] place-items-center rounded-[2rem] border-4 border-dashed border-gray-300 text-4xl font-black opacity-40">Canvas belum disimpan</div>
                        )}
                    </div>
                )}

                {slide.layout === 'pdf' && (
                    <div className="my-auto text-center">
                        <p className="text-sm font-black uppercase tracking-[0.45em]" style={{ color: accent }}>PDF</p>
                        <h1 className="mt-8 text-6xl font-black sm:text-8xl">{slide.title || 'PDF Presentasi'}</h1>
                        <p className="mx-auto mt-10 max-w-4xl text-3xl font-bold leading-relaxed opacity-70">Buka halaman user untuk viewer PDF carousel penuh.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default function ModePresentasi({ deck }) {
    const slides = deck.slides || [];
    const [index, setIndex] = useState(0);
    const activeSlide = slides[index] || null;
    const progress = slides.length > 0 ? ((index + 1) / slides.length) * 100 : 0;

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'ArrowRight' || event.key === ' ') {
                setIndex((value) => Math.min(slides.length - 1, value + 1));
            }

            if (event.key === 'ArrowLeft') {
                setIndex((value) => Math.max(0, value - 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length]);

    return (
        <>
            <Head title={`Presentasi - ${deck.title}`} />

            <div className="min-h-screen bg-gray-950">
                {activeSlide ? (
                    <PresenterSlide slide={activeSlide} />
                ) : (
                    <div className="grid min-h-screen place-items-center bg-gray-950 text-white">
                        <p className="text-xl font-black">Belum ada slide.</p>
                    </div>
                )}

                <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/20">
                    <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>

                <div className="fixed bottom-5 left-5 right-5 z-50 flex flex-col gap-3 rounded-3xl bg-gray-950/80 p-4 text-white shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black">{deck.title}</p>
                        <p className="text-xs font-bold text-gray-400">Slide {slides.length > 0 ? index + 1 : 0} / {slides.length} · gunakan ← → untuk navigasi</p>
                    </div>
                    {activeSlide?.speaker_notes && (
                        <p className="max-w-2xl text-xs font-medium text-gray-300 line-clamp-2">Catatan: {activeSlide.speaker_notes}</p>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setIndex((value) => Math.max(0, value - 1))} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black disabled:opacity-40" disabled={index <= 0}>Prev</button>
                        <button onClick={() => setIndex((value) => Math.min(slides.length - 1, value + 1))} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black disabled:opacity-40" disabled={index >= slides.length - 1}>Next</button>
                        <Link href={route('admin.presentations.builder', deck.id)} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white">Keluar</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
