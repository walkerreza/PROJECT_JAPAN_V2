import { Link } from '@inertiajs/react';

const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25',
    secondary: 'bg-gray-900 text-white hover:bg-gray-800',
    outline: 'border border-gray-200 text-gray-700 hover:border-red-600 hover:text-red-600 bg-transparent',
    ghost: 'text-gray-500 hover:text-red-600 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-5 py-2.5 text-sm rounded-lg',
    lg: 'px-7 py-3.5 text-base rounded-xl',
};

export default function Button({ children, variant = 'primary', size = 'md', href, className = '', disabled, ...props }) {
    const classes = `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`;

    if (href) {
        return <Link href={href} className={classes} {...props}>{children}</Link>;
    }

    return <button className={classes} disabled={disabled} {...props}>{children}</button>;
}
