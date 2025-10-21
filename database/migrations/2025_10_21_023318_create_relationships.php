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
        // Users table relationships
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role')->references('id')->on('user_roles');
        });

        // Entrepreneurships table relationships
        Schema::table('entrepreneurships', function (Blueprint $table) {
            $table->foreign('category')->references('id')->on('entrepreneurship_categories');
            $table->foreign('user_id')->references('id')->on('users');
        });

        // Fairs table relationships
        Schema::table('fairs', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
        });

        // Fair Entrepreneurship pivot table relationships
        Schema::table('fair_entrepreneurship', function (Blueprint $table) {
            $table->foreign('fair_id')->references('id')->on('fairs')->onDelete('cascade');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
            $table->unique(['fair_id', 'entrepreneurship_id']);
        });

        // Products table relationships
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('entrepreneurship_categories')->onDelete('set null');
        });

        // Product Options table relationships
        Schema::table('product_options', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Product Option Values table relationships
        Schema::table('product_option_values', function (Blueprint $table) {
            $table->foreign('option_id')->references('id')->on('product_options')->onDelete('cascade');
        });

        // Product Custom Forms table relationships
        Schema::table('product_custom_forms', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });

        // Orders table relationships
        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships');
        });

        // Order Items table relationships
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products');
        });

        // Order Item Options table relationships
        Schema::table('order_item_options', function (Blueprint $table) {
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('cascade');
        });

        // Entrepreneurship Channels table relationships
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            $table->foreign('entrepreneurship_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys in reverse order
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            $table->dropForeign(['entrepreneurship_id']);
        });

        Schema::table('order_item_options', function (Blueprint $table) {
            $table->dropForeign(['order_item_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropForeign(['product_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['entrepreneurship_id']);
        });

        Schema::table('product_custom_forms', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        Schema::table('product_option_values', function (Blueprint $table) {
            $table->dropForeign(['option_id']);
        });

        Schema::table('product_options', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['entrepreneurship_id']);
            $table->dropForeign(['category_id']);
        });

        Schema::table('fair_entrepreneurship', function (Blueprint $table) {
            $table->dropForeign(['fair_id']);
            $table->dropForeign(['entrepreneurship_id']);
        });

        Schema::table('fairs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('entrepreneurships', function (Blueprint $table) {
            $table->dropForeign(['category']);
            $table->dropForeign(['user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role']);
        });
    }
};
