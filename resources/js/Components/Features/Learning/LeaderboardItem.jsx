import Avatar from '@/Components/UI/Avatar';

export default function LeaderboardItem({ rank, name, xp, avatar, isCurrentUser = false, className = '' }) {
    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return (
        <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isCurrentUser ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'} ${className}`}>
            <span className="w-8 text-center font-bold text-sm text-gray-500">
                {medals[rank] || rank}
            </span>
            <Avatar src={avatar} name={name} size="sm" />
            <span className={`flex-1 text-sm font-semibold ${isCurrentUser ? 'text-red-600' : 'text-gray-900'}`}>
                {name} {isCurrentUser && '(You)'}
            </span>
            <span className="text-sm font-bold text-gray-600">{xp?.toLocaleString()} XP</span>
        </div>
    );
}
