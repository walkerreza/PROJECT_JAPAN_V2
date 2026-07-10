import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import StatCard from '@/Components/Features/Dashboard/StatCard';
import { DEFAULT_THEME, THEME_PRESETS } from '@/Components/theme/themes';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const defaultStats = [
    { title: 'Status App', value: 'Stabil', icon: '<CheckCircleIcon className="w-5 h-5 text-emerald-500 inline-block" />', change: '99.9%', changeType: 'up' },
    { title: 'Queue', value: '12 job', icon: '📬', change: '2', changeType: 'down' },
    { title: 'Cache Health', value: 'Normal', icon: '<PsychologyIcon className="w-5 h-5 inline-block text-purple-500" />', change: '0', changeType: 'up' },
    { title: 'Storage Usage', value: '68%', icon: '💾', change: '4%', changeType: 'up' },
];

export default function System({
    stats = defaultStats,
    themeSettings = { activeTheme: DEFAULT_THEME, customTheme: {} },
}) {
    const [selectedTheme, setSelectedTheme] = useState(themeSettings.activeTheme || DEFAULT_THEME);
    const [customTheme, setCustomTheme] = useState(themeSettings.customTheme || {});
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();
    const themeKeys = Object.keys(THEME_PRESETS);
    const previewTheme = useMemo(() => ({
        ...(THEME_PRESETS[selectedTheme] || THEME_PRESETS[DEFAULT_THEME]),
        ...customTheme,
    }), [selectedTheme, customTheme]);

    const updateCustom = (key, value) => {
        setCustomTheme((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const applyTheme = () => {
        router.post(route('superadmin.system.theme.update'), {
            active_theme: selectedTheme,
            custom_theme: customTheme,
        }, {
            preserveScroll: true,
            onSuccess: () => window.location.reload(),
        });
    };

    const resetTheme = () => {
        openConfirm({
            variant: 'warning',
            title: 'Reset Tema Global?',
            message: 'Tema frontend akan dikembalikan ke preset default untuk semua user.',
            confirmLabel: 'Iya, Reset',
            details: [
                { label: 'Tema aktif', value: selectedTheme },
                { label: 'Dampak', value: 'Custom warna global akan dihapus.' },
            ],
            onConfirm: () => router.delete(route('superadmin.system.theme.reset'), {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
                onFinish: closeConfirm,
            }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Superadmin - Sistem" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Superadmin</p>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Sistem</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                            Ringkasan kesehatan aplikasi, maintenance notice, dan konfigurasi global ringan.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        Environment lokal dipantau sebagai snapshot UI
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <StatCard key={item.title} {...item} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Maintenance Notice</h2>
                        <div className="mt-4 space-y-3">
                            {[
                                'Tidak ada maintenance terjadwal hari ini',
                                'Banner maintenance dapat digunakan untuk pemberitahuan user',
                                'Mode maintenance penuh belum diaktifkan',
                            ].map((item, index) => (
                                <div key={item} className={`rounded-2xl px-4 py-3 text-sm font-medium ${index === 0 ? 'border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'}`}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Konfigurasi Global</h2>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Aplikasi', 'Japanlingo'],
                                ['Scope aktif', 'N3 + gamification'],
                                ['Queue mode', 'database'],
                                ['Filesystem', 'public'],
                            ].map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 text-sm">
                                    <span className="font-bold text-gray-500 dark:text-gray-400">{label}</span>
                                    <span className="font-black text-gray-900 dark:text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600 dark:text-red-400">Theme Control</p>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Editor Tema Frontend</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Pilih preset atau override warna utama. Perubahan disimpan di database dan berlaku untuk semua user setelah reload.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={resetTheme} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-black text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                Reset
                            </button>
                            <button onClick={applyTheme} className="rounded-xl bg-[#E64A19] px-5 py-2 text-sm font-black text-white transition-colors hover:bg-[#D84315]">
                                Terapkan Tema
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-5">
                            <div>
                                <p className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Preset</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {themeKeys.map((key) => {
                                        const item = THEME_PRESETS[key];
                                        const active = selectedTheme === key;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setSelectedTheme(key)}
                                                className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20 dark:bg-red-900/20' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'}`}
                                            >
                                                <div className="mb-3 flex items-center gap-2">
                                                    {[item.activeColor, item.doneColor, item.activeShadow].map((color) => (
                                                        <span key={color} className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                                                    ))}
                                                </div>
                                                <p className="text-sm font-black capitalize text-gray-900 dark:text-white">{key}</p>
                                                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{item.landingHeroBg}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {[
                                    ['activeColor', 'Warna aktif'],
                                    ['activeShadow', 'Shadow aktif'],
                                    ['doneColor', 'Warna selesai'],
                                    ['doneShadow', 'Shadow selesai'],
                                ].map(([key, label]) => (
                                    <label key={key} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
                                        <div className="mt-3 flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={previewTheme[key] || '#E64A19'}
                                                onChange={(event) => updateCustom(key, event.target.value)}
                                                className="h-10 w-12 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900"
                                            />
                                            <input
                                                type="text"
                                                value={previewTheme[key] || ''}
                                                onChange={(event) => updateCustom(key, event.target.value)}
                                                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    ['heroBg', 'Hero gradient class'],
                                    ['ctaBg', 'CTA gradient class'],
                                    ['landingHeroBg', 'Landing background class'],
                                ].map(([key, label]) => (
                                    <label key={key} className="block">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</span>
                                        <input
                                            type="text"
                                            value={previewTheme[key] || ''}
                                            onChange={(event) => updateCustom(key, event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200"
                                            placeholder="Contoh: from-pink-50 via-white to-rose-50"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className={`relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br ${previewTheme.heroBg} p-6`}>
                                <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl opacity-40 ${previewTheme.heroBlob1}`} />
                                <div className="relative">
                                    <p className={`text-xs font-black uppercase tracking-[0.25em] ${previewTheme.heroAccent}`}>Preview</p>
                                    <h3 className="mt-3 text-3xl font-black text-gray-900">Japanlingo Theme</h3>
                                    <p className="mt-2 text-sm font-medium text-gray-600">Simulasi warna untuk landing, quiz, dan roadmap.</p>
                                    <button
                                        className={`mt-6 rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-black text-white shadow-lg ${previewTheme.ctaBg}`}
                                        style={{ boxShadow: `0 6px 0 0 ${previewTheme.activeShadow}` }}
                                    >
                                        Mulai Belajar
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white p-4 dark:bg-gray-900">
                                    <p className="text-xs font-black text-gray-400">Active</p>
                                    <div className="mt-3 h-10 rounded-xl" style={{ backgroundColor: previewTheme.activeColor }} />
                                </div>
                                <div className="rounded-2xl bg-white p-4 dark:bg-gray-900">
                                    <p className="text-xs font-black text-gray-400">Done</p>
                                    <div className="mt-3 h-10 rounded-xl" style={{ backgroundColor: previewTheme.doneColor }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Catatan Operasional</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[
                            'Audit trail detail belum sepenuhnya tersambung ke backend.',
                            'Queue, cache, dan storage saat ini hanya ditampilkan sebagai summary UI.',
                            'Kontrol sistem berat sengaja belum dibuka agar scope tetap aman.',
                        ].map((item) => (
                            <div key={item} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                {item}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
