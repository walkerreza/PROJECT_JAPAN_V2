import React, { useEffect, useMemo, useState } from 'react';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StrokeCharacterPreview from './StrokeCharacterPreview';
import { resolveAvailableCharacters, writingCharacters } from './strokeData';

export default function HandwritingFlashcardWorkspace({
    sets = [],
    module,
    day,
}) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const cards = useMemo(
        () => sets.flatMap((set) => (set.flashcards || []).map((card) => ({
            ...card,
            set_title: set.title,
        }))),
        [sets],
    );

    useEffect(() => {
        let active = true;

        if (cards.length === 0) {
            setItems([]);
            setLoading(false);
            return undefined;
        }

        setLoading(true);
        setError('');

        Promise.all(cards.map(async (card) => {
            const expected = writingCharacters(card.front_text, card.reading);
            const available = await resolveAvailableCharacters(card.front_text, card.reading);
            const availableSet = new Set(available.map((item) => item.character));

            return {
                ...card,
                writing_characters: available,
                missing_characters: expected.filter((character) => !availableSet.has(character)),
            };
        })).then((resolved) => {
            if (active) setItems(resolved);
        }).catch(() => {
            if (active) {
                setError('Manifest urutan stroke tidak dapat dimuat. Pastikan aset handwriting tersedia.');
            }
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [cards]);

    const filteredItems = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase();
        if (!keyword) return items;

        return items.filter((item) => [
            item.front_text,
            item.reading,
            item.back_text,
            item.set_title,
        ].some((value) => String(value || '').toLocaleLowerCase().includes(keyword)));
    }, [items, search]);
    const readyCards = items.filter((item) => item.writing_characters.length > 0).length;
    const readyCharacters = items.reduce(
        (total, item) => total + item.writing_characters.length,
        0,
    );

    return (
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-5">
                <section className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm dark:border-orange-900/50 dark:bg-gray-900">
                    <div className="grid gap-5 bg-orange-50/70 p-5 dark:bg-orange-950/20 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
                                Minggu {module?.week_number || '-'} / Hari {day?.day_number || '-'}
                            </p>
                            <h2 className="mt-1 text-xl font-black text-gray-950 dark:text-white">
                                Handwriting dari Materi Repetisi
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
                                Karakter diambil otomatis dari flashcard Day ini. Admin cukup memperbaiki materi flashcard jika karakter atau bacaannya belum sesuai.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="min-w-28 rounded-xl border border-orange-100 bg-white px-4 py-3 text-center dark:border-orange-900/50 dark:bg-gray-900">
                                <p className="text-2xl font-black text-gray-950 dark:text-white">{readyCards}</p>
                                <p className="text-[10px] font-black uppercase text-gray-400">Kartu siap</p>
                            </div>
                            <div className="min-w-28 rounded-xl border border-orange-100 bg-white px-4 py-3 text-center dark:border-orange-900/50 dark:bg-gray-900">
                                <p className="text-2xl font-black text-gray-950 dark:text-white">{readyCharacters}</p>
                                <p className="text-[10px] font-black uppercase text-gray-400">Karakter</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-orange-100 p-4 dark:border-orange-900/40 sm:p-5">
                        <label className="relative block max-w-xl">
                            <SearchRoundedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" sx={{ fontSize: 19 }} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari flashcard, reading, atau arti"
                                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm font-semibold text-gray-900 outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />
                        </label>
                    </div>
                </section>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-sm font-bold text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                        Memeriksa aset urutan stroke...
                    </div>
                ) : cards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
                        <DrawOutlinedIcon sx={{ fontSize: 38 }} className="text-gray-300" />
                        <h3 className="mt-3 text-base font-black text-gray-800 dark:text-white">Materi repetisi belum diisi</h3>
                        <p className="mt-1 text-sm font-medium text-gray-500">Tambahkan flashcard terlebih dahulu. Karakter yang didukung akan langsung muncul di tab ini.</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center text-sm font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                        Tidak ada flashcard yang cocok dengan pencarian.
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {filteredItems.map((item) => {
                            const isReady = item.writing_characters.length > 0;

                            return (
                                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <div className="flex items-start gap-3">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            isReady
                                                ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-300'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300'
                                        }`}>
                                            {isReady
                                                ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 21 }} />
                                                : <ErrorOutlineRoundedIcon sx={{ fontSize: 21 }} />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-black uppercase tracking-wider text-gray-400">{item.set_title}</p>
                                            <h3 className="mt-1 break-words text-xl font-black text-gray-950 dark:text-white">
                                                {item.front_text}
                                                {item.reading && <span className="ml-2 text-sm text-gray-400">{item.reading}</span>}
                                            </h3>
                                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{item.back_text || 'Arti belum diisi'}</p>
                                        </div>
                                    </div>

                                    {isReady ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {item.writing_characters.map((character) => (
                                                <button
                                                    key={`${item.id}-${character.character}`}
                                                    type="button"
                                                    onClick={() => setPreview({
                                                        character: character.character,
                                                        title: `${item.front_text} - ${item.back_text || ''}`,
                                                    })}
                                                    className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-3 text-lg font-black text-orange-800 transition hover:border-orange-400 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200"
                                                    title={`Pratinjau stroke ${character.character}`}
                                                >
                                                    {character.character}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                            Tidak ada karakter Jepang dengan aset stroke yang tersedia pada kartu ini.
                                        </p>
                                    )}

                                    {item.missing_characters.length > 0 && (
                                        <p className="mt-3 text-xs font-semibold text-gray-400">
                                            Aset belum tersedia: {item.missing_characters.join(', ')}
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <StrokeCharacterPreview
                character={preview?.character}
                title={preview?.title}
                open={Boolean(preview)}
                onClose={() => setPreview(null)}
            />
        </main>
    );
}
