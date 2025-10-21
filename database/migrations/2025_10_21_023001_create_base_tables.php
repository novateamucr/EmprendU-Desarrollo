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
        // Create user_roles table
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Create users table
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->unsignedBigInteger('role');
            $table->string('phone')->nullable();
            $table->string('province')->nullable();
            $table->string('canton')->nullable();
            $table->string('district')->nullable();
            $table->text('address')->nullable();
            $table->boolean('banned')->default(false);
            $table->string('avatar_url')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Create entrepreneurship_categories table
        Schema::create('entrepreneurship_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // Create entrepreneurships table
        Schema::create('entrepreneurships', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->unsignedBigInteger('category');
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        // Create fairs table
        Schema::create('fairs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('location');
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create fair_entrepreneurship pivot table
        Schema::create('fair_entrepreneurship', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fair_id');
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });

        // Create products table
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->text('long_description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create product_options table
        Schema::create('product_options', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_required')->default(false);
            $table->integer('min_selection')->default(1);
            $table->integer('max_selection')->default(1);
            $table->integer('display_order')->default(0);
            $table->unsignedBigInteger('product_id');
            $table->timestamps();
        });

        // Create product_option_values table
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('option_id');
            $table->string('value');
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Create product_custom_forms table
        Schema::create('product_custom_forms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('label');
            $table->string('field_type');
            $table->boolean('is_required')->default(false);
            $table->json('options')->nullable();
            $table->string('placeholder')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Create orders table
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('entrepreneurship_id');
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

        // Create order_items table
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->json('custom_form_responses')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create order_item_options table
        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->string('option_name');
            $table->string('option_value');
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->timestamps();
        });

        // Create entrepreneurship_channels table
        Schema::create('entrepreneurship_channels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->string('type');
            $table->string('value');
            $table->string('display_name')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // Create user_favorites table
        Schema::create('user_favorites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->timestamps();
        });

        // Create reviews table
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('user_favorites');
        Schema::dropIfExists('entrepreneurship_channels');
        Schema::dropIfExists('order_item_options');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('product_custom_forms');
        Schema::dropIfExists('product_option_values');
        Schema::dropIfExists('product_options');
        Schema::dropIfExists('products');
        Schema::dropIfExists('fair_entrepreneurship');
        Schema::dropIfExists('fairs');
        Schema::dropIfExists('entrepreneurships');
        Schema::dropIfExists('entrepreneurship_categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('user_roles');
    }
};
