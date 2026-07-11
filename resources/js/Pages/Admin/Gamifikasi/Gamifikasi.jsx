import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';
import LeagueIcon from '@/Components/Gamification/LeagueIcon';

import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SaveIcon from '@mui/icons-material/Save';

const CONDITION_LABELS = {
    lessons_completed: 'Modul Selesai',
    quiz_perfect: 'Kuis Sempurna (100%)',
    streak_days: 'Hari Beruntun (Streak)',
};

const emptyForm = {
    name: '',
    description: '',
    icon: '🏆',
    xp_reward: 0,
    condition_type: 'lessons_completed',
    condition_value: 1,
};

export default function Gamification({ achievements = [], settings = {} }) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const unlockedCount = achievements.reduce((total, item) => total + (item.users_count || 0), 0);
    const totalXpReward = achievements.reduce((total, item) => total + (item.xp_reward || 0), 0);

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editId) {
            router.put(`/admin/achievements/${editId}`, form, options);
            return;
        }

        router.post('/admin/achievements', form, options);
    };

    const handleEdit = (achievement) => {
        setForm({
            name: achievement.name || '',
            description: achievement.description || '',
            icon: achievement.icon || '🏆',
            xp_reward: achievement.xp_reward || 0,
            condition_type: achievement.condition_type || 'lessons_completed',
            condition_value: achievement.condition_value || 1,
        });
        setEditId(achievement.id);
        setShowForm(true);
    };

    const handleDelete = (achievement) => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus Lencana?',
            message: 'Lencana akan dihapus dari sistem gamifikasi. User yang sudah mendapatkannya juga kehilangan relasi lencana ini.',
            confirmLabel: 'Iya, Hapus',
            details: [
                { label: 'Nama', value: achievement.name },
                { label: 'Bonus XP', value: `${achievement.xp_reward || 0} XP` },
                { label: 'Sudah didapat', value: `${achievement.users_count || 0} user` },
            ],
            onConfirm: () => router.delete(`/admin/achievements/${achievement.id}`, {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Admin - Pencapaian" />

            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                                <EmojiEventsIcon sx={{ fontSize: 25 }} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-600">Admin Achievement</p>
                                <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Pencapaian & Monitoring</h1>
                                <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Kelola lencana yang benar-benar aktif untuk user. Aturan XP dan streak global dikelola di Superadmin.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(true);
                                setEditId(null);
                                setForm({ ...emptyForm });
                            }}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-sm shadow-red-500/20 transition-colors hover:bg-red-700"
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                            Tambah Lencana
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{achievements.length}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Lencana</p>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{totalXpReward}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-600">Total Reward XP</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{unlockedCount}</p>
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Total Unlock</p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-black text-gray-900 dark:text-white">Perjalanan Liga</p>
                                <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Aturan XP global dari Superadmin.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(settings.leagues || []).map((league) => (
                                    <span key={`${league.name}-${league.min_xp}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-gray-600 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                                        <LeagueIcon iconKey={league.icon} className="h-3.5 w-3.5" />
                                        {league.name}: {Number(league.min_xp || 0).toLocaleString()} XP
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {showForm && (
                    <Card className="!rounded-3xl !p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">Lencana</p>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{editId ? 'Edit Lencana' : 'Tambah Lencana Baru'}</h2>
                                </div>
                                <button type="button" onClick={resetForm} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Ikon / Emoji</span>
                                    <input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-center text-xl dark:border-gray-700 dark:bg-gray-950 dark:text-white" maxLength={8} />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Nama Lencana</span>
                                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950 dark:text-white" required />
                                </label>
                                <label className="block md:col-span-2">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Deskripsi</span>
                                    <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Tipe Kondisi</span>
                                    <select value={form.condition_type} onChange={(event) => setForm({ ...form, condition_type: event.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="lessons_completed">Modul Selesai</option>
                                        <option value="quiz_perfect">Kuis Sempurna (100%)</option>
                                        <option value="streak_days">Hari Beruntun</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Nilai Target</span>
                                    <input type="number" min="1" value={form.condition_value} onChange={(event) => setForm({ ...form, condition_value: parseInt(event.target.value, 10) || 1 })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950 dark:text-white" required />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Bonus XP</span>
                                    <input type="number" min="0" value={form.xp_reward} onChange={(event) => setForm({ ...form, xp_reward: parseInt(event.target.value, 10) || 0 })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold dark:border-gray-700 dark:bg-gray-950 dark:text-white" required />
                                </label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={resetForm} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                                <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white">
                                    <SaveIcon sx={{ fontSize: 16 }} />
                                    {editId ? 'Simpan Perubahan' : 'Tambahkan'}
                                </button>
                            </div>
                        </form>
                    </Card>
                )}

                <Card className="!rounded-3xl !p-0 overflow-hidden">
                    <div className="border-b border-gray-100 p-5 dark:border-gray-800">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">Daftar Lencana Aktif</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">Lencana ini dievaluasi otomatis saat user menyelesaikan kuis/modul dan streak.</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {achievements.length === 0 && (
                            <p className="p-8 text-center text-sm font-bold text-gray-400">Belum ada lencana.</p>
                        )}
                        {achievements.map((achievement) => (
                            <div key={achievement.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl dark:bg-red-900/20">
                                    {achievement.icon || '🏆'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-gray-900 dark:text-white">{achievement.name}</p>
                                    <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">{achievement.description || 'Tanpa deskripsi.'}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 dark:bg-red-900/20 dark:text-red-300">{CONDITION_LABELS[achievement.condition_type] || achievement.condition_type}</span>
                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">Target {achievement.condition_value}</span>
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">+{achievement.xp_reward || 0} XP</span>
                                        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">{achievement.users_count || 0} user unlock</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(achievement)} className="rounded-xl border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 dark:border-gray-700">
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </button>
                                    <button onClick={() => handleDelete(achievement)} className="rounded-xl border border-red-100 p-2 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40">
                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
