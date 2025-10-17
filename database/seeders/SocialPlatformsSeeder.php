<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SocialPlatform;

class SocialPlatformsSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = [
            ['code' => 'whatsapp', 'label' => 'WhatsApp'],
            ['code' => 'instagram', 'label' => 'Instagram'],
            ['code' => 'facebook', 'label' => 'Facebook'],
            ['code' => 'tiktok', 'label' => 'TikTok'],
            ['code' => 'x', 'label' => 'X (Twitter)'],
            ['code' => 'linkedin', 'label' => 'LinkedIn'],
            ['code' => 'youtube', 'label' => 'YouTube'],
            ['code' => 'website', 'label' => 'Website'],
            ['code' => 'email', 'label' => 'Email'],
        ];

        foreach ($platforms as $p) {
            SocialPlatform::updateOrCreate(['code' => $p['code']], ['label' => $p['label']]);
        }
    }
}
