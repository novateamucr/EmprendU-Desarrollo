<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('order_item_options')) {
            return; // already exists
        }
        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->cascadeOnDelete();
            // soft refs to product_options and product_option_values
            $table->unsignedBigInteger('product_option_id')->nullable();
            $table->unsignedBigInteger('product_option_value_id')->nullable();
            $table->string('option_name');
            $table->string('option_value')->nullable();
            $table->decimal('price_delta', 12, 2)->default(0);
            $table->timestamps();

            $table->index('product_option_id');
            $table->index('product_option_value_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_options');
    }
};

