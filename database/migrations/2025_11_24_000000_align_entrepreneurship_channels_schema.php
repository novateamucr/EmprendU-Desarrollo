<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entrepreneurship_channels', function (Blueprint $table) {
            // Si vienes del esquema viejo (type/value/display_name), agregamos
            // las columnas que usa el modelo/controlador actual.

            if (!Schema::hasColumn('entrepreneurship_channels', 'platform_code')) {
                $table->string('platform_code')->nullable()->after('entrepreneurship_id');
            }

            if (!Schema::hasColumn('entrepreneurship_channels', 'url')) {
                // Si existe 'value' del esquema viejo, dejamos url después para facilitar migraciones futuras
                if (Schema::hasColumn('entrepreneurship_channels', 'value')) {
                    $table->string('url')->nullable()->after('value');
                } else {
                    $table->string('url')->nullable();
                }
            }

            if (!Schema::hasColumn('entrepreneurship_channels', 'handle')) {
                $table->string('handle')->nullable()->after('url');
            }

            if (!Schema::hasColumn('entrepreneurship_channels', 'is_primary')) {
                $table->boolean('is_primary')->default(false);
            }

            if (!Schema::hasColumn('entrepreneurship_channels', 'is_public')) {
                $table->boolean('is_public')->default(true);
            }

            if (!Schema::hasColumn('entrepreneurship_channels', 'display_order')) {
                $table->integer('display_order')->default(0);
            }

            // Soft deletes si no existen aún
            if (!Schema::hasColumn('entrepreneurship_channels', 'deleted_at')) {
                $table->softDeletes();
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
            if (Schema::hasColumn('entrepreneurship_channels', 'handle')) {
                $table->dropColumn('handle');
            }
            if (Schema::hasColumn('entrepreneurship_channels', 'url')) {
                $table->dropColumn('url');
            }
            if (Schema::hasColumn('entrepreneurship_channels', 'platform_code')) {
                $table->dropColumn('platform_code');
            }
            if (Schema::hasColumn('entrepreneurship_channels', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
        });
    }
};
