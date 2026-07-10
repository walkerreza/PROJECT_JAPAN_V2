<?php

use App\Http\Controllers\Admin\AdminPencapaianController;
use App\Http\Controllers\Admin\AdminAnalitikController;
use App\Http\Controllers\Admin\AdminBerandaController;
use App\Http\Controllers\Admin\AdminGamifikasiController;
use App\Http\Controllers\Admin\AdminLevelController;
use App\Http\Controllers\Admin\AdminModulController;
use App\Http\Controllers\Admin\AdminFlashcardController;
use App\Http\Controllers\Admin\AdminPresentasiController;
use App\Http\Controllers\Admin\AdminKuisController;
use App\Http\Controllers\Admin\AdminUnggahController;
use App\Http\Controllers\Admin\AdminPenggunaController;
use App\Http\Controllers\Admin\AdminKosakataController;
use App\Http\Controllers\PengarahDashboardController;
use App\Http\Controllers\HalamanController;
use App\Http\Controllers\User\BerandaController as UserDashboardController;
use App\Http\Controllers\User\PembelajaranController;
use App\Http\Controllers\User\BeritaController;
use App\Http\Controllers\User\ProgresController;
use App\Http\Controllers\User\SertifikatController;
use App\Http\Controllers\User\FlashcardController;
use App\Http\Controllers\User\PapanPeringkatController;
use App\Http\Controllers\SuperAdmin\SuperAdminAktivitasController;
use App\Http\Controllers\SuperAdmin\SuperAdminPengelolaAdminController;
use App\Http\Controllers\SuperAdmin\SuperAdminKontenController;
use App\Http\Controllers\SuperAdmin\SuperAdminBerandaController;
use App\Http\Controllers\SuperAdmin\SuperAdminGamifikasiController;
use App\Http\Controllers\SuperAdmin\SuperAdminKloterController;
use App\Http\Controllers\SuperAdmin\SuperAdminPembayaranController;
use App\Http\Controllers\SuperAdmin\SuperAdminSistemController;
use App\Http\Controllers\SuperAdmin\SuperAdminPenggunaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PembayaranMidtransController;
use Illuminate\Support\Facades\Route;

Route::post('/payments/midtrans/notification', [PembayaranMidtransController::class, 'notification'])->name('payments.midtrans.notification');

