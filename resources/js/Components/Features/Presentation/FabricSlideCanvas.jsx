import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, PencilBrush, Rect, Textbox } from 'fabric';
import ConfirmActionDialog, { useConfirmAction } from '@/Components/UI/ConfirmActionDialog';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const colors = ['#111827', '#E64A19', '#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#FFFFFF'];
const backgrounds = ['#FFFFFF', '#FFF7ED', '#F8FAFC', '#ECFEFF', '#F0FDF4', '#FEF2F2', '#111827'];

function isFabricJson(data) {
    return data?.objects?.some((object) => object.type && !object.kind);
}

function canvasSize(value) {
    const width = Number(value?.width);
    const height = Number(value?.height);

    if (width > 0 && height > 0) {
        return {
            width,
            height,
        };
    }

    return {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    };
}

function fitCanvasToFrame(canvas, frame, logicalSize) {
    if (!canvas || !frame) return;

    const width = Math.max(1, frame.clientWidth || logicalSize.width);
    const height = Math.max(1, Math.round(width * (logicalSize.height / logicalSize.width)));

    canvas.setDimensions(logicalSize);
    canvas.setDimensions({ width, height }, { cssOnly: true });
    if (canvas.wrapperEl) {
        canvas.wrapperEl.style.width = `${width}px`;
        canvas.wrapperEl.style.height = `${height}px`;
    }
    canvas.calcOffset();
    canvas.requestRenderAll();
}

function serializeCanvas(canvas) {
    return {
        ...canvas.toJSON(['kind', 'src']),
        width: canvas.getWidth(),
        height: canvas.getHeight(),
        backgroundColor: canvas.backgroundColor || '#ffffff',
        backgroundImageUrl: canvas.backgroundImage?.get('src') || null,
    };
}

