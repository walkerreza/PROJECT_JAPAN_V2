import Avatar from '@/Components/UI/Avatar';

export default function RecentActivity({ items = [], className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}>
            <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                ) : (
                    items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <Avatar name={item.user} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">{item.user}</span> {item.action}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
