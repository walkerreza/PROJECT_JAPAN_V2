import React from 'react';

const imagePattern = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
const embeddableHosts = [
    'canva.com',
    'docs.google.com',
    'onedrive.live.com',
    '1drv.ms',
    'office.com',
    'officeapps.live.com',
    'view.officeapps.live.com',
    'youtube.com',
    'youtu.be',
    'vimeo.com',
];

function safeUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url : null;
    } catch {
        return null;
    }
}

export function isImageUrl(value = '') {
    return value.startsWith('data:image/') || imagePattern.test(value);
}

export function isEmbeddableUrl(value = '') {
    const url = safeUrl(value);
    if (!url) return false;

    return embeddableHosts.some((host) => url.hostname.includes(host));
}

export function toEmbedUrl(value = '') {
    const url = safeUrl(value);
    if (!url) return value;

    if (url.hostname.includes('canva.com') && !url.searchParams.has('embed')) {
        url.searchParams.set('embed', '');
    }

    return url.toString();
}

export default function EmbedFrame({ url, title = 'Media', compact = false }) {
    if (!url) {
        return (
            <div className="grid h-full min-h-[220px] place-items-center rounded-2xl border-2 border-dashed border-gray-300 text-sm font-black opacity-50">
                Media URL
            </div>
        );
    }

    if (isImageUrl(url)) {
        return (
            <img src={url} alt={title} className="h-full w-full object-contain" />
        );
    }

    if (isEmbeddableUrl(url)) {
        return compact ? (
            <div className="grid h-full place-items-center bg-gray-950 px-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                Embed
            </div>
        ) : (
            <iframe
                src={toEmbedUrl(url)}
                title={title}
                className="h-full w-full border-0 bg-white"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
                allow="fullscreen; autoplay; clipboard-read; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
            />
        );
    }

    return (
        <div className="grid h-full min-h-[220px] place-items-center rounded-2xl bg-gray-950 px-6 text-center text-sm font-bold leading-6 text-white">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Link Media</p>
                <a href={url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-white underline decoration-white/40 underline-offset-4">
                    Buka link eksternal
                </a>
            </div>
        </div>
    );
}
