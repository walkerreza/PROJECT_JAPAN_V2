import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import theme from '@/Components/theme/themes';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import GroupsIcon from '@mui/icons-material/Groups';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.04, duration: 0.32, ease: 'easeOut' },
    }),
};

const statusOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'active', label: 'Aktif' },
    { value: 'waiting', label: 'Menunggu kloter' },
    { value: 'preview', label: 'Preview' },
    { value: 'locked', label: 'Perlu akses' },
];

const accessMeta = (item) => {
    if (item.waiting_for_kloter) {
        return {
            key: 'waiting',
            label: 'Menunggu kloter',
            badge: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-900/40',
            icon: HourglassTopIcon,
        };
    }

    if (item.has_class_access) {
        return {
            key: 'active',
            label: 'Aktif',
            badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-900/40',
            icon: CheckCircleIcon,
        };
    }

    if (item.payment_plan) {
        return {
            key: 'locked',
            label: 'Perlu akses',
            badge: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-900/25 dark:text-rose-300 dark:ring-rose-900/40',
            icon: LockIcon,
        };
    }

    return {
        key: 'preview',
        label: 'Preview',
        badge: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-900/40',
        icon: PlayArrowIcon,
    };
};

const clampProgress = (value) => Math.max(0, Math.min(100, Number(value ?? 0)));

const createCheckoutRequestKey = () => {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16);
        const value = character === 'x' ? random : ((random & 0x3) | 0x8);

        return value.toString(16);
    });
};

function EmptyThumbnail({ compact = false }) {
    return (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.ctaBg}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.28),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.18),transparent_28%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-white/16 px-4 py-3 text-center text-white backdrop-blur">
                    <SchoolIcon sx={{ fontSize: compact ? 34 : 46 }} />
                    <p className="mt-2 text-xs font-black uppercase tracking-wider">Thumbnail belum tersedia</p>
                </div>
            </div>
        </div>
    );
}

