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
    Schema::create('featured_businesses', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('business_id');
        $table->date('date')->unique();
        $table->timestamps();

        $table->foreign('business_id')->references('id')->on('entrepreneurships')->onDelete('cascade');
    });
}

public function down()
{
    Schema::dropIfExists('featured_businesses');
}

};
