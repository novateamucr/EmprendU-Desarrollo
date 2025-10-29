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
        $frontendProductPath = "/product/{$product->id}";
        $frontendProductUrl = $appUrl . $frontendProductPath;

        $title = $product->name ?? '';
        $description = $product->entrepreneurship && $product->entrepreneurship->name
            ? 'Mira esto de ' . $product->entrepreneurship->name
            : '¡Mira esto!';

        $image = (string) ($product->image_url ?? '');
        $imageAbsolute = $image;
        if ($image && !Str::startsWith($image, ['http://', 'https://'])) {
            $imageAbsolute = $appUrl . '/' . ltrim($image, '/');
        }

        return view('share.product', [
            'title' => $title,
            'description' => $description,
            'image' => $imageAbsolute ?: null,
            'url' => $frontendProductUrl,
            'type' => 'product',
            'redirect_url' => $frontendProductUrl,
        ]);
    }
}
