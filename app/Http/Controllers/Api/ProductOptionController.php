<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductOptionRequest;
use App\Http\Requests\UpdateProductOptionRequest;
use App\Http\Resources\ProductOptionResource;
use App\Models\Product;
use App\Models\ProductOption;
// Gate authorization temporarily disabled

class ProductOptionController extends Controller
{
    // Authorization disabled for early release timelines

    public function index(Product $product)
    {
        $options = $product->options()->with('values')->orderBy('display_order')->get();
        return ProductOptionResource::collection($options);
    }

    public function store(StoreProductOptionRequest $request, Product $product)
    {
        $data = $request->validated();
        $data['product_id'] = $product->id;
        $option = ProductOption::create($data);
        return new ProductOptionResource($option->load('values'));
    }

    public function show(Product $product, ProductOption $option)
    {
        abort_if($option->product_id !== $product->id, 404);
        return new ProductOptionResource($option->load('values'));
    }

    public function update(UpdateProductOptionRequest $request, Product $product, ProductOption $option)
    {
        abort_if($option->product_id !== $product->id, 404);
        $option->update($request->validated());
        return new ProductOptionResource($option->load('values'));
    }

    public function destroy(Product $product, ProductOption $option)
    {
        abort_if($option->product_id !== $product->id, 404);
        $option->delete();
        return response()->noContent();
    }
}
