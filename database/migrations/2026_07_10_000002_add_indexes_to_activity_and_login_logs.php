<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at', 'activity_logs_created_at_index');
        });

        Schema::table('login_histories', function (Blueprint $table) {
            $table->index('logged_in_at', 'login_histories_logged_in_at_index');
            $table->index(['role', 'logged_in_at'], 'login_histories_role_logged_in_at_index');
            $table->index('email', 'login_histories_email_index');
        });
    }

    public function down(): void
    {
        Schema::table('login_histories', function (Blueprint $table) {
            $table->dropIndex('login_histories_email_index');
            $table->dropIndex('login_histories_role_logged_in_at_index');
            $table->dropIndex('login_histories_logged_in_at_index');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_created_at_index');
        });
    }
};
