import Button from '@/Components/UI/Button';
import ApplicationLogo from '@/Components/Navigation/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestNavbar() {
    return (
        <nav className="flex items-center justify-between px-6 lg:px-20 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
            <ApplicationLogo />
            <ul className="hidden md:flex gap-8 list-none">
                <li><Link href="/" className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors no-underline">Beranda</Link></li>
                <li><Link href="/pricing" className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors no-underline">Harga</Link></li>
                <li><Link href="/about" className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors no-underline">Tentang Kami</Link></li>
                <li><Link href="/roadmap" className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors no-underline">Roadmap</Link></li> 
            </ul>
            <div className="flex items-center gap-3">
                <Button variant="ghost" href="/login" className="hidden sm:inline-flex">Masuk</Button>
                <Button href="/register">Daftar Gratis</Button>
            </div>
        </nav>
    );
}
