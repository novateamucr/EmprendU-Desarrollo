<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('orders', 'user_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('entrepreneurship_id');
            });
        }
        // ensure index exists
        try {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('user_id', 'ix_orders_user_id');
            });
        } catch (\Throwable $e) { /* ignore */ }

        // Backfill user_id by matching customer_email to users.email (case-insensitive)
        // Works for MySQL/MariaDB
        try {
            DB::statement('UPDATE orders o JOIN users u ON LOWER(u.email) = LOWER(o.customer_email) SET o.user_id = u.id WHERE o.user_id IS NULL');
        } catch (\Throwable $e) {
            // Fallback for PostgreSQL-style syntax (if needed)
            try {
                DB::statement('UPDATE orders o SET user_id = u.id FROM users u WHERE LOWER(u.email) = LOWER(o.customer_email) AND o.user_id IS NULL');
            } catch (\Throwable $e2) {
                // Silent: manual backfill may be needed
            }
        }

        // Attempt to enforce NOT NULL if there are no remaining NULLs
        try {
            $remainingNulls = DB::table('orders')->whereNull('user_id')->count();
            if ($remainingNulls === 0) {
                // MySQL
                DB::statement('ALTER TABLE orders MODIFY user_id BIGINT UNSIGNED NOT NULL');
            }
        } catch (\Throwable $e) {
            // ignore if platform doesn't support this without doctrine/dbal
        }

        // Add foreign key (restrict delete)
        try {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('user_id', 'fk_orders_user')->references('id')->on('users')->onDelete('restrict');
            });
        } catch (\Throwable $e) { /* ignore */ }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            try { $table->dropForeign('fk_orders_user'); } catch (\Throwable $e) {}
            try { $table->dropIndex('ix_orders_user_id'); } catch (\Throwable $e) {}
            if (Schema::hasColumn('orders', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });
    }
};
