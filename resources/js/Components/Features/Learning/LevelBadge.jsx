const levelConfig = {
    N5: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Beginner' },
    N4: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Elementary' },
    N3: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Intermediate' },
    N2: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Pre-Advanced' },
    N1: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Advanced' },
};

export default function LevelBadge({ level, showLabel = false, size = 'md', className = '' }) {
    const config = levelConfig[level] || levelConfig.N5;
    const sizes = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs', lg: 'px-4 py-1.5 text-sm' };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-bold border ${config.color} ${sizes[size]} ${className}`}>
            {level}{showLabel && ` · ${config.label}`}
        </span>
    );
}
