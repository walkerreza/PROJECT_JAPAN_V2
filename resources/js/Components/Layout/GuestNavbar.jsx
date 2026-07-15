import Button from '@/Components/UI/Button';
import ApplicationLogo from '@/Components/Navigation/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

export default function GuestNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4 lg:px-20">
                <ApplicationLogo />
                <ul className="hidden list-none gap-8 md:flex">
                    <li><Link href="/" className="text-sm font-medium text-gray-500 no-underline transition-colors hover:text-red-600">Beranda</Link></li>
                    <li><Link href="/pricing" className="text-sm font-medium text-gray-500 no-underline transition-colors hover:text-red-600">Harga</Link></li>
                    <li><Link href="/about" className="text-sm font-medium text-gray-500 no-underline transition-colors hover:text-red-600">Tentang Kami</Link></li>
                    <li><Link href="/roadmap" className="text-sm font-medium text-gray-500 no-underline transition-colors hover:text-red-600">Roadmap</Link></li>
                </ul>
                <div className="hidden items-center gap-3 md:flex">
                    <Button variant="ghost" href="/login">Masuk</Button>
                    <Button href="/register">Daftar Gratis</Button>
                </div>
                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 md:hidden"
                    onClick={() => setIsMenuOpen((open) => !open)}
                    aria-expanded={isMenuOpen}
                    aria-controls="guest-mobile-menu"
                    aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                >
                    {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
            </div>

            {isMenuOpen && (
                <div id="guest-mobile-menu" className="border-t border-gray-100 bg-white px-6 py-4 shadow-lg md:hidden">
                    <div className="flex flex-col gap-1">
                        <Link href="/" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-red-50 hover:text-red-600">Beranda</Link>
                        <Link href="/pricing" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-red-50 hover:text-red-600">Harga</Link>
                        <Link href="/about" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-red-50 hover:text-red-600">Tentang Kami</Link>
                        <Link href="/roadmap" onClick={closeMenu} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-red-50 hover:text-red-600">Roadmap</Link>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                        <Button variant="outline" href="/login" onClick={closeMenu} className="w-full">Masuk</Button>
                        <Button href="/register" onClick={closeMenu} className="w-full">Daftar Gratis</Button>
                    </div>
                </div>
            )}
        </nav>
    );
}
