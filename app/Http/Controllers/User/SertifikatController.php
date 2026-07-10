<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Sertifikat;
use App\Models\LevelPembelajaran;
use App\Services\SertifikatService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SertifikatController extends Controller
{
    protected SertifikatService $certificateService;

    public function __construct(SertifikatService $certificateService)
    {
        $this->certificateService = $certificateService;
    }

    public function index()
    {
        $user = Auth::user();
        $levels = LevelPembelajaran::all();

        $certificatesData = $levels->map(function ($level) use ($user) {
            $certificate = Sertifikat::where('user_id', $user->id)
                ->where('level_id', $level->id)
                ->first();

            $progress = $this->certificateService->getProgressPercentage($user, $level->id);

            if (!$certificate && $progress >= 100) {
                $certificate = $this->certificateService->checkAndIssueCertificate($user, $level->id);
            }

            return [
                'level_id' => $level->id,
                'level_name' => $level->level_name,
                'stage' => $level->stage,
                'progress' => $progress,
                'certificate' => $certificate,
            ];
        });

        return Inertia::render('User/Sertifikat/Sertifikat', [
            'certificates' => $certificatesData,
        ]);
    }

    public function download(Sertifikat $certificate)
    {
        if ($certificate->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('User/Sertifikat/DetailSertifikat', [
            'certificate' => $certificate->load('level'),
            'user' => Auth::user(),
        ]);
    }
}
