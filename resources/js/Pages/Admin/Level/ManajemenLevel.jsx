import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ConfirmActionDialog from '@/Components/UI/ConfirmActionDialog';

export default function ManajemenLevel({ levels = [] }) {
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { data, setData, processing, errors, reset } = useForm({
        level_name: '',
        stage: '',
    });

    const openCreateModal = () => {
        reset();
        setEditingLevel(null);
        setShowLevelModal(true);
    };

    const openEditModal = (level) => {
        setEditingLevel(level);
        setData({
            level_name: level.level_name || '',
            stage: level.stage || '',
        });
        setShowLevelModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingLevel) {
            router.put(route('admin.levels.update', editingLevel.id), data, {
                onSuccess: () => {
                    setShowLevelModal(false);
                    setEditingLevel(null);
                    reset();
                },
            });
            return;
        }

        router.post(route('admin.levels.store'), data, {
            onSuccess: () => {
                setShowLevelModal(false);
                reset();
            },
        });
    };

    const confirmDelete = () => {
        router.delete(route('admin.levels.destroy', deleteConfirm.id), {
            onSuccess: () => setDeleteConfirm(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Level - Japanlingo" />

            <div className="min-h-screen bg-[#F8F9FB] font-sans">
                <header className="sticky top-0 z-40 flex flex-col gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E64A19] text-white">
                            <LayersOutlinedIcon sx={{ fontSize: 20 }} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-gray-900">Manajemen Level</h1>
                            <p className="text-[11px] font-medium text-gray-400">{levels.length} level tersedia</p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#E64A19] px-5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-[#D84315]"
                    >
                        <AddIcon sx={{ fontSize: 18 }} />
                        Tambah Level
                    </button>
                </header>

                <main className="mx-auto max-w-5xl p-4 sm:p-6">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500 sm:px-6">Level</th>
                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wider text-gray-500 sm:px-6">Stage</th>
                                        <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wider text-gray-500 sm:px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {levels.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-10 text-center text-sm font-medium text-gray-400">
                                                Belum ada data level.
                                            </td>
                                        </tr>
                                    )}

                                    {levels.map((level) => (
                                        <tr key={level.id} className="transition-colors hover:bg-gray-50/80">
                                            <td className="px-4 py-4 sm:px-6">
                                                <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-[#E64A19]">
                                                    {level.level_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-gray-700 sm:px-6">
                                                {level.stage}
                                            </td>
                                            <td className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(level)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(level)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {showLevelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-gray-100 p-6">
                            <h3 className="text-lg font-black text-gray-900">
                                {editingLevel ? 'Edit Level' : 'Tambah Level Baru'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Nama Level <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.level_name}
                                    onChange={(e) => setData('level_name', e.target.value)}
                                    placeholder="Contoh: N3"
                                    className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10"
                                />
                                {errors.level_name && <p className="mt-1 text-xs font-medium text-red-500">{errors.level_name}</p>}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                                    Stage <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={data.stage}
                                    onChange={(e) => setData('stage', e.target.value)}
                                    placeholder="Contoh: 3"
                                    className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-900 outline-none transition-all focus:border-orange-200 focus:ring-4 focus:ring-orange-500/10"
                                />
                                {errors.stage && <p className="mt-1 text-xs font-medium text-red-500">{errors.stage}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLevelModal(false);
                                        setEditingLevel(null);
                                        reset();
                                    }}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#E64A19] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/20 transition-colors hover:bg-[#D84315] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Menyimpan...' : editingLevel ? 'Simpan Perubahan' : 'Tambah Level'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmActionDialog
                    show
                    variant="danger"
                    title="Hapus Level?"
                    message="Pastikan level ini tidak lagi dipakai oleh konten lain."
                    confirmLabel="Iya, Hapus"
                    details={[
                        { label: 'Level', value: deleteConfirm.level_name },
                        { label: 'Stage', value: deleteConfirm.stage },
                    ]}
                    onCancel={() => setDeleteConfirm(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </AuthenticatedLayout>
    );
}
