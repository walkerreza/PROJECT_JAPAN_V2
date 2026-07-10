import React, { useRef, useState } from 'react';

const buttonClass = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-700 transition hover:border-orange-300 hover:text-orange-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200';

export default function QuillEditor({ value, onChange, placeholder = 'Tulis konten di sini...', editorMinHeight = '200px', uploadImageUrl = null }) {
    const textareaRef = useRef(null);
    const [preview, setPreview] = useState(false);

    const insertSnippet = (before, after = '') => {
        const textarea = textareaRef.current;
        const currentValue = value || '';

        if (!textarea) {
            onChange(`${currentValue}${before}${after}`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = currentValue.slice(start, end);
        const nextValue = `${currentValue.slice(0, start)}${before}${selected || ''}${after}${currentValue.slice(end)}`;

        onChange(nextValue);

        window.requestAnimationFrame(() => {
            textarea.focus();
            const cursor = start + before.length + (selected ? selected.length : 0);
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    const uploadImage = () => {
        if (!uploadImageUrl) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append(uploadImageUrl.includes('editor-images') ? 'image' : 'file', file);

            const response = await window.axios.post(uploadImageUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data?.url) {
                insertSnippet(`<img src="${response.data.url}" alt="">`);
            }
        };
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<h2>', '</h2>')}>H2</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<p>', '</p>')}>P</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<strong>', '</strong>')}>B</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<em>', '</em>')}>I</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<ul><li>', '</li></ul>')}>List</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<blockquote>', '</blockquote>')}>Quote</button>
                <button type="button" className={buttonClass} onClick={() => insertSnippet('<a href="https://">', '</a>')}>Link</button>
                {uploadImageUrl && <button type="button" className={buttonClass} onClick={uploadImage}>Image</button>}
                <button type="button" className={buttonClass} onClick={() => setPreview((state) => !state)}>{preview ? 'Edit' : 'Preview'}</button>
            </div>

            {preview ? (
                <div
                    className="prose prose-orange max-w-none p-4 dark:prose-invert"
                    style={{ minHeight: editorMinHeight }}
                    dangerouslySetInnerHTML={{ __html: value || '<p class="text-gray-400">Belum ada konten.</p>' }}
                />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={value || ''}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="block w-full resize-y border-0 bg-white p-4 text-sm leading-7 text-gray-900 outline-none focus:ring-0 dark:bg-gray-950 dark:text-gray-100"
                    style={{ minHeight: editorMinHeight }}
                />
            )}
        </div>
    );
}
