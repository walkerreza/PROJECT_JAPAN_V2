// ============================================================
// TEMA WARNA JAPANLINGO
// Ganti nilai ACTIVE_THEME untuk switch tema:
//   'spring' | 'autumn' | 'winter' | 'summer'
// ============================================================

export const DEFAULT_THEME = 'spring';

const getGlobalThemeConfig = () => {
    if (typeof window === 'undefined') {
        return { activeTheme: DEFAULT_THEME, customTheme: {} };
    }

    return window.__JAPANLINGO_THEME__ || { activeTheme: DEFAULT_THEME, customTheme: {} };
};

const getGlobalThemeName = () => {
    if (typeof window === 'undefined') return DEFAULT_THEME;

    return getGlobalThemeConfig().activeTheme || DEFAULT_THEME;
};

const getGlobalCustomTheme = () => {
    const customTheme = getGlobalThemeConfig().customTheme;
    return customTheme && typeof customTheme === 'object' ? customTheme : {};
};

export const THEME_PRESETS = {

    // 🌸 SPRING (Sakura)
    spring: {
        heroBg: 'from-pink-600 via-rose-500 to-pink-700',
        heroBlob1: 'bg-pink-200',
        heroBlob2: 'bg-rose-100',
        heroAccent: 'text-pink-600',
        sectionBg: 'bg-pink-50',
        pathGrad: ['#F9A8D4', '#FBCFE8', '#E5E5E5'],
        doneColor: '#EC4899',
        doneShadow: '#BE185D',
        activeColor: '#F472B6',
        activeShadow: '#DB2777',
        ctaBg: 'from-pink-500 to-rose-600',
        statBg: 'bg-pink-900',
        statAccent: 'text-pink-300',
        featureBgs: [
            'bg-pink-50 border-pink-100',
            'bg-rose-50 border-rose-100',
            'bg-fuchsia-50 border-fuchsia-100',
        ],
        // landing page
        landingHeroBg: 'bg-[#FDFEFE]',
        landingGradText: 'from-pink-500 via-rose-400 to-pink-600',
        landingBadgeBg: 'bg-pink-50 border-pink-100',
        landingBadgeDot: 'bg-pink-500',
        landingBadgeText: 'text-pink-600',
        landingGlow: 'from-pink-100/40 to-rose-100/40',
        landingCardGlow: 'bg-pink-100/50',
        landingHighlightBorder: 'border-2 border-pink-400 shadow-2xl scale-105 z-10',
        landingHighlightBadge: 'bg-pink-500',
        landingHighlightBtn: '!bg-pink-500',
        landingHighlightLevel: 'bg-pink-50 text-pink-600',
        landingLeagueBg: 'bg-pink-500',
        landingCtaBg: 'bg-gray-900',
        landingProBg: 'bg-pink-500',
    },

    // 🍂 AUTUMN (Musim Gugur)
    autumn: {
        heroBg: 'from-orange-600 via-amber-500 to-red-600',
        heroBlob1: 'bg-orange-200',
        heroBlob2: 'bg-red-100',
        heroAccent: 'text-orange-600',
        sectionBg: 'bg-amber-50',
        pathGrad: ['#F97316', '#EF4444', '#E5E5E5'],
        doneColor: '#F97316',
        doneShadow: '#C2410C',
        activeColor: '#EF4444',
        activeShadow: '#B91C1C',
        ctaBg: 'from-orange-500 to-red-600',
        statBg: 'bg-orange-900',
        statAccent: 'text-orange-300',
        featureBgs: [
            'bg-orange-50 border-orange-100',
            'bg-amber-50 border-amber-100',
            'bg-red-50 border-red-100',
        ],
        landingHeroBg: 'bg-[#FFFBF7]',
        landingGradText: 'from-orange-600 via-amber-500 to-red-600',
        landingBadgeBg: 'bg-orange-50 border-orange-100',
        landingBadgeDot: 'bg-orange-600',
        landingBadgeText: 'text-orange-700',
        landingGlow: 'from-orange-100/40 to-red-100/40',
        landingCardGlow: 'bg-orange-100/50',
        landingHighlightBorder: 'border-2 border-orange-500 shadow-2xl scale-105 z-10',
        landingHighlightBadge: 'bg-orange-500',
        landingHighlightBtn: '!bg-orange-500',
        landingHighlightLevel: 'bg-orange-50 text-orange-600',
        landingLeagueBg: 'bg-orange-600',
        landingCtaBg: 'bg-stone-900',
        landingProBg: 'bg-orange-600',
    },

    // ❄️ WINTER (Salju) — Biru/Cyan/Indigo
    winter: {
        heroBg: 'from-sky-600 via-blue-500 to-indigo-700',
        heroBlob1: 'bg-sky-200',
        heroBlob2: 'bg-indigo-100',
        heroAccent: 'text-sky-600',
        sectionBg: 'bg-sky-50',
        pathGrad: ['#38BDF8', '#818CF8', '#E5E5E5'],
        doneColor: '#0EA5E9',
        doneShadow: '#0369A1',
        activeColor: '#6366F1',
        activeShadow: '#4338CA',
        ctaBg: 'from-sky-500 to-indigo-600',
        statBg: 'bg-indigo-950',
        statAccent: 'text-sky-300',
        featureBgs: [
            'bg-sky-50 border-sky-100',
            'bg-blue-50 border-blue-100',
            'bg-indigo-50 border-indigo-100',
        ],
        landingHeroBg: 'bg-[#F5F8FF]',
        landingGradText: 'from-sky-500 via-blue-400 to-indigo-600',
        landingBadgeBg: 'bg-sky-50 border-sky-100',
        landingBadgeDot: 'bg-sky-500',
        landingBadgeText: 'text-sky-600',
        landingGlow: 'from-sky-100/40 to-indigo-100/40',
        landingCardGlow: 'bg-sky-100/50',
        landingHighlightBorder: 'border-2 border-sky-500 shadow-2xl scale-105 z-10',
        landingHighlightBadge: 'bg-sky-600',
        landingHighlightBtn: '!bg-sky-600',
        landingHighlightLevel: 'bg-sky-50 text-sky-600',
        landingLeagueBg: 'bg-sky-600',
        landingCtaBg: 'bg-slate-900',
        landingProBg: 'bg-sky-600',
    },

    // 🏮 SUMMER (Festival)
    summer: {
        heroBg: 'from-emerald-600 via-teal-500 to-emerald-800',
        heroBlob1: 'bg-yellow-200',
        heroBlob2: 'bg-emerald-100',
        heroAccent: 'text-emerald-600',
        sectionBg: 'bg-green-50',
        pathGrad: ['#10B981', '#F59E0B', '#E5E5E5'],
        doneColor: '#10B981',
        doneShadow: '#065F46',
        activeColor: '#F59E0B',
        activeShadow: '#B45309',
        ctaBg: 'from-emerald-500 to-teal-600',
        statBg: 'bg-emerald-900',
        statAccent: 'text-emerald-300',
        featureBgs: [
            'bg-green-50 border-green-100',
            'bg-emerald-50 border-emerald-100',
            'bg-yellow-50 border-yellow-100',
        ],
        landingHeroBg: 'bg-[#F5FFF9]',
        landingGradText: 'from-emerald-500 via-teal-400 to-green-600',
        landingBadgeBg: 'bg-green-50 border-green-100',
        landingBadgeDot: 'bg-emerald-500',
        landingBadgeText: 'text-emerald-700',
        landingGlow: 'from-emerald-100/40 to-teal-100/40',
        landingCardGlow: 'bg-emerald-100/50',
        landingHighlightBorder: 'border-2 border-emerald-500 shadow-2xl scale-105 z-10',
        landingHighlightBadge: 'bg-emerald-500',
        landingHighlightBtn: '!bg-emerald-500',
        landingHighlightLevel: 'bg-emerald-50 text-emerald-700',
        landingLeagueBg: 'bg-emerald-600',
        landingCtaBg: 'bg-gray-900',
        landingProBg: 'bg-emerald-600',
    },
};

const storedThemeName = getGlobalThemeName();
export const ACTIVE_THEME = THEME_PRESETS[storedThemeName] ? storedThemeName : DEFAULT_THEME;

export default {
    ...(THEME_PRESETS[ACTIVE_THEME] || THEME_PRESETS[DEFAULT_THEME]),
    ...getGlobalCustomTheme(),
};
