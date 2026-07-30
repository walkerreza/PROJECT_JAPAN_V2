import { KanjiVGParser } from 'kanji-recognizer';

let manifestPromise;
const strokeCache = new Map();

export const loadStrokeManifest = () => {
    manifestPromise ??= fetch('/vendor/japanese-strokes/manifest.json', {
        headers: { Accept: 'application/json' },
    }).then((response) => {
        if (!response.ok) throw new Error('Manifest urutan stroke tidak dapat dimuat.');
        return response.json();
    });

    return manifestPromise;
};

export const writingCharacters = (value = '') => (
    [...new Set(Array.from(String(value).normalize('NFC')))]
        .filter((character) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(character))
);

const normalizeAnimCjkPaths = (svgContent) => {
    const documentNode = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
    const sourcePaths = [...documentNode.querySelectorAll('path[clip-path]')];
    const measuringSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    measuringSvg.setAttribute('viewBox', '0 0 1024 1024');
    measuringSvg.setAttribute('aria-hidden', 'true');
    measuringSvg.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;visibility:hidden;';
    document.body.appendChild(measuringSvg);

    try {
        return sourcePaths.map((sourcePath) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', sourcePath.getAttribute('d') || '');
            measuringSvg.appendChild(path);

            const length = path.getTotalLength();
            const points = Array.from({ length: 64 }, (_, index) => {
                const point = path.getPointAtLength((index / 63) * length);
                return `${(point.x * 109 / 1024).toFixed(2)} ${(point.y * 109 / 1024).toFixed(2)}`;
            });
            path.remove();

            return `M ${points.join(' L ')}`;
        }).filter(Boolean);
    } finally {
        measuringSvg.remove();
    }
};

export const loadStrokeCharacter = async (character) => {
    const normalized = Array.from(String(character || '').normalize('NFC'))[0] || '';
    if (!normalized) throw new Error('Karakter belum dipilih.');
    if (strokeCache.has(normalized)) return strokeCache.get(normalized);

    const promise = loadStrokeManifest().then(async (manifest) => {
        const entry = manifest.characters?.[normalized];
        if (!entry) throw new Error(`Urutan stroke untuk ${normalized} belum tersedia.`);

        const response = await fetch(entry.path, { headers: { Accept: 'image/svg+xml' } });
        if (!response.ok) throw new Error(`Aset stroke ${normalized} tidak dapat dimuat.`);
        const svgContent = await response.text();
        const paths = entry.source === 'animcjk'
            ? normalizeAnimCjkPaths(svgContent)
            : KanjiVGParser.parse(svgContent);

        if (paths.length === 0) throw new Error(`Aset stroke ${normalized} tidak valid.`);

        return {
            character: normalized,
            ...entry,
            stroke_count: paths.length,
            paths,
            version: manifest.version,
        };
    });

    strokeCache.set(normalized, promise);
    return promise;
};

export const resolveAvailableCharacters = async (...values) => {
    const manifest = await loadStrokeManifest();

    return writingCharacters(values.filter(Boolean).join(''))
        .filter((character) => Boolean(manifest.characters?.[character]))
        .map((character) => ({
            character,
            ...manifest.characters[character],
            version: manifest.version,
        }));
};
