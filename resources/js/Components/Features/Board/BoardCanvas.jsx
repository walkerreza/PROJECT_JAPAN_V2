import React, { useEffect, useRef } from 'react';

const drawStroke = (ctx, stroke) => {
    const points = stroke.points || [];
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color || '#111827';
    ctx.lineWidth = stroke.size || 4;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index].x, points[index].y);
    }

    ctx.stroke();
    ctx.restore();
};

export const redrawBoard = (canvas, strokes = []) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => drawStroke(ctx, stroke));
};

export default function BoardCanvas({ strokes = [], className = '', width = 1280, height = 720 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        redrawBoard(canvasRef.current, strokes);
    }, [strokes]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`aspect-video w-full rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 ${className}`}
        />
    );
}
