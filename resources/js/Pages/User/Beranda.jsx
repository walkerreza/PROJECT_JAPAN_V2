import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { HitodamaIcon, KabutoIcon, ScrollIcon } from '@/Components/JapaneseIcons';
import { MascotGuide } from '@/Components/User/UserVisuals';
import theme from '@/Components/theme/themes';
import MountFujiBg from '../../../Images/Mount-Fuji-New.jpg';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import StyleIcon from '@mui/icons-material/Style';
import TranslateIcon from '@mui/icons-material/Translate';

const firstModuleFromLevel = (level) => level?.modules?.[0] || null;

function StatBubble({ icon, label, value }) {
    return (
        <div className="flex min-h-11 items-center gap-2.5 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm transition-colors duration-300 sm:gap-3 sm:px-5 sm:py-3 dark:border-gray-800 dark:bg-gray-900/90">
            {icon}
            <div className="text-left leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-base font-black text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

function SectionHeader({ eyebrow, title, actionHref, actionLabel }) {
    return (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && (
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">
                        {eyebrow}
                    </p>
                )}
                <h2 className="text-xl font-black text-gray-900 dark:text-white md:text-2xl">{title}</h2>
            </div>
            {actionHref && (
                <Link href={actionHref} className="inline-flex min-h-11 items-center gap-1 text-sm font-black text-red-600 transition lg:hover:text-red-700 dark:text-red-400 lg:dark:hover:text-red-300">
                    {actionLabel}
                    <ArrowRightAltIcon sx={{ fontSize: 20 }} />
                </Link>
            )}
        </div>
    );
}

export default function BerandaUser({
    user = {},
    recentProgress = [],
    availableLevels = [],
    rewardHistory = [],
    news = [],
    activeSubscription = null,
    quickQuiz = null,
    lastCompletedQuiz = null,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const authUser = usePage().props.auth?.user || {};
    const accessStatus = authUser.access_status || user.access_status || {};
    const isPremium = user.subscription_status === 'premium' || accessStatus.is_premium;

    const filteredLevels = useMemo(() => {
        if (!searchQuery.trim()) return availableLevels;

        const query = searchQuery.toLowerCase();

        return availableLevels.filter((level) => {
            const matchLevel = level.level_name?.toLowerCase().includes(query);
            const matchModule = level.modules?.some((module) => (
                module.title?.toLowerCase().includes(query)
                || module.category?.toLowerCase().includes(query)
            ));

            return matchLevel || matchModule;
        });
    }, [availableLevels, searchQuery]);

    const activeLevel = availableLevels.find((level) => level.modules?.length > 0) || availableLevels[0] || null;
    const activeModule = firstModuleFromLevel(activeLevel);
    const totalModules = availableLevels.reduce((total, level) => total + Number(level.modules?.length || 0), 0);
    const recentActivities = recentProgress.length > 0 ? recentProgress.slice(0, 4) : rewardHistory.slice(0, 4);
    const quickQuizUrl = quickQuiz?.url || lastCompletedQuiz?.url || route('user.kelas.index');
    const quickQuizTitle = quickQuiz?.title || lastCompletedQuiz?.title || 'Masuk ke kelas aktif';

    const quickLinks = [
        { label: 'Kelas Saya', href: route('user.kelas.index'), icon: SchoolIcon },
        { label: 'PPT', href: route('user.kelas.index'), icon: SlideshowIcon },
        { label: 'Kosakata', href: route('user.kelas.index'), icon: TranslateIcon },
        { label: 'Flashcard', href: route('user.kelas.index'), icon: StyleIcon },
        { label: 'Kuis', href: quickQuizUrl, icon: QuizIcon },
    ];

    const resourceCards = [
        {
            category: 'ppt',
            title: 'PPT Kelas',
            desc: 'Buka materi presentasi yang dibagikan admin di dalam kelas.',
            href: route('user.kelas.index'),
            icon: SlideshowIcon,
            tone: 'from-red-500 to-rose-600',
        },
        {
            category: 'kosakata',
            title: 'Kosakata N3',
            desc: 'Review kosakata inti yang menjadi bahan flashcard dan kuis.',
            href: route('user.kelas.index'),
            icon: TranslateIcon,
            tone: 'from-emerald-500 to-teal-600',
        },
        {
            category: 'flashcard',
            title: 'Flashcard',
            desc: 'Latihan repetisi sebelum masuk ke kuis evaluasi.',
            href: route('user.kelas.index'),
            icon: StyleIcon,
            tone: 'from-amber-500 to-orange-600',
        },
        {
            category: 'kuis',
            title: 'Kuis Cepat',
            desc: 'Langsung masuk ke latihan kuis dan kumpulkan XP.',
            href: quickQuizUrl,
            icon: QuizIcon,
            tone: 'from-indigo-500 to-violet-600',
        },
    ];

    const searchSuggestions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const levelSuggestions = availableLevels.map((level) => ({
            type: 'Kelas',
            title: `JLPT ${level.level_name || 'N3'}`,
            subtitle: `${level.modules?.length || 0} modul tersedia`,
            href: route('user.kelas.index'),
            icon: SchoolIcon,
            searchText: `kelas jlpt ${level.level_name || ''} ${level.modules?.map((module) => module.title).join(' ') || ''}`,
        }));

        const moduleSuggestions = availableLevels.flatMap((level) => (
            (level.modules || []).map((module) => ({
                type: 'Modul',
                title: module.title || `Modul ${level.level_name || 'N3'}`,
                subtitle: module.category || `JLPT ${level.level_name || 'N3'}`,
                href: route('user.kelas.index'),
                icon: AutoStoriesIcon,
                searchText: `modul ${module.title || ''} ${module.category || ''} ${level.level_name || ''}`,
            }))
        ));

        const resourceSuggestions = resourceCards.map((item) => ({
            type: item.category === 'ppt' ? 'PPT' : item.category.charAt(0).toUpperCase() + item.category.slice(1),
            title: item.title,
            subtitle: item.desc,
            href: item.href,
            icon: item.icon,
            searchText: `${item.category} ${item.title} ${item.desc}`,
        }));

        const quizSuggestions = lastCompletedQuiz
            ? [{
                type: 'Kuis',
                title: quickQuizTitle,
                subtitle: quickQuiz ? 'Lanjutkan kuis aktif' : `Skor terakhir ${lastCompletedQuiz.score ?? 0}`,
                href: quickQuizUrl,
                icon: QuizIcon,
                searchText: `kuis quiz ${quickQuizTitle || ''}`,
            }]
            : [{
                type: 'Kuis',
                title: quickQuizTitle,
                subtitle: quickQuiz ? 'Lanjutkan kuis aktif' : 'Pilih kelas untuk membuka kuis mingguan',
                href: quickQuizUrl,
                icon: QuizIcon,
                searchText: 'kuis quiz latihan daftar soal',
            }];

        const suggestions = [
            ...levelSuggestions,
            ...moduleSuggestions,
            ...resourceSuggestions,
            ...quizSuggestions,
        ];

        if (!query) return suggestions.slice(0, 8);

        return suggestions
            .filter((item) => item.searchText.toLowerCase().includes(query))
            .slice(0, 8);
    }, [availableLevels, lastCompletedQuiz, quickQuiz, quickQuizTitle, quickQuizUrl, resourceCards, searchQuery]);

    const filteredResourceCards = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return resourceCards.filter((item) => (
            !query
            || item.category.toLowerCase().includes(query)
            || item.title.toLowerCase().includes(query)
            || item.desc.toLowerCase().includes(query)
        ));
    }, [resourceCards, searchQuery]);

    const handleSearch = (event) => {
        event.preventDefault();
    };

    return (
        <AuthenticatedLayout header={false}>
            <Head title="Beranda Utama" />

            <div className="relative min-h-screen w-full overflow-hidden bg-[#f6f0e8] pb-16 transition-colors duration-300 dark:bg-gray-950">
                <div className="pointer-events-none absolute inset-x-0 top-[360px] h-[620px] bg-[radial-gradient(circle_at_18%_20%,rgba(244,63,94,0.14),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(245,158,11,0.16),transparent_32%),linear-gradient(180deg,rgba(246,240,232,0)_0%,rgba(246,240,232,0.78)_22%,rgba(255,247,237,0.88)_52%,rgba(254,242,242,0.8)_100%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(244,63,94,0.12),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(245,158,11,0.10),transparent_32%),linear-gradient(180deg,rgba(3,7,18,0)_0%,rgba(3,7,18,0.58)_24%,rgba(17,24,39,0.88)_58%,rgba(3,7,18,1)_100%)]" />
                <div className="pointer-events-none absolute left-8 top-[560px] hidden text-[11rem] font-black leading-none text-red-900/[0.04] dark:text-white/[0.035] lg:block">学</div>
                <div className="pointer-events-none absolute right-10 top-[860px] hidden text-[10rem] font-black leading-none text-amber-900/[0.05] dark:text-white/[0.03] lg:block">語</div>

                <div
                    className="relative w-full overflow-hidden bg-cover bg-center pb-20 pt-12 sm:pb-24 sm:pt-16"
                    style={{ backgroundImage: `url(${MountFujiBg})` }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.54)_52%,rgba(246,240,232,0.92)_86%,#f6f0e8_100%)] transition-colors duration-300 dark:bg-[linear-gradient(180deg,rgba(3,7,18,0.20)_0%,rgba(3,7,18,0.55)_56%,rgba(3,7,18,0.92)_88%,#030712_100%)]" />
                    <div className="pointer-events-none absolute inset-x-0 -bottom-px h-40 bg-gradient-to-b from-transparent via-[#f6f0e8]/90 to-[#f6f0e8] dark:via-gray-950/90 dark:to-gray-950" />

                    <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-red-600 dark:text-red-300">
                            Learning Hub
                        </p>
                        <h1 className="mb-7 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-5xl">
                            Mau lanjut belajar apa hari ini?
                        </h1>

                        <form onSubmit={handleSearch} className="relative mb-4 w-full max-w-3xl">
                            <div className="relative rounded-full border border-white/70 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all dark:border-gray-800 dark:bg-gray-900">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400 dark:text-gray-500">
                                    <SearchIcon sx={{ fontSize: 24 }} />
                                </div>
                                <input
                                    type="text"
                                    role="combobox"
                                    aria-expanded={isSearchOpen}
                                    aria-controls="dashboard-search-suggestions"
                                    value={searchQuery}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onChange={(event) => {
                                        setSearchQuery(event.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Escape') setIsSearchOpen(false);
                                    }}
                                    className="h-14 w-full rounded-full border-0 bg-transparent py-4 pl-14 pr-24 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-red-100 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-red-900/50 md:text-base"
                                    placeholder="Cari kelas, modul, PPT, kosakata, flashcard, atau kuis..."
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setIsSearchOpen(true);
                                        }}
                                        className="absolute inset-y-0 right-14 my-auto h-8 rounded-full px-3 text-xs font-black text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                                    >
                                        Hapus
                                    </button>
                                )}
                                <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                                    <SearchIcon sx={{ fontSize: 22 }} />
                                </button>
                            </div>

                            {isSearchOpen && (
                                <div
                                    id="dashboard-search-suggestions"
                                    className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/96 p-2 text-left shadow-2xl shadow-red-950/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/96"
                                >
                                    <div className="max-h-80 overflow-y-auto">
                                        {searchSuggestions.length > 0 ? searchSuggestions.map((item, index) => {
                                            const Icon = item.icon;

                                            return (
                                                <Link
                                                    key={`${item.type}-${item.title}-${index}`}
                                                    href={item.href}
                                                    onMouseDown={() => setIsSearchOpen(false)}
                                                    className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                                >
                                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.ctaBg} text-white shadow-sm`}>
                                                        <Icon sx={{ fontSize: 22 }} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                                                                {item.type}
                                                            </span>
                                                            <p className="truncate text-sm font-black text-gray-900 dark:text-white">{item.title}</p>
                                                        </div>
                                                        <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                                                    </div>
                                                    <ArrowRightAltIcon sx={{ fontSize: 20 }} className="text-gray-300" />
                                                </Link>
                                            );
                                        }) : (
                                            <div className="rounded-2xl px-4 py-5 text-sm font-bold text-gray-500 dark:text-gray-400">
                                                Tidak ada saran yang cocok. Coba kata kunci lain.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="mb-7 flex max-w-3xl flex-wrap justify-center gap-2">
                            {quickLinks.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/88 px-4 py-2.5 text-xs font-black text-gray-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-red-600 dark:border-gray-800 dark:bg-gray-900/88 dark:text-gray-300 dark:hover:text-red-300"
                                    >
                                        <Icon sx={{ fontSize: 17 }} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            <StatBubble
                                label="Total XP"
                                value={user.xp || 0}
                                icon={(
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 font-black text-red-600 shadow-inner dark:bg-red-900/50 dark:text-red-400">
                                        Lv.{user.level || 1}
                                    </div>
                                )}
                            />
                            <StatBubble
                                label="Beruntun"
                                value={`${user.streak_count || 0} Hari`}
                                icon={<HitodamaIcon className="inline-block h-5 w-5 text-orange-500" />}
                            />
                            <StatBubble
                                label="Status Akses"
                                value={isPremium ? 'Premium' : 'Gratis'}
                                icon={(
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-inner ${isPremium ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {isPremium ? <KabutoIcon className="h-5 w-5 text-yellow-500" /> : <ScrollIcon className="h-5 w-5 text-gray-500" />}
                                    </div>
                                )}
                            />
                        </div>

                        {isPremium && activeSubscription && (
                            <div className="mt-5 rounded-full border border-yellow-200 bg-yellow-50 px-5 py-2 text-xs font-black text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
                                Premium aktif sampai {new Date(activeSubscription.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 mx-auto -mt-10 max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
                    <MascotGuide
                        tone="amber"
                        title="Sensei Daruma"
                        message="Fokus hari ini cukup satu langkah: pilih kelas aktif, review resource, lalu selesaikan kuis. Streak dan XP akan mengikuti."
                    />

                    <section className="overflow-hidden rounded-[1.5rem] border border-red-100/80 bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 p-1 shadow-2xl shadow-red-900/12 sm:rounded-[2rem] dark:border-red-900/50">
                        <div className="grid gap-5 rounded-[1.4rem] bg-white/92 p-4 backdrop-blur sm:gap-6 sm:rounded-[1.8rem] sm:p-7 dark:bg-gray-950/88 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
                                    <DashboardIcon sx={{ fontSize: 28 }} />
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
                                        Lanjutkan Belajar
                                    </p>
                                    <h2 className="text-xl font-black text-gray-900 sm:text-2xl dark:text-white">
                                        {activeModule ? activeModule.title : 'Masuk ke kelas aktifmu'}
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                        {activeModule
                                            ? `Lanjutkan roadmap ${activeLevel?.level_name || 'N3'} dari modul yang tersedia.`
                                            : 'Pilih kelas terlebih dahulu untuk membuka roadmap, PPT, kosakata, flashcard, dan kuis.'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black sm:mt-4">
                                        <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                            {totalModules} modul tersedia
                                        </span>
                                        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                            {availableLevels.length} kelas/level
                                        </span>
                                        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                            {isPremium ? 'Akses premium aktif' : 'Preview tersedia'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Link
                                    href={route('user.kelas.index')}
                                    className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${theme.ctaBg} px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-900/15 transition lg:hover:-translate-y-0.5 lg:hover:brightness-95`}
                                >
                                    Masuk Kelas
                                    <ArrowRightAltIcon sx={{ fontSize: 22 }} />
                                </Link>
                                <Link
                                    href={route('user.progress')}
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-6 py-3 text-sm font-black text-red-700 transition lg:hover:bg-red-50 dark:border-red-900/40 dark:bg-gray-950 dark:text-red-300 lg:dark:hover:bg-red-950/30"
                                >
                                    Lihat Progress
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-white/70 bg-white/55 p-4 shadow-xl shadow-red-900/5 backdrop-blur-md sm:rounded-[2rem] sm:p-7 dark:border-gray-800 dark:bg-gray-900/55">
                        <SectionHeader
                            eyebrow="Kelas Saya"
                            title="Pilih kelas dan masuk ke roadmap"
                            actionHref={route('user.kelas.index')}
                            actionLabel="Lihat semua kelas"
                        />

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                            {filteredLevels.map((level, index) => {
                                const module = firstModuleFromLevel(level);

                                return (
                                    <Link
                                        href={route('user.kelas.index')}
                                        key={`${level.level_name || 'level'}-${index}`}
                                        className="group flex min-h-[104px] items-center gap-3 rounded-2xl border border-red-100/80 bg-white/85 p-3 shadow-sm transition-all duration-300 sm:block sm:min-h-0 sm:rounded-[1.5rem] lg:hover:-translate-y-1 lg:hover:shadow-xl lg:hover:shadow-red-900/10 dark:border-gray-800 dark:bg-gray-950/80"
                                    >
                                        <div className="relative mb-0 h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-red-100/80 bg-gradient-to-br from-red-100 via-amber-50 to-white transition-all duration-300 sm:mb-4 sm:h-auto sm:w-full sm:rounded-2xl sm:aspect-[4/3] lg:group-hover:shadow-md dark:border-gray-800 dark:from-red-950/40 dark:via-gray-900 dark:to-gray-950">
                                            <div className="absolute -right-8 -top-8 hidden h-28 w-28 rounded-full bg-red-300/30 blur-2xl sm:block" />
                                            <div className="absolute -bottom-8 left-4 hidden h-24 w-24 rounded-full bg-amber-300/30 blur-2xl sm:block" />
                                            <div className="absolute bottom-3 left-3 text-5xl font-black text-red-900/10 dark:text-white/10">週</div>
                                            {level.is_premium && (
                                                <div className="absolute right-1.5 top-1.5 z-10 flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-1 text-[8px] font-black tracking-wider text-white shadow-md sm:right-3 sm:top-3 sm:gap-1.5 sm:px-3 sm:text-[10px] sm:tracking-widest">
                                                    <KabutoIcon className="h-3 w-3" /> PREMIUM
                                                </div>
                                            )}
                                            <div className="relative z-10 flex h-full flex-col items-center justify-center">
                                                <span className="text-xs font-bold tracking-wide text-gray-800 sm:text-lg sm:tracking-widest dark:text-gray-200">JLPT {level.level_name}</span>
                                                <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-widest text-red-500 sm:block">{level.modules?.length || 0} modul tersedia</span>
                                                <div className="mt-1 h-0.5 w-6 bg-red-500 sm:mt-2 sm:w-8" />
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors sm:mb-2 sm:text-base lg:group-hover:text-red-500 dark:text-white">
                                                {module?.title || `Kelas JLPT ${level.level_name || 'N3'}`}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                                                <span className="truncate">{module?.category || 'Roadmap mingguan'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                            {filteredLevels.length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada kelas yang sesuai dengan pencarian.</p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-white/70 bg-white/55 p-4 shadow-xl shadow-amber-900/5 backdrop-blur-md sm:rounded-[2rem] sm:p-7 dark:border-gray-800 dark:bg-gray-900/55">
                        <SectionHeader eyebrow="Resource Belajar" title="Buka materi pendukung kelas" />

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                            {filteredResourceCards.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        className="group flex min-h-[132px] flex-col rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm transition-all sm:min-h-0 sm:rounded-[1.5rem] sm:p-5 lg:hover:-translate-y-1 lg:hover:shadow-xl dark:border-gray-800 dark:bg-gray-950/80"
                                    >
                                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-lg sm:mb-4 sm:h-12 sm:w-12 sm:rounded-2xl`}>
                                            <Icon sx={{ fontSize: 22 }} className="sm:hidden" />
                                            <Icon sx={{ fontSize: 26 }} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 transition sm:text-base lg:group-hover:text-red-600 dark:text-white lg:dark:group-hover:text-red-300">{item.title}</h3>
                                        <p className="mt-2 hidden text-sm font-medium leading-6 text-gray-500 sm:block dark:text-gray-400">{item.desc}</p>
                                    </Link>
                                );
                            })}
                            {filteredResourceCards.length === 0 && (
                                <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-white/70 p-6 text-sm font-bold text-gray-500 dark:border-gray-800 dark:bg-gray-950/70 dark:text-gray-400 sm:col-span-2 lg:col-span-4">
                                    Tidak ada resource yang cocok dengan kategori dan kata kunci ini.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-[1.5rem] border border-red-100/80 bg-white/72 p-4 shadow-xl shadow-red-900/5 backdrop-blur-md sm:rounded-[2rem] sm:p-7 dark:border-gray-800 dark:bg-gray-900/72">
                        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
                                    <QuizIcon sx={{ fontSize: 28 }} />
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-400">
                                        Quick Quiz
                                    </p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                        {quickQuiz ? 'Lanjutkan kuis aktif' : (lastCompletedQuiz ? 'Ulang quiz terakhir' : 'Mulai dari kelas aktif')}
                                    </h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                        {quickQuiz
                                            ? quickQuiz.title
                                            : (lastCompletedQuiz
                                                ? lastCompletedQuiz.title
                                                : 'Belum ada kuis aktif yang terbuka. Masuk ke kelas untuk mengikuti roadmap mingguan.')}
                                    </p>
                                    {(quickQuiz || lastCompletedQuiz) && (
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                                            {lastCompletedQuiz && (
                                                <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                                    Skor terakhir {lastCompletedQuiz.score ?? 0}
                                                </span>
                                            )}
                                            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                                {quickQuiz ? 'Siap dikerjakan' : `+${lastCompletedQuiz.xp_earned ?? 0} XP`}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                                                {(quickQuiz?.questions_count ?? lastCompletedQuiz?.questions_count ?? 0)} soal
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Link
                                href={quickQuizUrl}
                                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-gray-900/15 transition-all sm:w-auto lg:hover:-translate-y-0.5 lg:hover:bg-red-700 dark:bg-white dark:text-gray-950 lg:dark:hover:bg-red-100"
                            >
                                {quickQuiz ? 'Mulai Kuis' : (lastCompletedQuiz ? 'Quick Quiz' : 'Masuk Kelas')}
                                <ArrowRightAltIcon sx={{ fontSize: 22 }} />
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-white/70 bg-white/55 p-4 shadow-xl shadow-red-900/5 backdrop-blur-md sm:rounded-[2rem] sm:p-7 dark:border-gray-800 dark:bg-gray-900/55">
                        <SectionHeader
                            eyebrow="Progress Mingguan"
                            title="Aktivitas belajar terbaru"
                            actionHref={route('user.progress')}
                            actionLabel="Detail progress"
                        />

                        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                            <div className="rounded-2xl border border-red-100/80 bg-white/85 p-4 sm:rounded-[1.5rem] sm:p-5 dark:border-gray-800 dark:bg-gray-950/80">
                                <div className="mb-3 flex items-center gap-3 sm:mb-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.ctaBg} text-white`}>
                                        <CheckCircleIcon />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Ringkasan</p>
                                        <p className="font-black text-gray-900 dark:text-white">Belajar minggu ini</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-xl bg-red-50 px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3 dark:bg-red-950/30">
                                        <p className="text-xl font-black text-red-600 dark:text-red-300">{user.xp || 0}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">XP</p>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3 dark:bg-amber-950/30">
                                        <p className="text-xl font-black text-amber-600 dark:text-amber-300">{user.streak_count || 0}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Streak</p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 px-2 py-2.5 sm:rounded-2xl sm:px-3 sm:py-3 dark:bg-emerald-950/30">
                                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-300">{rewardHistory.length}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Log</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-red-100/70 bg-white/85 sm:rounded-[1.5rem] dark:border-gray-800 dark:bg-gray-950/80">
                                {recentActivities.length > 0 ? (
                                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {recentActivities.map((activity, index) => (
                                            <div key={activity.id || index} className="flex items-center justify-between gap-3 px-4 py-3 transition sm:gap-4 sm:px-5 sm:py-4 lg:hover:bg-gray-50 lg:dark:hover:bg-gray-900">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                                                        {activity.source_type === 'quiz' ? <QuizIcon sx={{ fontSize: 18 }} /> : <AutoStoriesIcon sx={{ fontSize: 18 }} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{activity.description || activity.title || activity.source_type || 'Aktivitas belajar'}</p>
                                                        <p className="text-[11px] font-medium text-gray-400">
                                                            {activity.created_at
                                                                ? new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                                : 'Baru saja'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {activity.xp_amount !== undefined && (
                                                    <span className="shrink-0 rounded-lg bg-green-50 px-2 py-1 text-xs font-black text-green-600 sm:px-3 sm:text-sm dark:bg-green-900/30 dark:text-green-300">
                                                        +{activity.xp_amount} XP
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Belum ada aktivitas terbaru. Mulai dari kelas aktif untuk mengisi progress.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-white/70 bg-white/45 p-4 shadow-xl shadow-amber-900/5 backdrop-blur-md sm:rounded-[2rem] sm:p-7 dark:border-gray-800 dark:bg-gray-900/45">
                        <SectionHeader
                            eyebrow="Update"
                            title="Berita Terkini Jepang"
                            actionHref={route('user.news.index')}
                            actionLabel="Lihat semua berita"
                        />

                        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 touch-pan-x md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 lg:gap-8">
                            {news && news.length > 0 ? news.map((item, index) => (
                                <Link
                                    href={route('user.news.show', item.slug || item.id)}
                                    key={item.id || index}
                                    className="group flex h-full w-[78vw] max-w-[19rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-amber-100/80 bg-white/90 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 sm:rounded-3xl md:w-auto md:max-w-none md:shrink lg:hover:shadow-[0_12px_36px_-16px_rgba(120,53,15,0.28)] dark:border-gray-800 dark:bg-gray-950/90 dark:shadow-none lg:dark:hover:border-gray-700"
                                >
                                    <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        {item.thumbnail_url || item.cover_url ? (
                                            <img src={item.thumbnail_url || item.cover_url} alt={item.cover_image_alt || item.title} className="h-full w-full object-cover transition-transform duration-500 lg:group-hover:scale-105" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 text-3xl font-black text-red-200 dark:from-gray-800 dark:to-gray-900 dark:text-gray-700">
                                                JP
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-grow flex-col p-4 sm:p-6">
                                        {item.is_pinned && (
                                            <div className="mb-3">
                                                <span className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                    PIN Disematkan
                                                </span>
                                            </div>
                                        )}
                                        <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                            <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700 dark:bg-red-900/20 dark:text-red-300">{item.category?.replaceAll('-', ' ') || 'platform'}</span>
                                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                                            {item.published_at
                                                ? new Date(item.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : 'Japanlingo News'}
                                        </div>
                                        <h3 className="mb-2 text-lg font-extrabold leading-snug text-gray-900 transition-colors sm:mb-3 lg:group-hover:text-red-600 dark:text-white lg:dark:group-hover:text-red-400">
                                            {item.title}
                                        </h3>
                                        <p className="mb-4 line-clamp-2 flex-grow text-sm leading-relaxed text-gray-500 sm:mb-6 sm:line-clamp-3 dark:text-gray-400">
                                            {item.excerpt || (item.body ? `${item.body.replace(/<[^>]*>/g, '').substring(0, 100)}...` : 'Baca update terbaru dari Japanlingo.')}
                                        </p>
                                        <div className="mt-auto flex items-center gap-2 text-sm font-black text-red-600 dark:text-red-400">
                                            Baca selengkapnya
                                            <ArrowRightAltIcon sx={{ fontSize: 20 }} />
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <p className="w-full text-sm text-gray-500 md:col-span-2 lg:col-span-3 dark:text-gray-400">Belum ada berita terbaru.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
