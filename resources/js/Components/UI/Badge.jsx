const colors = {
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-red-50 text-red-600',
    yellow: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
};

export default function Badge({ children, color = 'red', className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]} ${className}`}>
            {children}
        </span>
    );
}
