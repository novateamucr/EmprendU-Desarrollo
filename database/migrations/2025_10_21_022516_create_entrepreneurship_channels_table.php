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
        Schema::create('entrepreneurship_channels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships')->onDelete('cascade');
            $table->string('type'); // e.g., 'whatsapp', 'instagram', 'facebook', 'website', 'phone', 'email'
            $table->string('value'); // The actual value (phone number, URL, email, etc.)
            $table->string('display_name')->nullable(); // Optional display name
            $table->integer('display_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entrepreneurship_channels');
    }
};
