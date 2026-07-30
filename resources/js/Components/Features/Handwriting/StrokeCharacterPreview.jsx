import React from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KanjiHandwritingCanvas from './KanjiHandwritingCanvas';

export default function StrokeCharacterPreview({ character, title, open, onClose }) {
    if (!open || !character) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-gray-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
            <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-gray-900 sm:max-w-lg sm:rounded-3xl sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Cara Menulis</p>
                        <h2 className="mt-1 text-xl font-black text-gray-900 dark:text-white">{title || character}</h2>
                    </div>
                    <button type="button" onClick={onClose} title="Tutup" className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-300">
                        <CloseRoundedIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>
                <KanjiHandwritingCanvas character={character} mode="preview" />
            </div>
        </div>
    );
}
