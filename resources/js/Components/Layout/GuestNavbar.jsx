import Button from '@/Components/UI/Button';
import ApplicationLogo from '@/Components/Navigation/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

export default function GuestNavbar({ heroTone = 'light' }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const { url, props } = usePage();
    const isAuthenticated = Boolean(props.auth?.user);
    const isHeroPage = ['/', '/about', '/pricing', '/roadmap'].includes(url);
    const isHeroState = isHeroPage && !hasScrolled && !isMenuOpen;
    const usesDarkHero = heroTone === 'dark' && isHeroState;

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

    useEffect(() => {
        if (!isHeroPage) {
            setHasScrolled(true);
            return undefined;
        }

        const updateScrollState = () => setHasScrolled(window.scrollY > 20);
        updateScrollState();
        window.addEventListener('scroll', updateScrollState, { passive: true });

        return () => window.removeEventListener('scroll', updateScrollState);
    }, [isHeroPage]);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className={`relative ${isHeroPage ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${isHeroState ? 'border-white/30 bg-white/35 backdrop-blur-md' : 'border-gray-200/90 bg-white/95 shadow-sm backdrop-blur'}`}>
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-repeat transition-opacity duration-300 ${isHeroState ? 'opacity-0' : 'opacity-100'}`}
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 100%, transparent 0 14px, rgba(220,38,38,0.10) 14px 15px, transparent 16px)',
                    backgroundSize: '44px 22px',
                }}
            />
            <div className="relative flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 lg:px-20">
                <ApplicationLogo className={usesDarkHero ? 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]' : ''} />
                <ul className="hidden list-none items-center gap-7 md:flex lg:gap-8">
                    {navigationItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={`relative py-2 text-sm font-bold no-underline transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-red-600 after:transition-transform ${isActive(item.href)
                                    ? usesDarkHero ? 'text-amber-200 after:bg-amber-300 after:w-full' : 'text-red-600 after:w-full'
                                    : usesDarkHero ? 'text-white/90 after:w-0 hover:text-amber-200 hover:after:w-full' : 'text-gray-700 after:w-0 hover:text-red-600 hover:after:w-full'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="hidden items-center gap-3 md:flex">
                    {isAuthenticated ? (
                            <Button href="/dashboard" className="!rounded-full !px-5">Buka Dashboard</Button>
                    ) : (
                        <>
                            <Button variant="ghost" href="/login" className={usesDarkHero ? '!text-white hover:!bg-white/15 hover:!text-white' : ''}>Masuk</Button>
                            <Button href="/register" className="!rounded-full !px-5 !shadow-[0_8px_18px_rgba(220,38,38,0.22)]">Daftar Gratis</Button>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200/80 bg-white/80 text-gray-700 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 md:hidden"
                    onClick={() => setIsMenuOpen((open) => !open)}
                    aria-expanded={isMenuOpen}
                    aria-controls="guest-mobile-menu"
                    aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                >
                    {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
            </div>

            {isMenuOpen && (
                <div id="guest-mobile-menu" className="border-t border-gray-100 bg-white px-5 py-4 shadow-xl md:hidden">
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
