import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';
import LeagueIcon, { LEAGUE_ICON_OPTIONS, resolveLeagueIconKey } from '@/Components/Gamification/LeagueIcon';

import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';

const defaultSettings = {
    quiz_xp: {
        perfect: 50,
        score_80: 35,
        score_60: 20,
        participation: 10,
    },
    streak: {
        enabled: true,
        milestones: [
            { days: 7, xp: 50 },
            { days: 30, xp: 200 },
            { days: 100, xp: 1000 },
        ],
    },
    leagues: [
        { name: 'Bronze', min_xp: 0, icon: 'bronze_kabuto' },
        { name: 'Silver', min_xp: 500, icon: 'silver_shuriken' },
        { name: 'Gold', min_xp: 2000, icon: 'gold_sakura' },
        { name: 'Diamond', min_xp: 5000, icon: 'diamond_torii' },
        { name: 'Amethyst', min_xp: 12000, icon: 'amethyst_scroll' },
    ],
};

function NumberField({ label, value, onChange, helper, min = 0, max = 100000 }) {
    return (
        <label className="block">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</span>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-900 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:ring-red-900/30"
            />
            {helper && <span className="mt-1 block text-xs font-semibold text-gray-400">{helper}</span>}
        </label>
    );
}

export default function Gamification({
    stats = [],
    leaderboard = [],
    settings = defaultSettings,
}) {
    const initialSettings = {
        quiz_xp: {
            ...defaultSettings.quiz_xp,
            ...(settings.quiz_xp || {}),
        },
        streak: {
            ...defaultSettings.streak,
            ...(settings.streak || {}),
            milestones: settings.streak?.milestones?.length ? settings.streak.milestones : defaultSettings.streak.milestones,
        },
        leagues: (settings.leagues?.length ? settings.leagues : defaultSettings.leagues).map((league) => ({
            ...league,
            icon: resolveLeagueIconKey(league.icon),
        })),
    };

    const { data, setData, put, processing, errors } = useForm(initialSettings);
    const { confirmState, openConfirm, closeConfirm, setConfirmProcessing } = useConfirmAction();

    const updateQuizXp = (key, value) => {
        setData('quiz_xp', {
            ...data.quiz_xp,
            [key]: Math.max(0, value || 0),
        });
    };

    const updateMilestone = (index, key, value) => {
        const milestones = [...data.streak.milestones];
        milestones[index] = {
            ...milestones[index],
            [key]: Math.max(key === 'days' ? 1 : 0, value || 0),
        };
        setData('streak', { ...data.streak, milestones });
    };

    const addMilestone = () => {
        setData('streak', {
            ...data.streak,
            milestones: [...data.streak.milestones, { days: 1, xp: 0 }],
        });
    };

    const removeMilestone = (index) => {
        setData('streak', {
            ...data.streak,
            milestones: data.streak.milestones.filter((_, itemIndex) => itemIndex !== index),
        });
    };

    const updateLeague = (index, key, value) => {
        const leagues = [...data.leagues];
        leagues[index] = {
            ...leagues[index],
            [key]: key === 'min_xp' ? Math.max(0, Number(value) || 0) : value,
        };
        setData('leagues', leagues);
    };

    const addLeague = () => {
        const lastLeague = data.leagues[data.leagues.length - 1];
        setData('leagues', [
            ...data.leagues,
            {
                name: 'Liga Baru',
                min_xp: (Number(lastLeague?.min_xp) || 0) + 1000,
                icon: 'bronze_kabuto',
            },
        ]);
    };

    const removeLeague = (index) => {
        setData('leagues', data.leagues.filter((_, itemIndex) => itemIndex !== index));
    };

    const saveSettings = (event) => {
        event.preventDefault();
        put(route('superadmin.gamification.settings.update'), {
            preserveScroll: true,
        });
    };

    const confirmRecalculate = () => {
        openConfirm({
            variant: 'warning',
            title: 'Evaluasi ulang pencapaian?',
            message: 'Sistem akan mengecek seluruh user dan membuka lencana yang memenuhi syarat. Reward achievement hanya diberikan untuk lencana yang belum pernah terbuka.',
            details: [
                'Aman untuk XP kuis dan streak yang sudah tercatat.',
                'Tidak menghapus progress lama.',
            ],
            confirmLabel: 'Jalankan',
            onConfirm: () => {
                setConfirmProcessing(true);
                router.post(route('superadmin.gamification.achievements.recalculate'), {}, {
                    preserveScroll: true,
                    onFinish: () => {
                        setConfirmProcessing(false);
                        closeConfirm();
                    },
                });
            },
        });
    };

    const ruleValues = [
        `100% = ${data.quiz_xp.perfect} XP`,
        `80%+ = ${data.quiz_xp.score_80} XP`,
        `60%+ = ${data.quiz_xp.score_60} XP`,
        `Di bawah 60% = ${data.quiz_xp.participation} XP jika ada jawaban benar`,
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Gamification Control" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                                <SettingsIcon sx={{ fontSize: 25 }} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                                <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Gamification Control Center</h1>
                                <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Atur angka XP global, bonus streak, dan evaluasi achievement tanpa mengubah alur kuis yang sudah berjalan.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={confirmRecalculate}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                            <RestartAltIcon sx={{ fontSize: 18 }} />
                            Evaluasi Achievement
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                    {stats.length === 0 && (
                        <Card className="sm:col-span-2 xl:col-span-4">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Belum ada statistik gamifikasi.</p>
                        </Card>
                    )}
                </div>

                <form onSubmit={saveSettings} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
                                    <BoltIcon sx={{ fontSize: 20 }} />
                                    XP Kuis
                                </h2>
                                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Angka ini dipakai saat user menyelesaikan kuis. Logic benar/salah, nyawa, timer, dan repetisi tidak berubah.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <NumberField label="Skor 100%" value={data.quiz_xp.perfect} onChange={(value) => updateQuizXp('perfect', value)} helper="Reward tertinggi untuk jawaban sempurna." max={10000} />
                            <NumberField label="Skor 80%+" value={data.quiz_xp.score_80} onChange={(value) => updateQuizXp('score_80', value)} helper="Reward untuk hasil sangat baik." max={10000} />
                            <NumberField label="Skor 60%+" value={data.quiz_xp.score_60} onChange={(value) => updateQuizXp('score_60', value)} helper="Reward untuk hasil lulus minimum." max={10000} />
                            <NumberField label="Partisipasi" value={data.quiz_xp.participation} onChange={(value) => updateQuizXp('participation', value)} helper="Dipakai jika ada jawaban benar tapi belum 60%." max={10000} />
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                                Periksa lagi input konfigurasi gamifikasi.
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
                            <LocalFireDepartmentIcon sx={{ fontSize: 20 }} />
                            Streak Bonus
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Bonus tambahan saat user mencapai hari streak tertentu.
                        </p>

                        <label className="mt-5 flex items-center justify-between rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                            <span>
                                <span className="block text-sm font-black text-gray-900 dark:text-white">Aktifkan bonus streak</span>
                                <span className="mt-1 block text-xs font-semibold text-gray-400">Jika mati, streak tetap tercatat tapi tanpa bonus XP.</span>
                            </span>
                            <input
                                type="checkbox"
                                checked={Boolean(data.streak.enabled)}
                                onChange={(event) => setData('streak', { ...data.streak, enabled: event.target.checked })}
                                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                        </label>

                        <div className="mt-4 space-y-3">
                            {data.streak.milestones.map((milestone, index) => (
                                <div key={`${milestone.days}-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                                    <NumberField label="Hari" value={milestone.days} onChange={(value) => updateMilestone(index, 'days', value)} min={1} max={3650} />
                                    <NumberField label="XP" value={milestone.xp} onChange={(value) => updateMilestone(index, 'xp', value)} max={100000} />
                                    <button
                                        type="button"
                                        onClick={() => removeMilestone(index)}
                                        disabled={data.streak.milestones.length <= 1}
                                        className="mb-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addMilestone}
                            className="mt-4 rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-black text-gray-600 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-300"
                        >
                            Tambah Milestone
                        </button>
                    </Card>

                    <Card>
                        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
                            <EmojiEventsIcon sx={{ fontSize: 20 }} />
                            Perjalanan Liga
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Threshold XP ini dipakai di profile user untuk menentukan liga saat ini dan progres menuju liga berikutnya.
                        </p>

                        <div className="mt-5 space-y-3">
                            {data.leagues.map((league, index) => (
                                <div key={`${league.name}-${index}`} className="grid grid-cols-[88px_1fr_160px_120px_auto] items-end gap-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg shadow-red-500/20">
                                        <LeagueIcon iconKey={league.icon} className="h-6 w-6" />
                                    </div>
                                    <label className="block">
                                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Nama Liga</span>
                                        <input
                                            value={league.name || ''}
                                            onChange={(event) => updateLeague(index, 'name', event.target.value)}
                                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black text-gray-900 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:ring-red-900/30"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Icon</span>
                                        <select
                                            value={league.icon || 'bronze_kabuto'}
                                            onChange={(event) => updateLeague(index, 'icon', event.target.value)}
                                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm font-black text-gray-900 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:ring-red-900/30"
                                        >
                                            {LEAGUE_ICON_OPTIONS.map((option) => (
                                                <option key={option.key} value={option.key}>{option.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <NumberField label="Minimal XP" value={league.min_xp} onChange={(value) => updateLeague(index, 'min_xp', value)} max={10000000} />
                                    <button
                                        type="button"
                                        onClick={() => removeLeague(index)}
                                        disabled={data.leagues.length <= 1}
                                        className="mb-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addLeague}
                            className="mt-4 rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm font-black text-gray-600 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-300"
                        >
                            Tambah Liga
                        </button>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Top Learners</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Diambil dari XP user aktif.</p>
                        <div className="mt-5 space-y-3">
                            {leaderboard.map((item) => (
                                <div key={item.rank} className="flex items-center justify-between rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 font-black text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                            {item.rank}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.streak}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">{item.xp}</span>
                                </div>
                            ))}
                            {leaderboard.length === 0 && (
                                <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm font-bold text-gray-400 dark:border-gray-800">
                                    Belum ada leaderboard user.
                                </p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
                            <EmojiEventsIcon sx={{ fontSize: 20 }} />
                            Aturan Aktif
                        </h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Ringkasan config yang akan dipakai backend setelah disimpan.
                        </p>

                        <div className="mt-5 space-y-4">
                            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">XP Kuis</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {ruleValues.map((value) => (
                                        <span key={value} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            {value}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">Streak</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {data.streak.enabled ? 'Bonus aktif' : 'Bonus nonaktif'}
                                    </span>
                                    {data.streak.milestones.map((milestone, index) => (
                                        <span key={`${milestone.days}-${index}-summary`} className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                            {milestone.days} hari = {milestone.xp} XP
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">Liga</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[...data.leagues]
                                        .sort((a, b) => Number(a.min_xp || 0) - Number(b.min_xp || 0))
                                        .map((league, index) => (
                                            <span key={`${league.name}-${index}-summary`} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                <LeagueIcon iconKey={league.icon} className="h-3.5 w-3.5" />
                                                {league.name}: {Number(league.min_xp || 0).toLocaleString()} XP
                                            </span>
                                        ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50"
                            >
                                <SaveIcon sx={{ fontSize: 18 }} />
                                {processing ? 'Menyimpan...' : 'Simpan Config Global'}
                            </button>
                        </div>
                    </Card>
                </form>
            </div>

            <ConfirmActionDialog
                {...confirmState}
                onCancel={closeConfirm}
            />
        </AuthenticatedLayout>
    );
}
