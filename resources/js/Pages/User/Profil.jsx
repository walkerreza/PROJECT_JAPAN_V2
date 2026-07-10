import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { KabutoIcon, ShurikenIcon, HitodamaIcon, ScrollIcon } from '@/Components/JapaneseIcons';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ConfirmActionDialog from '@/Components/UI/ConfirmActionDialog';
import { motion, AnimatePresence } from 'framer-motion';
import theme from '@/Components/theme/themes';

import PersonIcon from '@mui/icons-material/Person';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BoltIcon from '@mui/icons-material/Bolt';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockIcon from '@mui/icons-material/Lock';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const LEAGUE_TIERS = [
    { name: 'Bronze',   color: 'text-amber-700 dark:text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  bar: 'bg-amber-500',  icon: <KabutoIcon className="w-5 h-5 text-amber-700" />, min: 0     },
    { name: 'Silver',   color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/50',  bar: 'bg-slate-500',  icon: <KabutoIcon className="w-5 h-5 text-slate-400" />, min: 500   },
    { name: 'Gold',     color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', bar: 'bg-yellow-500', icon: <KabutoIcon className="w-5 h-5 text-yellow-500" />, min: 2000  },
    { name: 'Diamond',  color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20',   bar: 'bg-red-500',   icon: <ShurikenIcon className="w-5 h-5 text-cyan-400 animate-pulse" />, min: 5000  },
    { name: 'Amethyst', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', bar: 'bg-purple-500', icon: <ShurikenIcon className="w-5 h-5 text-purple-500 animate-spin" />, min: 12000 },
];

const getLeague = (xp) => {
    const xpNum = parseInt(String(xp).replace(/\D/g, '')) || 0;
    return [...LEAGUE_TIERS].reverse().find(t => xpNum >= t.min) || LEAGUE_TIERS[0];
};

const InputField = ({ label, type = 'text', defaultValue, placeholder, disabled }) => (
    <div>
        <label className="block text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{label}</label>
        <input
            type={type}
            defaultValue={defaultValue}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 focus:border-rose-400 dark:focus:border-rose-500 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed font-medium"
        />
    </div>
);

const JapanesePattern = () => (
    <svg className="absolute inset-0 w-full h-full opacity-5 dark:opacity-[0.03] pointer-events-none text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="jppattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M10 20 L20 10 L30 20 L20 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#jppattern)" />
    </svg>
);

const FloatingSakura = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        y: ['-10vh', '110vh'],
                        x: [
                            `${Math.random() * 100}vw`, 
                            `${Math.random() * 100}vw`
                        ],
                        rotate: [0, 360]
                    }}
                    transition={{
                        duration: 15 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 2,
                    }}
                    className="absolute text-xl opacity-30 dark:opacity-20 drop-shadow-sm"
                >
                    <LocalFireDepartmentIcon className="w-5 h-5 text-pink-500 inline-block" />
                </motion.div>
            ))}
        </div>
    );
};

const transactionTone = (status) => {
    if (status === 'success') {
        return {
            icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400',
            badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
        };
    }

    if (status === 'pending') {
        return {
            icon: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400',
            badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
        };
    }

    return {
        icon: 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400',
        badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400',
    };
};

