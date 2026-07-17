import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import TranslateIcon from '@mui/icons-material/Translate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const typeLabels = {
    kosakata: 'Kosakata',
    kanji: 'Kanji',
    bunpo: 'Bunpo',
};

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (index) => ({ opacity: 1, y: 0, transition: { delay: index * 0.035, duration: 0.28, ease: 'easeOut' } }),
};

export default function KosakataPage({ program = {}, vocabulary = {}, filters = {}, categories = [], modules = [], selected_module_id = null }) {
    const rows = vocabulary.data || [];
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [jlptLevel, setJlptLevel] = useState(filters.jlpt_level || 'all');
    const [contentType, setContentType] = useState(filters.content_type || 'all');
    const [moduleFilter, setModuleFilter] = useState(selected_module_id || filters.module || 'all');

    const stats = useMemo(() => ({
        total: vocabulary.total ?? rows.length,
        categories: categories.length,
        shown: rows.length,
    }), [categories.length, rows.length, vocabulary.total]);

    const submitFilters = (event) => {
        event.preventDefault();
        router.get(route('user.modul.program.kosakata', program.slug), {
            search,
            category,
            jlpt_level: jlptLevel,
            content_type: contentType,
            module: moduleFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`Konten N3 ${program.title || 'Kelas'} - Japanlingo`} />

            <div className="relative min-h-screen overflow-hidden bg-[#f5eadb] text-slate-900 dark:bg-gray-950 dark:text-white">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(16,185,129,0.14)_0%,transparent_32%),linear-gradient(230deg,rgba(245,158,11,0.14)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(120,53,15,0.045)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(120,53,15,0.035)_0_1px,transparent_1px_78px)] dark:bg-[linear-gradient(140deg,rgba(16,185,129,0.10)_0%,transparent_32%),linear-gradient(230deg,rgba(245,158,11,0.10)_0%,transparent_34%)]" />
                <div className="pointer-events-none absolute left-8 top-32 hidden text-[11rem] font-black leading-none text-emerald-900/[0.055] dark:text-white/[0.035] lg:block">語</div>
                <div className="pointer-events-none absolute right-8 top-[620px] hidden text-[11rem] font-black leading-none text-amber-900/[0.05] dark:text-white/[0.03] lg:block">彙</div>

                <main className="relative z-10 mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
                    <section className={`relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${theme.ctaBg} px-5 py-8 text-white shadow-2xl shadow-slate-900/10 sm:px-8`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16px_16px,rgba(255,255,255,0.24)_2px,transparent_3px)] bg-[length:30px_30px]" />
                        <div className="absolute -right-12 -top-12 hidden h-52 w-52 rounded-full bg-white/18 lg:block" />
                        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
                            <div>
                                <Link href={program.roadmap_url || route('user.kelas.index')} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/85 backdrop-blur transition hover:bg-white/20">
                                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                                    Kembali ke Roadmap
                                </Link>
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/75">Bank Konten N3 Kelas</p>
                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{program.title || 'Konten JLPT'}</h1>
                                <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-white/85">
                                    Kosakata, kanji, dan bunpo ini tersambung dari input admin, lalu dipakai lagi oleh flashcard dan kuis pada roadmap kelas.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="min-w-0 rounded-2xl bg-white/15 px-2 py-3 backdrop-blur sm:px-4 sm:py-4">
                                    <p className="text-2xl font-black sm:text-3xl">{stats.total}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-white/70 sm:text-xs sm:tracking-wider">Konten</p>
                                </div>
                                <div className="min-w-0 rounded-2xl bg-white/15 px-2 py-3 backdrop-blur sm:px-4 sm:py-4">
                                    <p className="text-2xl font-black sm:text-3xl">{stats.categories}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-white/70 sm:text-xs sm:tracking-wider">Kategori</p>
                                </div>
                                <div className="min-w-0 rounded-2xl bg-white/15 px-2 py-3 backdrop-blur sm:px-4 sm:py-4">
                                    <p className="text-2xl font-black sm:text-3xl">{stats.shown}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-white/70 sm:text-xs sm:tracking-wider">Tampil</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <form onSubmit={submitFilters} className="grid gap-3 rounded-[1.4rem] border border-white/75 bg-white/75 p-4 shadow-xl shadow-amber-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/75 xl:grid-cols-[1fr_170px_190px_180px_160px_auto]">
                        <label className="flex h-12 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-950">
                            <SearchIcon sx={{ fontSize: 20 }} className="text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full border-0 bg-transparent text-sm font-bold outline-none focus:ring-0 dark:text-white"
                                placeholder="Cari kata, reading, arti..."
                            />
                        </label>
                        <select value={contentType} onChange={(event) => setContentType(event.target.value)} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Tipe</option>
                            <option value="kosakata">Kosakata</option>
                            <option value="kanji">Kanji</option>
                            <option value="bunpo">Bunpo</option>
                        </select>
                        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Kategori</option>
                            {categories.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua Week</option>
                            {modules.map((module) => (
                                <option key={module.id} value={module.id}>Week {module.week_number ?? '-'} - {module.title}</option>
                            ))}
                        </select>
                        <select value={jlptLevel} onChange={(event) => setJlptLevel(event.target.value)} className="h-12 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                            <option value="all">Semua JLPT</option>
                            <option value="N3">N3</option>
                            <option value="N4">N4</option>
                            <option value="N5">N5</option>
                        </select>
                        <button className={`h-12 rounded-2xl bg-gradient-to-r ${theme.ctaBg} px-6 text-sm font-black text-white shadow-sm`}>
                            Filter
                        </button>
                    </form>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map((item, index) => (
                            <motion.article
                                key={item.id}
                                custom={index}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                className="group overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/82 shadow-xl shadow-slate-900/5 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 dark:border-gray-800 dark:bg-gray-900/82"
                            >
                                <div className="relative overflow-hidden p-5">
                                    <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${theme.ctaBg} opacity-20`} />
                                    <div className="relative flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{item.jlpt_level || 'N3'}</span>
                                                <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{typeLabels[item.content_type || 'kosakata'] || 'Konten'}</span>
                                                {item.category && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                        <CategoryIcon sx={{ fontSize: 12 }} />
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className={`mt-4 break-words text-3xl font-black sm:text-4xl ${theme.heroAccent}`}>{item.word}</h2>
                                            <p className="mt-1 break-words text-sm font-bold text-gray-500 sm:text-base dark:text-gray-400">{item.reading || '-'}</p>
                                        </div>
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.ctaBg} text-white shadow-sm`}>
                                            <TranslateIcon />
                                        </div>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                                        <p className="text-xs font-black uppercase tracking-wider text-gray-400">Arti</p>
                                        <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">{item.meaning_id || item.meaning_en || 'Belum ada arti'}</p>
                                    </div>

                                    {(item.example_sentence || item.example_meaning) && (
                                        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800/60">
                                            <p className="text-sm font-bold leading-6 text-gray-800 dark:text-gray-100">{item.example_sentence || '-'}</p>
                                            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.example_meaning || item.example_reading || ''}</p>
                                        </div>
                                    )}

                                    {item.audio_url && (
                                        <a href={item.audio_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                            <VolumeUpIcon sx={{ fontSize: 16 }} />
                                            Dengarkan audio
                                        </a>
                                    )}
                                </div>
                            </motion.article>
                        ))}
                    </section>

                    {rows.length === 0 && (
                        <section className="rounded-[1.8rem] border border-dashed border-white/80 bg-white/65 px-6 py-16 text-center shadow-xl shadow-amber-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/65">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.ctaBg} text-white shadow-lg`}>
                                <TranslateIcon sx={{ fontSize: 36 }} />
                            </div>
                            <h2 className="mt-5 text-xl font-black">Konten N3 belum tersedia</h2>
                            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-500 dark:text-gray-400">
                                Admin perlu publish konten N3 dan menghubungkannya ke modul kelas ini agar tampil di halaman user.
                            </p>
                        </section>
                    )}

                    {vocabulary.links && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {vocabulary.links.map((link, index) => (
                                <Link key={`${link.label}-${index}`} href={link.url || '#'} preserveScroll className={`rounded-xl px-3 py-2 text-xs font-black shadow-sm ${link.active ? `bg-gradient-to-r ${theme.ctaBg} text-white` : 'bg-white/80 text-gray-600 dark:bg-gray-900/80 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
