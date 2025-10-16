<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('product_options')) {
            return; // already exists
        }
        Schema::create('product_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['select','multiselect','text','number','boolean','file']);
            $table->boolean('required')->default(false);
            $table->integer('display_order')->default(0);
            $table->unsignedInteger('min_select')->nullable();
            $table->unsignedInteger('max_select')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_options');
    }
};
