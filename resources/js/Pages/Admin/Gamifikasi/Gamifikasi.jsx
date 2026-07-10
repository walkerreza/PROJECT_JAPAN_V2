import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import Card from '@/Components/UI/Card';
import Button from '@/Components/UI/Button';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

import FlashOnIcon from '@mui/icons-material/FlashOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const CONDITION_LABELS = {
    lessons_completed: 'Pelajaran Selesai',
    quiz_perfect: 'Kuis Sempurna (100%)',
    streak_days: 'Hari Beruntun (Streak)',
};

const emptyForm = { name: '', description: '', icon: '<EmojiEventsIcon className="w-5 h-5 inline-block text-amber-500" />', xp_reward: 0, condition_type: 'lessons_completed', condition_value: 1 };

export default function Gamification({ achievements = [] }) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [xpConfig, setXpConfig] = useState({ baseXp: 10, perfectBonus: 50, streakMultiplier: 2.5, dailyCap: 2000 });
    const [streakRules, setStreakRules] = useState({ freezeEnabled: true, lossGracePeriod: 48, recoveryCost: 500 });
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editId) {
            router.put(`/admin/achievements/${editId}`, form, { onSuccess: () => { setEditId(null); setForm({ ...emptyForm }); setShowForm(false); } });
        } else {
            router.post('/admin/achievements', form, { onSuccess: () => { setForm({ ...emptyForm }); setShowForm(false); } });
        }
    };

    const handleEdit = (ach) => {
        setForm({ name: ach.name, description: ach.description || '', icon: ach.icon || '<EmojiEventsIcon className="w-5 h-5 inline-block text-amber-500" />', xp_reward: ach.xp_reward, condition_type: ach.condition_type, condition_value: ach.condition_value });
        setEditId(ach.id);
        setShowForm(true);
    };

    const handleDelete = (achievement) => {
        openConfirm({
            variant: 'danger',
            title: 'Hapus Lencana?',
            message: 'Lencana akan dihapus dari sistem gamifikasi.',
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
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Gamification Control Center</h2>}>
            <Head title="Admin - Gamification Settings" />
            
            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gamification Control Center</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage the core mechanics of learner engagement and progression systems.</p>
                    </div>

                    {/* Section 1: XP & Points */}
                    <Card className="!p-8 !rounded-2xl border-transparent shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                                <FlashOnIcon className="text-red-600 dark:text-red-400" /> XP & Points Configuration
                            </h3>
                            <Button className="!bg-red-600 !text-white !rounded-xl !px-6 shadow-md shadow-red-500/20">Save Changes</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Base XP per Correct Answer</label>
                                    <input type="number" value={xpConfig.baseXp} onChange={(e) => setXpConfig({...xpConfig, baseXp: e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl px-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:bg-gray-900 focus:border-red-100 dark:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Perfect Lesson Bonus</label>
                                    <input type="number" value={xpConfig.perfectBonus} onChange={(e) => setXpConfig({...xpConfig, perfectBonus: e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl px-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:bg-gray-900 focus:border-red-100 dark:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                        <span>Streak Multiplier (Max)</span>
                                        <span className="text-red-600 dark:text-red-400">{xpConfig.streakMultiplier}x</span>
                                    </label>
                                    <div className="h-11 flex items-center">
                                        <input type="range" min="1" max="5" step="0.5" value={xpConfig.streakMultiplier} onChange={(e) => setXpConfig({...xpConfig, streakMultiplier: e.target.value})} className="w-full accent-red-600" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Daily XP Cap</label>
                                    <input type="number" value={xpConfig.dailyCap} onChange={(e) => setXpConfig({...xpConfig, dailyCap: e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl px-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:bg-gray-900 focus:border-red-100 dark:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Badge / Achievement Management - LIVE CRUD */}
                    <Card className="!p-8 !rounded-2xl border-transparent shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                                <EmojiEventsIcon className="text-red-600 dark:text-red-400" /> Manajemen Lencana ({achievements.length})
                            </h3>
                            {!showForm && (
                                <Button onClick={() => { setShowForm(true); setEditId(null); setForm({...emptyForm}); }} className="!bg-red-600 !text-white !rounded-xl !px-6 shadow-md shadow-red-500/20 flex items-center gap-2">
                                    <AddIcon sx={{ fontSize: 18 }} /> Tambah Lencana
                                </Button>
                            )}
                        </div>

                        {showForm && (
                            <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-black text-gray-900 dark:text-white">{editId ? 'Edit Lencana' : 'Tambah Lencana Baru'}</h4>
                                    <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"><CloseIcon /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ikon (Emoji)</label>
                                        <input type="text" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-2xl text-center focus:border-red-200 focus:ring-4 focus:ring-red-500/10" maxLength={4} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nama Lencana</label>
                                        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Kanji Master" className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-medium focus:border-red-200 focus:ring-4 focus:ring-red-500/10" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                                        <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Cara mendapatkan lencana ini..." className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-medium focus:border-red-200 focus:ring-4 focus:ring-red-500/10" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tipe Kondisi</label>
                                        <select value={form.condition_type} onChange={e => setForm({...form, condition_type: e.target.value})} className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-medium focus:border-red-200 focus:ring-4 focus:ring-red-500/10">
                                            <option value="lessons_completed">Pelajaran Selesai</option>
                                            <option value="quiz_perfect">Kuis Sempurna (100%)</option>
                                            <option value="streak_days">Hari Beruntun (Streak)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Nilai Kondisi</label>
                                        <input type="number" value={form.condition_value} onChange={e => setForm({...form, condition_value: parseInt(e.target.value) || 1})} min={1} className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-bold focus:border-red-200 focus:ring-4 focus:ring-red-500/10" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Bonus XP</label>
                                        <input type="number" value={form.xp_reward} onChange={e => setForm({...form, xp_reward: parseInt(e.target.value) || 0})} min={0} className="w-full h-11 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm font-bold focus:border-red-200 focus:ring-4 focus:ring-red-500/10" required />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-800/50">Batal</button>
                                    <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 flex items-center gap-2">
                                        <SaveIcon sx={{ fontSize: 16 }} /> {editId ? 'Simpan Perubahan' : 'Tambahkan'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {achievements.length === 0 && (
                                <p className="text-center py-8 text-gray-400 dark:text-gray-500 font-bold">Belum ada lencana. Klik "Tambah Lencana" untuk memulai.</p>
                            )}
                            {achievements.map((ach) => (
                                <div key={ach.id} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-gray-900 relative overflow-hidden group hover:border-gray-200 dark:border-gray-700 transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                                    <div className="flex flex-col gap-3 pl-4 sm:flex-row sm:items-center sm:gap-6 w-full">
                                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-2xl shrink-0 border border-red-100 dark:border-red-900/30">{ach.icon || '<EmojiEventsIcon className="w-5 h-5 inline-block text-amber-500" />'}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-gray-900 dark:text-white text-sm">{ach.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{ach.description}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">{CONDITION_LABELS[ach.condition_type] || ach.condition_type}</span>
                                                <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">Target: {ach.condition_value}</span>
                                                <span className="text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">+{ach.xp_reward} XP</span>
                                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{ach.users_count || 0} user unlocked</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => handleEdit(ach)} className="p-2 text-gray-300 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors"><EditIcon sx={{ fontSize: 18 }} /></button>
                                            <button onClick={() => handleDelete(ach)} className="p-2 text-gray-300 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 rounded-xl transition-colors"><DeleteIcon sx={{ fontSize: 18 }} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Section 3: Streak Rules */}
                    <Card className="!p-8 !rounded-2xl border-transparent shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6 text-lg">
                            <LocalFireDepartmentIcon className="text-red-600 dark:text-red-400" /> Streak Rules
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20/50 rounded-2xl border border-red-100 dark:border-red-900/30">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Streak Freeze</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Allow users to skip 1 day without loss.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={streakRules.freezeEnabled} onChange={() => setStreakRules({...streakRules, freezeEnabled: !streakRules.freezeEnabled})} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Loss Grace Period (Hours)</label>
                                <input type="number" value={streakRules.lossGracePeriod} onChange={(e) => setStreakRules({...streakRules, lossGracePeriod: e.target.value})} className="w-full h-11 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl px-4 text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:bg-gray-900 focus:border-red-100 dark:border-red-900/30 focus:ring-4 focus:ring-red-500/10 transition-all" />
                            </div>
                        </div>
                    </Card>

                    {/* Section 4: Danger Zone */}
                    <div className="pt-4">
                        <Card className="!p-8 !rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20/30 shadow-none">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                                <div>
                                    <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 text-lg">Danger Zone</h3>
                                    <p className="text-sm text-red-600 dark:text-red-400/80 mt-2 max-w-xl">Permanently reset gamification progress for all users. This includes levels, streaks, and badges. This action cannot be undone.</p>
                                </div>
                                <Button className="!bg-red-700 hover:!bg-red-800 !text-white !rounded-xl !px-6 shadow-md shadow-red-700/20 flex items-center gap-2 whitespace-nowrap shrink-0">
                                    <ErrorOutlineIcon sx={{ fontSize: 18 }} /> Reset All Progress
                                </Button>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
