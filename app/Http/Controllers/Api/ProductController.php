<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Entrepreneurship;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 15);
        $q = Product::with('entrepreneurship');

        if ($e = $request->query('entrepreneurship_id')) {
            $q->where('entrepreneurship_id', $e);
        }

        return response()->json($q->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'entrepreneurship_id' => 'required|exists:entrepreneurships,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image_url' => 'nullable|url|max:255',
        ]);

        $product = Product::create($data);
        return response()->json($product->load('entrepreneurship'), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load('entrepreneurship'));
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'entrepreneurship_id' => 'sometimes|required|exists:entrepreneurships,id',
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'image_url' => 'nullable|url|max:255',
        ]);

        $product->update($data);
        return response()->json($product->fresh()->load('entrepreneurship'));
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
