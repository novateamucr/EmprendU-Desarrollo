<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Product;

class PublicShareController extends Controller
{
    /**
     * Return minimal, public product metadata for social previews.
     */
    public function productMeta(Request $request, $id)
    {
        $product = Product::with('entrepreneurship:id,name')
            ->select(['id', 'name', 'image_url', 'entrepreneurship_id'])
            ->findOrFail($id);

        $appUrl = rtrim(config('app.url') ?? env('APP_URL', ''), '/');
        $frontendBase = rtrim(env('FRONTEND_URL', $appUrl), '/');
        $frontendProductPath = "/product/{$product->id}";
        $frontendProductUrl = $frontendBase . $frontendProductPath;

        $title = $product->name ?? '';
        $description = ($product->entrepreneurship && $product->entrepreneurship->name)
            ? 'Mira esto de ' . $product->entrepreneurship->name
            : '¡Mira esto!';

        // Build absolute, HTTPS image URL when possible
        $image = (string) ($product->image_url ?? '');
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

        return response()->json([
            'title' => $title,
            'description' => $description,
            'image' => $imageAbsolute ?: '',
            'url' => $frontendProductUrl,
            'type' => 'product',
            'site_name' => 'EmprendU',
        ]);
    }
}