export default function FabricSlideCanvas({ value, onChange, readonly = false, onUploadBackground }) {
    const canvasElementRef = useRef(null);
    const canvasFrameRef = useRef(null);
    const fabricRef = useRef(null);
    const isLoadingRef = useRef(false);
    const [mode, setMode] = useState('select');
    const [selectedType, setSelectedType] = useState('');
    const [drawColor, setDrawColor] = useState('#E64A19');
    const [drawSize, setDrawSize] = useState(5);
    const [textColor, setTextColor] = useState('#111827');
    const [fontSize, setFontSize] = useState(34);
    const [shapeFill, setShapeFill] = useState('#FFE4D6');
    const [shapeStroke, setShapeStroke] = useState('#E64A19');
    const [backgroundColor, setBackgroundColor] = useState(value?.backgroundColor || '#FFFFFF');
    const [isUploadingBackground, setIsUploadingBackground] = useState(false);
    const size = canvasSize(value);
    const { confirmState, openConfirm, closeConfirm } = useConfirmAction();

    useEffect(() => {
        const canvas = new Canvas(canvasElementRef.current, {
            width: size.width,
            height: size.height,
            backgroundColor,
            preserveObjectStacking: true,
            selection: !readonly,
        });

        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = Number(drawSize);
        canvas.freeDrawingBrush.color = drawColor;
        canvas.isDrawingMode = false;
        fabricRef.current = canvas;
        fitCanvasToFrame(canvas, canvasFrameRef.current, size);

        const emit = () => {
            if (isLoadingRef.current || readonly) return;
            onChange?.({
                canvas_json: serializeCanvas(canvas),
                snapshot_data: canvas.toDataURL({ format: 'png', multiplier: 1 }),
            });
        };

        canvas.on('object:modified', emit);
        canvas.on('object:removed', emit);
        canvas.on('path:created', emit);
        canvas.on('selection:created', updateSelectionState);
        canvas.on('selection:updated', updateSelectionState);
        canvas.on('selection:cleared', () => setSelectedType(''));

        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []);

    useEffect(() => {
        const frame = canvasFrameRef.current;
        if (!frame) return undefined;

        const observer = new ResizeObserver(() => {
            fitCanvasToFrame(fabricRef.current, frame, size);
        });

        observer.observe(frame);
        fitCanvasToFrame(fabricRef.current, frame, size);

        return () => observer.disconnect();
    }, [size.width, size.height]);

    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.isDrawingMode = mode === 'draw' && !readonly;
        canvas.selection = mode === 'select' && !readonly;
        canvas.getObjects().forEach((object) => {
            object.selectable = mode === 'select' && !readonly;
            object.evented = !readonly;
        });
        canvas.renderAll();
    }, [mode, readonly]);

    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas?.freeDrawingBrush) return;

        canvas.freeDrawingBrush.color = drawColor;
        canvas.freeDrawingBrush.width = Number(drawSize);
    }, [drawColor, drawSize]);

    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        isLoadingRef.current = true;
        const nextSize = canvasSize(value);
        fitCanvasToFrame(canvas, canvasFrameRef.current, nextSize);
        canvas.clear();
        canvas.backgroundColor = value?.backgroundColor || '#ffffff';
        canvas.backgroundImage = null;
        setBackgroundColor(value?.backgroundColor || '#FFFFFF');

        const load = async () => {
            if (isFabricJson(value)) {
                await canvas.loadFromJSON(value);
                canvas.backgroundColor = value?.backgroundColor || canvas.backgroundColor || '#ffffff';
            } else {
                await loadCustomObjects(canvas, value?.objects || []);
            }

            if (value?.backgroundImageUrl) {
                await applyBackgroundImage(canvas, value.backgroundImageUrl);
            }

            canvas.getObjects().forEach((object) => {
                object.selectable = !readonly;
                object.evented = !readonly;
            });
            fitCanvasToFrame(canvas, canvasFrameRef.current, nextSize);
            canvas.renderAll();
            isLoadingRef.current = false;
        };

        load();
    }, [value, readonly]);

    const updateSelectionState = () => {
        const object = fabricRef.current?.getActiveObject();
        if (!object) {
            setSelectedType('');
            return;
        }

        setSelectedType(object.type || object.kind || '');
        if (object.type === 'textbox') {
            setTextColor(object.fill || '#111827');
            setFontSize(object.fontSize || 34);
        }

        if (object.type === 'rect') {
            setShapeFill(object.fill || '#FFE4D6');
            setShapeStroke(object.stroke || '#E64A19');
        }
    };

    const emitManualChange = () => {
        const canvas = fabricRef.current;
        if (!canvas || readonly) return;

        onChange?.({
            canvas_json: serializeCanvas(canvas),
            snapshot_data: canvas.toDataURL({ format: 'png', multiplier: 1 }),
        });
    };

    const addText = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const text = new Textbox('Tulis teks', {
            left: 96,
            top: 96,
            width: 420,
            fontSize: Number(fontSize),
            fill: textColor,
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: '700',
            kind: 'textbox',
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        setMode('select');
        emitManualChange();
    };

    const addShape = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const shape = new Rect({
            left: 120,
            top: 140,
            width: 280,
            height: 120,
            rx: 18,
            ry: 18,
            fill: shapeFill,
            stroke: shapeStroke,
            strokeWidth: 3,
            kind: 'shape',
        });

        canvas.add(shape);
        canvas.setActiveObject(shape);
        setMode('select');
        emitManualChange();
    };

    const updateActiveObject = (styles) => {
        const canvas = fabricRef.current;
        const object = canvas?.getActiveObject();
        if (!canvas || !object) return;

        object.set(styles);
        canvas.requestRenderAll();
        emitManualChange();
    };

    const changeBackgroundImage = async (url) => {
        const canvas = fabricRef.current;
        if (!canvas || !url) return;

        await applyBackgroundImage(canvas, url);
        canvas.requestRenderAll();
        emitManualChange();
    };

    const removeBackgroundImage = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        canvas.backgroundImage = null;
        canvas.requestRenderAll();
        emitManualChange();
    };

    const uploadBackgroundImage = async (event) => {
        const file = event.target.files?.[0] || null;
        event.target.value = '';

        if (!file || !onUploadBackground) return;

        setIsUploadingBackground(true);
        try {
            const url = await onUploadBackground(file);
            await changeBackgroundImage(url);
        } finally {
            setIsUploadingBackground(false);
        }
    };

    const deleteSelected = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const selected = canvas.getActiveObjects();
        if (!selected.length) return;

        selected.forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        setSelectedType('');
        canvas.requestRenderAll();
        emitManualChange();
    };

    const changeBackground = (color) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        setBackgroundColor(color);
        canvas.backgroundColor = color;
        canvas.requestRenderAll();
        emitManualChange();
    };

    const clearCanvas = () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        openConfirm({
            variant: 'danger',
            title: 'Bersihkan Slide?',
            message: 'Semua objek pada canvas slide ini akan dihapus. Background tetap dipertahankan.',
            confirmLabel: 'Iya, Bersihkan',
            details: [
                { label: 'Objek canvas', value: `${canvas.getObjects().length} objek` },
            ],
            onConfirm: () => {
                canvas.getObjects().forEach((object) => canvas.remove(object));
                emitManualChange();
                closeConfirm();
            },
        });
    };

    return (
        <div className="space-y-2.5">
            {!readonly && (
                <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setMode('select')} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${mode === 'select' ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>Pilih/Edit</button>
                        <button type="button" onClick={() => setMode('draw')} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black ${mode === 'draw' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300'}`}>Jamboard</button>
                        <button type="button" onClick={addText} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-black text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Tambah Teks</button>
                        <button type="button" onClick={addShape} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-black text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Tambah Shape</button>
                        <button type="button" onClick={clearCanvas} className="rounded-lg border border-red-100 px-2.5 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30">Bersihkan</button>
                    </div>

                    {mode === 'draw' && (
                    <div className="grid gap-2 xl:grid-cols-3">
                        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-950">
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Jamboard Rich</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {colors.map((item) => (
                                    <button key={`draw-${item}`} type="button" onClick={() => setDrawColor(item)} className={`h-7 w-7 rounded-lg border-2 ${drawColor === item ? 'border-gray-950 ring-2 ring-orange-200 dark:border-white' : 'border-white dark:border-gray-700'}`} style={{ backgroundColor: item }} aria-label={`Warna coretan ${item}`} />
                                ))}
                                <input type="range" min="2" max="34" value={drawSize} onChange={(event) => setDrawSize(event.target.value)} className="w-20 accent-orange-600" />
                                <button type="button" onClick={deleteSelected} disabled={!selectedType} className="h-7 rounded-lg border border-red-100 px-2 text-[10px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/40 dark:hover:bg-red-950/30">
                                    Hapus Objek
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-950">
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Teks</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="color" value={textColor} onChange={(event) => {
                                    setTextColor(event.target.value);
                                    updateActiveObject({ fill: event.target.value });
                                }} className="h-9 w-12 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900" />
                                <input type="number" min="12" max="96" value={fontSize} onChange={(event) => {
                                    setFontSize(event.target.value);
                                    updateActiveObject({ fontSize: Number(event.target.value) });
                                }} className="h-9 w-20 rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                                <button type="button" disabled={selectedType !== 'textbox'} onClick={() => updateActiveObject({ fontWeight: fabricRef.current?.getActiveObject()?.fontWeight === '900' ? '700' : '900' })} className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-black disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">B</button>
                                <button type="button" disabled={selectedType !== 'textbox'} onClick={() => updateActiveObject({ fontStyle: fabricRef.current?.getActiveObject()?.fontStyle === 'italic' ? 'normal' : 'italic' })} className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-black italic disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">I</button>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-950">
                            <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Shape & BG</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="color" value={shapeFill} onChange={(event) => {
                                    setShapeFill(event.target.value);
                                    updateActiveObject({ fill: event.target.value });
                                }} className="h-9 w-12 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900" />
                                <input type="color" value={shapeStroke} onChange={(event) => {
                                    setShapeStroke(event.target.value);
                                    updateActiveObject({ stroke: event.target.value });
                                }} className="h-9 w-12 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900" />
                                {backgrounds.map((item) => (
                                    <button key={`bg-${item}`} type="button" onClick={() => changeBackground(item)} className={`h-8 w-8 rounded-lg border-2 ${backgroundColor === item ? 'border-gray-950 ring-2 ring-orange-200 dark:border-white' : 'border-white dark:border-gray-700'}`} style={{ backgroundColor: item }} aria-label={`Background ${item}`} />
                                ))}
                                <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-black text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                    {isUploadingBackground ? 'Upload...' : 'BG Image'}
                                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadBackgroundImage} disabled={isUploadingBackground} className="hidden" />
                                </label>
                                <button type="button" onClick={removeBackgroundImage} className="h-8 rounded-lg border border-red-100 px-3 text-[11px] font-black text-red-600 hover:bg-red-50 dark:border-red-900/40">
                                    Hapus BG
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            )}
            <div
                ref={canvasFrameRef}
                className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800"
                style={{ aspectRatio: `${size.width} / ${size.height}` }}
            >
                <canvas ref={canvasElementRef} />
            </div>
            <ConfirmActionDialog {...confirmState} onCancel={closeConfirm} />
        </div>
    );
}

async function applyBackgroundImage(canvas, url) {
    try {
        const image = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        const scale = Math.max(
            canvas.getWidth() / Math.max(1, image.width || 1),
            canvas.getHeight() / Math.max(1, image.height || 1),
        );

        image.set({
            left: (canvas.getWidth() - (image.width || 0) * scale) / 2,
            top: (canvas.getHeight() - (image.height || 0) * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            src: url,
        });

        canvas.backgroundImage = image;
    } catch {
        // Keep the current background if the uploaded image cannot be read by Fabric.
    }
}

async function loadCustomObjects(canvas, objects) {
    for (const object of objects) {
        if (object.kind === 'image' && object.src) {
            try {
                const image = await FabricImage.fromURL(object.src, { crossOrigin: 'anonymous' });
                image.set({
                    left: object.left || 0,
                    top: object.top || 0,
                    scaleX: (object.width || image.width || 1) / Math.max(1, image.width || 1),
                    scaleY: (object.height || image.height || 1) / Math.max(1, image.height || 1),
                    kind: 'image',
                    src: object.src,
                });
                canvas.add(image);
            } catch {
                // Ignore unreadable imported images; the admin can re-add assets manually.
            }
            continue;
        }

        if (object.kind === 'textbox') {
            canvas.add(new Textbox(object.text || '', {
                left: object.left || 0,
                top: object.top || 0,
                width: object.width || 420,
                height: object.height || 80,
                fontSize: object.fontSize || 28,
                fill: object.fill || '#111827',
                fontFamily: 'Inter, Arial, sans-serif',
                kind: 'textbox',
            }));
            continue;
        }

        if (object.kind === 'shape') {
            canvas.add(new Rect({
                left: object.left || 0,
                top: object.top || 0,
                width: object.width || 240,
                height: object.height || 120,
                fill: object.fill || '#FFE4D6',
                stroke: object.stroke || '#E64A19',
                strokeWidth: object.strokeWidth || 2,
                kind: 'shape',
            }));
        }
    }
}
