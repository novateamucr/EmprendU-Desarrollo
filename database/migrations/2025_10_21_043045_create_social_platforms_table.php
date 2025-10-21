<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('social_platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->string('base_url');
            $table->timestamps();
            
            // Ensure platform names are unique
            $table->unique('name');
        });
        
        // Create the pivot table for entrepreneurship social platforms
        Schema::create('entrepreneurship_social_platforms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships')->onDelete('cascade');
            $table->foreignId('social_platform_id')->constrained('social_platforms')->onDelete('cascade');
            $table->string('username');
            $table->string('url');
            $table->timestamps();
            
            // Ensure an entrepreneurship can't have the same platform twice
            $table->unique(['entrepreneurship_id', 'social_platform_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entrepreneurship_social_platforms');
        Schema::dropIfExists('social_platforms');
    }
};