// Guest Routes
Route::get('/', [HalamanController::class, 'home'])->name('home');
Route::get('/about', [HalamanController::class, 'about'])->name('about');
Route::get('/pricing', [HalamanController::class, 'pricing'])->name('pricing');
Route::get('/roadmap', [HalamanController::class, 'roadmap'])->name('roadmap');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Profile
    Route::get('/profile', [HalamanController::class, 'userProfile'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/access-keys/redeem', [UserDashboardController::class, 'redeemAccessKey'])->middleware('role:user')->name('profile.access-keys.redeem');
    Route::get('/user/access-status', function (\Illuminate\Http\Request $request, \App\Services\AksesPremiumService $aksesPremium) {
        return response()->json($aksesPremium->statusAkses($request->user()));
    })->middleware('role:user')->name('user.access-status');

    Route::post('/payments/midtrans/checkout', [PembayaranMidtransController::class, 'checkout'])->name('payments.midtrans.checkout');
    Route::post('/payments/midtrans/{transactionCode}/snap', [PembayaranMidtransController::class, 'snap'])->name('payments.midtrans.snap');
    Route::post('/payments/midtrans/{transactionCode}/sync', [PembayaranMidtransController::class, 'sync'])->name('payments.midtrans.sync');
    Route::get('/presentations/{presentationDeck}/pdf', [AdminPresentasiController::class, 'inlinePdf'])->name('presentations.pdf.inline');

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotifikasiController::class, 'index'])->name('notifications.index');
    Route::get('/user/notifications', [\App\Http\Controllers\NotifikasiController::class, 'index'])->name('user.notifications.index');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotifikasiController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotifikasiController::class, 'markAllAsRead'])->name('notifications.readAll');

    Route::get('/dashboard', PengarahDashboardController::class)->name('dashboard');
    // Superadmin Routes
    Route::middleware('role:superadmin')->prefix('superadmin')->name('superadmin.')->group(function () {
        Route::get('/dashboard', SuperAdminBerandaController::class)->name('dashboard');
        Route::get('/users', SuperAdminPenggunaController::class)->name('users');
        Route::patch('/users/{user}/status', [SuperAdminPenggunaController::class, 'updateStatus'])->name('users.status');
        Route::post('/users/{user}/reset-password', [SuperAdminPenggunaController::class, 'resetPassword'])->name('users.reset-password');
        Route::get('/admins', SuperAdminPengelolaAdminController::class)->name('admins');
        Route::post('/admins', [SuperAdminPengelolaAdminController::class, 'store'])->name('admins.store');
        Route::patch('/admins/{user}/status', [SuperAdminPengelolaAdminController::class, 'updateStatus'])->name('admins.status');
        Route::post('/admins/{user}/reset-password', [SuperAdminPengelolaAdminController::class, 'resetPassword'])->name('admins.reset-password');
        Route::get('/content', SuperAdminKontenController::class)->name('content');
        Route::post('/content/news', [SuperAdminKontenController::class, 'store'])->name('content.news.store');
        Route::put('/content/news/{news}', [SuperAdminKontenController::class, 'update'])->name('content.news.update');
        Route::delete('/content/news/{news}', [SuperAdminKontenController::class, 'destroy'])->name('content.news.destroy');
        Route::post('/content/news/editor-images', [SuperAdminKontenController::class, 'storeEditorImage'])->name('content.news.editor-images.store');
        Route::post('/content/news/{news}/attachments', [SuperAdminKontenController::class, 'storeAttachment'])->name('content.news.attachments.store');
        Route::delete('/content/news/{news}/attachments/{attachment}', [SuperAdminKontenController::class, 'destroyAttachment'])->name('content.news.attachments.destroy');
        Route::get('/gamification', SuperAdminGamifikasiController::class)->name('gamification');
        Route::put('/gamification/settings', [SuperAdminGamifikasiController::class, 'updateSettings'])->name('gamification.settings.update');
        Route::post('/gamification/recalculate-achievements', [SuperAdminGamifikasiController::class, 'recalculateAchievements'])->name('gamification.achievements.recalculate');
        Route::get('/kloters', SuperAdminKloterController::class)->name('kloters');
        Route::post('/kloters', [SuperAdminKloterController::class, 'store'])->name('kloters.store');
        Route::put('/kloters/{kloter}', [SuperAdminKloterController::class, 'update'])->name('kloters.update');
        Route::delete('/kloters/{kloter}', [SuperAdminKloterController::class, 'destroy'])->name('kloters.destroy');
        Route::patch('/kloters/{kloter}/archive', [SuperAdminKloterController::class, 'archive'])->name('kloters.archive');
        Route::post('/kloters/{kloter}/users', [SuperAdminKloterController::class, 'assignUser'])->name('kloters.users.store');
        Route::delete('/kloters/{kloter}/users/{user}', [SuperAdminKloterController::class, 'removeUser'])->name('kloters.users.destroy');
        Route::post('/kloters/{kloter}/access-keys', [SuperAdminKloterController::class, 'generateAccessKey'])->name('kloters.access-keys.store');
        Route::get('/activity', SuperAdminAktivitasController::class)->name('activity');
        Route::get('/payments', SuperAdminPembayaranController::class)->name('payments');
        Route::post('/payments/plans', [SuperAdminPembayaranController::class, 'storePlan'])->name('payments.plans.store');
        Route::post('/payments/transactions', [SuperAdminPembayaranController::class, 'storeTransaction'])->name('payments.transactions.store');
        Route::patch('/payments/transactions/{transaction}/approve', [SuperAdminPembayaranController::class, 'approve'])->name('payments.transactions.approve');
        Route::patch('/payments/transactions/{transaction}/reject', [SuperAdminPembayaranController::class, 'reject'])->name('payments.transactions.reject');
        Route::post('/payments/access-keys', [SuperAdminPembayaranController::class, 'storeAccessKey'])->name('payments.access-keys.store');
        Route::delete('/payments/access-keys/{accessKey}', [SuperAdminPembayaranController::class, 'revokeAccessKey'])->name('payments.access-keys.revoke');
        Route::redirect('/pricing', '/superadmin/payments');
        Route::get('/system', SuperAdminSistemController::class)->name('system');
        Route::post('/system/theme', [SuperAdminSistemController::class, 'updateTheme'])->name('system.theme.update');
        Route::delete('/system/theme', [SuperAdminSistemController::class, 'resetTheme'])->name('system.theme.reset');
        Route::get('/profile', [HalamanController::class, 'superAdminProfile'])->name('profile');
    });

    // Admin Routes
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminBerandaController::class, 'index'])->name('dashboard');
        Route::get('/users', [AdminPenggunaController::class, 'index'])->name('users');
        Route::get('/users/{user}', [AdminPenggunaController::class, 'show'])->name('users.show');
        Route::get('/analytics', AdminAnalitikController::class)->name('analytics');
        Route::get('/vocabulary', [AdminKosakataController::class, 'index'])->name('vocabulary.index');
        Route::post('/vocabulary', [AdminKosakataController::class, 'store'])->name('vocabulary.store');
        Route::put('/vocabulary/{vocabulary}', [AdminKosakataController::class, 'update'])->name('vocabulary.update');
        Route::delete('/vocabulary/{vocabulary}', [AdminKosakataController::class, 'destroy'])->name('vocabulary.destroy');
        Route::post('/vocabulary/import', [AdminKosakataController::class, 'import'])->name('vocabulary.import');
        Route::get('/vocabulary/template/{format?}', [AdminKosakataController::class, 'template'])->name('vocabulary.template');
        Route::get('/flashcards', [AdminFlashcardController::class, 'index'])->name('flashcards.index');
        Route::post('/flashcards', [AdminFlashcardController::class, 'store'])->name('flashcards.store');
        Route::put('/flashcards/{flashcardSet}', [AdminFlashcardController::class, 'update'])->name('flashcards.update');
        Route::delete('/flashcards/{flashcardSet}', [AdminFlashcardController::class, 'destroy'])->name('flashcards.destroy');
        Route::get('/flashcards/{flashcardSet}/builder', [AdminFlashcardController::class, 'builder'])->name('flashcards.builder');
        Route::post('/flashcards/{flashcardSet}/builder', [AdminFlashcardController::class, 'updateCards'])->name('flashcards.builder.update');
        Route::get('/flashcards/{flashcardSet}/template/{format?}', [AdminFlashcardController::class, 'downloadImportTemplate'])->name('flashcards.template');
        Route::post('/flashcards/{flashcardSet}/import', [AdminFlashcardController::class, 'importCards'])->name('flashcards.import');
        Route::post('/flashcards/{flashcardSet}/generate-quiz', [AdminFlashcardController::class, 'generateQuiz'])->name('flashcards.generate-quiz');
        Route::get('/presentations', [AdminPresentasiController::class, 'index'])->name('presentations.index');
        Route::post('/presentations', [AdminPresentasiController::class, 'store'])->name('presentations.store');
        Route::put('/presentations/{presentationDeck}', [AdminPresentasiController::class, 'update'])->name('presentations.update');
        Route::delete('/presentations/{presentationDeck}', [AdminPresentasiController::class, 'destroy'])->name('presentations.destroy');
        Route::get('/presentations/{presentationDeck}/builder', [AdminPresentasiController::class, 'builder'])->name('presentations.builder');
        Route::post('/presentations/{presentationDeck}/builder', [AdminPresentasiController::class, 'updateSlides'])->name('presentations.builder.update');
        Route::post('/presentations/{presentationDeck}/import/pptx', [AdminPresentasiController::class, 'importPptx'])->name('presentations.import.pptx');
        Route::post('/presentations/{presentationDeck}/import/images', [AdminPresentasiController::class, 'importImages'])->name('presentations.import.images');
        Route::post('/presentations/{presentationDeck}/background-image', [AdminPresentasiController::class, 'uploadBackgroundImage'])->name('presentations.background.upload');
        Route::post('/presentations/{presentationDeck}/slides/{presentationSlide}/jamboard', [AdminPresentasiController::class, 'saveSlideBoard'])->name('presentations.slides.jamboard.save');
        Route::get('/presentations/{presentationDeck}/presenter', [AdminPresentasiController::class, 'presenter'])->name('presentations.presenter');
        Route::redirect('/boards', '/admin/presentations')->name('boards.index');
        Route::get('/gamification', [AdminGamifikasiController::class, 'index'])->name('gamification');
        Route::redirect('/achievements', '/admin/gamification')->name('achievements.index');
        Route::redirect('/subscriptions', '/admin/dashboard')->name('subscriptions.index');
        Route::redirect('/vouchers', '/admin/dashboard')->name('vouchers.index');
        Route::post('/achievements', [AdminPencapaianController::class, 'store'])->name('achievements.store');
        Route::put('/achievements/{achievement}', [AdminPencapaianController::class, 'update'])->name('achievements.update');
        Route::delete('/achievements/{achievement}', [AdminPencapaianController::class, 'destroy'])->name('achievements.destroy');
        Route::get('/quizzes/{quiz}/builder', [AdminKuisController::class, 'builder'])->name('quizzes.builder');
        Route::post('/quizzes/{quiz}/builder', [AdminKuisController::class, 'updateQuestions'])->name('quizzes.builder.update');
        Route::get('/quizzes/{quiz}/questions/template/{format}', [AdminKuisController::class, 'downloadImportTemplate'])->name('quizzes.questions.template');
        Route::post('/quizzes/{quiz}/questions/import/preview', [AdminKuisController::class, 'previewImportQuestions'])->name('quizzes.questions.import.preview');
        Route::post('/quizzes/{quiz}/questions/import', [AdminKuisController::class, 'importQuestions'])->name('quizzes.questions.import');
        Route::post('/quizzes/{quiz}/questions/generate-vocabulary', [AdminKuisController::class, 'generateVocabularyQuestions'])->name('quizzes.questions.generate-vocabulary');

        // LevelPembelajaran CRUD
        Route::apiResource('/levels', AdminLevelController::class)->only(['index', 'store', 'update', 'destroy']);

        // Upload Endpoint
        Route::post('/upload', [AdminUnggahController::class, 'store'])->name('upload');

        // Quizzes CRUD (home/index untuk daftar kuis)
        Route::get('/quizzes', [AdminKuisController::class, 'index'])->name('quizzes.index');
        Route::post('/quizzes', [AdminKuisController::class, 'store'])->name('quizzes.store');
        Route::put('/quizzes/{quiz}', [AdminKuisController::class, 'update'])->name('quizzes.update');
        Route::patch('/quizzes/{quiz}/status', [AdminKuisController::class, 'updateStatus'])->name('quizzes.status');
        Route::delete('/quizzes/{quiz}', [AdminKuisController::class, 'destroy'])->name('quizzes.destroy');

        // Kelas/Program CRUD
        Route::get('/programs', [AdminModulController::class, 'programsIndex'])->name('programs.index');
        Route::post('/programs', [AdminModulController::class, 'storeProgram'])->name('programs.store');
        Route::put('/programs/{program}', [AdminModulController::class, 'updateProgram'])->name('programs.update');
        Route::delete('/programs/{program}', [AdminModulController::class, 'destroyProgram'])->name('programs.destroy');

        // Modul CRUD
        Route::get('/modules', [AdminModulController::class, 'index'])->name('modules.index');
        Route::post('/modules', [AdminModulController::class, 'store'])->name('modules.store');
        Route::get('/modules/{module}/builder', [AdminModulController::class, 'builder'])->name('modules.builder');
        Route::post('/modules/{module}/builder', [AdminModulController::class, 'updateContent'])->name('modules.builder.update');
        Route::put('/modules/{module}', [AdminModulController::class, 'update'])->name('modules.update');
        Route::delete('/modules/{module}', [AdminModulController::class, 'destroy'])->name('modules.destroy');

        // Soal lama diarahkan ke Builder Kuis agar tidak ada dua jalur edit soal.
        Route::get('/questions', fn () => redirect()->route('admin.quizzes.index'))->name('questions.index');
        Route::get('/questions/create', fn () => redirect()->route('admin.quizzes.index'))->name('questions.create');
        Route::get('/questions/{question}/edit', fn (\App\Models\Soal $question) => redirect()->route('admin.quizzes.builder', $question->quiz_id))->name('questions.edit');
        Route::post('/questions', fn () => abort(410, 'Soal dikelola lewat Builder Kuis.'))->name('questions.store');
        Route::put('/questions/{question}', fn () => abort(410, 'Soal dikelola lewat Builder Kuis.'))->name('questions.update');
        Route::delete('/questions/{question}', fn () => abort(410, 'Soal dikelola lewat Builder Kuis.'))->name('questions.destroy');
        Route::post('/questions/reorder', fn () => abort(410, 'Soal dikelola lewat Builder Kuis.'))->name('questions.reorder');
        
        Route::get('/profile', [HalamanController::class, 'adminProfile'])->name('profile');
    });

    // Pengguna Routes
    Route::middleware('role:user')->prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', [UserDashboardController::class, 'index'])->name('dashboard');
        Route::get('/kelas', [HalamanController::class, 'userKelas'])->name('kelas.index');
        Route::get('/checkout/{transactionCode}', [HalamanController::class, 'userCheckout'])->name('checkout');

        // Modul Mingguan
        Route::redirect('/modul', '/user/kelas')->name('modul.index');
        Route::get('/modul/program/{program:slug}', [\App\Http\Controllers\User\ModulController::class, 'program'])->name('modul.program');
        Route::get('/modul/program/{program:slug}/kosakata', [\App\Http\Controllers\User\ModulController::class, 'kosakata'])->name('modul.program.kosakata');
        Route::get('/modul/program/{program:slug}/presentasi', [\App\Http\Controllers\User\ModulController::class, 'presentasi'])->name('modul.program.presentasi');
        Route::get('/modul/{week}', [\App\Http\Controllers\User\ModulController::class, 'lesson'])->name('modul.lesson');
        Route::get('/modul/{week}/quiz', [\App\Http\Controllers\User\ModulController::class, 'quiz'])->name('modul.quiz');
        Route::post('/questions/{question}/check', [\App\Http\Controllers\User\ModulController::class, 'checkQuestion'])->name('questions.check');
        Route::post('/access-keys/redeem', [UserDashboardController::class, 'redeemAccessKey'])->name('access-keys.redeem');
        Route::get('/news', [BeritaController::class, 'index'])->name('news.index');
        Route::get('/news/{news}', [BeritaController::class, 'show'])->name('news.show');
        
        Route::get('/quizzes', [PembelajaranController::class, 'quizLobby'])->name('quizzes.index');
        Route::get('/quizzes/{quiz}', [PembelajaranController::class, 'showQuiz'])->name('quizzes.show');
        Route::get('/flashcards/{flashcardSet}', [FlashcardController::class, 'show'])->name('flashcards.show');
        Route::post('/flashcards/review/{flashcard}', [FlashcardController::class, 'review'])->name('flashcards.review');
        
        Route::get('/leaderboard', PapanPeringkatController::class)->name('leaderboard');
        Route::get('/certificates', [SertifikatController::class, 'index'])->name('certificates');
        Route::get('/certificates/{certificate}/download', [SertifikatController::class, 'download'])->name('certificates.download');
        Route::get('/progress', [ProgresController::class, 'index'])->name('progress');
        
        Route::post('/attempts', [ProgresController::class, 'storeAttempt'])->name('attempts.store');
        Route::post('/modules/complete', [ProgresController::class, 'completeModule'])->name('modules.complete');
    });
});

require __DIR__.'/auth.php';
