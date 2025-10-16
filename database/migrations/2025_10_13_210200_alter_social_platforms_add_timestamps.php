<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // No-op: evitamos alterar la tabla en PG para no provocar errores de transacción.
        // El modelo SocialPlatform tiene $timestamps = false, por lo que no son necesarios.
    }

    public function down(): void
    {
        // No-op
    }
};
