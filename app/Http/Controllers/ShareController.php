<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Entrepreneurship;

class ShareController extends Controller
{
    public function product(Request $request, $id)
    {
        $product = Product::with('entrepreneurship')->findOrFail($id);

        $appUrl = rtrim(config('app.url') ?? env('APP_URL', ''), '/');
        $frontendBase = rtrim(env('FRONTEND_URL', $appUrl), '/');
        $frontendProductPath = "/product/{$product->id}";
        $frontendProductUrl = $frontendBase . $frontendProductPath;

        $title = $product->name ?? '';
        $description = $product->entrepreneurship && $product->entrepreneurship->name
            ? 'Mira esto de ' . $product->entrepreneurship->name
            : '¡Mira esto!';

        // Make image absolute and HTTPS, support storage/CDN
        $image = (string) ($product->image_url ?? '');
        $publicBase = rtrim(env('CDN_URL', $appUrl), '/');
        $imageAbsolute = $image;
        if ($image) {
            if (Str::startsWith($image, ['/storage/'])) {
                $imageAbsolute = $publicBase . '/' . ltrim($image, '/');
            } elseif (!Str::startsWith($image, ['http://', 'https://'])) {
                $imageAbsolute = $publicBase . '/' . ltrim($image, '/');
            }
            // Force HTTPS if starts with http://
            if (Str::startsWith($imageAbsolute, ['http://'])) {
                $imageAbsolute = preg_replace('/^http:\/\//i', 'https://', $imageAbsolute);
            }
        }

        // Share page absolute URL (used as og:url)
        $shareUrl = $request->fullUrl();

        // Detect common crawler User-Agents to avoid redirecting them
        $ua = strtolower($request->userAgent() ?? '');
        $botSignatures = [
            'facebookexternalhit', 'facebot', 'twitterbot', 'whatsapp', 'telegrambot',
            'slackbot', 'linkedinbot', 'pinterest', 'discordbot', 'googlebot'
        ];
        $isBot = false;
        foreach ($botSignatures as $sig) {
            if ($ua !== '' && strpos($ua, $sig) !== false) { $isBot = true; break; }
        }

        $data = [
            'title' => $title,
            'description' => $description,
            'image' => $imageAbsolute ?: '',
            // Use the share URL as og:url to avoid inferred properties on SPA pages
            'url' => $shareUrl,
            'type' => 'product',
            'redirect_url' => $frontendProductUrl,
            'site_name' => 'EmprendU',
            'is_bot' => $isBot,
            'fb_app_id' => env('FB_APP_ID'),
        ];

        return response()->view('share.product', $data, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            // Prevent stale caches in scrapers/CDNs and separate bot/non-bot variants
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Vary' => 'User-Agent',
        ]);
    }

    public function entrepreneurship(Request $request, $id)
    {
        $business = Entrepreneurship::findOrFail($id);

        $appUrl = rtrim(config('app.url') ?? env('APP_URL', ''), '/');
        $frontendBase = rtrim(env('FRONTEND_URL', $appUrl), '/');
        $frontendBusinessPath = "/business/{$business->id}";
        $frontendBusinessUrl = $frontendBase . $frontendBusinessPath;

        $title = $business->name ?? '';
        $description = $business->description ?: '¡Mira este emprendimiento!';

        $image = (string) ($business->image_url ?? '');
        $publicBase = rtrim(env('CDN_URL', $appUrl), '/');
        $imageAbsolute = $image;
        if ($image) {
            if (Str::startsWith($image, ['/storage/'])) {
                $imageAbsolute = $publicBase . '/' . ltrim($image, '/');
            } elseif (!Str::startsWith($image, ['http://', 'https://'])) {
                $imageAbsolute = $publicBase . '/' . ltrim($image, '/');
            }
            if (Str::startsWith($imageAbsolute, ['http://'])) {
                $imageAbsolute = preg_replace('/^http:\/\//i', 'https://', $imageAbsolute);
            }
        }

        $shareUrl = $request->fullUrl();

        $ua = strtolower($request->userAgent() ?? '');
        $botSignatures = [
            'facebookexternalhit', 'facebot', 'twitterbot', 'whatsapp', 'telegrambot',
            'slackbot', 'linkedinbot', 'pinterest', 'discordbot', 'googlebot'
        ];
        $isBot = false;
        foreach ($botSignatures as $sig) {
            if ($ua !== '' && strpos($ua, $sig) !== false) { $isBot = true; break; }
        }

        $data = [
            'title' => $title,
            'description' => $description,
            'image' => $imageAbsolute ?: '',
            'url' => $shareUrl,
            'type' => 'website',
            'redirect_url' => $frontendBusinessUrl,
            'site_name' => 'EmprendU',
            'is_bot' => $isBot,
            'fb_app_id' => env('FB_APP_ID'),
        ];

        return response()->view('share.product', $data, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Vary' => 'User-Agent',
        ]);
    }
}
