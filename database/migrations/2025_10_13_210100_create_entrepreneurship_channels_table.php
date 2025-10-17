<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('entrepreneurship_channels')) {
            Schema::create('entrepreneurship_channels', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('entrepreneurship_id');
                $table->string('platform_code');
                $table->string('url')->nullable();
                $table->string('handle')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_public')->default(true);
                $table->integer('display_order')->default(0);
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
                $table->foreign('platform_code')->references('code')->on('social_platforms')->onDelete('restrict');

                // Avoid exact duplicates per entrepreneurship (platform + url) for non-deleted rows
                $table->unique(['entrepreneurship_id', 'platform_code', 'url', 'deleted_at'], 'uniq_entrepreneurship_platform_url');
                $table->index(['entrepreneurship_id', 'display_order']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('entrepreneurship_channels');
    }
};
