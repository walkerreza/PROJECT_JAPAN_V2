<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Berita;
use Inertia\Inertia;

class BeritaController extends Controller
{
    public function index()
    {
        $featured = $this->publishedNews()
            ->with('attachments')
            ->first();

        $news = $this->publishedNews()
            ->with('attachments')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (Berita $news) => $this->mapNews($news));

        return Inertia::render('User/Berita/DaftarBerita', [
            'featured' => $featured ? $this->mapNews($featured) : null,
            'news' => $news,
        ]);
    }

    public function show(Berita $news)
    {
        abort_unless($this->isVisibleToStudent($news), 404);

        $related = $this->publishedNews()
            ->whereKeyNot($news->id)
            ->take(4)
            ->get()
            ->map(fn (Berita $item) => $this->mapNews($item));

        return Inertia::render('User/Berita/DetailBerita', [
            'newsItem' => $this->mapNews($news->load('attachments')),
            'relatedNews' => $related,
        ]);
    }

    private function publishedNews()
    {
        return Berita::query()
            ->where('status', 'published')
            ->whereIn('audience', ['all', 'students'])
            ->where(function ($query) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->latest();
    }

    private function isVisibleToStudent(Berita $news): bool
    {
        return $news->status === 'published'
            && in_array($news->audience, ['all', 'students'], true)
            && (! $news->starts_at || $news->starts_at->lte(now()))
            && (! $news->ends_at || $news->ends_at->gte(now()));
    }

    private function mapNews(Berita $news): array
    {
        $thumbnailUrl = $news->thumbnailUrl();

        return [
            'id' => $news->id,
            'title' => $news->title,
            'excerpt' => $news->excerpt,
            'body' => $news->body,
            'is_pinned' => $news->is_pinned,
            'published_at' => optional($news->published_at)->toIso8601String(),
            'published_label' => optional($news->published_at)->translatedFormat('d F Y'),
            'thumbnail_url' => $thumbnailUrl,
            'cover_url' => $thumbnailUrl,
            'attachments' => $news->attachments->map(fn ($attachment) => [
                'id' => $attachment->id,
                'file_name' => $attachment->file_name,
                'file_type' => $attachment->file_type,
                'url' => $attachment->file_path ? asset("storage/{$attachment->file_path}") : null,
                'video_embed_url' => $attachment->video_embed_url,
            ])->values(),
        ];
    }
}
