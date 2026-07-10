import { Link } from '@inertiajs/react';

export default function ApplicationLogo({ className = '' }) {
    return (
        <Link href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Japanlingo" className={`h-10 w-auto ${className}`} />
        </Link>
    );
}
