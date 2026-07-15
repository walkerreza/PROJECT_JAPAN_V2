<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeckPresentasi;
use App\Models\LevelPembelajaran;
use App\Models\LogAktivitas;
use App\Models\Modul;
use App\Models\SlidePresentasi;
use App\Services\AksesPremiumService;
use App\Services\ImportPresentasiGambarService;
use App\Services\ImportPresentasiPdfService;
use App\Services\ImportPresentasiPptxService;
use App\Services\NotifikasiPenggunaService;
use App\Services\PresentasiStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminPresentasiController extends Controller
{
    public function index(Request $request)
    {
        $query = DeckPresentasi::with(['level:id,level_name', 'module:id,title,week_number'])
            ->withCount('slides')
            ->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('module_id') && $request->module_id !== 'all') {
            $query->where('module_id', $request->integer('module_id'));
        }

        return Inertia::render('Admin/Presentasi/ManajemenPresentasi', [
            'decks' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only('search', 'status', 'module_id'),
            'levels' => LevelPembelajaran::orderBy('stage')->get(['id', 'level_name']),
            'modules' => Modul::orderBy('week_number')->orderBy('id')->get(['id', 'title', 'week_number']),
        ]);
    }

    public function store(Request $request, NotifikasiPenggunaService $notifikasi)
    {
        $validated = $this->validateDeck($request);

        $deck = DB::transaction(function () use ($validated) {
            $deck = DeckPresentasi::create($validated);
            $deck->slides()->create([
                'title' => $deck->title,
                'layout' => 'title',
                'content' => $deck->description ?: 'Tulis pembuka presentasi di sini.',
                'background' => 'sunrise',
                'accent_color' => '#E64A19',
                'order' => 0,
            ]);

            return $deck;
        });

        if ($deck->status === 'published' && $deck->module_id) {
            $this->kirimNotifikasiPresentasiTerbit($deck, $notifikasi);
        }

        return redirect()->route('admin.presentations.builder', $deck)->with('success', 'Presentasi berhasil dibuat.');
    }

    public function update(Request $request, DeckPresentasi $presentationDeck, NotifikasiPenggunaService $notifikasi)
    {
        $oldStatus = $presentationDeck->status;
        $presentationDeck->update($this->validateDeck($request));

        if ($oldStatus !== 'published' && $presentationDeck->status === 'published' && $presentationDeck->module_id) {
            $this->kirimNotifikasiPresentasiTerbit($presentationDeck, $notifikasi);
        }

        return redirect()->back()->with('success', 'Presentasi berhasil diperbarui.');
    }

    public function destroy(DeckPresentasi $presentationDeck)
    {
        $presentationDeck->delete();

        return redirect()->back()->with('success', 'Presentasi berhasil dihapus.');
    }

    public function builder(DeckPresentasi $presentationDeck)
    {
        $presentationDeck->load(['level:id,level_name', 'module:id,title', 'slides']);

        return Inertia::render('Admin/Presentasi/BuilderPresentasi', [
            'deck' => $presentationDeck,
        ]);
    }

    public function updateSlides(Request $request, DeckPresentasi $presentationDeck, NotifikasiPenggunaService $notifikasi, PresentasiStorageService $storage)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:draft,published'],
            'slides' => ['present', 'array'],
            'slides.*.id' => ['nullable', 'integer'],
            'slides.*.title' => ['nullable', 'string', 'max:255'],
            'slides.*.layout' => ['required', Rule::in(['title', 'content', 'vocabulary', 'kanji', 'media', 'question', 'board', 'canvas', 'pdf'])],
            'slides.*.content' => ['nullable', 'string'],
            'slides.*.media_url' => ['nullable', 'string', 'max:2048'],
            'slides.*.background' => ['required', Rule::in(['light', 'dark', 'sunrise', 'sakura', 'ocean', 'forest', 'paper', 'grid', 'indigo', 'matcha', 'rose'])],
            'slides.*.accent_color' => ['nullable', 'string', 'max:20'],
            'slides.*.speaker_notes' => ['nullable', 'string'],
            'slides.*.board_data' => ['nullable', 'array'],
            'slides.*.snapshot_data' => ['nullable', 'string'],
            'slides.*.jamboard_data' => ['nullable', 'array'],
            'slides.*.jamboard_snapshot' => ['nullable', 'string'],
            'slides.*.snapshot_url' => ['nullable', 'string', 'max:2048'],
            'slides.*.canvas_json' => ['nullable', 'array'],
            'slides.*.source_type' => ['nullable', 'string', 'max:30'],
            'slides.*.source_meta' => ['nullable', 'array'],
        ]);

        $ids = [];
        $oldStatus = $presentationDeck->status;

        DB::transaction(function () use ($presentationDeck, $validated, $storage, &$ids) {
            $presentationDeck->update(['status' => $validated['status']]);

            foreach ($validated['slides'] as $index => $slide) {
                $snapshotUrl = $storage->storeSnapshotDataUrl($slide['snapshot_data'] ?? null, $presentationDeck->id)
                    ?: ($slide['snapshot_url'] ?? null);

                $model = $presentationDeck->slides()->updateOrCreate(
                    ['id' => $slide['id'] ?? null],
                    [
                        'title' => $slide['title'] ?? null,
                        'layout' => $slide['layout'],
                        'content' => $slide['content'] ?? null,
                        'media_url' => $slide['media_url'] ?? null,
                        'background' => $slide['background'],
                        'accent_color' => $slide['accent_color'] ?? '#E64A19',
                        'speaker_notes' => $slide['speaker_notes'] ?? null,
                        'order' => $index,
                        'source_type' => $slide['source_type'] ?? 'manual',
                        'canvas_json' => $slide['canvas_json'] ?? null,
                        'jamboard_data' => $slide['jamboard_data'] ?? $slide['board_data'] ?? null,
                        'jamboard_snapshot' => $slide['jamboard_snapshot'] ?? null,
                        'snapshot_url' => $snapshotUrl,
                        'source_meta' => $slide['source_meta'] ?? null,
                    ]
                );

                $ids[] = $model->id;
            }

            if (empty($ids)) {
                $presentationDeck->slides()->delete();
            } else {
                $presentationDeck->slides()->whereNotIn('id', $ids)->delete();
            }
        });

        if ($oldStatus !== 'published' && $presentationDeck->fresh()->status === 'published' && $presentationDeck->module_id) {
            $this->kirimNotifikasiPresentasiTerbit($presentationDeck, $notifikasi);
        }

        return redirect()->back()->with('success', 'Slide presentasi berhasil disimpan.');
    }

    public function importPptx(Request $request, DeckPresentasi $presentationDeck, ImportPresentasiPptxService $importer)
    {
        $validated = $request->validate([
            'pptx_file' => ['required', 'file', 'mimes:pptx', 'max:25600'],
        ]);

        $count = $importer->import($presentationDeck, $validated['pptx_file']);

        return redirect()->back()->with('success', "{$count} slide draft berhasil diimport dari PPTX. Ini bukan convert PDF otomatis; cek ulang layout sebelum publish.");
    }

    public function importImages(Request $request, DeckPresentasi $presentationDeck, ImportPresentasiGambarService $importer)
    {
        $validated = $request->validate([
            'image_files' => ['required', 'array', 'min:1', 'max:60'],
            'image_files.*' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $count = $importer->import($presentationDeck, $validated['image_files']);

        return redirect()->back()->with('success', "{$count} gambar berhasil diimport menjadi slide.");
    }

    public function importPdf(Request $request, DeckPresentasi $presentationDeck, ImportPresentasiPdfService $importer)
    {
        $validated = $request->validate([
            'pdf_file' => ['required', 'file', 'mimes:pdf', 'max:51200'],
        ]);

        $count = $importer->import($presentationDeck, $validated['pdf_file']);

        return redirect()->back()->with('success', "{$count} PDF final berhasil diimport. User akan melihatnya lewat canvas viewer tanpa tombol download.");
    }

    public function pdfContent(Request $request, DeckPresentasi $presentationDeck, AksesPremiumService $aksesPremium)
    {
        $presentationDeck->loadMissing('module');

        abort_unless($this->bolehAksesPdf($request, $presentationDeck, $aksesPremium), 403);

        $pdfPath = $presentationDeck->finalPdfPath();

        abort_unless($pdfPath, 404);

        abort_unless(Storage::disk('local')->exists($pdfPath), 404);

        $path = Storage::disk('local')->path($pdfPath);

        $this->catatAksesPdf($request, $presentationDeck);

        return response()->stream(function () use ($path) {
            $handle = fopen($path, 'rb');

            if ($handle === false) {
                return;
            }

            $offset = 0;

            while (! feof($handle)) {
                $chunk = fread($handle, 8192);

                if ($chunk === false || $chunk === '') {
                    break;
                }

                echo $this->xorPdfChunk($chunk, $offset);
                $offset += strlen($chunk);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'X-Japanlingo-Pdf-Transport' => 'xor-v1',
            'X-Japanlingo-Pdf-Size' => (string) filesize($path),
        ]);
    }

    public function uploadBackgroundImage(Request $request, DeckPresentasi $presentationDeck, PresentasiStorageService $storage)
    {
        $validated = $request->validate([
            'background_image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $file = $validated['background_image'];
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $storage->storePublicUpload($file, "presentations/assets/{$presentationDeck->id}/backgrounds", $extension);

        return response()->json([
            'url' => $storage->publicUrl($path),
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
        ]);
    }

    public function saveSlideBoard(Request $request, DeckPresentasi $presentationDeck, SlidePresentasi $presentationSlide)
    {
        abort_unless($presentationSlide->presentation_deck_id === $presentationDeck->id, 404);

        $validated = $request->validate([
            'status' => ['required', 'in:draft,published'],
            'board_data' => ['nullable', 'array'],
            'snapshot_data' => ['nullable', 'string'],
        ]);

        $presentationSlide->update([
            'jamboard_data' => $validated['board_data'] ?? ['strokes' => []],
            'jamboard_snapshot' => $validated['snapshot_data'] ?? null,
        ]);

        $presentationDeck->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Jamboard presentasi berhasil disimpan.');
    }

    public function presenter(DeckPresentasi $presentationDeck)
    {
        $presentationDeck->load(['module:id,title', 'slides']);

        return Inertia::render('Admin/Presentasi/ModePresentasi', [
            'deck' => $presentationDeck,
        ]);
    }

    private function validateDeck(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'level_id' => ['nullable', 'integer', 'exists:levels,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'status' => ['required', 'in:draft,published'],
        ]);
    }

    private function kirimNotifikasiPresentasiTerbit(DeckPresentasi $deck, NotifikasiPenggunaService $notifikasi): void
    {
        $deck->loadMissing('module.programPembelajaran');

        if (! $deck->module) {
            return;
        }

        $url = $deck->module->programPembelajaran
            ? route('user.modul.program.presentasi', $deck->module->programPembelajaran->slug)
            : route('user.kelas.index');

        $notifikasi->kirimKePenggunaYangBisaAksesModul(
            $deck->module,
            'new_presentation',
            'PPT baru tersedia',
            "Presentasi {$deck->title} sudah bisa dibuka.",
            $url,
            ['presentation_deck_id' => $deck->id, 'module_id' => $deck->module_id]
        );
    }

    private function bolehAksesPdf(Request $request, DeckPresentasi $deck, AksesPremiumService $aksesPremium): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (in_array($user->role, ['admin', 'superadmin'], true)) {
            return true;
        }

        if ($user->role !== 'user' || $deck->status !== 'published' || ! $deck->module) {
            return false;
        }

        return $aksesPremium->bolehAksesModul($user, $deck->module);
    }

    private function catatAksesPdf(Request $request, DeckPresentasi $deck): void
    {
        $user = $request->user();

        if (! $user || $user->role !== 'user') {
            return;
        }

        $recentExists = LogAktivitas::where('actor_id', $user->id)
            ->where('action', 'presentation_pdf_view')
            ->where('target_type', 'presentation_deck')
            ->where('target_id', $deck->id)
            ->where('created_at', '>=', now()->subMinutes(10))
            ->exists();

        if ($recentExists) {
            return;
        }

        LogAktivitas::create([
            'actor_id' => $user->id,
            'action' => 'presentation_pdf_view',
            'target_type' => 'presentation_deck',
            'target_id' => $deck->id,
            'description' => "Membuka PDF presentasi {$deck->title}.",
            'metadata' => [
                'module_id' => $deck->module_id,
                'file_name' => $deck->finalPdfName(),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1000),
        ]);
    }

    private function xorPdfChunk(string $chunk, int $offset = 0): string
    {
        $key = 'japanlingo-pdf-viewer';
        $keyLength = strlen($key);
        $length = strlen($chunk);
        $encoded = '';

        for ($index = 0; $index < $length; $index++) {
            $encoded .= $chunk[$index] ^ $key[($offset + $index) % $keyLength];
        }

        return $encoded;
    }
}
