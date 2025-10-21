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
        Schema::create('fair_entrepreneurship', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fair_id')->constrained('fairs')->onDelete('cascade');
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships')->onDelete('cascade');
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
            
            // Add unique constraint to prevent duplicate entries
            $table->unique(['fair_id', 'entrepreneurship_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fair_entrepreneurship');
    }
};
