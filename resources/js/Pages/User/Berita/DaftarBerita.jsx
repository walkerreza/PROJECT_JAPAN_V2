import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function NewsCard({ item, featured = false }) {
    return (
        <Link
            href={route('user.news.show', item.id)}
            className={`group block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 ${featured ? 'lg:grid lg:grid-cols-[1.15fr_0.85fr]' : ''}`}
        >
            <div className={`relative bg-gray-100 dark:bg-gray-800 ${featured ? 'min-h-[320px]' : 'aspect-[16/10]'}`}>
                {item.thumbnail_url || item.cover_url ? (
                    <img src={item.thumbnail_url || item.cover_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 text-4xl font-black text-red-200 dark:from-gray-800 dark:to-gray-900 dark:text-gray-700">
                        JP
                    </div>
                )}
                {item.is_pinned && (
                    <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                        Disematkan
                    </span>
                )}
            </div>
            <div className={`flex flex-col ${featured ? 'p-8 lg:p-10' : 'p-5'}`}>
                <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <AccessTimeIcon sx={{ fontSize: 15 }} />
                    {item.published_label || 'Japanlingo News'}
                </div>
                <h2 className={`${featured ? 'text-3xl' : 'text-lg'} font-black leading-tight text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400`}>
                    {item.title}
                </h2>
                <p className={`mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400 ${featured ? '' : 'line-clamp-3'}`}>
                    {item.excerpt || 'Baca berita terbaru dari Japanlingo.'}
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm font-black text-red-600 dark:text-red-400">
                    Baca Selengkapnya
                    <ArrowForwardIcon sx={{ fontSize: 17 }} />
                </div>
            </div>
        </Link>
    );
}

export default function NewsIndex({ featured = null, news = { data: [], links: [] } }) {
    const items = news?.data || [];
    const listItems = featured ? items.filter((item) => item.id !== featured.id) : items;

    return (
        <AuthenticatedLayout>
            <Head title="Portal Berita - Japanlingo" />

            <main className="min-h-screen bg-transparent pb-16 dark:bg-gray-950">
                <section className="border-b border-gray-100 bg-gray-50 py-10 dark:border-gray-800 dark:bg-gray-900/40">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-red-600 dark:text-red-400">Japanlingo News</p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-5xl">Portal Berita Jepang</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            Update pembelajaran, informasi platform, dan berita pilihan untuk menemani rutinitas belajar bahasa Jepang.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    {featured && <NewsCard item={featured} featured />}

                    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
                        <div>
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">Berita Terbaru</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {listItems.map((item) => (
                                    <NewsCard key={item.id} item={item} />
                                ))}
                            </div>
                            {items.length === 0 && (
                                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-16 text-center text-sm font-bold text-gray-400 dark:border-gray-800">
                                    Belum ada berita yang dipublish.
                                </div>
                            )}

                            {news?.links && news.links.length > 3 && (
                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {news.links.map((link, index) => (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-xl px-4 py-2 text-sm font-bold ${link.active ? 'bg-red-600 text-white' : 'border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <aside className="space-y-4">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">Topik</h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {['JLPT N3', 'Kanji', 'Grammar', 'Platform Update'].map((item) => (
                                        <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{item}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/20">
                                <h3 className="text-sm font-black text-red-700 dark:text-red-400">Update Belajar</h3>
                                <p className="mt-2 text-sm leading-relaxed text-red-700/80 dark:text-red-300/80">Kembali ke dashboard untuk melanjutkan lesson, quiz, dan streak harian.</p>
                                <Link href={route('user.dashboard')} className="mt-4 inline-flex text-sm font-black text-red-700 dark:text-red-300">Ke Dashboard</Link>
                            </div>
                        </aside>
                    </div>
                </section>
            </main>
        </AuthenticatedLayout>
    );
}
