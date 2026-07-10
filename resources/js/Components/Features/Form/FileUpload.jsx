import { useState } from 'react';

export default function FileUpload({ label, accept, error, onChange, className = '' }) {
    const [fileName, setFileName] = useState('');

    const handleChange = (e) => {
        const file = e.target.files[0];
        setFileName(file ? file.name : '');
        onChange?.(e);
    };

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-red-600 hover:bg-red-50/30 transition-all">
                <span className="text-2xl">📁</span>
                <div>
                    <p className="text-sm font-medium text-gray-700">{fileName || 'Click to upload'}</p>
                    <p className="text-xs text-gray-400">{accept || 'Any file type'}</p>
                </div>
                <input type="file" accept={accept} onChange={handleChange} className="hidden" />
            </label>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
