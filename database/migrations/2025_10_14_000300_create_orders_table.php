<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            return; // already exists
        }
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships')->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone_8', 8);
            $table->string('customer_email');
            $table->enum('status', ['pending','paid','preparing','shipped','delivered','canceled'])->default('pending');
            $table->decimal('items_total', 12, 2)->default(0);
            $table->decimal('options_total', 12, 2)->default(0);
            $table->decimal('shipping_total', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('currency', 3)->default('CRC');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

