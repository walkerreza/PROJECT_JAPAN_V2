import React from 'react';

export default function ArticleBody({ html, className = '' }) {
    return (
        <div
            className={`prose prose-gray max-w-none prose-headings:font-black prose-a:text-red-600 prose-img:rounded-2xl dark:prose-invert ${className}`}
            dangerouslySetInnerHTML={{ __html: html || '<p>Belum ada isi berita.</p>' }}
        />
    );
}
