import React from 'react';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DiamondIcon from '@mui/icons-material/Diamond';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

export const LEAGUE_ICON_OPTIONS = [
    { key: 'bronze_kabuto', label: 'Bronze Kabuto', Icon: ShieldIcon },
    { key: 'silver_shuriken', label: 'Silver Shuriken', Icon: AutoAwesomeIcon },
    { key: 'gold_sakura', label: 'Gold Sakura', Icon: EmojiEventsIcon },
    { key: 'diamond_torii', label: 'Diamond Torii', Icon: DiamondIcon },
    { key: 'amethyst_scroll', label: 'Amethyst Scroll', Icon: HistoryEduIcon },
];

const LEGACY_ICON_MAP = {
    '兜': 'bronze_kabuto',
    '手': 'diamond_torii',
    'å…œ': 'bronze_kabuto',
    'æ‰‹': 'diamond_torii',
};

export function resolveLeagueIconKey(iconKey) {
    return LEGACY_ICON_MAP[iconKey] || iconKey || 'bronze_kabuto';
}

export default function LeagueIcon({ iconKey, className = 'h-5 w-5', iconClassName = 'h-5 w-5', showFrame = false }) {
    const resolvedKey = resolveLeagueIconKey(iconKey);
    const option = LEAGUE_ICON_OPTIONS.find((item) => item.key === resolvedKey) || LEAGUE_ICON_OPTIONS[0];
    const Icon = option.Icon;

    if (!showFrame) {
        return <Icon className={className} />;
    }

    return (
        <span className={className}>
            <Icon className={iconClassName} />
        </span>
    );
}
