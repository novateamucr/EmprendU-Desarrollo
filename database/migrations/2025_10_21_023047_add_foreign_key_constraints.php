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
        // Add foreign key to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role')->references('id')->on('user_roles');
        });

        // Add foreign keys to entrepreneurships table
        Schema::table('entrepreneurships', function (Blueprint $table) {
            $table->foreign('category')->references('id')->on('entrepreneurship_categories');
            $table->foreign('user_id')->references('id')->on('users');
        });

        // Add foreign key to fairs table
        Schema::table('fairs', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // Add foreign keys to fair_entrepreneurship table
        Schema::table('fair_entrepreneurship', function (Blueprint $table) {
            $table->foreign('fair_id')->references('id')->on('fairs')->onDelete('cascade');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
            $table->unique(['fair_id', 'entrepreneurship_id']);
        });

        // Add foreign keys to products table
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('entrepreneurship_categories')->onDelete('set null');
        });

        // Add foreign key to product_options table
        Schema::table('product_options', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Add foreign key to product_option_values table
        Schema::table('product_option_values', function (Blueprint $table) {
            $table->foreign('option_id')->references('id')->on('product_options')->onDelete('cascade');
        });

        // Add foreign key to product_custom_forms table
        Schema::table('product_custom_forms', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Add foreign keys to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships');
        });

        // Add foreign keys to order_items table
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products');
        });

        // Add foreign key to order_item_options table
        Schema::table('order_item_options', function (Blueprint $table) {
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('cascade');
        });

        // Add foreign key to entrepreneurship_channels table
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
        });

        // Add foreign keys to user_favorites table
        Schema::table('user_favorites', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
            $table->unique(['user_id', 'entrepreneurship_id']);
        });

        // Add foreign keys to reviews table
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships');
            $table->unique(['user_id', 'entrepreneurship_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign keys from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role']);
        });

        // Remove foreign keys from entrepreneurships table
        Schema::table('entrepreneurships', function (Blueprint $table) {
            $table->dropForeign(['category']);
            $table->dropForeign(['user_id']);
        });

        // Remove foreign keys from fairs table
        Schema::table('fairs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        // Remove foreign keys from fair_entrepreneurship table
        Schema::table('fair_entrepreneurship', function (Blueprint $table) {
            $table->dropForeign(['fair_id']);
            $table->dropForeign(['entrepreneurship_id']);
            $table->dropUnique(['fair_id', 'entrepreneurship_id']);
        });

        // Remove foreign keys from products table
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['entrepreneurship_id']);
            $table->dropForeign(['category_id']);
        });

        // Remove foreign keys from product_options table
        Schema::table('product_options', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        // Remove foreign keys from product_option_values table
        Schema::table('product_option_values', function (Blueprint $table) {
            $table->dropForeign(['option_id']);
        });

        // Remove foreign keys from product_custom_forms table
        Schema::table('product_custom_forms', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        // Remove foreign keys from orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['entrepreneurship_id']);
        });

        // Remove foreign keys from order_items table
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropForeign(['product_id']);
        });

        // Remove foreign keys from order_item_options table
        Schema::table('order_item_options', function (Blueprint $table) {
            $table->dropForeign(['order_item_id']);
        });

        // Remove foreign keys from entrepreneurship_channels table
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            $table->dropForeign(['entrepreneurship_id']);
        });

        // Remove foreign keys from user_favorites table
        Schema::table('user_favorites', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['entrepreneurship_id']);
            $table->dropUnique(['user_id', 'entrepreneurship_id']);
        });

        // Remove foreign keys from reviews table
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['entrepreneurship_id']);
            $table->dropUnique(['user_id', 'entrepreneurship_id']);
        });
    }
};