export default function Profile({ recentTransactions = [] }) {
    const { user } = usePage().props.auth;
    const [activeTab, setActiveTab] = useState('stats');
    const [saved, setSaved] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [themeMode, setThemeMode] = useState(() =>
        typeof window !== 'undefined' ? localStorage.getItem('theme') || 'system' : 'system'
    );
    const accessKeyForm = useForm({ code: '' });
    const deleteAccountForm = useForm({ password: '' });
    const accessStatus = user.access_status || {};
    const transactionInvoices = recentTransactions.map((transaction) => ({
        id: transaction.code,
        date: transaction.created_at_label || 'Tanggal belum tersedia',
        plan: `${transaction.plan}${transaction.scope_label ? ` - ${transaction.scope_label}` : ''}`,
        price: transaction.amount_formatted,
        status: transaction.status === 'success' ? 'Success' : 'Failed',
        statusLabel: transaction.status_label || (transaction.status === 'success' ? 'Berhasil' : 'Gagal'),
    }));

    const handleThemeChange = (val) => {
        setThemeMode(val);
        localStorage.setItem('theme', val);
        window.dispatchEvent(new Event('storage'));
        if (val === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (val === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const submitAccessKey = (event) => {
        event.preventDefault();
        accessKeyForm.post(route('profile.access-keys.redeem'), {
            preserveScroll: true,
            onSuccess: () => accessKeyForm.reset(),
        });
    };

    const deleteAccount = () => {
        deleteAccountForm.delete(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(false);
                deleteAccountForm.reset();
            },
        });
    };

    const xp = user.xp || 0;
    const streak = user.streak_count || 0;
    const isPrem = Boolean(accessStatus.is_premium ?? user.subscription_status === 'premium');
    const shouldShowUpgrade = accessStatus.should_show_upgrade ?? !isPrem;
    const activeUntilLabel = accessStatus.active_until_label;
    const league = getLeague(xp);

    const currentTierIndex = LEAGUE_TIERS.findIndex(t => t.name === league.name);
    const nextTier = LEAGUE_TIERS[currentTierIndex + 1];
    const progressPct = nextTier 
        ? Math.min(100, Math.round(((xp - league.min) / (nextTier.min - league.min)) * 100))
        : 100;

    return (
        <AuthenticatedLayout header={false}>
            <Head title={`Profil ${user.username} — Japanlingo`} />

            <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 py-10 px-4 sm:px-6 relative overflow-hidden transition-colors duration-300">
                <JapanesePattern />
                <FloatingSakura />
                
                {/* Kanji Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] font-black text-gray-900/[0.03] dark:text-white/[0.02] pointer-events-none select-none z-0 tracking-tighter">
                    学
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    
                    {/* Bento Grid Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* ── SIDEBAR KIRI ── */}
                        <div className="lg:col-span-4 space-y-6">
                            
                            {/* Card 1: Profil */}
                            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center relative overflow-hidden transition-colors">
                                {isPrem && (
                                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-sm flex items-center gap-1 bg-gradient-to-r ${theme.ctaBg || 'from-amber-400 to-orange-500'}`}>
                                        <WorkspacePremiumIcon sx={{ fontSize: 14 }} /> Premium
                                    </div>
                                )}
                                
                                <div className="relative inline-block mt-4 mb-5">
                                    <div className="w-32 h-32 bg-gradient-to-br from-rose-400 to-pink-500 rounded-[2rem] flex items-center justify-center text-5xl font-black text-white shadow-xl shadow-rose-200 dark:shadow-rose-900/20 group overflow-hidden cursor-pointer"
                                         style={{ border: `2px solid ${theme.activeColor || 'transparent'}` }}>
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            user?.username?.charAt(0).toUpperCase()
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EditIcon sx={{ color: 'white', fontSize: 32 }} />
                                        </div>
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                                        <EditIcon sx={{ fontSize: 18 }} />
                                    </button>
                                </div>

                                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{user.username}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{user.email}</p>
                            </div>

                            {/* Card 2: Menu Navigasi */}
                            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-4 transition-colors">
                                <nav className="flex flex-col gap-2">
                                    {[
                                        { id: 'stats', label: 'Dashboard Profil', icon: <PersonIcon /> },
                                        { id: 'settings', label: 'Pengaturan Akun', icon: <ManageAccountsIcon /> },
                                        { id: 'billing', label: 'Riwayat Tagihan', icon: <ReceiptLongIcon /> },
                                        { id: 'accessKey', label: 'Access Key', icon: <VpnKeyIcon /> },
                                    ].map((item) => (
                                        <button 
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`flex items-center gap-3 w-full px-5 py-4 rounded-2xl text-sm font-black transition-all
                                                ${activeTab === item.id 
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'}`}
                                        >
                                            <span className={`${activeTab === item.id ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {item.icon}
                                            </span>
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                        </div>

                        {/* ── KONTEN KANAN ── */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                
                                {/* ── TAB STATS ── */}
                                {activeTab === 'stats' && (
                                    <motion.div 
                                        key="stats"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="grid grid-cols-2 gap-6"
                                    >
                                        {/* Streak Card */}
                                        <div className="col-span-1 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border border-orange-100 dark:border-orange-500/20 p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden group transition-colors">
                                            <div className="absolute -right-4 -top-4 opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                                                <LocalFireDepartmentIcon sx={{ fontSize: 120, color: '#f97316' }} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="w-12 h-12 bg-white dark:bg-orange-500/20 rounded-2xl shadow-sm flex items-center justify-center text-orange-500 dark:text-orange-400 mb-4">
                                                    <LocalFireDepartmentIcon sx={{ fontSize: 24 }} />
                                                </div>
                                                <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400 tracking-tight">{streak}</h3>
                                                <p className="text-xs font-black text-orange-500/80 dark:text-orange-400/80 uppercase tracking-widest mt-1">Hari Streak</p>
                                            </div>
                                        </div>

                                        {/* XP Card */}
                                        <div className="col-span-1 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-500/20 p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden group transition-colors">
                                            <div className="absolute -right-4 -top-4 opacity-10 dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                                                <BoltIcon sx={{ fontSize: 120, color: '#3b82f6' }} />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="w-12 h-12 bg-white dark:bg-red-500/20 rounded-2xl shadow-sm flex items-center justify-center text-red-500 dark:text-red-400 mb-4">
                                                    <BoltIcon sx={{ fontSize: 24 }} />
                                                </div>
                                                <h3 className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">{xp.toLocaleString()}</h3>
                                                <p className="text-xs font-black text-red-500/80 dark:text-red-400/80 uppercase tracking-widest mt-1">Total XP</p>
                                            </div>
                                        </div>

                                        {/* League / Liga Card */}
                                        <div className="col-span-2 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
                                            <div className="flex items-center gap-2 mb-6">
                                                <EmojiEventsIcon sx={{ color: '#f43f5e' }} />
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg">Perjalanan Liga</h3>
                                            </div>
                                            
                                            <div className="flex items-center gap-6 mb-8">
                                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-inner border border-gray-100 dark:border-gray-700">
                                                    {league.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Liga Saat Ini</p>
                                                    <h4 className={`text-2xl font-black ${league.color}`}>{league.name}</h4>
                                                    {nextTier ? (
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                                                            Sisa <strong className="text-gray-900 dark:text-white">{(nextTier.min - xp).toLocaleString()} XP</strong> untuk naik ke {nextTier.name}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Anda berada di liga tertinggi!</p>
                                                    )}
                                                </div>
                                            </div>

                                            {nextTier && (
                                                <div className="relative">
                                                    <div className="flex justify-between text-xs font-black text-gray-400 dark:text-gray-500 mb-2">
                                                        <span>{league.min.toLocaleString()} XP</span>
                                                        <span>{nextTier.min.toLocaleString()} XP</span>
                                                    </div>
                                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progressPct}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${league.bar}`}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges / Pencapaian Card */}
                                        <div className="col-span-2 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="flex items-center gap-2">
                                                    <MilitaryTechIcon sx={{ color: '#f43f5e' }} />
                                                    <h3 className="font-black text-gray-900 dark:text-white text-lg">Pencapaian</h3>
                                                </div>
                                                <button className="text-sm font-black text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 uppercase tracking-widest">Lihat Semua</button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { icon: <ShurikenIcon className="w-5 h-5 text-emerald-500" />, label: 'Penembak Jitu', desc: '100% Akurasi', color: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' },
                                                    { icon: <ScrollIcon className="w-5 h-5 text-indigo-500" />, label: 'Kutu Buku', desc: '50 Pelajaran', color: 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30' },
                                                    { icon: <HitodamaIcon className="w-5 h-5 text-sky-500" />, label: 'Melesat', desc: 'Selesai < 1 Menit', color: 'bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/30' },
                                                    { icon: <LockIcon className="w-5 h-5" />, label: 'Terkunci', desc: 'Level 10', color: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 grayscale opacity-50' },
                                                ].map((badge, idx) => (
                                                    <div key={idx} className={`p-4 rounded-2xl border flex flex-col items-center text-center ${badge.color}`}>
                                                        <div className="text-3xl mb-3">{badge.icon}</div>
                                                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">{badge.label}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{badge.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── TAB PENGATURAN ── */}
                                {activeTab === 'settings' && (
                                    <motion.div 
                                        key="settings"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
                                            <div className="flex items-center gap-2 mb-6">
                                                <ManageAccountsIcon sx={{ color: '#f43f5e' }} />
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg">Pengaturan Akun</h3>
                                            </div>

                                            <div className="space-y-8">
                                                {/* Penampilan */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Penampilan</h4>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                                <PaletteIcon sx={{ fontSize: 20 }} />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Mode Tampilan</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sesuaikan preferensi visual Anda.</p>
                                                            </div>
                                                        </div>
                                                        <select value={themeMode} onChange={e => handleThemeChange(e.target.value)}
                                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 min-w-[160px] shadow-sm">
                                                            <option value="system">Sistem Default</option>
                                                            <option value="light">Terang Terang</option>
                                                            <option value="dark">Gelap</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Kontak */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Informasi Kontak</h4>
                                                    <InputField label="Alamat Email" type="email" defaultValue={user.email} disabled />
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">Hubungi Admin untuk mengubah alamat email Anda.</p>
                                                </div>

                                                {/* Password */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Ubah Kata Sandi</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="sm:col-span-2">
                                                            <InputField label="Sandi Lama" type="password" placeholder="••••••••" />
                                                        </div>
                                                        <InputField label="Sandi Baru" type="password" placeholder="Minimal 8 karakter" />
                                                        <InputField label="Ulangi Sandi" type="password" placeholder="Konfirmasi sandi baru" />
                                                    </div>
                                                    <div className="mt-6 flex justify-end">
                                                        <button onClick={handleSave}
                                                            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm
                                                                ${saved ? 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900/20' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 dark:shadow-rose-900/20'}`}>
                                                            {saved ? <><CheckCircleIcon sx={{ fontSize: 18 }} /> Tersimpan!</> : 'Simpan Perubahan'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Danger zone */}
                                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-500/20 rounded-[2rem] p-6 sm:p-8 transition-colors">
                                            <div className="flex items-center gap-2 mb-4">
                                                <WarningAmberIcon sx={{ fontSize: 24, color: '#e11d48' }} />
                                                <h3 className="font-black text-rose-700 dark:text-rose-400 text-lg">Zona Berbahaya</h3>
                                            </div>
                                            <p className="text-sm text-rose-600 dark:text-rose-400/90 font-medium leading-relaxed mb-6">
                                                Menghapus akun akan menghilangkan seluruh progres belajar, XP, dan riwayat langganan Anda secara <strong className="font-black">permanen</strong>. Tindakan ini tidak dapat dibatalkan.
                                            </p>
                                            
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirm(true)}
                                                className="px-6 py-3 rounded-xl font-black text-sm text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
                                            >
                                                Hapus Akun Saya
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── TAB TAGIHAN ── */}
                                {activeTab === 'billing' && (
                                    <motion.div 
                                        key="billing"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* Paket Saat Ini */}
                                        <div className={`rounded-[2rem] p-6 sm:p-8 border flex flex-col sm:flex-row sm:items-center gap-6 transition-colors
                                            ${isPrem ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                                            <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl shadow-sm 
                                                ${isPrem ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                  {isPrem ? <WorkspacePremiumIcon sx={{ fontSize: 32 }} /> : <WorkspacePremiumIcon className="w-8 h-8 text-amber-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Paket Saat Ini</p>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white">{isPrem ? 'Akses Aktif' : 'Preview Week 1'}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">
                                                    {isPrem 
                                                        ? (accessStatus.has_full_access ? 'Anda memiliki akses penuh ke seluruh kelas.' : `Anda memiliki akses aktif untuk ${accessStatus.active_program_count || 1} kelas.`)
                                                        : 'Akses Anda terbatas. Upgrade sekarang untuk membuka seluruh pelajaran.'}
                                                </p>
                                                {isPrem && activeUntilLabel && (
                                                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        <WorkspacePremiumIcon sx={{ fontSize: 14 }} /> Masa aktif sampai {activeUntilLabel}
                                                    </p>
                                                )}
                                            </div>
                                            {shouldShowUpgrade && (
                                                <Link href={route('pricing')}
                                                    className={`shrink-0 px-6 py-3.5 rounded-xl text-white font-black text-sm shadow-md shadow-amber-300/40 dark:shadow-amber-900/20 hover:-translate-y-0.5 transition-transform text-center bg-gradient-to-r ${theme.ctaBg || 'from-amber-400 to-orange-500'}`}>
                                                    {isPrem ? 'Perpanjang Akses' : 'Tingkatkan Akses'}
                                                </Link>
                                            )}
                                        </div>

                                        {/* Riwayat */}
                                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
                                            <div className="flex items-center gap-2 mb-6">
                                                <ReceiptLongIcon sx={{ color: '#f43f5e' }} />
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg">Riwayat Transaksi</h3>
                                            </div>

                                            <div className="space-y-3">
                                                {transactionInvoices.map((inv, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${inv.status === 'Success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400'}`}>
                                                                {inv.status === 'Success' ? <CheckCircleIcon /> : <WarningAmberIcon />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm">{inv.plan}</h4>
                                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{inv.id} • {inv.date}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-1 pl-16 sm:pl-0">
                                                            <p className="font-black text-gray-900 dark:text-white">{inv.price}</p>
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                                                ${inv.status === 'Success' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'}`}>
                                                                {inv.statusLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {transactionInvoices.length === 0 && (
                                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center dark:border-gray-800 dark:bg-gray-950/60">
                                                        <ReceiptLongIcon sx={{ fontSize: 36 }} className="text-gray-300 dark:text-gray-700" />
                                                        <p className="mt-3 text-sm font-black text-gray-700 dark:text-gray-200">Belum ada transaksi</p>
                                                        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                                                            Riwayat pembayaran Midtrans atau access key akan tampil di sini.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* TAB ACCESS KEY */}
                                {activeTab === 'accessKey' && (
                                    <motion.div
                                        key="accessKey"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 transition-colors">
                                            <div className="flex items-center gap-2 mb-6">
                                                <VpnKeyIcon sx={{ color: '#f43f5e' }} />
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg">Access Key</h3>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
                                                Masukkan kode dari sensei untuk membuka akses belajar. Form ini dipindah dari dashboard agar halaman awal tetap fokus ke aktivitas belajar.
                                            </p>
                                            {isPrem && activeUntilLabel && (
                                                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                                                    Akses aktif sampai {activeUntilLabel}.
                                                </div>
                                            )}
                                            <form onSubmit={submitAccessKey} className="flex flex-col gap-3 sm:flex-row">
                                                <input
                                                    value={accessKeyForm.data.code}
                                                    onChange={(event) => accessKeyForm.setData('code', event.target.value.toUpperCase())}
                                                    placeholder="JL-XXXX-XXXX"
                                                    className="h-12 flex-1 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-black uppercase tracking-widest text-gray-900 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-rose-900/30"
                                                />
                                                <button disabled={accessKeyForm.processing} className="h-12 rounded-2xl bg-rose-600 px-6 text-sm font-black text-white shadow-lg shadow-rose-500/20 transition-colors hover:bg-rose-700 disabled:opacity-50">
                                                    {accessKeyForm.processing ? 'Mengecek...' : 'Redeem'}
                                                </button>
                                            </form>
                                            {accessKeyForm.errors.access_key && <p className="mt-3 text-xs font-bold text-rose-600">{accessKeyForm.errors.access_key}</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </div>
            </div>
            <ConfirmActionDialog
                show={deleteConfirm}
                variant="danger"
                title="Hapus Akun Permanen?"
                message="Masukkan password akun untuk menghapus akun. Progres belajar, XP, dan riwayat langganan akan ikut terhapus."
                details={[
                    { label: 'Akun', value: user.username },
                    { label: 'Email', value: user.email },
                ]}
                confirmLabel="Ya, Hapus Permanen"
                processing={deleteAccountForm.processing}
                onConfirm={deleteAccount}
                onCancel={() => {
                    setDeleteConfirm(false);
                    deleteAccountForm.reset();
                    deleteAccountForm.clearErrors();
                }}
            >
                <label className="block space-y-2">
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Password</span>
                    <input
                        type="password"
                        value={deleteAccountForm.data.password}
                        onChange={(event) => deleteAccountForm.setData('password', event.target.value)}
                        className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-rose-500/10 dark:border-rose-900/40 dark:bg-gray-950 dark:text-white"
                        placeholder="Masukkan password"
                    />
                    {deleteAccountForm.errors.password && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{deleteAccountForm.errors.password}</p>}
                </label>
            </ConfirmActionDialog>
        </AuthenticatedLayout>
    );
}
