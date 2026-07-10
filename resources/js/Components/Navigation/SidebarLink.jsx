import { Link } from '@inertiajs/react';

export default function SidebarLink({ href, icon, children, active = false, badge, isExpanded = false, className = '' }) {
    return (
        <Link
            href={href}
            preserveState
            className={`flex ${isExpanded ? 'flex-row items-center justify-start px-4' : 'flex-col items-center justify-center px-1'} py-3 mb-1.5 rounded-2xl transition-all relative group h-[52px] ${
                active
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                } ${className}`}
        >
            {/* Ikon Utama */}
            <span className={`flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isExpanded ? 'mr-3' : 'mb-0.5'} ${active ? 'text-red-600' : ''}`}>
                {icon}
            </span>
            
            {/* Teks Label */}
            <span className={`font-bold tracking-tight transition-all duration-300 ${
                isExpanded 
                    ? 'text-[14px] text-left opacity-100 w-auto' 
                    : 'text-[10px] text-center w-full truncate opacity-100'
                } ${active ? 'text-red-700' : ''}`}>
                {children}
            </span>
            
            {/* Lencana Pin (Badge) */}
            {badge && (
                <span className={`absolute ${isExpanded ? 'right-4' : 'top-1 right-2'} bg-yellow-400 text-yellow-900 border border-white text-[9px] font-black px-1 py-0.5 rounded-md leading-none shadow-sm`}>
                    {badge}
                </span>
            )}
        </Link>
    );
}
