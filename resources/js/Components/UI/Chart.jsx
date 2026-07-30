import React, { useId } from 'react';
import { Legend, ResponsiveContainer, Tooltip } from 'recharts';

function chartVariableStyles(id, config) {
    return Object.entries(config)
        .filter(([, item]) => item?.color || item?.theme)
        .map(([key, item]) => {
            const light = item.theme?.light || item.color;
            const dark = item.theme?.dark || item.color;

            return `[data-chart="${id}"] { --color-${key}: ${light}; } .dark [data-chart="${id}"] { --color-${key}: ${dark}; }`;
        })
        .join('\n');
}

export function ChartContainer({ config = {}, className = '', children }) {
    const generatedId = useId().replace(/:/g, '');
    const id = `chart-${generatedId}`;

    return (
        <div data-chart={id} className={`h-[260px] w-full ${className}`}>
            <style>{chartVariableStyles(id, config)}</style>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;

export function ChartTooltipContent({ active, payload = [], label, labelFormatter, valueFormatter }) {
    if (!active || payload.length === 0) {
        return null;
    }

    return (
        <div className="min-w-36 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs shadow-xl dark:border-gray-700 dark:bg-gray-900">
            {label !== undefined && (
                <p className="mb-2 font-black text-gray-900 dark:text-white">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
            )}
            <div className="space-y-1.5">
                {payload.map((entry) => (
                    <div key={`${entry.name}-${entry.dataKey}`} className="flex items-center justify-between gap-5">
                        <span className="flex items-center gap-2 font-semibold text-gray-500 dark:text-gray-400">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                            {entry.name}
                        </span>
                        <span className="font-black text-gray-900 dark:text-white">
                            {valueFormatter ? valueFormatter(entry.value, entry) : Number(entry.value || 0).toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChartEmpty({ children = 'Belum ada data untuk periode ini.' }) {
    return (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-center text-sm font-bold text-gray-400 dark:border-gray-800">
            {children}
        </div>
    );
}
