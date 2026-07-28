import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BoardCanvas from '@/Components/Features/Board/BoardCanvas';
import FabricSlideCanvas from '@/Components/Features/Presentation/FabricSlideCanvas';
import PdfCarousel from '@/Components/Features/Presentation/PdfCarousel';
import EmbedFrame from '@/Components/Features/Presentation/EmbedFrame';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const createSlideKey = () => `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const canvasText = (text, left, top, width, fontSize, options = {}) => ({
    kind: 'textbox',
    text,
    left,
    top,
    width,
    height: options.height || Math.max(70, fontSize * 1.4),
    fontSize,
    fill: options.fill || '#111827',
    fontWeight: options.fontWeight || '700',
    textAlign: options.textAlign || 'left',
});
const canvasShape = (left, top, width, height, options = {}) => ({
    kind: 'shape',
    shapeType: options.shapeType || 'rounded',
    left,
    top,
    width,
    height,
    fill: options.fill || '#FFF1E8',
    stroke: options.stroke || '#E64A19',
    strokeWidth: options.strokeWidth || 2,
});
const templateCanvas = (layout, title, content = '') => {
    const lines = String(content).split('\n').filter(Boolean);
    const base = { version: 1, width: 1280, height: 720, backgroundColor: '#FFFFFF', objects: [] };

    if (layout === 'title') {
        return { ...base, backgroundColor: '#FFF7ED', objects: [
            canvasText('JAPANLINGO', 90, 120, 1080, 24, { fill: '#E64A19', fontWeight: '900' }),
            canvasText(title, 90, 190, 1080, 68, { fontWeight: '900' }),
            canvasText(content, 90, 310, 880, 30, { fill: '#4B5563' }),
        ] };
    }

    if (layout === 'content') {
        const points = lines.length ? lines : ['Poin materi pertama', 'Poin materi kedua', 'Poin materi ketiga'];
        return { ...base, objects: [
            canvasText(title, 72, 55, 1130, 52, { fontWeight: '900' }),
            ...points.flatMap((line, index) => [
                canvasShape(72, 155 + index * 135, 1130, 104, { fill: index % 2 ? '#F8FAFC' : '#FFF7ED' }),
                canvasText(line, 105, 184 + index * 135, 1050, 28),
            ]),
        ] };
    }

    if (layout === 'vocabulary') {
        return { ...base, backgroundColor: '#ECFEFF', objects: [
            canvasText('KOSAKATA', 90, 60, 1100, 22, { fill: '#E64A19', fontWeight: '900', textAlign: 'center' }),
            canvasText(title, 90, 125, 1100, 112, { fontWeight: '900', textAlign: 'center' }),
            canvasText(lines[0] || 'reading', 90, 300, 1100, 38, { fill: '#475569', textAlign: 'center' }),
            canvasText(lines[1] || 'arti', 90, 385, 1100, 48, { fontWeight: '900', textAlign: 'center' }),
            canvasText(lines[2] || 'Contoh kalimat', 140, 500, 1000, 28, { fill: '#475569', textAlign: 'center' }),
        ] };
    }

    if (layout === 'kanji') {
        return { ...base, backgroundColor: '#FFFBEB', objects: [
            canvasShape(80, 115, 360, 390, { fill: '#FFFFFF', stroke: '#F59E0B' }),
            canvasText(title, 100, 185, 320, 160, { fontWeight: '900', textAlign: 'center' }),
            canvasText(lines.join('\n') || 'Arti:\nOnyomi:\nKunyomi:\nContoh:', 520, 150, 660, 36, { height: 390 }),
        ] };
    }

    if (layout === 'question') {
        return { ...base, backgroundColor: '#FFF1F2', objects: [
            canvasText('PERTANYAAN PEMANTIK', 90, 100, 1100, 22, { fill: '#E64A19', fontWeight: '900', textAlign: 'center' }),
            canvasText(title, 110, 200, 1060, 62, { fontWeight: '900', textAlign: 'center' }),
            canvasText(content, 180, 380, 920, 34, { fill: '#4B5563', textAlign: 'center' }),
        ] };
    }

    if (layout === 'media') {
        return { ...base, backgroundColor: 'transparent', objects: [
            canvasShape(40, 35, 520, 82, { fill: 'rgba(17,24,39,0.82)', stroke: 'rgba(255,255,255,0.3)' }),
            canvasText(title, 65, 55, 470, 30, { fill: '#FFFFFF', fontWeight: '900' }),
        ] };
    }

    return { ...base, objects: [
        canvasText(title || 'Papan Interaktif', 72, 55, 1130, 46, { fontWeight: '900' }),
        canvasText(content || 'Gunakan toolbar untuk menambahkan catatan.', 72, 130, 900, 26, { fill: '#64748B' }),
    ] };
};

const emptySlide = {
    id: null,
    title: 'Slide Baru',
    layout: 'canvas',
    content: '',
    media_url: '',
    background: 'light',
    accent_color: '#E64A19',
    speaker_notes: '',
    board_data: { strokes: [] },
    snapshot_data: null,
    snapshot_url: null,
    canvas_json: { version: 1, width: 1280, height: 720, backgroundColor: '#FFFFFF', objects: [] },
    source_type: 'manual',
    source_meta: null,
    _clientKey: createSlideKey(),
};

const templates = [
    { label: 'Sampul', layout: 'title', title: 'Judul Presentasi', content: 'Subjudul atau tujuan pembelajaran.', background: 'sunrise' },
    { label: 'Materi', layout: 'content', title: 'Poin Utama', content: 'Poin materi pertama\nPoin materi kedua\nPoin materi ketiga', background: 'grid' },
    { label: 'Kosakata', layout: 'vocabulary', title: '会議', content: 'かいぎ\nrapat\n今日は一時から会議があります。', background: 'ocean' },
    { label: 'Kanji', layout: 'kanji', title: '割', content: 'Arti: membagi\nOnyomi: カツ\nKunyomi: わる\nContoh: 割引 - diskon', background: 'paper' },
    { label: 'Media', layout: 'media', title: 'Gambar atau Video', content: '', media_url: '', background: 'dark' },
    { label: 'Pertanyaan', layout: 'question', title: 'Pertanyaan Pemantik', content: 'Apa yang kamu pahami dari materi ini?', background: 'rose' },
    { label: 'Papan Kosong', layout: 'canvas', title: 'Papan Interaktif', content: '', background: 'light' },
].map((template) => ({
    ...template,
    canvas_json: templateCanvas(template.layout, template.title, template.content),
}));

const backgroundClass = {
    light: 'bg-white text-gray-950',
    dark: 'bg-gray-950 text-white',
    sunrise: 'bg-gradient-to-br from-orange-100 via-amber-50 to-white text-gray-950',
    sakura: 'bg-gradient-to-br from-pink-100 via-white to-rose-50 text-gray-950',
    ocean: 'bg-gradient-to-br from-cyan-100 via-white to-red-100 text-gray-950',
    forest: 'bg-gradient-to-br from-emerald-100 via-white to-lime-100 text-gray-950',
    paper: 'bg-[linear-gradient(#ffffff,#fff7ed)] text-gray-950',
    grid: 'bg-white text-gray-950 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]',
    indigo: 'bg-gradient-to-br from-indigo-950 via-gray-950 to-red-950 text-white',
    matcha: 'bg-gradient-to-br from-lime-100 via-white to-emerald-100 text-gray-950',
    rose: 'bg-gradient-to-br from-rose-100 via-white to-orange-50 text-gray-950',
};

const backgroundOptions = [
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['sunrise', 'Sunrise'],
    ['sakura', 'Sakura'],
    ['ocean', 'Ocean'],
    ['forest', 'Forest'],
    ['paper', 'Paper'],
    ['grid', 'Grid'],
    ['indigo', 'Indigo'],
    ['matcha', 'Matcha'],
    ['rose', 'Rose'],
];

const csrfToken = () => {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
};

const slideDimensions = (slide = {}) => {
    const sourceWidth = Number(slide.source_meta?.canvas_width || slide.source_meta?.width || slide.canvas_json?.width);
    const sourceHeight = Number(slide.source_meta?.canvas_height || slide.source_meta?.height || slide.canvas_json?.height);

    if (sourceWidth > 0 && sourceHeight > 0) {
        return {
            width: sourceWidth,
            height: sourceHeight,
        };
    }

    return {
        width: 16,
        height: 9,
    };
};

const slideAspectStyle = (slide) => {
    const size = slideDimensions(slide);

    return { aspectRatio: `${size.width} / ${size.height}` };
};

const mapDeckSlides = (items = []) => items.map((slide) => ({
    ...slide,
    board_data: slide.jamboard_data || slide.board_data || { strokes: [] },
    snapshot_data: slide.jamboard_snapshot || slide.snapshot_data || null,
    jamboard_data: slide.jamboard_data || slide.board_data || { strokes: [] },
    jamboard_snapshot: slide.jamboard_snapshot || slide.snapshot_data || null,
    snapshot_url: slide.snapshot_url || null,
    canvas_json: slide.canvas_json || (slide.layout === 'pdf'
        ? null
        : templateCanvas(slide.layout, slide.title || 'Slide Presentasi', slide.content || '')),
    source_type: slide.source_type || 'manual',
    source_meta: slide.source_meta || null,
    _clientKey: `slide-id-${slide.id}`,
}));

const builderSnapshot = (slides, status, placement = {}) => JSON.stringify({
    status,
    placement,
    slides: slides.map(({ _clientKey, ...slide }) => slide),
});

function SlidePreview({ slide, small = false }) {
    const lines = String(slide.content || '').split('\n').filter(Boolean);
    const accent = slide.accent_color || '#E64A19';
    const visualUrl = slide.snapshot_url || slide.snapshot_data || slide.media_url;
    const framePadding = small ? 'p-2' : 'p-5 sm:p-6';
    const titleSize = small ? 'text-xs' : 'text-2xl';
    const headingSize = small ? 'text-sm' : 'text-3xl';

    return (
        <div style={slideAspectStyle(slide)} className={`${backgroundClass[slide.background] || backgroundClass.light} ${small ? 'rounded-xl' : 'rounded-2xl'} relative flex overflow-hidden border border-gray-200 shadow-sm dark:border-gray-800`}>
            <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-20" style={{ backgroundColor: accent }} />
            <div className={`relative z-10 flex h-full w-full flex-col ${framePadding}`}>
                {slide.layout === 'title' && (
                    <div className="my-auto">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: accent }}>JapanLingo</p>
                        <h2 className={`${small ? 'text-base' : 'text-3xl sm:text-4xl'} font-black tracking-tight`}>{slide.title || 'Untitled'}</h2>
                        <p className={`${small ? 'mt-1 text-[10px]' : 'mt-3 text-sm'} max-w-2xl font-bold opacity-70`}>{slide.content}</p>
                    </div>
                )}
                {slide.layout === 'content' && (
                    <div>
                        <h2 className={`${small ? 'text-xl' : 'text-4xl'} font-black`}>{slide.title || 'Poin Utama'}</h2>
                        <div className={`${small ? 'mt-2 space-y-1' : 'mt-4 space-y-2'}`}>
                            {(lines.length ? lines : ['Tulis poin materi di sini.']).map((line, index) => (
                                <div key={`${line}-${index}`} className={`${small ? 'text-[10px]' : 'text-sm'} rounded-xl bg-white/60 p-2 font-bold shadow-sm dark:bg-gray-900/50`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {slide.layout === 'vocabulary' && (
                    <div className="my-auto text-center">
                        <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: accent }}>Vocabulary</p>
                        <h2 className={`${small ? 'text-4xl' : 'text-7xl'} mt-4 font-black`}>{slide.title || '単語'}</h2>
                        <p className={`${small ? 'mt-2 text-sm' : 'mt-5 text-3xl'} font-bold opacity-70`}>{lines[0] || 'reading'}</p>
                        <p className={`${small ? 'mt-3 text-base' : 'mt-8 text-4xl'} font-black`}>{lines[1] || 'arti'}</p>
                        {!small && <p className="mx-auto mt-6 max-w-2xl text-lg italic opacity-70">{lines[2] || 'Contoh kalimat akan tampil di sini.'}</p>}
                    </div>
                )}
                {slide.layout === 'kanji' && (
                    <div className="grid flex-1 place-items-center gap-6 sm:grid-cols-[220px_1fr]">
                        <div className={`${small ? 'h-24 w-24 text-5xl' : 'h-48 w-48 text-8xl'} grid place-items-center rounded-[2rem] bg-white/70 font-black shadow-lg dark:bg-gray-900/60`}>
                            {slide.title || '漢'}
                        </div>
                        <div className="space-y-3">
                            {(lines.length ? lines : ['Arti: ...', 'Reading: ...', 'Contoh: ...']).map((line, index) => (
                                <p key={`${line}-${index}`} className={`${small ? 'text-xs' : 'text-xl'} font-black opacity-80`}>{line}</p>
                            ))}
                        </div>
                    </div>
                )}
                {slide.layout === 'media' && (
                    <div className="flex h-full min-h-0 flex-col">
                        {!small && <h2 className={`${titleSize} mb-5 font-black`}>{slide.title || 'Media'}</h2>}
                        {visualUrl ? (
                            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-gray-950">
                                <EmbedFrame url={visualUrl} title={slide.title || 'Media'} compact={small} />
                            </div>
                        ) : (
                            <div className="grid min-h-0 flex-1 place-items-center rounded-2xl border-2 border-dashed border-gray-300 font-black opacity-50">Media URL</div>
                        )}
                        {!small && <p className="mt-5 text-lg font-bold opacity-70">{slide.content}</p>}
                    </div>
                )}
                {slide.layout === 'question' && (
                    <div className="my-auto text-center">
                        <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: accent }}>Question</p>
                        <h2 className={`${small ? 'text-2xl' : 'text-5xl'} mt-5 font-black`}>{slide.title || 'Pertanyaan'}</h2>
                        <p className={`${small ? 'mt-3 text-sm' : 'mt-8 text-2xl'} mx-auto max-w-3xl font-bold opacity-70`}>{slide.content}</p>
                    </div>
                )}
                {slide.layout === 'board' && (
                    <div>
                        <h2 className={`${small ? 'text-xl' : 'text-4xl'} mb-5 font-black`}>{slide.title || 'Jamboard'}</h2>
                        <BoardCanvas
                            strokes={slide.jamboard_data?.strokes || slide.board_data?.strokes || []}
                            className={small ? 'rounded-xl shadow-none' : 'rounded-3xl'}
                        />
                        {!small && <p className="mt-5 text-lg font-bold opacity-70">{slide.content || 'Jamboard interaktif untuk sesi ajar.'}</p>}
                    </div>
                )}
                {slide.layout === 'canvas' && (
                    <div className="flex h-full min-h-0 flex-col">
                        {!small && <h2 className={`${titleSize} mb-5 font-black`}>{slide.title || 'Canvas Slide'}</h2>}
                        {visualUrl ? (
                            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm">
                                <img src={visualUrl} alt={slide.title || 'Canvas'} className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <div className="grid min-h-0 flex-1 place-items-center rounded-2xl border-2 border-dashed border-gray-300 font-black opacity-50">{small ? (slide.title || 'Canvas') : 'Canvas'}</div>
                        )}
                        {!small && slide.source_type === 'pptx' && <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">Import PPTX adalah draft. Cek ulang layout sebelum publish.</p>}
                    </div>
                )}
                {slide.layout === 'pdf' && (
                    <div className="flex h-full min-h-0 flex-col">
                        {!small && <h2 className={`${titleSize} mb-5 font-black`}>{slide.title || 'PDF'}</h2>}
                        <div className="grid min-h-0 flex-1 place-items-center rounded-2xl bg-red-50 font-black text-red-700">
                            PDF
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BuilderPresentasi({
    deck = null,
    decks = [],
    days = [],
    module = null,
    createMode = false,
    activePlacement = 'opening',
}) {
    const moduleContext = module || deck?.module || {};
    const programId = moduleContext.program?.id || deck?.module?.program_pembelajaran_id;
    const builderReturnUrl = programId
        ? route('admin.modules.index', {
            program_id: programId,
            week_id: moduleContext.id || deck.module.id,
            focus: 'presentation',
        })
        : route('admin.presentations.index');
    const [slides, setSlides] = useState(mapDeckSlides(deck?.slides || []));
    const [activeIndex, setActiveIndex] = useState(0);
    const [status, setStatus] = useState(deck?.status || 'draft');
    const [deckPlacement, setDeckPlacement] = useState(deck?.week_slot || 'opening');
    const [deckDayId, setDeckDayId] = useState(deck?.module_day_id || '');
    const [deckSortOrder, setDeckSortOrder] = useState(deck?.sort_order || 0);
    const [newDeckTitle, setNewDeckTitle] = useState('');
    const [placement, setPlacement] = useState(activePlacement || 'opening');
    const [selectedDayId, setSelectedDayId] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [pptxFile, setPptxFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [embedUrl, setEmbedUrl] = useState('');
    const [embedTitle, setEmbedTitle] = useState('');
    const [mediaMode, setMediaMode] = useState('link');
    const [mediaFile, setMediaFile] = useState(null);
    const [isMediaUploading, setIsMediaUploading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showTemplatePanel, setShowTemplatePanel] = useState(true);
    const [showEditPanel, setShowEditPanel] = useState(true);
    const pendingImportStartIndexRef = useRef(null);
    const cleanSnapshotRef = useRef(builderSnapshot(
        mapDeckSlides(deck?.slides || []),
        deck?.status || 'draft',
        {
            week_slot: deck?.week_slot || 'opening',
            module_day_id: deck?.module_day_id || '',
            sort_order: Number(deck?.sort_order || 0),
        },
    ));
    const activeSlide = slides[activeIndex] || null;
    const currentPlacement = {
        week_slot: deckPlacement,
        module_day_id: deckPlacement === 'after_day' ? deckDayId : '',
        sort_order: Number(deckSortOrder || 0),
    };
    const hasUnsavedChanges = Boolean(deck)
        && builderSnapshot(slides, status, currentPlacement) !== cleanSnapshotRef.current;
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    useEffect(() => {
        const mappedSlides = mapDeckSlides(deck?.slides || []);
        const nextStatus = deck?.status || 'draft';
        const nextPlacement = deck?.week_slot || 'opening';
        const nextDayId = deck?.module_day_id || '';
        const nextSortOrder = Number(deck?.sort_order || 0);

        setSlides(mappedSlides);
        setStatus(nextStatus);
        setDeckPlacement(nextPlacement);
        setDeckDayId(nextDayId);
        setDeckSortOrder(nextSortOrder);
        cleanSnapshotRef.current = builderSnapshot(mappedSlides, nextStatus, {
            week_slot: nextPlacement,
            module_day_id: nextPlacement === 'after_day' ? nextDayId : '',
            sort_order: nextSortOrder,
        });

        if (pendingImportStartIndexRef.current !== null) {
            const targetIndex = Math.min(pendingImportStartIndexRef.current, Math.max(0, mappedSlides.length - 1));
            setActiveIndex(targetIndex);
            pendingImportStartIndexRef.current = null;
            return;
        }

        setActiveIndex((current) => Math.min(current, Math.max(0, mappedSlides.length - 1)));
    }, [deck?.id, deck?.slides, deck?.status]);

    useEffect(() => {
        const slotLabel = placement === 'closing'
            ? 'Akhir'
            : placement === 'after_day'
                ? 'Setelah Day'
                : 'Awal';
        setNewDeckTitle(`${slotLabel} Minggu ${moduleContext.week_number || ''} - ${moduleContext.title || 'Presentasi'}`.trim());
    }, [moduleContext.id, moduleContext.title, moduleContext.week_number, placement]);

    useEffect(() => {
        const warnBeforeLeave = (event) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warnBeforeLeave);

        return () => window.removeEventListener('beforeunload', warnBeforeLeave);
    }, [hasUnsavedChanges]);

    const visitDeck = (deckId) => {
        if (hasUnsavedChanges && !window.confirm('Perubahan pada presentasi ini belum disimpan. Buang perubahan dan lanjutkan?')) {
            return;
        }

        router.get(route('admin.modules.presentations.builder', moduleContext.id), {
            deck_id: deckId,
        }, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const openCreateDeck = (nextPlacement = 'opening') => {
        if (hasUnsavedChanges && !window.confirm('Perubahan pada presentasi ini belum disimpan. Buang perubahan dan lanjutkan?')) {
            return;
        }

        router.get(route('admin.modules.presentations.builder', moduleContext.id), {
            create: 1,
            placement: nextPlacement,
        }, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const leaveWorkspace = () => {
        if (hasUnsavedChanges && !window.confirm('Perubahan pada presentasi ini belum disimpan. Tetap keluar?')) {
            return;
        }

        router.visit(builderReturnUrl);
    };

    const createDeck = () => {
        const title = newDeckTitle.trim();
        if (!title || !moduleContext.id) return;

        router.post(route('admin.presentations.store'), {
            title,
            description: '',
            level_id: moduleContext.level_id || null,
            module_id: moduleContext.id,
            module_day_id: placement === 'after_day' ? selectedDayId : null,
            week_slot: placement,
            sort_order: Number(sortOrder || 0),
            status: 'draft',
        });
    };

    const deleteDeck = () => {
        if (!deck) return;

        const slotLabel = deck.week_slot === 'closing'
            ? 'Akhir Minggu'
            : deck.week_slot === 'after_day'
                ? `Setelah Day ${deck.day?.day_number || '-'}`
                : 'Awal Minggu';

        openConfirm({
            variant: 'danger',
            title: 'Hapus Presentasi?',
            message: 'Deck, seluruh slide, serta file import yang dikelola aplikasi akan dihapus permanen. Presentasi pada tab lain tidak berubah.',
            confirmLabel: 'Hapus Presentasi',
            details: [
                { label: 'Judul', value: deck.title },
                { label: 'Posisi', value: slotLabel },
                { label: 'Jumlah slide', value: `${slides.length} slide` },
            ],
            onConfirm: () => router.delete(route('admin.presentations.destroy', {
                presentationDeck: deck.id,
                workspace: 1,
            }), {
                preserveScroll: true,
                onFinish: closeConfirm,
            }),
        });
    };

    const updateSlide = (field, value) => {
        setSlides((current) => current.map((slide, index) => (
            index === activeIndex ? { ...slide, [field]: value } : slide
        )));
    };

    const changeSlideLayout = (layout) => {
        setSlides((current) => current.map((slide, index) => (
            index === activeIndex
                ? {
                    ...slide,
                    layout,
                    canvas_json: templateCanvas(layout, slide.title || 'Slide Presentasi', slide.content || ''),
                    snapshot_data: null,
                }
                : slide
        )));
    };

    const addSlide = (template = emptySlide) => {
        const next = { ...emptySlide, ...template, id: null, _clientKey: createSlideKey() };
        setSlides((current) => [...current, next]);
        setActiveIndex(slides.length);
    };

    const duplicateSlide = () => {
        if (!activeSlide) return;
        addSlide({ ...activeSlide, title: `${activeSlide.title || 'Slide'} Copy` });
    };

    const removeSlide = () => {
        if (!activeSlide) return;

        openConfirm({
            variant: 'danger',
            title: 'Hapus Slide Aktif?',
            message: 'Slide ini akan dihapus dari draft builder. Simpan deck setelahnya agar perubahan tersimpan.',
            confirmLabel: 'Iya, Hapus',
            details: [
                { label: 'Slide', value: `${activeIndex + 1}. ${activeSlide.title || 'Untitled'}` },
                { label: 'Layout', value: activeSlide.layout || '-' },
            ],
            onConfirm: () => {
                const next = slides.filter((_, index) => index !== activeIndex);
                setSlides(next);
                setActiveIndex(Math.max(0, activeIndex - 1));
                closeConfirm();
            },
        });
    };

    const removeAllSlides = () => {
        if (!slides.length) return;

        openConfirm({
            variant: 'danger',
            title: 'Hapus Semua Slide?',
            message: 'Semua slide akan dihapus dan langsung tersimpan. Setelah reload, slide tidak akan muncul lagi.',
            confirmLabel: 'Iya, Hapus Semua',
            details: [
                { label: 'Deck', value: deck.title },
                { label: 'Total slide', value: `${slides.length} slide` },
            ],
            onConfirm: () => {
                router.post(route('admin.presentations.builder.update', deck.id), {
                    status,
                    ...currentPlacement,
                    slides: [],
                }, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSlides([]);
                        setActiveIndex(0);
                    },
                    onFinish: closeConfirm,
                });
            },
        });
    };

    const moveSlide = (direction) => {
        const nextIndex = activeIndex + direction;
        if (nextIndex < 0 || nextIndex >= slides.length) return;

        const next = [...slides];
        [next[activeIndex], next[nextIndex]] = [next[nextIndex], next[activeIndex]];
        setSlides(next);
        setActiveIndex(nextIndex);
    };

    const saveSlides = () => {
        router.post(route('admin.presentations.builder.update', deck.id), {
            status,
            ...currentPlacement,
            slides: slides.map((slide) => ({
                id: slide.id,
                title: slide.title || '',
                layout: slide.layout || 'content',
                content: slide.content || '',
                media_url: slide.media_url || '',
                background: slide.background || 'light',
                accent_color: slide.accent_color || '#E64A19',
                speaker_notes: slide.speaker_notes || '',
                board_data: slide.board_data || { strokes: [] },
                snapshot_data: slide.snapshot_data || null,
                jamboard_data: slide.jamboard_data || slide.board_data || { strokes: [] },
                jamboard_snapshot: slide.jamboard_snapshot || slide.snapshot_data || null,
                snapshot_url: slide.snapshot_url || null,
                canvas_json: slide.canvas_json || null,
                source_type: slide.source_type || 'manual',
                source_meta: slide.source_meta || null,
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                cleanSnapshotRef.current = builderSnapshot(slides, status, currentPlacement);
            },
        });
    };

    const blockImportForUnsavedChanges = () => {
        if (!hasUnsavedChanges) return false;

        window.alert('Simpan perubahan slide terlebih dahulu sebelum mengimpor file.');

        return true;
    };

    const importPptx = (event) => {
        event.preventDefault();
        if (blockImportForUnsavedChanges()) return;
        if (!pptxFile) return;

        pendingImportStartIndexRef.current = slides.length;
        setIsImporting(true);
        router.post(route('admin.presentations.import.pptx', deck.id), {
            pptx_file: pptxFile,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowImportMenu(false);
                setPptxFile(null);
            },
            onFinish: () => setIsImporting(false),
        });
    };

    const importPdf = (event) => {
        event.preventDefault();
        if (blockImportForUnsavedChanges()) return;
        if (!pdfFile) return;

        pendingImportStartIndexRef.current = slides.length;
        setIsImporting(true);
        router.post(route('admin.presentations.import.pdf', deck.id), {
            pdf_file: pdfFile,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPdfFile(null);
            },
            onFinish: () => setIsImporting(false),
        });
    };

    const importImages = (event) => {
        event.preventDefault();
        if (blockImportForUnsavedChanges()) return;
        if (!imageFiles.length) return;

        pendingImportStartIndexRef.current = slides.length;
        setIsImporting(true);
        router.post(route('admin.presentations.import.images', deck.id), {
            image_files: imageFiles,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowImportMenu(false);
                setImageFiles([]);
            },
            onFinish: () => setIsImporting(false),
        });
    };

    const importEmbedLink = (event) => {
        event.preventDefault();
        const url = embedUrl.trim();
        if (!url) return;

        const nextSlide = {
            ...emptySlide,
            id: null,
            title: embedTitle.trim() || 'Slide Embed',
            layout: 'media',
            content: 'Konten dari link eksternal. Pastikan link sudah public/embed agar bisa dilihat user.',
            media_url: url,
            background: 'dark',
            source_type: 'embed',
            source_meta: { provider: 'external_link' },
            _clientKey: createSlideKey(),
        };

        setSlides((current) => [...current, nextSlide]);
        setActiveIndex(slides.length);
        setEmbedUrl('');
        setEmbedTitle('');
        setShowImportMenu(false);
    };

    const uploadBackgroundImage = async (file) => {
        const formData = new FormData();
        formData.append('background_image', file);

        const response = await fetch(route('admin.presentations.background.upload', deck.id), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': csrfToken(),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Background gagal diupload.');
        }

        const payload = await response.json();
        return payload.url;
    };

    const uploadMedia = async () => {
        if (!mediaFile || !deck) return;

        const formData = new FormData();
        formData.append('media', mediaFile);
        setIsMediaUploading(true);

        try {
            const response = await fetch(route('admin.presentations.media.upload', deck.id), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.message || 'Video gagal diupload.');
            }

            const payload = await response.json();
            updateSlide('media_url', payload.url);
            updateSlide('source_type', 'video');
            setMediaFile(null);
        } catch (error) {
            window.alert(error.message || 'Video gagal diupload.');
        } finally {
            setIsMediaUploading(false);
        }
    };

    const openPresenter = () => {
        if (hasUnsavedChanges && !window.confirm('Perubahan belum disimpan dan tidak akan tampil di mode Present. Tetap buka?')) {
            return;
        }

        router.visit(route('admin.presentations.presenter', deck.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Presentasi Minggu ${moduleContext.week_number || '-'} - ${moduleContext.title || 'Builder'}`} />

            <div className="min-h-screen bg-[#F8F9FB] dark:bg-gray-950">
                {deck && isImporting && (
                    <div className="fixed inset-0 z-[80] grid place-items-center bg-gray-950/45 px-4 backdrop-blur-sm">
                        <div className="w-full max-w-xs rounded-2xl border border-white/20 bg-white p-5 text-center shadow-2xl dark:bg-gray-900">
                            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
                            <h2 className="text-base font-black text-gray-900 dark:text-white">Mengolah file import</h2>
                            <p className="mt-2 text-xs font-bold leading-5 text-gray-500 dark:text-gray-400">
                                Slide sedang dibuat di builder. Setelah selesai, konten baru akan langsung dipilih untuk dicek dan diedit.
                            </p>
                        </div>
                    </div>
                )}

                <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900 lg:px-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <button type="button" onClick={leaveWorkspace} className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">Kembali ke Roadmap</button>
                            <h1 className="mt-0.5 truncate text-lg font-black text-gray-900 dark:text-white">
                                Presentasi Minggu {moduleContext.week_number || '-'}
                            </h1>
                            <p className="truncate text-[11px] font-bold text-gray-400">
                                {moduleContext.program?.title || 'Kelas'} / {moduleContext.title || 'Roadmap Mingguan'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {deck && (
                                <>
                            <select
                                value={deckPlacement}
                                onChange={(event) => {
                                    setDeckPlacement(event.target.value);
                                    if (event.target.value !== 'after_day') setDeckDayId('');
                                }}
                                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            >
                                <option value="opening">Awal minggu</option>
                                <option value="after_day">Setelah Day</option>
                                <option value="closing">Akhir minggu</option>
                            </select>
                            {deckPlacement === 'after_day' && (
                                <select value={deckDayId} onChange={(event) => setDeckDayId(event.target.value)} className="h-9 max-w-44 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="">Pilih Day</option>
                                    {days.map((day) => <option key={day.id} value={day.id}>Day {day.day_number} - {day.title}</option>)}
                                </select>
                            )}
                            <label className="flex h-9 items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 text-[10px] font-black uppercase text-gray-400 dark:border-gray-700 dark:bg-gray-950">
                                Urut
                                <input type="number" min="0" value={deckSortOrder} onChange={(event) => setDeckSortOrder(event.target.value)} className="w-12 border-0 bg-transparent p-0 text-xs font-bold text-gray-800 outline-none dark:text-white" />
                            </label>
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                            <div className="relative">
                                <button type="button" onClick={() => setShowImportMenu((value) => !value)} className="h-9 rounded-xl border border-orange-200 px-3 text-xs font-black text-orange-700 dark:border-orange-900/50 dark:text-orange-300">
                                    {isImporting ? 'Import...' : 'Import'}
                                </button>
                                {showImportMenu && (
                                    <div className="absolute right-0 top-10 z-50 w-[300px] space-y-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                                        <form onSubmit={importPptx} className="space-y-2">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">PPTX Draft</p>
                                                <p className="text-xs font-bold text-gray-500">Maks 25 MB. Tidak convert ke PDF otomatis; dipakai untuk draft editable dan wajib review layout.</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                                                onChange={(event) => setPptxFile(event.target.files?.[0] || null)}
                                                className="w-full text-xs font-bold text-gray-600 file:mr-2 file:rounded-xl file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-orange-700 dark:text-gray-300 dark:file:bg-orange-900/20 dark:file:text-orange-300"
                                            />
                                            <button disabled={!pptxFile || isImporting} className="h-9 w-full rounded-xl bg-orange-600 px-4 text-xs font-black text-white disabled:opacity-50">Import Draft Editable</button>
                                        </form>
                                        <form onSubmit={importPdf} className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">PDF Final</p>
                                                <p className="text-xs font-bold text-gray-500">Maks 50 MB. Disimpan private dan ditampilkan ke user lewat canvas viewer.</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                                                className="w-full text-xs font-bold text-gray-600 file:mr-2 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-emerald-700 dark:text-gray-300 dark:file:bg-emerald-900/20 dark:file:text-emerald-300"
                                            />
                                            <button disabled={!pdfFile || isImporting} className="h-9 w-full rounded-xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-50">Import PDF Final</button>
                                        </form>
                                        <form onSubmit={importImages} className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Gambar</p>
                                                <p className="text-xs font-bold text-gray-500">Maks 5 MB/gambar. Bisa pilih banyak file.</p>
                                            </div>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={(event) => setImageFiles(Array.from(event.target.files || []))}
                                                className="w-full text-xs font-bold text-gray-600 file:mr-2 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-blue-700 dark:text-gray-300"
                                            />
                                            <button disabled={!imageFiles.length || isImporting} className="h-9 w-full rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">Import Gambar</button>
                                        </form>
                                        <form onSubmit={importEmbedLink} className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Link Canva / Google Drive / PPT Online</p>
                                                <p className="text-xs font-bold text-gray-500">Tidak masuk storage. Gunakan link public/embed agar tampil ke user.</p>
                                            </div>
                                            <input
                                                value={embedTitle}
                                                onChange={(event) => setEmbedTitle(event.target.value)}
                                                placeholder="Judul slide opsional"
                                                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                            <input
                                                value={embedUrl}
                                                onChange={(event) => setEmbedUrl(event.target.value)}
                                                placeholder="https://drive.google.com/drive/folders/... atau https://www.canva.com/design/..."
                                                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                            />
                                            <button disabled={!embedUrl.trim()} className="h-9 w-full rounded-xl bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-50">Tambah Link ke Slide</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={openPresenter} className="flex h-9 items-center rounded-xl bg-gray-950 px-3 text-xs font-black text-white dark:bg-white dark:text-gray-950">Present</button>
                            <button type="button" onClick={deleteDeck} className="h-9 rounded-xl border border-red-200 px-3 text-xs font-black text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20">Hapus</button>
                            <button onClick={saveSlides} className="h-9 rounded-xl bg-[#E64A19] px-4 text-xs font-black text-white">Simpan</button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        {(decks || []).map((summary) => {
                            const selected = deck?.id === summary.id;
                            const placementLabel = summary.week_slot === 'closing'
                                ? 'Akhir minggu'
                                : summary.week_slot === 'after_day'
                                    ? `Setelah Day ${summary.day?.day_number || '-'}`
                                    : 'Awal minggu';

                            return (
                                <button
                                    key={summary.id}
                                    type="button"
                                    onClick={() => visitDeck(summary.id)}
                                    className={`min-w-44 rounded-xl border px-3 py-2 text-left transition ${
                                        selected
                                            ? 'border-orange-400 bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300'
                                    }`}
                                >
                                    <span className="block truncate text-xs font-black">{summary.title}</span>
                                    <span className="mt-0.5 block text-[10px] font-semibold opacity-70">
                                        {placementLabel} / {selected ? slides.length : summary.slides_count || 0} slide / {selected && hasUnsavedChanges ? 'belum disimpan' : summary.status}
                                    </span>
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => openCreateDeck('opening')}
                            className="min-w-36 rounded-xl border border-dashed border-orange-300 px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/20"
                        >
                            + Tambah Presentasi
                        </button>
                    </div>
                </header>

                {!deck ? (
                    <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-3xl place-items-center px-4 py-10">
                        <section className="w-full rounded-2xl border border-dashed border-orange-200 bg-white p-6 text-center shadow-sm dark:border-orange-900/50 dark:bg-gray-900 sm:p-10">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-xl font-black text-orange-600 dark:bg-orange-900/20">+</span>
                            <h2 className="mt-4 text-xl font-black text-gray-900 dark:text-white">
                                Tambah Presentasi Mingguan
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-gray-500 dark:text-gray-400">
                                Tentukan posisi presentasi pada perjalanan belajar. Presentasi tidak mengubah syarat kelulusan Day atau ujian.
                            </p>
                            <div className="mx-auto mt-6 grid max-w-lg gap-4 text-left sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">Judul presentasi</span>
                                <input
                                    value={newDeckTitle}
                                    onChange={(event) => setNewDeckTitle(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-800 outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                />
                            </label>
                            <label>
                                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">Penempatan</span>
                                <select value={placement} onChange={(event) => setPlacement(event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                    <option value="opening">Awal minggu</option>
                                    <option value="after_day">Setelah Day</option>
                                    <option value="closing">Akhir minggu</option>
                                </select>
                            </label>
                            {placement === 'after_day' ? (
                                <label>
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">Day patokan</span>
                                    <select value={selectedDayId} onChange={(event) => setSelectedDayId(event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="">Pilih Day</option>
                                        {days.map((day) => <option key={day.id} value={day.id}>Day {day.day_number} - {day.title}</option>)}
                                    </select>
                                </label>
                            ) : (
                                <label>
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">Urutan</span>
                                    <input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                </label>
                            )}
                            {placement === 'after_day' && (
                                <label className="sm:col-start-2">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">Urutan</span>
                                    <input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                </label>
                            )}
                            </div>
                            <button
                                type="button"
                                onClick={createDeck}
                                disabled={!newDeckTitle.trim() || (placement === 'after_day' && !selectedDayId)}
                                className="mt-4 h-11 rounded-xl bg-orange-600 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buat Presentasi
                            </button>
                        </section>
                    </main>
                ) : (
                    <>
                {(deck.source_type || deck.import_status) && (
                    <div className="border-b border-gray-200 bg-white/80 px-3 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 lg:px-4">
                        <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                            deck.source_type === 'pdf'
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
                                : deck.source_type === 'pptx'
                                    ? 'border-orange-100 bg-orange-50 text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200'
                        }`}>
                            {deck.source_type === 'pdf' ? 'Mode PDF Final: user melihat file ini lewat viewer browser.' : null}
                            {deck.source_type === 'pptx' ? 'Mode PPTX Draft: hasil import berupa canvas editable, bukan convert PDF otomatis.' : null}
                            {!['pdf', 'pptx'].includes(deck.source_type) ? 'Mode manual: slide dibuat langsung dari builder.' : null}
                            {deck.import_summary?.note && <span className="ml-2 opacity-75">{deck.import_summary.note}</span>}
                        </div>
                    </div>
                )}

                <main className="grid min-w-0 grid-cols-1 gap-3 overflow-x-hidden p-3 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:p-4">
                    <aside className="min-w-0 space-y-3 lg:sticky lg:top-[68px] lg:self-start">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Slides</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={removeAllSlides} disabled={!slides.length} className="rounded-lg border border-red-100 px-2 py-1.5 text-[11px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/40 dark:hover:bg-red-950/30">Hapus</button>
                                    <button onClick={() => addSlide()} className="rounded-lg bg-orange-50 px-2 py-1.5 text-[11px] font-black text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">Tambah</button>
                                </div>
                            </div>
                            <div className="max-h-[76vh] space-y-2 overflow-y-auto pr-1">
                                {slides.map((slide, index) => (
                                    <button key={slide._clientKey} onClick={() => setActiveIndex(index)} className={`w-full rounded-xl border p-1.5 text-left transition ${activeIndex === index ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-100 bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-950'}`}>
                                        <SlidePreview slide={slide} small />
                                        <p className="mt-1 truncate px-1 text-[11px] font-black text-gray-700 dark:text-gray-200">{index + 1}. {slide.title || 'Untitled'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <section className="min-w-0 space-y-3">
                        {activeSlide ? (
                            <>
                                {activeSlide.layout !== 'pdf' ? (
                                    <FabricSlideCanvas
                                        key={`${activeSlide._clientKey}-${activeSlide.layout}`}
                                        value={activeSlide.canvas_json}
                                        onUploadBackground={uploadBackgroundImage}
                                        transparent={activeSlide.layout === 'media'}
                                        underlay={activeSlide.layout === 'media' ? (
                                            <div className="h-full w-full bg-gray-950">
                                                <EmbedFrame url={activeSlide.media_url} title={activeSlide.title || 'Media'} />
                                            </div>
                                        ) : null}
                                        onChange={({ canvas_json, snapshot_data }) => {
                                            setSlides((current) => current.map((slide, index) => (
                                                index === activeIndex ? { ...slide, canvas_json, snapshot_data } : slide
                                            )));
                                        }}
                                    />
                                ) : (
                                    <PdfCarousel url={activeSlide.media_url || deck.source_file_url} title={activeSlide.title || deck.title} />
                                )}
                                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                    <button onClick={() => moveSlide(-1)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Naik</button>
                                    <button onClick={() => moveSlide(1)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Turun</button>
                                    <button onClick={duplicateSlide} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-black text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Duplicate</button>
                                    <button onClick={removeSlide} className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-[11px] font-black text-red-600 dark:border-red-900/40 dark:bg-gray-900">Hapus</button>
                                </div>
                            </>
                        ) : (
                            <div className="grid min-h-[320px] place-items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                                <button onClick={() => addSlide()} className="rounded-xl bg-[#E64A19] px-5 py-2.5 text-xs font-black text-white">Tambah Slide Pertama</button>
                            </div>
                        )}
                    </section>

                    <aside className="min-w-0 space-y-3 lg:sticky lg:top-[68px] lg:self-start">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                            <button type="button" onClick={() => setShowTemplatePanel((value) => !value)} className="flex w-full items-center justify-between text-left">
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Template</span>
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">{showTemplatePanel ? 'Tutup' : 'Buka'}</span>
                            </button>
                            {showTemplatePanel && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {templates.map((template) => (
                                        <button
                                            key={template.label}
                                            type="button"
                                            onClick={() => addSlide(template)}
                                            className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-left transition hover:border-orange-200 hover:bg-orange-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-orange-900/20"
                                        >
                                            <SlidePreview slide={{ ...emptySlide, ...template }} small />
                                            <span className="mt-2 block truncate text-xs font-black text-gray-800 dark:text-gray-100">{template.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {activeSlide && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                                <button type="button" onClick={() => setShowEditPanel((value) => !value)} className="flex w-full items-center justify-between text-left">
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Edit Slide</span>
                                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-600 dark:bg-gray-800 dark:text-gray-300">{showEditPanel ? 'Tutup' : 'Buka'}</span>
                                </button>
                                {showEditPanel && (
                                <div className="mt-3 space-y-2">
                                    <input value={activeSlide.title || ''} onChange={(event) => updateSlide('title', event.target.value)} placeholder="Judul slide" className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    <select value={activeSlide.layout} onChange={(event) => changeSlideLayout(event.target.value)} className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                        <option value="title">Title</option>
                                        <option value="content">Materi</option>
                                        <option value="vocabulary">Kosakata</option>
                                        <option value="kanji">Kanji</option>
                                        <option value="media">Media</option>
                                        <option value="question">Pertanyaan</option>
                                        <option value="board">Jamboard</option>
                                        <option value="canvas">Canvas</option>
                                    </select>
                                    <textarea value={activeSlide.content || ''} onChange={(event) => updateSlide('content', event.target.value)} placeholder="Catatan atau deskripsi slide." className="min-h-20 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                    {activeSlide.layout === 'media' && (
                                        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950">
                                            <div className="grid grid-cols-2 rounded-lg bg-gray-200 p-1 dark:bg-gray-800">
                                                <button type="button" onClick={() => setMediaMode('link')} className={`rounded-md px-2 py-1.5 text-[11px] font-black ${mediaMode === 'link' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Link media</button>
                                                <button type="button" onClick={() => setMediaMode('upload')} className={`rounded-md px-2 py-1.5 text-[11px] font-black ${mediaMode === 'upload' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Upload MP4</button>
                                            </div>
                                            {mediaMode === 'link' ? (
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">YouTube, Google Drive, gambar, atau URL MP4</label>
                                                    <input value={activeSlide.media_url || ''} onChange={(event) => updateSlide('media_url', event.target.value)} placeholder="Tempel link share media di sini" className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                                                    <p className="text-[10px] font-semibold leading-4 text-gray-400">Pastikan link Google Drive dapat dilihat siapa pun yang memiliki link.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input type="file" accept="video/mp4,.mp4" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} className="w-full text-xs font-semibold text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-black file:text-orange-700" />
                                                    <button type="button" onClick={uploadMedia} disabled={!mediaFile || isMediaUploading} className="h-9 w-full rounded-xl bg-orange-600 px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                                                        {isMediaUploading ? 'Mengupload...' : 'Upload video (maks. 50 MB)'}
                                                    </button>
                                                </div>
                                            )}
                                            {activeSlide.media_url && (
                                                <div className="aspect-video overflow-hidden rounded-xl bg-black">
                                                    <EmbedFrame url={activeSlide.media_url} title={activeSlide.title || 'Preview media'} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={activeSlide.background} onChange={(event) => updateSlide('background', event.target.value)} className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white">
                                            {backgroundOptions.map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                        <input type="color" value={activeSlide.accent_color || '#E64A19'} onChange={(event) => updateSlide('accent_color', event.target.value)} className="h-9 w-full rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-700 dark:bg-gray-950" />
                                    </div>
                                    <textarea value={activeSlide.speaker_notes || ''} onChange={(event) => updateSlide('speaker_notes', event.target.value)} placeholder="Catatan sensei, hanya tampil di presenter mode." className="min-h-20 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-950 dark:text-white" />
                                </div>
                                )}
                            </div>
                        )}
                    </aside>
                </main>
                    </>
                )}
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </AuthenticatedLayout>
    );
}
