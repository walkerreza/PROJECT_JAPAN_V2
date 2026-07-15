<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicates = DB::table('reward_logs')
            ->select('user_id', 'source_type', 'source_id', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('source_id')
            ->groupBy('user_id', 'source_type', 'source_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            $removedXp = (int) DB::table('reward_logs')
                ->where('user_id', $duplicate->user_id)
                ->where('source_type', $duplicate->source_type)
                ->where('source_id', $duplicate->source_id)
                ->where('id', '!=', $duplicate->keep_id)
                ->sum('xp_amount');

            DB::transaction(function () use ($duplicate, $removedXp) {
                DB::table('reward_logs')
                    ->where('user_id', $duplicate->user_id)
                    ->where('source_type', $duplicate->source_type)
                    ->where('source_id', $duplicate->source_id)
                    ->where('id', '!=', $duplicate->keep_id)
                    ->delete();

                $user = DB::table('users')->lockForUpdate()->find($duplicate->user_id);

                if (! $user) {
                    return;
                }

                $xp = max(0, (int) $user->xp - $removedXp);
                $level = match (true) {
                    $xp >= 1500 => 6,
                    $xp >= 1000 => 5,
                    $xp >= 600 => 4,
                    $xp >= 300 => 3,
                    $xp >= 100 => 2,
                    default => 1,
                };

                DB::table('users')->where('id', $user->id)->update([
                    'xp' => $xp,
                    'level' => $level,
                    'updated_at' => now(),
                ]);
            });
        }

        Schema::table('reward_logs', function (Blueprint $table) {
            $table->unique(['user_id', 'source_type', 'source_id'], 'reward_logs_user_source_unique');
        });
    }

    public function down(): void
    {
        Schema::table('reward_logs', function (Blueprint $table) {
            $table->dropUnique('reward_logs_user_source_unique');
        });
    }
};
