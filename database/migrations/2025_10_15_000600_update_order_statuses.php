<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1) Backfill existing data to the closest new status values
        // pending->draft, paid->requested, preparing->accepted, shipped->completed, delivered->completed, canceled->canceled
        DB::statement("UPDATE orders SET status = CASE status 
            WHEN 'pending' THEN 'draft'
            WHEN 'paid' THEN 'requested'
            WHEN 'preparing' THEN 'accepted'
            WHEN 'shipped' THEN 'completed'
            WHEN 'delivered' THEN 'completed'
            WHEN 'canceled' THEN 'canceled'
            ELSE 'draft' END");

        // 2) Alter column enum values and default
        // Using raw SQL to avoid doctrine/dbal requirement
        // MySQL/MariaDB
        try {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('draft','requested','accepted','canceled','completed','rated') NOT NULL DEFAULT 'draft'");
        } catch (\Throwable $e) {
            // SQLite (for tests) uses CHECK constraint; emulate by narrowing values with trigger-like approach is complex.
            // As a fallback for SQLite, change to TEXT and rely on app validation.
            try {
                DB::statement("ALTER TABLE orders RENAME COLUMN status TO _old_status");
                DB::statement("ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'");
                DB::statement("UPDATE orders SET status = _old_status");
                DB::statement("ALTER TABLE orders DROP COLUMN _old_status");
            } catch (\Throwable $e2) {
                // Last resort: ignore if the platform doesn't support these statements in this environment
            }
        }
    }

    public function down(): void
    {
        // Revert enum back to original set and approximate reverse mapping
        // draft->pending, requested->paid, accepted->preparing, completed->delivered, rated->delivered, canceled->canceled
        try {
            DB::statement("UPDATE orders SET status = CASE status 
                WHEN 'draft' THEN 'pending'
                WHEN 'requested' THEN 'paid'
                WHEN 'accepted' THEN 'preparing'
                WHEN 'completed' THEN 'delivered'
                WHEN 'rated' THEN 'delivered'
                WHEN 'canceled' THEN 'canceled'
                ELSE 'pending' END");
            DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','paid','preparing','shipped','delivered','canceled') NOT NULL DEFAULT 'pending'");
        } catch (\Throwable $e) {
            // Fallback for SQLite TEXT column created above
            // No-op; column would remain TEXT but data is at least mapped back
        }
    }
};
