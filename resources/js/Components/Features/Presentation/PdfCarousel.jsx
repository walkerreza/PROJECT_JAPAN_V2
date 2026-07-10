import React, { useRef } from 'react';

const normalizePdfUrl = (value) => {
    if (!value) return value;

    const match = String(value).match(/\/storage\/presentations\/assets\/(\d+)\/pdf\//);
    if (match?.[1]) {
        return `/presentations/${match[1]}/pdf`;
    }

    return value;
};

export default function PdfCarousel({ url, title = 'PDF Presentasi' }) {
    const frameRef = useRef(null);
    const pdfUrl = normalizePdfUrl(url);
    const viewerUrl = pdfUrl ? `${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1` : '';
    const fullscreen = () => frameRef.current?.requestFullscreen?.();

    return (
        <div className="overflow-hidden rounded-[1.35rem] border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">PDF Viewer</p>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    {pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            Buka Tab
                        </a>
                    )}
                    <button type="button" onClick={fullscreen} className="rounded-xl bg-gray-950 px-3 py-2 text-xs font-black text-white dark:bg-white dark:text-gray-950">Fullscreen</button>
                </div>
            </div>

            <div ref={frameRef} className="bg-gray-100 p-4 dark:bg-gray-950">
                {viewerUrl ? (
                    <div className="mx-auto aspect-video w-full overflow-hidden rounded-xl bg-white shadow-xl">
                        <object
                            data={viewerUrl}
                            type="application/pdf"
                            className="h-full w-full"
                        >
                            <iframe
                                src={viewerUrl}
                                title={title}
                                className="h-full w-full"
                            />
                        </object>
                    </div>
                ) : (
                    <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-sm font-black text-gray-500">PDF belum tersedia untuk deck ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
