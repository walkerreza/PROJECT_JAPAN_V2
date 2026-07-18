import Button from '@/Components/UI/Button';
import ApplicationLogo from '@/Components/Navigation/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

export default function GuestNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { url, props } = usePage();
    const isAuthenticated = Boolean(props.auth?.user);

    const navigationItems = [
        { href: '/', label: 'Beranda' },
        { href: '/pricing', label: 'Harga' },
        { href: '/about', label: 'Tentang Kami' },
        { href: '/roadmap', label: 'Roadmap' },
    ];

    const isActive = (href) => href === '/' ? url === '/' : url.startsWith(href);

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
        <nav className="sticky top-0 z-50 border-b border-gray-200/90 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-4 lg:px-20">
                <ApplicationLogo />
                <ul className="hidden list-none gap-8 md:flex">
                    {navigationItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`relative py-2 text-sm font-medium no-underline transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-red-600 after:transition-transform ${isActive(item.href)
                                    ? 'text-red-600 after:w-full'
                                    : 'text-gray-500 after:w-0 hover:text-red-600 hover:after:w-full'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="hidden items-center gap-3 md:flex">
                    {isAuthenticated ? (
                        <Button href="/dashboard">Buka Dashboard</Button>
                    ) : (
                        <>
                            <Button variant="ghost" href="/login">Masuk</Button>
                            <Button href="/register">Daftar Gratis</Button>
                        </>
                    )}
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
                        {navigationItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className={`rounded-lg px-3 py-2.5 text-sm font-semibold no-underline transition-colors ${isActive(item.href)
                                    ? 'bg-red-50 text-red-600'
                                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className={`mt-3 border-t border-gray-100 pt-4 ${isAuthenticated ? '' : 'grid grid-cols-2 gap-3'}`}>
                        {isAuthenticated ? (
                            <Button href="/dashboard" onClick={closeMenu} className="w-full">Buka Dashboard</Button>
                        ) : (
                            <>
                                <Button variant="outline" href="/login" onClick={closeMenu} className="w-full">Masuk</Button>
                                <Button href="/register" onClick={closeMenu} className="w-full">Daftar Gratis</Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
