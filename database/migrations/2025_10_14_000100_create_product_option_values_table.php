<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('product_option_values')) {
            return; // already exists
        }
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_id')->constrained('product_options')->cascadeOnDelete();
            $table->string('value');
            $table->decimal('price_modifier', 12, 2)->default(0);
            $table->string('image_url')->nullable();
            $table->string('sku_suffix')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->unique(['product_option_id','value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_option_values');
    }
};
