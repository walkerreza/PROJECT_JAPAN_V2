import React, { useCallback, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const VARIANT = {
    danger: {
        icon: ErrorOutlineIcon,
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200',
        panel: 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30',
        confirm: 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20',
        title: 'text-red-700 dark:text-red-200',
    },
    warning: {
        icon: WarningAmberIcon,
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
        panel: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30',
        confirm: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20',
        title: 'text-amber-700 dark:text-amber-200',
    },
    success: {
        icon: CheckCircleIcon,
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
        panel: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30',
        confirm: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20',
        title: 'text-emerald-700 dark:text-emerald-200',
    },
    info: {
        icon: InfoIcon,
        badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
        panel: 'border-sky-200 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30',
        confirm: 'bg-sky-600 text-white hover:bg-sky-700 shadow-sky-500/20',
        title: 'text-sky-700 dark:text-sky-200',
    },
};

const defaultState = {
    show: false,
    variant: 'warning',
    title: '',
    message: '',
    details: [],
    confirmLabel: 'Iya',
    cancelLabel: 'Batal',
    processing: false,
    onConfirm: null,
};

export function useConfirmAction() {
    const [confirmState, setConfirmState] = useState(defaultState);

    const closeConfirm = useCallback(() => {
        setConfirmState(defaultState);
    }, []);

    const openConfirm = useCallback((config) => {
        setConfirmState({
            ...defaultState,
            ...config,
            show: true,
        });
    }, []);

    const setConfirmProcessing = useCallback((processing) => {
        setConfirmState((current) => ({ ...current, processing }));
    }, []);

    return {
        confirmState,
        openConfirm,
        closeConfirm,
        setConfirmProcessing,
    };
}

export default function ConfirmActionDialog({
    show = false,
    variant = 'warning',
    title,
    message,
    details = [],
    confirmLabel = 'Iya',
    cancelLabel = 'Batal',
    processing = false,
    onConfirm,
    onCancel,
    children,
}) {
    if (!show) return null;

    const style = VARIANT[variant] || VARIANT.warning;
    const Icon = style.icon;
    const detailItems = Array.isArray(details) ? details.filter(Boolean) : [];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
                <div className={`border-b p-5 ${style.panel}`}>
                    <div className="flex items-start gap-4">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.badge}`}>
                            <Icon sx={{ fontSize: 26 }} />
                        </span>
                        <div>
                            <h3 className={`text-lg font-black ${style.title}`}>{title || 'Konfirmasi Aksi'}</h3>
                            {message && <p className="mt-1 text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">{message}</p>}
                        </div>
                    </div>
                </div>

                {detailItems.length > 0 && (
                    <div className="space-y-2 px-5 pt-5">
                        {detailItems.map((item, index) => {
                            const isObject = item && typeof item === 'object';
                            const label = isObject ? item.label : null;
                            const value = isObject && 'value' in item ? item.value : item;

                            return (
                                <div key={`${label || 'detail'}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-950">
                                    {label && <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p>}
                                    <p className="mt-1 font-bold text-gray-800 dark:text-gray-100">{value}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {children && (
                    <div className="px-5 pt-5">
                        {children}
                    </div>
                )}

                <div className="flex justify-end gap-3 p-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={processing}
                        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-black text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={`rounded-xl px-5 py-2.5 text-sm font-black shadow-md transition disabled:opacity-50 ${style.confirm}`}
                    >
                        {processing ? 'Memproses...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
