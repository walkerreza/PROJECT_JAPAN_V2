import { forwardRef } from 'react';

export default forwardRef(function Input({ type = 'text', label, error, className = '', ...props }, ref) {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            <input
                type={type}
                ref={ref}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 ${error ? 'border-red-500' : 'border-gray-200'} ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
});
