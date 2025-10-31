<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use App\Models\Product;

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

        $data = [
            'title' => $title,
            'description' => $description,
            'image' => $imageAbsolute ?: '',
            'url' => $frontendProductUrl,
            'type' => 'product',
            'redirect_url' => $frontendProductUrl,
            'site_name' => 'EmprendU',
        ];

        return response()->view('share.product', $data, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
}
