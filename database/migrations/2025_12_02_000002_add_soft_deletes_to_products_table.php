<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Intentionally left as a no-op. Hard deletes are required,
    // and this migration should not modify the schema.
    public function up(): void {}
    public function down(): void {}
};
