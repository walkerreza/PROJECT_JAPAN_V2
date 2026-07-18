import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '@/Components/theme/themes';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import QuizIcon from '@mui/icons-material/Quiz';
import LayersIcon from '@mui/icons-material/Layers';
import ShieldIcon from '@mui/icons-material/Shield';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SchoolIcon from '@mui/icons-material/School';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import StyleIcon from '@mui/icons-material/Style';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

// Ikon Bawah
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SettingsIcon from '@mui/icons-material/Settings';
import { KabutoIcon } from '@/Components/JapaneseIcons';

const resolveThemeMode = () => {
    if (typeof window === 'undefined') {
        return 'system';
    }

    return window.localStorage.getItem('theme') || 'system';
};

const shouldUseDarkMode = (mode) => {
    if (typeof window === 'undefined') {
        return false;
    }

    if (mode === 'dark') {
        return true;
    }

    if (mode === 'light') {
        return false;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

const applyDocumentTheme = (mode = resolveThemeMode()) => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', shouldUseDarkMode(mode));
};

export default function AuthenticatedLayout({ children }) {
    const { user } = usePage().props.auth;
    const flash = usePage().props.flash || {};
    const flashNotice = [
        ['error', flash.error],
        ['warning', flash.warning],
        ['success', flash.success],
        ['info', flash.info],
    ].find(([, message]) => typeof message === 'string' && message.trim().length > 0);
    const flashNoticeStyle = {
        error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/70 dark:text-red-100',
        warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/70 dark:text-amber-100',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/70 dark:text-emerald-100',
        info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/70 dark:text-sky-100',
    };
    const flashNoticeLabel = {
        error: 'Tidak bisa melanjutkan',
        warning: 'Perhatian',
        success: 'Berhasil',
        info: 'Informasi',
    };
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [themeMode, setThemeMode] = useState(resolveThemeMode);
    const [isExpanded, setIsExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenuGroups, setOpenMenuGroups] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);

    const [toastAchievements, setToastAchievements] = useState([]);

    useEffect(() => {
        const syncTheme = () => {
            const mode = resolveThemeMode();
            setThemeMode(mode);
            applyDocumentTheme(mode);
        };
        const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

        syncTheme();
        window.addEventListener('storage', syncTheme);
        mediaQuery?.addEventListener?.('change', syncTheme);

        return () => {
            window.removeEventListener('storage', syncTheme);
            mediaQuery?.removeEventListener?.('change', syncTheme);
        };
    }, []);

    const toggleThemeMode = () => {
        const nextMode = shouldUseDarkMode(themeMode) ? 'light' : 'dark';

        window.localStorage.setItem('theme', nextMode);
        setThemeMode(nextMode);
        applyDocumentTheme(nextMode);
        window.dispatchEvent(new CustomEvent('japanlingo:theme-changed', { detail: { mode: nextMode } }));
    };

    useEffect(() => {
        if (flash.achievement_unlocked) {
            setToastAchievements((prev) => [...prev, flash.achievement_unlocked]);
            setTimeout(() => {
                setToastAchievements((prev) => prev.filter((a) => a.id !== flash.achievement_unlocked.id));
            }, 5000);
        }
    }, [flash.achievement_unlocked]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        if (user?.role) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setProfileMenuOpen(false);
                setNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsExpanded(true);
                return;
            }

            setMobileOpen(false);
            setProfileMenuOpen(false);
            setNotificationOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!mobileOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
            mobileMenuButtonRef.current?.focus();
        };
    }, [mobileOpen]);

    const handleMarkAsRead = (id, url = null) => {
        router.post(route('notifications.read', id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setNotifications(notifications.filter(n => n.id !== id));
                setUnreadCount(Math.max(0, unreadCount - 1));
                setNotificationOpen(false);

                if (url) {
                    router.visit(url);
                }
            }
        });
    };

    const handleMarkAllAsRead = () => {
        router.post(route('notifications.readAll'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setNotifications([]);
                setUnreadCount(0);
            }
        });
    };

    const notificationTone = (severity = 'info') => {
        const tones = {
            success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
            warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
            danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200',
            info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
        };

        return tones[severity] || tones.info;
    };

    const notificationCategoryLabel = (category = 'system') => {
        const labels = {
            payment: 'Pembayaran',
            access: 'Akses',
            content: 'Konten',
            progress: 'Progress',
            system: 'Sistem',
        };

        return labels[category] || 'Sistem';
    };

    const accessStatus = user?.access_status || {};
    const isPremiumUser = accessStatus.is_premium ?? user?.subscription_status === 'premium';
    const shouldShowUpgrade = accessStatus.should_show_upgrade ?? !isPremiumUser;

    const userMenu = [
        { href: '/user/dashboard', icon: <DashboardIcon sx={{ fontSize: 28 }} />, label: 'Beranda' },
        { href: '/user/kelas', icon: <SchoolIcon sx={{ fontSize: 28 }} />, label: 'Kelas' },
        { href: '/user/leaderboard', icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />, label: 'Peringkat' },
        { href: '/user/progress', icon: <MonitorHeartIcon sx={{ fontSize: 28 }} />, label: 'Progress' },
        ...(shouldShowUpgrade ? [{ href: '/pricing', icon: <RocketLaunchIcon sx={{ fontSize: 24 }} />, label: 'Upgrade', variant: 'upgrade' }] : []),
    ];

    const adminMenu = [
        { href: '/admin/dashboard', icon: <DashboardIcon sx={{ fontSize: 24 }} />, label: 'Beranda' },
        { href: '/admin/users', icon: <PeopleIcon sx={{ fontSize: 24 }} />, label: 'Data Pengguna' },
        {
            type: 'group',
            key: 'learning-structure',
            label: 'Kelas & Modul',
            icon: <SchoolIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/admin/programs', icon: <SchoolIcon sx={{ fontSize: 18 }} />, label: 'Kelas' },
                { href: '/admin/modules', icon: <LayersIcon sx={{ fontSize: 18 }} />, label: 'Modul Mingguan' },
            ],
        },
        {
            type: 'group',
            key: 'learning-content',
            label: 'Konten Belajar',
            icon: <MenuBookIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/admin/presentations', icon: <SlideshowIcon sx={{ fontSize: 18 }} />, label: 'Presentasi / PPT' },
                { href: '/admin/vocabulary', icon: <LibraryBooksIcon sx={{ fontSize: 18 }} />, label: 'Bank Konten N3' },
                { href: '/admin/flashcards', icon: <StyleIcon sx={{ fontSize: 18 }} />, label: 'Flashcard' },
                { href: '/admin/quizzes', icon: <QuizIcon sx={{ fontSize: 18 }} />, label: 'Bank Kuis' },
            ],
        },
        { href: '/admin/gamification', icon: <EmojiEventsIcon sx={{ fontSize: 24 }} />, label: 'Gamifikasi & Pencapaian' },
    ];
    
    const superadminMenu = [
        { href: '/superadmin/dashboard', icon: <DashboardIcon sx={{ fontSize: 24 }} />, label: 'Beranda' },
        {
            type: 'group',
            key: 'superadmin-accounts',
            label: 'Akun & Role',
            icon: <PeopleIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/superadmin/users', icon: <PeopleIcon sx={{ fontSize: 18 }} />, label: 'Data User' },
                { href: '/superadmin/admins', icon: <ShieldIcon sx={{ fontSize: 18 }} />, label: 'Data Admin' },
            ],
        },
        {
            type: 'group',
            key: 'superadmin-content',
            label: 'Konten Belajar',
            icon: <MenuBookIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/superadmin/content', icon: <MonitorHeartIcon sx={{ fontSize: 18 }} />, label: 'News & Konten' },
                { href: '/superadmin/gamification', icon: <EmojiEventsIcon sx={{ fontSize: 18 }} />, label: 'Gamifikasi' },
            ],
        },
        {
            type: 'group',
            key: 'superadmin-operations',
            label: 'Operasional',
            icon: <SchoolIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/superadmin/kloters', icon: <SchoolIcon sx={{ fontSize: 18 }} />, label: 'Kloter' },
                { href: '/superadmin/payments', icon: <WorkspacePremiumIcon sx={{ fontSize: 18 }} />, label: 'Pemasukan' },
                { href: '/superadmin/activity', icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />, label: 'Aktivitas' },
            ],
        },
        {
            type: 'group',
            key: 'superadmin-system',
            label: 'Sistem',
            icon: <SettingsIcon sx={{ fontSize: 24 }} />,
            items: [
                { href: '/superadmin/system', icon: <SettingsIcon sx={{ fontSize: 18 }} />, label: 'Pengaturan Sistem' },
            ],
        },
    ];

    const isSuperadmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin' || isSuperadmin;
    const isUser = user?.role === 'user';
    const activeMenu = isSuperadmin ? superadminMenu : (isAdmin ? adminMenu : userMenu);
    const isActivePath = (href) => typeof window !== 'undefined' && window.location.pathname.startsWith(href);
    const toggleMenuGroup = (key) => {
        if (!isExpanded) {
            setIsExpanded(true);
        }

        setOpenMenuGroups((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };
    const closeMobileMenu = () => {
        setMobileOpen(false);
        setProfileMenuOpen(false);
        setNotificationOpen(false);
    };
    const desktopPopoverPosition = isExpanded ? 'lg:left-[248px]' : 'lg:left-[96px]';
    const renderAdminGroup = (item) => {
        const groupActive = item.items.some((child) => isActivePath(child.href));
        const isOpen = openMenuGroups[item.key] || groupActive;

        return (
            <div key={item.key} className="space-y-1">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        toggleMenuGroup(item.key);
                    }}
                    className={`flex min-h-[52px] w-full ${isExpanded ? 'flex-row items-center justify-start px-4' : 'flex-col items-center justify-center px-1'} rounded-2xl py-3 transition-all ${
                        groupActive
                            ? 'bg-red-50 text-red-700'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                    <span className={`flex shrink-0 items-center justify-center ${isExpanded ? 'mr-3' : 'mb-0.5'} ${groupActive ? 'text-red-600' : ''}`}>
                        {item.icon}
                    </span>
                    <span className={`flex-1 truncate font-bold tracking-tight ${isExpanded ? 'text-left text-[14px]' : 'w-full text-center text-[10px]'} ${groupActive ? 'text-red-700' : ''}`}>
                        {item.label}
                    </span>
                    {isExpanded && (
                        <KeyboardArrowRightIcon
                            sx={{ fontSize: 18 }}
                            className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                    )}
                </button>

                {isOpen && (
                    <div className={`${isExpanded ? 'ml-3 border-l border-gray-200 pl-2 dark:border-gray-800' : 'space-y-1'}`}>
                        {item.items.map((child) => (
                            <SidebarLink
                                key={child.href}
                                href={child.href}
                                icon={child.icon}
                                active={isActivePath(child.href)}
                                isExpanded={isExpanded}
                                className={isExpanded ? 'h-[44px] py-2 text-sm' : 'h-[48px]'}
                            >
                                {child.label}
                            </SidebarLink>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    const renderUpgradeLink = (item) => {
        const active = isActivePath(item.href);

        if (!isExpanded) {
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    preserveState
                    title="Upgrade Premium"
                    className={`group relative mb-2 flex h-[56px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25 transition-all lg:hover:-translate-y-0.5 lg:hover:shadow-xl lg:hover:shadow-orange-500/35 ${active ? 'ring-2 ring-orange-200' : ''}`}
                >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_28%)]" />
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur transition-transform group-hover:scale-110">
                        {item.icon}
                    </span>
                </Link>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href}
                preserveState
                className={`group relative mb-2 block overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 p-[1px] shadow-lg shadow-orange-500/25 transition-all lg:hover:-translate-y-0.5 lg:hover:shadow-xl lg:hover:shadow-orange-500/35 ${active ? 'ring-2 ring-orange-200' : ''}`}
            >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.45),transparent_24%)] opacity-90" />
                <span className="relative flex min-h-[74px] items-center gap-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-900/20 px-4 py-3 text-white">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur transition-transform group-hover:scale-105">
                        {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                            <span className="text-sm font-black leading-none">Upgrade</span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/90 backdrop-blur">Premium</span>
                        </span>
                        <span className="mt-1 block text-[11px] font-bold leading-snug text-white/85">
                            Buka akses belajar
                        </span>
                    </span>
                    <KeyboardArrowRightIcon sx={{ fontSize: 18 }} className="text-white/80 transition-transform group-hover:translate-x-0.5" />
                </span>
            </Link>
        );
    };
    const isDarkModeActive = shouldUseDarkMode(themeMode);
    const renderUtilityControls = (compact = false) => (
        <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
            <button
                type="button"
                onClick={toggleThemeMode}
                aria-label={isDarkModeActive ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
                title={isDarkModeActive ? 'Mode terang' : 'Mode gelap'}
                className={`${compact ? 'h-10 w-10' : 'h-11 px-3'} inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:text-red-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-red-500/40 dark:hover:text-red-300`}
            >
                {isDarkModeActive ? <LightModeIcon sx={{ fontSize: 19 }} /> : <DarkModeIcon sx={{ fontSize: 19 }} />}
                {!compact && <span>{isDarkModeActive ? 'Light' : 'Dark'}</span>}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row w-full overflow-x-clip transition-colors duration-300">
            {/* ====== HEADER MOBILE ====== */}
            <div className="lg:hidden flex min-h-[64px] items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 sticky top-0 z-30 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <button ref={mobileMenuButtonRef} type="button" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi" aria-controls="main-sidebar" aria-expanded={mobileOpen} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-gray-800 dark:hover:text-white">
                        <MenuIcon sx={{ fontSize: 26 }} />
                    </button>
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 text-lg tracking-tight">Japanlingo</span>
                </div>
                <div className="flex items-center gap-2">
                    {renderUtilityControls(true)}
                    <button type="button" onClick={() => setMobileOpen(true)} aria-label="Buka menu akun dan navigasi" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-red-600 text-sm font-black text-white shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            (user?.username || user?.name || "User")?.charAt(0).toUpperCase()
                        )}
                    </button>
                </div>
            </div>

            {/* ====== OVERLAY MOBILE ====== */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Tutup navigasi"
                    className="fixed inset-0 z-40 border-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* ====== SIDEBAR VERTIKAL ====== */}
            <aside id="main-sidebar" aria-label="Navigasi utama" className={`fixed inset-y-0 left-0 z-[80] flex w-[calc(100vw-3rem)] max-w-[20rem] flex-col border-r border-gray-200 bg-gray-100 transition-[transform,width] duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${isExpanded ? 'lg:w-[240px]' : 'lg:w-[88px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                <div className="mb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex h-14 items-center justify-between px-3 lg:hidden">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <img src="/logo.png" alt="Japanlingo" className="h-9 w-9 shrink-0 object-contain" />
                            <span className="truncate text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                                Japanlingo
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={closeMobileMenu}
                            aria-label="Tutup navigasi"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                            <CloseIcon sx={{ fontSize: 22 }} />
                        </button>
                    </div>
                    <div
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`hidden cursor-pointer items-center p-3 transition-all hover:bg-white dark:hover:bg-gray-800 lg:flex ${isExpanded ? 'w-full gap-3 rounded-lg' : 'h-16 justify-center'}`}
                    >
                        <img src="/logo.png" alt="Logo" className={`${isExpanded ? 'h-10 w-10' : 'h-8 w-8'} object-contain transition-all duration-300`} />
                        {isExpanded && (
                            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 text-lg tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
                                Japanlingo
                            </span>
                        )}
                    </div>
                </div>

                <nav className="hide-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-3" onClick={closeMobileMenu}>
                    {activeMenu.map((item, idx) => (
                        item.variant === 'upgrade' ? renderUpgradeLink(item) : item.type === 'group' ? renderAdminGroup(item) : (
                            <SidebarLink 
                                key={idx} 
                                href={item.href} 
                                icon={item.icon} 
                                active={isActivePath(item.href)} 
                                isExpanded={isExpanded}
                            >
                                {item.label}
                            </SidebarLink>
                        )
                    ))}
                </nav>

                <div className={`p-3 flex flex-col ${isExpanded ? 'gap-2 px-4' : 'items-center'} mt-auto border-t border-gray-200/60 dark:border-gray-800 relative`} ref={menuRef}>
                    {/* Lonceng Notifikasi */}
                    <button
                        type="button"
                        onClick={() => { setNotificationOpen(!notificationOpen); setProfileMenuOpen(false); }}
                        className={`relative mb-2 flex min-h-11 w-full items-center ${isExpanded ? 'justify-start px-3' : 'justify-center'} rounded-xl text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200`}
                    >
                        <NotificationsOutlinedIcon sx={{ fontSize: 24 }} />
                        {isExpanded && <span className="ml-3 text-sm font-bold animate-in fade-in slide-in-from-left-2">Notifikasi</span>}
                        {unreadCount > 0 && (
                            <span className={`absolute ${isExpanded ? 'left-7 top-2' : 'top-1.5 right-1.5'} w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900`}></span>
                        )}
                    </button>

                    {/* Popup Notifikasi */}
                    {notificationOpen && (
                        <div className={`absolute bottom-[110px] left-3 right-3 z-50 w-auto max-h-[60dvh] overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] transform origin-bottom-left animate-in fade-in slide-in-from-bottom-5 duration-200 dark:border-gray-800 dark:bg-gray-900 ${desktopPopoverPosition} lg:right-auto lg:w-[320px] lg:max-h-[360px]`}>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 dark:text-white">Notifikasi</h3>
                                {unreadCount > 0 && (
                                    <span onClick={handleMarkAllAsRead} className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Tandai semua dibaca</span>
                                )}
                            </div>
                            <div className="max-h-[calc(60dvh-74px)] overflow-y-auto lg:max-h-[300px]">
                                {unreadCount === 0 ? (
                                    <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs">
                                        Tidak ada notifikasi baru.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} onClick={() => handleMarkAsRead(notif.id, notif.data.url)} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-colors relative group">
                                            <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-red-500 rounded-full group-hover:scale-150 transition-transform"></div>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black mb-2 ${notificationTone(notif.severity || notif.data?.severity)}`}>
                                                {notificationCategoryLabel(notif.category || notif.data?.category)}
                                            </span>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white mb-1 pr-4">{notif.data.title || 'Pemberitahuan Sistem'}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{notif.data.message || 'Silakan cek pembaruan terbaru di dashboard Anda.'}</p>
                                            <p className="text-[9px] font-black text-red-500 dark:text-red-400 mt-2">{notif.created_at}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Avatar Pemicu Popup */}
                    <button
                        type="button"
                        onClick={() => { setProfileMenuOpen(!profileMenuOpen); setNotificationOpen(false); }}
                        className={`relative flex min-h-11 w-full items-center overflow-hidden rounded-2xl ring-2 transition-all focus:outline-none focus-visible:ring-red-500 ${isExpanded ? 'gap-3 border border-gray-200 bg-white px-2 py-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800' : 'justify-center'} ${profileMenuOpen ? 'ring-gray-300 ring-offset-2 dark:ring-gray-600 dark:ring-offset-gray-900' : 'ring-transparent'}`}
                    >
                        <div className={`relative shrink-0 ${isExpanded ? 'w-8 h-8 text-sm' : 'w-[42px] h-[42px] text-xl'} rounded-full bg-red-600 text-white font-black flex items-center justify-center shadow-sm transition-all overflow-hidden`}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                (user?.username || user?.name || "User")?.charAt(0).toUpperCase()
                            )}
                            {isPremiumUser && (
                                <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-amber-400 text-white border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                                    <WorkspacePremiumIcon sx={{ fontSize: 12 }} />
                                </span>
                            )}
                        </div>
                        {isExpanded && (
                            <div className="flex-1 text-left truncate animate-in fade-in slide-in-from-left-2">
                                <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{(user?.username || user?.name || "User")}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">Pengaturan Akun</p>
                            </div>
                        )}
                    </button>

                    {profileMenuOpen && (
                        <div className={`absolute bottom-16 left-3 right-3 z-50 w-auto max-h-[60dvh] overflow-y-auto rounded-2xl border border-gray-100 bg-white text-left shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] transform origin-bottom-left animate-in fade-in slide-in-from-bottom-5 duration-200 dark:border-gray-800 dark:bg-gray-900 ${desktopPopoverPosition} lg:right-auto lg:w-[300px] lg:max-h-[360px]`}>
                            
                            <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm overflow-hidden">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            (user?.username || user?.name || "User")?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-400">{(user?.username || user?.name || "User")}</p>
                                            {isPremiumUser && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    <WorkspacePremiumIcon sx={{ fontSize: 11 }} /> Premium
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                                        {isPremiumUser && accessStatus.active_until_label && (
                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-300 mt-0.5">Masa aktif sampai {accessStatus.active_until_label}</p>
                                        )}
                                    </div>
                                </div>
                                <KeyboardArrowRightIcon sx={{ fontSize: 18 }} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

                            <div className="py-2">
                                <Link href={user?.role === 'superadmin' ? route('superadmin.profile') : user?.role === 'admin' ? route('admin.profile') : route('profile.edit')} className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
                                    <div className="flex items-center gap-3"><SettingsOutlinedIcon sx={{ fontSize: 18 }} className="text-gray-500 dark:text-gray-400" /> Pengaturan profil</div>
                                </Link>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full my-1"></div>

                            <div className="py-1">
                                <Link 
                                    href={route('logout')} 
                                    method="post" 
                                    as="button"
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold"
                                >
                                    <LogoutOutlinedIcon sx={{ fontSize: 18 }} /> Keluar Akun
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <div className={`flex-1 w-full transition-all duration-300 ${isExpanded ? 'lg:ml-[240px]' : 'lg:ml-[88px]'}`}>
                <header className="sticky top-0 z-20 hidden min-h-[64px] items-center justify-between border-b border-gray-200/80 bg-white/85 px-6 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-gray-800 dark:bg-gray-950/80 lg:flex">
                    <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-500 dark:text-red-300">
                            Japanlingo
                        </p>
                        <p className="truncate text-sm font-bold text-slate-600 dark:text-slate-300">
                            Learning workspace
                        </p>
                    </div>
                    {renderUtilityControls(false)}
                </header>
                <main className="min-h-screen bg-slate-50 dark:bg-[#0b1121] text-slate-900 dark:text-slate-100 shadow-[-5px_0_30px_-10px_rgba(0,0,0,0.05)] relative z-0 transition-colors duration-300">
                    {flashNotice && (
                        <div className="pointer-events-none fixed inset-x-3 top-20 z-40 flex justify-center lg:left-[260px] lg:right-6 lg:top-20">
                            <div className={`pointer-events-auto w-full max-w-3xl rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${flashNoticeStyle[flashNotice[0]]}`}>
                                <p className="text-xs font-black uppercase tracking-[0.18em]">
                                    {flashNoticeLabel[flashNotice[0]]}
                                </p>
                                <p className="mt-1 font-semibold leading-6">
                                    {flashNotice[1]}
                                </p>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
                {isUser && (
                    <footer className="border-t border-gray-200/80 bg-white px-4 py-2 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
                            <span>© {new Date().getFullYear()} Japanlingo</span>
                            <Link href={route('about')} className="inline-flex min-h-11 items-center px-2 font-semibold text-gray-600 transition-colors hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:text-red-400 dark:focus-visible:ring-offset-gray-950">
                                Tentang Japanlingo
                            </Link>
                        </div>
                    </footer>
                )}
            </div>

            {toastAchievements.length > 0 && (
                <div className="fixed inset-x-3 top-3 z-[100] flex flex-col gap-3 animate-in sm:inset-x-auto sm:right-6 sm:top-6">
                    {toastAchievements.map((ach, i) => (
                        <div key={i} className="flex w-full min-w-0 items-center gap-3 rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] sm:w-[320px] sm:gap-4 sm:p-5" style={{ animation: `fade-in-slide-up 0.4s ${i * 0.15}s both` }}>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-2xl shadow-lg shadow-amber-400/30 sm:h-14 sm:w-14 sm:text-3xl">
                                {ach.icon || '<KabutoIcon className="w-5 h-5 inline-block text-yellow-500" />'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Lencana Terbuka!</p>
                                <p className="break-words text-sm font-black text-gray-900">{ach.name}</p>
                                <p className="break-words text-xs font-medium text-gray-500">{ach.description}</p>
                                {ach.xp_reward > 0 && <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">+{ach.xp_reward} XP</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html:`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .goog-te-banner-frame,
                .goog-te-gadget,
                .goog-te-balloon-frame,
                #goog-gt-tt {
                    display: none !important;
                }
                body {
                    top: 0 !important;
                }
                iframe.skiptranslate {
                    display: none !important;
                }
                @keyframes fade-in-slide-up {
                    0% { opacity: 0; transform: translateY(10px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-in { animation: fade-in-slide-up 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </div>
    );
}

const SidebarLink = ({ href, active, children, icon, isExpanded, className = '' }) => {
    return (
        <Link
            href={href}
            className={`group flex min-h-[56px] w-full items-center ${isExpanded ? 'flex-row justify-start px-4' : 'flex-col justify-center px-1'} rounded-2xl transition-all duration-200 ${
                active
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20'
                    : 'text-gray-500 lg:hover:-translate-y-0.5 lg:hover:bg-white lg:hover:text-red-700 lg:hover:shadow-md lg:hover:shadow-red-900/5 dark:text-gray-400 lg:dark:hover:bg-gray-800 lg:dark:hover:text-red-300 lg:dark:hover:shadow-black/20'
            } ${className}`}
        >
            <span className={`flex shrink-0 items-center justify-center transition-transform duration-200 lg:group-hover:scale-110 ${isExpanded ? 'mr-3' : 'mb-0.5'} ${active ? 'text-white' : ''}`}>
                {icon}
            </span>
            <span className={`min-w-0 flex-1 truncate tracking-tight ${isExpanded ? 'text-left font-black text-[15px]' : 'w-full text-center font-black text-[11px] leading-tight'} ${active ? 'text-white' : ''}`}>
                {children}
            </span>
        </Link>
    );
};
