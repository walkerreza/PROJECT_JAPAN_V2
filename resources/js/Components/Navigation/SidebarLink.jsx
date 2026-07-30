import { Link } from '@inertiajs/react';

export default function SidebarLink({
    href,
    icon,
    children,
    active = false,
    badge,
    isExpanded = false,
    className = '',
    onNavigate,
}) {
    const label = typeof children === 'string' ? children : undefined;

    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={!isExpanded ? label : undefined}
            title={!isExpanded ? label : undefined}
            onClick={onNavigate}
            className={`group relative mb-1.5 flex min-h-[52px] w-full items-center rounded-xl py-2.5 transition-all duration-200 ${
                isExpanded ? 'flex-row justify-start px-3.5' : 'justify-center px-2'
            } ${
                active
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20'
                    : 'text-gray-500 hover:bg-white hover:text-red-700 hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-300'
            } ${className}`}
        >
            <span className={`flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105 ${isExpanded ? 'mr-3' : ''}`}>
                {icon}
            </span>

            {isExpanded && (
                <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
                    {children}
                </span>
            )}

            {badge && (
                <span className={`absolute ${isExpanded ? 'right-3.5' : 'right-1.5 top-1.5'} rounded-md border border-white bg-yellow-400 px-1 py-0.5 text-[9px] font-black leading-none text-yellow-900 shadow-sm`}>
                    {badge}
                </span>
            )}
        </Link>
    );
}
