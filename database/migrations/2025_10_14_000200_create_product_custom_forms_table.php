<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('product_custom_forms')) {
            return; // already exists
        }
        Schema::create('product_custom_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('label');
            $table->enum('input_type', ['text','textarea','number','file','boolean','date']);
            $table->boolean('required')->default(false);
            $table->unsignedInteger('max_length')->nullable();
            $table->text('help_text')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_custom_forms');
    }
};
