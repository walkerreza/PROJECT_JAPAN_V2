import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';

import CloseIcon from '@mui/icons-material/Close';

const RESOURCE_CONFIG = {
    flashcard: {
        label: 'Flashcard',
        routeName: 'admin.flashcards.store',
        accent: 'bg-teal-600 hover:bg-teal-700',
    },
    quiz: {
        label: 'Kuis',
        routeName: 'admin.quizzes.store',
        accent: 'bg-red-600 hover:bg-red-700',
    },
    presentation: {
        label: 'Presentasi',
        routeName: 'admin.presentations.store',
        accent: 'bg-orange-600 hover:bg-orange-700',
    },
};

const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-orange-900/30';

const initialData = (resourceType, module, day) => ({
    title: resourceType === 'presentation'
        ? `Presentasi ${day?.title || ''}`.trim()
        : `Flashcard ${day?.title || ''}`.trim(),
    description: '',
    level_id: module?.level?.id || '',
    module_id: module?.id || '',
    module_day_id: day?.id || '',
    type: 'multiple_choice',
    time_limit: '',
    passing_score: 70,
    status: 'draft',
});

export default function LearningResourceCreateDialog({
    open,
    onClose,
    resourceType,
    module = null,
    day = null,
    modules = [],
    levels = [],
    lockContext = false,
}) {
    const config = RESOURCE_CONFIG[resourceType] || RESOURCE_CONFIG.flashcard;
    const form = useForm(initialData(resourceType, module, day));

    useEffect(() => {
        if (!open) return;

        form.setData(initialData(resourceType, module, day));
        form.clearErrors();
        // The form instance is stable; reopening is intentionally keyed by context.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, resourceType, module?.id, day?.id]);

    if (!open) return null;

    const selectedModule = lockContext
        ? module
        : modules.find((item) => String(item.id) === String(form.data.module_id));
    const selectedDay = lockContext
        ? day
        : (selectedModule?.days || []).find((item) => String(item.id) === String(form.data.module_day_id));

    const submit = (event) => {
        event.preventDefault();

        const payload = resourceType === 'quiz'
            ? {
                module_id: form.data.module_id,
                module_day_id: form.data.module_day_id,
                type: form.data.type,
                time_limit: form.data.time_limit || null,
                passing_score: form.data.passing_score,
                status: form.data.status,
            }
            : {
                title: form.data.title,
                description: form.data.description,
                level_id: form.data.level_id || null,
                module_id: form.data.module_id,
                module_day_id: form.data.module_day_id,
                status: form.data.status,
            };

        form.transform(() => payload);
        form.post(route(config.routeName), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-gray-950/60 p-3 backdrop-blur-sm sm:p-5">
            <div className="mx-auto my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 sm:my-8">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
                            {selectedModule ? `Minggu ${selectedModule.week_number}` : 'Resource kelas'}
                            {selectedDay ? ` / Hari ${selectedDay.day_number}` : ''}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Buat {config.label}</h2>
                        <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            Setelah dibuat, lanjutkan isinya melalui editor {config.label.toLowerCase()}.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} title="Tutup" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                        <CloseIcon sx={{ fontSize: 19 }} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5">
                    {lockContext ? (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-900/10">
                            <p className="text-xs font-black text-orange-700 dark:text-orange-300">{module?.program?.title || 'Kelas'}</p>
                            <p className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-100">
                                Minggu {module?.week_number || '-'} · Hari {day?.day_number || '-'} · {day?.title}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label>
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Minggu</span>
                                <select
                                    value={form.data.module_id}
                                    onChange={(event) => form.setData((data) => ({
                                        ...data,
                                        module_id: event.target.value,
                                        module_day_id: '',
                                    }))}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Pilih Minggu</option>
                                    {modules.map((item) => (
                                        <option key={item.id} value={item.id}>Minggu {item.week_number} · {item.title}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Hari</span>
                                <select value={form.data.module_day_id} onChange={(event) => form.setData('module_day_id', event.target.value)} className={inputClass} required>
                                    <option value="">Pilih Hari</option>
                                    {(selectedModule?.days || []).map((item) => (
                                        <option key={item.id} value={item.id}>Hari {item.day_number} · {item.title}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}

                    {resourceType !== 'quiz' && (
                        <>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Judul</span>
                                <input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className={inputClass} required />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Deskripsi</span>
                                <textarea value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className={`${inputClass} min-h-24`} placeholder="Ringkasan singkat untuk admin dan siswa" />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Level</span>
                                <select value={form.data.level_id} onChange={(event) => form.setData('level_id', event.target.value)} className={inputClass}>
                                    <option value="">Tanpa level khusus</option>
                                    {levels.map((level) => <option key={level.id} value={level.id}>{level.level_name}</option>)}
                                </select>
                            </label>
                        </>
                    )}

                    {resourceType === 'quiz' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Tipe Kuis</span>
                                <select value={form.data.type} onChange={(event) => form.setData('type', event.target.value)} className={inputClass} required>
                                    <option value="multiple_choice">Pilihan Ganda</option>
                                    <option value="fill_blank">Mengetik / Isian</option>
                                    <option value="listening">Mendengarkan</option>
                                </select>
                            </label>
                            <label>
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Batas Waktu</span>
                                <input type="number" min="0" value={form.data.time_limit} onChange={(event) => form.setData('time_limit', event.target.value)} className={inputClass} placeholder="Tanpa batas" />
                            </label>
                            <label>
                                <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Nilai Lulus</span>
                                <input type="number" min="1" max="100" value={form.data.passing_score} onChange={(event) => form.setData('passing_score', event.target.value)} className={inputClass} required />
                            </label>
                        </div>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-400">Status Awal</span>
                        <select value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className={inputClass}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </label>

                    {Object.values(form.errors).length > 0 && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-900/20 dark:text-red-300">
                            {Object.values(form.errors)[0]}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button type="button" onClick={onClose} className="h-11 rounded-xl border border-gray-200 text-sm font-black text-gray-600 dark:border-gray-700 dark:text-gray-300">Batal</button>
                        <button type="submit" disabled={form.processing} className={`h-11 rounded-xl text-sm font-black text-white disabled:opacity-50 ${config.accent}`}>
                            {form.processing ? 'Menyimpan...' : `Buat ${config.label}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
