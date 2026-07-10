export default function ChartCard({ title, subtitle, children, action, className = '' }) {
    return (
        <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 transition-colors ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            <div>{children}</div>
        </div>
    );
}
