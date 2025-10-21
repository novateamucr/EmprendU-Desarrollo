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
        // User Roles
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Users
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

        // Entrepreneurship Categories
        Schema::create('entrepreneurship_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // Entrepreneurships
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

        // Fairs
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

        // Fair Entrepreneurship Pivot
        Schema::create('fair_entrepreneurship', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fair_id');
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });

        // Products
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

        // Product Options
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

        // Product Option Values
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('option_id');
            $table->string('value');
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // Product Custom Forms
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

        // Orders
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

        // Order Items
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

        // Order Item Options
        Schema::create('order_item_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->string('option_name');
            $table->string('option_value');
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->timestamps();
        });

        // Entrepreneurship Channels
        Schema::create('entrepreneurship_channels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entrepreneurship_id');
            $table->string('channel_type');
            $table->string('channel_url');
            $table->string('channel_username')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'order_item_options',
            'order_items',
            'orders',
            'product_custom_forms',
            'product_option_values',
            'product_options',
            'products',
            'fair_entrepreneurship',
            'fairs',
            'entrepreneurships',
            'entrepreneurship_categories',
            'users',
            'user_roles',
            'entrepreneurship_channels'
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
