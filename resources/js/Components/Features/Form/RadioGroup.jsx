export default function RadioGroup({ label, name, options = [], value, onChange, error, className = '' }) {
    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
            <div className="flex flex-wrap gap-3">
                {options.map((opt, i) => (
                    <label key={i} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-all text-sm ${value === (opt.value ?? opt) ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                            type="radio"
                            name={name}
                            value={opt.value ?? opt}
                            checked={value === (opt.value ?? opt)}
                            onChange={onChange}
                            className="hidden"
                        />
                        {opt.label ?? opt}
                    </label>
                ))}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
