<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SocialPlatformsSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => 'whatsapp',  'label' => 'WhatsApp'],
            ['code' => 'instagram', 'label' => 'Instagram'],
            ['code' => 'facebook',  'label' => 'Facebook'],
            ['code' => 'linkedin',  'label' => 'LinkedIn'],
            ['code' => 'phone',     'label' => 'Teléfono'],
            ['code' => 'linkhub',   'label' => 'Link en bio'],
            ['code' => 'maps',      'label' => 'Ubicación'],
            ['code' => 'website',   'label' => 'Sitio web'],
            ['code' => 'youtube',   'label' => 'YouTube'],
            ['code' => 'pinterest', 'label' => 'Pinterest'],
            ['code' => 'shop',      'label' => 'Tienda online'],
            ['code' => 'tiktok',    'label' => 'TikTok'],
            ['code' => 'x',         'label' => 'X / Twitter'],
            ['code' => 'email',     'label' => 'Correo'],
            ['code' => 'behance',   'label' => 'Behance'],
        ];

        foreach ($rows as $row) {
            DB::table('social_platforms')->updateOrInsert(
                ['code' => $row['code']],
                ['label' => $row['label']]
            );
        }
    }
}
