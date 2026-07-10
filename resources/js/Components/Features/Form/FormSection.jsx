export default function FormSection({ title, description, children, className = '' }) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}>
            {(title || description) && (
                <div className="mb-5">
                    {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
            )}
            <div className="space-y-4">{children}</div>
        </div>
    );
}