function KelasThumbnail({ item }) {
    const [imageFailed, setImageFailed] = useState(false);
    const thumbnailUrl = item.thumbnail_url && !imageFailed ? item.thumbnail_url : null;
    const meta = accessMeta(item);
    const StatusIcon = meta.icon;

    return (
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-200 dark:bg-gray-800">
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    loading="eager"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <EmptyThumbnail />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/86 via-slate-950/20 to-slate-950/5" />
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 shadow-sm backdrop-blur">
                    {item.type || item.level || 'Kelas JLPT N3'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ring-1 ${meta.badge}`}>
                    <StatusIcon sx={{ fontSize: 13 }} />
                    {meta.label}
                </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
                <h2 className="line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow-sm">
                    {item.title}
                </h2>
            </div>
        </div>
    );
}

function KelasCard({ item, index, onCheckout, checkoutPlanId }) {
    const meta = accessMeta(item);
    const canBuyClass = item.payment_plan && !item.has_class_access;
    const progress = clampProgress(item.progress);

    return (
        <motion.article
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="group flex min-h-[500px] flex-col overflow-hidden rounded-[1.35rem] border border-white bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-950/[0.04] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_70px_rgba(190,24,93,0.16)] dark:border-gray-800 dark:bg-gray-900 dark:ring-white/[0.06]"
        >
            <KelasThumbnail item={item} />

            <div className="flex flex-1 flex-col p-5">
                <div className="space-y-4">
                    <div className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-gray-300">
                        {item.instructor_name && (
                            <div className="flex items-center gap-2">
                                <GroupsIcon sx={{ fontSize: 18 }} className="text-slate-400" />
                                <span className="truncate">{item.instructor_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <MenuBookIcon sx={{ fontSize: 18 }} className="text-slate-400" />
                            <span>{item.lessons ?? 0} pelajaran</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            <span>{item.completed_lessons ?? 0}/{item.lessons ?? 0} selesai</span>
                            <span>-</span>
                            <span>{item.accessible_lessons ?? 0} terbuka</span>
                        </div>
                    </div>

                    {item.description && (
                        <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-500 dark:text-gray-400">
                            {item.description}
                        </p>
                    )}

                    {item.kloter && (
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 dark:border-emerald-900/35 dark:bg-emerald-900/20">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Kloter aktif</p>
                            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{item.kloter.nama}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-gray-400">
                                Week {item.kloter.minggu_aktif || 0} - mulai {item.kloter.tanggal_mulai_label || '-'}
                                {item.kloter.admin_name ? ` - ${item.kloter.admin_name}` : ''}
                            </p>
                        </div>
                    )}

                    {item.waiting_for_kloter && (
                        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-3.5 dark:border-sky-900/35 dark:bg-sky-900/20">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Menunggu kloter</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-gray-400">
                                Akses kelas sudah aktif. Superadmin dapat menempatkan akun ini ke kloter belajar.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-4 pt-5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-gray-800 dark:bg-gray-950/55">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-white shadow-inner dark:bg-gray-800">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, backgroundColor: theme.doneColor }}
                            />
                        </div>
                    </div>

                    {canBuyClass && (
                        <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 dark:border-rose-900/35 dark:from-rose-950/35 dark:to-gray-950">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500 dark:text-rose-300">Akses kelas</p>
                                    <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{item.payment_plan.price_formatted}</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm dark:bg-gray-900 dark:text-rose-300">
                                    <WorkspacePremiumIcon />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Link
                            href={item.href}
                            className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${theme.ctaBg} text-sm font-black text-white shadow-lg shadow-rose-950/10 transition hover:brightness-95`}
                        >
                            <PlayArrowIcon sx={{ fontSize: 18 }} />
                            {meta.key === 'locked' ? 'Lihat Preview' : 'Masuk Roadmap'}
                        </Link>

                        {canBuyClass && (
                            <button
                                type="button"
                                onClick={() => onCheckout(item.payment_plan)}
                                disabled={checkoutPlanId === item.payment_plan.id}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white text-sm font-black text-rose-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 dark:border-rose-900/40 dark:bg-gray-950 dark:text-rose-300 dark:hover:bg-rose-900/20"
                            >
                                {checkoutPlanId === item.payment_plan.id ? 'Membuka Midtrans...' : 'Buka Akses Premium'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

export default function KelasPage({ programs = [] }) {
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('all');
    const [checkoutPlanId, setCheckoutPlanId] = useState(null);
    const [checkoutError, setCheckoutError] = useState('');
    const kelasItems = programs;

    const filteredKelas = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();

        return kelasItems.filter((item) => {
            const title = (item.title ?? '').toLowerCase();
            const instructor = (item.instructor_name ?? '').toLowerCase();
            const matchesKeyword = !normalized || title.includes(normalized) || instructor.includes(normalized);
            const matchesStatus = status === 'all' || accessMeta(item).key === status;

            return matchesKeyword && matchesStatus;
        });
    }, [kelasItems, keyword, status]);

    const summary = useMemo(() => {
        return kelasItems.reduce((total, item) => {
            const meta = accessMeta(item);
            total.lessons += Number(item.lessons ?? 0);
            total.active += meta.key === 'active' ? 1 : 0;
            total.locked += meta.key === 'locked' ? 1 : 0;
            total.preview += meta.key === 'preview' ? 1 : 0;
            return total;
        }, { lessons: 0, active: 0, locked: 0, preview: 0 });
    }, [kelasItems]);

    const startCheckout = async (plan) => {
        setCheckoutError('');

        try {
            setCheckoutPlanId(plan.id);
            const storageKey = `midtrans:checkout-intent:${plan.id}`;
            const requestKey = window.sessionStorage?.getItem(storageKey) || createCheckoutRequestKey();
            window.sessionStorage?.setItem(storageKey, requestKey);
            const response = await window.axios.post(route('payments.midtrans.checkout'), {
                payment_plan_id: plan.id,
                checkout_request_key: requestKey,
            });
            const transactionCode = response.data?.transaction_code;

            if (!transactionCode) {
                throw new Error('Checkout tidak mengembalikan kode transaksi. Silakan coba lagi.');
            }

            window.sessionStorage?.removeItem(storageKey);

            window.sessionStorage?.setItem(
                `midtrans:${transactionCode}`,
                JSON.stringify({
                    snapToken: response.data.snap_token,
                    redirectUrl: response.data.redirect_url,
                }),
            );

            window.location.href = route('user.checkout', { transactionCode });
        } catch (error) {
            if (error.response?.status === 409) {
                window.sessionStorage?.removeItem(`midtrans:checkout-intent:${plan.id}`);
            }

            setCheckoutError(error.response?.data?.message || error.message || 'Gagal memulai pembayaran Midtrans.');
        } finally {
            setCheckoutPlanId(null);
        }
    };

    return (
        <AuthenticatedLayout header={false}>
            <Head title="Kelas - Japanlingo" />

            <div className="relative min-h-screen overflow-hidden bg-[#eef6f2] text-slate-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(16,185,129,0.14)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.09)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(6,95,70,0.045)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(6,95,70,0.035)_0_1px,transparent_1px_78px)] dark:bg-[linear-gradient(130deg,rgba(16,185,129,0.10)_0%,transparent_28%),linear-gradient(230deg,rgba(220,38,38,0.12)_0%,transparent_34%),repeating-linear-gradient(90deg,rgba(255,255,255,0.032)_0_1px,transparent_1px_78px),repeating-linear-gradient(0deg,rgba(255,255,255,0.026)_0_1px,transparent_1px_78px)]" />
                <div className="pointer-events-none absolute left-6 top-36 hidden text-[12rem] font-black leading-none text-emerald-900/[0.045] dark:text-white/[0.035] lg:block">学</div>
                <div className="pointer-events-none absolute right-8 top-[700px] hidden text-[12rem] font-black leading-none text-red-900/[0.04] dark:text-white/[0.03] lg:block">組</div>

                <main className="relative z-10 mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
                    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 px-5 py-5 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/62 sm:px-7">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none text-[130px] font-black leading-none text-rose-900 opacity-[0.035] transition-colors duration-300 dark:text-white dark:opacity-[0.04]"
                            style={{ fontFamily: 'serif' }}
                        >
                            学
                        </span>
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-red-500 to-amber-400" />
                        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(15,23,42,0.035)_0_1px,transparent_1px_18px)] dark:bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_18px)]" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_24px),linear-gradient(45deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_28px)]" />
                        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <div className="max-w-3xl">
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-rose-600 transition-colors duration-300 dark:text-rose-300">Kelas belajar</p>
                                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 transition-colors duration-300 dark:text-white sm:text-4xl">
                                    Pilih kelas N3 dan lanjutkan roadmap mingguan
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500 transition-colors duration-300 dark:text-gray-400">
                                    Setiap kelas menjadi pintu masuk ke roadmap berisi PPT, kosakata, flashcard, dan kuis yang saling terhubung.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                                <div className="min-w-0 rounded-2xl bg-white/75 px-2 py-2.5 text-slate-950 shadow-sm backdrop-blur transition-colors duration-300 sm:px-3 sm:py-3 dark:bg-gray-950/70 dark:text-white">
                                    <p className="text-xl font-black sm:text-2xl">{kelasItems.length}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-[11px] sm:tracking-wider dark:text-gray-400">Kelas</p>
                                </div>
                                <div className="min-w-0 rounded-2xl bg-white/75 px-2 py-2.5 text-slate-950 shadow-sm backdrop-blur transition-colors duration-300 sm:px-3 sm:py-3 dark:bg-gray-950/70 dark:text-white">
                                    <p className="text-xl font-black sm:text-2xl">{summary.lessons}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-[11px] sm:tracking-wider dark:text-gray-400">Pelajaran</p>
                                </div>
                                <div className="min-w-0 rounded-2xl bg-white/75 px-2 py-2.5 text-slate-950 shadow-sm backdrop-blur transition-colors duration-300 sm:px-3 sm:py-3 dark:bg-gray-950/70 dark:text-white">
                                    <p className="text-xl font-black sm:text-2xl">{summary.active}</p>
                                    <p className="break-words text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-[11px] sm:tracking-wider dark:text-gray-400">Aktif</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.5rem] border border-white/70 bg-white/72 p-4 shadow-2xl shadow-emerald-900/5 backdrop-blur-md transition-colors duration-300 dark:border-gray-800 dark:bg-gray-900/72">
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-rose-200 focus-within:bg-white dark:border-gray-800 dark:bg-gray-950/70 dark:focus-within:border-rose-900/60">
                                <SearchIcon sx={{ fontSize: 20 }} className="text-slate-400" />
                                <input
                                    value={keyword}
                                    onChange={(event) => setKeyword(event.target.value)}
                                    className="w-full border-0 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-gray-200"
                                    placeholder="Cari kelas atau pengajar"
                                />
                            </label>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400 lg:inline-flex">
                                    <FilterListIcon sx={{ fontSize: 16 }} />
                                    Filter
                                </span>
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setStatus(option.value)}
                                        className={`h-10 rounded-full px-4 text-sm font-black transition ${status === option.value
                                            ? `bg-gradient-to-r ${theme.ctaBg} text-white shadow-sm`
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {checkoutError && (
                        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
                            {checkoutError}
                        </p>
                    )}

                    {filteredKelas.length > 0 ? (
                        <section>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-950 dark:text-white">Daftar kelas</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-gray-400">
                                        {filteredKelas.length} dari {kelasItems.length} kelas tampil
                                    </p>
                                </div>
                                {summary.locked > 0 && (
                                    <span className="hidden rounded-full bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-600 sm:inline-flex dark:bg-rose-900/20 dark:text-rose-300">
                                        {summary.locked} perlu akses
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredKelas.map((item, index) => (
                                    <KelasCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onCheckout={startCheckout}
                                        checkoutPlanId={checkoutPlanId}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : (
                        <section className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white/85 px-6 py-16 text-center shadow-sm shadow-slate-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/75">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.ctaBg} text-white shadow-lg`}>
                                {keyword || status !== 'all' ? <SearchIcon sx={{ fontSize: 36 }} /> : <SchoolIcon sx={{ fontSize: 36 }} />}
                            </div>
                            <h2 className="mt-5 text-xl font-black">
                                {keyword || status !== 'all' ? 'Kelas tidak ditemukan' : 'Kelas belum tersedia'}
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-gray-400">
                                {keyword || status !== 'all'
                                    ? 'Coba ubah kata kunci atau filter status.'
                                    : 'Tambahkan program dan modul dari admin agar kelas tampil di sini.'}
                            </p>
                        </section>
                    )}

                    {summary.active > 0 && (
                        <section className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <CheckCircleIcon sx={{ fontSize: 20 }} />
                            <span>{summary.active} kelas sudah aktif di akun ini.</span>
                        </section>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
