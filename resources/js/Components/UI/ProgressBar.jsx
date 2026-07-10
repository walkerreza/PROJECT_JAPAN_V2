const colors = {
    red: 'bg-red-600',
    green: 'bg-green-500',
    blue: 'bg-red-500',
    yellow: 'bg-amber-500',
    gradient: 'bg-gradient-to-r from-red-500 to-amber-500',
};

export default function ProgressBar({ value = 0, max = 100, color = 'red', showLabel = false, size = 'md', className = '' }) {
    const percent = Math.min(Math.round((value / max) * 100), 100);
    const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

    return (
        <div className={className}>
            {showLabel && (
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{value}/{max}</span>
                    <span>{percent}%</span>
                </div>
            )}
            <div className={`${heights[size]} bg-gray-100 rounded-full overflow-hidden`}>
                <div className={`h-full rounded-full transition-all duration-700 ${colors[color]}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}
