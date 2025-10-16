<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('social_platforms')) {
            Schema::create('social_platforms', function (Blueprint $table) {
                $table->string('code')->primary();
                $table->string('label');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('social_platforms');
    }
};
