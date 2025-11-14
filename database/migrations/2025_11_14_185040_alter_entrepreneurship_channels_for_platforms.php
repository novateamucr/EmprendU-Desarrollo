<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            // 1) handle (para guardar usuario / teléfono / correo, etc.)
            if (!Schema::hasColumn('entrepreneurship_channels', 'handle')) {
                // lo ponemos después de url si existe, si no, lo agrega al final y ya
                if (Schema::hasColumn('entrepreneurship_channels', 'url')) {
                    $table->string('handle')->nullable()->after('url');
                } else {
                    $table->string('handle')->nullable();
                }
            }

            // 2) is_primary (canal destacado)
            if (!Schema::hasColumn('entrepreneurship_channels', 'is_primary')) {
                $table->boolean('is_primary')->default(false);
            }

            // 3) is_public (mostrar / ocultar)
            if (!Schema::hasColumn('entrepreneurship_channels', 'is_public')) {
                $table->boolean('is_public')->default(true);
            }

            // 4) display_order (orden de la lista)
            if (!Schema::hasColumn('entrepreneurship_channels', 'display_order')) {
                $table->integer('display_order')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            if (Schema::hasColumn('entrepreneurship_channels', 'display_order')) {
                $table->dropColumn('display_order');
            }
            if (Schema::hasColumn('entrepreneurship_channels', 'is_public')) {
                $table->dropColumn('is_public');
            }
            if (Schema::hasColumn('entrepreneurship_channels', 'is_primary')) {
                $table->dropColumn('is_primary');
            }
            // si decides que handle es permanente, puedes comentar esto
            if (Schema::hasColumn('entrepreneurship_channels', 'handle')) {
                $table->dropColumn('handle');
            }
        });
    }
};
