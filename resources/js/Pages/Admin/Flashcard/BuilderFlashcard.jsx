import React, { useRef, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/UI/Card';

const emptyCard = {
    id: null,
    vocabulary_id: null,
    front_text: '',
    reading: '',
    back_text: '',
    hint: '',
    example_sentence: '',
    example_meaning: '',
    audio_url: '',
};

const fromVocabulary = (item) => ({
    id: null,
    vocabulary_id: item.id,
    front_text: item.word || '',
    reading: item.reading || '',
    back_text: item.meaning_id || item.meaning_en || '',
    hint: item.category || '',
    example_sentence: item.example_sentence || '',
    example_meaning: item.example_meaning || '',
    audio_url: item.audio_url || '',
});

export default function BuilderFlashcard({ set, vocabulary = {}, filters = {}, quizzes = [] }) {
    const rows = vocabulary.data || [];
    const importInputRef = useRef(null);
    const [cards, setCards] = useState(set.flashcards || []);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [setRecordStatus, setSetRecordStatus] = useState(set.status || 'draft');
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const generateForm = useForm({ quiz_id: '', mode: 'word_to_meaning', count: 10 });

    const updateCard = (index, field, value) => {
        setCards((current) => current.map((card, cardIndex) => (
            cardIndex === index ? { ...card, [field]: value } : card
        )));
    };

    const addBlankCard = () => setCards((current) => [...current, { ...emptyCard }]);
    const addVocabulary = (item) => setCards((current) => [...current, fromVocabulary(item)]);
    const removeCard = (index) => setCards((current) => current.filter((_, cardIndex) => cardIndex !== index));
    const duplicateCard = (index) => setCards((current) => {
        const card = current[index];
        if (!card) return current;

        const duplicate = { ...card, id: null, vocabulary_id: card.vocabulary_id || null };
        const next = [...current];
        next.splice(index + 1, 0, duplicate);

        return next;
    });

    const moveCard = (index, direction) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= cards.length) return;

        setCards((current) => {
            const next = [...current];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return next;
        });
    };

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('admin.flashcards.builder', set.id), { search, status }, { preserveState: true, replace: true });
    };

    const saveCards = () => {
        router.post(route('admin.flashcards.builder.update', set.id), {
            status: setRecordStatus,
            cards: cards.map((card) => ({
                id: card.id,
                vocabulary_id: card.vocabulary_id,
                front_text: card.front_text || '',
                reading: card.reading || '',
                back_text: card.back_text || '',
                hint: card.hint || '',
                example_sentence: card.example_sentence || '',
                example_meaning: card.example_meaning || '',
                audio_url: card.audio_url || '',
            })),
        }, { preserveScroll: true });
    };

    const generateQuiz = (event) => {
        event.preventDefault();
        generateForm.post(route('admin.flashcards.generate-quiz', set.id), { preserveScroll: true });
    };

    const importCards = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const payload = new FormData();
        payload.append('import_file', file);

        router.post(route('admin.flashcards.import', set.id), payload, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                event.target.value = '';
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Builder Flashcard - ${set.title}`} />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <Link href={route('admin.flashcards.index')} className="text-xs font-black uppercase tracking-[0.25em] text-teal-600">
                            Kembali ke Flashcard
                        </Link>
                        <h1 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{set.title}</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Susun kartu seperti form: satu blok untuk satu kosakata, lalu publish agar muncul di modul mingguan.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowTemplateMenu(value => !value)}
                                className="h-11 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-colors hover:bg-red-700"
                            >
                                Template
                            </button>
                            {showTemplateMenu && (
                                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                    <a
                                        href={route('admin.flashcards.template', { flashcardSet: set.id, format: 'xlsx' })}
                                        onClick={() => setShowTemplateMenu(false)}
                                        className="block px-4 py-3 text-sm font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-200 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                                    >
                                        Download Excel (.xlsx)
                                    </a>
                                    <a
                                        href={route('admin.flashcards.template', { flashcardSet: set.id, format: 'csv' })}
                                        onClick={() => setShowTemplateMenu(false)}
                                        className="block border-t border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-red-50 hover:text-red-700 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                    >
                                        Download CSV (.csv)
                                    </a>
                                </div>
                            )}
                        </div>
                        <input ref={importInputRef} type="file" accept=".csv,.txt,.xlsx" className="hidden" onChange={importCards} />
                        <button onClick={() => importInputRef.current?.click()} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition-colors hover:border-red-200 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            Import CSV/Excel
                        </button>
                        <select value={setRecordStatus} onChange={(event) => setSetRecordStatus(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <button onClick={addBlankCard} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                            Kartu Manual
                        </button>
                        <button onClick={saveCards} className="h-11 rounded-xl bg-[#14B8A6] px-5 text-sm font-black text-white">
                            Simpan Builder
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="space-y-4">
                        {cards.length === 0 && (
                            <Card>
                                <p className="text-center text-sm font-bold text-gray-500">
                                    Belum ada kartu. Ambil dari Vocabulary Bank atau buat kartu manual.
                                </p>
                            </Card>
                        )}

                        {cards.map((card, index) => (
                            <Card key={`${card.id || 'new'}-${card.vocabulary_id || 'manual'}-${index}`} className="overflow-hidden border-l-4 border-l-[#14B8A6]">
                                <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-600">Kartu #{index + 1}</p>
                                        <h2 className="mt-1 text-lg font-black text-gray-900 dark:text-white">{card.front_text || 'Kartu baru'}</h2>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => moveCard(index, -1)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Naik</button>
                                        <button type="button" onClick={() => moveCard(index, 1)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Turun</button>
                                        <button type="button" onClick={() => duplicateCard(index)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Duplikat</button>
                                        <button type="button" onClick={() => removeCard(index)} className="rounded-xl border border-red-100 px-3 py-2 text-xs font-black text-red-600 dark:border-red-900/40">Hapus</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Depan Kartu</span>
                                        <input value={card.front_text || ''} onChange={(event) => updateCard(index, 'front_text', event.target.value)} placeholder="Kata Jepang" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reading</span>
                                        <input value={card.reading || ''} onChange={(event) => updateCard(index, 'reading', event.target.value)} placeholder="Reading / kana" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Belakang Kartu</span>
                                        <input value={card.back_text || ''} onChange={(event) => updateCard(index, 'back_text', event.target.value)} placeholder="Arti" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hint / Kategori</span>
                                        <input value={card.hint || ''} onChange={(event) => updateCard(index, 'hint', event.target.value)} placeholder="Kategori / hint" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contoh Kalimat</span>
                                        <textarea value={card.example_sentence || ''} onChange={(event) => updateCard(index, 'example_sentence', event.target.value)} placeholder="Contoh kalimat" className="min-h-20 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Arti Contoh</span>
                                        <textarea value={card.example_meaning || ''} onChange={(event) => updateCard(index, 'example_meaning', event.target.value)} placeholder="Arti contoh kalimat" className="min-h-20 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    </label>
                                    <input value={card.audio_url || ''} onChange={(event) => updateCard(index, 'audio_url', event.target.value)} placeholder="Audio URL opsional" className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white md:col-span-2" />
                                </div>
                            </Card>
                        ))}
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                        <Card>
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Vocabulary Bank</h2>
                            <form onSubmit={submitFilters} className="mt-4 space-y-3">
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kosakata..." className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="all">Semua</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <button className="h-11 rounded-xl bg-gray-900 px-4 text-sm font-black text-white dark:bg-white dark:text-gray-900">Cari</button>
                                </div>
                            </form>

                            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                                {rows.map((item) => (
                                    <button key={item.id} type="button" onClick={() => addVocabulary(item)} className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-teal-700 dark:hover:bg-teal-950/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">{item.word}</p>
                                                <p className="text-xs font-bold text-gray-500">{item.reading || '-'}</p>
                                            </div>
                                            <span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-black text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">Tambah</span>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{item.meaning_id || item.meaning_en || 'Belum ada arti'}</p>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Generate Quiz</h2>
                            <form onSubmit={generateQuiz} className="mt-4 space-y-3">
                                <select value={generateForm.data.quiz_id} onChange={(event) => generateForm.setData('quiz_id', event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="">Pilih kuis tujuan</option>
                                    {quizzes.map((quiz) => (
                                        <option key={quiz.id} value={quiz.id}>#{quiz.id} {quiz.module ? `Week ${quiz.module.week_number || '-'} - ${quiz.module.title}` : (quiz.type || 'Quiz')}</option>
                                    ))}
                                </select>
                                <select value={generateForm.data.mode} onChange={(event) => generateForm.setData('mode', event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="word_to_meaning">Kata ke arti</option>
                                    <option value="meaning_to_word">Arti ke kata</option>
                                    <option value="reading_to_word">Reading ke kata</option>
                                </select>
                                <input type="number" min="1" max="50" value={generateForm.data.count} onChange={(event) => generateForm.setData('count', event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                {generateForm.errors.generate && <p className="text-xs font-bold text-red-600">{generateForm.errors.generate}</p>}
                                <button disabled={generateForm.processing} className="h-11 w-full rounded-xl bg-orange-600 px-4 text-sm font-black text-white disabled:opacity-50">
                                    {generateForm.processing ? 'Membuat...' : 'Generate Soal'}
                                </button>
                            </form>
                        </Card>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
