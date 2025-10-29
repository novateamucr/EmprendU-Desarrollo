<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Drop tables in the correct order to avoid foreign key constraint issues
        if (Schema::hasTable('order_item_options')) {
            Schema::drop('order_item_options');
        }
        if (Schema::hasTable('order_items')) {
            Schema::drop('order_items');
        }
        if (Schema::hasTable('orders')) {
            Schema::drop('orders');
        }

        // Create the new orders table
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('customer_name');
            $table->string('customer_phone_8', 8);
            $table->string('customer_email');
            $table->string('status')->default('draft');
            $table->decimal('shipping_total', 10, 2)->default(0);
            $table->decimal('discount_total', 10, 2)->default(0);
            $table->decimal('items_total', 10, 2)->default(0);
            $table->decimal('options_total', 10, 2)->default(0);
            $table->decimal('grand_total', 10, 2)->default(0);
            $table->char('currency', 3)->default('CRC');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('user_id');
            $table->index('entrepreneurship_id');
        });

        // Create order_items table
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('restrict');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('order_id');
            $table->index('product_id');
        });

        // Create order_item_options table
        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->string('option_name');
            $table->string('option_value');
            $table->decimal('price_delta', 10, 2)->default(0);
            
            $table->index('order_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('orders');
        
        // Recreate the original structure if needed
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('entrepreneurship_id')->constrained('entrepreneurships');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('shipping', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->json('shipping_address');
            $table->json('billing_address')->nullable();
            $table->string('payment_method');
            $table->string('payment_status')->default('pending');
            $table->timestamps();
        });
    }
};
