<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductOptionValueRequest;
use App\Http\Requests\UpdateProductOptionValueRequest;
use App\Http\Resources\ProductOptionValueResource;
use App\Models\Product;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
// Gate authorization temporarily disabled

class ProductOptionValueController extends Controller
{
    // Authorization disabled for early release timelines

    public function index(Product $product, ProductOption $option)
    {
        abort_if($option->product_id !== $product->id, 404);
        $values = $option->values()->orderBy('display_order')->get();
        return ProductOptionValueResource::collection($values);
    }

    public function store(StoreProductOptionValueRequest $request, Product $product, ProductOption $option)
    {
        abort_if($option->product_id !== $product->id, 404);
        $data = $request->validated();
        $data['product_option_id'] = $option->id;
        $value = ProductOptionValue::create($data);
        return new ProductOptionValueResource($value);
    }

    public function show(Product $product, ProductOption $option, ProductOptionValue $value)
    {
        abort_if($option->product_id !== $product->id || $value->product_option_id !== $option->id, 404);
        return new ProductOptionValueResource($value);
    }

    public function update(UpdateProductOptionValueRequest $request, Product $product, ProductOption $option, ProductOptionValue $value)
    {
        abort_if($option->product_id !== $product->id || $value->product_option_id !== $option->id, 404);
        $value->update($request->validated());
        return new ProductOptionValueResource($value);
    }

    public function destroy(Product $product, ProductOption $option, ProductOptionValue $value)
    {
        abort_if($option->product_id !== $product->id || $value->product_option_id !== $option->id, 404);
        $value->delete();
        return response()->noContent();
    }
}
